// src/hooks/useIkm.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ikmService } from '@/services/ikm.service';
import { IkmSurvey } from '@/types/ikm.types';
import { toast } from 'sonner';

const STALE_5_MIN = 1000 * 60 * 5;

export function useAllIkmSurveys(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allIkmSurveys'],
    queryFn: () => ikmService.getAllSurveys(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useIkmMutations() {
  const qc = useQueryClient();

  const submitSurveyMutation = useMutation({
    mutationFn: (data: Parameters<typeof ikmService.submitSurvey>[0]) =>
      ikmService.submitSurvey(data),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['allIkmSurveys'] });
        toast.success('Terima kasih! Penilaian survei kepuasan Anda telah berhasil dikirim.');
      } else {
        toast.error(res.error || 'Gagal mengirim survei');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    },
  });

  return { submitSurveyMutation };
}

