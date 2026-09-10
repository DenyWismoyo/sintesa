/**
 * In-Memory Sliding Window Rate Limiter for AI API Routes
 * Prevents API key abuse, rate-limit overages, and request flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Bersihkan rekaman yang sudah kedaluwarsa setiap 5 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Mengecek dan mencatat laju request untuk identifier tertentu (IP atau userId)
 * @param identifier String unik (misal: IP address atau token UID)
 * @param limit Jumlah maksimal request dalam jendela waktu (default: 30)
 * @param windowSeconds Durasi jendela waktu dalam detik (default: 60)
 */
export function checkRateLimit(
  identifier: string,
  limit = 30,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter hanya timestamp dalam jendela waktu aktif
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  const resetInSeconds = windowSeconds;

  return {
    success: true,
    limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * Helper untuk mengekstrak IP klien dari Request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
