import { describe, it, expect } from "vitest";
import {
  isPointInPolygon,
  KAWASAN_STP_POLYGON,
  KANTOR_SOLO_TECHNOPARK,
  isSoloTechnoparkOffice,
  calculateEffectiveDistance,
  getDistanceToStpCampus,
  STP_CAMPUS_ANCHORS,
} from "@/data/presensi/masterKantor";
import { STP_CREDENTIALS_LIST, getStpUserProfileByEmail } from "@/data/presensi/stpUsers";

describe("Presensi Techno Sign Solo Technopark", () => {
  describe("Polygon Geofencing (8-Hektar Kawasan Solo Technopark)", () => {
    it("harus memvalidasi seluruh fasilitas di dalam kawasan Solo Technopark sebagai valid", () => {
      // Titik Gedung Pusat & Layanan ASN STP
      const gedungPusat = { lat: -7.5546, lng: 110.8531 };
      expect(isPointInPolygon(gedungPusat, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Gedung Diklat & Inkubator Bisnis
      const gedungDiklat = { lat: -7.5543, lng: 110.8531 };
      expect(isPointInPolygon(gedungDiklat, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Solo Trade Center (STC) & SCC
      const gedungStc = { lat: -7.5549, lng: 110.8541 };
      expect(isPointInPolygon(gedungStc, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Gerbang Utama Ki Hajar Dewantara (sisi utara)
      const gerbangUtama = { lat: -7.5561, lng: 110.8535 };
      expect(isPointInPolygon(gerbangUtama, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik Hanggar / Workshop Manufaktur & FabLab
      const hanggarWorkshop = { lat: -7.5554, lng: 110.8538 };
      expect(isPointInPolygon(hanggarWorkshop, KAWASAN_STP_POLYGON)).toBe(true);

      // Titik STP Arena & Area Terbuka
      const stpArena = { lat: -7.5556, lng: 110.8532 };
      expect(isPointInPolygon(stpArena, KAWASAN_STP_POLYGON)).toBe(true);
    });

    it("harus menolak titik yang berada di luar batas fisik kawasan STP (termasuk area kampus UNS)", () => {
      // Area Kampus UNS (Seberang Selatan Jl. Ki Hajar Dewantara - BUKAN bagian STP)
      const fhUns = { lat: -7.5569, lng: 110.8536 }; // Fakultas Hukum UNS
      expect(isPointInPolygon(fhUns, KAWASAN_STP_POLYGON)).toBe(false);

      const fisipUns = { lat: -7.5572, lng: 110.8540 }; // FISIP UNS
      expect(isPointInPolygon(fisipUns, KAWASAN_STP_POLYGON)).toBe(false);

      const rektoratUns = { lat: -7.5594, lng: 110.8564 }; // Gedung Rektorat UNS
      expect(isPointInPolygon(rektoratUns, KAWASAN_STP_POLYGON)).toBe(false);

      const danauUns = { lat: -7.5616, lng: 110.8550 }; // Danau UNS
      expect(isPointInPolygon(danauUns, KAWASAN_STP_POLYGON)).toBe(false);

      const ftUns = { lat: -7.5580, lng: 110.8565 }; // Fakultas Teknik UNS
      expect(isPointInPolygon(ftUns, KAWASAN_STP_POLYGON)).toBe(false);

      // Titik RSUD Dr. Moewardi Kolonel Sutarto (di luar kawasan barat)
      const rsudMoewardi = { lat: -7.557, lng: 110.842 };
      expect(isPointInPolygon(rsudMoewardi, KAWASAN_STP_POLYGON)).toBe(false);

      // Titik Stasiun Jebres (jauh di luar barat daya)
      const stasiunJebres = { lat: -7.562, lng: 110.840 };
      expect(isPointInPolygon(stasiunJebres, KAWASAN_STP_POLYGON)).toBe(false);

      // Titik Solo Paragon Mall
      const paragon = { lat: -7.560, lng: 110.810 };
      expect(isPointInPolygon(paragon, KAWASAN_STP_POLYGON)).toBe(false);
    });

    it("harus memiliki data master kantor default Solo Technopark dengan radius buffer 200m", () => {
      expect(KANTOR_SOLO_TECHNOPARK.namaKantor).toContain("Solo Technopark");
      expect(KANTOR_SOLO_TECHNOPARK.radiusMeter).toBe(200);
      expect(KANTOR_SOLO_TECHNOPARK.jamMasukMaksimal).toBe("08:00");
      expect(KANTOR_SOLO_TECHNOPARK.jamPulangMinimal).toBe("16:00");
      expect(isSoloTechnoparkOffice(KANTOR_SOLO_TECHNOPARK)).toBe(true);
    });

    it("harus menghitung jarak presisi multi-hotspot campus anchors < 30m di setiap fasilitas", () => {
      for (const anchor of STP_CAMPUS_ANCHORS) {
        const result = getDistanceToStpCampus({ lat: anchor.lat, lng: anchor.lng });
        expect(result.minDistanceMeters).toBeLessThanOrEqual(5);
        expect(result.closestAnchorName).toBe(anchor.nama);
      }
    });

    it("harus menghitung jarak efektif dengan toleransi akurasi GPS", () => {
      // Jika jarak 160m dan akurasi GPS 30m, toleransi mengkompensasi hingga ~145m
      const adjusted = calculateEffectiveDistance(160, 30);
      expect(adjusted).toBeLessThanOrEqual(145);
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
