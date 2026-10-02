'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { increment } from 'firebase/firestore';
import { assetService } from '@/services/asset.service';
import { Asset, MaintenanceRecord } from '@/types';
import { useMemo } from 'react';

// Helper normalisasi ganda: Memeriksa Kategori DAN Jenis Aset
const normalizeAsset = (data: any) => {
  const normalized = { ...data };
  const cat = (normalized.category || '').toLowerCase();
  const type = (normalized.assetType || '').toLowerCase(); // Mengambil nilai dari field Jenis Aset

  // Jika kategori ATAU jenis aset mengandung kata kunci fasiltas (ruang/gedung/lapangan)
  if (
    cat.includes('ruang') || 
    cat.includes('gedung') || 
    type.includes('ruang') || 
    type.includes('gedung') ||
    type.includes('lapangan')
  ) {
    normalized.category = 'Ruangan'; // Paksa menjadi format standar
  }
  return normalized;
};

export function useAssets() {
  const queryClient = useQueryClient();

  // 1. SATU-SATUNYA SUMBER KEBENARAN (Single Source of Truth) dari Master Cache
  const { 
    data: rawAssets = [], 
    isLoading: loadingAssets, 
    error: errorAssets
  } = useQuery({
    queryKey: ['asset_master_cache'],
    queryFn: () => assetService.getAssetCache(),
    staleTime: 1000 * 60 * 30, // 30 Menit Cache
    refetchOnWindowFocus: false, 
  });

  // NORMALISASI ON-THE-FLY: 
  // Mengonversi data secara instan di memori agar UI, Form, Tab Booking, dan Excel 100% selaras.
  const assets = useMemo(() => rawAssets.map(normalizeAsset), [rawAssets]);

  // 2. DERIVED STATE: Mengambil ruangan langsung dari Cache di memory browser!
  // Seluruh aset yang merupakan Ruangan / Fasilitas Gedung
  const allRooms = useMemo(() => {
    return assets.filter(a => {
      const cat = (a.category || '').toLowerCase();
      const type = (a.assetType || '').toLowerCase();
      return cat === 'ruangan' || type.includes('ruang') || type.includes('gedung') || type.includes('lapangan');
    });
  }, [assets]);

  // Hanya ruangan yang aktif dikomersialkan (untuk sewa publik)
  const publicRooms = useMemo(() => {
    return allRooms.filter(a => a.isRentable === true);
  }, [allRooms]);
  
  const loadingRooms = loadingAssets;

  // 3. Data Laporan Publik
  const {
    data: openReports = [],
    isLoading: loadingReports,
    error: errorReports
  } = useQuery({
    queryKey: ['openReports'],
    queryFn: () => assetService.getOpenReports(100),
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false,
  });

  const loading = loadingAssets || loadingReports;
  const error = errorAssets ? errorAssets.message : (errorReports ? errorReports.message : null);

  // --- MUTATIONS DENGAN OPTIMISTIC UPDATES ---

  const addAssetMutation = useMutation({
    mutationFn: async (data: Partial<Asset>) => {
      const normalizedData = normalizeAsset(data);
      await assetService.createAsset(normalizedData);
    },
    // Optimistic Update untuk Aset Baru
    onMutate: async (data) => {
      const normalizedData = normalizeAsset(data);
      await queryClient.cancelQueries({ queryKey: ['asset_master_cache'] });
      const prev = queryClient.getQueryData<any[]>(['asset_master_cache']);
      if (prev) {
        queryClient.setQueryData<any[]>(['asset_master_cache'], old => [
          { ...normalizedData, id: 'temp-' + Date.now(), createdAt: Date.now() },
          ...(old || [])
        ]);
      }
      return { prev };
    },
    onError: (err, variables, context) => {
      if (context?.prev) queryClient.setQueryData(['asset_master_cache'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] })
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Asset> }) => {
      const normalizedData = normalizeAsset(data);
      await assetService.updateAsset(id, normalizedData);
    },
    onMutate: async ({ id, data }) => {
      const normalizedData = normalizeAsset(data);
      await queryClient.cancelQueries({ queryKey: ['asset_master_cache'] });
      const prev = queryClient.getQueryData<any[]>(['asset_master_cache']);
      if (prev) {
        queryClient.setQueryData<any[]>(['asset_master_cache'], old =>
          old?.map(a => a.id === id ? { ...a, ...normalizedData } : a)
        );
      }
      return { prev };
    },
    onError: (err, variables, context) => {
      if (context?.prev) queryClient.setQueryData(['asset_master_cache'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] })
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      await assetService.deleteAsset(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['asset_master_cache'] });
      const prev = queryClient.getQueryData<any[]>(['asset_master_cache']);
      if (prev) {
        queryClient.setQueryData<any[]>(['asset_master_cache'], old => old?.filter(a => a.id !== id));
      }
      return { prev };
    },
    onError: (err, id, context) => {
      if (context?.prev) queryClient.setQueryData(['asset_master_cache'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] })
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, assetId }: { reportId: string, assetId: string }) => {
      await assetService.resolveReport(reportId, assetId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['openReports'] });
      queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] });
    }
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async ({ assetId, record }: { assetId: string, record: MaintenanceRecord }) => {
      await assetService.addMaintenance(assetId, record);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] })
  });

  const submitReportMutation = useMutation({
    mutationFn: async ({ reportData, imageFiles }: { reportData: any, imageFiles: File[] }) => {
      const uploadPromises = imageFiles.map(file => assetService.uploadImage(file));
      const photoUrls = await Promise.all(uploadPromises);
      
      const finalReport = {
        ...reportData,
        photoUrls,
        status: 'Open',
        createdAt: Date.now()
      };
      
      await assetService.createReport(finalReport);
      await assetService.updateAsset(reportData.assetId, { unresolvedReportsCount: increment(1) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['openReports'] });
      queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] });
    }
  });

  // Mutasi Form Spesifikasi Ruangan / Aset
  const saveAssetWithImageMutation = useMutation({
    mutationFn: async ({ assetData, imageFile }: { assetData: Partial<Asset>, imageFile: File | null }) => {
      const normalizedData = normalizeAsset(assetData);

      let imageUrl = normalizedData.imageUrl;
      if (imageFile) imageUrl = await assetService.uploadImage(imageFile);
      
      const { id, ...dataToSave } = normalizedData;
      const finalData: any = { ...dataToSave };

      if (imageUrl !== undefined) {
        finalData.imageUrl = imageUrl;
      }
      
      if (id) {
        await assetService.updateAsset(id, finalData);
      } else {
        await assetService.createAsset({ ...finalData, createdAt: Date.now(), maintenanceHistory: [], unresolvedReportsCount: 0 });
      }
    },
    onMutate: async ({ assetData }) => {
      await queryClient.cancelQueries({ queryKey: ['asset_master_cache'] });
      const prev = queryClient.getQueryData<any[]>(['asset_master_cache']);
      
      const normalizedData = normalizeAsset(assetData);

      if (prev) {
        if (assetData.id) {
          queryClient.setQueryData<any[]>(['asset_master_cache'], old =>
            old?.map(a => a.id === assetData.id ? { ...a, ...normalizedData } : a)
          );
        } else {
          const tempId = 'temp-' + Date.now();
          queryClient.setQueryData<any[]>(['asset_master_cache'], old => [
            { ...normalizedData, id: tempId, createdAt: Date.now() },
            ...(old || [])
          ]);
        }
      }
      return { prev };
    },
    onError: (err, variables, context) => {
      if (context?.prev) queryClient.setQueryData(['asset_master_cache'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['asset_master_cache'] })
  });

  const addAsset = async (data: Partial<Asset>) => { try { await addAssetMutation.mutateAsync(data); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const updateAsset = async (id: string, data: Partial<Asset>) => { try { await updateAssetMutation.mutateAsync({ id, data }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const saveAssetWithImage = async (assetData: Partial<Asset>, imageFile: File | null) => { try { await saveAssetWithImageMutation.mutateAsync({ assetData, imageFile }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const deleteAsset = async (id: string) => { try { await deleteAssetMutation.mutateAsync(id); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const resolveReport = async (reportId: string, assetId: string) => { try { await resolveReportMutation.mutateAsync({ reportId, assetId }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const addMaintenance = async (assetId: string, record: MaintenanceRecord) => { try { await addMaintenanceMutation.mutateAsync({ assetId, record }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  const getAsset = async (id: string) => { try { const assetData = await assetService.getAssetById(id); return { success: true, data: assetData }; } catch (err: any) { return { success: false, error: err.message }; } };
  const submitReport = async (reportData: any, imageFiles: File[]) => { try { await submitReportMutation.mutateAsync({ reportData, imageFiles }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };

  return {
    assets, allRooms, publicRooms, loadingRooms, openReports, loading, error, 
    fetchNextPage: () => {}, hasNextPage: false, isFetchingNextPage: false,
    addAsset, updateAsset, saveAssetWithImage,
    deleteAsset, resolveReport, addMaintenance, getAsset, submitReport 
  };
}