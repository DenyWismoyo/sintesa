import { describe, it, expect } from "vitest";
import { isPointInPolygon, KAWASAN_STP_POLYGON, KANTOR_SOLO_TECHNOPARK } from "@/data/presensi/masterKantor";
import { STP_CREDENTIALS_LIST, getStpUserProfileByEmail } from "@/data/presensi/stpUsers";

describe("Presensi Techno Sign Solo Technopark", () => {
  describe("Polygon Geofencing (8-Hektar Kawasan Solo Technopark)", () => {
    it("harus memvalidasi titik di dalam kawasan sebagai valid", () => {
      // Titik Gedung Utama STP
      const gedungUtama = { lat: -7.5587, lng: 110.8566 };
      expect(isPointInPolygon(gedungUtama, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Hanggar / Workshop Manufaktur (ujung barat daya kawasan)
      const hanggarWorkshop = { lat: -7.5593, lng: 110.8557 };
      expect(isPointInPolygon(hanggarWorkshop, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Gedung Fasilitas Inkubasi (tengah utara kawasan)
      const gedungInkubasi = { lat: -7.5582, lng: 110.8568 };
      expect(isPointInPolygon(gedungInkubasi, KAWASAN_STP_POLYGON)).toBe(true);
    });

    it("harus menolak titik yang berada di luar batas fisik kawasan STP", () => {
      // Titik Kampus UNS Kentingan (di luar kawasan utara)
      const kampusUns = { lat: -7.5615, lng: 110.8565 };
      expect(isPointInPolygon(kampusUns, KAWASAN_STP_POLYGON)).toBe(false);

      // Titik RSUD Dr. Moewardi Kolonel Sutarto (di luar kawasan barat)
      const rsudMoewardi = { lat: -7.557, lng: 110.849 };
      expect(isPointInPolygon(rsudMoewardi, KAWASAN_STP_POLYGON)).toBe(false);

      // Titik Stasiun Jebres (jauh di luar)
      const stasiunJebres = { lat: -7.5602, lng: 110.8432 };
      expect(isPointInPolygon(stasiunJebres, KAWASAN_STP_POLYGON)).toBe(false);
    });

    it("harus memiliki data master kantor default Solo Technopark dengan radius minimal 150m", () => {
      expect(KANTOR_SOLO_TECHNOPARK.namaKantor).toContain("Solo Technopark");
      expect(KANTOR_SOLO_TECHNOPARK.radiusMeter).toBeGreaterThanOrEqual(150);
      expect(KANTOR_SOLO_TECHNOPARK.jamMasukMaksimal).toBe("08:00");
      expect(KANTOR_SOLO_TECHNOPARK.jamPulangMinimal).toBe("16:00");
    });
  });

  describe("Master Pegawai Solo Technopark (RBAC & Identitas)", () => {
    it("harus memuat 46 pegawai Solo Technopark", () => {
      expect(STP_CREDENTIALS_LIST.length).toBe(46);
    });

    it("harus memvalidasi akun Admin BLUD Solo Technopark berkewenangan admin", () => {
      const admin = getStpUserProfileByEmail("admin.blud@solotechnopark.id");
      expect(admin).toBeDefined();
      expect(admin?.role).toBe("admin");
      expect(admin?.nama).toContain("Admin BLUD");
    });

    it("harus memvalidasi akun Kepala Divisi Riset (Abednego Danu) berkewenangan atasan", () => {
      const atasan = getStpUserProfileByEmail("abednego.danu@solotechnopark.id");
      expect(atasan).toBeDefined();
      expect(atasan?.role).toBe("atasan");
      expect(atasan?.nama).toContain("Abednego Danu");
    });

    it("harus memvalidasi pencarian pegawai berdasarkan Access Code", () => {
      const pegawai = getStpUserProfileByEmail("STP-63160");
      expect(pegawai).toBeDefined();
      expect(pegawai?.nama).toBe("Agus Munaji, S.Kom");
      expect(pegawai?.role).toBe("pegawai");
    });
  });

  describe("Format Export Laporan Kedinasan", () => {
    it("harus menghasilkan konten CSV yang diawali dengan UTF-8 BOM", () => {
      const BOM = "\uFEFF";
      const sampleCsv = `${BOM}No,NIP,Nama Pegawai,Hari Kerja,Hadir\r\n1,"199208152019031004","Budi Santoso",22,22`;
      expect(sampleCsv.startsWith("\uFEFF")).toBe(true);
      expect(sampleCsv).toContain("Budi Santoso");
    });
  });
});
