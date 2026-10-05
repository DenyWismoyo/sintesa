"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDaftarRevisiPresensiAction,
  ajukanRevisiPresensiAction,
  approveRevisiPresensiAction,
  rejectRevisiPresensiAction,
  koreksiPresensiLangsungAction,
} from "@/actions/presensi/revisi";
import { StatusRevisiPresensi, PermohonanRevisiPresensi, PresensiStatus } from "@/types/presensi";

export function useDaftarRevisiPresensi(status?: StatusRevisiPresensi, userId?: string) {
  return useQuery<PermohonanRevisiPresensi[]>({
    queryKey: ["daftar-revisi-presensi", status, userId],
    queryFn: async () => {
      return await getDaftarRevisiPresensiAction({ status, userId });
    },
    staleTime: 1000 * 60 * 3, // 3 menit
  });
}

export function useAjukanRevisiPresensiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ajukanRevisiPresensiAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daftar-revisi-presensi"] });
      queryClient.invalidateQueries({ queryKey: ["presensi-today"] });
      queryClient.invalidateQueries({ queryKey: ["kehadiran-status"] });
    },
  });
}

export function useApproveRevisiPresensiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRevisiPresensiAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daftar-revisi-presensi"] });
      queryClient.invalidateQueries({ queryKey: ["presensi-today"] });
      queryClient.invalidateQueries({ queryKey: ["kehadiran-status"] });
      queryClient.invalidateQueries({ queryKey: ["rekap-statistik"] });
      queryClient.invalidateQueries({ queryKey: ["presensi-history"] });
    },
  });
}

export function useRejectRevisiPresensiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectRevisiPresensiAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daftar-revisi-presensi"] });
    },
  });
}

export function useKoreksiPresensiLangsungMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: koreksiPresensiLangsungAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daftar-revisi-presensi"] });
      queryClient.invalidateQueries({ queryKey: ["presensi-today"] });
      queryClient.invalidateQueries({ queryKey: ["rekap-statistik"] });
      queryClient.invalidateQueries({ queryKey: ["kehadiran-status"] });
      queryClient.invalidateQueries({ queryKey: ["presensi-history"] });
    },
  });
}
