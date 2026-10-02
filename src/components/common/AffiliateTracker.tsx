'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { affiliateService } from '@/services/affiliate.service';

const COOKIE_NAME = 'sintesa_ref';
const STORAGE_KEY = 'sintesa_ref_code';
const ATTRIBUTION_DAYS = 30;

export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode || refCode.trim() === '') return;
    const code = refCode.trim().toUpperCase();
    const expires = new Date();
    expires.setDate(expires.getDate() + ATTRIBUTION_DAYS);
    document.cookie = `${COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, savedAt: Date.now(), expiresAt: expires.getTime() }));
    } catch (_) {}
    affiliateService.recordReferralClick(code, window.location.href, navigator.userAgent).catch(() => {});
  }, [searchParams]);

  return null;
}

export function getActiveRefCode(): string | null {
  if (typeof window === 'undefined') return null;
  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { code, expiresAt } = JSON.parse(stored);
    if (Date.now() > expiresAt) { localStorage.removeItem(STORAGE_KEY); return null; }
    return code;
  } catch (_) { return null; }
}
