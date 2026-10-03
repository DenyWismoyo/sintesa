"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIzinList, submitIzin } from "@/actions/presensi/izin";
import { PengajuanIzinItem } from "@/types/presensi";

export function useIzinList(userId?: string) {
  return useQuery({
    queryKey: ["izin-list", userId || "all"],
    queryFn: async () => {
      return await getIzinList(userId);
    },
    enabled: Boolean(userId),
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
    },
  });
}
