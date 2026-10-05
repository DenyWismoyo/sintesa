"use client";

import React, { useState } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import {
  useDaftarRevisiPresensi,
  useAjukanRevisiPresensiMutation,
} from "@/hooks/presensi/useRevisiPresensi";
import {
  PermohonanRevisiPresensi,
  JenisRevisiPresensi,
  PresensiStatus,
} from "@/types/presensi";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  Paperclip,
  ArrowRight,
  Loader2,
  Filter,
  Info,
} from "lucide-react";

export default function PermohonanRevisiPage() {
  const { user } = usePresensiAuth();
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [tanggal, setTanggal] = useState("");
  const [jenisRevisi, setJenisRevisi] = useState<JenisRevisiPresensi>("koreksi_jam_pulang");
  const [statusSemula, setStatusSemula] = useState<PresensiStatus | "belum_absen">("hadir");
  const [statusDiajukan, setStatusDiajukan] = useState<PresensiStatus>("hadir");
  const [jamMasukSemula, setJamMasukSemula] = useState("");
  const [jamMasukDiajukan, setJamMasukDiajukan] = useState("");
  const [jamPulangSemula, setJamPulangSemula] = useState("");
  const [jamPulangDiajukan, setJamPulangDiajukan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: revisiList = [], isLoading, refetch } = useDaftarRevisiPresensi(
    filterStatus === "semua" ? undefined : (filterStatus as any),
    user?.id
  );

  const ajukanMutation = useAjukanRevisiPresensiMutation();

  const handleOpenModal = () => {
    setErrorMsg("");
    // Default tanggal kemarin
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setTanggal(d.toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!tanggal) {
      setErrorMsg("Tanggal presensi wajib diisi.");
      return;
    }

    if (!alasan.trim() || alasan.trim().length < 10) {
      setErrorMsg("Alasan permohonan revisi minimal 10 karakter.");
      return;
    }

    try {
      const res = await ajukanMutation.mutateAsync({
        tanggal,
        jenisRevisi,
        statusSemula,
        statusDiajukan,
        jamMasukSemula: jamMasukSemula || undefined,
        jamMasukDiajukan: jamMasukDiajukan || undefined,
        jamPulangSemula: jamPulangSemula || undefined,
        jamPulangDiajukan: jamPulangDiajukan || undefined,
        alasan: alasan.trim(),
        lampiranUrl: lampiranUrl || undefined,
      });

      if (res.success) {
        setIsModalOpen(false);
        setAlasan("");
        setLampiranUrl("");
        refetch();
      } else {
        setErrorMsg(res.message || "Gagal mengajukan permohonan revisi.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan sistem saat mengajukan revisi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <MobilePageHeader
        title="Permohonan Revisi Presensi"
        subtitle="Pantau dan ajukan koreksi kehadiran atau presensi susulan"
        backHref="/presensi"
        backLabel="Dashboard Presensi"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Info Batas Waktu */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-sky-200 text-sm">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sky-300">Ketentuan Pengajuan Revisi Resmi BLUD</p>
            <p className="text-xs text-sky-200/80 leading-relaxed">
              Permohonan revisi (lupa absen, koreksi jam dinas, atau presensi susulan) dapat diajukan maksimal <strong>14 hari kalender</strong> sejak tanggal kehadiran. Setiap permohonan wajib diverifikasi oleh Atasan Langsung atau Administrator.
            </p>
          </div>
        </div>

        {/* Action Header: Filter & Tombol Ajukan */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
            {[
              { id: "semua", label: "Semua" },
              { id: "menunggu", label: "Menunggu" },
              { id: "disetujui", label: "Disetujui" },
              { id: "ditolak", label: "Ditolak" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  filterStatus === tab.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleOpenModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-emerald-900/30 gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Ajukan Revisi Baru
          </Button>
        </div>

        {/* List Permohonan */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm">Memuat data permohonan revisi...</p>
          </div>
        ) : revisiList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Belum Ada Permohonan Revisi</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {filterStatus === "semua"
                ? "Anda belum pernah mengajukan permohonan koreksi jam atau status presensi."
                : `Tidak ada permohonan dengan status "${filterStatus}".`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenModal}
              className="border-slate-700 hover:bg-slate-800 text-xs"
            >
              Ajukan Permohonan Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {revisiList.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.id}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {item.tanggal}
                    </span>
                  </div>

                  <Badge
                    className={cn(
                      "text-[11px] font-medium border px-2.5 py-0.5",
                      item.status === "disetujui"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                        : item.status === "ditolak"
                        ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                        : "bg-amber-950/60 text-amber-400 border-amber-500/40"
                    )}
                  >
                    {item.status === "disetujui" && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                    {item.status === "ditolak" && <XCircle className="w-3 h-3 mr-1 inline" />}
                    {item.status === "menunggu" && <Clock className="w-3 h-3 mr-1 inline" />}
                    {item.status === "disetujui"
                      ? "Disetujui"
                      : item.status === "ditolak"
                      ? "Ditolak"
                      : "Menunggu Review"}
                  </Badge>
                </div>

                {/* Info Detail Revisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Jenis Revisi:</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {item.jenisRevisi.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Koreksi Status:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="capitalize text-slate-400">{item.statusSemula}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="capitalize font-semibold text-emerald-400">
                        {item.statusDiajukan}
                      </span>
                    </div>
                  </div>

                  {(item.jamMasukDiajukan || item.jamMasukSemula) && (
                    <div>
                      <span className="text-slate-500 block mb-0.5">Jam Masuk:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400">{item.jamMasukSemula || "-"}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold text-sky-400">
                          {item.jamMasukDiajukan || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {(item.jamPulangDiajukan || item.jamPulangSemula) && (
                    <div>
                      <span className="text-slate-500 block mb-0.5">Jam Pulang:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400">{item.jamPulangSemula || "-"}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold text-sky-400">
                          {item.jamPulangDiajukan || "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alasan */}
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 font-medium">Alasan Pengajuan:</span>
                  <p className="text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                    {item.alasan}
                  </p>
                </div>

                {/* Lampiran jika ada */}
                {item.lampiranUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={item.lampiranUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Paperclip className="w-3 h-3" />
                      Lihat Bukti Dukung / Surat Tugas
                    </a>
                  </div>
                )}

                {/* Catatan Review dari Atasan/Admin */}
                {item.catatanReview && (
                  <div
                    className={cn(
                      "p-3 rounded-xl text-xs space-y-1 border",
                      item.status === "disetujui"
                        ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-300"
                        : item.status === "ditolak"
                        ? "bg-rose-950/30 border-rose-900/50 text-rose-300"
                        : "bg-slate-800/40 border-slate-700 text-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>Catatan Penilai / Atasan:</span>
                      {item.reviewedByName && (
                        <span className="text-[11px] opacity-80">Oleh: {item.reviewedByName}</span>
                      )}
                    </div>
                    <p className="opacity-90 leading-relaxed">{item.catatanReview}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Form Pengajuan Revisi Baru */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-slate-100">Form Pengajuan Revisi Presensi</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Tanggal */}
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Tanggal Kehadiran yang Dikoreksi *</Label>
                  <Input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                  <p className="text-[11px] text-slate-500">Maksimal 14 hari sebelum hari ini.</p>
                </div>

                {/* Jenis Revisi */}
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Jenis Revisi *</Label>
                  <select
                    value={jenisRevisi}
                    onChange={(e) => setJenisRevisi(e.target.value as JenisRevisiPresensi)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="koreksi_jam_pulang">Koreksi Jam Pulang (Lupa Check-Out)</option>
                    <option value="koreksi_jam_masuk">Koreksi Jam Masuk (Kendala Teknis/Sistem)</option>
                    <option value="koreksi_status">Koreksi Status Kehadiran (Dinas Luar / Penugasan)</option>
                    <option value="presensi_susulan">Presensi Susulan Penuh</option>
                  </select>
                </div>

                {/* Status Semula & Diajukan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Status Semula</Label>
                    <select
                      value={statusSemula}
                      onChange={(e) => setStatusSemula(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="terlambat">Terlambat</option>
                      <option value="alpa">Alpa</option>
                      <option value="belum_absen">Belum Absen</option>
                      <option value="izin">Izin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Status yang Diajukan</Label>
                    <select
                      value={statusDiajukan}
                      onChange={(e) => setStatusDiajukan(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="dinas">Dinas Luar</option>
                      <option value="izin">Izin Resmi</option>
                      <option value="sakit">Sakit</option>
                    </select>
                  </div>
                </div>

                {/* Koreksi Jam (opsional tergantung jenis) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Jam Masuk Diajukan (HH:MM)</Label>
                    <Input
                      type="text"
                      placeholder="Contoh: 07:25"
                      value={jamMasukDiajukan}
                      onChange={(e) => setJamMasukDiajukan(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Jam Pulang Diajukan (HH:MM)</Label>
                    <Input
                      type="text"
                      placeholder="Contoh: 16:30"
                      value={jamPulangDiajukan}
                      onChange={(e) => setJamPulangDiajukan(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Alasan */}
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">
                    Alasan Lengkap & Kronologis Permohonan *
                  </Label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan alasan mengapa presensi perlu direvisi (minimal 10 karakter)..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                {/* Lampiran URL */}
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">
                    Link Dokumen / Bukti Dukung (Opsional)
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/... atau URL dokumen"
                    value={lampiranUrl}
                    onChange={(e) => setLampiranUrl(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                {/* Tombol Aksi Modal */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-800 hover:bg-slate-800 text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={ajukanMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5"
                  >
                    {ajukanMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Kirim Permohonan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
