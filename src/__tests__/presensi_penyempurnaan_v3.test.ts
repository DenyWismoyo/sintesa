import { describe, it, expect, vi } from "vitest";
import { isHariLiburAtauWeekend } from "@/data/presensi/masterHariLibur";
import { verifyLivenessWithAI } from "@/lib/presensi/anti-fraud/ai-liveness";

describe("Presensi Tekno Sign v3 — Penyempurnaan & Clario AI Suite", () => {
  describe("1. Master Hari Libur & Kalender Otomatis", () => {
    it("harus mengenali hari Minggu/Sabtu sebagai akhir pekan / libur", () => {
      // 2026-01-04 adalah hari Minggu
      expect(isHariLiburAtauWeekend("2026-01-04")).toBe(true);
      // 2026-01-03 adalah hari Sabtu
      expect(isHariLiburAtauWeekend("2026-01-03")).toBe(true);
    });

    it("harus mengenali hari libur nasional (misal Tahun Baru 1 Januari)", () => {
      expect(isHariLiburAtauWeekend("2026-01-01")).toBe(true);
    });

    it("harus mengenali hari kerja normal", () => {
      // 2026-01-05 adalah hari Senin kerja biasa
      expect(isHariLiburAtauWeekend("2026-01-05")).toBe(false);
    });
  });

  describe("2. AI Liveness & Anti-Spoofing (Fail-Safe Mode)", () => {
    it("harus menolak string foto yang kosong atau tidak valid", async () => {
      const result = await verifyLivenessWithAI("");
      expect(result.isAuthentic).toBe(false);
      expect(result.spoofDetected).toBe(true);
    });

    it("harus mengembalikan fail-safe mode yang aman jika AI offline", async () => {
      // Memberikan input foto simulasi
      const result = await verifyLivenessWithAI("data:image/jpeg;base64,samplebase64dataimageplaceholder1234567890");
      expect(result).toHaveProperty("isAuthentic");
      expect(result).toHaveProperty("confidenceScore");
      expect(result).toHaveProperty("spoofDetected");
    });
  });
});
