// src/app/(presensi)/presensi/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function PresensiLoginPage() {
  const router = useRouter();
  const { loginWithCredentials, loginGoogle, isLoading } = usePresensiAuth();
  const [nipOrEmail, setNipOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!nipOrEmail) {
      setErrorMsg("NIP, Access Code, atau Email kedinasan wajib diisi.");
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
        setErrorMsg("Akun tidak ditemukan. Gunakan Access Code (misal: STP-22757) atau email kedinasan.");
      } else {
        setErrorMsg(msg || "Gagal melakukan autentikasi. Periksa kredensial Anda.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await loginGoogle();
      router.push("/presensi");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (msg.includes("popup-closed-by-user")) {
        // Abaikan jika user menutup popup sendiri
      } else {
        setErrorMsg("Gagal login dengan Google: " + msg);
      }
    } finally {
      setIsSubmitting(false);
    }
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
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/30 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                TECHNO SIGN
              </span>
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.2">
                PRO
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              UPTD KST Solo Technopark
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5"
        >
          <span>Katalog Utama</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6">
        <Card className="bg-slate-900/90 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-emerald-950/40 text-slate-100">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight text-white">
                Masuk ke Presensi
              </CardTitle>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SSO Terintegrasi</span>
              </div>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Gunakan Akun Google Kedinasan atau Access Code Pegawai Solo Technopark
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OPSI 1: LOGIN GOOGLE SSO */}
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isLoading}
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold border-slate-200 shadow-md flex items-center justify-center gap-2.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Masuk dengan Google (@solotechnopark.id)</span>
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">
                  atau gunakan kredensial pegawai
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORM LOGIN MANUAL */}
            <form onSubmit={handleManualLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="nip" className="text-xs font-medium text-slate-300">
                  Access Code / Email / NIP
                </Label>
                <Input
                  id="nip"
                  type="text"
                  placeholder="Contoh: STP-22757 atau email kedinasan"
                  value={nipOrEmail}
                  onChange={(e) => setNipOrEmail(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm h-10 pr-9"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/25 transition-all mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Masuk ke Sistem
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-0 border-t border-slate-800/60 mt-3 p-4">
            <div className="w-full">
              <p className="text-[11px] text-slate-400 font-medium mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Akses Demo Cepat Solo Technopark:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("yudit.cahyantoro@solotechnopark.id")}
                  className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/40 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-white truncate">Pemimpin BLUD</p>
                  <p className="text-[9px] text-slate-400 truncate">Yudit C. N. Saputro</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("agus.jatmiko@solotechnopark.id")}
                  className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/40 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-white truncate">Kepala Divisi IT</p>
                  <p className="text-[9px] text-slate-400 truncate">Agus Jatmiko, S.Kom</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin.blud@solotechnopark.id")}
                  className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/40 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-white truncate">Admin BLUD</p>
                  <p className="text-[9px] text-slate-400 truncate">Pusat Kendali STP</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("restu.choiri@solotechnopark.id")}
                  className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/40 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-white truncate">Staf IT & Pegawai</p>
                  <p className="text-[9px] text-slate-400 truncate">M. Restu Choiri</p>
                </button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
        <p>© 2026 UPTD Kawasan Sains dan Teknologi Solo Technopark. Terintegrasi Katalog Digital BLUD.</p>
      </footer>
    </main>
  );
}
