"use client";

import React, { useState, useMemo } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { usePendingLKHList, useApproveLKHMutation, useRejectLKHMutation } from "@/hooks/presensi/useLKH";
import { usePendingLemburList, useApproveLemburMutation, useRejectLemburMutation } from "@/hooks/presensi/useLembur";
import { usePendingIzinList, useApproveIzinMutation, useRejectIzinMutation } from "@/hooks/presensi/useIzin";
import { LKHRecord, LemburRecord, PengajuanIzinItem } from "@/types/presensi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  User,
  Building,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Timer,
  ShieldCheck,
  Paperclip,
  ExternalLink,
  Calendar,
} from "lucide-react";

export default function ApprovalPage() {
  const { user } = usePresensiAuth();
  const isAtasanOrAdmin = user?.role === "atasan" || user?.role === "admin";

  const { data: pendingList = [], isLoading } = usePendingLKHList(user?.orgId);
  const { data: pendingLemburList = [], isLoading: isLoadingLembur } = usePendingLemburList(user?.orgId);
  const { data: pendingIzinList = [], isLoading: isLoadingIzin } = usePendingIzinList(isAtasanOrAdmin);

  const approveMutation = useApproveLKHMutation();
  const rejectMutation = useRejectLKHMutation();
  const approveLemburMutation = useApproveLemburMutation();
  const rejectLemburMutation = useRejectLemburMutation();
  const approveIzinMutation = useApproveIzinMutation();
  const rejectIzinMutation = useRejectIzinMutation();

  const [activeTab, setActiveTab] = useState<"lkh" | "lembur" | "izin">("lkh");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [catatanApproval, setCatatanApproval] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectLemburId, setRejectLemburId] = useState<string | null>(null);
  const [rejectLemburReason, setRejectLemburReason] = useState<Record<string, string>>({});
  const [rejectIzinId, setRejectIzinId] = useState<string | null>(null);
  const [rejectIzinReason, setRejectIzinReason] = useState<Record<string, string>>({});
  const [catatanIzinApproval, setCatatanIzinApproval] = useState<Record<string, string>>({});

  const filteredList = pendingList.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(q) ||
      item.nip.includes(q) ||
      item.tanggal.includes(q)
    );
  });

  const [isBatchApproving, setIsBatchApproving] = useState(false);

  // Filter berkas yang telah mencapai target minimal 300 poin
  const validForBatchApprove = useMemo(() => {
    return pendingList.filter(
      (item) => (item.totalPoinHarian || 0) >= 300 || item.isTargetTercapai
    );
  }, [pendingList]);

  const handleBatchApprove = async () => {
    if (!user || validForBatchApprove.length === 0) return;
    const confirmed = window.confirm(
      `Setujui ${validForBatchApprove.length} berkas LKH yang telah memenuhi target minimal 300 poin secara sekaligus?`
    );
    if (!confirmed) return;

    setIsBatchApproving(true);
    try {
      for (const record of validForBatchApprove) {
        await approveMutation.mutateAsync({
          lkhId: record.id,
          atasanId: user.id,
          atasanNama: user.nama,
          catatanAtasan: "Disetujui serentak. Capaian kegiatan memenuhi target minimal kinerja pegawai.",
        });
      }
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
      alert(`Berhasil menyetujui ${validForBatchApprove.length} berkas LKH pegawai!`);
    } catch (err) {
      console.error("Gagal batch approve:", err);
      alert("Terjadi kendala saat memproses sebagian berkas.");
    } finally {
      setIsBatchApproving(false);
    }
  };

  const handleApprove = async (record: LKHRecord) => {
    if (!user) return;
    const note = catatanApproval[record.id] || "Disetujui. Capaian kegiatan sesuai target kinerja pegawai.";
    await approveMutation.mutateAsync({
      lkhId: record.id,
      atasanId: user.id,
      atasanNama: user.nama,
      catatanAtasan: note,
    });
  };

  const handleReject = async (record: LKHRecord) => {
    if (!user) return;
    const reason = rejectReason[record.id];
    if (!reason) {
      alert("Harap masukkan alasan pengembalian/penolakan berkas.");
      return;
    }
    await rejectMutation.mutateAsync({
      lkhId: record.id,
      atasanId: user.id,
      atasanNama: user.nama,
      rejectedReason: reason,
    });
    setRejectingId(null);
  };

  const handleApproveLembur = async (record: LemburRecord) => {
    if (!user) return;
    await approveLemburMutation.mutateAsync({
      lemburId: record.id,
      atasanId: user.id,
      atasanNama: user.nama,
      catatanAtasan: `Disetujui. Lembur ${record.jenis === 'hari_kerja' ? 'hari kerja' : record.jenis === 'hari_libur' ? 'hari libur' : 'hari raya'} tanggal ${record.tanggal}.`,
    });
  };

  const handleRejectLembur = async (record: LemburRecord) => {
    if (!user) return;
    const reason = rejectLemburReason[record.id];
    if (!reason) {
      alert("Harap masukkan alasan penolakan lembur.");
      return;
    }
    await rejectLemburMutation.mutateAsync({
      lemburId: record.id,
      atasanId: user.id,
      atasanNama: user.nama,
      alasanPenolakan: reason,
    });
    setRejectLemburId(null);
  };

  const handleApproveIzin = async (record: PengajuanIzinItem) => {
    if (!user) return;
    const note =
      catatanIzinApproval[record.id] ||
      `Disetujui. Permohonan ${record.jenis} (${record.tanggalMulai} s/d ${record.tanggalSelesai}).`;
    await approveIzinMutation.mutateAsync({
      izinId: record.id,
      atasanId: user.id,
      catatanAtasan: note,
    });
  };

  const handleRejectIzin = async (record: PengajuanIzinItem) => {
    if (!user) return;
    const reason = rejectIzinReason[record.id];
    if (!reason) {
      alert("Harap masukkan alasan penolakan izin / cuti.");
      return;
    }
    await rejectIzinMutation.mutateAsync({
      izinId: record.id,
      atasanId: user.id,
      alasanPenolakan: reason,
    });
    setRejectIzinId(null);
  };

  if (!isAtasanOrAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Akses Dibatasi</h1>
        <p className="text-sm text-slate-600">
          Halaman verifikasi dan persetujuan ini hanya dapat diakses oleh pejabat penilai kinerja (Atasan Langsung) atau Administrator BLUD.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Persetujuan Kinerja Tim"
        subtitle="Verifikasi akuntabilitas LKH, lembur, dan izin/cuti bawahan"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            Verifikasi & Persetujuan Tim
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tinjau akuntabilitas pelaksanaan tugas LKH harian, lembur kerja, dan pengajuan cuti/izin pegawai bawahan
          </p>
        </div>

      {/* Tab Switcher: LKH vs Lembur vs Izin */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
        <button
          onClick={() => setActiveTab("lkh")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "lkh"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          LKH Harian
          {pendingList.length > 0 && (
            <span className="ml-1 bg-emerald-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("lembur")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "lembur"
              ? "bg-white text-violet-700 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          Lembur
          {pendingLemburList.length > 0 && (
            <span className="ml-1 bg-violet-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
              {pendingLemburList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("izin")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "izin"
              ? "bg-white text-teal-700 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Cuti / Izin
          {pendingIzinList.length > 0 && (
            <span className="ml-1 bg-teal-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
              {pendingIzinList.length}
            </span>
          )}
        </button>
      </div>

      {/* Sisa header lama (hanya tampil saat tab LKH) */}
      {activeTab === "lkh" && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="default" className="bg-slate-800 text-white text-xs px-3 py-1.5">
            {pendingList.length} Berkas Menunggu Review
          </Badge>

          {validForBatchApprove.length > 0 && (
            <Button
              onClick={handleBatchApprove}
              disabled={isBatchApproving || approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8.5 px-3.5 font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              {isBatchApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Setujui Semua Lolos Syarat ({validForBatchApprove.length})</span>
            </Button>
          )}
        </div>
      )}
      </div>

      {/* ── Konten berdasarkan tab aktif ─────────────────────────────────── */}
      {activeTab === "lkh" && (
        <>
          {/* Bar Pencarian & Filter LKH */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Cari nama pegawai, NIP, atau tanggal laporan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 border-slate-200"
              />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 px-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status: Menunggu Persetujuan</span>
            </div>
          </div>

          {/* Daftar LKH */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs">Memuat antrean LKH pegawai...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-900 text-sm">
                Semua Laporan Telah Selesai Ditinjau
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada dokumen LKH bawahan yang sedang menunggu persetujuan Anda saat ini.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredList.map((record) => {
                const isExpanded = expandedId === record.id;
                const isRejectOpen = rejectingId === record.id;
                const isApproving = approveMutation.isPending;
                const isRejecting = rejectMutation.isPending;

                return (
                  <Card
                    key={record.id}
                    className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Header Kartu */}
                    <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {record.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{record.nama}</span>
                            <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">
                              NIP: {record.nip}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                            <span>Tanggal LKH: <strong>{record.tanggal}</strong></span>
                            <span>•</span>
                            <span>{record.kegiatan.length} Kegiatan</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <div className="text-right mr-2">
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {record.totalPoinHarian} Poin SKP
                          </div>
                          <div className="text-[10px] text-slate-400">Target: {record.targetPoinHarian} Poin</div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : record.id)}
                          className="text-xs h-8 px-2.5 text-slate-600"
                        >
                          {isExpanded ? (
                            <><span>Tutup Rincian</span><ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                          ) : (
                            <><span>Lihat Rincian</span><ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <CardContent className="p-4 sm:p-5 bg-slate-50/50 space-y-4">
                        {record.catatanPegawai && (
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200/60 text-xs text-blue-900 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              Catatan dari Pegawai:
                            </div>
                            <p className="text-[11px] text-blue-800">{record.catatanPegawai}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Rincian Butir Kegiatan Terlaksana:
                          </div>
                          <div className="space-y-2">
                            {record.kegiatan.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-bold text-slate-900">
                                    {idx + 1}. {item.namaAktivitasBaku || item.deskripsi}
                                  </div>
                                  <Badge variant="default" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                                    +{item.totalPoin} Poin
                                  </Badge>
                                </div>
                                <p className="text-slate-600 text-[11px]">{item.deskripsi}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                  <span>Output: <strong>{item.outputKegiatan}</strong></span>
                                  <span>•</span>
                                  <span>Volume: {item.volumeKegiatan} {item.satuanKegiatan}</span>
                                  <span>•</span>
                                  <span>Waktu: {item.jamMulai} - {item.jamSelesai} WIB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-3">
                          {!isRejectOpen ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-700">Catatan Atasan (Opsional)</Label>
                                <Input
                                  type="text"
                                  placeholder="Masukkan apresiasi atau arahan pembinaan..."
                                  value={catatanApproval[record.id] || ""}
                                  onChange={(e) => setCatatanApproval({ ...catatanApproval, [record.id]: e.target.value })}
                                  className="text-xs h-9 bg-white"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" size="sm" onClick={() => setRejectingId(record.id)} className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-9">
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Kembalikan / Revisi
                                </Button>
                                <Button type="button" size="sm" disabled={isApproving} onClick={() => handleApprove(record)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold">
                                  {isApproving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                  Setujui LKH Pegawai
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-red-50/70 border border-red-200 space-y-2">
                              <div className="font-semibold text-xs text-red-900 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                Alasan Pengembalian / Koreksi Dokumen:
                              </div>
                              <Input
                                type="text"
                                placeholder="Contoh: Bukti foto belum sesuai, volume kegiatan mohon disesuaikan..."
                                value={rejectReason[record.id] || ""}
                                onChange={(e) => setRejectReason({ ...rejectReason, [record.id]: e.target.value })}
                                className="text-xs h-9 bg-white border-red-300"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setRejectingId(null)} className="text-xs h-8 text-slate-600">Batal</Button>
                                <Button type="button" size="sm" disabled={isRejecting} onClick={() => handleReject(record)} className="bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                                  {isRejecting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                  Kirim Pengembalian ke Pegawai
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab Lembur ───────────────────────────────────────────────────── */}
      {activeTab === "lembur" && (
        <div className="space-y-4">
          {isLoadingLembur ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600" />
              <p className="text-xs">Memuat pengajuan lembur...</p>
            </div>
          ) : pendingLemburList.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-50 border border-violet-200 text-violet-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-900 text-sm">Tidak Ada Pengajuan Lembur</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada pengajuan lembur bawahan yang menunggu persetujuan Anda saat ini.
              </p>
            </Card>
          ) : (
            pendingLemburList.map((record) => (
              <Card key={record.id} className="border-violet-200/60 shadow-xs hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {record.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{record.nama}</span>
                        <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">NIP: {record.nip}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <div>Tanggal: <strong>{record.tanggal}</strong> • {record.jenis === "hari_kerja" ? "Hari Kerja" : record.jenis === "hari_libur" ? "Hari Libur" : "Hari Raya"}</div>
                        <div className="text-slate-400">{record.jamMulaiRencana} — {record.jamSelesaiRencana} WIB</div>
                        <div className="text-slate-600 italic text-[11px]">&quot;{record.alasanLembur}&quot;</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {rejectLemburId === record.id ? (
                      <div className="space-y-2 min-w-[200px]">
                        <Input
                          type="text"
                          placeholder="Alasan penolakan..."
                          value={rejectLemburReason[record.id] || ""}
                          onChange={(e) => setRejectLemburReason({ ...rejectLemburReason, [record.id]: e.target.value })}
                          className="text-xs h-8"
                        />
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setRejectLemburId(null)} className="text-xs h-7 flex-1">Batal</Button>
                          <Button size="sm" onClick={() => handleRejectLembur(record)} className="text-xs h-7 flex-1 bg-red-600 hover:bg-red-700 text-white">
                            {rejectLemburMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tolak"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectLemburId(record.id)}
                          className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-9"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                        </Button>
                        <Button
                          size="sm"
                          disabled={approveLemburMutation.isPending}
                          onClick={() => handleApproveLembur(record)}
                          className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 font-semibold"
                        >
                          {approveLemburMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          Setujui Lembur
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Tab Cuti / Izin ────────────────────────────────────────────── */}
      {activeTab === "izin" && (
        <div className="space-y-4">
          {isLoadingIzin ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
              <p className="text-xs">Memuat pengajuan cuti & izin...</p>
            </div>
          ) : pendingIzinList.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-900 text-sm">Tidak Ada Pengajuan Cuti / Izin</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Semua pengajuan cuti, sakit, dan izin pegawai telah diproses atau belum ada permohonan baru.
              </p>
            </Card>
          ) : (
            pendingIzinList.map((record) => {
              const isRejecting = rejectIzinId === record.id;
              const isApproving = approveIzinMutation.isPending;

              const badgeColor =
                record.jenis === "Sakit"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : record.jenis === "Dinas Luar"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : record.jenis === "Cuti Tahunan"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <Card
                  key={record.id}
                  className="border-teal-200/60 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {record.nama.charAt(0)}
                      </div>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{record.nama}</span>
                          <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">
                            NIP: {record.nip}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${badgeColor}`}>
                            {record.jenis}
                          </Badge>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1.5 pt-0.5">
                          <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                              {record.tanggalMulai} s/d {record.tanggalSelesai} ({record.jumlahHari} Hari)
                            </span>
                          </div>
                          <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">
                            <span className="font-semibold text-slate-500 block mb-0.5">Alasan / Keperluan:</span>
                            &quot;{record.alasan}&quot;
                          </div>

                          {record.dokumenUrl && (
                            <div className="pt-1">
                              <a
                                href={record.dokumenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-semibold bg-teal-50 hover:bg-teal-100/70 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>{record.dokumenNama || "Lihat Surat / Bukti Lampiran"}</span>
                                <ExternalLink className="w-3 h-3 text-teal-500" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 sm:w-64">
                      {isRejecting ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="Alasan penolakan izin..."
                            value={rejectIzinReason[record.id] || ""}
                            onChange={(e) =>
                              setRejectIzinReason({
                                ...rejectIzinReason,
                                [record.id]: e.target.value,
                              })
                            }
                            className="text-xs h-8"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRejectIzinId(null)}
                              className="text-xs h-7 flex-1"
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectIzin(record)}
                              className="text-xs h-7 flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              {rejectIzinMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Tolak Izin"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Input
                            type="text"
                            placeholder="Catatan persetujuan (opsional)..."
                            value={catatanIzinApproval[record.id] || ""}
                            onChange={(e) =>
                              setCatatanIzinApproval({
                                ...catatanIzinApproval,
                                [record.id]: e.target.value,
                              })
                            }
                            className="text-xs h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectIzinId(record.id)}
                              className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-8 flex-1"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                            </Button>
                            <Button
                              size="sm"
                              disabled={isApproving}
                              onClick={() => handleApproveIzin(record)}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 font-semibold flex-1"
                            >
                              {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              )}
                              Setujui
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
