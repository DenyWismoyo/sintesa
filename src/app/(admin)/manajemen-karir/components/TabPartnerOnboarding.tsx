// src/app/(admin)/manajemen-karir/components/TabPartnerOnboarding.tsx
'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  UserCheck,
  KeyRound,
  MessageCircle,
  Clock,
  ShieldCheck,
  Send,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JobListing } from '@/types/job.types';
import {
  PARTNER_TIER_LABELS,
  PartnerTier,
  PartnershipInquiry,
} from '@/types/partnership.types';
import {
  useAllPartners,
  usePartnershipInquiries,
  useAllTalentInvitations,
  usePartnerMutations,
} from '@/hooks/usePartners';
import { ConvertInquiryResult } from '@/services/partner.service';
import { toast } from 'sonner';

interface TabPartnerOnboardingProps {
  pendingJobs: JobListing[];
  onRefreshJobs: () => void;
}

export default function TabPartnerOnboarding({
  pendingJobs,
  onRefreshJobs,
}: TabPartnerOnboardingProps) {
  const { data: inquiries = [], isLoading: loadingInquiries } = usePartnershipInquiries();
  const { data: partners = [] } = useAllPartners();
  const { data: invitations = [] } = useAllTalentInvitations();
  const { convertInquiryMutation, reviewJobMutation, updateInvitationStatusMutation } =
    usePartnerMutations();

  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
  const [tier, setTier] = useState<PartnerTier>('HIRING_PARTNER');
  const [industrySector, setIndustrySector] = useState('Teknologi & Industri');
  const [location, setLocation] = useState('Surakarta, Jawa Tengah');
  const [onboardingResult, setOnboardingResult] = useState<{
    result: ConvertInquiryResult;
    phone: string;
    picName: string;
  } | null>(null);

  const handleReviewJob = async (job: JobListing, action: 'APPROVE' | 'REJECT') => {
    try {
      await reviewJobMutation.mutateAsync({ id: job.id, action });
      toast.success(
        action === 'APPROVE'
          ? `Lowongan "${job.title}" resmi disetujui & tayang di Bursa Karir!`
          : `Pengajuan lowongan "${job.title}" ditolak.`
      );
      onRefreshJobs();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses kurasi lowongan.');
    }
  };

  const handleConvertPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry?.id) return;
    try {
      const res = await convertInquiryMutation.mutateAsync({
        inquiryId: selectedInquiry.id,
        tier,
        industrySector,
        location,
      });
      setOnboardingResult({
        result: res,
        phone: selectedInquiry.picPhone,
        picName: selectedInquiry.picName,
      });
      setSelectedInquiry(null);
      toast.success(`Akun Mitra Resmi untuk ${res.companyName || 'Mitra'} berhasil diaktifkan!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengonversi calon mitra.');
    }
  };

  const buildWhatsAppUrl = (phone: string, picName: string, res: ConvertInquiryResult) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://solotechnopark.id';
    const credInfo = res.tempPassword
      ? `\n• Email Login: *${res.picEmail}*\n• Kata Sandi Sementara: *${res.tempPassword}*`
      : `\n• Email Terdaftar: *${res.picEmail}* (gunakan kata sandi akun Anda yang sudah aktif)`;
    const text = `Halo Bapak/Ibu *${picName}* (${res.companyName || 'Mitra Industri'}),\n\nSelamat! Pengajuan kemitraan Anda di *Solo Technopark* telah disetujui sebagai *Mitra Resmi Penyaluran Karir & Ekosistem Talenta STP × RSKB Surakarta*.\n${credInfo}\n• Portal Mitra Resmi: ${origin}/mitra/dashboard\n\nSilakan login untuk mulai menayangkan lowongan kerja/magang serta mengakses Katalog Talenta Terverifikasi kami. Terima kasih!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Banner Kredensial Onboarding Baru */}
      {onboardingResult && (
        <div className="p-5 rounded-3xl bg-emerald-950 text-white border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" /> Akun Mitra Resmi Siap Digunakan
            </div>
            <p className="text-sm font-bold">
              {onboardingResult.result.companyName} — PIC: {onboardingResult.result.picEmail}
            </p>
            <p className="text-xs text-emerald-100/90">
              {onboardingResult.result.tempPassword ? (
                <>
                  Password Sementara: <code className="px-2 py-0.5 rounded bg-emerald-900 font-mono font-bold">{onboardingResult.result.tempPassword}</code>
                </>
              ) : (
                'Akun email PIC sudah terdaftar sebelumnya dan kini otomatis memiliki akses Portal Mitra (/mitra).'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={buildWhatsAppUrl(
                onboardingResult.phone,
                onboardingResult.picName,
                onboardingResult.result
              )}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> Kirim Akses via WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setOnboardingResult(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Antrean Kurasi Lowongan Mitra & Startup Tenant */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Antrean Verifikasi Lowongan Mitra & Startup Tenant ({pendingJobs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Tinjau pengajuan lowongan/magang dari Portal Mitra Resmi (`/mitra`) dan Startup Tenant (`/tenant/talent`) sebelum tayang di `/karir`.
            </p>
          </div>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
            Tidak ada antrean draft lowongan yang menunggu persetujuan saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingJobs.map((job) => (
              <div key={job.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{job.title}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800">
                      {job.tenantId ? 'Startup Tenant STP' : 'Mitra Industri'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.company} • {job.workType} ({job.workSetup}) • {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewJobMutation.isPending}
                    onClick={() => handleReviewJob(job, 'APPROVE')}
                    className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui & Tayangkan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reviewJobMutation.isPending}
                    onClick={() => handleReviewJob(job, 'REJECT')}
                    className="h-8 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Pipeline Calon Mitra (/kemitraan -> Mitra Resmi) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Pipeline Calon Mitra Industri & Direktori Mitra Aktif ({partners.length} Aktif)
            </h3>
            <p className="text-xs text-slate-500">
              Konversi permohonan kerjasama dari halaman `/kemitraan` menjadi akun **Portal Mitra Resmi (`/mitra`)** dalam 1 klik.
            </p>
          </div>
        </div>

        {loadingInquiries ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
            Belum ada pengajuan calon mitra dari formulir `/kemitraan`.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 pr-4">Instansi / Perusahaan</th>
                  <th className="py-2.5 px-4">PIC & Kontak</th>
                  <th className="py-2.5 px-4">Fokus Kerjasama</th>
                  <th className="py-2.5 pl-4 text-right">Status & Onboarding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.slice(0, 20).map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-900">{inq.agencyName}</div>
                      <div className="text-[11px] text-slate-500">{inq.agencyType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{inq.picName}</div>
                      <div className="text-[11px] text-slate-500">{inq.picEmail} • {inq.picPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inq.partnershipType === 'TALENT_RECRUITMENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inq.partnershipType === 'TALENT_RECRUITMENT' ? 'Rekrutmen Talenta' : inq.partnershipType}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      {inq.convertedPartnerId ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" /> Mitra Resmi Aktif
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setTier(
                              inq.agencyType.includes('Pemerintah') ? 'GOVERNMENT_RSKB' : 'HIRING_PARTNER'
                            );
                          }}
                          className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Aktifkan Akun Mitra
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Mediasi Undangan Wawancara ke Alumni */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-600" />
            Log Undangan Wawancara Mitra & Startup ke Alumni ({invitations.length})
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {invitations.slice(0, 10).map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900">{inv.senderCompanyName}</span> mengundang{' '}
                  <span className="font-bold text-emerald-700">{inv.alumniName}</span> untuk posisi{' '}
                  <span className="font-semibold">{inv.roleOffered}</span> ({inv.workType})
                </div>
                {inv.status === 'PENDING' && inv.id ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateInvitationStatusMutation.mutate({
                        id: inv.id!,
                        status: 'REVIEWED_BY_ADMIN',
                      })
                    }
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold"
                  >
                    Tandai Terverifikasi
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    {inv.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Konversi Mitra Resmi */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConvertPartner}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Aktifkan Portal Mitra Resmi
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedInquiry.agencyName} ({selectedInquiry.picEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tingkatan Kemitraan</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as PartnerTier)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  {(Object.keys(PARTNER_TIER_LABELS) as PartnerTier[]).map((k) => (
                    <option key={k} value={k}>
                      {PARTNER_TIER_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sektor Industri</label>
                <Input
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Domisili Operasional</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={convertInquiryMutation.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {convertInquiryMutation.isPending ? 'Membuat Akun...' : 'Buat Akun Mitra Resmi'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

