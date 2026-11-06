// src/hooks/useJobApplications.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { jobApplicationService } from '@/services/jobApplication.service';
import { JobApplication, JobApplicationStatus } from '@/types/alumniForum.types';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'sintesa_local_job_applications';

export function getLocalApplications(): JobApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[useJobApplications] Error parsing local applications:', err);
    return [];
  }
}

export function saveLocalApplication(app: JobApplication) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalApplications();
    const filtered = existing.filter((item) => item.jobId !== app.jobId);
    filtered.unshift(app);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[useJobApplications] Error saving local application:', err);
  }
}

export function removeLocalApplication(jobId: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalApplications();
    const filtered = existing.filter((item) => item.jobId !== jobId && item.id !== jobId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[useJobApplications] Error removing local application:', err);
  }
}

export function useMyJobApplications() {
  const { user } = useAuth();
  const uid = user?.uid || '';

  return useQuery({
    queryKey: ['my-job-applications', uid],
    queryFn: async () => {
      const localApps = getLocalApplications();
      if (!uid) {
        return localApps;
      }
      try {
        const remoteApps = await jobApplicationService.getMyApplications(uid);
        // Gabungkan remote dan local (prioritaskan remote, fallback local)
        const map = new Map<string, JobApplication>();
        localApps.forEach((app) => map.set(app.jobId, app));
        remoteApps.forEach((app) => map.set(app.jobId, app));
        const combined = Array.from(map.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        return combined;
      } catch (err) {
        console.warn('[useMyJobApplications] Fallback to local storage:', err);
        return localApps;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 menit
  });
}

export function useSubmitJobApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      payload: Omit<JobApplication, 'id' | 'status' | 'createdAt' | 'applicantUid'> & {
        applicantUid?: string;
      }
    ) => {
      const effectiveUid = payload.applicantUid || user?.uid || `guest-${Date.now()}`;
      const appData = {
        ...payload,
        applicantUid: effectiveUid,
      };

      let remoteId: string | undefined = undefined;

      // Coba simpan ke Firestore jika user login atau online
      try {
        const res = await jobApplicationService.submitApplication(appData);
        if (res.success && res.id) {
          remoteId = res.id;
        }
      } catch (err) {
        console.warn('[useSubmitJobApplication] Remote sync skipped:', err);
      }

      // Selalu simpan ke local storage agar pelamar langsung melihat riwayatnya
      const fullApp: JobApplication = {
        ...appData,
        id: remoteId || `local-${Date.now()}`,
        status: 'APPLIED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveLocalApplication(fullApp);

      return fullApp;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-job-applications'] });
      toast.success('Lamaran Berhasil Diajukan!', {
        description: `Berkas lamaran untuk posisi ${data.jobTitle} di ${data.companyName} telah dicatat dalam Daftar Lamaran Anda.`,
      });
    },
    onError: (err: any) => {
      toast.error('Gagal Mengajukan Lamaran', {
        description: err.message || 'Terjadi kesalahan sistem, silakan coba beberapa saat lagi.',
      });
    },
  });
}

export function useMarkExternalJobApplied() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      jobId: string;
      jobTitle: string;
      companyName: string;
      source: string;
      applicationUrl?: string;
    }) => {
      const effectiveUid = user?.uid || `guest-${Date.now()}`;
      const appData: JobApplication = {
        id: `ext-${Date.now()}`,
        jobId: params.jobId,
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        applicantUid: effectiveUid,
        applicantName: user?.displayName || 'Pelamar Terdaftar',
        applicantEmail: user?.email || 'email@pelamar.com',
        status: 'APPLIED',
        statusNote: `Melamar mandiri melalui ${params.source || 'Portal Resmi Perusahaan'}`,
        portfolioUrl: params.applicationUrl,
        skills: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simpan ke local storage
      saveLocalApplication(appData);

      // Sinkronkan ke Firestore jika ada auth
      if (user?.uid) {
        try {
          await jobApplicationService.submitApplication(appData);
        } catch (err) {
          console.warn('[useMarkExternalJobApplied] Firestore sync fallback:', err);
        }
      }

      return appData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-job-applications'] });
      toast.success('Lamaran Telah Ditandai!', {
        description: `Posisi ${data.jobTitle} di ${data.companyName} berhasil disimpan ke Daftar Lamaran Saya.`,
      });
    },
  });
}

export function useDeleteJobApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { appId: string; jobId: string; jobTitle: string }) => {
      removeLocalApplication(params.appId);
      removeLocalApplication(params.jobId);
      await jobApplicationService.deleteApplication(params.appId);
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['my-job-applications'] });
      toast.info(`Lamaran posisi ${params.jobTitle} dihapus dari riwayat pelacakan.`);
    },
  });
}

