'use client';

import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface AlumniChartData {
  byYear: { year: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface PublicStatsData {
  tenants: number;
  alumnis: number;
  trainingParticipants: number;
  events: number;
  catalogs: number;
  rooms: number;
  alumniCharts?: AlumniChartData; // Properti baru ditambahkan
}

const CACHE_KEY = 'sintesa_public_stats_cache_v3'; // Ubah key cache agar memaksa pembaruan data yang ada diagramnya

export function usePublicStats() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['public_stats'],
    queryFn: async () => {
      const getStatsCallable = httpsCallable(functions, 'getPublicStats');
      const result = await getStatsCallable();
      
      const responseData = result.data as { success: boolean; data: PublicStatsData };
      if (!responseData.success) {
        throw new Error('Gagal mengambil data statistik');
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(responseData.data));
      }
      
      return responseData.data;
    },
    staleTime: 1000 * 60 * 10, 
    refetchOnWindowFocus: false,
    initialData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            return JSON.parse(cached) as PublicStatsData;
          } catch (e) {
            return undefined;
          }
        }
      }
      return undefined;
    },
  });

  return {
    stats: data,
    isLoading, 
    isFetching,
    error: error instanceof Error ? error.message : null
  };
}