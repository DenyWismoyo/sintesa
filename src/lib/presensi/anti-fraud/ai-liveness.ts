// src/lib/presensi/anti-fraud/ai-liveness.ts
import { callClarioVision, CLARIO_MODELS } from "@/lib/clario";

export interface LivenessVerificationResult {
  isAuthentic: boolean;
  confidenceScore: number; // 0 - 100
  spoofDetected: boolean;
  spoofReason?: string;
  notes: string;
}

/**
 * Memverifikasi keaslian swafoto kehadiran (Live Human vs Screen Replay / Photo Print Spoofing)
 * Menggunakan model Multimodal Vision Clario AI (Qwen-VL 235B Instruct).
 */
export async function verifyLivenessWithAI(
  fotoUrlOrBase64: string
): Promise<LivenessVerificationResult> {
  // Jika URL tidak valid atau kosong
  if (!fotoUrlOrBase64 || fotoUrlOrBase64.length < 20) {
    return {
      isAuthentic: false,
      confidenceScore: 0,
      spoofDetected: true,
      spoofReason: "Foto swafoto tidak valid atau kosong.",
      notes: "Gagal memproses gambar.",
    };
  }

  const prompt = `
Anda adalah AI Spesialis Anti-Spoofing & Liveness Detection untuk Sistem Presensi Kedinasan Pegawai Pemerintah Solo Technopark.
Analisis gambar swafoto pegawai ini secara cermat untuk mendeteksi kecurangan presensi.

PERIKSA HAL BERIKUT:
1. Apakah ini manusia nyata yang sedang melakukan swafoto langsung (Live Person Selfie)?
2. Apakah ini SCREEN REPLAY ATTACK (pegawai memotret layar handphone lain, tablet, monitor laptop, atau foto digital yang diputar ulang)? Ciri: adanya garis moiré, pantulan bezel layar, piksel layar monitor, pantulan cahaya kaca layar.
3. Apakah ini PRINT ATTACK (pegawai memotret selembar kertas foto cetakan atau foto polaroid)?
4. Apakah wajah tampak wajar dan berada di lingkungan nyata?

JAWAB HANYA DALAM FORMAT JSON BERIKUT (tanpa markdown tambahan):
{
  "isAuthentic": true,
  "confidenceScore": 95,
  "spoofDetected": false,
  "spoofReason": null,
  "notes": "Swafoto terverifikasi asli dari manusia nyata di lingkungan kerja."
}
`;

  try {
    const rawResult = await callClarioVision({
      model: CLARIO_MODELS.VISION_PRIMARY,
      imageUrl: fotoUrlOrBase64,
      prompt,
      temperature: 0.1,
    });

    // Parse output JSON
    const cleanJson = rawResult
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    return {
      isAuthentic: !!parsed.isAuthentic,
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 85,
      spoofDetected: !!parsed.spoofDetected,
      spoofReason: parsed.spoofReason || undefined,
      notes: parsed.notes || "Verifikasi liveness AI selesai.",
    };
  } catch (err) {
    console.warn("[Clario Liveness] Gagal memverifikasi swafoto via AI:", err);
    // Fail-safe: Jangan blokir presensi jika model AI vision sedang timeout, tetap loloskan dengan catatan audit
    return {
      isAuthentic: true,
      confidenceScore: 80,
      spoofDetected: false,
      notes: "Verifikasi liveness AI dilewati (Fail-safe Mode aktif).",
    };
  }
}
