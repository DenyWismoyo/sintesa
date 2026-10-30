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
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <PageHero
        badge={{ label: 'Virtual Deal Room & Matchmaking', variant: 'purple' }}
        title="Ruang Deal Flow Investor"
        subtitle="Akses dokumen rahasia pitch deck, model keuangan, metrik pertumbuhan, dan jadwalkan sesi private pitch dengan founder startup binaan Solo Technopark."
      />

      <SectionContainer className="max-w-6xl -mt-8 relative z-20 space-y-6">
        {/* BANNER PRIVASI & TRUST */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <Badge className="bg-emerald-500 text-white font-bold text-xs gap-1.5 px-3 py-1">
              <ShieldCheck size={14} /> Keamanan Data Terenkripsi
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black">
              Standar Kerahasiaan Data Investor & Startup
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Seluruh metrik finansial, proyeksi arus kas, dan pitch deck terlindungi oleh Clickwrap Non-Disclosure
              Agreement (NDA) berstandar hukum sebelum dapat diunduh.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ekosistem">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 font-bold text-xs">
                Jelajahi Ekosistem Publik
              </Button>
            </Link>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <Input
            placeholder="Cari startup binaan berdasarkan nama atau sektor teknologi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* STARTUP DEAL FLOW GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raisingTenants.map((t) => {
            const hasAccess = myAccessList.some(
              (a) => a.tenantId === t.id && (a.investorUid === user?.uid || a.investorEmail === user?.email)
            );

            return (
              <Card key={t.id} className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        {t.sector || 'Teknologi'}
                      </Badge>
                      <h3 className="text-lg font-black text-slate-800">{t.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{t.companyDescription || t.elevatorPitch || 'Startup binaan KST Solo Technopark'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tahap Inkubasi:</span>
                      <span className="font-bold text-slate-800">{t.pipelineStage || 'Pengembangan Produk'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kesiapan Teknologi:</span>
                      <span className="font-mono font-bold text-blue-600">TRL 6 - TRL 7</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {hasAccess ? (
                      <div className="w-full space-y-2">
                        <Badge className="w-full justify-center bg-emerald-100 text-emerald-800 border-emerald-200 py-1 text-xs gap-1.5">
                          <Unlock size={14} /> Akses Terbuka (NDA Signed)
                        </Badge>
                        <Button
                          onClick={() => toast.success(`Membuka Data Room ${t.name}...`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5"
                        >
                          <Download size={14} /> Unduh Deck & Data Finansial
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleOpenNda(t)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-sm"
                      >
                        <Lock size={14} /> Buka Virtual Deal Room (Sign NDA)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SectionContainer>

      {/* MODAL CLICKWRAP NDA */}
      {isNdaModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Perjanjian Kerahasiaan (NDA)</h3>
                <p className="text-xs text-slate-500">Virtual Deal Room: {selectedTenant.name}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 max-h-48 overflow-y-auto font-sans leading-relaxed">
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

            <form onSubmit={handleSignNda} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap Investor / PIC *</label>
                <Input
                  value={ndaForm.investorName}
                  onChange={(e) => setNdaForm((p) => ({ ...p, investorName: e.target.value }))}
                  placeholder="Nama Lengkap Anda"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lembaga Investasi / VC / Angel *</label>
                <Input
                  value={ndaForm.investorOrg}
                  onChange={(e) => setNdaForm((p) => ({ ...p, investorOrg: e.target.value }))}
                  placeholder="Contoh: Nusantara Ventures / Angel Investor"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Email Resmi *</label>
                <Input
                  type="email"
                  value={ndaForm.investorEmail}
                  onChange={(e) => setNdaForm((p) => ({ ...p, investorEmail: e.target.value }))}
                  placeholder="investor@vc-capital.com"
                  required
                />
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="ndaAgreeCheck"
                  checked={ndaForm.agreeNda}
                  onChange={(e) => setNdaForm((p) => ({ ...p, agreeNda: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ndaAgreeCheck" className="text-xs text-slate-600 leading-normal">
                  Saya menyatakan bertindak atas nama instansi yang sah, menyetujui seluruh klausul NDA, dan berkomitmen
                  menjaga kerahasiaan materi yang diakses.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsNdaModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  Tandatangani & Buka Data
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

