// src/app/(presensi)/presensi/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  LogOut,
  RefreshCw,
  UserCheck,
} from "lucide-react";

export default function PresensiLoginPage() {
  const router = useRouter();
  const {
    user,
    firebaseUser,
    loginWithCredentials,
    loginGoogle,
    syncWithEmployeeProfile,
    logout,
    isLoading,
  } = usePresensiAuth();

  const [nipOrEmail, setNipOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [syncCode, setSyncCode] = useState("");
  const [syncPassword, setSyncPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika user sudah memiliki profil pegawai terdaftar, redirect langsung ke dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/presensi");
    }
  }, [isLoading, user, router]);

  // Mode Sinkronisasi aktif jika user sudah login via Google tetapi belum ditautkan ke data pegawai
  const isSyncMode = Boolean(firebaseUser && !user && !isLoading);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!nipOrEmail) {
      setErrorMsg("Kode Akses, NIP, atau Email kedinasan wajib diisi.");
      return;
    }
    if (!password) {
      setErrorMsg("Kata sandi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithCredentials(nipOrEmail, password);
      router.push("/presensi");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setErrorMsg("Kata sandi salah. Silakan coba lagi.");
      } else if (msg.includes("user-not-found") || msg.includes("invalid-email")) {
        setErrorMsg("Akun tidak ditemukan. Gunakan Kode Akses (misal: STP-22757) atau email kedinasan.");
      } else {
        setErrorMsg(msg || "Gagal melakukan autentikasi. Periksa kredensial Anda.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const result = await loginGoogle();
      if (result?.profile) {
        // Akun Google sudah disinkronkan sebelumnya, langsung masuk
        router.push("/presensi");
      }
      // Jika profile null, isSyncMode otomatis menjadi true via state firebaseUser
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (msg.includes("popup-closed-by-user")) {
        // Pengguna menutup popup Google
      } else {
        setErrorMsg("Gagal login dengan Google: " + msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!syncCode.trim()) {
      setErrorMsg("Kode Akses atau NIP pegawai wajib diisi.");
      return;
    }
    if (!syncPassword) {
      setErrorMsg("Kata sandi presensi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await syncWithEmployeeProfile(syncCode.trim(), syncPassword);
      setSuccessMsg(`Berhasil! Akun Google Anda kini disatukan dengan ${profile.nama} (${profile.jabatan}).`);
      setTimeout(() => {
        router.push("/presensi");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Validasi gagal. Pastikan Kode Akses dan Kata Sandi benar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillSync = (emailOrCode: string) => {
    setSyncCode(emailOrCode);
    setSyncPassword("StpUser2026!");
  };

  const handleQuickLogin = async (emailOrCode: string) => {
    setNipOrEmail(emailOrCode);
    setPassword("StpUser2026!");
    setIsSubmitting(true);
    try {
      await loginWithCredentials(emailOrCode, "StpUser2026!");
      router.push("/presensi");
    } catch (err: unknown) {
      setErrorMsg(`Quick Login gagal: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-slate-900 relative overflow-hidden antialiased selection:bg-emerald-600 selection:text-white">
      {/* Background Ambience khas katalog Solo Technopark */}
      <div className="public-bg-dots" />
      <div className="public-glow-emerald" />
      <div className="public-bg-gradient-top" />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
              Techno Sign
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Solo Technopark
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5 bg-white/80 hover:bg-white border border-slate-200/80 shadow-xs rounded-xl px-3.5 py-2 font-medium"
        >
          <span>Katalog Utama</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </header>

      {/* Main Login / Sync Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-0 sm:px-4 py-3 sm:py-6">
        <div className="card-base overflow-hidden bg-white/95 backdrop-blur-xl p-4 sm:p-6 text-slate-900">
          <div className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isSyncMode ? "Validasi Pegawai STP" : "Masuk Pegawai"}
              </h2>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSO Terintegrasi</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {isSyncMode
                ? "Tautkan akun Google Anda dengan identitas pegawai resmi Solo Technopark"
                : "Gunakan Akun Google (Katalog) atau Kode Akses Solo Technopark"}
            </p>
          </div>

          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* JIKA DALAM MODE SINKRONISASI AKUN GOOGLE */}
            {isSyncMode ? (
              <div className="space-y-4">
                {/* Info Akun Google yang Aktif */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {firebaseUser?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firebaseUser.photoURL}
                        alt="Avatar Google"
                        className="w-9 h-9 rounded-full border border-slate-200 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {firebaseUser?.displayName?.charAt(0) || "G"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {firebaseUser?.displayName || "Pengguna Google"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {firebaseUser?.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                    Belum Tertaut
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                  Masukkan <strong>Kode Akses / NIP / Username</strong> dan <strong>Kata Sandi Presensi</strong> Anda satu kali saja untuk menyatukan akun Google ini menjadi <strong>1 akun yang sama</strong> (dapat dipakai untuk operasional Katalog dan Presensi).
                </div>

                {/* FORM VALIDASI SINKRONISASI */}
                <form onSubmit={handleSyncSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="syncCode" className="text-xs font-semibold text-slate-700">
                      Kode Akses / NIP / Username Presensi
                    </Label>
                    <Input
                      id="syncCode"
                      type="text"
                      placeholder="Contoh: STP-22757 atau agus.jatmiko@solotechnopark.id"
                      value={syncCode}
                      onChange={(e) => setSyncCode(e.target.value)}
                      className="bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/10 text-sm h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="syncPassword" className="text-xs font-semibold text-slate-700">
                      Kata Sandi Presensi
                    </Label>
                    <div className="relative">
                      <Input
                        id="syncPassword"
                        type="password"
                        placeholder="••••••••••••"
                        value={syncPassword}
                        onChange={(e) => setSyncPassword(e.target.value)}
                        className="bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/10 text-sm h-11 pr-10 rounded-xl"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all rounded-xl mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyatukan Akun...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        <span>Validasi & Satukan Akun</span>
                      </span>
                    )}
                  </Button>
                </form>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Gunakan Akun Google Lain</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAMPILAN UTAMA LOGIN */
              <>
                {/* OPSI 1: LOGIN GOOGLE SSO UTAMA */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-200 shadow-xs flex items-center justify-center gap-2.5 transition-all rounded-xl cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Akun Google (Katalog)</span>
                </Button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
                      atau gunakan kredensial presensi
                    </span>
                  </div>
                </div>

                {/* FORM LOGIN MANUAL KREDENSIAL MOCK / NIP */}
                <form onSubmit={handleManualLogin} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="nip" className="text-xs font-semibold text-slate-700">
                      Kode Akses / Email / NIP
                    </Label>
                    <Input
                      id="nip"
                      type="text"
                      placeholder="Contoh: STP-22757 atau email pegawai"
                      value={nipOrEmail}
                      onChange={(e) => setNipOrEmail(e.target.value)}
                      className="bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/10 text-sm h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Kata Sandi Presensi
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/10 text-sm h-11 pr-10 rounded-xl"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all rounded-xl mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memproses...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>Masuk ke Presensi</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 mt-2 p-3 sm:p-4">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {isSyncMode ? "Isi Otomatis Kredensial Uji Coba:" : "Akses Cepat Pengembang (Dev Mode):"}
                  </p>
                  <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                    DEV ONLY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isSyncMode
                        ? handleQuickFillSync("agus.jatmiko@solotechnopark.id")
                        : handleQuickLogin("agus.jatmiko@solotechnopark.id")
                    }
                    className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-400/50 transition-all cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      Kepala Divisi IT
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">Agus Jatmiko, S.Kom</p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isSyncMode
                        ? handleQuickFillSync("admin.blud@solotechnopark.id")
                        : handleQuickLogin("admin.blud@solotechnopark.id")
                    }
                    className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-400/50 transition-all cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      Admin BLUD
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">Pusat Kendali STP</p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isSyncMode
                        ? handleQuickFillSync("yudit.cahyantoro@solotechnopark.id")
                        : handleQuickLogin("yudit.cahyantoro@solotechnopark.id")
                    }
                    className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-400/50 transition-all cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      Pemimpin BLUD
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">Yudit C. N. Saputro</p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isSyncMode
                        ? handleQuickFillSync("restu.choiri@solotechnopark.id")
                        : handleQuickLogin("restu.choiri@solotechnopark.id")
                    }
                    className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-400/50 transition-all cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      Staf IT & Pegawai
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">M. Restu Choiri</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 mt-2 p-3 sm:p-4 text-center">
              <p className="text-[11px] text-slate-400 w-full">
                Kendala akses akun? Hubungi Sub Bagian Tata Usaha / IT Solo Technopark.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 Techno Sign • UPTD Kawasan Sains dan Teknologi Solo Technopark</p>
      </footer>
    </main>
  );
}
