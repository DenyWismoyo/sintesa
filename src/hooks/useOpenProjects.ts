// src/hooks/useOpenProjects.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openProjectService } from '@/services/openProject.service';
import {
  OpenProject,
  OpenProjectInput,
  OpenProjectStatus,
  ProjectApplication,
  ProjectApplicationStatus,
} from '@/types/partnership.types';
import { toast } from 'sonner';

const STALE_5_MIN = 5 * 60 * 1000;

export function usePublicOpenProjects() {
  return useQuery({
    queryKey: ['publicOpenProjects'],
    queryFn: () => openProjectService.getPublicProjects(),
    staleTime: STALE_5_MIN,
  });
}

export function usePartnerOpenProjects(partnerId?: string | null) {
  return useQuery({
    queryKey: ['partnerOpenProjects', partnerId || ''],
    queryFn: () => openProjectService.getPartnerProjects(partnerId!),
    enabled: Boolean(partnerId),
    staleTime: 60 * 1000,
  });
}

export function useAllOpenProjects() {
  return useQuery({
    queryKey: ['allOpenProjects'],
    queryFn: () => openProjectService.getAllProjects(),
    staleTime: STALE_5_MIN,
  });
}

export function useProjectApplications(projectId?: string, partnerId?: string) {
  const isEnabled = Boolean(projectId || partnerId);
  return useQuery({
    queryKey: ['projectApplications', projectId || '', partnerId || ''],
    queryFn: () => openProjectService.getProjectApplications(projectId, partnerId),
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
}

export function useOpenProjectMutations() {
  const queryClient = useQueryClient();

  const submitProjectDraftMutation = useMutation({
    mutationFn: (data: Omit<OpenProjectInput, 'id' | 'status' | 'createdAt' | 'updatedAt'>) =>
      openProjectService.submitProjectDraft(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['partnerOpenProjects'] });
        queryClient.invalidateQueries({ queryKey: ['allOpenProjects'] });
        toast.success('Draf proyek berhasil dikirimkan!', {
          description: 'Tim Kurasi Solo Technopark akan mereview proyek Anda sebelum ditayangkan.',
        });
      } else {
        toast.error('Gagal mengajukan proyek: ' + res.error);
      }
    },
  });

  const reviewProjectMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: OpenProjectStatus;
      notes?: string;
    }) => openProjectService.reviewProject(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOpenProjects'] });
      queryClient.invalidateQueries({ queryKey: ['publicOpenProjects'] });
      queryClient.invalidateQueries({ queryKey: ['partnerOpenProjects'] });
      toast.success('Status kurasi proyek berhasil diperbarui');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpenProject> }) =>
      openProjectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerOpenProjects'] });
      queryClient.invalidateQueries({ queryKey: ['publicOpenProjects'] });
      toast.success('Proyek berhasil diperbarui');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => openProjectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerOpenProjects'] });
      queryClient.invalidateQueries({ queryKey: ['allOpenProjects'] });
      toast.success('Proyek berhasil dihapus');
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: (data: Omit<ProjectApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) =>
      openProjectService.submitApplication(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['projectApplications'] });
        toast.success('Lamaran proyek berhasil dikirimkan!', {
          description: 'Mitra industri akan meninjau portofolio dan proposal Anda.',
        });
      } else {
        toast.error('Gagal melamar proyek: ' + res.error);
      }
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      feedback,
    }: {
      id: string;
      status: ProjectApplicationStatus;
      feedback?: string;
    }) => openProjectService.updateApplicationStatus(id, status, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectApplications'] });
      toast.success('Status lamaran pelamar berhasil diperbarui');
    },
  });

  return {
    submitProjectDraftMutation,
    reviewProjectMutation,
    updateProjectMutation,
    deleteProjectMutation,
    submitApplicationMutation,
    updateApplicationStatusMutation,
  };
}

