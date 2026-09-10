import { NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // Proteksi Rate Limiting (R-037): 10 request per menit per IP untuk penilaian kurasi
  const clientIp = getClientIp(req);
  const rateResult = checkRateLimit(`curation-ai:${clientIp}`, 10, 60);
  if (!rateResult.success) {
    return NextResponse.json(
      { 
        error: `Batas laju kurasi AI tercapai. Silakan coba kembali dalam ${rateResult.resetInSeconds} detik.` 
      },
      { 
        status: 429, 
        headers: { 'Retry-After': String(rateResult.resetInSeconds) } 
      }
    );
  }

  try {
    const { formData, trackType } = await req.json();

    const dataString = Object.entries(formData || {})
      .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    let trackContext = '';
    if (trackType === 'Startup') {
      trackContext =
        'Ini adalah Startup Teknologi. Fokus pada inovasi (moat), model bisnis terukur (SaaS/Platform), traksi pengguna, ukuran pasar (TAM/SAM), dan kualitas tim pendiri.';
    } else if (trackType === 'UMKM') {
      trackContext =
        'Ini adalah UMKM Produk Fisik. Fokus pada kualitas produk, kemasan (branding), kapasitas produksi, margin profit, legalitas (NIB, Halal, BPOM), dan potensi ekspansi/ekspor.';
    } else if (trackType === 'Jasa') {
      trackContext =
        'Ini adalah Bisnis Jasa/Agensi. Fokus pada model pendapatan (retainer/project), nilai proyek rata-rata, retensi klien, ukuran tim, dan skalabilitas (SOP/Kapasitas serentak).';
    }

    const systemPrompt = `Anda adalah Kurator Senior dan Analis Investasi di sebuah program inkubasi bisnis elit di Solo Technopark.
Tugas Anda adalah menganalisis formulir pendaftaran dari seorang calon peserta dan memberikan skor kelayakan investasi/inkubasi secara objektif dan matematis.

KONTEKS BISNIS:
${trackContext}

MATRIKS REKOMENDASI INKUBASI:
- Skor 0-59: Readiness Level "Pre-Incubation" / "Dev. Needed". Rute: "Pra-Inkubasi / Bootstrapping".
- Skor 60-74: Readiness Level "Market Ready". Rute: "Inkubasi Reguler".
- Skor 75-100: Readiness Level "Retail Ready" / "Premium Export Ready" / "Scalable". Rute: "Akselerasi / Post-Inkubasi".

ATURAN OUTPUT:
Kembalikan HANYA format JSON murni yang valid tanpa awalan atau akhiran markdown.
{
  "readinessLevel": "String (Sesuai matriks)",
  "totalScore": Number (0-100),
  "scoreBreakdown": {
    "productAndTech": Number (0-100),
    "marketAndFinancial": Number (0-100),
    "legalAndCompliance": Number (0-100)
  },
  "recommendations": {
    "targetMarket": "String",
    "pricingAndMonetization": "String",
    "distributionAndGrowth": "String",
    "productImprovement": "String",
    "investmentReadiness": "String",
    "nextActionSteps": ["String", "String", "String"],
    "incubationRoute": "String"
  }
}`;

    const userPrompt = `DATA PENDAFTARAN PESERTA:\n${dataString}`;

    // Eksekusi menggunakan Clario Fast Reasoning Model (DeepSeek V4 Flash)
    const rawAiText = await callClarioChat({
      model: CLARIO_MODELS.FAST_REASONING,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // Rendah untuk kestabilan evaluasi numerik & skema
      jsonMode: true,
    });

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawAiText);
    } catch {
      // Fallback parser regex
      const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gagal mem-parsing respons evaluasi kurasi AI.');
      }
    }

    return NextResponse.json({
      success: true,
      insights: parsedResult,
    });
  } catch (error: any) {
    console.error('[AI Curation Error]:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Terjadi kesalahan saat memproses kurasi AI.',
      },
      { status: 500 }
    );
  }
}