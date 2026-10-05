// src/lib/presensi/utils.ts
import { DEFAULT_STORAGE_LIMIT_BYTES } from "./constants";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function calculateStorageQuota(
  usedBytes: number,
  limitBytes: number = DEFAULT_STORAGE_LIMIT_BYTES
): {
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
  percentage: number;
  isNearLimit: boolean;
  isNearlyFull: boolean;
  isFull: boolean;
  colorClass: string;
  statusBadgeVariant: "default" | "secondary" | "destructive" | "outline";
  statusText: string;
} {
  const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const remainingBytes = Math.max(0, limitBytes - usedBytes);
  const isNearLimit = percentage >= 75;
  const isNearlyFull = percentage >= 85;
  const isFull = percentage >= 95;

  let colorClass = "bg-emerald-500";
  let statusBadgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  let statusText = "Normal";

  if (isFull) {
    colorClass = "bg-rose-500";
    statusBadgeVariant = "destructive";
    statusText = "Kritis (Hampir Penuh)";
  } else if (isNearlyFull || isNearLimit) {
    colorClass = "bg-amber-500";
    statusBadgeVariant = "secondary";
    statusText = "Mendekati Batas";
  }

  return {
    usedFormatted: formatBytes(usedBytes),
    limitFormatted: formatBytes(limitBytes),
    remainingFormatted: formatBytes(remainingBytes),
    percentage,
    isNearLimit,
    isNearlyFull,
    isFull,
    colorClass,
    statusBadgeVariant,
    statusText,
  };
}

/**
 * Mengonversi Date / ISO string ke komponen jam dan menit WIB (Asia/Jakarta)
 * Mencegah bug timezone UTC pada environment serverless/cloud/edge (BUG-04).
 */
export function getWIBHourMinute(dateOrIso?: Date | string): { hour: number; minute: number } {
  const date = typeof dateOrIso === "string" ? new Date(dateOrIso) : (dateOrIso || new Date());
  
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  return { hour, minute };
}

/**
 * Format string jam:menit WIB (contoh: "07:15")
 */
export function formatWIBTime(dateOrIso?: Date | string): string {
  const { hour, minute } = getWIBHourMinute(dateOrIso);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Mendapatkan string tanggal YYYY-MM-DD dalam zona waktu WIB
 */
export function getWIBDateString(dateOrIso?: Date | string): string {
  const date = typeof dateOrIso === "string" ? new Date(dateOrIso) : (dateOrIso || new Date());
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}
