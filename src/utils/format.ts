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

/**
 * Format nominal gaji dengan dukungan multi-mata uang (Asia, ASEAN, dan Global).
 * Contoh:
 *   (15000000, 'IDR') -> "Rp 15.000.000"
 *   (4500, 'SGD') -> "S$ 4.500"
 *   (3500, 'MYR') -> "RM 3.500"
 *   (350000, 'JPY') -> "¥350.000"
 *   (3000000, 'KRW') -> "₩3.000.000"
 *   (50000, 'PHP') -> "₱50.000"
 *   (45000, 'THB') -> "฿45.000"
 */
export const formatSalary = (
  angka: number | string | undefined | null,
  currency: string = 'IDR'
): string => {
  if (angka === undefined || angka === null || isNaN(Number(angka))) {
    return '0';
  }
  const num = typeof angka === 'string' ? parseFloat(angka) : angka;
  const curr = (currency || 'IDR').toUpperCase();

  switch (curr) {
    case 'IDR':
      return formatRupiah(num);
    case 'SGD':
      return `S$ ${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'MYR':
      return `RM ${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'JPY':
      return `¥${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'KRW':
      return `₩${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'PHP':
      return `₱${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'THB':
      return `฿${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'VND':
      return `₫${new Intl.NumberFormat('id-ID').format(num)}`;
    case 'USD':
      return `$${new Intl.NumberFormat('en-US').format(num)}`;
    default:
      return `${curr} ${new Intl.NumberFormat('id-ID').format(num)}`;
  }
};

