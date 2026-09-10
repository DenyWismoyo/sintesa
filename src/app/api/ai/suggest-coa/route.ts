import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import { CoaSuggestionRequestSchema } from '@/types/ai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    // 1. Proteksi Laju Pemanggilan (Rate Limiting)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`coa_${clientIp}`, 60, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas pemanggilan AI tercapai. Silakan coba kembali dalam ${rateLimit.resetInSeconds} detik.`,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    // 2. Validasi Input Payload
    const rawBody = await req.json();
    const parseResult = CoaSuggestionRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format data tidak valid: ' + parseResult.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { invoiceNumber, description, items, paidAmount, availableAccounts } = parseResult.data;

    if (!availableAccounts || availableAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daftar akun COA pendapatan tidak boleh kosong.',
        },
        { status: 400 }
      );
    }

    // Kumpulkan seluruh teks deskripsi untuk analisis
    const itemDescriptions = (items || [])
      .map((it) => `${it.name || ''} ${it.description || ''} (${it.category || ''})`)
      .filter((s) => s.trim().length > 0)
      .join('; ');

    const combinedQuery = `${description || ''} ${itemDescriptions}`.trim() || `Tagihan #${invoiceNumber || 'Baru'}`;

    // Rangkum daftar akun yang tersedia untuk dibaca oleh model
    const accountsContext = availableAccounts
      .map((acc) => `- ID: "${acc.id}" | Kode: "${acc.code}" | Nama: "${acc.name}"`)
      .join('\n');

    // 3. System Prompt Khusus Akuntansi & BAS BLUD Solo Technopark
    const systemPrompt = `Anda adalah Asisten Cerdas Akuntansi BLUD Solo Technopark (Sintesa).
Tugas Anda adalah menganalisis deskripsi tagihan atau rincian transaksi invoice, kemudian mencocokkannya ke salah satu Rekening Pendapatan (Bagan Akun Standar / BAS) yang paling tepat dari daftar akun yang tersedia.

DAFTAR KODE REKENING PENDAPATAN TERSEDIA:
${accountsContext}

ATURAN REKOMENDASI:
1. Pilih HANYA SATU akun yang paling sesuai dari daftar ID yang diberikan.
2. Berikan skor keyakinan (confidence) antara 0.0 hingga 1.0 (angka desimal).
3. Jelaskan alasan singkat dan logis dalam bahasa Indonesia formal akuntansi.
4. Jangan pernah mengarang ID akun baru di luar daftar!

ATURAN OUTPUT (WAJIB FORMAT JSON MURNI):
{
  "suggestedCoaId": "id_akun_terpilih",
  "confidence": 0.95,
  "reasoning": "Alasan singkat pemilihan akun berdasarkan kesesuaian objek transaksi..."
}`;

    const userPrompt = `TRANSAKSI INVOICE:
- Nomor Invoice: ${invoiceNumber || '-'}
- Nilai Tagihan: Rp ${Number(paidAmount || 0).toLocaleString('id-ID')}
- Deskripsi Transaksi: ${combinedQuery}`;

    let result: { suggestedCoaId: string | null; confidence: number; reasoning: string; isFallback?: boolean } = {
      suggestedCoaId: null,
      confidence: 0,
      reasoning: '',
    };

    try {
      // 4. Panggil Clario Deep Reasoning Model (DeepSeek V4 Pro)
      const rawAiText = await callClarioChat({
        model: CLARIO_MODELS.FINANCIAL_PRO,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Suhu sangat rendah untuk determinisme akuntansi
        jsonMode: true,
      });

      const parsed = JSON.parse(rawAiText);
      if (parsed.suggestedCoaId) {
        result = {
          suggestedCoaId: parsed.suggestedCoaId,
          confidence: Number(parsed.confidence) || 0.85,
          reasoning: parsed.reasoning || 'Rekomendasi otomatis berdasarkan kesesuaian kata kunci transaksi.',
          isFallback: false,
        };
      }
    } catch (apiError: any) {
      console.warn('[COA Suggestion AI Fallback Triggered]:', apiError.message);
      // 5. Offline Rule-Based Matcher (Fallback jika API offline/timeout)
      result = performRuleBasedCoaMatch(combinedQuery, availableAccounts);
    }

    // Cari detail akun yang terpilih
    const matchedAccount = availableAccounts.find((a) => a.id === result.suggestedCoaId);

    return NextResponse.json({
      success: true,
      suggestedCoaId: result.suggestedCoaId,
      coaCode: matchedAccount?.code || '',
      coaName: matchedAccount?.name || '',
      confidence: result.confidence,
      reasoning: result.reasoning,
      isFallback: result.isFallback || false,
    });
  } catch (error: any) {
    console.error('[COA Suggestion Error]:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal memproses rekomendasi akun COA.',
      },
      { status: 500 }
    );
  }
}

/**
 * Matcher cerdas berbasis aturan kata kunci untuk offline resilience
 */
function performRuleBasedCoaMatch(
  query: string,
  accounts: Array<{ id: string; code: string; name: string }>
): { suggestedCoaId: string | null; confidence: number; reasoning: string; isFallback: boolean } {
  const qLower = query.toLowerCase();

  const rules: Array<{ keywords: string[]; accountKeywords: string[]; reason: string }> = [
    {
      keywords: ['coworking', 'co-working', 'hot desk', 'hotdesk', 'workstation', 'meja', 'virtual office'],
      accountKeywords: ['coworking', 'co-working', 'kerja', 'kantor'],
      reason: 'Objek transaksi terdeteksi sebagai layanan ruang kerja bersama (coworking space / hotdesk).',
    },
    {
      keywords: ['laboratorium', 'lab', 'mesin', 'cnc', 'pengujian', 'fabrikasi', 'fablab', 'prototype', 'prototyping', '3d print'],
      accountKeywords: ['laboratorium', 'bengkel', 'pengujian', 'mesin', 'fablab', 'prototyping'],
      reason: 'Objek transaksi terdeteksi sebagai jasa pengujian / pemakaian bengkel presisi atau FabLab.',
    },
    {
      keywords: ['pelatihan', 'diklat', 'training', 'vokasi', 'kursus', 'coding', 'las', 'welding', 'bnsp'],
      accountKeywords: ['pelatihan', 'diklat', 'kursus', 'pendidikan', 'vokasi'],
      reason: 'Objek transaksi terdeteksi sebagai program peningkatan kompetensi / pelatihan vokasi.',
    },
    {
      keywords: ['tenant', 'inkubasi', 'startup', 'umkm', 'bagi hasil', 'royalti'],
      accountKeywords: ['inkubasi', 'tenant', 'bagi hasil', 'royalti'],
      reason: 'Objek transaksi terdeteksi sebagai penerimaan dari program pendampingan inkubasi bisnis.',
    },
    {
      keywords: ['auditorium', 'gedung', 'aula', 'hall', 'amphitheater', 'sewa tempat', 'ruangan'],
      accountKeywords: ['sewa', 'gedung', 'auditorium', 'fasilitas'],
      reason: 'Objek transaksi terdeteksi sebagai pemanfaatan aset/ruangan fisik kawasan.',
    },
  ];

  for (const rule of rules) {
    const hasQueryMatch = rule.keywords.some((kw) => qLower.includes(kw));
    if (hasQueryMatch) {
      const matchedAcc = accounts.find((acc) => {
        const accLower = `${acc.code} ${acc.name}`.toLowerCase();
        return rule.accountKeywords.some((akw) => accLower.includes(akw));
      });

      if (matchedAcc) {
        return {
          suggestedCoaId: matchedAcc.id,
          confidence: 0.9,
          reasoning: rule.reason + ' (Dipetakan via Aturan Cerdas BAS)',
          isFallback: true,
        };
      }
    }
  }

  // Default fallback ke akun pertama yang tersedia
  const defaultAcc = accounts[0];
  return {
    suggestedCoaId: defaultAcc ? defaultAcc.id : null,
    confidence: 0.5,
    reasoning: 'Direkomendasikan ke akun pendapatan default karena kata kunci belum spesifik.',
    isFallback: true,
  };
}
