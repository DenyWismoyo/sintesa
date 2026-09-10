/**
 * Utility tersentralisasi untuk mendapatkan appId multi-tenant Sintesa / Teknopark.
 * Menggabungkan deteksi window runtime (jika di-inject oleh host), environment variable Next.js,
 * serta fallback default 'blud-app-dev'.
 */
export const getAppId = (): string => {
  if (typeof window !== 'undefined' && (window as any).__app_id) {
    return (window as any).__app_id;
  }
  return process.env.NEXT_PUBLIC_APP_ID || 'blud-app-dev';
};
