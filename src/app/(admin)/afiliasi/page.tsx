'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  useAllAffiliates,
  useAllCommissions,
  useAllPayouts,
  useAffiliateSettings,
} from '@/hooks/useAffiliate';
import { useFinance } from '@/hooks/useFinance';
import { storageService } from '@/services/storage.service';
import { formatRupiah } from '@/utils/format';
import {
  AffiliatePartner,
  CommissionRecord,
  AffiliatePayoutRequest,
} from '@/types/affiliate.types';
import { toast } from 'sonner';
import {
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Check,
  X,
  Banknote,
  UploadCloud,
  Settings2,
  ExternalLink,
  Copy,
  Loader2,
  Landmark,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminResponsiveView,
  AdminFormDrawer,
  AdminStatGrid,
  AdminMobileCard,
  AdminStatusBadge,
} from '@/components/admin';
import { useAdminTab } from '@/hooks/useAdminTab';

const AFILIASI_TABS = ['verifikasi', 'direktori', 'komisi', 'pencairan', 'pengaturan'] as const;
type AfiliasiTab = (typeof AFILIASI_TABS)[number];

export default function AfiliasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useAdminTab<AfiliasiTab>('verifikasi', AFILIASI_TABS);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    userId: string;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    partner: AffiliatePartner;
  } | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [payoutModal, setPayoutModal] = useState<{
    open: boolean;
    payout: AffiliatePayoutRequest;
  } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [selectedSourceAccountId, setSelectedSourceAccountId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { accounts, createNewExpense, updateExpenseStatus } = useFinance();
  const kasBankAccounts = (accounts || []).filter((a) => a.type === 'KAS_BANK');
  const bebanAccounts = (accounts || []).filter((a) => a.type === 'BEBAN');

  const {
    affiliates: pending,
    isLoading: pendingLoading,
    approveAffiliate,
    rejectAffiliate,
    isSubmitting: affSubmitting,
  } = useAllAffiliates('PENDING');
  const { affiliates: active, isLoading: activeLoading } = useAllAffiliates('APPROVED');
  const { affiliates: allAff } = useAllAffiliates();
  const { data: commissions = [], isLoading: comLoading } = useAllCommissions();
  const {
    payouts,
    isLoading: payoutLoading,
    processPayout,
    rejectPayout,
  } = useAllPayouts();
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

  React.useEffect(() => {
    if (!selectedSourceAccountId && kasBankAccounts.length > 0 && kasBankAccounts[0].id) {
      setSelectedSourceAccountId(kasBankAccounts[0].id);
    }
  }, [kasBankAccounts, selectedSourceAccountId]);

  const filteredActive = active.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!approveModal || !user) return;
    await approveAffiliate({
      userId: approveModal.partner.userId,
      approvedBy: user.uid,
      customCode: customCode || undefined,
    });
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
      const url = await storageService.uploadFile(
        proofFile,
        `affiliate_payouts/${payoutModal.payout.id}/bukti-transfer`
      );
      await processPayout({
        payoutId: payoutModal.payout.id!,
        affiliateId: payoutModal.payout.affiliateId,
        processedBy: user.uid,
        proofReceiptUrl: url,
        adminNotes,
      });

      if (selectedSourceAccountId) {
        const defaultBebanAcc =
          bebanAccounts.find(
            (a) =>
              a.name.toLowerCase().includes('pemasaran') ||
              a.name.toLowerCase().includes('komisi') ||
              a.name.toLowerCase().includes('operasional')
          ) || bebanAccounts[0];
        const expenseNumber = `EXP/AFF/${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '')}/${Math.floor(1000 + Math.random() * 9000)}`;
        const expData = {
          expenseNumber,
          date: new Date().toISOString().split('T')[0],
          categoryId: defaultBebanAcc?.id || '5-1099',
          categoryName: defaultBebanAcc?.name || 'Beban Komisi Afiliasi & Pemasaran',
          payeeName: `${payoutModal.payout.accountHolderName} (Mitra ${payoutModal.payout.referralCode})`,
          description: `Pencairan Komisi Afiliasi Mitra ${payoutModal.payout.referralCode} ke ${payoutModal.payout.bankName} ${payoutModal.payout.accountNumber}${
            adminNotes ? ` (${adminNotes})` : ''
          }`,
          amount: payoutModal.payout.amount,
          sourceAccountId: selectedSourceAccountId,
          status: 'PENDING_APPROVAL' as const,
          receiptUrl: url,
        };
        const expRes = await createNewExpense(expData, null);
        if (expRes.success && expRes.id) {
          await updateExpenseStatus({ ...expData, id: expRes.id }, 'PAID');
          toast.success(
            'Jurnal Pengeluaran & Pemotongan Saldo Kas/Bank berhasil dicatat otomatis.'
          );
        }
      }

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

  const totalClearedCommission = commissions
    .filter((c) => c.status === 'CLEARED')
    .reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Program Afiliasi Mitra"
        subtitle="Kelola mitra referral, verifikasi pendaftar, monitoring buku besar komisi, dan persetujuan pencairan dana."
        badge={
          pending.length > 0
            ? `${pending.length} Menunggu Verifikasi`
            : 'Semua Mitra Terverifikasi'
        }
        breadcrumbs={[{ label: 'Komersial' }, { label: 'Program Afiliasi' }]}
        tabs={[
          {
            id: 'verifikasi',
            label: 'Antrean Verifikasi',
            icon: <Clock size={14} />,
            badge: pending.length,
          },
          {
            id: 'direktori',
            label: 'Direktori Mitra',
            icon: <Users size={14} />,
            badge: active.length,
          },
          { id: 'komisi', label: 'Buku Besar Komisi', icon: <TrendingUp size={14} /> },
          { id: 'pencairan', label: 'Pencairan Dana', icon: <Banknote size={14} /> },
          { id: 'pengaturan', label: 'Pengaturan Komisi', icon: <Settings2 size={14} /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. STATS CARDS */}
      <AdminStatGrid
        items={[
          {
            title: 'Total Mitra Terdaftar',
            value: allAff.length,
            suffix: 'Mitra',
            icon: <Users className="w-5 h-5" />,
            color: 'blue',
          },
          {
            title: 'Mitra Aktif',
            value: active.length,
            suffix: 'Disetujui',
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'emerald',
          },
          {
            title: 'Menunggu Verifikasi',
            value: pending.length,
            suffix: 'Antrean',
            icon: <Clock className="w-5 h-5" />,
            color: 'amber',
          },
          {
            title: 'Total Komisi Cleared',
            value: formatRupiah(totalClearedCommission),
            icon: <DollarSign className="w-5 h-5" />,
            color: 'indigo',
          },
        ]}
      />

      {/* 3. TAB CONTENT */}
      {activeTab === 'verifikasi' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
          <h2 className="font-black text-slate-800 text-sm sm:text-base mb-4">
            Pendaftaran Menunggu Verifikasi ({pending.length})
          </h2>
          {pendingLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-sm">Tidak ada pendaftaran menunggu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {pending.map((p) => (
                <div
                  key={p.userId}
                  className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-slate-50/40 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {p.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {p.email} · {p.phone}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.promotionChannels.map((ch) => (
                        <span
                          key={ch}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                    {p.promotionNotes && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        &quot;{p.promotionNotes}&quot;
                      </p>
                    )}
                    <div className="mt-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      Bank: <strong>{p.bankName}</strong> · {p.accountHolderName} ·{' '}
                      <span className="font-mono">{p.accountNumber}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setApproveModal({ open: true, partner: p })}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() =>
                        setRejectModal({ open: true, userId: p.userId, name: p.fullName })
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'direktori' && (
        <div className="space-y-4">
          <AdminFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cari nama mitra, kode referral, atau email..."
            totalHits={filteredActive.length}
            totalLabel="mitra aktif"
          />

          <AdminResponsiveView<AffiliatePartner>
            items={filteredActive}
            isLoading={activeLoading}
            emptyTitle="Belum Ada Mitra Aktif"
            emptyMessage="Tidak ditemukan mitra afiliasi yang sesuai dengan kata kunci pencarian."
            renderDesktopTable={(items) => (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Mitra</th>
                    <th className="py-3.5 px-4">Kode Referral</th>
                    <th className="py-3.5 px-4 text-right">Klik</th>
                    <th className="py-3.5 px-4 text-right">Konversi</th>
                    <th className="py-3.5 px-4 text-right">Total Komisi</th>
                    <th className="py-3.5 px-4 text-right">Saldo Tersedia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((a) => (
                    <tr key={a.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{a.fullName}</div>
                        <div className="text-xs text-slate-400">{a.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-mono font-bold text-xs">
                            {a.referralCode}
                          </code>
                          <button
                            onClick={() => copyToClipboard(a.referralCode)}
                            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {a.totalClicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {a.totalConversions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700 font-mono">
                        {formatRupiah(a.totalEarnings)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                        {formatRupiah(a.availableBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            renderMobileCard={(a) => (
              <AdminMobileCard
                code={a.referralCode}
                badge={<AdminStatusBadge status="APPROVED" label="Mitra Aktif" />}
                title={a.fullName}
                subtitle={a.email}
                fields={[
                  { label: 'Total Klik', value: a.totalClicks.toLocaleString() },
                  { label: 'Konversi', value: a.totalConversions.toLocaleString() },
                  {
                    label: 'Total Komisi',
                    value: (
                      <span className="font-mono text-indigo-700">
                        {formatRupiah(a.totalEarnings)}
                      </span>
                    ),
                  },
                  {
                    label: 'Saldo Tersedia',
                    value: (
                      <span className="font-mono text-emerald-700">
                        {formatRupiah(a.availableBalance)}
                      </span>
                    ),
                  },
                ]}
                actions={
                  <button
                    onClick={() => copyToClipboard(a.referralCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Kode
                  </button>
                }
              />
            )}
          />
        </div>
      )}

      {activeTab === 'komisi' && (
        <AdminResponsiveView<CommissionRecord>
          items={commissions}
          isLoading={comLoading}
          emptyTitle="Belum Ada Transaksi Komisi"
          emptyMessage="Buku besar komisi referral masih kosong."
          renderDesktopTable={(items) => (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Mitra (Kode)</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Transaksi</th>
                  <th className="py-3.5 px-4 text-right">Komisi</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.domain === 'PELATIHAN'
                            ? 'bg-blue-50 text-blue-700'
                            : c.domain === 'KATALOG'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {c.domain}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                      {c.itemTitle}
                    </td>
                    <td className="py-3 px-4">
                      <code className="font-mono font-bold text-indigo-600">{c.referralCode}</code>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatRupiah(c.transactionAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700 font-mono">
                      {formatRupiah(c.commissionAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <AdminStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderMobileCard={(c) => (
            <AdminMobileCard
              code={`${c.domain} • ${c.referralCode}`}
              badge={<AdminStatusBadge status={c.status} />}
              title={c.itemTitle}
              subtitle={`Customer: ${c.customerName}`}
              fields={[
                { label: 'Nilai Transaksi', value: formatRupiah(c.transactionAmount) },
                {
                  label: 'Komisi Mitra',
                  value: (
                    <span className="font-mono font-bold text-indigo-700">
                      {formatRupiah(c.commissionAmount)}
                    </span>
                  ),
                },
              ]}
            />
          )}
        />
      )}

      {activeTab === 'pencairan' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
          <h2 className="font-black text-slate-800 text-sm sm:text-base mb-4">
            Pengajuan Pencairan Dana
          </h2>
          {payoutLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-sm">Belum ada pengajuan pencairan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/40 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-black text-base text-slate-900 font-mono">
                        {formatRupiah(p.amount)}
                      </span>
                      <AdminStatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-slate-600">
                      Mitra: <code className="font-mono font-bold text-indigo-600">{p.referralCode}</code> ·{' '}
                      {p.bankName} · {p.accountHolderName} · {p.accountNumber}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Diajukan:{' '}
                      {new Date(p.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {p.status === 'REQUESTED' && (
                      <>
                        <button
                          onClick={() => setPayoutModal({ open: true, payout: p })}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Konfirmasi Transfer
                        </button>
                        <button
                          onClick={() =>
                            rejectPayout({
                              payoutId: p.id!,
                              affiliateId: p.affiliateId,
                              adminNotes: 'Ditolak admin',
                            })
                          }
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </>
                    )}
                    {p.proofReceiptUrl && (
                      <a
                        href={p.proofReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                      >
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

      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 max-w-xl">
          <h2 className="font-black text-slate-800 mb-1">Pengaturan Komisi Global</h2>
          <p className="text-xs text-slate-500 mb-6">
            Tarif berlaku untuk semua mitra afiliasi aktif
          </p>
          <div className="space-y-4">
            {[
              { key: 'trainingCommissionRate', label: 'Komisi Pelatihan (%)', min: 1, max: 30 },
              { key: 'facilityCommissionRate', label: 'Komisi Fasilitas (%)', min: 1, max: 30 },
              { key: 'catalogCommissionRate', label: 'Komisi Katalog (%)', min: 1, max: 30 },
              {
                key: 'cookieAttributionDays',
                label: 'Masa Atribusi Cookie (hari)',
                min: 1,
                max: 90,
              },
              {
                key: 'minPayoutAmount',
                label: 'Minimal Pencairan (Rp)',
                min: 10000,
                max: 500000,
              },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={settingsForm[field.key as keyof typeof settingsForm]}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      [field.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateSettings({
                  trainingCommissionRate: settingsForm.trainingCommissionRate / 100,
                  facilityCommissionRate: settingsForm.facilityCommissionRate / 100,
                  catalogCommissionRate: settingsForm.catalogCommissionRate / 100,
                  cookieAttributionDays: settingsForm.cookieAttributionDays,
                  minPayoutAmount: settingsForm.minPayoutAmount,
                })
              }
              disabled={settingSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {settingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Drawer: Setujui Mitra */}
      <AdminFormDrawer
        isOpen={Boolean(approveModal?.open)}
        onClose={() => setApproveModal(null)}
        title="Setujui Mitra Afiliasi"
        subtitle={approveModal ? `Mitra: ${approveModal.partner.fullName}` : ''}
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setApproveModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleApprove}
              disabled={affSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {affSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Setujui Mitra
            </button>
          </>
        }
      >
        {approveModal && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Kode referral otomatis:{' '}
              <code className="font-mono font-bold text-indigo-600">
                {approveModal.partner.referralCode}
              </code>
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Kustom (opsional)
              </label>
              <input
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder={`e.g. STP-${approveModal.partner.fullName
                  .split(' ')[0]
                  .toUpperCase()}`}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* Drawer: Tolak Mitra */}
      <AdminFormDrawer
        isOpen={Boolean(rejectModal?.open)}
        onClose={() => setRejectModal(null)}
        title="Tolak Pendaftaran Mitra"
        subtitle={rejectModal ? `Mitra: ${rejectModal.name}` : ''}
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setRejectModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={affSubmitting || !rejectReason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {affSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Tolak Pendaftaran
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Alasan Penolakan *
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan penolakan kepada calon mitra..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
          />
        </div>
      </AdminFormDrawer>

      {/* Drawer: Konfirmasi Pencairan */}
      <AdminFormDrawer
        isOpen={Boolean(payoutModal?.open)}
        onClose={() => setPayoutModal(null)}
        title="Konfirmasi Transfer Komisi"
        subtitle={
          payoutModal
            ? `${formatRupiah(payoutModal.payout.amount)} ke ${payoutModal.payout.accountHolderName}`
            : ''
        }
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setPayoutModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleProcessPayout}
              disabled={isUploading || !proofFile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Konfirmasi & Catat Jurnal
            </button>
          </>
        }
      >
        {payoutModal && (
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              Tujuan: <strong>{payoutModal.payout.bankName}</strong> ·{' '}
              {payoutModal.payout.accountHolderName} ·{' '}
              <span className="font-mono font-bold">{payoutModal.payout.accountNumber}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-indigo-600" /> Rekening Kas / Bank Sumber Dana
                (BLUD) *
              </label>
              <select
                value={selectedSourceAccountId}
                onChange={(e) => setSelectedSourceAccountId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Pilih Rekening Kas/Bank Sumber --</option>
                {kasBankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({formatRupiah(acc.balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Bukti Transfer *
              </label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {proofFile ? (
                  <p className="text-xs text-emerald-600 font-bold">{proofFile.name}</p>
                ) : (
                  <div>
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">
                      Klik untuk upload bukti transfer (JPG/PNG/PDF)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Admin (opsional)
              </label>
              <input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Transfer via Bank Jateng 14:30"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}
      </AdminFormDrawer>
    </div>
  );
}
