"use client";

import React, { useState } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { uploadAsnFile } from "@/lib/presensi/storage-helpers";
import { useIzinList, useSubmitIzinMutation } from "@/hooks/presensi/useIzin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { playSuccessChime } from "@/lib/presensi/sound";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import {
  FileText,
  Calendar,
  UploadCloud,
  CheckCircle2,
  FileCheck,
  Send,
  Loader2,
  Paperclip,
  Inbox,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

export default function TabIzin() {
  const { user, consumeStorage } = usePresensiAuth();
  const { data: riwayat = [], isLoading: isIzinLoading } = useIzinList(user?.id);
  const submitIzinMutation = useSubmitIzinMutation();

  const [jenis, setJenis] = useState<"Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar">("Cuti Tahunan");
  const [tanggalMulai, setTanggalMulai] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tanggalSelesai, setTanggalSelesai] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [alasan, setAlasan] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    jenis: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    alasan: string;
  } | null>(null);

  const [showForm, setShowForm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !alasan) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    let dokumenUrl: string | undefined = undefined;
    let dokumenNama = "";

    try {
      if (fileToUpload) {
        dokumenNama = fileToUpload.name;
        consumeStorage(fileToUpload.size);

        const uploadResult = await uploadAsnFile({
          file: fileToUpload,
          fileName: fileToUpload.name,
          userId: user.id,
          orgId: user.orgId,
          type: "dokumen",
        });

        if (uploadResult && uploadResult.url) {
          dokumenUrl = uploadResult.url;
        }
      }

      const dMulai = new Date(tanggalMulai);
      const dSelesai = new Date(tanggalSelesai);
      const diffTime = Math.abs(dSelesai.getTime() - dMulai.getTime());
      const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await submitIzinMutation.mutateAsync({
        userId: user.id,
        nama: user.nama,
        nip: user.nip,
        orgId: user.orgId,
        atasanId: user.atasanId || "",
        jenis,
        tanggalMulai,
        tanggalSelesai,
        jumlahHari,
        alasan,
        dokumenNama: dokumenNama || undefined,
        dokumenUrl,
      });

      setSuccessMessage(
        `Permohonan ${jenis} Anda berhasil diajukan ke atasan untuk verifikasi.`
      );
      setSubmittedData({
        jenis,
        tanggalMulai,
        tanggalSelesai,
        alasan,
      });
      setAlasan("");
      setFileToUpload(null);
      setShowForm(false);
      playSuccessChime();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = (data: { jenis: string; tanggalMulai: string; tanggalSelesai: string; alasan: string }) => {
    const approvalUrl = "https://katalog.solotechnopark.id/presensi/approval";
    const pesan = 
`*Pemberitahuan Pengajuan ${data.jenis} - Techno Sign Solo Technopark*

Yth. Bapak/Ibu Atasan,
Saya mengajukan permohonan *${data.jenis}* dengan rincian berikut:
• Pegawai: ${user?.nama || "-"} (NIP: ${user?.nip || "-"})
• Periode: ${data.tanggalMulai}${data.tanggalSelesai !== data.tanggalMulai ? ` s.d. ${data.tanggalSelesai}` : ""}
• Alasan: ${data.alasan}

Mohon kesediaan Bapak/Ibu untuk meninjau dan memberikan persetujuan melalui sistem Techno Sign:
${approvalUrl}

Terima kasih.`;

    const encoded = encodeURIComponent(pesan);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  return (
    <MotionStaggerContainer className="space-y-4">
      {successMessage && (
        <MotionFadeUp>
          <div className="mx-4 sm:mx-0 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-emerald-800">{successMessage}</span>
            </div>
            {submittedData && (
              <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-700">
                  Percepat proses — kabari atasan via WhatsApp:
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSendWhatsApp(submittedData)}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Kabari Atasan via WhatsApp
                </Button>
              </div>
            )}
          </div>
        </MotionFadeUp>
      )}

      {/* Hero Button / Form Izin Baru */}
      <MotionFadeUp>
        {!showForm ? (
          <div className="mx-4 sm:mx-0">
            <div
              onClick={() => setShowForm(true)}
              className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-600 p-5 text-white shadow-md cursor-pointer border border-emerald-400/50 hover:scale-[1.01] transition-transform active:scale-95"
            >
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold tracking-wide text-lg">Ajukan Izin Baru</h3>
                  <p className="text-[11px] text-teal-100 font-medium mt-0.5">Cuti, Sakit, atau Dinas Luar</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xl leading-none">+</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-emerald-400" />
            {/* Form header */}
            <div className="px-4 py-3 sm:px-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600" />
                <div>
                  <div className="text-sm font-bold text-slate-800">Formulir Izin</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pengajuan ke {user?.atasanNama || "Atasan"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"
                aria-label="Tutup formulir"
              >
                ✕
              </button>
            </div>
            {/* Form body */}
            <div className="p-4 sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis" className="text-xs font-semibold text-slate-700">Jenis Permohonan</Label>
                  <select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as typeof jenis)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Izin Alasan Penting">Izin Alasan Penting</option>
                    <option value="Sakit">Sakit (Surat Dokter)</option>
                    <option value="Dinas Luar">Dinas Luar (Surat Tugas)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-mulai" className="text-xs font-semibold text-slate-700">Tgl Mulai</Label>
                    <Input id="tgl-mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="text-xs h-10 rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-selesai" className="text-xs font-semibold text-slate-700">Tgl Selesai</Label>
                    <Input id="tgl-selesai" type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="text-xs h-10 rounded-xl" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alasan" className="text-xs font-semibold text-slate-700">Alasan / Uraian</Label>
                  <textarea
                    id="alasan"
                    rows={3}
                    placeholder="Jelaskan rincian izin..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Lampiran Bukti (Wajib untuk Sakit)</Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 rounded-xl p-4 text-center transition-colors">
                    <input type="file" id="izin-file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="izin-file" className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
                      <UploadCloud className="w-5 h-5 text-teal-600" />
                      <span className="text-[11px] font-bold text-slate-700">{fileToUpload ? fileToUpload.name : "Pilih Dokumen"}</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF/JPG/PNG (Maks 10MB)</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !alasan}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] h-12 rounded-xl"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Ajukan Izin</>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </MotionFadeUp>

      {/* Riwayat Pengajuan Izin */}
      <MotionFadeUp>
        <div className="card-base overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-3 sm:px-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-800">Riwayat Izin</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{riwayat.length} Data</span>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-50">
            {isIzinLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : riwayat.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">Belum ada riwayat izin.</p>
              </div>
            ) : (
              riwayat.map((item) => (
                <div key={item.id} className="px-4 py-3.5 sm:px-5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[13px] text-slate-800 truncate">{item.jenis}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize px-2 py-0.5 shrink-0 border ${
                        item.status === "disetujui"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "menunggu"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {item.status === "menunggu" ? "Verifikasi" : item.status}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{item.alasan}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
                    <span>{item.tanggalMulai} – {item.tanggalSelesai}</span>
                    <span>·</span>
                    <span className="text-slate-500">{item.jumlahHari} Hari</span>
                    {item.dokumenNama && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-teal-600">
                          <Paperclip className="w-3 h-3" /> Ada Lampiran
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </MotionFadeUp>
    </MotionStaggerContainer>
  );
}
