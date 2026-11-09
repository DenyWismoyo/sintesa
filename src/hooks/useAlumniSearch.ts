'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAlumni } from '@/hooks/useAlumni';

interface SearchProps {
  query: string;
  status?: string;
  internalStatus?: string;
  originSource?: string;
  isLookingForJob?: boolean;
  perPage?: number;
}

export function useAlumniSearch({
  query: searchQuery,
  status,
  internalStatus,
  originSource,
  isLookingForJob,
  perPage = 18,
}: SearchProps) {
  const { allAlumnis = [], loadingAll } = useAlumni();
  const [page, setPage] = useState(1);

  // Reset page ke 1 jika filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchQuery, status, internalStatus, originSource, isLookingForJob]);

  const filteredData = useMemo(() => {
    let list = [...allAlumnis];

    // 1. FILTER STATUS AKUN (CLAIMED / DORMANT / ALL)
    if (status && status !== 'ALL') {
      list = list.filter((item: any) => (item.status || 'DORMANT') === status);
    }

    // 2. FILTER PIPELINE INTERNAL (AVAILABLE / INTERVIEWING / HIRED)
    if (internalStatus && internalStatus !== 'ALL') {
      list = list.filter(
        (item: any) => (item.internalStatus || 'AVAILABLE') === internalStatus
      );
    }

    // 3. FILTER JALUR ASAL (STP_VOKASI / KERJASAMA_P3MI / RSKB_SURAKARTA)
    if (originSource && originSource !== 'ALL') {
      list = list.filter(
        (item: any) => (item.originSource || 'STP_VOKASI') === originSource
      );
    }

    // 4. FILTER OPEN TO WORK
    if (isLookingForJob !== undefined) {
      list = list.filter((item: any) => Boolean(item.isLookingForJob) === isLookingForJob);
    }

    // 5. TEXT SEARCH
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      list = list.filter((item: any) => {
        const combined = `${item.name || ''} ${item.email || ''} ${item.phone || ''} ${
          item.registrationCode || ''
        } ${item.programTaken || ''} ${item.partnerInstitution || ''} ${item.domicile || ''} ${
          item.currentJob || ''
        } ${item.company || ''} ${item.skills?.join(' ') || ''} ${item.industry || ''} ${
          item.education || ''
        } ${item.major || ''}`.toLowerCase();
        return combined.includes(lowerQ);
      });
    }

    // Prioritaskan akun CLAIMED & yang memiliki foto / Open to Work di urutan atas, lalu createdAt terbaru
    list.sort((a: any, b: any) => {
      const aClaimed = a.status === 'CLAIMED' ? 1 : 0;
      const bClaimed = b.status === 'CLAIMED' ? 1 : 0;
      if (bClaimed !== aClaimed) return bClaimed - aClaimed;

      const aPhoto = a.photoUrl ? 1 : 0;
      const bPhoto = b.photoUrl ? 1 : 0;
      if (bPhoto !== aPhoto) return bPhoto - aPhoto;

      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return list;
  }, [allAlumnis, searchQuery, status, internalStatus, originSource, isLookingForJob]);

  const totalHits = filteredData.length;
  const endIndex = page * perPage;
  const results = useMemo(() => filteredData.slice(0, endIndex), [filteredData, endIndex]);
  const hasNextPage = endIndex < totalHits;

  const loadMore = () => {
    if (hasNextPage && !loadingAll) {
      setPage((prev) => prev + 1);
    }
  };

  return { results, totalHits, loading: loadingAll, hasNextPage, loadMore };
}
