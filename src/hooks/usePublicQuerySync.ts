'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Hook terpadu untuk menyinkronkan state pencarian, filter kategori, dan paginasi
 * pada halaman publik dengan URL Search Parameters (deep-linking & bookmark support).
 */
export function usePublicQuerySync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const getQuery = useCallback(
    (key: string, defaultValue: string = '') => {
      return searchParams?.get(key) || defaultValue;
    },
    [searchParams]
  );

  const getQueryNumber = useCallback(
    (key: string, defaultValue: number = 1) => {
      const val = searchParams?.get(key);
      if (!val) return defaultValue;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
    },
    [searchParams]
  );

  const updateQuery = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');

      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === '' ||
          val === 'all' ||
          val === 'Semua' ||
          val === 'Semua Kategori' ||
          (key === 'page' && Number(val) <= 1)
        ) {
          params.delete(key);
        } else {
          params.set(key, String(val));
        }
      });

      const qs = params.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  return { getQuery, getQueryNumber, updateQuery, isPending, searchParams };
}

export default usePublicQuerySync;

