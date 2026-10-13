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
    <div className="space-y-4 sm:space-y-6">
      <MobilePageHeader
        title="Permohonan Revisi Presensi"
        subtitle="Pantau dan ajukan koreksi kehadiran atau presensi susulan"
        backHref="/presensi"
        backLabel="Dashboard Presensi"
        rightElement={
          <Button
            onClick={handleOpenModal}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 px-2.5 rounded-xl shadow-xs gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajukan</span>
          </Button>
        }
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Banner Info Batas Waktu */}
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 text-xs">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-900">Ketentuan Pengajuan Revisi Resmi BLUD</p>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              Permohonan revisi (lupa absen, koreksi jam dinas, atau presensi susulan) dapat diajukan maksimal <strong>14 hari kalender</strong> sejak tanggal kehadiran. Setiap permohonan diverifikasi oleh Atasan Langsung sebelum Berita Acara Presensi disahkan.
            </p>
          </div>
        </div>

        {/* Action Header: Filter & Tombol Ajukan (Desktop) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs Filter */}
          <div className="public-pill-container w-full sm:w-auto">
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
                  "public-pill-btn flex-1 sm:flex-initial justify-center",
                  filterStatus === tab.id && "active"
                )}
              >
                {filterStatus === tab.id && (
                  <motion.div
                    layoutId="revisi-tab-pill"
                    className="public-pill-active-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleOpenModal}
            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ajukan Revisi Baru
          </Button>
        </div>

        {/* List Permohonan */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs">Memuat data permohonan revisi...</p>
          </div>
        ) : revisiList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Belum Ada Permohonan Revisi</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              {filterStatus === "semua"
                ? "Anda belum pernah mengajukan permohonan koreksi jam atau status presensi."
                : `Tidak ada permohonan dengan status "${filterStatus}".`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenModal}
              className="border-slate-200 hover:bg-slate-50 text-xs rounded-xl"
            >
              Ajukan Permohonan Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {revisiList.map((item) => (
              <div
                key={item.id}
                className="card-base p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
              >
                {/* Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {item.id}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.tanggal}
                    </span>
                  </div>

                  <Badge
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs",
                      item.status === "disetujui"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.status === "ditolak"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-0.5">Jenis Revisi:</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {item.jenisRevisi.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block mb-0.5">Koreksi Status:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="capitalize text-slate-500">{item.statusSemula}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="capitalize font-bold text-emerald-700">
                        {item.statusDiajukan}
                      </span>
                    </div>
                  </div>

                  {(item.jamMasukDiajukan || item.jamMasukSemula) && (
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Jam Masuk:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500">{item.jamMasukSemula || "-"}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {item.jamMasukDiajukan || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {(item.jamPulangDiajukan || item.jamPulangSemula) && (
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Jam Pulang:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500">{item.jamPulangSemula || "-"}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {item.jamPulangDiajukan || "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alasan */}
                <div className="text-xs space-y-1">
                  <span className="text-slate-500 text-[11px] font-semibold">Alasan Permohonan:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
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
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors font-semibold"
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
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : item.status === "ditolak"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Catatan Penilai / Atasan:</span>
                      {item.reviewedByName && (
                        <span className="text-[11px] font-normal text-slate-600">Oleh: {item.reviewedByName}</span>
                      )}
                    </div>
                    <p className="leading-relaxed">{item.catatanReview}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form Pengajuan Revisi Baru */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Form Pengajuan Revisi Presensi</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Tanggal */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-semibold">Tanggal Kehadiran yang Dikoreksi *</Label>
                  <Input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">Maksimal 14 hari sebelum hari ini.</p>
                </div>

                {/* Jenis Revisi */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-semibold">Jenis Revisi *</Label>
                  <select
                    value={jenisRevisi}
                    onChange={(e) => setJenisRevisi(e.target.value as JenisRevisiPresensi)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="koreksi_jam_pulang">Koreksi Jam Pulang (Lupa Check-Out)</option>
                    <option value="koreksi_jam_masuk">Koreksi Jam Masuk (Kendala Teknis/Sistem)</option>
                    <option value="koreksi_status">Koreksi Status Kehadiran (Dinas Luar / Penugasan)</option>
                    <option value="presensi_susulan">Presensi Susulan Penuh</option>
                  </select>
                </div>

                {/* Status Semula & Diajukan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 text-xs font-semibold">Status Semula</Label>
                    <select
                      value={statusSemula}
                      onChange={(e) => setStatusSemula(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="terlambat">Terlambat</option>
                      <option value="alpa">Alpa</option>
                      <option value="belum_absen">Belum Absen</option>
                      <option value="izin">Izin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 text-xs font-semibold">Status yang Diajukan</Label>
                    <select
                      value={statusDiajukan}
                      onChange={(e) => setStatusDiajukan(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="dinas">Dinas Luar</option>
                      <option value="izin">Izin Resmi</option>
                      <option value="sakit">Sakit</option>
                    </select>
                  </div>
                </div>

                {/* Koreksi Jam */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 text-xs font-semibold">Jam Masuk (HH:MM)</Label>
                    <Input
                      type="text"
                      placeholder="Contoh: 07:25"
                      value={jamMasukDiajukan}
                      onChange={(e) => setJamMasukDiajukan(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 text-xs font-mono rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 text-xs font-semibold">Jam Pulang (HH:MM)</Label>
                    <Input
                      type="text"
                      placeholder="Contoh: 16:30"
                      value={jamPulangDiajukan}
                      onChange={(e) => setJamPulangDiajukan(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 text-xs font-mono rounded-xl"
                    />
                  </div>
                </div>

                {/* Alasan */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-semibold">
                    Alasan Lengkap Permohonan *
                  </Label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan alasan mengapa presensi perlu direvisi (minimal 10 karakter)..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none"
                  />
                </div>

                {/* Lampiran URL */}
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs font-semibold">
                    Link Bukti Dukung (Opsional)
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/... atau URL dokumen"
                    value={lampiranUrl}
                    onChange={(e) => setLampiranUrl(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl"
                  />
                </div>

                {/* Tombol Aksi Modal */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={ajukanMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
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
