// src/hooks/useJobs.ts
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import { JobFilterParams, JobAiMatchRequest, JobAiMatchResponse } from '@/types/job.types';

export function useJobs(filters: JobFilterParams = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
    staleTime: 1000 * 60 * 5, // 5 menit cache sesuai standar performa Sintesa
    gcTime: 1000 * 60 * 30, // 30 menit di memori
  });
}

export function useJobDetail(idOrSlug?: string) {
  return useQuery({
    queryKey: ['job-detail', idOrSlug],
    queryFn: () => (idOrSlug ? jobService.getJobById(idOrSlug) : null),
    enabled: !!idOrSlug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useJobAiMatchMutation() {
  return useMutation({
    mutationFn: (payload: JobAiMatchRequest) => jobService.matchJobWithAI(payload),
  });
}
