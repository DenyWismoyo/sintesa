// Lokasi file: src/hooks/useHub.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hubService } from '@/services/hub.service';
import { HubThread, HubThreadResponse } from '@/types';

// Mengambil list semua thread (dengan support filtering)
export function useHubThreads(roleFilter?: string, typeFilter?: string) {
  const { data: threads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['hubThreads', roleFilter, typeFilter],
    queryFn: () => hubService.getHubThreads(roleFilter, typeFilter),
    staleTime: 1000 * 60 * 5, // Cache berlaku selama 5 menit
  });

  return { threads, loading: isLoading, error, refetch };
}

// Mengambil detail suatu thread beserta daftar respons-nya
export function useHubThreadDetail(threadId: string) {
  const queryClient = useQueryClient();

  const { data: thread, isLoading: loadingThread } = useQuery({
    queryKey: ['hubThread', threadId],
    queryFn: () => hubService.getThreadById(threadId),
    enabled: !!threadId,
  });

  const { data: responses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['hubThreadResponses', threadId],
    queryFn: () => hubService.getThreadResponses(threadId),
    enabled: !!threadId,
  });

  const addResponse = useMutation({
    mutationFn: (data: Omit<HubThreadResponse, 'id' | 'createdAt' | 'threadId'>) =>
      hubService.addThreadResponse(threadId, data),
    onSuccess: () => {
      // Invalidate untuk fetch ulang agar data langsung update di UI
      queryClient.invalidateQueries({ queryKey: ['hubThreadResponses', threadId] });
      queryClient.invalidateQueries({ queryKey: ['hubThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['hubThreads'] });
    }
  });

  return {
    thread,
    responses,
    loading: loadingThread || loadingResponses,
    addResponse
  };
}

// Hook untuk membuat Thread baru
export function useCreateHubThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<HubThread, 'id' | 'createdAt' | 'responsesCount'>) =>
      hubService.createThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubThreads'] });
    }
  });
}

// Hook untuk mengupdate Thread (misal merubah status jadi RESOLVED)
export function useUpdateHubThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<HubThread> }) =>
      hubService.updateThread(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hubThread', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['hubThreads'] });
    }
  });
}