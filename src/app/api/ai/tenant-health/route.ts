import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import { TenantHealthRequestSchema, TenantHealthResponse, TenantHealthRequest } from '@/types/ai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Dynamic rule-based fallback jika seluruh engine AI offline/gagal
function performRuleBasedTenantHealth(input: TenantHealthRequest): Omit<TenantHealthResponse, 'success' | 'isFallback' | 'error'> {
  let financialScore = 55;
  let tractionScore = 50;
  let executionScore = 60;
  let productScore = 65;
  let legalScore = 50;

  // 1. Evaluasi Finansial
  const revList = input.monthlyRevenue || [];
  if (revList.length > 0) {
    const totalRev = revList.reduce((acc, r) => acc + (r.amount || 0), 0);
    const avgRev = totalRev / revList.length;
    if (avgRev > 50_000_000) financialScore += 25;
    else if (avgRev > 15_000_000) financialScore += 15;
    else if (avgRev > 0) financialScore += 5;
  }

  const latestKpi = (input.kpiHistory || [])[0];
  if (latestKpi) {
    if ((latestKpi.runwayMonths || 0) >= 12) financialScore += 15;
    else if ((latestKpi.runwayMonths || 0) <= 3 && (latestKpi.runwayMonths || 0) > 0) financialScore -= 20;

    if ((latestKpi.activeUsers || 0) > 1000) tractionScore += 25;
    else if ((latestKpi.activeUsers || 0) > 100) tractionScore += 15;
  }

  // 2. Evaluasi Traksi & Produk
  if (input.products && input.products.length > 0) {
    productScore += 15;
    tractionScore += 10;
  }

  if (input.pipelineStage === 'Scale-Up') {
    tractionScore += 15;
    executionScore += 15;
  } else if (input.pipelineStage === 'Inkubasi') {
    tractionScore += 10;
    executionScore += 10;
  }

  // 3. Evaluasi Tim & Legalitas
  if (input.teamSize && input.teamSize >= 3) executionScore += 10;
  if (input.legalEntity && input.legalEntity.toLowerCase() !== 'belum ada') {
    legalScore += 35;
    executionScore += 5;
  }

  // Normalisasi skor (0 - 100)
  const normFin = Math.min(Math.max(financialScore, 25), 95);
  const normTrac = Math.min(Math.max(tractionScore, 25), 95);
  const normExec = Math.min(Math.max(executionScore, 30), 95);
  const normProd = Math.min(Math.max(productScore, 30), 95);
  const normLegal = Math.min(Math.max(legalScore, 20), 95);

  const overall = Math.round(normFin * 0.25 + normTrac * 0.25 + normExec * 0.2 + normProd * 0.15 + normLegal * 0.15);

  let status: 'Healthy' | 'Warning' | 'Critical' = 'Warning';
  if (overall >= 75) status = 'Healthy';
  else if (overall < 50) status = 'Critical';

  return {
    healthStatus: status,
    healthScore: overall,
    financialSustainability: normFin,
    marketTraction: normTrac,
    teamExecution: normExec,
    summaryNarrative: `${input.tenantName} berada pada fase ${input.pipelineStage} di segmen ${input.segment}. Bisnis ini menunjukkan kapabilitas eksekusi dasar namun memerlukan perkuatan pada konsistensi arus kas dan kepatuhan perizinan untuk mempercepat penetrasi pasar di kawasan Solo Technopark.`,
    radarMetrics: [
      { label: 'Kelayakan Produk & Inovasi', score: normProd, description: 'Kesiapan fungsi produk dan diferensiasi terhadap kompetitor' },
      { label: 'Keberlanjutan Arus Kas & Runway', score: normFin, description: 'Cadangan modal kerja dan keteraturan omzet operasional' },
      { label: 'Traksi Pasar & Validasi Pengguna', score: normTrac, description: 'Pertumbuhan pengguna aktif dan penerimaan pasar' },
      { label: 'Kapabilitas Eksekusi Tim', score: normExec, description: 'Kapasitas dan kedisiplinan tim dalam menyelesaikan milestone' },
      { label: 'Kesiapan Legalitas & Tata Kelola', score: normLegal, description: 'Kelengkapan badan usaha, perizinan, dan hak kekayaan intelektual' }
    ],
    swot: {
      strengths: [
        `Fokus model bisnis di segmen ${input.segment} dengan tim operasional ${input.teamSize} orang.`,
        input.legalEntity && input.legalEntity.toLowerCase() !== 'belum ada'
          ? `Badan hukum resmi (${input.legalEntity}) sudah tercatat.`
          : `Kecepatan adaptasi pada fase ${input.pipelineStage}.`,
        revList.length > 0 ? 'Sudah memiliki aliran omzet transaksi riil.' : 'Struktur biaya awal yang ramping.'
      ],
      weaknesses: [
        (latestKpi?.runwayMonths || 0) <= 6 ? 'Cadangan runway operasional terbatas (perlu penguatan modal kerja).' : 'Ketergantungan pada kanal penjualan tunggal.',
        input.legalEntity?.toLowerCase() === 'belum ada' ? 'Belum memiliki badan usaha resmi untuk kontrak B2B.' : 'Automasi pelaporan KPI dan monitoring berkala belum optimal.'
      ],
      opportunities: [
        'Komersialisasi dan piloting solusi di jejaring mitra industri Solo Technopark.',
        'Akses ke program business matching dan inkubasi lanjutan Pemkot Surakarta.',
        'Sinergi supply-chain dengan sesama tenant binaan di ekosistem Sintesa.'
      ],
      threats: [
        'Kenaikan biaya akuisisi pengguna jika strategi marketing tidak tepat sasaran.',
        'Fluktuasi daya beli pasar lokal dan tekanan kompetitor sejenis.'
      ]
    },
    tacticalRoadmap: [
      {
        timeframe: '30 Hari (Quick-Win)',
        title: 'Stabilisasi Finansial & Legalitas',
        task: 'Lengkapi registrasi legalitas usaha dan petakan ulang struktur pengeluaran bulanan (burn rate).',
        priority: 'High',
        focusArea: 'Tata Kelola & Keuangan'
      },
      {
        timeframe: '90 Hari (Horizon)',
        title: 'Akselerasi Traksi & Validasi',
        task: 'Jalankan kampanye akuisisi pengguna baru dan aktifkan kemitraan dengan 2 klien strategis.',
        priority: 'High',
        focusArea: 'Penjualan & Pemasaran'
      },
      {
        timeframe: '180 Hari (Strategis)',
        title: 'Kesiapan Investasi & Skala',
        task: 'Siapkan pitch deck terevaluasi mentor dan buka penjajakan putaran pendanaan awal.',
        priority: 'Medium',
        focusArea: 'Investasi & Skala'
      }
    ],
    keyStrengths: [
      `Fokus model bisnis di segmen ${input.segment} dengan tim ${input.teamSize} orang.`,
      input.legalEntity && input.legalEntity.toLowerCase() !== 'belum ada' ? `Legalitas (${input.legalEntity}) tercatat.` : 'Fleksibilitas operasional tinggi.',
      revList.length > 0 ? 'Terdapat traksi omzet terdata.' : 'Siap monetisasi produk.'
    ],
    riskFactors: [
      (latestKpi?.runwayMonths || 0) <= 6 ? 'Cadangan runway modal kerja perlu diperpanjang.' : 'Tingkat kompetisi pasar.',
      'Perlu akselerasi pencatatan logbook dan KPI bulanan.'
    ],
    actionableRecommendations: [
      'Tingkatkan retensi pengguna aktif dengan program kemitraan B2B di Solo Technopark.',
      'Optimalkan struktur biaya operasional untuk menjaga kesinambungan runway.',
      'Jadwalkan mentoring intensif dengan mentor bisnis untuk persiapan ekspansi.'
    ],
    analyzedAt: Date.now()
  };
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`health_${clientIp}`, 40, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas pemanggilan AI tercapai. Silakan coba dalam ${rateLimit.resetInSeconds} detik.`
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json();
    const parsed = TenantHealthRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format data tidak valid: ' + parsed.error.issues.map(i => i.message).join(', ')
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 3. Susun Ringkasan Data Nyata Tenant secara Komprehensif
    const revSummary = (input.monthlyRevenue || [])
      .map(r => `${r.month}: Rp ${(r.amount || 0).toLocaleString('id-ID')}`)
      .join(', ') || 'Belum ada data omzet bulanan';

    const kpiSummary = (input.kpiHistory || [])
      .slice(0, 4)
      .map(k => `[${k.quarter || 'Periode'}]: Rev=Rp ${(k.revenue || 0).toLocaleString('id-ID')}, ActiveUsers=${k.activeUsers || 0}, BurnRate=Rp ${(k.burnRate || 0).toLocaleString('id-ID')}/bln, Runway=${k.runwayMonths || 0} bln`)
      .join('\n') || 'Belum ada data KPI formal';

    const productSummary = (input.products || [])
      .map((p: any) => `- ${p.name || 'Produk'} (Kategori: ${p.category || '-'}, Harga: Rp ${(p.price || 0).toLocaleString('id-ID')}, Deskripsi: ${p.description || '-'})`)
      .join('\n') || 'Belum ada katalog produk terdaftar';

    const monevSummary = (input.monevs || [])
      .slice(0, 3)
      .map((m: any) => `- [${m.date || '-'}] ${m.title || 'Monev'}: ${m.description || '-'}`)
      .join('\n') || 'Belum ada catatan monev lapangan';

    const sessionSummary = (input.mentoringSessions || [])
      .slice(0, 3)
      .map((s: any) => `- [${s.date || '-'}] Topik: ${s.topic || '-'} (Mentor: ${s.mentorName || s.mentor || '-'}) | Catatan: ${s.notes || '-'}`)
      .join('\n') || 'Belum ada log konsultasi mentoring';

    const curriculumSummary = input.curriculumProgress
      ? `Selesai ${input.curriculumProgress.completedCount || 0} dari ${input.curriculumProgress.totalCount || 0} modul. (Modul selesai: ${(input.curriculumProgress.completedTitles || []).join(', ') || 'Belum ada'}; Tertunda: ${(input.curriculumProgress.pendingTitles || []).join(', ') || '-'})`
      : 'Kurikulum standar pra-inkubasi';

    const selfAssessStr = input.selfAssessment && Object.keys(input.selfAssessment).length > 0
      ? Object.entries(input.selfAssessment)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('; ')
      : 'Formulir self-assessment standar';

    const isStartup = (input.segment || '').toLowerCase().includes('startup') || (input.segment || '').toLowerCase().includes('tekno');

    // 4. Prompt Engineering Canggih Ala ai-curation-app (Audience & Data Grounded)
    const systemPrompt = `Anda adalah Lead Partner & Auditor Investasi di Kawasan Sains dan Teknologi Solo Technopark (Sintesa).
Tugas Anda adalah melakukan evaluasi kesehatan bisnis (Business Health & Viability Audit) komprehensif terhadap tenant binaan berdasarkan data riil yang terdokumentasi.

PANDUAN PERSPEKTIF ENTITAS:
${isStartup ? `ENTITAS: STARTUP TEKNOLOGI
- Fokus evaluasi: Product-Market Fit (PMF), Tech Moat & Diferensiasi, Scalability, Unit Economics (LTV vs CAC), Monthly Burn Rate, Runway Kas, Pertumbuhan Pengguna MoM, dan Kesiapan Pendanaan (Seed/Series-A).` : `ENTITAS: UMKM / BISNIS KREATIF
- Fokus evaluasi: Kelangsungan Arus Kas (Cash Flow), Efisiensi HPP (COGS), Standar Legalitas & Perizinan (NIB, P-IRT, Halal, BPOM, Sertifikasi), Kualitas Kemasan/Branding, Retensi Pelanggan, Kapasitas Produksi, dan Saluran Pemasaran (Online/Offline).`}

KRITERIA STATUS KESEHATAN:
- "Healthy" (Skor 75 - 100): Fundamental kuat, pendapatan/traksi positif, runway memadai (>= 6 bulan), eksekusi modul lancar.
- "Warning" (Skor 50 - 74): Terdapat traksi dasar namun menghadapi hambatan pada runway, legalitas, saluran penjualan, atau keteraturan laporan.
- "Critical" (Skor 0 - 49): Runway sangat tipis (< 3 bulan), pendapatan stagnan/nol, beban operasional tinggi, belum ada legalitas/produk siap jual.

ATURAN STRUKTUR OUTPUT (WAJIB JSON VALID TANPA MARKDOWN, TANPA PENJELASAN DI LUAR JSON):
{
  "healthStatus": "Healthy" | "Warning" | "Critical",
  "healthScore": 82,
  "financialSustainability": 78,
  "marketTraction": 85,
  "teamExecution": 84,
  "summaryNarrative": "2-3 paragraf ulasan eksekutif mendalam, objektif, menyebutkan data riil tenant (nama, angka omzet, produk, runway, modul kurikulum).",
  "radarMetrics": [
    { "label": "Kelayakan Produk & Inovasi", "score": 85, "description": "Analisis tajam kesiapan produk terhadap target pasar" },
    { "label": "Keberlanjutan Arus Kas & Runway", "score": 75, "description": "Kondisi cadangan kas, burn rate, dan stabilitas omzet" },
    { "label": "Traksi Pasar & Validasi Pengguna", "score": 82, "description": "Daya serap pasar dan tingkat penggunaan produk" },
    { "label": "Kapabilitas Eksekusi Tim", "score": 80, "description": "Komposisi dan konsistensi pencapaian target" },
    { "label": "Kesiapan Legalitas & Tata Kelola", "score": 70, "description": "Status badan usaha, perlindungan HKI, dan perizinan" }
  ],
  "swot": {
    "strengths": ["Kekuatan riil 1 dari data", "Kekuatan riil 2 dari data", "Kekuatan riil 3 dari data"],
    "weaknesses": ["Kelemahan riil 1 dari data", "Kelemahan riil 2 dari data", "Kelemahan riil 3 dari data"],
    "opportunities": ["Peluang spesifik 1 di ekosistem Solo Technopark", "Peluang spesifik 2", "Peluang spesifik 3"],
    "threats": ["Ancaman pasar/kompetisi 1", "Ancaman risiko arus kas 2"]
  },
  "tacticalRoadmap": [
    {
      "timeframe": "30 Hari (Quick-Win)",
      "title": "Judul Aksi Konkret",
      "task": "Rincian tugas taktis mendesak untuk menyelesaikan titik lemah utama.",
      "priority": "High",
      "focusArea": "Area Fokus (misal: Legalitas / Finansial / Produk)"
    },
    {
      "timeframe": "90 Hari (Horizon)",
      "title": "Judul Aksi Pertumbuhan",
      "task": "Rincian tugas untuk ekspansi penjualan dan akuisisi pelanggan.",
      "priority": "High",
      "focusArea": "Pemasaran & Kemitraan"
    },
    {
      "timeframe": "180 Hari (Strategis)",
      "title": "Judul Aksi Skala Bisnis",
      "task": "Rincian langkah menuju pendanaan, skala produksi, atau kemitraan regional.",
      "priority": "Medium",
      "focusArea": "Investasi & Skala"
    }
  ]
}`;

    const userPrompt = `DATA OPERASIONAL & RIIL TENANT:
- Nama Tenant: ${input.tenantName}
- Segmen: ${input.segment}
- Tahap Program: ${input.pipelineStage}
- Tahap Pendanaan: ${input.fundingStage}
- Ukuran Tim: ${input.teamSize} orang
- Bentuk Legalitas: ${input.legalEntity}
- Deskripsi Bisnis: ${input.description || '-'}
- Proposisi Nilai: ${input.valueProposition || '-'}
- Model Bisnis: ${input.businessModel || '-'}

KATALOG PRODUK:
${productSummary}

RIWAYAT OMZET BULANAN:
${revSummary}

RIWAYAT KPI & SURVIVAL METRICS:
${kpiSummary}

PROGRES KURIKULUM INKUBASI:
${curriculumSummary}

CATATAN MONITORING & EVALUASI (MONEV):
${monevSummary}

LOG KONSULTASI MENTORING:
${sessionSummary}

DATA SELF-ASSESSMENT PENDAFTARAN:
${selfAssessStr}

Instruksi: Analisis data di atas dengan cermat. Berikan penilaian tajam, faktual, dan personal untuk ${input.tenantName}. Kembalikan JSON valid sesuai skema yang diminta.`;

    let aiData: Omit<TenantHealthResponse, 'success' | 'isFallback' | 'error'> | null = null;

    try {
      // Panggil 100% Clario Cloud API (DeepSeek V4 Flash / GLM Flash)
      const response = await callClarioChat({
        model: CLARIO_MODELS.FAST_EXTRACTION,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        maxTokens: 1500,
        jsonMode: true
      });


      if (response) {
        let clean = response.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        }
        const parsedJson = JSON.parse(clean);

        // Ekstraksi & Validasi Respons AI (Dijamin 100% Bebas Nilai Undefined)
        const rawRadar = Array.isArray(parsedJson.radarMetrics) && parsedJson.radarMetrics.length > 0
          ? parsedJson.radarMetrics.map((r: any) => ({
              label: String(r.label || 'Dimensi'),
              score: Math.min(Math.max(Math.round(Number(r.score) || 60), 0), 100),
              description: String(r.description || '')
            }))
          : [
              { label: 'Kelayakan Produk & Inovasi', score: 75, description: 'Kesiapan fungsi produk dan diferensiasi terhadap kompetitor' },
              { label: 'Keberlanjutan Arus Kas & Runway', score: 65, description: 'Cadangan modal kerja dan keteraturan omzet operasional' },
              { label: 'Traksi Pasar & Validasi Pengguna', score: 65, description: 'Pertumbuhan pengguna aktif dan penerimaan pasar' },
              { label: 'Kapabilitas Eksekusi Tim', score: 75, description: 'Kapasitas tim dalam menyelesaikan milestone' },
              { label: 'Kesiapan Legalitas & Tata Kelola', score: 70, description: 'Kelengkapan badan usaha, perizinan, dan hak kekayaan intelektual' }
            ];

        const rawSwot = parsedJson.swot && typeof parsedJson.swot === 'object'
          ? {
              strengths: Array.isArray(parsedJson.swot.strengths) && parsedJson.swot.strengths.length > 0 ? parsedJson.swot.strengths : [`Model bisnis di segmen ${input.segment} dengan tim ${input.teamSize} orang.`],
              weaknesses: Array.isArray(parsedJson.swot.weaknesses) && parsedJson.swot.weaknesses.length > 0 ? parsedJson.swot.weaknesses : ['Cadangan runway operasional perlu ditingkatkan.'],
              opportunities: Array.isArray(parsedJson.swot.opportunities) && parsedJson.swot.opportunities.length > 0 ? parsedJson.swot.opportunities : ['Kemitraan dan peluang piloting di kawasan Solo Technopark.'],
              threats: Array.isArray(parsedJson.swot.threats) && parsedJson.swot.threats.length > 0 ? parsedJson.swot.threats : ['Tekanan kompetisi dan fluktuasi daya beli pasar.']
            }
          : {
              strengths: [`Fokus model bisnis segmen ${input.segment} dengan tim ${input.teamSize} orang.`],
              weaknesses: ['Perlu penguatan monitoring modal kerja dan arus kas.'],
              opportunities: ['Akses ke jejaring ekosistem dan fasilitas Solo Technopark.'],
              threats: ['Fluktuasi pasar dan persaingan solusi sejenis.']
            };

        const rawRoadmap = Array.isArray(parsedJson.tacticalRoadmap) && parsedJson.tacticalRoadmap.length > 0
          ? parsedJson.tacticalRoadmap.map((rm: any) => ({
              timeframe: String(rm.timeframe || '30 Hari (Quick-Win)'),
              title: String(rm.title || 'Aksi Taktis'),
              task: String(rm.task || 'Eksekusi rencana perbaikan operasional.'),
              priority: (['High', 'Medium', 'Low'].includes(rm.priority) ? rm.priority : 'High') as 'High' | 'Medium' | 'Low',
              focusArea: String(rm.focusArea || 'Operasional')
            }))
          : [
              { timeframe: '30 Hari (Quick-Win)', title: 'Stabilisasi Finansial', task: 'Petakan ulang struktur burn rate dan efisiensi operasional.', priority: 'High', focusArea: 'Keuangan' },
              { timeframe: '90 Hari (Horizon)', title: 'Akselerasi Penjualan', task: 'Jalankan kampanye akuisisi pelanggan baru dan perkuat kemitraan.', priority: 'High', focusArea: 'Pemasaran' },
              { timeframe: '180 Hari (Strategis)', title: 'Skala Bisnis', task: 'Perluas kemitraan strategis dan kesiapan pendanaan lanjutan.', priority: 'Medium', focusArea: 'Investasi' }
            ];

        aiData = {
          healthStatus: ['Healthy', 'Warning', 'Critical'].includes(parsedJson.healthStatus) ? parsedJson.healthStatus : 'Warning',
          healthScore: typeof parsedJson.healthScore === 'number' ? Math.min(Math.max(Math.round(parsedJson.healthScore), 0), 100) : 72,
          financialSustainability: typeof parsedJson.financialSustainability === 'number' ? Math.min(Math.max(Math.round(parsedJson.financialSustainability), 0), 100) : 70,
          marketTraction: typeof parsedJson.marketTraction === 'number' ? Math.min(Math.max(Math.round(parsedJson.marketTraction), 0), 100) : 70,
          teamExecution: typeof parsedJson.teamExecution === 'number' ? Math.min(Math.max(Math.round(parsedJson.teamExecution), 0), 100) : 75,
          summaryNarrative: typeof parsedJson.summaryNarrative === 'string' && parsedJson.summaryNarrative.length > 10
            ? parsedJson.summaryNarrative
            : `${input.tenantName} berada pada fase ${input.pipelineStage} di segmen ${input.segment}. Bisnis ini menunjukkan kapabilitas eksekusi dasar namun memerlukan perkuatan konsistensi arus kas dan kepatuhan perizinan untuk mempercepat penetrasi pasar di Solo Technopark.`,
          radarMetrics: rawRadar,
          swot: rawSwot,
          tacticalRoadmap: rawRoadmap,
          keyStrengths: rawSwot.strengths.slice(0, 3),
          riskFactors: rawSwot.weaknesses.slice(0, 3),
          actionableRecommendations: rawRoadmap.map((r: any) => r.task),
          analyzedAt: Date.now()
        };
      }
    } catch (aiErr: any) {
      console.warn('[Tenant Health Route]: AI Gateway encounter error, falling back to dynamic rule engine:', aiErr.message);
    }

    if (aiData) {
      return NextResponse.json({
        success: true,
        ...aiData,
        isFallback: false
      });
    }

    // Fallback dinamis jika seluruh jaringan AI offline
    const fallbackData = performRuleBasedTenantHealth(input);
    return NextResponse.json({
      success: true,
      ...fallbackData,
      isFallback: true
    });

  } catch (error: any) {
    console.error('Tenant Health API Fatal Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal melakukan analisis kesehatan tenant'
      },
      { status: 500 }
    );
  }
}

