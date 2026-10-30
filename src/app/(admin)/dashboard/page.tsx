'use client';

import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { 
  Users, Activity, Loader2, CalendarCheck, GraduationCap, 
  Filter, TrendingUp, BarChart3, Bell, PackageSearch, UserPlus, 
  BookOpen, Building2, Wrench, Rocket, Layers
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const YEARS = [2024, 2025, 2026, 2027];

function timeAgo(ms: number) {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const appId = getAppId();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Feed dibersihkan dari transaksi keuangan (Hanya operasional)
  const [feeds, setFeeds] = useState<{ [key: string]: any[] }>({
    bookings: [], tenants: [], trainings: []
  });

  const fetchDashboardStats = async (month: number, year: number) => {
    setLoadingStats(true);
    try {
      const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
      const result = await getDashboardStats({ appId, month, year });
      const data = result.data as any;
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error("Gagal mengambil statistik:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, appId]);

  // LIVE FEED HANYA UNTUK OPERASIONAL
  useEffect(() => {
    const getTs = (val: any) => typeof val === 'number' ? val : (val?.toMillis ? val.toMillis() : Date.now());

    const unsubB = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setFeeds(p => ({ ...p, bookings: snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, type: 'booking', href: '/booking', icon: CalendarCheck, color: 'text-blue-500 bg-blue-100', title: `Peminjaman: ${data.assetName}`, subtitle: `Oleh ${data.userName}`, date: getTs(data.createdAt), status: data.status }
      })}));
    });

    const unsubT = onSnapshot(query(collection(db, 'tenants'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setFeeds(p => ({ ...p, tenants: snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, type: 'tenant', href: '/tenant', icon: Rocket, color: 'text-purple-500 bg-purple-100', title: `Tenant Baru: ${data.name}`, subtitle: `Sektor: ${data.sector || 'Umum'}`, date: getTs(data.createdAt), status: data.status }
      })}));
    });

    const unsubTr = onSnapshot(query(collection(db, 'trainings'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setFeeds(p => ({ ...p, trainings: snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, type: 'training', href: '/pelatihan', icon: GraduationCap, color: 'text-amber-500 bg-amber-100', title: `Pelatihan Baru: ${data.title}`, subtitle: `Kategori: ${data.category}`, date: getTs(data.createdAt), status: data.status }
      })}));
    });

    return () => { unsubB(); unsubT(); unsubTr(); };
  }, [appId]);

  const recentActivities = Object.values(feeds)
    .flat()
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  const bookingTotal = stats?.bookings?.total || 0;
  const bookingPendingPct = bookingTotal ? (stats.bookings.pending / bookingTotal) * 100 : 0;
  const bookingApprovedPct = bookingTotal ? ((stats.bookings.approved + stats.bookings.completed) / bookingTotal) * 100 : 0;
  const bookingRejectedPct = bookingTotal ? (stats.bookings.rejected / bookingTotal) * 100 : 0;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in">
      
      {/* 1. ADMIN PAGE HEADER & FILTER */}
      <AdminPageHeader
        title="Command Center"
        subtitle={
          <span>
            Pusat pantauan operasional & ekosistem BLUD. Menampilkan data{' '}
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </span>
        }
        badge="Live Metrics"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-xs border border-slate-200">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-xs sm:text-sm font-bold focus:ring-0 text-slate-700 cursor-pointer outline-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <div className="w-px h-5 bg-slate-200"></div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-xs sm:text-sm font-bold focus:ring-0 text-slate-700 cursor-pointer outline-none pr-1"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {loadingStats ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500 font-medium">Memproses Data Operasional...</p>
        </div>
      ) : (
        <>
          {/* BARIS 1: 4 METRIK KUNCI (OPERASIONAL) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard 
              title="Pengguna Sistem" 
              value={stats?.users?.total?.toString() || "0"} 
              icon={<UserPlus size={18} />} 
              trend="Akun Terdaftar" colorClass="text-blue-600 bg-blue-50 border-blue-100"
              href="/pengaturan"
            />
            <StatCard 
              title="Tenant Aktif" 
              value={stats?.tenants?.active?.toString() || "0"} 
              subValue={`dari total ${stats?.tenants?.total || 0} pendaftar`}
              icon={<Rocket size={18} />} 
              trend="Mitra Startup" colorClass="text-purple-600 bg-purple-50 border-purple-100"
              href="/tenant"
            />
            <StatCard 
              title="Aset Disewa" 
              value={stats?.assets?.rented?.toString() || "0"} 
              subValue={`dari total ${stats?.assets?.total || 0} unit/ruangan`}
              icon={<Building2 size={18} />} 
              trend="Utilisasi Aset" colorClass="text-emerald-600 bg-emerald-50 border-emerald-100"
              href="/booking"
            />
            <StatCard 
              title="Peserta Pelatihan" 
              value={stats?.training?.totalRegistrants?.toString() || "0"} 
              subValue={`di dalam ${stats?.training?.totalEvents || 0} program`}
              icon={<GraduationCap size={18} />} 
              trend="Siswa LMS" colorClass="text-amber-600 bg-amber-50 border-amber-100"
              href="/pelatihan"
            />
          </div>

          {/* BARIS 2: ANALITIK GRAFIK & FEED AKTIVITAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Kolom Kiri: Analitik (Porsi 2/3) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              
              {/* Grafik Tren Peminjaman Aset (6 Bulan) */}
              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="text-indigo-500" size={17} /> Tren Permintaan Fasilitas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Akumulasi pengajuan (booking) selama 6 bulan terakhir</p>
                  </div>
                </div>
                
                <div className="flex items-end gap-2.5 sm:gap-3 h-44 sm:h-52 pt-4">
                  {stats?.charts?.bookings6Months?.map((data: any, index: number) => {
                    const maxCount = Math.max(...stats.charts.bookings6Months.map((d: any) => d.count), 10);
                    const heightPct = data.count > 0 ? (data.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all text-xs font-bold bg-slate-800 text-white px-2 py-1 rounded-md absolute -top-8 pointer-events-none whitespace-nowrap z-10 shadow-md translate-y-1 group-hover:translate-y-0">
                          {data.count} Pengajuan
                        </div>
                        
                        {/* Bar */}
                        <div className="w-full bg-indigo-100 rounded-t-lg hover:bg-indigo-300 transition-colors relative overflow-hidden" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                          <div className="absolute bottom-0 w-full bg-indigo-500" style={{ height: '30%', opacity: 0.8 }}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid 2 Kolom di dalam Analitik: Progress Bar Peminjaman & Kondisi Aset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Status Peminjaman Bulan Ini */}
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs sm:text-sm">
                    <BarChart3 className="text-blue-500" size={16} /> Rasio Booking ({MONTHS[selectedMonth]})
                  </h3>
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Disetujui / Sukses</span>
                        <span className="font-bold text-emerald-600">{stats?.bookings?.approved + stats?.bookings?.completed || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${bookingApprovedPct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Antrean (Pending)</span>
                        <span className="font-bold text-amber-600">{stats?.bookings?.pending || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${bookingPendingPct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Ditolak / Batal</span>
                        <span className="font-bold text-red-600">{stats?.bookings?.rejected || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full transition-all" style={{ width: `${bookingRejectedPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kondisi Aset & Fasilitas */}
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs sm:text-sm">
                    <Layers className="text-sky-500" size={16} /> Kondisi Infrastruktur
                  </h3>
                  
                  <div className="space-y-2.5">
                    <Link href="/aset" className="p-3 bg-red-50 hover:bg-red-100/80 border border-red-100 rounded-xl flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                          <Wrench size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Aset Rusak / Perbaikan</p>
                          <p className="text-xs sm:text-sm font-bold text-red-800 mt-0.5">{stats?.assets?.openReports || 0} <span className="text-[11px] font-normal text-red-600">Tiket Terbuka</span></p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/katalog" className="p-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-100 rounded-xl flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
                          <PackageSearch size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produk Tenant (Katalog)</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{stats?.tenants?.products || 0} <span className="text-[11px] font-normal text-slate-500">Item Tayang</span></p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* Kolom Kanan: Live Feed (Porsi 1/3) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs h-full max-h-[580px] flex flex-col">
              <h3 className="font-bold text-slate-800 mb-3.5 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs sm:text-sm">
                <Bell className="text-amber-500" size={16} /> Monitor Aktivitas
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium text-xs">Belum ada aktivitas operasional baru.</p>
                  </div>
                ) : (
                  recentActivities.map((act, i) => (
                    <Link key={`${act.id}-${i}`} href={act.href || '/dashboard'} className="flex gap-2.5 group hover:bg-slate-50/80 p-1.5 -m-1.5 rounded-xl transition-colors">
                      <div className="relative">
                        {i !== recentActivities.length - 1 && (
                           <div className="absolute left-1/2 top-7 bottom-[-14px] w-0.5 bg-slate-100 -translate-x-1/2"></div>
                        )}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-2xs relative z-10 ${act.color}`}>
                          <act.icon size={13} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-0.5">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight line-clamp-1">{act.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{act.subtitle}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{timeAgo(act.date)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border
                            ${act.status === 'approved' || act.status === 'Aktif' || act.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              act.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-slate-50 text-slate-500 border-slate-200'}`}
                          >
                            {act.status || '-'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// KOMPONEN CARD STATISTIK
// ==========================================
function StatCard({ title, value, subValue, icon, trend, colorClass, href }: { title: string, value: string, subValue?: string, icon: React.ReactNode, trend: string, colorClass: string, href?: string }) {
  const cardContent = (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col hover:border-blue-200 transition-all relative overflow-hidden group h-full">
      {/* Efek Latar Glow */}
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-15 blur-xl group-hover:scale-125 transition-transform duration-500 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>

      <div className="flex justify-between items-start mb-2.5 sm:mb-3 relative z-10">
        <div className={`p-2 sm:p-2.5 rounded-xl border ${colorClass}`}>{icon}</div>
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
          {trend}
        </span>
      </div>
      <div className="relative z-10 mt-auto">
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{value}</h3>
        {subValue && (
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 truncate">{subValue}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  return cardContent;
}
