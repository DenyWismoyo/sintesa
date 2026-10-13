"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJabatanList,
  saveJabatan,
  deleteJabatan,
  seedDefaultJabatan,
} from "@/actions/presensi/jabatan";
import { MasterJabatan } from "@/types/presensi";

export function useJabatanList(orgId?: string) {
  return useQuery({
    queryKey: ["jabatan-list", orgId || "all"],
    queryFn: async () => {
      return await getJabatanList(orgId);
    },
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useSaveJabatanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<MasterJabatan> & { namaJabatan: string; level: number }) => {
      return await saveJabatan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jabatan-list"] });
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}

export function useDeleteJabatanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteJabatan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jabatan-list"] });
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}

export function useSeedDefaultJabatanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await seedDefaultJabatan();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jabatan-list"] });
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}
