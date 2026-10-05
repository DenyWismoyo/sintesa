// src/data/presensi/masterHariLibur.ts

export interface HariLibur {
  tanggal: string; // YYYY-MM-DD
  nama: string;
  keterangan?: string;
  isCutiBersama?: boolean;
}

/**
 * Daftar Hari Libur Nasional & Cuti Bersama Resmi Indonesia Tahun 2026
 * (Sesuai SKB 3 Menteri tentang Hari Libur Nasional dan Cuti Bersama)
 */
export const DAFTAR_HARI_LIBUR_2026: HariLibur[] = [
  { tanggal: "2026-01-01", nama: "Tahun Baru 2026 Masehi" },
  { tanggal: "2026-01-16", nama: "Isra Mikraj Nabi Muhammad SAW" },
  { tanggal: "2026-02-17", nama: "Tahun Baru Imlek 2577 Kongzili" },
  { tanggal: "2026-03-20", nama: "Hari Suci Nyepi Tahun Baru Saka 1948" },
  { tanggal: "2026-03-21", nama: "Hari Raya Idul Fitri 1447 H (Hari Pertama)" },
  { tanggal: "2026-03-22", nama: "Hari Raya Idul Fitri 1447 H (Hari Kedua)" },
  { tanggal: "2026-03-23", nama: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCutiBersama: true },
  { tanggal: "2026-03-24", nama: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCutiBersama: true },
  { tanggal: "2026-04-03", nama: "Wafat Yesus Kristus" },
  { tanggal: "2026-04-05", nama: "Kebangkitan Yesus Kristus (Paskah)" },
  { tanggal: "2026-05-01", nama: "Hari Buruh Internasional" },
  { tanggal: "2026-05-14", nama: "Kenaikan Yesus Kristus" },
  { tanggal: "2026-05-27", nama: "Hari Raya Idul Adha 1447 H" },
  { tanggal: "2026-05-31", nama: "Hari Raya Waisak 2570 BE" },
  { tanggal: "2026-06-01", nama: "Hari Lahir Pancasila" },
  { tanggal: "2026-06-16", nama: "Tahun Baru Islam 1448 Hijriah" },
  { tanggal: "2026-08-17", nama: "Hari Kemerdekaan Republik Indonesia" },
  { tanggal: "2026-08-25", nama: "Maulid Nabi Muhammad SAW" },
  { tanggal: "2026-12-24", nama: "Cuti Bersama Hari Raya Natal", isCutiBersama: true },
  { tanggal: "2026-12-25", nama: "Hari Raya Natal" },
];

/**
 * Mengecek apakah tanggal tertentu merupakan hari libur nasional atau cuti bersama
 */
export function getHariLibur(tanggalStr: string): HariLibur | null {
  return DAFTAR_HARI_LIBUR_2026.find((h) => h.tanggal === tanggalStr) || null;
}

/**
 * Mengecek apakah tanggal tertentu adalah hari libur (Sabtu, Minggu, atau Hari Libur Nasional)
 */
export function isHariLiburAtauWeekend(tanggalStr: string): boolean {
  const date = new Date(`${tanggalStr}T00:00:00.000Z`);
  const day = date.getUTCDay();
  // 0 = Minggu, 6 = Sabtu
  if (day === 0 || day === 6) return true;

  return !!getHariLibur(tanggalStr);
}

/**
 * Menghitung jumlah hari kerja efektif dalam bulan tertentu
 * Mengabaikan hari Sabtu, Minggu, dan Hari Libur Nasional.
 * @param bulan 1-12
 * @param tahun contoh: 2026
 */
export function hitungHariKerjaEfektif(bulan: number, tahun: number = 2026): number {
  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  let hariKerja = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(bulan).padStart(2, "0");
    const dateStr = `${tahun}-${monthStr}-${dayStr}`;

    if (!isHariLiburAtauWeekend(dateStr)) {
      hariKerja++;
    }
  }

  return hariKerja;
}
