"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * Custom hook untuk menyinkronkan state tab halaman Admin dengan URL Query (?tab=...)
 * dan pintasan sub-menu di Sidebar Admin.
 */
export function useAdminTab<T extends string>(
  defaultTab: T,
  allowedTabs?: readonly T[]
): [T, (nextTab: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab');

  const resolveValidTab = useCallback(
    (raw: string | null): T => {
      const fallback =
        allowedTabs && allowedTabs.length > 0
          ? allowedTabs.includes(defaultTab)
            ? defaultTab
            : allowedTabs[0]
          : defaultTab;

      if (!raw) return fallback;

      if (allowedTabs && allowedTabs.length > 0) {
        const exact = allowedTabs.find((t) => t === raw);
        if (exact) return exact;
        const caseInsensitive = allowedTabs.find(
          (t) => t.toLowerCase() === raw.toLowerCase()
        );
        if (caseInsensitive) return caseInsensitive;
        return fallback;
      }

      return raw as T;
    },
    [defaultTab, allowedTabs]
  );

  const [activeTab, setInternalTab] = useState<T>(() => resolveValidTab(tabParam));

  useEffect(() => {
    const resolved = resolveValidTab(tabParam);
    setInternalTab(resolved);
  }, [tabParam, resolveValidTab]);

  const setActiveTab = useCallback(
    (nextTab: T) => {
      setInternalTab(nextTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', nextTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return [activeTab, setActiveTab];
}

