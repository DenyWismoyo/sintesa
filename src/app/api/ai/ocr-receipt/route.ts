import { NextRequest, NextResponse } from 'next/server';
import { callClarioVision, CLARIO_MODELS } from '@/lib/clario';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Skema validasi request OCR Nota/Kuitansi
const OcrRequestSchema = z.object({
  imageUrl: z.string().min(1, 'URL atau Base64 gambar wajib dilampirkan'),
});

const OCR_PROMPT = `
Anda adalah sistem AI Vision Optical Character Recognition (OCR) spesialisasi pembacaan nota fisik, kuitansi pembayaran, dan bukti pengeluaran akuntansi BLUD (Badan Layanan Umum Daerah) Teknopark.

TUGAS ANDA:
Analisis gambar nota / kuitansi / struk yang dilampirkan dan lakukan ekstraksi data keuangan secara presisi ke dalam format JSON valid.

WAJIB FORMAT OUTPUT (HANYA JSON murni tanpa markdown triple backticks dan tanpa teks pengantar):
{
  "merchantName": "Nama Toko / Vendor / Penyedia",
  "date": "YYYY-MM-DD (jika tahun tidak terbaca, gunakan tahun saat ini)",
  "receiptNumber": "Nomor struk/nota jika ada, atau kosong string",
  "items": [
    {
      "name": "Nama item barang / jasa",
      "quantity": 1,
      "price": 0,
      "total": 0
    }
  ],
  "subTotal": 0,
  "taxAmount": 0,
  "totalAmount": 0,
  "suggestedCategory": "Konsumsi Rapat / ATK & Perlengkapan / Pemeliharaan Fasilitas / Jasa Narasumber / Utilitas & Jaringan / Lain-lain",
  "paymentMethod": "TUNAI / TRANSFER / QRIS / KARTU_DEBIT",
  "confidenceScore": 95,
  "rawNotes": "Catatan ringkas jika ada tulisan tangan atau teks penting yang buram"
}

ATURAN KETAT:
1. Pastikan totalAmount, subTotal, taxAmount berupa tipe angka murni (number), bukan string.
2. Nominal tidak boleh mengandung titik pemisah ribuan atau simbol mata uang (misal: 250000 bukan "Rp 250.000").
3. Jika terdapat diskon atau PPN, perhitungkan dengan akurat sehingga totalAmount sesuai dengan nilai akhir yang tercetak.
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(req);

  // 1. Rate Limiting: 10 request per menit per IP (R-037)
  const rateLimitResult = checkRateLimit(clientIp, 10, 60);

  if (!rateLimitResult.success) {
    logger.warn('AI_OCR_RECEIPT', `Rate limit exceeded for IP: ${clientIp}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Terlalu banyak permintaan OCR nota. Silakan tunggu 1 menit.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetInSeconds),
        },
      }
    );
  }

  try {
    const rawBody = await req.json();
    const parseResult = OcrRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format permintaan tidak valid. Lampirkan imageUrl yang valid.',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { imageUrl } = parseResult.data;

    // 2. Eksekusi Clario Vision OCR via model Qwen3 VL 235B
    const ocrRawResponse = await callClarioVision({
      model: CLARIO_MODELS.VISION_OCR,
      imageUrl,
      prompt: OCR_PROMPT,
      temperature: 0.1,
      jsonMode: true,
    });

    // 3. Parsing JSON dari respon model AI
    let parsedData;
    try {
      const cleanJsonString = ocrRawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      parsedData = JSON.parse(cleanJsonString);
    } catch {
      // Regex fallback extraction jika model mengembalikan teks campuran
      const jsonMatch = ocrRawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gagal mengekstrak struktur data JSON dari nota.');
      }
    }

    const durationMs = Date.now() - startTime;
    logger.aiMetric(CLARIO_MODELS.VISION_OCR, 'RECEIPT_OCR', durationMs, true, {
      totalAmount: parsedData.totalAmount,
      merchant: parsedData.merchantName,
    });

    return NextResponse.json({
      success: true,
      data: parsedData,
      processingTimeMs: durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error('AI_OCR_RECEIPT', 'Gagal memproses OCR nota fisik', error);
    logger.aiMetric(CLARIO_MODELS.VISION_OCR, 'RECEIPT_OCR', durationMs, false, {
      error: error?.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal memproses pembacaan nota dengan AI Vision.',
      },
      { status: 500 }
    );
  }
}
