// src/actions/presensi/ai-analisis.ts
"use server";

import { callClarioChat, CLARIO_MODELS } from "@/lib/clario";
import { requireAuth } from "@/lib/presensi/session";
import { StatistikSummary, StatistikPerPegawai } from "@/actions/presensi/statistik";

export interface GeneratePresensiAIAnalysisPayload {
  bulan: number;
  tahun: number;
  namaUnit: string;
  summary: StatistikSummary;
  daftarPegawai: StatistikPerPegawai[];
}

export interface AIAnalysisResult {
  success: boolean;
  modelUsed?: string;
  analysisMarkdown?: string;
  message?: string;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Server Action: Analisis Kinerja & Rekap Presensi ASN Menggunakan Clario AI
 * Model spesialisasi: Reasoning & Analisis Tata Kelola (DeepSeek / GLM Flagship)
 */
export async function generatePresensiAIAnalysisAction(
  payload: GeneratePresensiAIAnalysisPayload
): Promise<AIAnalysisResult> {
  const sessionUser = await requireAuth(["admin", "atasan"]);

  const { bulan, tahun, namaUnit, summary, daftarPegawai } = payload;
  const namaBulanStr = NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`;

  // Ekstrak pegawai teladan (kehadiran tinggi, disiplin, LKH tinggi)
  const sortedPegawai = [...daftarPegawai].sort((a, b) => b.kehadiranPersen - a.kehadiranPersen);
  const teladan = sortedPegawai.slice(0, 3).map(p => 
    `- ${p.nama} (${p.jabatan}): Kehadiran ${p.kehadiranPersen.toFixed(1)}%, LKH ${p.avgPoinLkh.toFixed(1)} Poin (${p.predikatDisiplin})`
  ).join("\n");

  // Ekstrak pegawai perlu perhatian (alpa > 0 atau terlambat tinggi)
  const perluPerhatian = daftarPegawai
    .filter(p => p.alpaCount > 0 || p.terlambatCount >= 3 || p.predikatDisiplin === "Perlu Pembinaan")
    .map(p => 
      `- ${p.nama} (${p.jabatan}): Terlambat ${p.terlambatCount}x, Alpa ${p.alpaCount}x, Kehadiran ${p.kehadiranPersen.toFixed(1)}% [${p.predikatDisiplin}]`
    ).join("\n");

  const promptContent = `
Anda adalah Konsultan Ahli Tata Kelola Kepegawaian & Penilaian Kinerja ASN / BLUD Pemerintah Daerah untuk Kawasan Sains dan Teknologi Solo Technopark (UPTD KST Kota Surakarta).

Berdasarkan data audit kehadiran & kinerja staf untuk periode **${namaBulanStr} ${tahun}** di unit **${namaUnit}**, susun Analisis Audit Eksekutif Resmi yang objektif, berstandar kedinasan, dan konstruktif.

### DATA AGREGAT KAWASAN:
- Total Pegawai Terdaftar: ${summary.totalPegawai} orang
- Rata-rata Tingkat Kehadiran: ${summary.rataRataKehadiranRate.toFixed(1)}% (Target BLUD: ≥ 90.0%)
- Tingkat Disiplin Waktu (Hadir <= 07:30 WIB): ${summary.disiplinWaktuRate.toFixed(1)}% (Target: ≥ 85.0%)
- Rata-rata Poin Kinerja LKH Harian: ${summary.rataRataPoinLkh.toFixed(1)} Poin (Target: ${summary.targetPoinStandar} Poin/Hari - Capaian: ${summary.persentaseTargetLkhTercapai.toFixed(1)}%)
- Total Kehadiran Tepat Waktu: ${summary.totalHadir - summary.totalTerlambat} kejadian
- Total Keterlambatan: ${summary.totalTerlambat} kejadian
- Total Izin / Perjalanan Dinas: ${summary.totalIzinDinas} hari
- Total Cuti Tahunan: ${summary.totalCuti} hari
- Total Izin Sakit: ${summary.totalSakit} hari
- Total Alpa (Tanpa Keterangan): ${summary.totalAlpa} hari

### PEGAWAI DENGAN PERFORMA TERTINGGI:
${teladan || "Seluruh pegawai memenuhi standar rata-rata kawasan."}

### PEGAWAI PERLU PEMBINAAN / ATENSI:
${perluPerhatian || "Tidak ada pegawai dengan pelanggaran disiplin mayor pada periode ini."}

---

SUSUN DOKUMEN DALAM FORMAT MARKDOWN BERIKUT:
# 📑 EXECUTIVE AUDIT REPORT: EVALUASI DISIPLIN & KINERJA PEGAWAI BLUD
**Unit:** ${namaUnit} | **Periode:** ${namaBulanStr} ${tahun} | **Verifikator:** ${sessionUser.nama}

## 1. 🎯 Ringkasan Eksekutif & Tingkat Kepatuhan Regulasi
(Berikan paragraf ringkas 3-4 kalimat mengenai evaluasi umum kawasan dan apakah melampaui target BLUD).

## 2. ⏱️ Analisis Kedisiplinan Waktu & Pola Kehadiran
(Analisis keterlambatan vs hadir on-time, efektivitas sistem geofence, dan dampak terhadap pelayanan operasional kawasan).

## 3. 📝 Evaluasi Akuntabilitas Kinerja Harian (LKH)
(Hubungkan tingkat kehadiran fisik dengan produktivitas pencapaian poin lembar kerja harian ASN).

## 4. ⚠️ Area Risiko & Rekomendasi Pembinaan Kepegawaian
(Sebutkan langkah pembinaan humanis namun tegas sesuai PP 94/2021 tentang Disiplin PNS / Peraturan Walikota Surakarta terkait Pegawai BLUD).

## 5. 💡 Rekomendasi Strategis untuk Manajemen BLUD
(3-4 poin rekomendasi aksi konkret bagi Kepala UPTD / Pejabat Penilai Kinerja).

Gunakan bahasa formal Indonesia kedinasan yang lugas, profesional, berwibawa, dan actionable.
`;

  try {
    const analysis = await callClarioChat({
      model: CLARIO_MODELS.FINANCIAL_PRO, // DeepSeek V4 Pro 0813 (Keunggulan reasoning analitis & laporan presisi)
      messages: [
        {
          role: "system",
          content: "Anda adalah AI Auditor Kepegawaian & Tata Kelola ASN/BLUD berpengalaman tinggi di lingkungan Pemerintah Kota Surakarta.",
        },
        {
          role: "user",
          content: promptContent,
        },
      ],
      temperature: 0.3,
      maxTokens: 3500,
    });

    return {
      success: true,
      modelUsed: CLARIO_MODELS.FINANCIAL_PRO,
      analysisMarkdown: analysis,
    };
  } catch (err: any) {
    console.error("[Clario AI Presensi] Gagal membuat analisis:", err);
    // Fallback ke model FLASH_REASONING jika model utama sibuk
    try {
      const fallbackAnalysis = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING,
        messages: [
          { role: "system", content: "AI Konsultan Kinerja ASN BLUD Solo Technopark." },
          { role: "user", content: promptContent },
        ],
        temperature: 0.3,
        maxTokens: 2500,
      });

      return {
        success: true,
        modelUsed: CLARIO_MODELS.FAST_REASONING,
        analysisMarkdown: fallbackAnalysis,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: "Layanan Clario AI sedang sibuk. Silakan coba kembali beberapa saat lagi.",
      };
    }
  }
}
