// Lokasi file: src/hooks/useAffiliate.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { affiliateService } from '@/services/affiliate.service';
import { AffiliatePartner, CommissionRecord, AffiliatePayoutRequest, AffiliateSettings, AffiliateStatus } from '@/types/affiliate.types';
import { toast } from 'sonner';

// ─── Hook: Profil Mitra (untuk halaman publik /profil) ────────────────────────
export function useAffiliateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loading, refetch } = useQuery<AffiliatePartner | null>({
    queryKey: ['affiliate-profile', userId],
    queryFn: () => affiliateService.getAffiliateProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const applyMutation = useMutation({
    mutationFn: (data: Parameters<typeof affiliateService.applyForAffiliate>[1]) =>
      affiliateService.applyForAffiliate(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile', userId] });
      toast.success('Pendaftaran Berhasil!', { description: 'Pengajuan Anda sedang menunggu verifikasi admin.' });
    },
    onError: (err: any) => {
      toast.error('Pendaftaran Gagal', { description: err.message || 'Terjadi kesalahan.' });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof affiliateService.updateAffiliateProfile>[1]) =>
      affiliateService.updateAffiliateProfile(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile', userId] });
      toast.success('Profil Mitra Diperbarui');
    },
    onError: (err: any) => toast.error('Gagal Memperbarui', { description: err.message }),
  });

  return {
    profile,
    loading,
    refetch,
    applyForAffiliate: applyMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    isSubmitting: applyMutation.isPending || updateProfileMutation.isPending,
  };
}

// ─── Hook: Komisi Mitra ───────────────────────────────────────────────────────
export function useMyCommissions(affiliateId: string | undefined) {
  return useQuery<CommissionRecord[]>({
    queryKey: ['commissions', affiliateId],
    queryFn: () => affiliateService.getCommissionRecords(affiliateId),
    enabled: Boolean(affiliateId),
    staleTime: 3 * 60 * 1000,
  });
}

// ─── Hook: Pengajuan Pencairan (Payout) ──────────────────────────────────────
export function useMyPayouts(affiliateId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: payouts = [], isLoading } = useQuery<AffiliatePayoutRequest[]>({
    queryKey: ['affiliate-payouts', affiliateId],
    queryFn: () => affiliateService.getPayoutRequests(affiliateId),
    enabled: Boolean(affiliateId),
    staleTime: 2 * 60 * 1000,
  });

  const requestPayoutMutation = useMutation({
    mutationFn: (data: Parameters<typeof affiliateService.requestPayout>[1]) =>
      affiliateService.requestPayout(affiliateId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts', affiliateId] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile', affiliateId] });
      toast.success('Pengajuan Pencairan Berhasil', { description: 'Admin akan memproses transfer dalam 1-3 hari kerja.' });
    },
    onError: (err: any) => toast.error('Pengajuan Gagal', { description: err.message }),
  });

  return {
    payouts,
    isLoading,
    requestPayout: requestPayoutMutation.mutateAsync,
    isSubmitting: requestPayoutMutation.isPending,
  };
}

// ─── Hook: Admin — Daftar Semua Mitra ────────────────────────────────────────
export function useAllAffiliates(statusFilter?: AffiliateStatus) {
  const queryClient = useQueryClient();

  const { data: affiliates = [], isLoading, refetch } = useQuery<AffiliatePartner[]>({
    queryKey: ['affiliates-admin', statusFilter],
    queryFn: () => affiliateService.getAffiliates(statusFilter),
    staleTime: 2 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, approvedBy, customCode }: { userId: string; approvedBy: string; customCode?: string }) =>
      affiliateService.approveAffiliate(userId, approvedBy, customCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates-admin'] });
      toast.success('Mitra Disetujui', { description: 'Mitra kini dapat mulai mempromosikan produk.' });
    },
    onError: (err: any) => toast.error('Gagal Menyetujui', { description: err.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      affiliateService.rejectAffiliate(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates-admin'] });
      toast.success('Pendaftaran Ditolak');
    },
    onError: (err: any) => toast.error('Gagal Menolak', { description: err.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AffiliateStatus }) =>
      affiliateService.updateAffiliateStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates-admin'] });
      toast.success('Status Mitra Diperbarui');
    },
    onError: (err: any) => toast.error('Gagal Update Status', { description: err.message }),
  });

  return {
    affiliates,
    isLoading,
    refetch,
    approveAffiliate: approveMutation.mutateAsync,
    rejectAffiliate: rejectMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isSubmitting: approveMutation.isPending || rejectMutation.isPending || updateStatusMutation.isPending,
  };
}

// ─── Hook: Admin — Semua Komisi ───────────────────────────────────────────────
export function useAllCommissions() {
  return useQuery<CommissionRecord[]>({
    queryKey: ['commissions-admin'],
    queryFn: () => affiliateService.getCommissionRecords(),
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Hook: Admin — Semua Pengajuan Pencairan ──────────────────────────────────
export function useAllPayouts() {
  const queryClient = useQueryClient();

  const { data: payouts = [], isLoading } = useQuery<AffiliatePayoutRequest[]>({
    queryKey: ['all-payouts-admin'],
    queryFn: () => affiliateService.getPayoutRequests(),
    staleTime: 1 * 60 * 1000,
  });

  const processPayoutMutation = useMutation({
    mutationFn: (params: { payoutId: string; affiliateId: string; processedBy: string; proofReceiptUrl: string; adminNotes?: string }) =>
      affiliateService.processPayout(params.payoutId, params.affiliateId, params.processedBy, params.proofReceiptUrl, params.adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payouts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['affiliates-admin'] });
      toast.success('Transfer Berhasil Dikonfirmasi');
    },
    onError: (err: any) => toast.error('Gagal Konfirmasi Transfer', { description: err.message }),
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: (params: { payoutId: string; affiliateId: string; adminNotes: string }) =>
      affiliateService.rejectPayout(params.payoutId, params.affiliateId, params.adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payouts-admin'] });
      toast.success('Pengajuan Pencairan Ditolak & Saldo Dikembalikan');
    },
    onError: (err: any) => toast.error('Gagal Menolak Pencairan', { description: err.message }),
  });

  return {
    payouts,
    isLoading,
    processPayout: processPayoutMutation.mutateAsync,
    rejectPayout: rejectPayoutMutation.mutateAsync,
    isSubmitting: processPayoutMutation.isPending || rejectPayoutMutation.isPending,
  };
}

// ─── Hook: Pengaturan Afiliasi ────────────────────────────────────────────────
export function useAffiliateSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<AffiliateSettings>({
    queryKey: ['affiliate-settings'],
    queryFn: () => affiliateService.getAffiliateSettings(),
    staleTime: 10 * 60 * 1000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<AffiliateSettings>) => affiliateService.updateAffiliateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-settings'] });
      toast.success('Pengaturan Komisi Disimpan');
    },
    onError: (err: any) => toast.error('Gagal Menyimpan Pengaturan', { description: err.message }),
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettingsMutation.mutateAsync,
    isSubmitting: updateSettingsMutation.isPending,
  };
}
