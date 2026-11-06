// src/hooks/useBookmarkedJobs.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { alumniService } from '@/services/alumni.service';
import { Alumni } from '@/types/ecosystem.types';
import { toast } from 'sonner';

const BOOKMARK_STORAGE_KEY = 'sintesa_bookmarked_jobs';
const BOOKMARK_EVENT_NAME = 'sintesa:bookmarks-updated';

function readLocalBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeLocalBookmarks(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT_NAME, { detail: ids }));
  } catch {
    // Abaikan jika storage penuh
  }
}

/**
 * Hook terpusat untuk memuat profil Alumni milik user yang sedang login
 */
export function useCurrentAlumniProfile(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const uid = user?.uid || '';
  const isEnabled = (options?.enabled ?? true) && Boolean(uid);

  return useQuery<Alumni | null>({
    queryKey: ['current-alumni-profile', uid],
    queryFn: async () => {
      if (!uid) return null;
      try {
        return await alumniService.getAlumniByUserId(uid);
      } catch {
        return null;
      }
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5, // 5 menit sesuai R-014
  });
}

/**
 * Hook terpusat untuk Simpan Lowongan (Bookmark) Persisten (LocalStorage + Firestore Alumni Profile)
 */
export function useBookmarkedJobs() {
  const queryClient = useQueryClient();
  const { data: alumniProfile } = useCurrentAlumniProfile();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Inisialisasi dari localStorage & sinkronkan dengan Firestore alumniProfile jika ada
  useEffect(() => {
    const localIds = readLocalBookmarks();
    const remoteIds = Array.isArray(alumniProfile?.bookmarkedJobIds)
      ? alumniProfile.bookmarkedJobIds
      : [];

    const merged = Array.from(new Set([...remoteIds, ...localIds]));
    setBookmarkedIds(merged);
    if (merged.length !== localIds.length) {
      writeLocalBookmarks(merged);
    }
  }, [alumniProfile?.id, alumniProfile?.bookmarkedJobIds]);

  // Dengarkan perubahan lintas komponen dalam tab yang sama
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => {
      setBookmarkedIds(readLocalBookmarks());
    };
    window.addEventListener(BOOKMARK_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(BOOKMARK_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const toggleBookmark = useCallback(
    async (jobId: string, jobTitle?: string) => {
      if (!jobId) return;
      const current = readLocalBookmarks();
      const exists = current.includes(jobId);
      const updated = exists ? current.filter((id) => id !== jobId) : [jobId, ...current];

      setBookmarkedIds(updated);
      writeLocalBookmarks(updated);

      if (exists) {
        toast.info(
          jobTitle
            ? `Lowongan "${jobTitle}" dihapus dari daftar tersimpan.`
            : 'Lowongan dihapus dari daftar tersimpan.'
        );
      } else {
        toast.success(
          jobTitle
            ? `Lowongan "${jobTitle}" disimpan ke Profil Karir Anda.`
            : 'Lowongan disimpan ke daftar simpanan Anda.'
        );
      }

      if (alumniProfile?.id) {
        try {
          await alumniService.updateAlumni(alumniProfile.id, {
            bookmarkedJobIds: updated,
            updatedAt: Date.now(),
          });
          queryClient.invalidateQueries({ queryKey: ['current-alumni-profile'] });
        } catch {
          // Tetap aman tersimpan di localStorage
        }
      }
    },
    [alumniProfile?.id, queryClient]
  );

  const isBookmarked = useCallback(
    (jobId?: string) => Boolean(jobId && bookmarkedIds.includes(jobId)),
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
  };
}

