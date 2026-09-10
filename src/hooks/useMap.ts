'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mapService } from '@/services/map.service';
import { MapSettings, MapHotspot } from '@/types';

export function useMap() {
  const queryClient = useQueryClient();

  // --- QUERIES (Fetch Data) ---
  const { 
    data: mapSettings, 
    isLoading: isLoadingSettings 
  } = useQuery({
    queryKey: ['map_settings'],
    queryFn: mapService.getMapSettings,
    staleTime: 1000 * 60 * 30, // 30 Menit
    refetchOnWindowFocus: false,
  });

  const { 
    data: hotspots = [], 
    isLoading: isLoadingHotspots 
  } = useQuery({
    queryKey: ['map_hotspots'],
    queryFn: mapService.getHotspots,
    staleTime: 1000 * 60 * 5, // 5 Menit
    refetchOnWindowFocus: false,
  });

  // --- MUTATIONS (Simpan/Ubah Data) ---
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<MapSettings>) => mapService.updateMapSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['map_settings'] })
  });

  const addHotspotMutation = useMutation({
    mutationFn: (data: Omit<MapHotspot, 'id' | 'createdAt'>) => mapService.addHotspot(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['map_hotspots'] })
  });

  const updateHotspotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<MapHotspot> }) => mapService.updateHotspot(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['map_hotspots'] })
  });

  const deleteHotspotMutation = useMutation({
    mutationFn: (id: string) => mapService.deleteHotspot(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['map_hotspots'] })
  });

  // --- EXPOSED FUNCTIONS (Wrapper untuk UI) ---
  const saveSettings = async (data: Partial<MapSettings>) => {
    try { await updateSettingsMutation.mutateAsync(data); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const uploadBaseMap = async (file: File) => {
    try { 
      const url = await mapService.uploadBaseMapImage(file);
      // Auto-save setting jika mengunggah peta utama
      await saveSettings({ baseImageUrl: url });
      return { success: true, url };
    } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  // BARU: Fungsi untuk mengunggah gambar detail 3D (tidak menimpa peta utama)
  const uploadDetailImage = async (file: File) => {
    try { 
      const url = await mapService.uploadHotspotImage(file);
      return { success: true, url };
    } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const addPoint = async (data: Omit<MapHotspot, 'id' | 'createdAt'>) => {
    try { await addHotspotMutation.mutateAsync(data); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const updatePoint = async (id: string, data: Partial<MapHotspot>) => {
    try { await updateHotspotMutation.mutateAsync({ id, data }); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const removePoint = async (id: string) => {
    try { await deleteHotspotMutation.mutateAsync(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  return {
    mapSettings,
    hotspots,
    isLoading: isLoadingSettings || isLoadingHotspots,
    saveSettings,
    uploadBaseMap,
    uploadDetailImage,
    addPoint,
    updatePoint,
    removePoint
  };
}