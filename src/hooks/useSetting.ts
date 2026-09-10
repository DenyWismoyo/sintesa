// Lokasi file: src/hooks/useSetting.ts

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService, InstitutionProfile } from '@/services/setting.service';

export function useSetting() {
  const queryClient = useQueryClient();

  // ==========================================
  // STATE MANAGEMENT UNTUK PROFIL INSTANSI
  // ==========================================

  // Fetch Data Profil
  const { 
    data: profile, 
    isLoading: isLoadingProfile 
  } = useQuery({
    queryKey: ['institution_profile'],
    queryFn: settingService.getProfile,
    staleTime: 1000 * 60 * 60, // Data di-cache selama 1 jam karena jarang berubah
    refetchOnWindowFocus: false,
  });

  // Mutasi untuk Menyimpan Data & Logo
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileData, logoFile }: { profileData: Partial<InstitutionProfile>, logoFile?: File | null }) => {
      let logoUrl = profileData.logoUrl;
      
      // Jika ada file gambar baru yang dipilih, upload dulu
      if (logoFile) {
        logoUrl = await settingService.uploadLogo(logoFile);
      }
      
      // Simpan URL gambar dan data teks ke database
      await settingService.updateProfile({ ...profileData, logoUrl });
    },
    onSuccess: () => {
      // Refresh cache agar data di layar langsung ter-update
      queryClient.invalidateQueries({ queryKey: ['institution_profile'] });
    }
  });

  // Fungsi praktis (wrapper) untuk dipanggil di komponen tombol Simpan
  const saveProfile = async (data: Partial<InstitutionProfile>, file?: File | null) => {
    try {
      await updateProfileMutation.mutateAsync({ profileData: data, logoFile: file });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Kembalikan semua fungsi agar bisa dipakai di komponen UI
  return { 
    profile, 
    isLoadingProfile, 
    saveProfile,
    isSavingProfile: updateProfileMutation.isPending
  };
}