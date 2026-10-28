// Lokasi file: src/hooks/useProduction.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '@/services/production.service';
import { ProductionOrder, WorkProgressLog, DeliveryOrderInfo } from '@/types/production.types';

export function useProduction() {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading: loading,
    error: rawError,
    refetch
  } = useQuery({
    queryKey: ['production_orders'],
    queryFn: () => productionService.getProductionOrders(300),
    staleTime: 30 * 1000,       // 30 detik
    refetchInterval: 60 * 1000, // Polling wajar 60 detik
    refetchOnWindowFocus: true
  });

  const error = rawError instanceof Error ? rawError.message : (rawError ? String(rawError) : null);

  const createOrderMutation = useMutation({
    mutationFn: (data: Omit<ProductionOrder, 'id'>) => productionService.createProductionOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production_orders'] })
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductionOrder> }) =>
      productionService.updateProductionOrder(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production_orders'] })
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => productionService.deleteProductionOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production_orders'] })
  });

  const addProgressMutation = useMutation({
    mutationFn: ({ id, log, newProgress }: { id: string; log: Omit<WorkProgressLog, 'id'>; newProgress?: number }) =>
      productionService.addProgressLog(id, log, newProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production_orders'] })
  });

  const issueDeliveryOrderMutation = useMutation({
    mutationFn: ({ id, deliveryInfo }: { id: string; deliveryInfo: DeliveryOrderInfo }) =>
      productionService.issueDeliveryOrder(id, deliveryInfo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production_orders'] })
  });

  const createOrder = async (data: Omit<ProductionOrder, 'id'>) => {
    try {
      const newId = await createOrderMutation.mutateAsync(data);
      return { success: true, id: newId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal membuat pesanan produksi.' };
    }
  };

  const updateOrder = async (id: string, data: Partial<ProductionOrder>) => {
    try {
      await updateOrderMutation.mutateAsync({ id, data });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui pesanan produksi.' };
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteOrderMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghapus pesanan produksi.' };
    }
  };

  const addProgress = async (id: string, log: Omit<WorkProgressLog, 'id'>, newProgress?: number) => {
    try {
      await addProgressMutation.mutateAsync({ id, log, newProgress });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menambahkan catatan progres.' };
    }
  };

  const issueDeliveryOrder = async (id: string, deliveryInfo: DeliveryOrderInfo) => {
    try {
      const doNumber = await issueDeliveryOrderMutation.mutateAsync({ id, deliveryInfo });
      return { success: true, deliveryOrderNumber: doNumber };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menerbitkan Surat Jalan.' };
    }
  };

  return {
    orders,
    loading,
    error,
    refetch,
    createOrder,
    updateOrder,
    deleteOrder,
    addProgress,
    issueDeliveryOrder,
    uploadBlueprint: productionService.uploadBlueprintFile
  };
}
