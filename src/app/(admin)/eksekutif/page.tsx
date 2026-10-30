// src/app/(admin)/eksekutif/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { APP_ROLES } from '@/config/roles';
import { AdminPageHeader } from '@/components/admin';
import { useBilling } from '@/hooks/useBilling';
import { useFinance } from '@/hooks/useFinance';
import { useTenants } from '@/hooks/useTenants';
import { useAssets } from '@/hooks/useAssets';
import { useAllMouContracts } from '@/hooks/useMouContracts';
import { useAllIkmSurveys } from '@/hooks/useIkm';
import { ikmService } from '@/services/ikm.service';
import { formatRupiah } from '@/utils/format';
import {
  Crown,
  TrendingUp,
  DollarSign,
  Building2,
  Rocket,
  GraduationCap,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronRight,
  PieChart,
  Activity,
  Briefcase,
  Hammer,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ExecutiveCommandCenterPage() {
  const { role, user } = useAuth();

  // Queries
  const { invoices = [], loading: billingLoading } = useBilling();
  const { expenses = [], loading: financeLoading } = useFinance();
  const { tenants = [], loading: tenantLoading } = useTenants();
  const { assets = [], loading: assetLoading } = useAssets();
  const { data: mouList = [] } = useAllMouContracts();
  const { data: ikmSurveys = [] } = useAllIkmSurveys();

  // Selected Year for BLUD Target
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const TARGET_PAD_BLUD = 15_000_000_000; // Contoh Target PAD Rp 15 Miliar per tahun

  // Executive Financial Metrics
  const financeMetrics = useMemo(() => {
    // Total Realisasi Pendapatan (PAID Invoices)
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    // Total Realisasi Belanja
    const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netSurplus = totalRevenue - totalExpense;
    const padAchievementRate = Number(((totalRevenue / TARGET_PAD_BLUD) * 100).toFixed(1));

    // Revenue per unit
    const revAset = paidInvoices
      .filter((i) => i.items?.some((it) => it.referenceType === 'TARIFF_DAY' || it.referenceType === 'TARIFF_MONTH'))
      .reduce((acc, i) => acc + i.totalAmount, 0);

    const revPelatihan = paidInvoices
      .filter((i) => i.items?.some((it) => it.referenceType === 'TRAINING'))
      .reduce((acc, i) => acc + i.totalAmount, 0);

    const revProduksi = paidInvoices
      .filter((i) => i.items?.some((it) => it.referenceType === 'PRODUCTION' || it.description?.toLowerCase().includes('cnc')))
      .reduce((acc, i) => acc + i.totalAmount, 0);

    return { totalRevenue, totalExpense, netSurplus, padAchievementRate, revAset, revPelatihan, revProduksi };
  }, [invoices, expenses]);

  // Ecosystem Metrics
  const ecosystemMetrics = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'Aktif').length;
    const totalMouActive = mouList.filter((m) => m.status === 'ACTIVE').length;
    const ikmSummary = ikmService.calculateSummaryStats(ikmSurveys);
    const totalAssets = assets.length;

    return { totalTenants, activeTenants, totalMouActive, ikmSummary, totalAssets };
  }, [tenants, mouList, ikmSurveys, assets]);

  return (
    <div className="space-y-5 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-white shadow-md">
        <div>
          <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs gap-1.5 mb-1.5 px-2.5 py-0.5">
            <Crown size={13} /> EXECUTIVE COMMAND CENTER BLUD
          </Badge>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            Dashboard Eksekutif Direksi
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xl">
            Konsolidasi capaian target PAD BLUD, utilisasi fasilitas kawasan, inkubasi, dan kepuasan publik Solo Technopark.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold backdrop-blur-xs outline-none cursor-pointer"
          >
            <option value={2026} className="text-slate-900">Tahun Anggaran 2026</option>
            <option value={2025} className="text-slate-900">Tahun Anggaran 2025</option>
          </select>

          <Button
            onClick={() => window.print()}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold gap-1.5 text-xs h-8 px-3"
          >
            <Download size={14} /> Cetak Laporan
          </Button>
        </div>
      </div>

      {/* CORE BLUD TARGET & REVENUE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2 border-slate-200/90 shadow-2xs bg-white rounded-xl sm:rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Capaian Pendapatan Asli Daerah (PAD)</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
                  {formatRupiah(financeMetrics.totalRevenue)}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Target RBA {selectedYear}</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{formatRupiah(TARGET_PAD_BLUD)}</p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Realisasi PAD thd Target Tahunan</span>
                <span className="text-blue-600 font-mono text-xs sm:text-sm">{financeMetrics.padAchievementRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 sm:h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(financeMetrics.padAchievementRate, 100)}%` }}
                />
              </div>
            </div>

            {/* BREAKDOWN PER UNIT BISNIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1.5">
                  <Building2 size={13} /> Sewa Fasilitas
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                  {formatRupiah(financeMetrics.revAset || 0)}
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <p className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1.5">
                  <GraduationCap size={13} /> Diklat & Akademi
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                  {formatRupiah(financeMetrics.revPelatihan || 0)}
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1.5">
                  <Hammer size={13} /> Produksi & CNC
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                  {formatRupiah(financeMetrics.revProduksi || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MUTU PELAYANAN & IKM STATS */}
        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={15} /> Indeks Kepuasan (IKM)
              </p>
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {ecosystemMetrics.ikmSummary.overallConvertedScore}
                </span>
                <span className="text-base sm:text-lg font-black text-amber-300">
                  Predikat {ecosystemMetrics.ikmSummary.overallGrade}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/90 mt-1 leading-relaxed">
                Evaluasi {ecosystemMetrics.ikmSummary.totalRespondents} responden penerima layanan (PermenPAN-RB No. 14/2017).
              </p>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-indigo-200 text-[11px]">Surplus Kas Bersih:</span>
                <span className="font-mono font-bold text-emerald-300 text-xs">
                  {formatRupiah(financeMetrics.netSurplus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200 text-[11px]">Total Belanja Operasional:</span>
                <span className="font-mono font-bold text-rose-300 text-xs">
                  {formatRupiah(financeMetrics.totalExpense)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STRATEGIC COLLABORATION METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200/90 shadow-2xs bg-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Tenant Inkubasi</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                {ecosystemMetrics.activeTenants} <span className="text-[11px] font-normal text-slate-400">/ {ecosystemMetrics.totalTenants}</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">MoU & Mitra</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                {ecosystemMetrics.totalMouActive} <span className="text-[11px] font-normal text-slate-400">Aktif</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Aset Fasilitas</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                {ecosystemMetrics.totalAssets} <span className="text-[11px] font-normal text-slate-400">Unit</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Kepatuhan BLUD</p>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">WTP (Penuh)</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

