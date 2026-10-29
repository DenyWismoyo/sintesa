// Lokasi file: src/app/(admin)/pengaturan/components/TabNotifikasiEmail.tsx
'use client';

import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  Send,
  RefreshCw,
  Loader2,
  Server,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { authService } from '@/services/auth.service';

const AUTOMATION_TRIGGERS = [
  { code: 'WELCOME_VERIFICATION', title: 'Pendaftaran & Verifikasi Email User', target: 'Pengguna Baru (Email / Google)' },
  { code: 'PASSWORD_RESET', title: 'Pemulihan / Atur Ulang Kata Sandi', target: 'Semua Akun Terdaftar' },
  { code: 'ALUMNI_CLAIMED', title: 'Aktivasi Status Alumni Terverifikasi', target: 'Lulusan STP Vokasi & RSKB Surakarta' },
  { code: 'PARTNER_ONBOARDED', title: 'Aktivasi Akun & Kredensial Mitra Industri', target: 'PIC Perusahaan Mitra Resmi' },
  { code: 'ROLE_PROMOTED', title: 'Pembaruan Otorisasi Peran (RBAC)', target: 'Admin, Staf, & Tenant' },
  { code: 'TRAINING_REGISTRATION', title: 'Konfirmasi Registrasi Pelatihan / Diklat', target: 'Peserta Akademi LMS' },
  { code: 'BOOKING_CONFIRMATION', title: 'Konfirmasi Reservasi Ruangan & Aset', target: 'Penyewa Sarana Kawasan' },
  { code: 'INVOICE_NOTIFICATION', title: 'Penerbitan Tagihan Layanan & E-Katalog', target: 'Pelanggan / Instansi' },
  { code: 'PAYMENT_RECEIPT', title: 'Kuitansi Resmi Pembayaran Lunas', target: 'Pelanggan Terverifikasi Kasir' },
];

export default function TabNotifikasiEmail() {
  const { user } = useAuth();
  const [targetEmail, setTargetEmail] = useState(user?.email || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{
    verified: boolean;
    host: string;
    port: number;
    fromAddress: string;
    messageId?: string | null;
    error?: string | null;
  } | null>(null);

  const handleVerifySmtp = async () => {
    setIsChecking(true);
    try {
      const res = await authService.testSmtpConfiguration({ sendTestMail: false });
      setStatusInfo({
        verified: res.diagnostics.verified,
        host: res.diagnostics.host,
        port: res.diagnostics.port,
        fromAddress: res.diagnostics.fromAddress,
        error: res.diagnostics.error || null,
      });
      if (res.diagnostics.verified) {
        toast.success('Koneksi SMTP Hostinger Aktif & Terverifikasi!');
      } else {
        toast.warning('Koneksi SMTP belum terverifikasi', { description: res.diagnostics.error });
      }
    } catch (err: any) {
      toast.error('Gagal memeriksa koneksi SMTP', { description: err?.message });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    setIsSending(true);
    try {
      const res = await authService.testSmtpConfiguration({
        sendTestMail: true,
        targetEmail: targetEmail.trim(),
      });
      setStatusInfo({
        verified: res.diagnostics.verified,
        host: res.diagnostics.host,
        port: res.diagnostics.port,
        fromAddress: res.diagnostics.fromAddress,
        messageId: res.messageId,
        error: res.error,
      });
      if (res.success) {
        toast.success('Email Uji Coba Berhasil Dikirim!', {
          description: `Dikirim ke ${targetEmail.trim()} dari ${res.diagnostics.fromAddress}.`,
        });
      } else {
        toast.error('Pengiriman email gagal', { description: res.error || 'Periksa konfigurasi SMTP.' });
      }
    } catch (err: any) {
      toast.error('Gagal mengirim email uji coba', { description: err?.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Kartu Status Konfigurasi Hostinger SMTP */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
            <ShieldCheck size={14} />
            <span>Hostinger Corporate Mail (SSL/TLS Port 465)</span>
          </div>
          <h3 className="text-lg font-black text-slate-900">Server Notifikasi Email Resmi Solo Technopark</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Seluruh email konfirmasi pendaftaran, verifikasi akun, klaim alumni, dan aktivasi kemitraan dikirim melalui server resmi <strong>marketing@solotechnopark.id</strong> (`smtp.hostinger.com`).
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <Server size={13} className="text-blue-600" />
              smtp.hostinger.com:465
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <Mail size={13} className="text-emerald-600" />
              marketing@solotechnopark.id
            </span>
            <a
              href="https://mail.hostinger.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              <span>Buka Webmail Hostinger</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={isChecking}
            onClick={handleVerifySmtp}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            {isChecking ? <Loader2 size={15} className="animate-spin text-blue-600" /> : <RefreshCw size={15} />}
            <span>Cek Kesehatan Koneksi SMTP</span>
          </button>
        </div>
      </div>

      {/* Hasil Diagnostik Live */}
      {statusInfo && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 ${
            statusInfo.verified
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusInfo.verified ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-black">
              {statusInfo.verified
                ? `Terhubung ke ${statusInfo.host}:${statusInfo.port} sebagai ${statusInfo.fromAddress}`
                : `Koneksi gagal: ${statusInfo.error || 'Periksa kredensial SMTP di Cloud Functions'}`}
            </p>
            {statusInfo.messageId && (
              <p className="font-mono text-[11px] opacity-80">Message-ID Terakhir: {statusInfo.messageId}</p>
            )}
          </div>
        </div>
      )}

      {/* Form Pengiriman Email Uji Coba */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-900">Kirim Email Uji Coba (Live Test)</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan email resmi tidak masuk ke folder spam dan tata letak template tampil sempurna di perangkat penerima.
          </p>
        </div>
        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="Masukkan alamat email tujuan uji coba..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-sm font-semibold outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !targetEmail.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            <span>{isSending ? 'Mengirim...' : 'Kirim Email Uji Coba'}</span>
          </button>
        </form>
      </div>

      {/* Daftar Otomatisasi Siklus Hidup Email */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-slate-900">9 Kanal Otomatisasi Email Transaksional Aktif</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUTOMATION_TRIGGERS.map((item) => (
            <div key={item.code} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {item.code}
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Aktif</span>
              </div>
              <p className="text-xs font-black text-slate-800">{item.title}</p>
              <p className="text-[11px] text-slate-500 font-medium">Penerima: {item.target}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

