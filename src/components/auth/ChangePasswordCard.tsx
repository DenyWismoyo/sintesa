// Lokasi file: src/components/auth/ChangePasswordCard.tsx
'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { toast } from 'sonner';
import {
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordCardProps {
  className?: string;
  onSuccess?: () => void;
}

export default function ChangePasswordCard({
  className = '',
  onSuccess,
}: ChangePasswordCardProps) {
  const user = auth.currentUser;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Periksa apakah user login dengan provider kata sandi
  const isPasswordProvider = user?.providerData?.some(
    (p) => p.providerId === 'password'
  );

  if (!user) {
    return null;
  }

  if (!isPasswordProvider) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs ${className}`}>
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Metode Autentikasi Eksternal</span>
        </div>
        <p>
          Akun Anda terhubung melalui Single Sign-On (Google). Manajemen kata sandi dikelola langsung oleh akun Google Anda.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.email) {
      toast.error('Akun pengguna tidak ditemukan.');
      return;
    }

    if (!currentPassword) {
      toast.error('Masukkan kata sandi saat ini.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('Kata sandi baru harus berbeda dari kata sandi saat ini.');
      return;
    }

    setLoading(true);
    try {
      // 1. Re-autentikasi pengguna
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Perbarui kata sandi baru
      await updatePassword(user, newPassword);

      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Kata sandi berhasil diperbarui!', {
        description: 'Gunakan kata sandi baru untuk sesi masuk berikutnya.',
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Kata sandi saat ini salah.');
      } else if (code === 'auth/weak-password') {
        toast.error('Kata sandi baru terlalu lemah. Gunakan kombinasi huruf dan angka.');
      } else if (code === 'auth/requires-recent-login') {
        toast.error('Sesi autentikasi telah berakhir. Silakan keluar dan masuk kembali.');
      } else {
        toast.error('Gagal memperbarui kata sandi.', {
          description: err?.message || 'Terjadi kesalahan sistem.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xs ${className}`}>
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Keamanan Akun & Kata Sandi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui kata sandi secara berkala untuk menjaga keamanan data profil dan akses layanan Anda.
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Kata sandi berhasil diubah! Akun Anda kini terlindungi dengan kredensial baru.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {/* Sandi Saat Ini */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">
            Kata Sandi Saat Ini <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi saat ini / sementara"
              required
              className="pl-10 pr-10 h-11 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sandi Baru */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="pl-10 pr-10 h-11 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Sandi Baru */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                minLength={6}
                className="pl-10 pr-10 h-11 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 transition-all cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>{loading ? 'Memproses...' : 'Ubah Kata Sandi'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

