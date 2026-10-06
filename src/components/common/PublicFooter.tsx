// Lokasi file: src/components/common/PublicFooter.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  ArrowUpRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full bg-slate-900 text-white border-t border-slate-800 mt-auto">
      {/* Background Glow Aksen Halus */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-sky-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-32 bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-slate-800/80">
          
          {/* Kolom 1 & 2: Identitas Kawasan & Kontak Resmi */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                <Image 
                  src="/logo.png" 
                  alt="Solo Technopark" 
                  width={40} 
                  height={40} 
                  className="h-8 w-auto object-contain brightness-0 invert" 
                />
              </div>
              <div>
                <span className="text-base font-black tracking-wider text-slate-100 block">
                  SOLO TECHNOPARK
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-400 block uppercase">
                  Kawasan Sains & Teknologi Terpadu
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Pusat vokasi industri, akselerasi riset terapan, dan ekosistem inkubasi bisnis rintisan (startup) 
              berstandar global yang dikelola sebagai Badan Layanan Umum Daerah (BLUD) Kota Surakarta.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-sky-400 shrink-0 mt-0.5" />
                <span>Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-amber-400 shrink-0" />
                <span>Layanan Kantor: Senin – Jumat, 08.00 – 16.30 WIB</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-emerald-400 shrink-0" />
                <span>info@solotechnopark.id</span>
              </div>
            </div>
          </div>

          {/* Kolom 3: Layanan Publik & Fasilitas */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Building2 size={14} className="text-sky-400" />
              Layanan Kawasan
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/fasilitas" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Sewa Fasilitas & Ruangan
                </Link>
              </li>
              <li>
                <Link href="/e-katalog" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  E-Katalog Produk & Inovasi
                </Link>
              </li>
              <li>
                <Link href="/program-pelatihan" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Akademi & Pelatihan Vokasi
                </Link>
              </li>
              <li>
                <Link href="/karir" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Bursa Karir & Talenta Alumni
                </Link>
              </li>
              <li>
                <Link href="/event" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Agenda Event & Workshop
                </Link>
              </li>
              <li>
                <Link href="/peta-kawasan" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Peta Navigasi Kawasan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Ekosistem & Warta */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Inovasi & Warta
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/ekosistem" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Direktori Startup & Tenant
                </Link>
              </li>
              <li>
                <Link href="/artikel" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Warta & Artikel Teknologi
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Asisten AI Krenova
                </Link>
              </li>
              <li>
                <Link href="/ruang-belajar" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  LMS Ruang Belajar
                </Link>
              </li>
              <li>
                <Link href="/profil" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Program Kemitraan Afiliasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Bantuan & Akun */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Bantuan & Kebijakan
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/faq" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Pusat Bantuan & FAQ
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Profil Lembaga & Visi
                </Link>
              </li>
              <li>
                <Link href="/bukti-bayar" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Konfirmasi Pembayaran
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Portal Masuk Pegawai/Tenant
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all">
                  Login Sistem
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} Kawasan Sains & Teknologi Solo Technopark. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/tentang" className="hover:text-slate-200 transition-colors">Tentang Kawasan</Link>
            <span className="text-slate-700">•</span>
            <Link href="/faq" className="hover:text-slate-200 transition-colors">Bantuan</Link>
            <span className="text-slate-700">•</span>
            <Link href="/peta-kawasan" className="hover:text-slate-200 transition-colors">Peta STP</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
