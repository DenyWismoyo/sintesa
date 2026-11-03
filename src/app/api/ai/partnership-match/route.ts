import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import {
  PartnershipMatchRequestSchema,
  PartnershipMatchResponse,
  PartnershipMatchRequest,
} from '@/types/ai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Dynamic rule-based fallback jika AI offline / tanpa API key
function performRuleBasedPartnershipMatch(
  input: PartnershipMatchRequest
): Omit<PartnershipMatchResponse, 'success' | 'isFallback' | 'error'> {
  let fitScore = 82;
  const isBank =
    input.agencyType === 'BUMN / BUMD' ||
    input.agencyName.toLowerCase().includes('bank') ||
    input.partnershipType === 'FINANCING_TRAINING';

  const isProject =
    input.partnershipType === 'OPEN_PROJECT' ||
    input.subject.toLowerCase().includes('proyek') ||
    input.subject.toLowerCase().includes('jasa');

  if (isBank) fitScore += 8;
  if (isProject) fitScore += 5;

  const schemes = [];
  if (isBank) {
    schemes.push({
      code: 'FINANCING_TRAINING',
      title: 'Penyaluran KUR Vokasi & Cicilan Pendidikan Syariah',
      relevanceScore: 95,
      reasoning: 'Peluang penetrasi pembiayaan lunak kepada ribuan peserta diklat terakreditasi STP dengan risiko gagal bayar rendah.',
    });
    schemes.push({
      code: 'CSR_SCHOLARSHIP',
      title: 'Program Beasiswa Penuh Ikatan Kerja (CSR Venture)',
      relevanceScore: 88,
      reasoning: 'Mengoptimalkan alokasi CSR korporasi untuk pemberdayaan talenta muda Solo Raya.',
    });
  } else {
    schemes.push({
      code: 'OPEN_PROJECT',
      title: 'Industrial Taskforce & Open Project Marketplace',
      relevanceScore: 92,
      reasoning: 'Pendelegasian kebutuhan rekayasa, manufaktur CAD/CAM, IoT, atau keamanan siber ke alumni teruji.',
    });
    schemes.push({
      code: 'TALENT_RECRUITMENT',
      title: 'Priority Hiring & Industrial Talent Pipeline',
      relevanceScore: 90,
      reasoning: 'Akses langsung ke bank talenta lulusan bersertifikasi BNSP dan sertifikasi industri internasional.',
    });
  }

  return {
    analysis: {
      partnershipFitScore: Math.min(fitScore, 98),
      summaryInsight: `Inisiasi kemitraan strategis dari ${input.agencyName} sangat selaras dengan pilar hilirisasi riset terapan dan penyerapan tenaga kerja terampil Solo Technopark.`,
      recommendedSchemes: schemes,
      relevantVocationalPrograms: [
        'Manufaktur CNC 5-Axis Presisi',
        'Akademi Kecerdasan Buatan (AI)',
        'Cyber Security Defense Specialist',
        'Underwater & GTAW Welding',
      ],
      potentialFinancingPartners: [
        'Bank Jateng (Skema KUR Lunak)',
        'Bank Syariah Indonesia (Cicilan 0% Syariah)',
        'Yayasan Astra Bina Ilmu',
        'Pemerintah Kota Surakarta (RSKB)',
      ],
      projectMarketplaceFit: isProject,
      actionPlan: [
        'Jadwalkan rapat teknis penjajakan ruang lingkup (MoU / PKS) dalam 3 hari kerja.',
        'Susun draf Kerangka Acuan Kerja (KAK) bersama tim Divisi Kerjasama STP.',
        'Petakan kuota dan kebutuhan fasilitas laboratorium yang akan digunakan.',
        'Terbitkan dokumen Nota Kesepahaman resmi bertanda tangan Kepala UPT Solo Technopark.',
      ],
      expectedOutcome: `Terjalinnya sinergi komersial yang meningkatkan serapan kerja vokasi dan utilisasi fasilitas riset STP dengan komitmen anggaran terukur.`,
    },
  };
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Protection (15 req/menit per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, 15, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas kuota analisis kemitraan terlampaui. Silakan coba kembali dalam 1 menit.',
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validasi Request
    const body = await req.json();
    const parsed = PartnershipMatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format data pengajuan tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const inputData = parsed.data;

    // 3. Fallback jika CLARIO_API_KEY tidak dikonfigurasi
    if (!process.env.CLARIO_API_KEY) {
      const fallbackResult = performRuleBasedPartnershipMatch(inputData);
      return NextResponse.json({
        success: true,
        isFallback: true,
        ...fallbackResult,
      });
    }

    // 4. Clario AI Prompting (DeepSeek Reasoning / Qwen Flagship)
    const systemPrompt = `Anda adalah Direktur Eksekutif Kemitraan Strategis & Perbankan UPT Solo Technopark (Pemerintah Kota Surakarta).
Tugas Anda adalah menganalisis permohonan kemitraan dari institusi/perusahaan/perbankan dan memberikan rekomendasi strategis integrasi ekosistem dua arah.

SOLO TECHNOPARK MEMILIKI FASILITAS:
1. Finansial & Perbankan: Skema KUR Pelatihan Vokasi (Bank Jateng), Cicilan 0% Syariah (BSI), Beasiswa CSR Industri, Voucher RSKB Surakarta.
2. Open Project Marketplace: Peluang proyek rekayasa industri yang dikerjakan alumni tersertifikasi.
3. Lab Riset & Produksi: CNC 5-Axis Presisi DMG MORI, Pengelasan Bawah Air (Underwater Welding), Simulator Otomasi ABB/Schneider, Cyber Range Defense Lab.
4. Talenta & Loker: Penyerapan langsung ribuan lulusan teruji kompetensi BNSP.

WAJIB MERESPON DALAM JSON DENGAN STRUKTUR BERIKUT:
{
  "partnershipFitScore": number (0-100),
  "summaryInsight": string (analisis padat mengapa kemitraan ini strategis),
  "recommendedSchemes": [
    {
      "code": "FINANCING_TRAINING" | "OPEN_PROJECT" | "TALENT_RECRUITMENT" | "LAB_MANUFACTURING" | "STARTUP_INCUBATION",
      "title": string,
      "relevanceScore": number,
      "reasoning": string
    }
  ],
  "relevantVocationalPrograms": string[],
  "potentialFinancingPartners": string[],
  "projectMarketplaceFit": boolean,
  "actionPlan": string[],
  "expectedOutcome": string
}`;

    const userPrompt = `Calon Mitra:
- Nama Instansi: ${inputData.agencyName} (${inputData.agencyType})
- Pilihan Jalur: ${inputData.partnershipType}
- Perihal: ${inputData.subject}
- Ringkasan Proposal / TOR: ${inputData.proposalSummary}
- Estimasi Peserta: ${inputData.targetParticipants || 'Fleksibel'}
- Estimasi Budget: ${inputData.estimatedBudget ? 'Rp ' + inputData.estimatedBudget.toLocaleString('id-ID') : 'Negosiasi'}`;

    try {
      const aiResponse = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        jsonMode: true,
      });

      const parsedAI = JSON.parse(aiResponse);
      return NextResponse.json({
        success: true,
        isFallback: false,
        analysis: parsedAI,
      });
    } catch (aiErr) {
      console.warn('[AI_PARTNERSHIP_MATCH] AI error, falling back to rule-based engine:', aiErr);
      const fallbackResult = performRuleBasedPartnershipMatch(inputData);
      return NextResponse.json({
        success: true,
        isFallback: true,
        ...fallbackResult,
      });
    }
  } catch (err: any) {
    console.error('[AI_PARTNERSHIP_MATCH] Fatal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kegagalan server dalam memproses analisis kemitraan: ' + (err.message || ''),
      },
      { status: 500 }
    );
  }
}

