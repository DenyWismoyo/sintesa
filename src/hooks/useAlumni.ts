'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alumniService } from '@/services/alumni.service';
import { Alumni } from '@/types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';

export function useAlumni() {
  const queryClient = useQueryClient();

  // --- TRIGGER MEMBANGUN ULANG CACHE DI LATAR BELAKANG ---
  const triggerCacheRebuild = async () => {
    try {
      const appId = getAppId();
      const rebuildAlumniMasterCache = httpsCallable(functions, 'rebuildAlumniMasterCache');
      // Berjalan di latar belakang tanpa memblokir UI
      rebuildAlumniMasterCache({ appId }).then(() => {
        console.log("[CACHE] Cache Master Alumni berhasil diperbarui.");
      }).catch(err => {
        console.error("[CACHE ERROR] Gagal memperbarui Cache Master Alumni", err);
      });
    } catch (error) {
      console.error("[CACHE ERROR] Terjadi kesalahan trigger", error);
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
  } = useInfiniteQuery({
    queryKey: ['alumnis'],
    queryFn: async ({ pageParam = undefined }) => {
      return alumniService.getAlumnis(pageParam as QueryDocumentSnapshot<DocumentData> | undefined, 20);
    },
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
  });

  const alumnis: Alumni[] = data?.pages.flatMap((page) => page.data) || [];

  const {
    data: allAlumnis = [],
    isLoading: loadingAll,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['allAlumnis'],
    queryFn: alumniService.getAllAlumnis,
    staleTime: 5 * 60 * 1000, // Cache data di memory client selama 5 menit
  });
  
  const addMutation = useMutation({
    mutationFn: (newData: Omit<Alumni, 'id' | 'createdAt' | 'registrationCode'>) => 
      alumniService.addAlumni(newData),
    onSuccess: (newAlumniData) => {
      // OPTIMISTIC UPDATE: Langsung tambahkan data baru ke layar tanpa memanggil database lagi
      queryClient.setQueryData(['allAlumnis'], (oldData: any) => {
        if (!oldData) return [newAlumniData];
        return [newAlumniData, ...oldData]; // Taruh di paling atas
      });

      triggerCacheRebuild(); // Rebuild Cache di belakang layar
    },
  });

  const importMutation = useMutation({
    mutationFn: ({ importData, existingAlumnis }: { importData: any[], existingAlumnis: Alumni[] }) => 
      alumniService.smartImportAlumnis(importData, existingAlumnis),
    onSuccess: () => {
      // Khusus untuk Import Masal, invalidate diperlukan karena perubahannya acak dan berjumlah masif.
      queryClient.invalidateQueries({ queryKey: ['alumnis'] });
      queryClient.invalidateQueries({ queryKey: ['allAlumnis'] });
      triggerCacheRebuild(); 
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dataPayload }: { id: string; dataPayload: Partial<Alumni> }) => 
      alumniService.updateAlumni(id, dataPayload),
    onSuccess: (_, variables) => {
      // OPTIMISTIC UPDATE: Cari data yang diedit di memori, dan langsung ubah seketika (Instan 0 detik)
      queryClient.setQueryData(['allAlumnis'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((alumni: any) =>
          alumni.id === variables.id ? { ...alumni, ...variables.dataPayload } : alumni
        );
      });

      // Lakukan hal yang sama untuk query dengan pagination
      queryClient.setQueryData(['alumnis'], (oldData: any) => {
         if (!oldData) return oldData;
         return {
           ...oldData,
           pages: oldData.pages.map((page: any) => ({
             ...page,
             data: page.data.map((alumni: any) =>
               alumni.id === variables.id ? { ...alumni, ...variables.dataPayload } : alumni
             )
           }))
         };
      });

      // KUNCI PERBAIKAN: JANGAN GUNAKAN invalidateQueries DI SINI
      // agar UI tidak men-download dokumen cache yang masih basi
      
      triggerCacheRebuild(); // Biarkan server mengupdate cache-nya pelan-pelan di belakang layar
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alumniService.deleteAlumni(id),
    onSuccess: (_, deletedId) => {
      // OPTIMISTIC UPDATE: Langsung hapus baris data dari layar
      queryClient.setQueryData(['allAlumnis'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((alumni: any) => alumni.id !== deletedId);
      });

      triggerCacheRebuild(); // Rebuild Cache di belakang layar
    },
  });

  const addAlumni = async (dataPayload: Omit<Alumni, 'id' | 'createdAt' | 'registrationCode'>) => {
    try {
      await addMutation.mutateAsync(dataPayload);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const importAlumniExcel = async (importData: any[], existingAlumnis: Alumni[]) => {
    try {
      const res: any = await importMutation.mutateAsync({ importData, existingAlumnis });
      return { 
        success: true, 
        count: res?.count || 0, 
        newCount: res?.newCount || 0, 
        updateCount: res?.updateCount || 0 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateAlumni = async (id: string, dataPayload: Partial<Alumni>) => {
    try {
      await updateMutation.mutateAsync({ id, dataPayload });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteAlumni = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    alumnis,
    loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    
    allAlumnis,
    loadingAll,
    refetchAll,
    
    addAlumni,
    importAlumniExcel,
    updateAlumni,
    deleteAlumni,
  };
}