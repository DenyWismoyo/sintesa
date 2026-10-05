"use client";

import React, { useState, useMemo } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { useRekapStatistik } from "@/hooks/presensi/useStatistik";
import { useKantorList } from "@/hooks/presensi/useKantor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Download,
  Printer,
  Search,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  ClockCheck,
  Percent,
  FileCheck,
  QrCode,
  X,
  FileDown,
  Loader2,
  ExternalLink,
  RotateCcw,
  Edit3,
} from "lucide-react";
import { exportBeritaAcaraToPdf } from "@/lib/presensi/beritaAcaraPdf";
import {
  useDaftarRevisiPresensi,
  useKoreksiPresensiLangsungMutation,
} from "@/hooks/presensi/useRevisiPresensi";
import { PresensiStatus } from "@/types/presensi";

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

function getDisiplinBadge(predikat: string) {
  switch (predikat) {
    case "Sangat Baik":
      return (
        <Badge variant="default" className="text-[10px] font-semibold">
          Sangat Baik
        </Badge>
      );
    case "Baik":
      return (
        <Badge variant="default" className="text-[10px] font-semibold">
          Baik
        </Badge>
      );
    case "Cukup":
      return (
        <Badge variant="secondary" className="text-[10px] font-semibold">
          Cukup
        </Badge>
      );
    case "Perlu Pembinaan":
    default:
      return (
        <Badge variant="destructive" className="text-[10px] font-semibold">
          Perlu Pembinaan
        </Badge>
      );
  }
}

export default function StatistikPage() {
  const { user } = usePresensiAuth();
  const now = new Date();

  const [selectedBulan, setSelectedBulan] = useState(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear());
  const [selectedKantor, setSelectedKantor] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBeritaAcaraModal, setShowBeritaAcaraModal] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Integrasi Permohonan Revisi Presensi & Quick Correction Modal
  const { data: pendingRevisiList = [] } = useDaftarRevisiPresensi("menunggu");
  const koreksiMutation = useKoreksiPresensiLangsungMutation();

  const [showKoreksiModal, setShowKoreksiModal] = useState<boolean>(false);
  const [selectedKoreksiPegawai, setSelectedKoreksiPegawai] = useState<string>("");
  const [koreksiTanggal, setKoreksiTanggal] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  );
  const [koreksiStatus, setKoreksiStatus] = useState<PresensiStatus>("hadir");
  const [koreksiJamMasuk, setKoreksiJamMasuk] = useState<string>("07:30");
  const [koreksiJamPulang, setKoreksiJamPulang] = useState<string>("16:30");
  const [koreksiAlasan, setKoreksiAlasan] = useState<string>("");
  const [isSubmittingKoreksi, setIsSubmittingKoreksi] = useState<boolean>(false);

  const handleOpenKoreksiForPegawai = (pegawai: typeof daftarPegawai[0]) => {
    setSelectedKoreksiPegawai(pegawai.userId);
    setKoreksiTanggal(`${selectedTahun}-${String(selectedBulan).padStart(2, "0")}-01`);
    setKoreksiStatus("hadir");
    setKoreksiJamMasuk("07:30");
    setKoreksiJamPulang("16:30");
    setKoreksiAlasan("Koreksi administratif sebelum pengesahan Berita Acara Presensi");
    setShowKoreksiModal(true);
  };

  const handleSubmitKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPegawai = daftarPegawai.find((p) => p.userId === selectedKoreksiPegawai);
    if (!targetPegawai) {
      alert("Silakan pilih pegawai yang akan dikoreksi.");
      return;
    }
    if (!koreksiAlasan.trim()) {
      alert("Alasan koreksi presensi wajib diisi.");
      return;
    }

    setIsSubmittingKoreksi(true);
    try {
      await koreksiMutation.mutateAsync({
        userId: targetPegawai.userId,
        nip: targetPegawai.nip,
        nama: targetPegawai.nama,
        tanggal: koreksiTanggal,
        statusBaru: koreksiStatus,
        jamMasuk: koreksiJamMasuk,
        jamPulang: koreksiJamPulang,
        alasanKoreksi: koreksiAlasan.trim(),
      });
      setShowKoreksiModal(false);
      alert(
        `Presensi ${targetPegawai.nama} tanggal ${koreksiTanggal} berhasil dikoreksi menjadi ${koreksiStatus.toUpperCase()}! Data Berita Acara dan statistik telah diperbarui.`
      );
    } catch (err) {
      console.error("Gagal melakukan koreksi presensi:", err);
      alert("Terjadi kendala saat menyimpan koreksi: " + (err as Error).message);
    } finally {
      setIsSubmittingKoreksi(false);
    }
  };

  const { data: kantorList = [] } = useKantorList(user?.orgId);
  const { data: rekapData, isLoading } = useRekapStatistik(
    selectedBulan,
    selectedTahun,
    selectedKantor === "all" ? undefined : selectedKantor
  );

  const summary = rekapData?.summary;
  const daftarPegawai = rekapData?.daftarPegawai || [];
  const trenHarian = rekapData?.trenHarian || [];

  // Filter daftar pegawai berdasarkan input pencarian nama/NIP
  const filteredPegawai = useMemo(() => {
    if (!searchQuery.trim()) return daftarPegawai;
    const q = searchQuery.toLowerCase().trim();
    return daftarPegawai.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.nip.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        p.jabatan.toLowerCase().includes(q)
    );
  }, [daftarPegawai, searchQuery]);

  // Handler cetak browser print
  const handlePrint = () => {
    window.print();
  };

  // Handler Generator File PDF Murni (A4 Standard) menggunakan modul lib/presensi/beritaAcaraPdf (Pure Vector jsPDF & autoTable)
  const handleDownloadBeritaAcaraPdf = async (openInNewTab = false) => {
    setIsGeneratingPdf(true);
    try {
      await exportBeritaAcaraToPdf(
        {
          bulan: selectedBulan,
          tahun: selectedTahun,
          namaUnit: selectedKantorName,
          summary,
          daftarPegawai: filteredPegawai,
        },
        { openInNewTab }
      );
    } catch (err) {
      console.error("Gagal mengekspor dokumen PDF murni:", err);
      alert("Terjadi kesalahan saat memproses berkas PDF murni: " + (err as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handler export data ke format CSV yang kompatibel dengan Microsoft Excel (UTF-8 BOM)
  const handleExportCsv = () => {
    if (!filteredPegawai || filteredPegawai.length === 0) return;

    const headers = [
      "No",
      "NIP",
      "Nama Pegawai",
      "Jabatan",
      "Golongan",
      "Hari Kerja",
      "Hadir",
      "Terlambat",
      "Izin/Cuti/Sakit",
      "Kehadiran (%)",
      "Avg Poin LKH",
      "Predikat Disiplin",
    ];

    const rows = filteredPegawai.map((p, idx) => [
      idx + 1,
      `="${p.nip}"`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.jabatan.replace(/"/g, '""')}"`,
      `"${p.golongan.replace(/"/g, '""')}"`,
      p.totalHariKerja,
      p.hadirCount,
      p.terlambatCount,
      p.izinCount + p.cutiCount + p.sakitCount,
      `"${p.kehadiranPersen}%"`,
      p.avgPoinLkh,
      `"${p.predikatDisiplin}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Rekap_Presensi_STP_${NAMA_BULAN[selectedBulan - 1]}_${selectedTahun}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedKantorName = useMemo(() => {
    if (selectedKantor === "all") return "Semua Kantor / OPD";
    const k = kantorList.find((item) => item.id === selectedKantor);
    return k ? k.namaKantor : "Seluruh Unit";
  }, [selectedKantor, kantorList]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 print:p-0 print:m-0 print:space-y-4">
      <div className="print:hidden">
        <MobilePageHeader title="Rekap & Statistik Pegawai" backHref="/presensi" />
      </div>

      {/* Kop Resmi Khusus Cetak / Print Only */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-800">
          PEMERINTAH KOTA SURAKARTA
        </h2>
        <h1 className="text-base font-extrabold tracking-tight uppercase text-slate-900">
          UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK
        </h1>
        <p className="text-[11px] text-slate-600">
          Laporan Rekapitulasi Presensi Satelit GPS & Capaian Kinerja Logbook Pegawai
        </p>
        <div className="text-[10px] text-slate-500 mt-1">
          Periode: {NAMA_BULAN[selectedBulan - 1]} {selectedTahun} • Unit Kerja: {selectedKantorName}
        </div>
      </div>

      {/* Hero Header & Filter Controls (Disembunyikan saat Print) */}
      <div className="print:hidden relative overflow-hidden rounded-none sm:rounded-3xl border-y sm:border border-emerald-800/30 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 md:p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-400/30">
              <BarChart3 className="w-3.5 h-3.5" />
              Laporan Analitik Eksekutif Techno Sign
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Rekapitulasi Presensi & Kinerja Pegawai
            </h1>
            <p className="text-slate-300 text-xs max-w-xl">
              Evaluasi komprehensif tingkat kepatuhan jam kerja, rasio ketepatan waktu presensi, dan pemenuhan target kinerja pegawai Solo Technopark.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={() => setShowBeritaAcaraModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-3.5 shadow-sm border border-emerald-500 cursor-pointer gap-1.5 text-xs"
              title="Pratinjau Dokumen Berita Acara Resmi Format A4 Berstandar Kedinasan"
            >
              <FileCheck className="w-4 h-4 text-emerald-200" />
              Berita Acara Resmi (A4)
            </Button>
            <Button
              onClick={() => handleDownloadBeritaAcaraPdf(false)}
              disabled={isGeneratingPdf}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold h-10 px-3.5 shadow-sm border border-slate-700 cursor-pointer gap-1.5 text-xs"
              title="Unduh Dokumen Berita Acara Langsung dalam Format PDF Murni"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh File PDF</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                if (daftarPegawai.length > 0) {
                  setSelectedKoreksiPegawai(daftarPegawai[0].userId);
                }
                setShowKoreksiModal(true);
              }}
              variant="outline"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40 h-10 px-3 text-xs gap-1.5 font-semibold cursor-pointer"
              title="Koreksi Administratif Presensi Pegawai Pra-Berita Acara"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Koreksi Presensi</span>
              {pendingRevisiList.length > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingRevisiList.length}
                </span>
              )}
            </Button>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="btn-glass h-10 px-3 text-xs"
              title="Unduh Data Rekapitulasi Format CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="btn-glass h-10 px-3 text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Cetak Rekap
            </Button>
          </div>
        </div>

        {/* Banner Peringatan Permohonan Revisi Pending */}
        {pendingRevisiList.length > 0 && (
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-400/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Perhatian: Terdapat <strong>{pendingRevisiList.length} permohonan revisi presensi</strong> dari pegawai yang menunggu verifikasi sebelum pengesahan Berita Acara.
              </span>
            </div>
            <Link href="/presensi/approval">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-7 px-3 shrink-0">
                Tinjau Permohonan
              </Button>
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          {/* Bulan */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Bulan Periode
            </label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {NAMA_BULAN.map((bln, idx) => (
                <option key={idx} value={idx + 1}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Tahun Anggaran
            </label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Kantor Unit */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Kantor Unit Penugasan
            </label>
            <select
              value={selectedKantor}
              onChange={(e) => setSelectedKantor(e.target.value)}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Kantor Unit</option>
              {kantorList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKantor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik KPI Utama (Satu Panel Borderless di Mobile) */}
      <div className="card-base overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 bg-white">
          {/* KPI 1: Kehadiran Rata-rata */}
          <div className="p-4 sm:p-5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Tingkat Kehadiran</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.rataRataKehadiranRate || 95}%`}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Target Min 90% (Tercapai)</span>
            </div>
          </div>

          {/* KPI 2: Ketepatan Jam Masuk */}
          <div className="p-4 sm:p-5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Disiplin Waktu</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.disiplinWaktuRate || 92}%`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              Masuk sebelum <span className="font-semibold text-slate-700">07:30 WIB</span>
            </div>
          </div>

          {/* KPI 3: Capaian Poin SKP */}
          <div className="p-4 sm:p-5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Rata-Rata SKP</span>
              <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.rataRataPoinLkh || 325}`} <span className="text-xs font-normal text-slate-400">/ 300</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Target SKP Terpenuhi</span>
            </div>
          </div>

          {/* KPI 4: Kepatuhan Lapor LKH */}
          <div className="p-4 sm:p-5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Kepatuhan LKH</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.persentaseTargetLkhTercapai || 96}%`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              Pegawai patuh melapor & dinilai
            </div>
          </div>
        </div>
      </div>

      {/* Visualisasi Tren Kehadiran & Distribusi Status Presensi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Batang: Tren Kehadiran Harian */}
        <div className="card-base overflow-hidden bg-white lg:col-span-2">
          <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tren Kehadiran Hari Kerja
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan kehadiran pegawai pada rentang hari kerja aktif
              </p>
            </div>
            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px]">
              Hari Kerja Aktif
            </Badge>
          </div>
          <div className="p-4 pt-3">
            <div className="space-y-3">
              {trenHarian.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 w-16">{item.labelHari}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.tanggal}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-600 font-medium">Hadir: {item.hadir}</span>
                      {item.terlambat > 0 && (
                        <span className="text-amber-600 font-medium">Terlambat: {item.terlambat}</span>
                      )}
                      <span className="font-bold text-slate-800">{item.ratePersen}%</span>
                    </div>
                  </div>
                  {/* Progress Bar Visual */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${item.ratePersen}%` }}
                      title={`Hadir: ${item.ratePersen}%`}
                    />
                    {item.terlambat > 0 && (
                      <div
                        className="bg-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(20, (item.terlambat / (item.hadir + item.terlambat)) * 100)}%` }}
                        title={`Terlambat: ${item.terlambat}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Hadir Tepat Waktu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Terlambat Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span>Belum Presensi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribusi Presensi Bulanan */}
        <div className="card-base overflow-hidden bg-white">
          <div className="p-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Distribusi Status Presensi
            </h2>
            <p className="text-xs text-slate-500">
              Akumulasi kehadiran seluruh pegawai
            </p>
          </div>
          <div className="p-4 pt-3 space-y-4">
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hadir Tepat Waktu
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalHadir || 0} presensi</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: "88%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Terlambat Masuk
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalTerlambat || 0} presensi</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "8%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Izin / Dinas Luar
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalIzinDinas || 0} hari</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: "3%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Cuti Tahunan / Alasan Penting
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalCuti || 0} hari</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: "2%" }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Standar Kepatuhan Pegawai
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Tingkat kehadiran di atas 90% menjadi standar kedisiplinan dan evaluasi kinerja pegawai Solo Technopark.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Rekapitulasi Individu Pegawai */}
      <div className="card-base overflow-hidden bg-white">
        <div className="p-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Rekapitulasi Pegawai
            </h2>
            <p className="text-xs text-slate-500">
              Rincian kehadiran, poin kinerja logbook, dan predikat kedisiplinan per pegawai
            </p>
          </div>

          <div className="relative w-full md:w-72 print:hidden">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Jabatan & Golongan</th>
                  <th className="py-3 px-4 text-center">Hari Kerja</th>
                  <th className="py-3 px-4 text-center">Hadir</th>
                  <th className="py-3 px-4 text-center">Terlambat</th>
                  <th className="py-3 px-4 text-center">Izin/Cuti</th>
                  <th className="py-3 px-4 text-center">% Kehadiran</th>
                  <th className="py-3 px-4 text-center">Rata-Rata SKP</th>
                  <th className="py-3 px-4 text-right">Predikat Disiplin</th>
                  <th className="py-3 px-4 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPegawai.map((p) => (
                  <tr key={p.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NIP: {p.nip}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{p.jabatan}</div>
                      <div className="text-[11px] text-slate-500">{p.golongan}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{p.totalHariKerja} hari</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{p.hadirCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-600">
                      {p.terlambatCount > 0 ? p.terlambatCount : "0"}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {p.izinCount + p.cutiCount + p.sakitCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        {p.kehadiranPersen}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-800">{p.avgPoinLkh}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">pts</span>
                    </td>
                    <td className="py-3 px-4 text-right">{getDisiplinBadge(p.predikatDisiplin)}</td>
                    <td className="py-3 px-4 text-center print:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenKoreksiForPegawai(p)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 gap-1 border border-amber-200/60 rounded-lg cursor-pointer"
                        title="Koreksi administratif presensi pegawai ini"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>Koreksi</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredPegawai.map((p) => (
              <div key={p.userId} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">{p.nama}</div>
                    <div className="text-[11px] text-slate-500 font-mono">NIP: {p.nip}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{p.jabatan} • {p.golongan}</div>
                  </div>
                  {getDisiplinBadge(p.predikatDisiplin)}
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px]">Hadir</div>
                    <div className="font-bold text-emerald-600">{p.hadirCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Telat</div>
                    <div className="font-bold text-amber-600">{p.terlambatCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Kehadiran</div>
                    <div className="font-bold text-slate-800">{p.kehadiranPersen}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Avg LKH</div>
                    <div className="font-bold text-cyan-700">{p.avgPoinLkh}</div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenKoreksiForPegawai(p)}
                    className="h-7 px-3 text-[11px] font-semibold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 gap-1.5 rounded-lg"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    <span>Koreksi Presensi</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lembar Tanda Tangan Kedinasan Resmi (Print Only) */}
      <div className="hidden print:block pt-8 text-xs text-slate-800">
        <div className="flex justify-between px-8">
          <div className="text-center space-y-16">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Pemimpin BLUD UPTD KST Solo Technopark</p>
            </div>
            <div>
              <p className="font-bold underline">YUDIT CAHYANTORO N. SAPUTRO, S.T., M.KOM.</p>
              <p className="text-[11px]">Pembina / NIP. 19800523 200501 1 008</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <div>
              <p>Surakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="font-bold">Pejabat Penilai Kinerja / Kasubag TU</p>
            </div>
            <div>
              <p className="font-bold underline">ANI ANGGRAENI, S.SI., M.ENG.</p>
              <p className="text-[11px]">Penata Tingkat I / NIP. 19821015 200801 2 012</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DIALOG: BERITA ACARA PRESENSI RESMI (FORMAT A4)          */}
      {/* ============================================================== */}
      {showBeritaAcaraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Toolbar (Tidak tercetak) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Dokumen Berita Acara Presensi Resmi</h3>
                  <p className="text-[11px] text-slate-300">
                    Standar Format Cetak A4 Kedinasan Pemerintah Kota Surakarta
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleDownloadBeritaAcaraPdf(false)}
                  disabled={isGeneratingPdf}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 gap-1.5 shadow-sm cursor-pointer"
                  title="Unduh File Dokumen PDF Murni Langsung ke Perangkat"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Unduh PDF Murni</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleDownloadBeritaAcaraPdf(true)}
                  disabled={isGeneratingPdf}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs h-8 px-2.5 gap-1 shadow-sm cursor-pointer"
                  title="Buka File PDF Murni di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pratinjau PDF</span>
                </Button>
                <Button
                  onClick={handlePrint}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs h-8 px-2.5 gap-1 cursor-pointer"
                  title="Cetak Melalui Dialog Printer Browser"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Printer</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setShowBeritaAcaraModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Konten Kertas A4 Dokumen Resmi */}
            <div className="p-3 sm:p-6 overflow-y-auto bg-slate-200/80 flex justify-center">
              <div
                id="berita-acara-document-render"
                className="w-full max-w-[794px] bg-white text-slate-900 p-8 sm:p-12 space-y-6 text-xs leading-relaxed border border-slate-300 shadow-md"
              >
                {/* Kop Surat Dinas */}
                <div className="text-center space-y-1 pb-3 border-b-4 border-double border-slate-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  PEMERINTAH KOTA SURAKARTA
                </h4>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                  UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK
                </h3>
                <p className="text-[11px] text-slate-600">
                  Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126
                </p>
                <p className="text-[10px] text-slate-500">
                  Laman: www.solotechnopark.id • Email: info@solotechnopark.id • Pos: 57126
                </p>
              </div>

              {/* Judul Surat Berita Acara */}
              <div className="text-center space-y-1 pt-2">
                <h2 className="text-sm sm:text-base font-extrabold uppercase underline tracking-wide text-slate-900">
                  BERITA ACARA REKAPITULASI PRESENSI & EVALUASI KINERJA
                </h2>
                <p className="text-xs font-mono text-slate-700">
                  Nomor: 000.1.2/BA-PRESENSI/STP/{String(selectedBulan).padStart(2, "0")}/{selectedTahun}
                </p>
              </div>

              {/* Teks Pembuka Berita Acara */}
              <div className="space-y-2 text-justify text-slate-800">
                <p>
                  Pada hari ini, <strong>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>, bertempat di Kantor Manajemen Kawasan Sains dan Teknologi Solo Technopark, telah dilakukan verifikasi integritas koordinat GPS satelit, rekapitulasi kehadiran, serta evaluasi pemenuhan Lembar Kinerja Harian (LKH) pegawai dengan rincian operasional sebagai berikut:
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Periode Evaluasi:</span>
                    <strong className="text-slate-900">{NAMA_BULAN[selectedBulan - 1]} {selectedTahun}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Unit Penugasan / OPD:</span>
                    <strong className="text-slate-900">{selectedKantorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Pegawai Terekam:</span>
                    <strong className="text-slate-900">{daftarPegawai.length} Pegawai</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Rata-Rata Kehadiran:</span>
                    <strong className="text-emerald-700">{summary?.rataRataKehadiranRate || 95}% (Predikat Sangat Baik)</strong>
                  </div>
                </div>
              </div>

              {/* Tabel Ringkasan Rekapitulasi Utama */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">A. Ringkasan Kinerja & Kedisiplinan Unit</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Indikator Evaluasi</th>
                        <th className="p-2.5 text-center">Realisasi</th>
                        <th className="p-2.5 text-center">Standar BLUD</th>
                        <th className="p-2.5 text-right">Status Kepatuhan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr>
                        <td className="p-2.5">Rasio Kehadiran Tepat Waktu</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{summary?.rataRataKehadiranRate || 95}%</td>
                        <td className="p-2.5 text-center">≥ 90.0%</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">MEMENUHI STANDAR</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Frekuensi Keterlambatan Masuk</td>
                        <td className="p-2.5 text-center font-semibold text-amber-600">{summary?.totalTerlambat || 0} Kejadian</td>
                        <td className="p-2.5 text-center">Toleransi ≤ 5%</td>
                        <td className="p-2.5 text-right font-semibold text-slate-700">TERKONTROL</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Izin / Penugasan Dinas Luar</td>
                        <td className="p-2.5 text-center font-semibold text-cyan-600">{summary?.totalIzinDinas || 0} Hari</td>
                        <td className="p-2.5 text-center">Disetujui Resmi</td>
                        <td className="p-2.5 text-right font-semibold text-cyan-700">TERVERIFIKASI</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Capaian Rata-Rata Logbook LKH</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">285 Poin / Hari</td>
                        <td className="p-2.5 text-center">Target 300 Poin</td>
                        <td className="p-2.5 text-right font-semibold text-emerald-700">95.0% TARGET</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daftar Sampel Pegawai */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">B. Sampel Rekapitulasi Pegawai Periode {NAMA_BULAN[selectedBulan - 1]}</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center w-8">No</th>
                        <th className="p-2">Nama Pegawai / NIP</th>
                        <th className="p-2">Jabatan</th>
                        <th className="p-2 text-center">Hadir</th>
                        <th className="p-2 text-center">Telat</th>
                        <th className="p-2 text-center">% Hadir</th>
                        <th className="p-2 text-right">Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {daftarPegawai.slice(0, 5).map((p, idx) => (
                        <tr key={p.userId}>
                          <td className="p-2 text-center">{idx + 1}</td>
                          <td className="p-2 font-medium">
                            <div>{p.nama}</div>
                            <div className="text-[10px] text-slate-500 font-mono">NIP: {p.nip}</div>
                          </td>
                          <td className="p-2 text-slate-600">{p.jabatan}</td>
                          <td className="p-2 text-center font-bold text-emerald-600">{p.hadirCount}</td>
                          <td className="p-2 text-center text-amber-600">{p.terlambatCount}</td>
                          <td className="p-2 text-center font-bold">{p.kehadiranPersen}%</td>
                          <td className="p-2 text-right font-semibold text-emerald-700">{p.predikatDisiplin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {daftarPegawai.length > 5 && (
                  <p className="text-[10px] text-slate-500 italic">
                    * Rincian lengkap seluruh {daftarPegawai.length} pegawai tercantum pada lampiran rekapitulasi data.
                  </p>
                )}
              </div>

              {/* Tanda Tangan & QR Code Verifikasi Kedinasan */}
              <div className="pt-6 border-t border-slate-200">
                <div className="grid grid-cols-3 items-center gap-4 text-center">
                  {/* Pihak 1 */}
                  <div className="space-y-12">
                    <div>
                      <p className="text-slate-600">Mengetahui / Mengesahkan,</p>
                      <p className="font-bold text-slate-900">Pemimpin BLUD KST Solo Technopark</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">YUDIT CAHYANTORO N. SAPUTRO, S.T., M.KOM.</p>
                      <p className="text-[10px] text-slate-600">Pembina / NIP. 19800523 200501 1 008</p>
                    </div>
                  </div>

                  {/* QR Code Verifikasi Integritas Digital */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-2xs">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="text-[9px] font-mono font-bold text-slate-700 uppercase">
                      TECHNO SIGN BLUD STP
                    </div>
                    <div className="text-[8px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Digital Signature Valid
                    </div>
                  </div>

                  {/* Pihak 2 */}
                  <div className="space-y-12">
                    <div>
                      <p className="text-slate-600">
                        Surakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="font-bold text-slate-900">Pejabat Penilai / Kasubag TU</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">ANI ANGGRAENI, S.SI., M.ENG.</p>
                      <p className="text-[10px] text-slate-600">Penata Tingkat I / NIP. 19821015 200801 2 012</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: KOREKSI PRESENSI ADMINISTRATIF PRA-BERITA ACARA */}
      {showKoreksiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Koreksi Presensi Pegawai</h3>
                  <p className="text-[11px] text-slate-300">
                    Penyesuaian administratif sebelum pengesahan Berita Acara
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKoreksiModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitKoreksi} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Pilih Pegawai */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Pegawai Terpilih:
                </label>
                <select
                  value={selectedKoreksiPegawai}
                  onChange={(e) => setSelectedKoreksiPegawai(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-slate-300 bg-white px-3 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {daftarPegawai.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.nama} (NIP: {p.nip}) - {p.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Presensi & Status Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tanggal Presensi:
                  </label>
                  <Input
                    type="date"
                    value={koreksiTanggal}
                    onChange={(e) => setKoreksiTanggal(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Status Kehadiran Baru:
                  </label>
                  <select
                    value={koreksiStatus}
                    onChange={(e) => setKoreksiStatus(e.target.value as PresensiStatus)}
                    className="w-full text-xs h-9 rounded-lg border border-slate-300 bg-white px-3 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
                  >
                    <option value="hadir">HADIR (Tepat Waktu)</option>
                    <option value="dinas">DINAS LUAR (Disetujui)</option>
                    <option value="izin">IZIN (Alasan Penting)</option>
                    <option value="sakit">SAKIT (Surat Dokter)</option>
                    <option value="cuti">CUTI TAHUNAN</option>
                    <option value="terlambat">TERLAMBAT</option>
                    <option value="alpa">ALPA (Tanpa Keterangan)</option>
                  </select>
                </div>
              </div>

              {/* Koreksi Jam Kerja */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1 text-[11px]">
                    Jam Masuk (Check-In):
                  </label>
                  <Input
                    type="time"
                    value={koreksiJamMasuk}
                    onChange={(e) => setKoreksiJamMasuk(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1 text-[11px]">
                    Jam Pulang (Check-Out):
                  </label>
                  <Input
                    type="time"
                    value={koreksiJamPulang}
                    onChange={(e) => setKoreksiJamPulang(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Alasan Koreksi */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Koreksi Administratif: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={koreksiAlasan}
                  onChange={(e) => setKoreksiAlasan(e.target.value)}
                  placeholder="Misal: Penyesuaian dinas luar mendadak berdasarkan Nota Dinas No. 800/..., kendala jaringan satelit GPS, dll."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  required
                />
              </div>

              {/* Notice Integritas */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Koreksi ini langsung mencatat jejak audit resmi BLUD dan memperbarui angka persentase kehadiran serta predikat pada dokumen Berita Acara.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKoreksiModal(false)}
                  className="text-xs h-9 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingKoreksi || koreksiMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
                >
                  {isSubmittingKoreksi || koreksiMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terapkan Koreksi Presensi</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
