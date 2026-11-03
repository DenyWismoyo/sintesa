// src/hooks/useFinancing.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financingService } from '@/services/financing.service';
import {
  FinancingScheme,
  FinancingSchemeInput,
  FinancingApplication,
  FinancingApplicationStatus,
} from '@/types/partnership.types';
import { toast } from 'sonner';

const STALE_5_MIN = 5 * 60 * 1000;

export function useActiveFinancingSchemes() {
  return useQuery({
    queryKey: ['activeFinancingSchemes'],
    queryFn: () => financingService.getActiveSchemes(),
    staleTime: STALE_5_MIN,
  });
}

export function useAllFinancingSchemes(partnerId?: string) {
  return useQuery({
    queryKey: ['allFinancingSchemes', partnerId || 'all'],
    queryFn: () => financingService.getAllSchemes(partnerId),
    staleTime: STALE_5_MIN,
  });
}

export function useFinancingApplications(params?: {
  partnerId?: string;
  schemeId?: string;
  status?: FinancingApplicationStatus;
}) {
  return useQuery({
    queryKey: ['financingApplications', params?.partnerId || '', params?.status || ''],
    queryFn: () => financingService.getApplications(params),
    staleTime: 60 * 1000,
  });
}

export function useFinancingMutations() {
  const queryClient = useQueryClient();

  const createSchemeMutation = useMutation({
    mutationFn: (data: Omit<FinancingSchemeInput, 'id' | 'createdAt' | 'updatedAt'>) =>
      financingService.createScheme(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['activeFinancingSchemes'] });
        queryClient.invalidateQueries({ queryKey: ['allFinancingSchemes'] });
        toast.success('Skema pembiayaan baru berhasil ditambahkan');
      } else {
        toast.error('Gagal menambah skema: ' + res.error);
      }
    },
  });

  const updateSchemeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancingScheme> }) =>
      financingService.updateScheme(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFinancingSchemes'] });
      queryClient.invalidateQueries({ queryKey: ['allFinancingSchemes'] });
      toast.success('Skema pembiayaan berhasil diperbarui');
    },
  });

  const deleteSchemeMutation = useMutation({
    mutationFn: (id: string) => financingService.deleteScheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFinancingSchemes'] });
      queryClient.invalidateQueries({ queryKey: ['allFinancingSchemes'] });
      toast.success('Skema pembiayaan berhasil dihapus');
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: (data: Omit<FinancingApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) =>
      financingService.submitApplication(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['financingApplications'] });
        toast.success('Pengajuan pembiayaan berhasil dikirim!', {
          description: 'Tim Solo Technopark & Mitra Keuangan akan segera memverifikasi berkas Anda.',
        });
      } else {
        toast.error('Gagal mengajukan: ' + res.error);
      }
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: FinancingApplicationStatus;
      notes?: {
        stpReviewNotes?: string;
        bankReviewNotes?: string;
        approvedAmount?: number;
        approvedTenor?: number;
      };
    }) => financingService.updateApplicationStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financingApplications'] });
      toast.success('Status pengajuan pembiayaan berhasil diperbarui');
    },
  });

  return {
    createSchemeMutation,
    updateSchemeMutation,
    deleteSchemeMutation,
    submitApplicationMutation,
    updateApplicationStatusMutation,
  };
}

