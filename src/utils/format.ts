/**
 * Utilitas pemformatan mata uang, angka, dan tanggal standar Indonesia
 * untuk sistem Teknopark / Sintesa.
 */

/**
 * Format angka ke format mata uang Rupiah (IDR).
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export const formatRupiah = (angka: number | string | undefined | null): string => {
  if (angka === undefined || angka === null || isNaN(Number(angka))) {
    return 'Rp 0';
  }
  const num = typeof angka === 'string' ? parseFloat(angka) : angka;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format angka dengan pemisah ribuan standar Indonesia (titik).
 * Contoh: 12500 -> "12.500"
 */
export const formatAngka = (angka: number | string | undefined | null): string => {
  if (angka === undefined || angka === null || isNaN(Number(angka))) {
    return '0';
  }
  const num = typeof angka === 'string' ? parseFloat(angka) : angka;
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Format nominal Rupiah ringkas untuk visualisasi analitik atau badge.
 * Contoh: 1.500.000 -> "Rp 1,5 Jt", 2.000.000.000 -> "Rp 2 M"
 */
export const formatSingkatRupiah = (angka: number | undefined | null): string => {
  if (!angka || isNaN(angka)) return 'Rp 0';
  if (angka >= 1_000_000_000) {
    return `Rp ${(angka / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (angka >= 1_000_000) {
    return `Rp ${(angka / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (angka >= 1_000) {
    return `Rp ${(angka / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(angka);
};

/**
 * Format tanggal standar Indonesia.
 * Contoh: Date.now() -> "9 September 2026" atau "9 Sep 2026, 09:30"
 */
export const formatTanggal = (
  val: number | string | Date | undefined | null,
  includeTime: boolean = false
): string => {
  if (!val) return '-';
  try {
    const d = typeof val === 'number' || typeof val === 'string' ? new Date(val) : val;
    if (isNaN(d.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: includeTime ? 'short' : 'long',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    return new Intl.DateTimeFormat('id-ID', options).format(d);
  } catch {
    return '-';
  }
};
