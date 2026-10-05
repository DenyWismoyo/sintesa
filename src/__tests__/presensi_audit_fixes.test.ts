import { describe, it, expect } from "vitest";
import { getWIBHourMinute, formatWIBTime, getWIBDateString } from "@/lib/presensi/utils";
import { isHariLiburAtauWeekend, hitungHariKerjaEfektif, getHariLibur } from "@/data/presensi/masterHariLibur";
import { AjukanRevisiPresensiSchema } from "@/lib/presensi/validations";
import { getDevPresensiStore, getDevIzinStore, getDevLemburStore, getDevRevisiStore } from "@/data/presensi/seedData";

describe("Presensi Audit Fixes Suite (Phase 1 & 2)", () => {
  describe("BUG-04: Timezone WIB Utility Verification", () => {
    it("harus mengekstrak jam dan menit dalam zona waktu Asia/Jakarta (WIB) secara presisi", () => {
      // 2026-10-05 00:30:00 UTC = 2026-10-05 07:30:00 WIB
      const utcIso = "2026-10-05T00:30:00.000Z";
      const { hour, minute } = getWIBHourMinute(utcIso);
      expect(hour).toBe(7);
      expect(minute).toBe(30);
      expect(formatWIBTime(utcIso)).toBe("07:30");
    });

    it("harus menghasilkan tanggal YYYY-MM-DD sesuai tanggal WIB", () => {
      // 2026-10-04 18:00:00 UTC = 2026-10-05 01:00:00 WIB (sudah berganti hari di WIB)
      const lateUtcIso = "2026-10-04T18:00:00.000Z";
      const dateWib = getWIBDateString(lateUtcIso);
      expect(dateWib).toBe("2026-10-05");
    });
  });

  describe("TD-07: Master Hari Libur Nasional & Hari Kerja Efektif", () => {
    it("harus mengenali hari libur nasional resmi", () => {
      // 17 Agustus 2026 = Hari Kemerdekaan RI (Senin)
      const kemerdekaan = getHariLibur("2026-08-17");
      expect(kemerdekaan).not.toBeNull();
      expect(kemerdekaan?.nama).toContain("Kemerdekaan");
      expect(isHariLiburAtauWeekend("2026-08-17")).toBe(true);
    });

    it("harus mengenali akhir pekan (Sabtu & Minggu) sebagai hari libur", () => {
      // 2026-10-03 = Sabtu, 2026-10-04 = Minggu
      expect(isHariLiburAtauWeekend("2026-10-03")).toBe(true);
      expect(isHariLiburAtauWeekend("2026-10-04")).toBe(true);
      // 2026-10-05 = Senin (bukan tanggal merah)
      expect(isHariLiburAtauWeekend("2026-10-05")).toBe(false);
    });

    it("harus menghitung hari kerja efektif dengan mengecualikan weekend dan tanggal merah", () => {
      // Agustus 2026: 31 hari - 10 hari weekend - 2 hari libur nasional (17 Ags Kemerdekaan & 25 Ags Maulid Nabi) = 19 hari
      const hariKerjaAgustus = hitungHariKerjaEfektif(8, 2026);
      expect(hariKerjaAgustus).toBe(19);
    });
  });

  describe("BUG-09: Validasi Zod Skema Revisi Presensi", () => {
    it("harus menolak permohonan dengan alasan kurang dari 10 karakter", () => {
      const invalidPayload = {
        tanggal: "2026-10-02",
        jenisRevisi: "koreksi_jam_pulang",
        statusSemula: "hadir",
        statusDiajukan: "hadir",
        alasan: "Lupa", // < 10 karakter
      };
      const result = AjukanRevisiPresensiSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("harus menolak format jam yang tidak valid", () => {
      const invalidJam = {
        tanggal: "2026-10-02",
        jenisRevisi: "koreksi_jam_pulang",
        statusSemula: "hadir",
        statusDiajukan: "hadir",
        jamPulangDiajukan: "25:70", // jam tidak valid
        alasan: "Lupa melakukan check-out presensi karena tugas luar kantor",
      };
      const result = AjukanRevisiPresensiSchema.safeParse(invalidJam);
      expect(result.success).toBe(false);
    });

    it("harus menerima permohonan yang valid", () => {
      const validPayload = {
        tanggal: "2026-10-02",
        jenisRevisi: "koreksi_jam_pulang",
        statusSemula: "hadir",
        statusDiajukan: "hadir",
        jamMasukDiajukan: "07:25",
        jamPulangDiajukan: "16:45",
        alasan: "Lupa melakukan check-out presensi karena mendampingi kunjungan delegasi",
      };
      const result = AjukanRevisiPresensiSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe("TD-01: Konsolidasi Dev Store Singleton", () => {
    it("semua dev stores harus tersedia dan berupa instance Map", () => {
      expect(getDevPresensiStore()).toBeInstanceOf(Map);
      expect(getDevIzinStore()).toBeInstanceOf(Map);
      expect(getDevLemburStore()).toBeInstanceOf(Map);
      expect(getDevRevisiStore()).toBeInstanceOf(Map);
    });
  });
});
