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
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <Badge className="bg-amber-400 text-slate-950 font-black text-xs gap-1.5 mb-2 px-3 py-1">
            <Crown size={14} /> EXECUTIVE COMMAND CENTER BLUD
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard Eksekutif Direksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Satu pintu konsolidasi capaian target PAD BLUD, utilisasi infrastruktur, serapan talenta, dan kepuasan masyarakat Solo Technopark.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-sm font-bold backdrop-blur-sm"
          >
            <option value={2026} className="text-slate-900">Tahun Anggaran 2026</option>
            <option value={2025} className="text-slate-900">Tahun Anggaran 2025</option>
          </select>

          <Button
            onClick={() => window.print()}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold gap-2 text-xs"
          >
            <Download size={15} /> Cetak Laporan
          </Button>
        </div>
      </div>

      {/* CORE BLUD TARGET & REVENUE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capaian Pendapatan Asli Daerah (PAD)</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {formatRupiah(financeMetrics.totalRevenue)}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Target RBA {selectedYear}</p>
                <p className="text-base font-bold text-slate-700 mt-0.5">{formatRupiah(TARGET_PAD_BLUD)}</p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Realisasi PAD thd Target Tahunan</span>
                <span className="text-blue-600 font-mono text-sm">{financeMetrics.padAchievementRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(financeMetrics.padAchievementRate, 100)}%` }}
                />
              </div>
            </div>

            {/* BREAKDOWN PER UNIT BISNIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <p className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-1.5">
                  <Building2 size={14} /> Sewa Fasilitas
                </p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {formatRupiah(financeMetrics.revAset || 0)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <p className="text-[11px] font-bold text-purple-800 uppercase flex items-center gap-1.5">
                  <GraduationCap size={14} /> Diklat & Akademi
                </p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {formatRupiah(financeMetrics.revPelatihan || 0)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <p className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1.5">
                  <Hammer size={14} /> Jasa Produksi & CNC
                </p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {formatRupiah(financeMetrics.revProduksi || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MUTU PELAYANAN & IKM STATS */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-900 to-blue-900 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
            <div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} /> Indeks Kepuasan Masyarakat (IKM)
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-5xl font-black text-white">
                  {ecosystemMetrics.ikmSummary.overallConvertedScore}
                </span>
                <span className="text-2xl font-black text-amber-300">
                  Predikat {ecosystemMetrics.ikmSummary.overallGrade}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-2">
                Berdasarkan evaluasi objektif {ecosystemMetrics.ikmSummary.totalRespondents} responden penerima layanan
                sesuai PermenPAN-RB No. 14 Tahun 2017.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-indigo-200">Surplus Kas Bersih:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {formatRupiah(financeMetrics.netSurplus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200">Total Belanja Operasional:</span>
                <span className="font-mono font-bold text-rose-300">
                  {formatRupiah(financeMetrics.totalExpense)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STRATEGIC COLLABORATION METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Rocket size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Inkubasi</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {ecosystemMetrics.activeTenants} / {ecosystemMetrics.totalTenants} Startup
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">MoU & Mitra Kerjasama</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {ecosystemMetrics.totalMouActive} Dokumen Aktif
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aset & Fasilitas Kawasan</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {ecosystemMetrics.totalAssets} Unit Aset
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indikator Akuntabilitas</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">WTP (Kepatuhan Penuh)</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

