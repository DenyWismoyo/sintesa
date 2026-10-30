// src/hooks/useMentoringHub.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentoringService } from '@/services/mentoring.service';
import { IncubationMentoringSession, DealRoomAccess, TenantSubsidyVoucher } from '@/types/incubationMentoring.types';
import { toast } from 'sonner';

const STALE_5_MIN = 1000 * 60 * 5;

export function useAllMentoringSessions(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allMentoringSessions'],
    queryFn: () => mentoringService.getAllMentoringSessions(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useTenantMentoringSessions(tenantId?: string | null) {
  return useQuery({
    queryKey: ['tenantMentoringSessions', tenantId],
    queryFn: () => mentoringService.getTenantMentoringSessions(tenantId!),
    enabled: Boolean(tenantId),
    staleTime: STALE_5_MIN,
  });
}

export function useAllDealRoomRequests(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allDealRoomRequests'],
    queryFn: () => mentoringService.getAllDealRoomRequests(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useTenantVouchers(tenantId?: string | null) {
  return useQuery({
    queryKey: ['tenantVouchers', tenantId],
    queryFn: () => mentoringService.getTenantVouchers(tenantId!),
    enabled: Boolean(tenantId),
    staleTime: STALE_5_MIN,
  });
}

export function useMentoringMutations() {
  const qc = useQueryClient();

  const createMentoringMutation = useMutation({
    mutationFn: (data: Omit<IncubationMentoringSession, 'id' | 'createdAt' | 'updatedAt'>) =>
      mentoringService.createMentoringSession(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allMentoringSessions'] });
      qc.invalidateQueries({ queryKey: ['tenantMentoringSessions'] });
      toast.success('Jadwal mentoring berhasil dibuat!');
    },
  });

  const updateMentoringMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncubationMentoringSession> }) =>
      mentoringService.updateMentoringSession(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allMentoringSessions'] });
      qc.invalidateQueries({ queryKey: ['tenantMentoringSessions'] });
      toast.success('Logbook mentoring berhasil diperbarui');
    },
  });

  const requestDealRoomMutation = useMutation({
    mutationFn: (params: Parameters<typeof mentoringService.requestDealRoomAccess>[0]) =>
      mentoringService.requestDealRoomAccess(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allDealRoomRequests'] });
      toast.success('NDA ditandatangani. Akses Deal Room aktif!');
    },
  });

  const updateDealRoomStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: DealRoomAccess['status']; notes?: string }) =>
      mentoringService.updateDealRoomStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allDealRoomRequests'] });
      toast.success('Status deal room berhasil diperbarui');
    },
  });

  const createVoucherMutation = useMutation({
    mutationFn: (data: Omit<TenantSubsidyVoucher, 'id' | 'createdAt'>) =>
      mentoringService.createSubsidyVoucher(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenantVouchers'] });
      toast.success('Voucher subsidi ekosistem berhasil diterbitkan!');
    },
  });

  return {
    createMentoringMutation,
    updateMentoringMutation,
    requestDealRoomMutation,
    updateDealRoomStatusMutation,
    createVoucherMutation,
  };
}

