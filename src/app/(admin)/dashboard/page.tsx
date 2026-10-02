'use client';

import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
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
        return { id: d.id, type: 'booking', icon: CalendarCheck, color: 'text-blue-500 bg-blue-100', title: `Peminjaman: ${data.assetName}`, subtitle: `Oleh ${data.userName}`, date: getTs(data.createdAt), status: data.status }
      })}));
    });

    const unsubT = onSnapshot(query(collection(db, 'tenants'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setFeeds(p => ({ ...p, tenants: snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, type: 'tenant', icon: Rocket, color: 'text-purple-500 bg-purple-100', title: `Tenant Baru: ${data.name}`, subtitle: `Sektor: ${data.sector || 'Umum'}`, date: getTs(data.createdAt), status: data.status }
      })}));
    });

    const unsubTr = onSnapshot(query(collection(db, 'trainings'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setFeeds(p => ({ ...p, trainings: snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, type: 'training', icon: GraduationCap, color: 'text-amber-500 bg-amber-100', title: `Pelatihan Baru: ${data.title}`, subtitle: `Kategori: ${data.category}`, date: getTs(data.createdAt), status: data.status }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard 
              title="Total Pengguna Sistem" 
              value={stats?.users?.total?.toString() || "0"} 
              icon={<UserPlus size={22} />} 
              trend="Akun Terdaftar" colorClass="text-blue-600 bg-blue-50 border-blue-100"
            />
            <StatCard 
              title="Inkubasi Tenant Aktif" 
              value={stats?.tenants?.active?.toString() || "0"} 
              subValue={`dari total ${stats?.tenants?.total || 0} pendaftar`}
              icon={<Rocket size={22} />} 
              trend="Mitra Startup" colorClass="text-purple-600 bg-purple-50 border-purple-100"
            />
            <StatCard 
              title="Aset Sedang Dipakai" 
              value={stats?.assets?.rented?.toString() || "0"} 
              subValue={`dari total ${stats?.assets?.total || 0} unit/ruangan`}
              icon={<Building2 size={22} />} 
              trend="Utilisasi Aset" colorClass="text-emerald-600 bg-emerald-50 border-emerald-100"
            />
            <StatCard 
              title="Total Peserta Pelatihan" 
              value={stats?.training?.totalRegistrants?.toString() || "0"} 
              subValue={`di dalam ${stats?.training?.totalEvents || 0} program kelas`}
              icon={<GraduationCap size={22} />} 
              trend="Siswa LMS" colorClass="text-amber-600 bg-amber-50 border-amber-100"
            />
          </div>

          {/* BARIS 2: ANALITIK GRAFIK & FEED AKTIVITAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kolom Kiri: Analitik (Porsi 2/3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Grafik Tren Peminjaman Aset (6 Bulan) */}
              <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <TrendingUp className="text-indigo-500" size={22} /> Tren Permintaan Fasilitas
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Akumulasi pengajuan (booking) selama 6 bulan terakhir</p>
                  </div>
                </div>
                
                <div className="flex items-end gap-3 h-56 pt-6">
                  {stats?.charts?.bookings6Months?.map((data: any, index: number) => {
                    const maxCount = Math.max(...stats.charts.bookings6Months.map((d: any) => d.count), 10); // Minimal 10 agar bar tidak kepenuhan
                    const heightPct = data.count > 0 ? (data.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg absolute -top-10 pointer-events-none whitespace-nowrap z-10 shadow-lg translate-y-2 group-hover:translate-y-0">
                          {data.count} Pengajuan
                        </div>
                        
                        {/* Bar */}
                        <div className="w-full bg-indigo-100 rounded-t-xl hover:bg-indigo-300 transition-colors relative overflow-hidden" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                          <div className="absolute bottom-0 w-full bg-indigo-500" style={{ height: '30%', opacity: 0.8 }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid 2 Kolom di dalam Analitik: Progress Bar Peminjaman & Kondisi Aset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Peminjaman Bulan Ini */}
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={20} /> Rasio Booking ({MONTHS[selectedMonth]})
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-600">Disetujui / Sukses</span>
                        <span className="font-black text-emerald-600">{stats?.bookings?.approved + stats?.bookings?.completed || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${bookingApprovedPct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-600">Antrean (Pending)</span>
                        <span className="font-black text-amber-600">{stats?.bookings?.pending || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${bookingPendingPct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-600">Ditolak / Batal</span>
                        <span className="font-black text-red-600">{stats?.bookings?.rejected || 0}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full transition-all" style={{ width: `${bookingRejectedPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kondisi Aset & Fasilitas */}
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Layers className="text-sky-500" size={20} /> Kondisi Infrastruktur
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                          <Wrench size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Aset Rusak / Perbaikan</p>
                          <p className="text-xl font-black text-red-800 mt-0.5">{stats?.assets?.openReports || 0} <span className="text-sm font-medium">Tiket Terbuka</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center">
                          <PackageSearch size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produk Tenant (Katalog)</p>
                          <p className="text-xl font-black text-slate-800 mt-0.5">{stats?.tenants?.products || 0} <span className="text-sm font-medium">Item Tayang</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Kolom Kanan: Live Feed (Porsi 1/3) */}
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 h-full max-h-[640px] flex flex-col">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Bell className="text-amber-500" size={22} /> Monitor Aktivitas
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Belum ada aktivitas operasional baru.</p>
                  </div>
                ) : (
                  recentActivities.map((act, i) => (
                    <div key={`${act.id}-${i}`} className="flex gap-4 group">
                      <div className="relative">
                        {/* Garis konektor antar feed */}
                        {i !== recentActivities.length - 1 && (
                           <div className="absolute left-1/2 top-10 bottom-[-20px] w-0.5 bg-slate-100 -translate-x-1/2"></div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative z-10 ${act.color}`}>
                          <act.icon size={16} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{act.title}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1 truncate">{act.subtitle}</p>
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{timeAgo(act.date)}</span>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border
                            ${act.status === 'approved' || act.status === 'Aktif' || act.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              act.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-slate-50 text-slate-500 border-slate-200'}`}
                          >
                            {act.status || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
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
function StatCard({ title, value, subValue, icon, trend, colorClass }: { title: string, value: string, subValue?: string, icon: React.ReactNode, trend: string, colorClass: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
      
      {/* Efek Latar Glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl border ${colorClass}`}>{icon}</div>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {trend}
        </span>
      </div>
      <div className="relative z-10 mt-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        {subValue && (
          <p className="text-[11px] font-medium text-slate-500 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}