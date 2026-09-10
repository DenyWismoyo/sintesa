import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat, type ClarioChatMessage } from '@/lib/clario';
import { searchKnowledge, buildGroundedPrompt, generateOfflineFallback, generateFreeOfflineFallback } from '@/lib/knowledge';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  // Proteksi Rate Limiting (R-037): 15 request per menit per IP
  const clientIp = getClientIp(request);
  const rateResult = checkRateLimit(`ask-ai:${clientIp}`, 15, 60);
  if (!rateResult.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: `Batas laju permintaan AI tercapai. Silakan coba kembali dalam ${rateResult.resetInSeconds} detik.` 
      },
      { 
        status: 429, 
        headers: { 'Retry-After': String(rateResult.resetInSeconds) } 
      }
    );
  }

  let userQuery = '';
  let mode: 'knowledge' | 'free' = 'knowledge';
  let availableVideos: any[] = [];
  let matchedDocs: any[] = [];

  try {
    const body = await request.json();
    userQuery = body.query || '';
    mode = body.mode === 'free' ? 'free' : 'knowledge';
    const history = body.history || [];
    availableVideos = body.availableVideos || [];

    if (!userQuery?.trim()) {
      return NextResponse.json({ success: false, error: 'Pertanyaan kosong.' }, { status: 400 });
    }

    let systemPrompt = '';

    if (mode === 'free') {
      // ==========================================
      // MODE BEBAS (GENERAL AI CHATBOT - TANPA .MD)
      // ==========================================
      systemPrompt = `Kamu adalah "Sintesa AI", Asisten Kecerdasan Buatan Cerdas, Kreatif, dan Terbuka dari Solo Technopark.
Mode: PERCAKAPAN BEBAS (General Open Assistant).
Kepribadian: Sangat ramah, cerdas, kreatif, solutif, komunikatif, dan berwawasan teknologi global.

TUGAS UTAMA:
1. Jawab segala bentuk pertanyaan, diskusi, atau instruksi pengguna secara bebas tanpa batasan dokumen arsip tertentu.
2. Kamu dapat membantu penulisan teks kreatif, ide bisnis/startup umum, analisis teknologi, pemrograman, ilmu pengetahuan, pendidikan, maupun obrolan santai sehari-hari.
3. Berikan jawaban yang terstruktur, bernas, dan mudah dipahami dengan format Markdown (gunakan **tebal**, bullet points, atau kode blok jika relevan).

ATURAN OUTPUT (WAJIB FORMAT JSON MURNI):
{
  "message": "Jawaban komprehensif, cerdas, dan natural dalam format Markdown...",
  "quickActions": []
}`;
    } else {
      // ==========================================
      // MODE ARSIP KAWASAN (GROUNDED RAG DARI .MD)
      // ==========================================
      matchedDocs = searchKnowledge(userQuery, 3);
      const knowledgeContext = buildGroundedPrompt(userQuery, matchedDocs);

      const contentString = availableVideos
        .map(
          (c: any) =>
            `ID: ${c.id} | Judul: ${c.title} | Tipe: ${c.type} | Deskripsi: ${c.description} | Tags: ${c.tags?.join(', ')}`
        )
        .join('\n');

      systemPrompt = `Kamu adalah "Sintesa", Asisten AI dan Pemandu Cerdas Kawasan Solo Technopark (STK).
Mode: ARSIP PENGETAHUAN KAWASAN (Grounded Knowledge).
Kepribadian: Sangat ramah, profesional, visioner, komunikatif, dan berbasis data akurat.

TUGAS UTAMA:
1. Jawab pertanyaan pengguna berdasarkan "KUMPULAN PENGETAHUAN RESMI SOLO TECHNOPARK" di bawah ini.
2. Jika ada informasi tentang fasilitas, sewa ruangan, pelatihan, inkubasi, atau inovasi Krenova, berikan rincian jelas (tarif, alur, kapasitas) yang ada di dokumen.
3. Selalu sebutkan nama dokumen sumber yang kamu jadikan referensi di dalam array "sources".
4. Sediakan 1-3 tombol aksi cepat di "quickActions" untuk memudahkan pengguna membuka halaman terkait di web (contoh: /fasilitas, /program-pelatihan, /curation, /explore).
5. Jika ada video pameran KRENOVA yang relevan dari data video, sertakan ID-nya di "recommendedIds".

${knowledgeContext}

DATA VIDEO KRENOVA:
${contentString || '[Belum ada data video spesifik terdaftar]'}

ATURAN OUTPUT (WAJIB FORMAT JSON MURNI):
{
  "message": "Jawaban lengkap dan ramah dalam format Markdown (gunakan **tebal** untuk penekanan penting)...",
  "sources": ["01-profil-kawasan.md", "02-fasilitas-layanan.md"],
  "quickActions": [
    { "label": "Jelajahi Fasilitas Ruangan", "href": "/fasilitas", "type": "link" }
  ],
  "recommendedIds": []
}`;
    }

    // Format Riwayat Percakapan
    const messages: ClarioChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg: any) => ({
        role: (msg.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.text || '',
      })),
      { role: 'user', content: userQuery },
    ];

    let aiResult: any = null;

    try {
      // Eksekusi Model Clario Fast Chat (GLM-5.3-flash)
      const rawAiText = await callClarioChat({
        model: CLARIO_MODELS.CHAT_FAST,
        messages,
        temperature: mode === 'free' ? 0.7 : 0.3, // Lebih kreatif jika mode bebas
        jsonMode: true,
      });

      try {
        aiResult = JSON.parse(rawAiText);
      } catch {
        const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        } else {
          aiResult = { message: rawAiText };
        }
      }
    } catch (apiError: any) {
      console.warn('[Clario API Fallback Triggered]:', apiError.message);
      if (mode === 'free') {
        aiResult = generateFreeOfflineFallback(userQuery);
      } else {
        aiResult = generateOfflineFallback(userQuery, matchedDocs);
      }
    }

    // Normalisasi Rekomendasi Video (hanya jika mode knowledge)
    let recommendations = [];
    if (mode === 'knowledge' && aiResult.recommendedIds && aiResult.recommendedIds.length > 0) {
      recommendations = availableVideos.filter((v: any) =>
        aiResult.recommendedIds.includes(v.id)
      );
    }

    const defaultSources = mode === 'knowledge' ? matchedDocs.map((m) => m.doc.filename) : [];

    return NextResponse.json({
      success: true,
      mode,
      message: aiResult.message || (mode === 'free' ? 'Halo! Ada yang ingin kita diskusikan?' : 'Halo! Ada yang bisa saya bantu seputar Solo Technopark?'),
      sources: mode === 'free' ? [] : (aiResult.sources || defaultSources),
      quickActions: aiResult.quickActions || (mode === 'free' ? [] : [
        { label: 'Jelajahi Fasilitas', href: '/fasilitas', type: 'link' },
        { label: 'Program Pelatihan', href: '/program-pelatihan', type: 'link' },
      ]),
      recommendations,
    });
  } catch (error: any) {
    console.error('[Ask-AI System Error]:', error.message);

    const safeFallback = mode === 'free' 
      ? generateFreeOfflineFallback(userQuery || 'halo')
      : generateOfflineFallback(userQuery || 'halo', matchedDocs || []);

    return NextResponse.json({
      success: true,
      mode,
      message: safeFallback.message,
      sources: safeFallback.sources,
      quickActions: safeFallback.quickActions,
      recommendations: [],
    });
  }
}