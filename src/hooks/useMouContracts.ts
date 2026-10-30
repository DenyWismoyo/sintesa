// src/hooks/useMouContracts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnershipService } from '@/services/partnership.service';
import { MouContract } from '@/types/partnership.types';
import { toast } from 'sonner';

const STALE_5_MIN = 1000 * 60 * 5;

export function useAllMouContracts(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allMouContracts'],
    queryFn: () => partnershipService.getAllMouContracts(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useMouContractMutations() {
  const qc = useQueryClient();

  const createMouMutation = useMutation({
    mutationFn: (data: Omit<MouContract, 'id' | 'createdAt' | 'updatedAt'>) =>
      partnershipService.createMouContract(data),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['allMouContracts'] });
        toast.success('Dokumen MoU/PKS berhasil didaftarkan!');
      } else {
        toast.error(res.error || 'Gagal menyimpan MoU');
      }
    },
  });

  const updateMouMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MouContract> }) =>
      partnershipService.updateMouContract(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allMouContracts'] });
      toast.success('Dokumen MoU/PKS berhasil diperbarui');
    },
  });

  const deleteMouMutation = useMutation({
    mutationFn: (id: string) => partnershipService.deleteMouContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allMouContracts'] });
      toast.success('Dokumen MoU/PKS berhasil dihapus');
    },
  });

  return {
    createMouMutation,
    updateMouMutation,
    deleteMouMutation,
  };
}

