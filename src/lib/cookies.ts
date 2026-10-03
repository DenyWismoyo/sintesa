/**
 * Helper utilitas manipulasi cookie yang aman (Client-side & SSR Safe)
 * untuk ekosistem Sintesa / Teknopark.
 */

export const COOKIE_KEYS = {
  CONSENT: 'sintesa_cookie_consent',
  REF: 'sintesa_ref',
  RECENT_VIEWS: 'sintesa_recent_views',
  THEME: 'sintesa_theme',
} as const;

export interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

/**
 * Membaca nilai cookie berdasarkan nama
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Menyimpan cookie dengan konfigurasi keamanan terstandarisasi
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const {
    days = 30,
    path = '/',
    sameSite = 'Lax',
    secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;

  if (days > 0) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * Menghapus cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Mengambil status izin cookie saat ini ('all' | 'essential' | null)
 */
export function getCookieConsent(): 'all' | 'essential' | null {
  const val = getCookie(COOKIE_KEYS.CONSENT);
  if (val === 'all' || val === 'essential') return val;
  return null;
}

/**
 * Menyimpan pilihan izin cookie
 */
export function setCookieConsent(type: 'all' | 'essential'): void {
  // Simpan selama 1 tahun (365 hari)
  setCookie(COOKIE_KEYS.CONSENT, type, { days: 365 });
}
