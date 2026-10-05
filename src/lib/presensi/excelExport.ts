// src/lib/presensi/excelExport.ts
import * as XLSX from "xlsx";
import { StatistikPerPegawai, StatistikSummary } from "@/actions/presensi/statistik";

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface ExcelExportOptions {
  bulan: number;
  tahun: number;
  namaUnit?: string;
  summary: StatistikSummary;
  daftarPegawai: StatistikPerPegawai[];
}

/**
 * Mengekspor data rekapitulasi kehadiran bulanan ke berkas Microsoft Excel (.xlsx) resmi BLUD Solo Technopark.
 * Menghasilkan multi-sheet workbook:
 * - Sheet 1: Rekapitulasi Kehadiran & Kinerja ASN
 * - Sheet 2: Ringkasan Eksekutif & KPI Kawasan
 */
export function exportRekapToExcel(options: ExcelExportOptions): void {
  const { bulan, tahun, namaUnit = "Solo Technopark", summary, daftarPegawai } = options;
  const namaBulanStr = NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`;

  // ────────────────────────────────────────────────────────────
  // SHEET 1: REKAPITULASI PEGAWAI INDIVIDUAL
  // ────────────────────────────────────────────────────────────
  const sheet1Data: any[][] = [
    ["PEMERINTAH KOTA SURAKARTA"],
    ["DINAS TENAGA KERJA DAN PERINDUSTRIAN"],
    ["UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK"],
    ["LAPORAN REKAPITULASI KEHADIRAN DAN KINERJA PEGAWAI BLUD"],
    [],
    ["Unit Kerja / Kantor", `: ${namaUnit}`],
    ["Periode Penilaian", `: ${namaBulanStr} ${tahun}`],
    ["Total Hari Kerja Efektif", `: ${daftarPegawai[0]?.totalHariKerja || 20} Hari (Eksklusif Hari Libur Nasional)`],
    ["Waktu Cetak Sistem", `: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`],
    [],
    // Header Tabel
    [
      "No",
      "NIP / Kode Pegawai",
      "Nama Lengkap Pegawai",
      "Jabatan",
      "Golongan / Kategori",
      "Hari Kerja",
      "Hadir Tepat Waktu",
      "Terlambat",
      "Izin",
      "Cuti",
      "Sakit",
      "Alpa (Tanpa Keterangan)",
      "Persentase Kehadiran (%)",
      "Rata-rata Poin LKH",
      "Predikat Disiplin",
    ],
  ];

  // Baris Data Pegawai
  daftarPegawai.forEach((p, idx) => {
    sheet1Data.push([
      idx + 1,
      p.nip,
      p.nama,
      p.jabatan,
      p.golongan,
      p.totalHariKerja,
      p.hadirCount,
      p.terlambatCount,
      p.izinCount,
      p.cutiCount,
      p.sakitCount,
      p.alpaCount,
      Number(p.kehadiranPersen.toFixed(1)),
      Number(p.avgPoinLkh.toFixed(1)),
      p.predikatDisiplin,
    ]);
  });

  // Baris Total / Rata-rata Akumulatif
  sheet1Data.push([]);
  sheet1Data.push([
    "",
    "",
    "TOTAL / RATA-RATA KAWASAN",
    "",
    "",
    "",
    summary.totalHadir - summary.totalTerlambat,
    summary.totalTerlambat,
    summary.totalIzinDinas,
    summary.totalCuti,
    summary.totalSakit,
    summary.totalAlpa,
    Number(summary.rataRataKehadiranRate.toFixed(1)),
    Number(summary.rataRataPoinLkh.toFixed(1)),
    summary.rataRataKehadiranRate >= 90 ? "Sangat Baik" : "Baik",
  ]);

  const wsPegawai = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Atur lebar kolom Sheet 1 agar nyaman dibaca di Microsoft Excel
  wsPegawai["!cols"] = [
    { wch: 6 },  // No
    { wch: 18 }, // NIP
    { wch: 32 }, // Nama
    { wch: 28 }, // Jabatan
    { wch: 22 }, // Golongan
    { wch: 12 }, // Hari Kerja
    { wch: 16 }, // Hadir On-time
    { wch: 12 }, // Terlambat
    { wch: 8 },  // Izin
    { wch: 8 },  // Cuti
    { wch: 8 },  // Sakit
    { wch: 16 }, // Alpa
    { wch: 22 }, // Kehadiran %
    { wch: 18 }, // Poin LKH
    { wch: 18 }, // Predikat
  ];

  // ────────────────────────────────────────────────────────────
  // SHEET 2: RINGKASAN EKSEKUTIF & KPI
  // ────────────────────────────────────────────────────────────
  const sheet2Data: any[][] = [
    ["RINGKASAN EKSEKUTIF INDIKATOR KINERJA KEPEGAWAIAN (KPI)"],
    ["SOLO TECHNOPARK (UPTD KST)"],
    ["Periode Evaluasi", `${namaBulanStr} ${tahun}`],
    [],
    ["Indikator Kinerja Utama", "Nilai Realisasi", "Standar Target BLUD", "Status Capaian"],
    ["Total Pegawai Aktif Terdaftar", summary.totalPegawai, "-", "Terverifikasi"],
    ["Rata-rata Tingkat Kehadiran Pegawai", `${summary.rataRataKehadiranRate.toFixed(1)}%`, "≥ 90.0%", summary.rataRataKehadiranRate >= 90 ? "MEMENUHI TARGET" : "PERLU EVALUASI"],
    ["Tingkat Ketepatan Waktu (Disiplin <= 07:30 WIB)", `${summary.disiplinWaktuRate.toFixed(1)}%`, "≥ 85.0%", summary.disiplinWaktuRate >= 85 ? "SANGAT DISIPLIN" : "PEMBINAAN"],
    ["Rata-rata Akumulasi Poin Kinerja LKH Harian", `${summary.rataRataPoinLkh.toFixed(1)} Poin`, `${summary.targetPoinStandar} Poin/Hari`, summary.persentaseTargetLkhTercapai >= 100 ? "TERPENUHI 100%" : `${summary.persentaseTargetLkhTercapai.toFixed(1)}%`],
    [],
    ["Rincian Akumulasi Status Kehadiran Kawasan", "Jumlah Hari/Orang"],
    ["Total Presensi Hadir Tepat Waktu", summary.totalHadir - summary.totalTerlambat],
    ["Total Presensi Terlambat", summary.totalTerlambat],
    ["Total Izin & Perjalanan Dinas Resmi", summary.totalIzinDinas],
    ["Total Hak Cuti Tahunan Digunakan", summary.totalCuti],
    ["Total Izin Sakit Surat Dokter", summary.totalSakit],
    ["Total Alpa / Tanpa Keterangan", summary.totalAlpa],
    [],
    ["Catatan Akuntabilitas", "Laporan ini digenerate secara otomatis oleh Sistem Presensi Tekno Sign v3.0 berbasis data transaksi terenkripsi."],
  ];

  const wsKpi = XLSX.utils.aoa_to_sheet(sheet2Data);
  wsKpi["!cols"] = [
    { wch: 45 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];

  // Buat Workbook dan pasang sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsPegawai, "Rekap Kehadiran ASN");
  XLSX.utils.book_append_sheet(wb, wsKpi, "Ringkasan Eksekutif KPI");

  // Nama file resmi
  const cleanUnit = namaUnit.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Rekap_Presensi_STP_${cleanUnit}_${tahun}_${String(bulan).padStart(2, "0")}.xlsx`;

  // Download langsung di browser client
  XLSX.writeFile(wb, fileName);
}
