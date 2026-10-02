'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useAffiliateProfile, useMyCommissions, useMyPayouts } from '@/hooks/useAffiliate';
import { formatRupiah } from '@/utils/format';
import { affiliateService } from '@/services/affiliate.service';
import { toast } from 'sonner';
import {
  Share2, CheckCircle2, Clock, XCircle, Link2, Copy, TrendingUp,
  Wallet, Banknote, ChevronDown, ChevronUp, Loader2, ArrowUpRight,
  GraduationCap, ShoppingBag, Building2, BadgeCheck, AlertCircle, Edit3, X
} from 'lucide-react';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const PROMOTION_CHANNELS = [
  'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter / X',
  'Website / Blog', 'WhatsApp Group', 'Komunitas / Forum',
  'Kampus / Universitas', 'Rekan Kerja / Kantor',
];

const BANK_OPTIONS = [
  'BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Danamon', 'Permata',
  'GoPay', 'OVO', 'DANA', 'LinkAja', 'ShopeePay',
];

const DOMAIN_DEEP_LINKS = [
  { key: 'PELATIHAN', label: 'Program Pelatihan', icon: GraduationCap, path: '/program-pelatihan', color: 'blue' },
  { key: 'FASILITAS', label: 'Fasilitas & Ruangan', icon: Building2, path: '/fasilitas', color: 'teal' },
  { key: 'KATALOG', label: 'Katalog Produk/Jasa', icon: ShoppingBag, path: '/e-katalog', color: 'purple' },
];

// ─── Komponen Status Badge ─────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Menunggu Verifikasi Admin', cls: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
    APPROVED: { label: 'Mitra Aktif', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <BadgeCheck className="w-3.5 h-3.5" /> },
    REJECTED: { label: 'Pendaftaran Ditolak', cls: 'bg-red-50 text-red-600 border border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
    SUSPENDED: { label: 'Akun Disuspend', cls: 'bg-slate-100 text-slate-600 border border-slate-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── Komponen Utama ─────────────────────────────────────────────────────────────
interface TabAfiliasiProps {
  user: User;
}

export default function TabAfiliasi({ user }: TabAfiliasiProps) {
  const { profile, loading, applyForAffiliate, isSubmitting } = useAffiliateProfile(user.uid);
  const { data: commissions = [], isLoading: comLoading } = useMyCommissions(profile?.userId);
  const { payouts, requestPayout, isSubmitting: payoutSubmitting } = useMyPayouts(profile?.userId);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  // Form pendaftaran
  const [form, setForm] = useState({
    fullName: user.displayName || '',
    email: user.email || '',
    phone: '',
    bankName: 'BCA',
    accountNumber: '',
    accountHolderName: '',
    promotionChannels: [] as string[],
    promotionNotes: '',
    agreeTerms: false,
  });

  // State untuk deep-link generator
  const [baseUrl, setBaseUrl] = useState('');
  React.useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      promotionChannels: prev.promotionChannels.includes(ch)
        ? prev.promotionChannels.filter(c => c !== ch)
        : [...prev.promotionChannels, ch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms) return toast.error('Setujui syarat & ketentuan terlebih dahulu');
    if (form.promotionChannels.length === 0) return toast.error('Pilih minimal satu media promosi');
    if (!form.phone || !form.accountNumber || !form.accountHolderName) return toast.error('Lengkapi semua data');
    await applyForAffiliate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      accountHolderName: form.accountHolderName,
      promotionChannels: form.promotionChannels,
      promotionNotes: form.promotionNotes || undefined,
    });
  };

  const copyDeepLink = (path: string) => {
    if (!profile) return;
    const link = `${baseUrl}${path}?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Link disalin!', { description: link });
  };

  const handleRequestPayout = async () => {
    if (!profile) return;
    const amount = parseInt(payoutAmount.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 50000) return toast.error('Minimal pencairan Rp 50.000');
    if (amount > profile.availableBalance) return toast.error('Saldo tidak mencukupi');
    await requestPayout({
      referralCode: profile.referralCode,
      amount,
      bankName: profile.bankName,
      accountNumber: profile.accountNumber,
      accountHolderName: profile.accountHolderName,
    });
    setShowPayoutModal(false);
    setPayoutAmount('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── STATE A: Belum Terdaftar ─────────────────────────────────────────────
  if (!profile) {
    return (
      <div>
        {/* Banner Benefit */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Program Afiliasi</span>
            </div>
            <h2 className="text-xl font-black mb-2 leading-snug">Dapatkan Komisi dengan<br />Mempromosikan KST Technopark</h2>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Pelatihan', rate: '5%', icon: '🎓' },
                { label: 'Fasilitas', rate: '5%', icon: '🏢' },
                { label: 'Katalog', rate: '5%', icon: '🛒' },
              ].map(b => (
                <div key={b.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-0.5">{b.icon}</div>
                  <div className="text-xs text-indigo-100">{b.label}</div>
                  <div className="text-base font-black">{b.rate}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-200 mt-3">Atribusi 30 hari • Minimal penarikan Rp 50.000 • Transfer langsung ke rekening Anda</p>
          </div>
        </div>

        {/* Form Pendaftaran */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="font-black text-slate-900 mb-4">Formulir Pendaftaran Mitra</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input value={form.email} disabled className="w-full border border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required placeholder="08xxxxxxxxxx"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>

          {/* Data Rekening */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Data Rekening Pencairan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank / E-Wallet *</label>
                <select value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  {BANK_OPTIONS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Rekening / Akun *</label>
                <input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} required placeholder="1234567890"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening *</label>
                <input value={form.accountHolderName} onChange={e => setForm(p => ({ ...p, accountHolderName: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>

          {/* Media Promosi */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Media Promosi yang Digunakan *</h4>
            <div className="flex flex-wrap gap-2">
              {PROMOTION_CHANNELS.map(ch => (
                <button type="button" key={ch} onClick={() => toggleChannel(ch)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${form.promotionChannels.includes(ch) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan Promosi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ceritakan rencana promosi Anda (opsional)</label>
            <textarea value={form.promotionNotes} onChange={e => setForm(p => ({ ...p, promotionNotes: e.target.value }))} rows={3}
              placeholder="e.g. Saya memiliki Instagram 5k followers di bidang teknologi dan startup..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
          </div>

          {/* Persetujuan */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.agreeTerms} onChange={e => setForm(p => ({ ...p, agreeTerms: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded accent-indigo-600" />
            <span className="text-xs text-slate-600 leading-relaxed">
              Saya menyetujui bahwa saya akan mempromosikan produk & layanan KST Solo Technopark secara jujur, tidak menyesatkan,
              dan sesuai etika. Komisi hanya diberikan atas transaksi yang sah.
            </span>
          </label>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Daftar sebagai Mitra Afiliasi
          </button>
        </form>
      </div>
    );
  }

  // ─── STATE B: Menunggu / Ditolak / Suspended ───────────────────────────────
  if (profile.status === 'PENDING' || profile.status === 'REJECTED' || profile.status === 'SUSPENDED') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-900">Program Afiliasi</h2>
          <StatusPill status={profile.status} />
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          {profile.status === 'PENDING' && (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-black text-amber-900 mb-1">Pendaftaran Dalam Review</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Tim kami sedang memverifikasi pendaftaran Anda. Proses biasanya membutuhkan 1-3 hari kerja.
                Anda akan mendapat notifikasi setelah disetujui.
              </p>
              <div className="mt-4 text-xs text-amber-600">
                Kode referral sementara: <code className="font-mono font-bold">{profile.referralCode}</code>
              </div>
            </>
          )}
          {profile.status === 'REJECTED' && (
            <>
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-black text-red-900 mb-1">Pendaftaran Ditolak</h3>
              {profile.rejectionReason && <p className="text-xs text-red-700">Alasan: {profile.rejectionReason}</p>}
              <p className="text-xs text-red-600 mt-2">Hubungi tim kami untuk informasi lebih lanjut.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── STATE C: Approved — Dashboard Mitra ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-900 text-lg">Dashboard Mitra Afiliasi</h2>
          <StatusPill status={profile.status} />
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5">
          <span className="text-xs text-indigo-600 font-medium">Kode Referral Anda:</span>
          <code className="font-mono font-black text-indigo-700 text-sm">{profile.referralCode}</code>
          <button onClick={() => { navigator.clipboard.writeText(profile.referralCode); toast.success('Kode disalin!'); }}
            className="text-indigo-500 hover:text-indigo-700 transition-colors ml-1">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Statistik Dompet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Komisi', value: formatRupiah(profile.totalEarnings), icon: TrendingUp, color: 'indigo' },
          { label: 'Saldo Tersedia', value: formatRupiah(profile.availableBalance), icon: Wallet, color: 'emerald' },
          { label: 'Menunggu Kliring', value: formatRupiah(profile.pendingBalance), icon: Clock, color: 'amber' },
          { label: 'Total Dicairkan', value: formatRupiah(profile.withdrawnAmount), icon: Banknote, color: 'slate' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${s.color}-50 mb-2`}>
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
            <p className="text-sm font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stats Klik & Konversi */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
          <p className="text-2xl font-black text-indigo-600">{profile.totalClicks.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Klik</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
          <p className="text-2xl font-black text-emerald-600">{profile.totalConversions.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Konversi Berhasil</p>
        </div>
      </div>

      {/* Tombol Tarik Saldo */}
      <button onClick={() => setShowPayoutModal(true)} disabled={profile.availableBalance < 50000}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
        <Banknote className="w-4 h-4" /> Tarik Saldo ke Rekening
        {profile.availableBalance < 50000 && <span className="text-xs font-normal opacity-80">(Min. Rp 50.000)</span>}
      </button>

      {/* Deep Link Generator */}
      <div>
        <h3 className="font-black text-slate-800 mb-3 text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-500" /> Generator Link Referral
        </h3>
        <div className="space-y-3">
          {DOMAIN_DEEP_LINKS.map(d => (
            <div key={d.key} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 bg-${d.color}-50 rounded-lg flex items-center justify-center`}>
                  <d.icon className={`w-4 h-4 text-${d.color}-600`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{d.label}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">...{d.path}?ref={profile.referralCode}</p>
                </div>
              </div>
              <button onClick={() => copyDeepLink(d.path)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all">
                <Copy className="w-3.5 h-3.5" /> Salin
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Komisi */}
      <div>
        <h3 className="font-black text-slate-800 mb-3 text-sm">Riwayat Komisi</h3>
        {comLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin w-5 h-5 text-indigo-400" /></div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-xs font-medium">Belum ada komisi — mulai bagikan link referral Anda!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commissions.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{c.itemTitle}</p>
                  <p className="text-[11px] text-slate-500">{c.customerName} · {c.domain}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-xs font-black ${c.status === 'CLEARED' ? 'text-emerald-600' : c.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-amber-600'}`}>
                    +{formatRupiah(c.commissionAmount)}
                  </p>
                  <p className={`text-[10px] font-semibold ${c.status === 'CLEARED' ? 'text-emerald-500' : c.status === 'CANCELLED' ? 'text-slate-400' : 'text-amber-500'}`}>
                    {c.status === 'CLEARED' ? 'Lunas' : c.status === 'CANCELLED' ? 'Batal' : 'Menunggu'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Pencairan */}
      {payouts.length > 0 && (
        <div>
          <h3 className="font-black text-slate-800 mb-3 text-sm">Riwayat Pencairan</h3>
          <div className="space-y-2">
            {payouts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">{formatRupiah(p.amount)}</p>
                  <p className="text-[11px] text-slate-500">{p.bankName} · {p.accountNumber}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'TRANSFERRED' ? 'bg-emerald-50 text-emerald-700' : p.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {p.status === 'TRANSFERRED' ? 'Ditransfer' : p.status === 'REJECTED' ? 'Ditolak' : 'Diproses'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Pencairan */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Tarik Saldo</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-emerald-600 font-medium">Saldo Tersedia</p>
              <p className="text-2xl font-black text-emerald-700">{formatRupiah(profile.availableBalance)}</p>
            </div>
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Tujuan transfer: <strong>{profile.bankName}</strong> · {profile.accountHolderName} · {profile.accountNumber}</p>
            </div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Penarikan *</label>
            <input
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Minimal Rp 50.000"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleRequestPayout} disabled={payoutSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {payoutSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />} Ajukan Pencairan
              </button>
              <button onClick={() => setShowPayoutModal(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
