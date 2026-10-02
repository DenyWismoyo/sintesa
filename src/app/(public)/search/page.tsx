// Lokasi file: src/app/(public)/search/page.tsx
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Search, 
  GraduationCap, 
  Building2, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  Users, 
  ArrowRight, 
  Bot, 
  Sparkles,
  Loader2,
  X,
  Layers
} from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';

type SearchDomain = 'ALL' | 'TRAINING' | 'FACILITY' | 'CATALOG' | 'EVENT' | 'ARTICLE' | 'TENANT';

interface SearchResultItem {
  id: string;
  domain: SearchDomain;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  url: string;
  badgeLabel: string;
  badgeColor: string;
  metaInfo?: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<SearchDomain>('ALL');
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<SearchResultItem[]>([]);

  // Fetch data dari 6 koleksi utama
  useEffect(() => {
    let isMounted = true;
    const fetchAllCollections = async () => {
      setLoading(true);
      try {
        const [
          trainingsSnap,
          assetsSnap,
          catalogsSnap,
          articlesSnap,
          eventsSnap,
          tenantsSnap
        ] = await Promise.all([
          getDocs(collection(db, 'trainings')),
          getDocs(collection(db, 'assets')),
          getDocs(collection(db, 'catalogs')),
          getDocs(collection(db, 'articles')),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'tenants'))
        ]);

        const items: SearchResultItem[] = [];

        // 1. Trainings
        trainingsSnap.forEach(docSnap => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            domain: 'TRAINING',
            title: d.title || 'Program Pelatihan',
            description: d.description || '',
            category: d.type || 'Pelatihan',
            imageUrl: d.imageUrl,
            url: `/program-pelatihan/${docSnap.id}`,
            badgeLabel: 'Pelatihan',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
            metaInfo: d.isFree ? 'Gratis' : (d.price ? `Rp ${Number(d.price).toLocaleString('id-ID')}` : undefined)
          });
        });

        // 2. Facilities (Assets)
        assetsSnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d.category === 'Ruangan' || d.isRentable) {
            items.push({
              id: docSnap.id,
              domain: 'FACILITY',
              title: d.name || 'Fasilitas Kawasan',
              description: d.description || '',
              category: d.category || 'Ruangan',
              imageUrl: d.imageUrl,
              url: `/fasilitas/${docSnap.id}`,
              badgeLabel: 'Fasilitas',
              badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
              metaInfo: d.priceValue ? `Rp ${Number(d.priceValue).toLocaleString('id-ID')} / ${d.pricingType || 'Hari'}` : (d.capacity ? `${d.capacity} Orang` : undefined)
            });
          }
        });

        // 3. Catalogs
        catalogsSnap.forEach(docSnap => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            domain: 'CATALOG',
            title: d.name || d.title || 'Produk Inovasi',
            description: d.description || '',
            category: d.category || 'Produk',
            imageUrl: d.imageUrl || (d.images && d.images[0]),
            url: `/e-katalog/${docSnap.id}`,
            badgeLabel: 'E-Katalog',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            metaInfo: d.price ? `Rp ${Number(d.price).toLocaleString('id-ID')}` : undefined
          });
        });

        // 4. Articles
        articlesSnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d.isPublished !== false) {
            items.push({
              id: docSnap.id,
              domain: 'ARTICLE',
              title: d.title || 'Warta & Panduan',
              description: d.excerpt || d.content?.slice(0, 140) || '',
              category: d.category || 'Warta',
              imageUrl: d.coverImageUrl,
              url: `/artikel/${d.slug || docSnap.id}`,
              badgeLabel: 'Artikel',
              badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
              metaInfo: d.publishedAt ? new Date(d.publishedAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : undefined
            });
          }
        });

        // 5. Events
        eventsSnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d.isPublished !== false) {
            items.push({
              id: docSnap.id,
              domain: 'EVENT',
              title: d.title || 'Agenda Acara',
              description: d.description || '',
              category: d.type || 'Event',
              imageUrl: d.imageUrl,
              url: `/event/${docSnap.id}`,
              badgeLabel: 'Event',
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
              metaInfo: `${d.date || ''} ${d.time ? '· ' + d.time : ''}`
            });
          }
        });

        // 6. Tenants
        tenantsSnap.forEach(docSnap => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            domain: 'TENANT',
            title: d.name || 'Startup Ekosistem',
            description: d.elevatorPitch || d.description || '',
            category: d.segment || 'StartUp',
            imageUrl: d.logoUrl || d.imageUrl,
            url: `/ekosistem`,
            badgeLabel: 'Tenant',
            badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            metaInfo: d.sector || undefined
          });
        });

        if (isMounted) {
          setAllData(items);
        }
      } catch (err) {
        console.error('Gagal mengambil data pencarian global:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllCollections();
    return () => { isMounted = false; };
  }, []);

  // Update URL saat query berubah
  const handleSearchSubmit = (val: string) => {
    setQuery(val);
    router.replace(`/search?q=${encodeURIComponent(val)}`);
  };

  // Filter berdasarkan kata kunci
  const filteredResults = useMemo(() => {
    if (!query || query.trim() === '') return allData;
    const lowerQ = query.toLowerCase().trim();
    return allData.filter(item => 
      item.title.toLowerCase().includes(lowerQ) ||
      item.description.toLowerCase().includes(lowerQ) ||
      (item.category && item.category.toLowerCase().includes(lowerQ))
    );
  }, [allData, query]);

  // Hitung jumlah per domain
  const counts = useMemo(() => {
    const map: Record<SearchDomain, number> = {
      ALL: filteredResults.length,
      TRAINING: 0,
      FACILITY: 0,
      CATALOG: 0,
      EVENT: 0,
      ARTICLE: 0,
      TENANT: 0
    };
    filteredResults.forEach(item => {
      map[item.domain] = (map[item.domain] || 0) + 1;
    });
    return map;
  }, [filteredResults]);

  // Hasil sesuai tab aktif
  const displayedResults = useMemo(() => {
    if (activeTab === 'ALL') return filteredResults;
    return filteredResults.filter(item => item.domain === activeTab);
  }, [filteredResults, activeTab]);

  return (
    <SectionContainer accent="indigo" width="wide">
      {/* 1. PageHero Terpadu */}
      <PageHero
        breadcrumbs={[{ label: 'Pencarian Global', href: '/search' }]}
        badge={{ label: 'Mesin Penemuan Kawasan', icon: <Search size={13} />, variant: 'purple' }}
        title="Eksplorasi Layanan & Ekosistem"
        subtitle="Temukan seluruh materi pelatihan, ruang pertemuan, produk inovasi UMKM, agenda acara, warta terkini, dan profil startup binaan Solo Technopark."
        accentColor="indigo"
        searchValue={query}
        onSearchChange={handleSearchSubmit}
        searchPlaceholder="Ketik kata kunci (misal: AI, CNC, Ruang Rapat, Robotik)..."
        isLoadingSearch={loading}
      />

      {/* 2. Tabs Filter Domain Menggunakan PillTabs */}
      <div className="mb-8">
        <PillTabs
          tabs={[
            { key: 'ALL', label: `Semua (${counts.ALL})`, icon: <Layers size={14} /> },
            { key: 'TRAINING', label: `Pelatihan (${counts.TRAINING})`, icon: <GraduationCap size={14} /> },
            { key: 'FACILITY', label: `Fasilitas (${counts.FACILITY})`, icon: <Building2 size={14} /> },
            { key: 'CATALOG', label: `Katalog (${counts.CATALOG})`, icon: <ShoppingBag size={14} /> },
            { key: 'EVENT', label: `Event (${counts.EVENT})`, icon: <Calendar size={14} /> },
            { key: 'ARTICLE', label: `Artikel (${counts.ARTICLE})`, icon: <FileText size={14} /> },
            { key: 'TENANT', label: `Startup (${counts.TENANT})`, icon: <Users size={14} /> },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as SearchDomain)}
          layoutId="searchTabIndicator"
        />
      </div>

      {/* 3. Hasil Pencarian Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Menghubungkan ke seluruh pangkalan data kawasan...</p>
        </div>
      ) : displayedResults.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={Search}
            title={`Tidak Ada Hasil untuk "${query}"`}
            description="Coba gunakan kata kunci yang lebih umum, periksa ejaan, atau pilih tab domain yang lain."
            actionLabel="Reset Kata Kunci"
            onAction={() => handleSearchSubmit('')}
          />

          {/* AI Assistance Fallback Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-700/50">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wide">
                <Bot size={13} /> Krenova AI Intelligence
              </div>
              <h3 className="text-lg sm:text-xl font-bold">Tidak menemukan yang Anda cari?</h3>
              <p className="text-xs text-blue-200/90 max-w-xl leading-relaxed">
                Tanyakan langsung ke asisten AI Krenova kami. AI dapat merekomendasikan program vokasi terbaik, mencocokkan ruangan, atau menjawab pertanyaan regulasi.
              </p>
            </div>
            <Link
              href={`/explore?q=${encodeURIComponent(query)}`}
              className="px-6 py-3 rounded-full bg-white hover:bg-blue-50 text-slate-900 font-bold text-xs shadow-md transition-all shrink-0 inline-flex items-center gap-2"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Tanya Krenova AI</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan <strong>{displayedResults.length}</strong> hasil {query ? `untuk "${query}"` : ''}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedResults.map((item) => (
              <Link
                key={`${item.domain}-${item.id}`}
                href={item.url}
                className="public-card public-card-hover group flex flex-col justify-between overflow-hidden relative"
              >
                <div>
                  {/* Media Thumbnail */}
                  <div className="w-full aspect-video bg-slate-100 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                        {item.domain === 'TRAINING' && <GraduationCap size={32} />}
                        {item.domain === 'FACILITY' && <Building2 size={32} />}
                        {item.domain === 'CATALOG' && <ShoppingBag size={32} />}
                        {item.domain === 'EVENT' && <Calendar size={32} />}
                        {item.domain === 'ARTICLE' && <FileText size={32} />}
                        {item.domain === 'TENANT' && <Users size={32} />}
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${item.badgeColor}`}>
                      {item.badgeLabel}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {item.description || 'Klik untuk melihat rincian informasi dan spesifikasi resmi.'}
                    </p>
                  </div>
                </div>

                {/* Footer Info & Arrow Button */}
                <div className="p-4 pt-0 border-t border-slate-100/60 mt-3 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 truncate">
                    {item.metaInfo || item.category || 'Solo Technopark'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* AI Banner di bagian bawah hasil */}
          <div className="mt-12 p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Ingin eksplorasi yang lebih mendalam?</h4>
                <p className="text-xs text-slate-400">Konsultasikan kebutuhan Anda dengan Asisten AI Krenova Solo Technopark.</p>
              </div>
            </div>
            <Link
              href={`/explore?q=${encodeURIComponent(query)}`}
              className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Buka Asisten AI</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </SectionContainer>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <SectionContainer accent="indigo">
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
        </div>
      </SectionContainer>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
