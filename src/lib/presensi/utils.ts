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
