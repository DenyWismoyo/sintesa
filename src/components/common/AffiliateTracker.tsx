'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { affiliateService } from '@/services/affiliate.service';
import { getCookie, setCookie, COOKIE_KEYS } from '@/lib/cookies';

const COOKIE_NAME = COOKIE_KEYS.REF;
const STORAGE_KEY = 'sintesa_ref_code';
const ATTRIBUTION_DAYS = 30;

export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode || refCode.trim() === '') return;
    const code = refCode.trim().toUpperCase();
    setCookie(COOKIE_NAME, code, { days: ATTRIBUTION_DAYS, sameSite: 'Lax' });
    try {
      const expiresAt = Date.now() + ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, savedAt: Date.now(), expiresAt }));
    } catch (_) {}
    affiliateService.recordReferralClick(code, window.location.href, navigator.userAgent).catch(() => {});
  }, [searchParams]);

  return null;
}

export function getActiveRefCode(): string | null {
  if (typeof window === 'undefined') return null;
  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal) return cookieVal;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { code, expiresAt } = JSON.parse(stored);
    if (Date.now() > expiresAt) { localStorage.removeItem(STORAGE_KEY); return null; }
    return code;
  } catch (_) { return null; }
}
