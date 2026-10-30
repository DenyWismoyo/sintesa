// src/hooks/useServiceDesk.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceDeskService } from '@/services/serviceDesk.service';
import { WorkOrder } from '@/types/serviceDesk.types';
import { toast } from 'sonner';

const STALE_5_MIN = 1000 * 60 * 5;

export function useAllWorkOrders(enabled: boolean = true) {
  return useQuery({
    queryKey: ['allWorkOrders'],
    queryFn: () => serviceDeskService.getAllWorkOrders(),
    enabled,
    staleTime: STALE_5_MIN,
  });
}

export function useWorkOrderMutations() {
  const qc = useQueryClient();

  const createWorkOrderMutation = useMutation({
    mutationFn: (data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) =>
      serviceDeskService.createWorkOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Work Order (SPK) berhasil diterbitkan!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membuat Work Order');
    },
  });

  const assignTechnicianMutation = useMutation({
    mutationFn: ({
      id,
      technicianName,
      technicianPhone,
      priority,
      targetCompletionDate,
    }: {
      id: string;
      technicianName: string;
      technicianPhone: string;
      priority: WorkOrder['priority'];
      targetCompletionDate?: string;
    }) =>
      serviceDeskService.assignTechnician(
        id,
        technicianName,
        technicianPhone,
        priority,
        targetCompletionDate
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Teknisi berhasil ditugaskan!');
    },
  });

  const resolveWorkOrderMutation = useMutation({
    mutationFn: ({
      id,
      completionNotes,
      actualCost,
      afterPhotoUrl,
      bastSignedDate,
    }: {
      id: string;
      completionNotes: string;
      actualCost: number;
      afterPhotoUrl?: string;
      bastSignedDate?: string;
    }) =>
      serviceDeskService.resolveWorkOrder(id, {
        completionNotes,
        actualCost,
        afterPhotoUrl,
        bastSignedDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Pekerjaan selesai & BAST diterbitkan!');
    },
  });

  const updateWorkOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
      serviceDeskService.updateWorkOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Data Work Order berhasil diperbarui');
    },
  });

  const deleteWorkOrderMutation = useMutation({
    mutationFn: (id: string) => serviceDeskService.deleteWorkOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allWorkOrders'] });
      toast.success('Work Order berhasil dihapus');
    },
  });

  return {
    createWorkOrderMutation,
    assignTechnicianMutation,
    resolveWorkOrderMutation,
    updateWorkOrderMutation,
    deleteWorkOrderMutation,
  };
}

