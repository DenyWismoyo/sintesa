// Lokasi file: src/app/api/curation-ai/route.ts
// Multi-Stage Clario AI Pipeline untuk Sintesa Universal AI Curation & Assessment Engine

import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat, callClarioVision } from '@/lib/clario';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { AIResult, CurationDomain, AiPromptConfig, FormStep } from '@/types/curation.types';

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  // Proteksi Rate Limiting (R-037): 15 request per menit per IP
  const rateResult = checkRateLimit(`curation-ai:${clientIp}`, 15, 60);
  if (!rateResult.success) {
    return NextResponse.json(
      { error: `Batas laju kurasi AI tercapai. Silakan coba kembali dalam ${rateResult.resetInSeconds} detik.` },
      { status: 429, headers: { 'Retry-After': String(rateResult.resetInSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'evaluate';

    // ==========================================
    // ACTION 1: MICRO-SIMULATOR (3 DETIK BEDAH IDE)
    // ==========================================
    if (action === 'micro-simulate') {
      const idea = body.idea || body.prompt || '';
      if (!idea || idea.trim().length < 3) {
        return NextResponse.json({ success: false, error: 'Deskripsi ide terlalu singkat.' }, { status: 400 });
      }

      const prompt = `Anda adalah Analis Bisnis & Inovasi Senior di Solo Technopark.
Analisis ide/inisiatif berikut dalam 3 detik:
"${idea}"

Berikan evaluasi objektif dan kembalikan HANYA format JSON murni:
{
  "kekuatan": "1-2 kalimat keunggulan utama ide ini",
  "kelemahan": "1-2 kalimat blind spot atau tantangan kritis yang harus diwaspadai",
  "skor": number (0-100)
}`;

      const rawAi = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        jsonMode: true,
      });

      const parsed = JSON.parse(rawAi.replace(/```(json)?/gi, '').trim());
      return NextResponse.json({ success: true, data: parsed });
    }

    // ==========================================
    // ACTION 2: AI TEMPLATE ARCHITECT (AUTO-BUILD INSTRUMEN)
    // ==========================================
    if (action === 'generate-template') {
      const { trackName, specificTargetContext, methodologyContext, instruction } = body;
      const prompt = `Anda adalah Chief Assessment Architect Solo Technopark.
Rancanglah instrumen kurasi/asesmen profesional untuk program: "${trackName}".
Target Profil Peserta: ${specificTargetContext || 'UMKM / Startup / Alumni Pelatihan / Inovator'}
Metodologi/Standar Acuan: ${methodologyContext || 'Standar Mutu Nasional & Kompetensi Kerja'}
Instruksi Khusus Admin: ${instruction || 'Rancang 3 langkah interogasi logis dengan pertanyaan berbobot.'}

Kembalikan HANYA JSON murni dengan struktur:
{
  "aiPromptConfig": {
    "aiPersona": "Nama persona penilai",
    "assessmentGoal": "Tujuan asesmen",
    "gradingStrictness": "standard",
    "reportTone": "consultative",
    "targetAudience": "umkm",
    "expectedMetrics": ["Metrik 1", "Metrik 2", "Metrik 3", "Metrik 4", "Metrik 5", "Metrik 6"],
    "expectedAnalysisBlocks": ["Blok 1", "Blok 2", "Blok 3"],
    "expectedRecommendations": ["Rekomendasi 1", "Rekomendasi 2", "Rekomendasi 3"],
    "customReadinessTiers": ["Tahap 1 (0-49)", "Tahap 2 (50-74)", "Tahap 3 (75-100)"],
    "customScoringRubric": "Rubrik penilaian objektif"
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Judul Langkah",
      "description": "Deskripsi",
      "fields": [
        {
          "id": "field_id",
          "label": "Pertanyaan",
          "type": "text | textarea | number | radio | select | file",
          "required": true,
          "gridSpan": 2,
          "weightMultiplier": 1,
          "placeholder": "Contoh jawaban cerdas"
        }
      ]
    }
  ]
}`;

      const rawAi = await callClarioChat({
        model: CLARIO_MODELS.FINANCIAL_PRO,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        jsonMode: true,
      });

      const parsed = JSON.parse(rawAi.replace(/```(json)?/gi, '').trim());
      return NextResponse.json({ success: true, template: parsed });
    }

    // ==========================================
    // ACTION 3: COPILOT CONTEXTUAL CHAT
    // ==========================================
    if (action === 'copilot-chat') {
      const { userMessage, assessmentContext, history = [] } = body;
      const systemPrompt = `Anda adalah Omnifit Curation Copilot di Solo Technopark.
Anda mendampingi peserta yang baru saja menyelesaikan kurasi/asesmen.
Konteks Asesmen Peserta:
- Subjek: ${assessmentContext?.subjekName || 'Peserta'}
- Skor Total: ${assessmentContext?.score || 0}/100
- Level Kesiapan: ${assessmentContext?.readinessLevel || 'N/A'}
- Ringkasan Eksekutif: ${assessmentContext?.aiResult?.executiveSummary || ''}

Bicaralah secara ramah, solutif, membesarkan hati, dan fokus pada eksekusi Action Plan nyata. Jawab singkat padat (maksimal 3 paragraf).`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((m: any) => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.text || m.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const reply = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING,
        messages,
        temperature: 0.4,
      });

      return NextResponse.json({ success: true, reply });
    }

    // ==========================================
    // ACTION 4: FULL MULTI-STAGE EVALUATION (DEFAULT)
    // ==========================================
    const { formData, trackType, curationDomain, aiPromptConfig, fileDataUris = [] } = body;

    // Persiapan teks data input
    const cleanEntries = Object.entries(formData || {})
      .filter(([k]) => !['pitchDeckFile', 'legalitasFile', 'fotoProdukFile', 'fileSertifikat'].includes(k))
      .map(([k, v]) => `- [${k}]: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');

    // 1. STAGE 1: Visual & Document Forensics (jika ada fileDataUris base64)
    let fileFindings = {
      documentQuality: 'Tidak ada dokumen digital diunggah atau file dievaluasi manual oleh kurator.',
      keyFindingsFromFiles: [] as string[],
      discrepancies: '',
    };

    if (fileDataUris && fileDataUris.length > 0) {
      try {
        const visionPrompt = `Anda adalah Forensic Document & Product Inspector Solo Technopark.
Periksa bukti foto/dokumen berikut dan bandingkan dengan klaim tertulis berikut:
${cleanEntries}

Kembalikan HANYA JSON:
{
  "documentQuality": "Ulasan kualitas visual kemasan/dokumen",
  "keyFindingsFromFiles": ["Poin temuan visual 1", "Poin temuan visual 2"],
  "discrepancies": "Kesesuaian atau ketidakcocokan klaim dengan foto"
}`;

        const rawVision = await callClarioVision({
          model: CLARIO_MODELS.VISION_PRIMARY,
          prompt: visionPrompt,
          imageUrl: fileDataUris[0],
          temperature: 0.1,
          jsonMode: true,
        });

        fileFindings = JSON.parse(rawVision.replace(/```(json)?/gi, '').trim());
      } catch (visErr) {
        console.warn('[Curation AI] Vision fallback:', visErr);
      }
    }

    // 2. STAGE 2 & 3: Master Triangulator & Tactical Planning
    const expectedMetrics = aiPromptConfig?.expectedMetrics?.length > 0
      ? aiPromptConfig.expectedMetrics
      : ['Kualitas Produk & Layanan', 'Kapasitas Operasional', 'Legalitas & Regulasi', 'Potensi Pasar', 'Kesiapan Finansial'];

    const expectedRecs = aiPromptConfig?.expectedRecommendations?.length > 0
      ? aiPromptConfig.expectedRecommendations
      : ['Penyempurnaan Standar Teknis', 'Strategi Akselerasi Pasar', 'Mitigasi Risiko Utama'];

    const targetAudience = aiPromptConfig?.targetAudience || 'umkm';
    const gradingStrictness = aiPromptConfig?.gradingStrictness || 'standard';

    const systemPrompt = `Anda adalah Chief Triangulator & Master Evaluator Solo Technopark.
Domain Kurasi: ${curationDomain || 'PRODUCT_CURATION'}
Kategori Program: ${trackType || 'Asesmen Bisnis'}
Persona Anda: ${aiPromptConfig?.aiPersona || 'Senior Lead Auditor'}
Gaya Bahasa: ${aiPromptConfig?.reportTone || 'consultative'}
Keketatan Penilaian: ${gradingStrictness} (Lakukan verifikasi kritis terhadap klaim yang tidak berdasar).

DAFTAR METRIK RADAR WAJIB (${expectedMetrics.length} Item - WAJIB ADA SEMUA DENGAN SKOR 0-100):
${JSON.stringify(expectedMetrics)}

DAFTAR REKOMENDASI STRATEGIS (${expectedRecs.length} Item):
${JSON.stringify(expectedRecs)}

TEMUAN BUKTI FISIK/DOKUMEN DARI INSPEKTOR:
${JSON.stringify(fileFindings)}

Kembalikan HANYA format JSON murni yang valid tanpa awalan markdown:
{
  "totalScore": number (0-100),
  "readinessLevel": "String tingkatan kesiapan",
  "dataConfidenceScore": number (70-98, kurangi jika klaim minim bukti),
  "contradictionsFound": ["Daftar kontradiksi antar jawaban atau bukti jika ada"],
  "incubationRoute": "String rute pendampingan (misal: Pra-Inkubasi / Inkubasi Reguler / Akselerasi Retail / Siap Penempatan)",
  "executiveSummary": "Paragraf ringkasan eksekutif komprehensif hasil kurasi",
  "metrics": [
    {
      "label": "Nama metrik persis seperti di daftar",
      "score": number (0-100),
      "description": "Justifikasi tajam"
    }
  ],
  "swotAnalysis": {
    "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3"],
    "weaknesses": ["Kelemahan 1", "Kelemahan 2"],
    "opportunities": ["Peluang 1", "Peluang 2"],
    "threats": ["Ancaman 1", "Ancaman 2"]
  },
  "riskAssessment": {
    "criticalRisks": ["Risiko operasional/legal utama 1", "Risiko 2"],
    "mitigationStrategies": ["Mitigasi konkret 1", "Mitigasi 2"]
  },
  "recommendations": [
    {
      "title": "Judul rekomendasi persis seperti daftar",
      "content": "Uraian rekomendasi taktis langkah demi langkah"
    }
  ],
  "nextActionSteps": [
    { "timeframe": "Minggu 1-2", "task": "Tindakan quick-win pertama" },
    { "timeframe": "Bulan ke-1", "task": "Tindakan kedua" },
    { "timeframe": "Bulan ke-2", "task": "Tindakan ketiga" }
  ],
  "customActionPlan": [
    {
      "id": "act-1",
      "task": "Tugas prioritas 1",
      "description": "Penjelasan detail cara melakukan",
      "timeframe": "1-2 Minggu",
      "isCompleted": false,
      "contextualTip": "Tips taktis untuk hasil maksimal"
    },
    {
      "id": "act-2",
      "task": "Tugas prioritas 2",
      "description": "Penjelasan detail cara melakukan",
      "timeframe": "1 Bulan",
      "isCompleted": false,
      "contextualTip": "Tips taktis untuk hasil maksimal"
    }
  ]
}`;

    const userPrompt = `DATA PENDAFTARAN / ASESMEN SUBJEK:\n${cleanEntries}`;

    const rawEvaluation = await callClarioChat({
      model: CLARIO_MODELS.FINANCIAL_PRO,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      jsonMode: true,
    });

    let aiResult: AIResult;
    try {
      aiResult = JSON.parse(rawEvaluation.replace(/```(json)?/gi, '').trim());
    } catch {
      const match = rawEvaluation.match(/\{[\s\S]*\}/);
      if (match) {
        aiResult = JSON.parse(match[0]);
      } else {
        throw new Error('Gagal mem-parsing hasil evaluasi kurasi AI.');
      }
    }

    // Gabungkan hasil visual forensics
    aiResult.fileAnalysisInsights = fileFindings;

    return NextResponse.json({
      success: true,
      insights: aiResult,
    });
  } catch (error: any) {
    console.error('[Curation AI Pipeline Error]:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem pada engine kurasi AI.' },
      { status: 500 }
    );
  }
}
