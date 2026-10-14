import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchService } from '@/services/batch.service';
import { TrainingBatch } from '@/types';
import { toast } from 'sonner';

export const useBatch = (trainingId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['training-batches', trainingId];

  const {
    data: batches = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => (trainingId ? batchService.getBatches(trainingId) : Promise.resolve([])),
    enabled: Boolean(trainingId),
    staleTime: 1000 * 60 * 3, // 3 menit
  });

  const initAnnualMutation = useMutation({
    mutationFn: ({ year, defaultQuota }: { year: number; defaultQuota?: number }) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.initAnnualBatches(trainingId, year, defaultQuota);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Berhasil Menginisialisasi 4 Batch untuk Tahun ${data[0]?.year || 'berjalan'}!`);
    },
    onError: (err: any) => {
      toast.error('Gagal Menginisialisasi Batch', { description: err.message });
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: Omit<TrainingBatch, 'id' | 'createdAt' | 'registeredCount'>) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.createBatch(trainingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Batch pelatihan berhasil ditambahkan');
    },
    onError: (err: any) => {
      toast.error('Gagal menambah batch', { description: err.message });
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ batchId, data }: { batchId: string; data: Partial<TrainingBatch> }) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.updateBatch(trainingId, batchId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Informasi batch berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error('Gagal memperbarui batch', { description: err.message });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: string) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.deleteBatch(trainingId, batchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Batch berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus batch', { description: err.message });
    },
  });

  const bulkRegisterMutation = useMutation({
    mutationFn: ({
      batchId,
      batchNumber,
      participants,
    }: {
      batchId: string;
      batchNumber: number;
      participants: any[];
    }) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.bulkRegisterBatchParticipants(trainingId, batchId, batchNumber, participants);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['training-participants', trainingId] });
      toast.success(`Berhasil mendaftarkan ${res.count} peserta ke dalam batch!`);
    },
    onError: (err: any) => {
      toast.error('Gagal import data peserta', { description: err.message });
    },
  });

  const graduateParticipantsMutation = useMutation({
    mutationFn: ({
      trainingTitle,
      trainingCategory,
      batchId,
      batchNumber,
      year,
      participantIds,
    }: {
      trainingTitle: string;
      trainingCategory: string;
      batchId: string;
      batchNumber: number;
      year: number;
      participantIds: string[];
    }) => {
      if (!trainingId) throw new Error('Training ID wajib diisi');
      return batchService.graduateBatchParticipants(
        trainingId,
        trainingTitle,
        trainingCategory,
        batchId,
        batchNumber,
        year,
        participantIds
      );
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['training-participants', trainingId] });
      queryClient.invalidateQueries({ queryKey: ['alumnis'] });
      toast.success(`Yudisium Berhasil! ${res.count} peserta resmi dikonversi menjadi Alumni STP.`);
    },
    onError: (err: any) => {
      toast.error('Gagal memproses yudisium peserta', { description: err.message });
    },
  });

  return {
    batches,
    isLoading,
    refetch,
    initAnnualBatches: initAnnualMutation.mutateAsync,
    isInitializingBatches: initAnnualMutation.isPending,
    createBatch: createBatchMutation.mutateAsync,
    updateBatch: updateBatchMutation.mutateAsync,
    deleteBatch: deleteBatchMutation.mutateAsync,
    bulkRegisterParticipants: bulkRegisterMutation.mutateAsync,
    isImportingParticipants: bulkRegisterMutation.isPending,
    graduateParticipants: graduateParticipantsMutation.mutateAsync,
    isGraduating: graduateParticipantsMutation.isPending,
  };
};
