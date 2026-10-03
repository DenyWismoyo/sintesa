"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIzinList, submitIzin, approveIzin, rejectIzin } from "@/actions/presensi/izin";
import { PengajuanIzinItem } from "@/types/presensi";

export function useIzinList(userId?: string) {
  return useQuery({
    queryKey: ["izin-list", userId || "all"],
    queryFn: async () => {
      return await getIzinList(userId);
    },
    // Jika userId undefined, query dijalankan untuk atasan/admin mengambil data bawahan
    enabled: true,
  });
}

export function usePendingIzinList(enabled: boolean = true) {
  return useQuery({
    queryKey: ["izin-pending"],
    queryFn: async () => {
      const all = await getIzinList();
      return all.filter((item) => item.status === "menunggu");
    },
    enabled,
    refetchOnWindowFocus: true,
  });
}

export function useSubmitIzinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PengajuanIzinItem, "id" | "createdAt" | "status">) => {
      return await submitIzin(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
      queryClient.invalidateQueries({ queryKey: ["izin-pending"] });
    },
  });
}

export function useApproveIzinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      izinId,
      atasanId,
      catatanAtasan,
    }: {
      izinId: string;
      atasanId: string;
      catatanAtasan?: string;
    }) => {
      return await approveIzin(izinId, atasanId, catatanAtasan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
      queryClient.invalidateQueries({ queryKey: ["izin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["presensi"] });
      queryClient.invalidateQueries({ queryKey: ["kehadiran-status"] });
    },
  });
}

export function useRejectIzinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      izinId,
      atasanId,
      alasanPenolakan,
    }: {
      izinId: string;
      atasanId: string;
      alasanPenolakan: string;
    }) => {
      return await rejectIzin(izinId, atasanId, alasanPenolakan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
      queryClient.invalidateQueries({ queryKey: ["izin-pending"] });
    },
  });
}
