// src/app/(public)/investor-room/ClientPage.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import { useAllDealRoomRequests, useMentoringMutations } from '@/hooks/useMentoringHub';
import { formatRupiah } from '@/utils/format';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Rocket,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InvestorRoomClientPage() {
  const { user, role } = useAuth();
  const { tenants = [], loading: isTenantsLoading } = useTenants();
  const { data: myAccessList = [] } = useAllDealRoomRequests();
  const { requestDealRoomMutation } = useMentoringMutations();

  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false);
  const [ndaForm, setNdaForm] = useState({
    investorName: user?.displayName || '',
    investorOrg: '',
    investorEmail: user?.email || '',
    agreeNda: false,
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Startups raising funds (Inkubasi / Aktif)
  const raisingTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.sector && t.sector.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [tenants, searchTerm]);

  const handleOpenNda = (tenant: any) => {
    setSelectedTenant(tenant);
    setNdaForm({
      investorName: user?.displayName || '',
      investorOrg: '',
      investorEmail: user?.email || '',
      agreeNda: false,
    });
    setIsNdaModalOpen(true);
  };

  const handleSignNda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndaForm.agreeNda) {
      toast.error('Anda wajib menyetujui Klausul Kerahasiaan (NDA) untuk membuka data privat.');
      return;
    }

    await requestDealRoomMutation.mutateAsync({
      investorUid: user?.uid || 'guest-inv-' + Date.now(),
      investorName: ndaForm.investorName,
      investorOrg: ndaForm.investorOrg,
      investorEmail: ndaForm.investorEmail,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      ndaAccepted: true,
      ndaSignedName: ndaForm.investorName,
    });

    setIsNdaModalOpen(false);
    toast.success('NDA Terverifikasi! Akses data privat telah terbuka.');
  };

  return (
    <SectionContainer accent="indigo" width="default">
      <PageHero
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Ekosistem', href: '/ekosistem' },
          { label: 'Investor Room' },
        ]}
        badge={{ label: 'Virtual Deal Room & Matchmaking', variant: 'purple' }}
        title="Ruang Deal Flow Investor"
        subtitle="Akses dokumen rahasia pitch deck, model keuangan, metrik pertumbuhan, dan jadwalkan sesi private pitch dengan founder startup binaan Solo Technopark."
        accentColor="indigo"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari startup binaan berdasarkan nama atau sektor teknologi..."
      />

      <div className="space-y-8 pt-4 sm:pt-6">
        {/* BANNER PRIVASI & TRUST */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <Badge className="bg-emerald-500 text-white font-bold text-xs gap-1.5 px-3 py-1 shadow-sm">
              <ShieldCheck size={14} /> Keamanan Data Terenkripsi
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black">
              Standar Kerahasiaan Data Investor & Startup
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Seluruh metrik finansial, proyeksi arus kas, dan pitch deck terlindungi oleh Clickwrap Non-Disclosure
              Agreement (NDA) berstandar hukum sebelum dapat diunduh.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link href="/ekosistem">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 font-bold text-xs rounded-xl">
                Jelajahi Ekosistem Publik
              </Button>
            </Link>
          </div>
        </div>

        {/* STARTUP DEAL FLOW GRID */}
        {raisingTenants.length === 0 ? (
          <div className="public-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-700">Tidak ada startup yang sesuai</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Coba gunakan kata kunci pencarian lain untuk menemukan startup binaan KST Solo Technopark.
            </p>
          </div>
        ) : (
          <div className="public-grid-3">
            {raisingTenants.map((t) => {
              const hasAccess = myAccessList.some(
                (a) => a.tenantId === t.id && (a.investorUid === user?.uid || a.investorEmail === user?.email)
              );

              return (
                <div
                  key={t.id}
                  className="public-card public-card-hover group flex flex-col justify-between overflow-hidden relative p-5 sm:p-6 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50/70 border-indigo-200/60 text-indigo-700">
                        {t.sector || 'Teknologi'}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {t.pipelineStage || 'Inkubasi'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {t.companyDescription || t.elevatorPitch || 'Startup binaan KST Solo Technopark'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50/90 rounded-xl space-y-1.5 text-xs border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tahap Inkubasi:</span>
                        <span className="font-bold text-slate-800">{t.pipelineStage || 'Pengembangan Produk'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kesiapan Teknologi:</span>
                        <span className="font-mono font-bold text-indigo-600">TRL 6 - TRL 7</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {hasAccess ? (
                      <div className="w-full space-y-2">
                        <Badge className="w-full justify-center bg-emerald-100 text-emerald-800 border-emerald-200 py-1 text-xs gap-1.5 font-bold">
                          <Unlock size={14} /> Akses Terbuka (NDA Signed)
                        </Badge>
                        <Button
                          onClick={() => toast.success(`Membuka Data Room ${t.name}...`)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                        >
                          <Download size={14} /> Unduh Deck & Data Finansial
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleOpenNda(t)}
                        className="w-full bg-slate-900 hover:bg-indigo-950 text-white font-bold text-xs gap-1.5 rounded-xl shadow-sm transition-all"
                      >
                        <Lock size={14} /> Buka Virtual Deal Room (Sign NDA)
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CLICKWRAP NDA */}
      {isNdaModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Perjanjian Kerahasiaan (NDA)</h3>
                  <p className="text-[11px] text-slate-500">Virtual Deal Room: {selectedTenant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNdaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 custom-scrollbar text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1.5 max-h-36 overflow-y-auto leading-relaxed">
                <p className="font-bold text-slate-800">KLAUSUL NON-DISCLOSURE AGREEMENT (NDA):</p>
                <p>
                  1. Seluruh dokumen pitch deck, proyeksi finansial, dan data hak cipta intelektual yang diperoleh dari
                  startup binaan Solo Technopark bersifat <strong>SANGAT RAHASIA (CONFIDENTIAL)</strong>.
                </p>
                <p>
                  2. Penerima informasi (Investor/Pihak Ketiga) dilarang menyebarluaskan, mendistribusikan, atau memanfaatkan
                  informasi tersebut untuk tujuan kompetisi usaha tanpa persetujuan tertulis dari Solo Technopark dan Founder.
                </p>
                <p>
                  3. Pelanggaran terhadap ketentuan ini tunduk pada Undang-Undang Republik Indonesia Nomor 30 Tahun 2000
                  tentang Rahasia Dagang.
                </p>
              </div>

              <form id="form-nda-dealroom" onSubmit={handleSignNda} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lengkap Investor / PIC *</label>
                  <Input
                    value={ndaForm.investorName}
                    onChange={(e) => setNdaForm((p) => ({ ...p, investorName: e.target.value }))}
                    placeholder="Nama Lengkap Anda"
                    className="h-8.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lembaga Investasi / VC / Angel *</label>
                  <Input
                    value={ndaForm.investorOrg}
                    onChange={(e) => setNdaForm((p) => ({ ...p, investorOrg: e.target.value }))}
                    placeholder="Contoh: Nusantara Ventures / Angel Investor"
                    className="h-8.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Alamat Email Resmi *</label>
                  <Input
                    type="email"
                    value={ndaForm.investorEmail}
                    onChange={(e) => setNdaForm((p) => ({ ...p, investorEmail: e.target.value }))}
                    placeholder="investor@vc-capital.com"
                    className="h-8.5 text-xs"
                    required
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ndaAgreeCheck"
                    checked={ndaForm.agreeNda}
                    onChange={(e) => setNdaForm((p) => ({ ...p, agreeNda: e.target.checked }))}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="ndaAgreeCheck" className="text-[11px] text-slate-600 leading-snug">
                    Saya menyatakan bertindak atas nama instansi yang sah, menyetujui seluruh klausul NDA, dan berkomitmen
                    menjaga kerahasiaan materi yang diakses.
                  </label>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNdaModalOpen(false)} className="h-8 text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" form="form-nda-dealroom" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 text-xs">
                Tandatangani & Buka Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
}

