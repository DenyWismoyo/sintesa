"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import StorageMeter from "@/components/presensi/dashboard/StorageMeter";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import {
  User,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  LogOut,
  Award,
  IdCard,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  ArrowRight,
  Layers,
  GraduationCap,
  KeyRound,
} from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout } = usePresensiAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/presensi/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Kartu Identitas Digital"
        subtitle="Profil dan informasi resmi ASN Solo Technopark"
      />

      {/* Header Desktop */}
      <div className="hidden md:block px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <IdCard className="w-6 h-6 text-emerald-600" />
          Kartu Identitas Digital Techno Sign
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Data profil dan informasi kepegawaian resmi yang terdaftar di Solo Technopark
        </p>
      </div>

      {/* Techno Sign Digital ID Card */}
      <div className="card-base overflow-hidden bg-white">
        {/* Card Header Pattern */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold tracking-wider uppercase">
                UPTD KST Solo Technopark
              </span>
            </div>
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]">
              PEGAWAI AKTIF
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Avatar
              fallback={user?.nama ? user.nama.substring(0, 2).toUpperCase() : "ST"}
              size="lg"
              className="ring-4 ring-white/20 shadow-lg text-lg bg-emerald-700"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                {user?.nama || "Pegawai Solo Technopark"}
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5 font-mono">
                NIP: {user?.nip || "-"}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {user?.jabatan || "Staf"}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body Data */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Pangkat & Golongan
              </span>
              <div className="font-semibold text-slate-800">
                {user?.golongan || "III/a - Penata Muda"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Peran Sistem
              </span>
              <div className="font-semibold text-slate-800 capitalize">
                {user?.role === "admin"
                  ? "Administrator Techno Sign"
                  : (user?.rankLevel ?? 9) <= 2
                  ? "Pimpinan BLUD"
                  : (user?.rankLevel ?? 9) <= 3
                  ? "Pejabat Teknis"
                  : (user?.rankLevel ?? 9) <= 4
                  ? "Manager / Kepala Divisi"
                  : "Pegawai Pelaksana"}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Instansi / Lembaga
              </span>
              <span className="font-semibold text-slate-800 text-right">
                {user?.instansi || "UPTD KST Solo Technopark"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Kedinasan
              </span>
              <span className="font-semibold text-slate-800">
                {user?.email || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Nomor Kontak WhatsApp
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {user?.nomorHp || "081234567890"}
              </span>
            </div>
          </div>

          {/* Hak Akses Portal & Integrasi Katalog Kawasan (Single Sign-On) */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Hak Akses Portal & Integrasi E-Katalog
              </span>
              {user?.canAccessCatalogAdmin ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5">
                  Admin Katalog Terverifikasi
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-600 border-slate-300 text-[10px]">
                  Pegawai STP
                </Badge>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Peran di Portal Katalog:</span>
                <span className="font-bold text-slate-900 capitalize">
                  {user?.catalogRole || (user?.role === "admin" ? "admin" : "pegawai")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Single Sign-On (SSO):</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Sesi Tersinkronisasi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                Sesi login Techno Sign Anda aktif secara otomatis di seluruh sistem kawasan Solo Technopark tanpa perlu otentikasi berulang.
              </p>
            </div>

            {/* Tombol Bypass Langsung ke Admin Katalog jika memiliki wewenang */}
            {user?.canAccessCatalogAdmin && (
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      Buka Dashboard Admin Sintesa
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Kelola e-katalog, invoice, booking, tenant & event kawasan
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>
            )}

            {/* Menu Pintasan Layanan Kawasan STP */}
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pintasan Menu E-Katalog & Kawasan STP
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all text-xs font-medium"
                >
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">E-Katalog</div>
                    <div className="text-[10px] text-slate-400 truncate">Layanan & Produk</div>
                  </div>
                </Link>

                <Link
                  href="/fasilitas"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all text-xs font-medium"
                >
                  <Building className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">Fasilitas</div>
                    <div className="text-[10px] text-slate-400 truncate">Sewa Ruang & Lab</div>
                  </div>
                </Link>

                <Link
                  href="/lms"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all text-xs font-medium"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">Akademi STP</div>
                    <div className="text-[10px] text-slate-400 truncate">Pelatihan & LMS</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Integrasi Akun Google Katalog */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Integrasi Akun Google (Katalog Sintesa)
              </span>
              {user?.isLinkedGoogle || user?.googleEmail ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                  Terhubung
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 text-[10px]">
                  Belum Ditautkan
                </Badge>
              )}
            </div>

            {user?.isLinkedGoogle || user?.googleEmail ? (
              <div className="text-[11px] text-slate-600 space-y-1">
                <p>
                  Akun Google tertaut: <span className="font-semibold text-slate-800">{user?.googleEmail || user?.email || "-"}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Akun ini disatukan dengan kredensial katalog. Anda dapat login langsung menggunakan tombol Google di Katalog maupun Presensi.
                </p>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Akun ini menggunakan login mandiri kode akses. Anda dapat masuk menggunakan Akun Google di halaman login untuk menyatukan akun ini.
              </div>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-3">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full h-11 text-xs font-semibold shadow-xs rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar dari Akun Techno Sign
            </Button>
          </div>
        </div>
      </div>

      {/* Alokasi Kuota Penyimpanan 1 GB per ASN */}
      <StorageMeter />
    </div>
  );
}
