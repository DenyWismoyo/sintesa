// src/app/(public)/karir/components/TrainingProgramSelector.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  X,
  ChevronDown,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Layers,
  Wrench,
  Code2,
  Brain,
  Shield,
  Palette,
  TrendingUp,
} from 'lucide-react';

export interface TrainingProgramItem {
  id: string;
  name: string;
  cluster: string;
  clusterKey: 'manufaktur' | 'it' | 'ai' | 'cyber' | 'multimedia' | 'bisnis' | 'lainnya';
  skills: string[];
  description?: string;
}

// Master Katalog Program Pelatihan Resmi Solo Technopark
export const STP_MASTER_TRAINING_PROGRAMS: TrainingProgramItem[] = [
  // ── 1. Manufaktur, Mekatronika & Pengelasan ──
  {
    id: 'underwater-welding',
    name: 'Diklat Underwater Wet Welding (Pengelasan Bawah Air)',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['Underwater Welding', 'Diving', 'Subsea Welding', 'SMAW Wet'],
    description: 'Sertifikasi komersial penyelaman & pengelasan basah bawah air standar internasional.',
  },
  {
    id: 'welder-6g',
    name: 'Sertifikasi Juru Las (Welder) 6G Standar Migas & Marine',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['Welding 6G', 'Piping', 'GTAW / TIG', 'SMAW', 'FCAW'],
    description: 'Kualifikasi pengelasan pipa posisi 6G untuk konstruksi offshore, migas, dan perkapalan.',
  },
  {
    id: 'welder-3g-4g',
    name: 'Pelatihan Juru Las (Welder) 3G / 4G Pelat & Pipa',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['Welding 3G', 'Welding 4G', 'SMAW', 'GMAW / MIG', 'Fabrikasi'],
    description: 'Pelatihan pengelasan posisi pelat & pipa standar BNSP dan IIW.',
  },
  {
    id: 'cnc-milling-bubut',
    name: 'Pelatihan Operator & Pemrograman Mesin CNC Milling & Bubut 5-Axis',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['CNC Milling', 'CNC Bubut', 'G-Code', '5-Axis', 'Presisi Tinggi'],
    description: 'Pengoperasian & pemrograman mesin perkakas CNC berteknologi tinggi.',
  },
  {
    id: 'cad-cam-mastercam',
    name: 'Pelatihan Desain Manufaktur CAD / CAM (Mastercam & SolidWorks)',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['CAD / CAM', 'Mastercam', 'SolidWorks', 'Desain Mesin', 'Toolpath'],
    description: 'Perancangan mekanik 3D dan pembuatan jalur pahat perkakas manufaktur.',
  },
  {
    id: 'otomasi-plc',
    name: 'Pelatihan Otomasi Industri PLC & Sensor Smart Factory',
    cluster: 'Manufaktur, Mekatronika & Pengelasan',
    clusterKey: 'manufaktur',
    skills: ['PLC Omron / Siemens', 'SCADA', 'Sensor Industri', 'Pneumatik', 'Otomasi'],
    description: 'Pengendalian logika terprogram (PLC) dan sistem otomasi lini manufaktur cerdas.',
  },

  // ── 2. IT, Rekayasa Perangkat Lunak & Cloud ──
  {
    id: 'fullstack-web',
    name: 'Bootcamp Fullstack Web Developer (Next.js & TypeScript)',
    cluster: 'IT & Rekayasa Perangkat Lunak',
    clusterKey: 'it',
    skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    description: 'Pengembangan aplikasi web modern end-to-end dengan stack enterprise.',
  },
  {
    id: 'frontend-modern',
    name: 'Pelatihan Frontend Modern UI & Mobile Web Application',
    cluster: 'IT & Rekayasa Perangkat Lunak',
    clusterKey: 'it',
    skills: ['React', 'Vue', 'Tailwind CSS', 'Mobile Responsive', 'UI Engineering'],
    description: 'Perancangan antarmuka pengguna interaktif, cepat, dan responsif lintas perangkat.',
  },
  {
    id: 'software-qa',
    name: 'Bootcamp Software Quality Assurance & Automation Testing',
    cluster: 'IT & Rekayasa Perangkat Lunak',
    clusterKey: 'it',
    skills: ['QA Testing', 'Selenium', 'Cypress', 'Playwright', 'API Testing', 'Postman'],
    description: 'Pengujian kualitas sistem, penulisan test case manual, dan automasi end-to-end.',
  },
  {
    id: 'network-cloud',
    name: 'Administrasi Jaringan Komputer, Cisco & Cloud Infrastructure',
    cluster: 'IT & Rekayasa Perangkat Lunak',
    clusterKey: 'it',
    skills: ['Cisco CCNA', 'MikroTik', 'AWS / GCP Cloud', 'Linux Sysadmin', 'Routing'],
    description: 'Konfigurasi infrastruktur jaringan, server Linux, dan layanan cloud enterprise.',
  },

  // ── 3. Kecerdasan Buatan & Sains Data ──
  {
    id: 'ai-computer-vision',
    name: 'Pelatihan Artificial Intelligence & Computer Vision',
    cluster: 'Kecerdasan Buatan & Sains Data',
    clusterKey: 'ai',
    skills: ['Python', 'Computer Vision', 'PyTorch', 'OpenCV', 'Deep Learning', 'YOLO'],
    description: 'Penerapan model kecerdasan buatan, visi komputer, dan sistem deteksi visual.',
  },
  {
    id: 'data-science-ml',
    name: 'Bootcamp Data Science & Machine Learning Engineer',
    cluster: 'Kecerdasan Buatan & Sains Data',
    clusterKey: 'ai',
    skills: ['Machine Learning', 'Python Pandas', 'Scikit-learn', 'Data Modeling', 'SQL'],
    description: 'Pengolahan big data, pemodelan prediktif machine learning, dan visualisasi data.',
  },
  {
    id: 'data-analytics-bi',
    name: 'Pelatihan Data Analytics & Business Intelligence (Power BI)',
    cluster: 'Kecerdasan Buatan & Sains Data',
    clusterKey: 'ai',
    skills: ['Power BI', 'Tableau', 'SQL Query', 'Dashboard KPI', 'Excel Advanced'],
    description: 'Analisis tren bisnis dan visualisasi metrik performa operasional kawasan.',
  },

  // ── 4. Keamanan Siber (Cyber Security) ──
  {
    id: 'cyber-security-defense',
    name: 'Pelatihan Cyber Security Defense & Ethical Hacking',
    cluster: 'Keamanan Siber (Cyber Security)',
    clusterKey: 'cyber',
    skills: ['Ethical Hacking', 'Penetration Testing', 'Kali Linux', 'Vulnerability Scan'],
    description: 'Uji penetrasi keamanan siber, audit kerentanan sistem, dan mitigasi serangan jaringan.',
  },
  {
    id: 'soc-analyst',
    name: 'Bootcamp Security Operation Center (SOC) Analyst',
    cluster: 'Keamanan Siber (Cyber Security)',
    clusterKey: 'cyber',
    skills: ['SOC Tier 1', 'SIEM', 'Splunk', 'Incident Response', 'Threat Hunting'],
    description: 'Pemantauan insiden keamanan siber realtime, analisis log, dan respon ancaman.',
  },

  // ── 5. Multimedia, Game & Animasi 3D ──
  {
    id: '3d-modeling-animation',
    name: 'Bootcamp 3D Modeling & Animation (Blender & Maya)',
    cluster: 'Multimedia, Game & Animasi 3D',
    clusterKey: 'multimedia',
    skills: ['Blender', 'Maya', '3D Modeling', 'Rigging', 'Texturing', 'Substance Painter'],
    description: 'Pembuatan aset karakter 3D, lingkungan game, dan animasi gerak berkualitas tinggi.',
  },
  {
    id: 'game-development',
    name: 'Pelatihan Game Development (Unity & Unreal Engine)',
    cluster: 'Multimedia, Game & Animasi 3D',
    clusterKey: 'multimedia',
    skills: ['Unity Engine', 'C# Scripting', 'Unreal Engine', 'Game Mechanics', 'Shader'],
    description: 'Pemrograman logika permainan, integrasi aset, dan publikasi game PC/Mobile.',
  },
  {
    id: 'desain-grafis-motion',
    name: 'Pelatihan Desain Komunikasi Visual & Motion Graphics',
    cluster: 'Multimedia, Game & Animasi 3D',
    clusterKey: 'multimedia',
    skills: ['Adobe After Effects', 'Premiere Pro', 'Illustrator', 'Motion Design'],
    description: 'Produksi video kreatif, grafik gerak interaktif, dan materi visual periklanan.',
  },

  // ── 6. Pemasaran & Bisnis Digital ──
  {
    id: 'digital-marketing-seo',
    name: 'Pelatihan Digital Marketing, SEO & Performance Ads',
    cluster: 'Pemasaran & Bisnis Digital',
    clusterKey: 'bisnis',
    skills: ['SEO On-Page/Off-Page', 'Google Ads', 'Meta Ads', 'Copywriting', 'Analytics'],
    description: 'Strategi akuisisi lalu lintas digital, optimasi mesin pencari, dan iklan berbayar terukur.',
  },
  {
    id: 'ecommerce-social-media',
    name: 'Bootcamp E-Commerce Specialist & Social Media Growth',
    cluster: 'Pemasaran & Bisnis Digital',
    clusterKey: 'bisnis',
    skills: ['TikTok Shop', 'Shopee/Tokopedia Ops', 'Social Media Strategy', 'Live Commerce'],
    description: 'Pengelolaan operasional toko online, strategi live selling, dan pertumbuhan audiens.',
  },
  {
    id: 'inkubasi-startup-business',
    name: 'Pelatihan Manajemen Inkubasi Bisnis & Scale-Up Startup',
    cluster: 'Pemasaran & Bisnis Digital',
    clusterKey: 'bisnis',
    skills: ['Business Model Canvas', 'Pitch Deck', 'Product Market Fit', 'Financial Modeling'],
    description: 'Akselerasi validasi produk, penentuan model bisnis komersial, dan pitching investor.',
  },
];

const CLUSTER_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string; badgeClass: string }
> = {
  all: {
    label: 'Semua Klaster',
    icon: Layers,
    colorClass: 'text-slate-700 bg-slate-100',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  manufaktur: {
    label: 'Manufaktur & Las',
    icon: Wrench,
    colorClass: 'text-amber-700 bg-amber-100',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  it: {
    label: 'IT & Software',
    icon: Code2,
    colorClass: 'text-blue-700 bg-blue-100',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  ai: {
    label: 'AI & Sains Data',
    icon: Brain,
    colorClass: 'text-purple-700 bg-purple-100',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  cyber: {
    label: 'Cyber Security',
    icon: Shield,
    colorClass: 'text-rose-700 bg-rose-100',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  multimedia: {
    label: 'Kreatif & Game',
    icon: Palette,
    colorClass: 'text-pink-700 bg-pink-100',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-200',
  },
  bisnis: {
    label: 'Bisnis & Pemasaran',
    icon: TrendingUp,
    colorClass: 'text-emerald-700 bg-emerald-100',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

type SortMode = 'cluster' | 'name_asc' | 'name_desc';

interface TrainingProgramSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  availableTrainings?: Array<{ id?: string; title?: string; category?: string }>;
}

export function TrainingProgramSelector({
  value,
  onChange,
  className = '',
  availableTrainings = [],
}: TrainingProgramSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('cluster');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Gabungkan master catalog dengan training programs dari Firestore (jika ada yang baru)
  const allPrograms = useMemo(() => {
    const list = [...STP_MASTER_TRAINING_PROGRAMS];
    const seenNames = new Set(list.map((p) => p.name.toLowerCase()));

    if (Array.isArray(availableTrainings) && availableTrainings.length > 0) {
      availableTrainings.forEach((t) => {
        const title = (t.title || '').trim();
        if (title && !seenNames.has(title.toLowerCase())) {
          seenNames.add(title.toLowerCase());
          let clusterKey: TrainingProgramItem['clusterKey'] = 'lainnya';
          const cat = (t.category || '').toLowerCase();
          if (cat.includes('manufaktur') || cat.includes('las') || cat.includes('weld')) clusterKey = 'manufaktur';
          else if (cat.includes('it') || cat.includes('software') || cat.includes('web')) clusterKey = 'it';
          else if (cat.includes('ai') || cat.includes('data')) clusterKey = 'ai';
          else if (cat.includes('cyber') || cat.includes('security')) clusterKey = 'cyber';
          else if (cat.includes('game') || cat.includes('animasi') || cat.includes('3d')) clusterKey = 'multimedia';
          else if (cat.includes('bisnis') || cat.includes('marketing') || cat.includes('pemasaran')) clusterKey = 'bisnis';

          list.push({
            id: t.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: title,
            cluster: t.category || 'Program Pelatihan STP',
            clusterKey,
            skills: [title],
            description: 'Program pelatihan resmi terdaftar di Solo Technopark.',
          });
        }
      });
    }

    return list;
  }, [availableTrainings]);

  // Cari dan sorting daftar pelatihan
  const filteredAndSortedPrograms = useMemo(() => {
    let result = allPrograms.filter((item) => {
      // Filter Klaster
      if (selectedCluster !== 'all' && item.clusterKey !== selectedCluster) {
        return false;
      }

      // Filter Pencarian Teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCluster = item.cluster.toLowerCase().includes(q);
        const matchSkills = item.skills.some((s) => s.toLowerCase().includes(q));
        const matchDesc = Boolean(item.description && item.description.toLowerCase().includes(q));
        if (!matchName && !matchCluster && !matchSkills && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Pengurutan
    if (sortMode === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } else if (sortMode === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name, 'id'));
    } else {
      // Default: Urut berdasarkan klaster dan kemudian nama
      result.sort((a, b) => {
        if (a.cluster === b.cluster) {
          return a.name.localeCompare(b.name, 'id');
        }
        return a.cluster.localeCompare(b.cluster, 'id');
      });
    }

    return result;
  }, [allPrograms, searchQuery, selectedCluster, sortMode]);

  // Pengelompokan program berdasarkan cluster untuk tampilan "Berdasarkan Klaster"
  const groupedPrograms = useMemo(() => {
    if (sortMode !== 'cluster') {
      return [{ cluster: 'Daftar Terurut Alfabetis', items: filteredAndSortedPrograms }];
    }

    const map = new Map<string, TrainingProgramItem[]>();
    filteredAndSortedPrograms.forEach((p) => {
      const arr = map.get(p.cluster) || [];
      arr.push(p);
      map.set(p.cluster, arr);
    });

    return Array.from(map.entries()).map(([cluster, items]) => ({
      cluster,
      items,
    }));
  }, [filteredAndSortedPrograms, sortMode]);

  // Identifikasi objek program terpilih
  const selectedItem = useMemo(() => {
    if (!value) return null;
    const vLower = value.toLowerCase().trim();
    return allPrograms.find(
      (p) => p.name.toLowerCase() === vLower || p.name.toLowerCase().includes(vLower)
    );
  }, [value, allPrograms]);

  const handleSelect = (programName: string) => {
    onChange(programName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ─── TRIGGER BUTTON ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all shadow-2xs group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          value
            ? 'bg-emerald-50/80 border-emerald-400/80 hover:bg-emerald-50 text-emerald-950 font-bold'
            : 'bg-white border-emerald-300/80 hover:border-emerald-400 text-slate-700 hover:bg-slate-50/50'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
              value ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
          </div>

          <div className="truncate text-xs">
            {value ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate">{selectedItem ? selectedItem.name : value}</span>
                {selectedItem && (
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 shrink-0">
                    {selectedItem.cluster.split(',')[0]}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-semibold text-slate-600">Semua Program Pelatihan STP</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="w-5 h-5 rounded-full hover:bg-emerald-200/60 text-emerald-800 flex items-center justify-center transition-colors"
              title="Reset Pilihan Pelatihan"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-emerald-700 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* ─── DROPDOWN / POPOVER PANEL ─── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[460px] max-w-[480px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Panel */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50 border-b border-emerald-100/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    Pilih Program Pelatihan & Diklat STP
                  </h4>
                  <p className="text-[10px] text-emerald-800">
                    Pencarian cepat kurikulum selaras untuk alumni Solo Technopark
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kotak Pencarian Realtime */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama diklat (Cth: Welder, Fullstack, CNC, Cyber, AI)..."
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-emerald-200/80 bg-white placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Opsi Sorting & Pengurutan */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-emerald-100/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-900">
                <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                <span>Urutkan:</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSortMode('cluster')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    sortMode === 'cluster'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Klaster Industri
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('name_asc')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    sortMode === 'name_asc'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Nama (A - Z)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('name_desc')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    sortMode === 'name_desc'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Nama (Z - A)
                </button>
              </div>
            </div>

            {/* Filter Pills Klaster */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
              {Object.entries(CLUSTER_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isSelected = selectedCluster === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCluster(key)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── LIST DAFTAR PROGRAM PELATIHAN ─── */}
          <div className="max-h-[340px] overflow-y-auto p-2 space-y-3">
            {/* Opsi Reset (Semua Lowongan) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect('')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelect('');
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                !value
                  ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold'
                  : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    !value ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black block">Semua Program Pelatihan STP</span>
                  <span className="text-[10px] text-slate-500 block">
                    Tampilkan seluruh lowongan tanpa batasan kurikulum sertifikasi
                  </span>
                </div>
              </div>
              {!value && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
            </div>

            {/* Program Items yang Dikelompokkan */}
            {groupedPrograms.length > 0 && filteredAndSortedPrograms.length > 0 ? (
              groupedPrograms.map((group, gIdx) => (
                <div key={group.cluster || gIdx} className="space-y-1">
                  {sortMode === 'cluster' && (
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>{group.cluster}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                        {group.items.length} Diklat
                      </span>
                    </div>
                  )}

                  {group.items.map((item) => {
                    const isSelected =
                      value &&
                      (value.toLowerCase() === item.name.toLowerCase() ||
                        item.name.toLowerCase().includes(value.toLowerCase()) ||
                        value.toLowerCase().includes(item.name.toLowerCase()));
                    const badgeCfg = CLUSTER_CONFIG[item.clusterKey] || CLUSTER_CONFIG.all;

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelect(item.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelect(item.name);
                        }}
                        className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-150 hover:bg-emerald-50/30 hover:border-emerald-200 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold leading-snug">{item.name}</span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${badgeCfg.badgeClass}`}
                            >
                              {item.cluster.split(',')[0]}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">
                              {item.description}
                            </p>
                          )}

                          {item.skills && item.skills.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {item.skills.slice(0, 4).map((s) => (
                                <span
                                  key={s}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium"
                                >
                                  #{s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-200 group-hover:border-emerald-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Tidak ada program pelatihan yang cocok
                </p>
                <p className="text-[11px] text-slate-500">
                  Coba kata kunci lain atau pilih klaster "Semua Klaster".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCluster('all');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 px-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Menampilkan {filteredAndSortedPrograms.length} dari {allPrograms.length} program diklat
            </span>
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="text-rose-600 font-bold hover:underline"
              >
                Hapus Filter Pelatihan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingProgramSelector;
