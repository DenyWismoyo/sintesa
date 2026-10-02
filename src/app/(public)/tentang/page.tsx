// Lokasi file: src/app/(public)/tentang/page.tsx

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2, 
  Target, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Users2, 
  MapPin, 
  Calendar, 
  ArrowUpRight, 
  Phone, 
  Mail, 
  Globe2, 
  Bot, 
  Award,
  Cpu,
  GraduationCap,
  Briefcase,
  Share2
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';

export const metadata: Metadata = {
  title: 'Tentang Kami | Kawasan Sains & Teknologi Solo Technopark',
  description: 'Mengenal KST Solo Technopark: Visi, misi, sejarah perjalanan, klaster fokus inovasi, dan sinergi kolaborasi pentahelix di Kota Surakarta.',
};

const MILESTONES = [
  {
    year: '2006',
    title: 'Inisiasi & Pendirian Kawasan',
    desc: 'Diresmikan sebagai pusat vokasi dan pelatihan industri terpadu untuk pengelasan, manufaktur presisi, dan otomotif di Kota Surakarta.'
  },
  {
    year: '2014',
    title: 'Transformasi Status PPK-BLUD',
    desc: 'Resmi menerapkan Pola Pengelolaan Keuangan Badan Layanan Umum Daerah (PPK-BLUD) untuk fleksibilitas operasional dan kemandirian layanan publik.'
  },
  {
    year: '2021',
    title: 'Akselerasi Digital & Kolaborasi Global',
    desc: 'Revitalisasi infrastruktur digital bekerja sama dengan raksasa teknologi global, meresmikan Shopee Tech Center dan Digital Gaming Hub.'
  },
  {
    year: '2023',
    title: 'Penetapan KST Unggulan Nasional',
    desc: 'Diakui secara resmi sebagai Kawasan Sains dan Teknologi (KST) Percontohan Nasional yang mengintegrasikan inovasi riset dengan pasar industri.'
  },
  {
    year: '2025 - 2026',
    title: 'Era Smart Ecosystem SINTESA',
    desc: 'Peluncuran platform cerdas terpadu SINTESA dengan dukungan Krenova AI Assistant, tata kelola BLUD digital, dan jaringan program kemitraan afiliasi.'
  }
];

const KLASTER_FOKUS = [
  {
    icon: Cpu,
    color: 'from-blue-600 to-indigo-700',
    title: 'Teknologi Informasi & AI',
    desc: 'Pusat riset perangkat lunak, otomatisasi cerdas, kecerdasan buatan, data analytics, dan komputasi awan berstandar global.'
  },
  {
    icon: Layers,
    color: 'from-emerald-600 to-teal-700',
    title: 'Manufaktur & Mekatronika',
    desc: 'Fasilitas permesinan CNC, rekayasa presisi, otomasi industri, robotics, dan rapid prototyping produk perangkat keras.'
  },
  {
    icon: Sparkles,
    color: 'from-violet-600 to-purple-700',
    title: 'Industri Kreatif & Digital Media',
    desc: 'Studio multimedia, animasi 3D, broadcast podcast, studio game development, dan inkubasi talenta kreator konten kreatif.'
  },
  {
    icon: Briefcase,
    color: 'from-amber-600 to-orange-700',
    title: 'Inkubasi Bisnis & Akselerasi Startup',
    desc: 'Pendampingan komprehensif dari tahap ideasi, validasi pasar, legalitas, hingga jejaring pendanaan ventura dan kemitraan strategis.'
  }
];

const PENTAHELIX_ITEMS = [
  {
    label: 'Akademisi & Peneliti',
    role: 'Penyedia riset dasar, inovasi terapan, kurikulum vokasi, dan pengembangan teknologi baru.',
    color: 'border-blue-200 bg-blue-50/50 text-blue-900'
  },
  {
    label: 'Dunia Usaha & Industri',
    role: 'Penyerap talenta terampil, mitra hilirisasi produk, dan investor akselerasi startup.',
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
  },
  {
    label: 'Komunitas & Pengembang',
    role: 'Penggerak gerakan akar rumput, literasi digital publik, dan ekosistem pegiat teknologi.',
    color: 'border-violet-200 bg-violet-50/50 text-violet-900'
  },
  {
    label: 'Pemerintah (Regulator & Fasilitator)',
    role: 'Penyedia kerangka kebijakan, infrastruktur fisik kawasan, dan kepastian regulasi usaha.',
    color: 'border-amber-200 bg-amber-50/50 text-amber-900'
  },
  {
    label: 'Media & Publikasi',
    role: 'Diseminasi dampak inovasi karya anak bangsa kepada publik dan panggung internasional.',
    color: 'border-rose-200 bg-rose-50/50 text-rose-900'
  }
];

export default function TentangPage() {
  return (
    <SectionContainer accent="indigo" width="default">
      <div className="py-6 sm:py-10 space-y-16 sm:space-y-24">

        {/* --- 1. HERO INSTITUSI --- */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-14 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-0 pointer-events-none -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase">
              <Building2 size={13} /> Profil Lembaga PPK-BLUD
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Kawasan Sains & Teknologi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                Solo Technopark
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              KST Solo Technopark adalah Unit Pelaksana Teknis Daerah (UPTD) di bawah naungan Pemerintah Kota Surakarta dengan Pola Pengelolaan Keuangan Badan Layanan Umum Daerah (PPK-BLUD). Berdiri sebagai episentrum pertumbuhan ekonomi baru berbasis ilmu pengetahuan, inovasi terapan, dan kemitraan pentahelix lintas sektor.
            </p>

            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-blue-400">2006</p>
                <p className="text-xs text-slate-400">Tahun Pendirian</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">120+</p>
                <p className="text-xs text-slate-400">Startup Diinkubasi</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">50.000+</p>
                <p className="text-xs text-slate-400">Alumni Pelatihan</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-violet-400">19 Ha</p>
                <p className="text-xs text-slate-400">Kawasan Terintegrasi</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 2. VISI & MISI --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Target size={24} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-200">Visi Utama</h2>
              <p className="text-xl sm:text-2xl font-bold leading-relaxed text-blue-50">
                &ldquo;Menjadi Kawasan Sains dan Teknologi Terkemuka, Mandiri, dan Berdaya Saing Global dalam Pengembangan Inovasi, Kewirausahaan Digital, dan Kolaborasi Berkelanjutan.&rdquo;
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-xs text-blue-200">
              <Award size={16} />
              <span>SK Walikota Surakarta & Standar KST Nasional BRIN</span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Compass size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Misi Strategis</h2>
                  <h3 className="text-xl font-bold text-slate-900">4 Langkah Mewujudkan Kawasan Berkelanjutan</h3>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  'Menyelenggarakan pelatihan vokasi industri dan kejuruan presisi berstandar kompetensi global.',
                  'Mengembangkan dan mengakselerasi ekosistem startup teknologi melalui inkubasi terstruktur dan akses modal.',
                  'Menyediakan infrastruktur co-working, riset pengujian produk, prototyping, dan fasilitas modern berdaya guna.',
                  'Memperkuat sinergi kemitraan pentahelix antara Akademisi, Industri, Komunitas, Pemerintah, dan Media.'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- 3. 4 KLASTER FOKUS KAWASAN --- */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Pilar Keunggulan</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">4 Klaster Fokus Layanan & Riset</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Menyelaraskan kebutuhan industri masa kini melalui konsentrasi keilmuan dan infrastruktur laboratorium berstandar industri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {KLASTER_FOKUS.map((klaster, idx) => {
              const Icon = klaster.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${klaster.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{klaster.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{klaster.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>Fasilitas Lengkap</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- 4. TIMELINE MILESTONE SEJARAH --- */}
        <section className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/70 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Jejak Langkah</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Perjalanan Sejarah 2 Dekade</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Transformasi berkesinambungan dari pusat pelatihan vokasi daerah hingga menjadi rujukan Kawasan Sains dan Teknologi Nasional.
            </p>
          </div>

          <div className="relative border-l-2 border-indigo-200 ml-4 sm:ml-32 space-y-8">
            {MILESTONES.map((item, idx) => (
              <div key={idx} className="relative pl-6 sm:pl-8 group">
                {/* Node Bullet */}
                <span className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-indigo-600 shadow-xs group-hover:scale-125 transition-transform" />
                
                <div className="sm:absolute sm:-left-32 sm:top-1 text-xs sm:text-sm font-black text-indigo-700 w-24">
                  {item.year}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 5. KOLABORASI PENTAHELIX --- */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Sinergi Kawasan</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Ekosistem Kolaborasi Pentahelix</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Inovasi tidak lahir dari satu pihak sendirian. Solo Technopark menyatukan lima komponen penting untuk menciptakan dampak nyata bagi bangsa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PENTAHELIX_ITEMS.map((item, idx) => (
              <div 
                key={idx}
                className={`rounded-2xl p-5 border ${item.color} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Pilar 0{idx + 1}</span>
                    <Users2 size={16} />
                  </div>
                  <h4 className="text-sm font-bold mb-1.5">{item.label}</h4>
                  <p className="text-xs opacity-90 leading-relaxed">{item.role}</p>
                </div>
              </div>
            ))}
            
            {/* Kartu CTA Pentahelix Tambahan */}
            <div className="rounded-2xl p-5 border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-950 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 uppercase">Jadilah Bagian</span>
                <h4 className="text-sm font-bold mt-1 mb-1.5">Siap Berkolaborasi?</h4>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Kami membuka pintu seluas-luasnya bagi universitas, korporasi, dan lembaga untuk bermitra dalam riset bersama.
                </p>
              </div>
              <Link 
                href="/fasilitas" 
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Jajaki Kerjasama <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* --- 6. LOKASI, KONTAK & AKSESIBILITAS --- */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Akses & Lokasi</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kunjungi Kawasan Kami</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Berlokasi strategis di pusat sentra pendidikan tinggi Kota Surakarta, dekat dengan stasiun kereta api dan terintegrasi jaringan transportasi publik ramah lingkungan.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <MapPin size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Alamat Kantor Pusat</p>
                    <p className="text-xs text-slate-600">Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Phone size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Telepon & Layanan Informasi</p>
                    <p className="text-xs text-slate-600">(0271) 666628 · Jam Operasional: Senin - Jumat (08.00 - 16.00 WIB)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mail size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Surel Resmi</p>
                    <p className="text-xs text-slate-600">sekretariat@solotechnopark.id · humas@solotechnopark.id</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/peta-kawasan"
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <MapPin size={14} /> Buka Peta Kawasan Interaktif
                </Link>
                <Link
                  href="/explore"
                  className="px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Bot size={14} /> Panduan AI Kawasan
                </Link>
              </div>
            </div>

            {/* Visual Box Peta / Aksesibilitas */}
            <div className="lg:col-span-6 bg-slate-100 rounded-3xl p-6 border border-slate-200 text-center relative overflow-hidden">
              <div className="aspect-video w-full rounded-2xl bg-slate-200 flex flex-col items-center justify-center p-6 border border-slate-300/60 relative">
                <MapPin size={36} className="text-rose-500 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-800">KST Solo Technopark</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Surakarta, Jawa Tengah (7°33&apos;22.4&quot;S 110°51&apos;18.8&quot;E)
                </p>
                <a
                  href="https://maps.google.com/?q=Solo+Technopark"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                >
                  Buka di Google Maps <ArrowUpRight size={13} />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Transit terdekat: Halte BST Solo Technopark & Stasiun Solo Jebres (5 menit)
              </p>
            </div>
          </div>
        </section>

        {/* --- 7. CTA BOTTOM BANNER --- */}
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Siap Bertumbuh Bersama Ekosistem Inovasi Solo Technopark?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
              Tingkatkan kompetensi Anda melalui pelatihan industri, manfaatkan fasilitas modern kawasan, atau bermitra menghasilkan komisi berkelanjutan.
            </p>
            
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/program-pelatihan"
                className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <GraduationCap size={15} /> Daftar Pelatihan
              </Link>
              <Link
                href="/fasilitas"
                className="px-6 py-3 rounded-full bg-blue-600/60 hover:bg-blue-600 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Building2 size={15} /> Peminjaman Ruang
              </Link>
              <Link
                href="/profil"
                className="px-6 py-3 rounded-full bg-violet-600/60 hover:bg-violet-600 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Share2 size={15} /> Gabung Program Mitra
              </Link>
            </div>
          </div>
        </section>

      </div>
    </SectionContainer>
  );
}
