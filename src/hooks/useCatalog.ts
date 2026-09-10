'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { ProductCatalog } from '@/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';

export function useCatalog() {
  const queryClient = useQueryClient();

  // --- BACKGROUND CACHE REBUILD ---
  const triggerCacheRebuild = async () => {
    try {
      const appId = getAppId();
      const rebuildCatalogMasterCache = httpsCallable(functions, 'rebuildCatalogMasterCache');
      // Berjalan di latar belakang tanpa memblokir UI
      rebuildCatalogMasterCache({ appId }).then(() => {
        console.log("[CACHE] Cache Master Katalog berhasil diperbarui.");
      }).catch(err => {
        console.error("[CACHE ERROR] Gagal memperbarui Cache Master Katalog", err);
      });
    } catch (error) {
      console.error("[CACHE ERROR] Terjadi kesalahan trigger katalog", error);
    }
  };

  // --- QUERY UTAMA MENGGUNAKAN CACHE ---
  const { 
    data: products = [], 
    isLoading: loading, 
    error: queryError 
  } = useQuery({
    queryKey: ['allCatalogsCached'],
    queryFn: catalogService.getAllCatalogsCached,
    staleTime: 5 * 60 * 1000, // Cache data di memory client selama 5 menit
    refetchOnWindowFocus: false,
  });

  // --- MUTATIONS WITH OPTIMISTIC UPDATES ---
  const addMutation = useMutation({
    mutationFn: async (data: Omit<ProductCatalog, 'id'>) => catalogService.createProduct(data),
    onSuccess: (newDocRef, variables) => {
      // OPTIMISTIC UPDATE: Tambahkan ke memori lokal seketika
      queryClient.setQueryData(['allCatalogsCached'], (oldData: any) => {
        if (!oldData) return [{ id: newDocRef.id, ...variables }];
        return [{ id: newDocRef.id, ...variables }, ...oldData];
      });
      triggerCacheRebuild(); // Perbarui dokumen cache Firestore di latar belakang
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ProductCatalog> }) => catalogService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      // OPTIMISTIC UPDATE: Update memori lokal seketika
      queryClient.setQueryData(['allCatalogsCached'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((item: any) => item.id === variables.id ? { ...item, ...variables.data } : item);
      });
      triggerCacheRebuild(); // Perbarui dokumen cache Firestore di latar belakang
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => catalogService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      // OPTIMISTIC UPDATE: Hapus dari memori lokal seketika
      queryClient.setQueryData(['allCatalogsCached'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((item: any) => item.id !== deletedId);
      });
      triggerCacheRebuild(); // Perbarui dokumen cache Firestore di latar belakang
    }
  });

  // --- WRAPPER FUNCTIONS (Menjaga Kompatibilitas dengan UI saat ini) ---
  const addProduct = async (data: Omit<ProductCatalog, 'id'>, imageFiles?: File[]) => {
    try {
      let imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => catalogService.uploadImage(file));
        imageUrls = await Promise.all(uploadPromises);
      }
      await addMutation.mutateAsync({ ...data, images: imageUrls });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const editProduct = async (id: string, data: Partial<ProductCatalog>, newImageFiles?: File[]) => {
    try {
      let finalData = { ...data };
      if (newImageFiles && newImageFiles.length > 0) {
        const uploadPromises = newImageFiles.map(file => catalogService.uploadImage(file));
        const newUrls = await Promise.all(uploadPromises);
        finalData.images = [...(data.images || []), ...newUrls];
      }
      await updateMutation.mutateAsync({ id, data: finalData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const getProduct = async (id: string) => {
    try {
      const data = await catalogService.getProductById(id);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    products, 
    loading, 
    error: queryError ? queryError.message : null,
    addProduct, 
    editProduct, 
    removeProduct, 
    getProduct,

    // Fallback Dummy Parameters: UI mungkin butuh ini agar tidak crash kalau masih memanggil pagination props
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}