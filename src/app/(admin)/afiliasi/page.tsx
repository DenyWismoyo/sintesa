'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useAllAffiliates, useAllCommissions, useAllPayouts, useAffiliateSettings } from '@/hooks/useAffiliate';
import { storageService } from '@/services/storage.service';
import { formatRupiah } from '@/utils/format';
import { AffiliatePartner, CommissionRecord, AffiliatePayoutRequest } from '@/types/affiliate.types';
import { toast } from 'sonner';
import { 
  Share2, Users, CheckCircle2, Clock, XCircle, DollarSign, TrendingUp,
  Search, ChevronDown, Eye, Check, X, Banknote, UploadCloud, Settings2,
  ExternalLink, Copy, BadgeCheck, AlertTriangle, Loader2, Link2, RefreshCcw, Ban
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

const TAB_LIST = [
  { id: 'verifikasi', label: 'Antrean Verifikasi', icon: Clock },
  { id: 'direktori', label: 'Direktori Mitra', icon: Users },
  { id: 'komisi', label: 'Buku Besar Komisi', icon: TrendingUp },
  { id: 'pencairan', label: 'Pencairan Dana', icon: Banknote },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings2 },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Menunggu', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  APPROVED: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 border border-red-200' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  CLEARED: { label: 'Lunas', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  PENDING_PAYMENT: { label: 'Menunggu Bayar', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-red-50 text-red-600 border border-red-200' },
  REQUESTED: { label: 'Diajukan', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  TRANSFERRED: { label: 'Ditransfer', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export default function AfiliasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('verifikasi');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState<{ open: boolean; partner: AffiliatePartner } | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; payout: AffiliatePayoutRequest } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { affiliates: pending, isLoading: pendingLoading, approveAffiliate, rejectAffiliate, isSubmitting: affSubmitting } = useAllAffiliates('PENDING');
  const { affiliates: active, isLoading: activeLoading } = useAllAffiliates('APPROVED');
  const { affiliates: allAff } = useAllAffiliates();
  const { data: commissions = [], isLoading: comLoading } = useAllCommissions();
  const { payouts, isLoading: payoutLoading, processPayout, rejectPayout, isSubmitting: payoutSubmitting } = useAllPayouts();
  const { settings, updateSettings, isSubmitting: settingSubmitting } = useAffiliateSettings();

  const [settingsForm, setSettingsForm] = useState({
    trainingCommissionRate: 5,
    facilityCommissionRate: 5,
    catalogCommissionRate: 5,
    cookieAttributionDays: 30,
    minPayoutAmount: 50000,
  });
  React.useEffect(() => {
    if (settings) {
      setSettingsForm({
        trainingCommissionRate: Math.round(settings.trainingCommissionRate * 100),
        facilityCommissionRate: Math.round(settings.facilityCommissionRate * 100),
        catalogCommissionRate: Math.round(settings.catalogCommissionRate * 100),
        cookieAttributionDays: settings.cookieAttributionDays,
        minPayoutAmount: settings.minPayoutAmount,
      });
    }
  }, [settings]);

  const statsCards = [
    { label: 'Total Mitra', value: allAff.length, icon: Users, color: 'blue' },
    { label: 'Mitra Aktif', value: active.length, icon: CheckCircle2, color: 'emerald' },
    { label: 'Menunggu Verifikasi', value: pending.length, icon: Clock, color: 'amber' },
    { label: 'Total Komisi Cleared', value: formatRupiah(commissions.filter(c => c.status === 'CLEARED').reduce((s, c) => s + c.commissionAmount, 0)), icon: DollarSign, color: 'indigo' },
  ];

  const filteredActive = active.filter(a =>
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!approveModal || !user) return;
    await approveAffiliate({ userId: approveModal.partner.userId, approvedBy: user.uid, customCode: customCode || undefined });
    setApproveModal(null);
    setCustomCode('');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    await rejectAffiliate({ userId: rejectModal.userId, reason: rejectReason.trim() });
    setRejectModal(null);
    setRejectReason('');
  };

  const handleProcessPayout = async () => {
    if (!payoutModal || !user) return;
    if (!proofFile) return toast.error('Upload bukti transfer terlebih dahulu');
    setIsUploading(true);
    try {
      const url = await storageService.uploadFile(proofFile, `affiliate_payouts/${payoutModal.payout.id}/bukti-transfer`);
      await processPayout({
        payoutId: payoutModal.payout.id!,
        affiliateId: payoutModal.payout.affiliateId,
        processedBy: user.uid,
        proofReceiptUrl: url,
        adminNotes,
      });
      setPayoutModal(null);
      setProofFile(null);
      setAdminNotes('');
    } catch (err: any) {
      toast.error('Gagal memproses', { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin!');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Program Afiliasi Mitra"
        subtitle="Kelola mitra referral, verifikasi pendaftar, monitoring buku besar komisi, dan persetujuan pencairan dana."
        badge={pending.length > 0 ? `${pending.length} Menunggu Verifikasi` : 'Semua Mitra Terverifikasi'}
        breadcrumbs={[{ label: 'Program Afiliasi' }]}
      />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-50`}>
                <s.icon className={`w-5 h-5 text-${s.color}-500`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-base font-black text-slate-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TAB_LIST.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'verifikasi' && pending.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* === TAB: ANTREAN VERIFIKASI === */}
            {activeTab === 'verifikasi' && (
              <div>
                <h2 className="font-black text-slate-800 mb-4">Pendaftaran Menunggu Verifikasi ({pending.length})</h2>
                {pendingLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-indigo-500 w-6 h-6" /></div>
                ) : pending.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-semibold">Tidak ada pendaftaran menunggu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map(p => (
                      <div key={p.userId} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-900">{p.fullName}</h3>
                            <p className="text-xs text-slate-500">{p.email} · {p.phone}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.promotionChannels.map(ch => (
                                <span key={ch} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-semibold px-2 py-0.5 rounded-full">{ch}</span>
                              ))}
                            </div>
                            {p.promotionNotes && <p className="text-xs text-slate-500 mt-2 italic">&quot;{p.promotionNotes}&quot;</p>}
                            <div className="mt-2 text-xs text-slate-500">
                              Bank: <strong>{p.bankName}</strong> · {p.accountHolderName} · {p.accountNumber}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setApproveModal({ open: true, partner: p })}
                              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                              <Check className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button onClick={() => setRejectModal({ open: true, userId: p.userId, name: p.fullName })}
                              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                              <X className="w-3.5 h-3.5" /> Tolak
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === TAB: DIREKTORI MITRA === */}
            {activeTab === 'direktori' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="font-black text-slate-800">Direktori Mitra Aktif ({active.length})</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Cari nama, kode, email..." 
                      className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="pb-2 font-semibold">Mitra</th>
                        <th className="pb-2 font-semibold">Kode Referral</th>
                        <th className="pb-2 font-semibold text-right">Klik</th>
                        <th className="pb-2 font-semibold text-right">Konversi</th>
                        <th className="pb-2 font-semibold text-right">Total Komisi</th>
                        <th className="pb-2 font-semibold text-right">Saldo Tersedia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeLoading ? (
                        <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin w-5 h-5 mx-auto text-indigo-400" /></td></tr>
                      ) : filteredActive.map(a => (
                        <tr key={a.userId} className="hover:bg-slate-50">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-slate-900">{a.fullName}</div>
                            <div className="text-slate-400">{a.email}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-mono font-bold">{a.referralCode}</code>
                              <button onClick={() => copyToClipboard(a.referralCode)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold">{a.totalClicks.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-right font-semibold">{a.totalConversions.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-right font-bold text-indigo-700">{formatRupiah(a.totalEarnings)}</td>
                          <td className="py-3 text-right font-bold text-emerald-700">{formatRupiah(a.availableBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* === TAB: BUKU BESAR KOMISI === */}
            {activeTab === 'komisi' && (
              <div>
                <h2 className="font-black text-slate-800 mb-4">Buku Besar Komisi</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="pb-2 font-semibold">Domain</th>
                        <th className="pb-2 font-semibold">Item</th>
                        <th className="pb-2 font-semibold">Mitra (Kode)</th>
                        <th className="pb-2 font-semibold">Customer</th>
                        <th className="pb-2 font-semibold text-right">Transaksi</th>
                        <th className="pb-2 font-semibold text-right">Komisi</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {comLoading ? (
                        <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="animate-spin w-5 h-5 mx-auto text-indigo-400" /></td></tr>
                      ) : commissions.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-slate-400">Belum ada transaksi komisi</td></tr>
                      ) : commissions.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.domain === 'PELATIHAN' ? 'bg-blue-50 text-blue-700' : c.domain === 'KATALOG' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'}`}>
                              {c.domain}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-slate-800 max-w-[160px] truncate">{c.itemTitle}</td>
                          <td className="py-2.5 pr-3"><code className="font-mono text-indigo-600">{c.referralCode}</code></td>
                          <td className="py-2.5 pr-3 text-slate-600">{c.customerName}</td>
                          <td className="py-2.5 pr-3 text-right">{formatRupiah(c.transactionAmount)}</td>
                          <td className="py-2.5 pr-3 text-right font-bold text-indigo-700">{formatRupiah(c.commissionAmount)}</td>
                          <td className="py-2.5"><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* === TAB: PENCAIRAN DANA === */}
            {activeTab === 'pencairan' && (
              <div>
                <h2 className="font-black text-slate-800 mb-4">Pengajuan Pencairan Dana</h2>
                {payoutLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-indigo-500 w-6 h-6" /></div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-semibold">Belum ada pengajuan pencairan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map(p => (
                      <div key={p.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-slate-900">{formatRupiah(p.amount)}</span>
                              <StatusBadge status={p.status} />
                            </div>
                            <p className="text-xs text-slate-500">
                              Mitra: <code className="font-mono text-indigo-600">{p.referralCode}</code> · {p.bankName} · {p.accountHolderName} · {p.accountNumber}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">Diajukan: {new Date(p.requestedAt).toLocaleDateString('id-ID', { day:'numeric',month:'long',year:'numeric' })}</p>
                          </div>
                          {p.status === 'REQUESTED' && (
                            <div className="flex gap-2">
                              <button onClick={() => setPayoutModal({ open: true, payout: p })}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
                                <Check className="w-3.5 h-3.5" /> Konfirmasi Transfer
                              </button>
                              <button onClick={() => rejectPayout({ payoutId: p.id!, affiliateId: p.affiliateId, adminNotes: 'Ditolak admin' })}
                                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                                <X className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          )}
                          {p.proofReceiptUrl && (
                            <a href={p.proofReceiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                              <ExternalLink className="w-3.5 h-3.5" /> Bukti Transfer
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === TAB: PENGATURAN === */}
            {activeTab === 'pengaturan' && (
              <div className="max-w-lg">
                <h2 className="font-black text-slate-800 mb-1">Pengaturan Komisi Global</h2>
                <p className="text-xs text-slate-500 mb-6">Tarif berlaku untuk semua mitra afiliasi aktif</p>
                <div className="space-y-5">
                  {[
                    { key: 'trainingCommissionRate', label: 'Komisi Pelatihan (%)', min: 1, max: 30 },
                    { key: 'facilityCommissionRate', label: 'Komisi Fasilitas (%)', min: 1, max: 30 },
                    { key: 'catalogCommissionRate', label: 'Komisi Katalog (%)', min: 1, max: 30 },
                    { key: 'cookieAttributionDays', label: 'Masa Atribusi Cookie (hari)', min: 1, max: 90 },
                    { key: 'minPayoutAmount', label: 'Minimal Pencairan (Rp)', min: 10000, max: 500000 },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{field.label}</label>
                      <input
                        type="number" min={field.min} max={field.max}
                        value={settingsForm[field.key as keyof typeof settingsForm]}
                        onChange={e => setSettingsForm(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  ))}
                  <button onClick={() => updateSettings({
                    trainingCommissionRate: settingsForm.trainingCommissionRate / 100,
                    facilityCommissionRate: settingsForm.facilityCommissionRate / 100,
                    catalogCommissionRate: settingsForm.catalogCommissionRate / 100,
                    cookieAttributionDays: settingsForm.cookieAttributionDays,
                    minPayoutAmount: settingsForm.minPayoutAmount,
                  })} disabled={settingSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    {settingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Modal: Setujui Mitra */}
      {approveModal?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-slate-900 mb-1">Setujui Mitra Afiliasi</h3>
            <p className="text-xs text-slate-500 mb-4">Mitra: <strong>{approveModal.partner.fullName}</strong></p>
            <p className="text-xs text-slate-500 mb-1">Kode referral otomatis: <code className="font-mono text-indigo-600">{approveModal.partner.referralCode}</code></p>
            <label className="block text-xs font-bold text-slate-700 mt-3 mb-1">Kode Kustom (opsional)</label>
            <input value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())}
              placeholder={`e.g. STP-${approveModal.partner.fullName.split(' ')[0].toUpperCase()}`}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={affSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {affSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Setujui
              </button>
              <button onClick={() => setApproveModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tolak Mitra */}
      {rejectModal?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-slate-900 mb-1">Tolak Pendaftaran</h3>
            <p className="text-xs text-slate-500 mb-4">Mitra: <strong>{rejectModal.name}</strong></p>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penolakan *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="Jelaskan alasan penolakan kepada calon mitra..." 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={affSubmitting || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {affSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Tolak
              </button>
              <button onClick={() => setRejectModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Pencairan */}
      {payoutModal?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-slate-900 mb-1">Konfirmasi Transfer</h3>
            <p className="text-xs text-slate-500 mb-4">
              {formatRupiah(payoutModal.payout.amount)} ke <strong>{payoutModal.payout.accountHolderName}</strong><br />
              {payoutModal.payout.bankName} · {payoutModal.payout.accountNumber}
            </p>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Bukti Transfer *</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center mb-3 cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => fileRef.current?.click()}>
              {proofFile ? (
                <p className="text-xs text-emerald-600 font-bold">{proofFile.name}</p>
              ) : (
                <div>
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Klik untuk upload bukti transfer (JPG/PNG/PDF)</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Admin (opsional)</label>
            <input value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              placeholder="e.g. Transfer via BCA 14:30"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleProcessPayout} disabled={isUploading || !proofFile}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Konfirmasi
              </button>
              <button onClick={() => setPayoutModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
