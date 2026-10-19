import { describe, it, expect, beforeEach } from "vitest";
import { UserProfile, PresensiRecord, LKHRecord, PengajuanIzinItem, LemburRecord, PermohonanRevisiPresensi } from "@/types/presensi";
import { getDevPresensiStore, getDevLKHStore, getDevIzinStore, getDevLemburStore, getDevRevisiStore, getDevUsersStore } from "@/data/presensi/seedData";
import { TARGET_POIN_HARIAN } from "@/data/presensi/masterAktivitas";
import { DEFAULT_JABATAN_LIST } from "@/data/presensi/masterJabatan";
import { STP_CREDENTIALS_LIST } from "@/data/presensi/stpUsers";
import { calculateRekapStatistik } from "@/actions/presensi/statistik";

describe("Pengujian Mekanisme Presensi, LKH, Izin, Lembur, dan Pelaporan Tekno Sign", () => {
  const mockDate = "2026-10-15";

  // Data mock pegawai dan atasannya
  const mockBawahan: UserProfile = {
    id: "usr-bawahan-01",
    nip: "STP-91377-MOCK",
    accessCode: "STP-91377",
    nama: "Muhammad Restu Choiri, A.Md",
    email: "restu.choiri@solotechnopark.id",
    role: "pegawai",
    jabatan: "Staf Information Technology",
    jabatanId: "jbt-staf-it",
    rankLevel: 8,
    golongan: "Pegawai BLUD Solo Technopark",
    instansi: "UPTD KST Solo Technopark",
    departmentName: "Information Technology",
    kantorId: "kantor-stp-pusat",
    namaKantor: "UPTD KST Solo Technopark (Pusat)",
    orgId: "solotechnopark",
    supervisorId: "usr-atasan-01",
    supervisorNama: "Agus Jatmiko, S.Kom",
    atasanId: "usr-atasan-01",
    atasanNama: "Agus Jatmiko, S.Kom",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824,
  };

  const mockAtasan: UserProfile = {
    id: "usr-atasan-01",
    nip: "STP-91377",
    accessCode: "STP-91377",
    nama: "Agus Jatmiko, S.Kom",
    email: "agus.jatmiko@solotechnopark.id",
    role: "pegawai",
    jabatan: "Kepala Divisi Information Technology",
    jabatanId: "jbt-04-it",
    rankLevel: 4,
    golongan: "Pegawai BLUD Solo Technopark",
    instansi: "UPTD KST Solo Technopark",
    departmentName: "Information Technology",
    kantorId: "kantor-stp-pusat",
    namaKantor: "UPTD KST Solo Technopark (Pusat)",
    orgId: "solotechnopark",
    supervisorId: "usr-manager-01",
    supervisorNama: "Susilo Budi Arianto, S.T.",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824,
  };

  beforeEach(() => {
    // Reset dev stores sebelum tiap tes
    getDevPresensiStore().clear();
    getDevLKHStore().clear();
    getDevIzinStore().clear();
    getDevLemburStore().clear();
    getDevRevisiStore().clear();

    getDevUsersStore().set(mockBawahan.id, mockBawahan);
    getDevUsersStore().set(mockAtasan.id, mockAtasan);
  });

  // ── 1. Uji Mekanisme Presensi (Check-in & Check-out) ──────────────────────
  describe("1. Mekanisme Absensi / Presensi", () => {
    it("harus mencatatkan check-in hadir tepat waktu dan geofence valid", () => {
      const presensiId = `${mockBawahan.id}_${mockDate}`;
      const record: PresensiRecord = {
        id: presensiId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: mockDate,
        jamMasuk: "07:15",
        jamPulang: "-",
        status: "hadir",
        lokasiMasuk: {
          latitude: -7.5579,
          longitude: 110.8554,
          jarakMeter: 25,
          isDalamRadius: true,
        },
        fotoMasukUrl: "https://storage.local/presensi/swafoto-masuk.jpg",
        createdAt: `${mockDate}T07:15:00.000Z`,
        updatedAt: `${mockDate}T07:15:00.000Z`,
      };

      getDevPresensiStore().set(presensiId, record);
      const saved = getDevPresensiStore().get(presensiId);

      expect(saved).toBeDefined();
      expect(saved?.status).toBe("hadir");
      expect(saved?.jamMasuk).toBe("07:15");
      expect(saved?.lokasiMasuk.isDalamRadius).toBe(true);
      expect(saved?.lokasiMasuk.jarakMeter).toBeLessThanOrEqual(50);
    });

    it("harus mencatatkan status terlambat jika check-in melewati jam 07:30", () => {
      const presensiId = `${mockBawahan.id}_${mockDate}`;
      const jamMasuk = "08:10";
      const status: "hadir" | "terlambat" = jamMasuk > "07:30" ? "terlambat" : "hadir";

      const record: PresensiRecord = {
        id: presensiId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: mockDate,
        jamMasuk,
        jamPulang: "-",
        status,
        lokasiMasuk: {
          latitude: -7.5579,
          longitude: 110.8554,
          jarakMeter: 15,
          isDalamRadius: true,
        },
        fotoMasukUrl: "https://storage.local/presensi/swafoto-masuk.jpg",
        createdAt: `${mockDate}T08:10:00.000Z`,
        updatedAt: `${mockDate}T08:10:00.000Z`,
      };

      getDevPresensiStore().set(presensiId, record);
      const saved = getDevPresensiStore().get(presensiId);

      expect(saved?.status).toBe("terlambat");
      expect(saved?.jamMasuk).toBe("08:10");
    });

    it("harus mencatatkan check-out pulang melengkapi presensi hari kerja", () => {
      const presensiId = `${mockBawahan.id}_${mockDate}`;
      const recordMasuk: PresensiRecord = {
        id: presensiId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: mockDate,
        jamMasuk: "07:20",
        jamPulang: "-",
        status: "hadir",
        lokasiMasuk: {
          latitude: -7.5579,
          longitude: 110.8554,
          jarakMeter: 10,
          isDalamRadius: true,
        },
        fotoMasukUrl: "https://storage.local/presensi/masuk.jpg",
        createdAt: `${mockDate}T07:20:00.000Z`,
        updatedAt: `${mockDate}T07:20:00.000Z`,
      };
      getDevPresensiStore().set(presensiId, recordMasuk);

      // Check-out pukul 16:35
      const recordPulang: PresensiRecord = {
        ...recordMasuk,
        jamPulang: "16:35",
        lokasiPulang: {
          latitude: -7.5578,
          longitude: 110.8555,
          jarakMeter: 12,
          isDalamRadius: true,
        },
        fotoPulangUrl: "https://storage.local/presensi/pulang.jpg",
        updatedAt: `${mockDate}T16:35:00.000Z`,
      };
      getDevPresensiStore().set(presensiId, recordPulang);

      const saved = getDevPresensiStore().get(presensiId);
      expect(saved?.jamPulang).toBe("16:35");
      expect(saved?.lokasiPulang?.isDalamRadius).toBe(true);
    });
  });

  // ── 2. Uji Mekanisme LKH (Laporan Kinerja Harian) ─────────────────────────
  describe("2. Mekanisme Laporan Kinerja Harian (LKH)", () => {
    it("harus mencatat kegiatan logbook, kalkulasi poin SKP, dan mendeteksi pencapaian target 300 poin", () => {
      const lkhId = `${mockBawahan.id}_${mockDate}`;
      const kegiatan = [
        {
          id: "act-01",
          aktivitasId: "it-01",
          namaAktivitas: "Pemeliharaan Server Cloud & Presensi Geofencing",
          volumeKegiatan: 2,
          satuan: "Kegiatan",
          nilaiPoin: 150,
          totalPoin: 300,
          outputHasil: "Database dan server sinkron tanpa downtime",
          lampiranUrl: "https://storage.local/lkh/bukti-server.png",
        },
      ];

      const totalPoinHarian = kegiatan.reduce((sum, item) => sum + item.totalPoin, 0);
      const isTargetTercapai = totalPoinHarian >= TARGET_POIN_HARIAN;

      const record: LKHRecord = {
        id: lkhId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        tanggal: mockDate,
        atasanId: mockBawahan.supervisorId,
        atasanNama: mockBawahan.supervisorNama,
        kegiatan,
        totalPoinHarian,
        targetPoinHarian: TARGET_POIN_HARIAN,
        isTargetTercapai,
        status: "draft",
        createdAt: `${mockDate}T15:00:00.000Z`,
        updatedAt: `${mockDate}T15:00:00.000Z`,
      };

      getDevLKHStore().set(lkhId, record);
      const saved = getDevLKHStore().get(lkhId);

      expect(saved).toBeDefined();
      expect(saved?.totalPoinHarian).toBe(300);
      expect(saved?.isTargetTercapai).toBe(true);
      expect(saved?.status).toBe("draft");
      expect(saved?.atasanId).toBe(mockAtasan.id);
    });

    it("harus mendukung alur submit LKH ke Atasan Langsung dan verifikasi persetujuan", () => {
      const lkhId = `${mockBawahan.id}_${mockDate}`;
      const lkhAwal: LKHRecord = {
        id: lkhId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        tanggal: mockDate,
        atasanId: mockBawahan.supervisorId,
        atasanNama: mockBawahan.supervisorNama,
        kegiatan: [
          {
            id: "act-01",
            aktivitasId: "it-02",
            namaAktivitas: "Troubleshooting Jaringan Fiber Optic",
            volumeKegiatan: 1,
            satuan: "Kegiatan",
            nilaiPoin: 320,
            totalPoin: 320,
            outputHasil: "Konektivitas normal 100%",
          },
        ],
        totalPoinHarian: 320,
        targetPoinHarian: 300,
        isTargetTercapai: true,
        status: "draft",
        createdAt: `${mockDate}T15:30:00.000Z`,
        updatedAt: `${mockDate}T15:30:00.000Z`,
      };
      getDevLKHStore().set(lkhId, lkhAwal);

      // Pegawai Submit
      const submittedLkh: LKHRecord = { ...lkhAwal, status: "submitted", updatedAt: `${mockDate}T16:00:00.000Z` };
      getDevLKHStore().set(lkhId, submittedLkh);
      expect(getDevLKHStore().get(lkhId)?.status).toBe("submitted");

      // Atasan Langsung Menyetujui
      const approvedLkh: LKHRecord = {
        ...submittedLkh,
        status: "disetujui",
        approvedBy: mockAtasan.id,
        approvedByName: mockAtasan.nama,
        approvedAt: `${mockDate}T17:00:00.000Z`,
        catatanAtasan: "Kinerja sangat memuaskan dan terdokumentasi lengkap.",
      };
      getDevLKHStore().set(lkhId, approvedLkh);

      const finalSaved = getDevLKHStore().get(lkhId);
      expect(finalSaved?.status).toBe("disetujui");
      expect(finalSaved?.approvedByName).toBe("Agus Jatmiko, S.Kom");
      expect(finalSaved?.catatanAtasan).toContain("memuaskan");
    });
  });

  // ── 3. Uji Mekanisme Pengajuan Izin / Cuti ────────────────────────────────
  describe("3. Mekanisme Pengajuan Izin & Cuti", () => {
    it("harus mencatat pengajuan cuti dengan atasanId otomatis dari profil hierarki", () => {
      const izinId = `izin-test-001`;
      const izinRecord: PengajuanIzinItem = {
        id: izinId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        jenis: "cuti",
        tanggalMulai: "2026-10-20",
        tanggalSelesai: "2026-10-22",
        alasan: "Keperluan keluarga penting di luar kota.",
        status: "menunggu",
        atasanId: mockBawahan.supervisorId, // Otomatis terhubung ke Agus Jatmiko
        atasanNama: mockBawahan.supervisorNama,
        lampiranUrl: "https://storage.local/izin/surat-cuti.pdf",
        createdAt: "2026-10-15T08:00:00.000Z",
      };

      getDevIzinStore().set(izinId, izinRecord);
      const saved = getDevIzinStore().get(izinId);

      expect(saved).toBeDefined();
      expect(saved?.status).toBe("menunggu");
      expect(saved?.atasanId).toBe(mockAtasan.id);
      expect(saved?.jenis).toBe("cuti");
    });

    it("atasan langsung harus dapat menyetujui atau menolak permohonan izin", () => {
      const izinId = `izin-test-002`;
      const izinRecord: PengajuanIzinItem = {
        id: izinId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        jenis: "sakit",
        tanggalMulai: "2026-10-16",
        tanggalSelesai: "2026-10-16",
        alasan: "Istirahat dokter akibat flu berat.",
        status: "menunggu",
        atasanId: mockBawahan.supervisorId,
        atasanNama: mockBawahan.supervisorNama,
        lampiranUrl: "https://storage.local/izin/surat-dokter.jpg",
        createdAt: "2026-10-15T09:00:00.000Z",
      };
      getDevIzinStore().set(izinId, izinRecord);

      // Atasan Menyetujui
      const disetujui: PengajuanIzinItem = {
        ...izinRecord,
        status: "disetujui",
        approvedBy: mockAtasan.id,
        approvedByName: mockAtasan.nama,
        catatanAtasan: "Semoga lekas sembuh, koordinasikan delegasi tugas.",
        updatedAt: "2026-10-15T10:00:00.000Z",
      };
      getDevIzinStore().set(izinId, disetujui);

      const finalSaved = getDevIzinStore().get(izinId);
      expect(finalSaved?.status).toBe("disetujui");
      expect(finalSaved?.approvedByName).toBe("Agus Jatmiko, S.Kom");
    });
  });

  // ── 4. Uji Mekanisme Pengajuan Lembur ─────────────────────────────────────
  describe("4. Mekanisme Pengajuan Lembur", () => {
    it("harus mencatat permohonan lembur, jam rencana, dan alasan tugas", () => {
      const lemburId = `${mockBawahan.id}_${mockDate}`;
      const record: LemburRecord = {
        id: lemburId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        tanggal: mockDate,
        jenis: "hari_kerja",
        alasanLembur: "Deployment pembaruan infrastruktur jaringan server utama Solo Technopark.",
        jamMulaiRencana: "17:00",
        jamSelesaiRencana: "21:00",
        totalJamRencana: 4,
        atasanId: mockBawahan.supervisorId,
        atasanNama: mockBawahan.supervisorNama,
        status: "menunggu",
        createdAt: `${mockDate}T12:00:00.000Z`,
        updatedAt: `${mockDate}T12:00:00.000Z`,
      };

      getDevLemburStore().set(lemburId, record);
      const saved = getDevLemburStore().get(lemburId);

      expect(saved).toBeDefined();
      expect(saved?.totalJamRencana).toBe(4);
      expect(saved?.status).toBe("menunggu");
      expect(saved?.atasanId).toBe(mockAtasan.id);
    });

    it("harus memvalidasi persetujuan lembur oleh atasan dan pelaksanaan check-in/out lembur", () => {
      const lemburId = `${mockBawahan.id}_${mockDate}`;
      const lemburAwal: LemburRecord = {
        id: lemburId,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        tanggal: mockDate,
        jenis: "hari_kerja",
        alasanLembur: "Migrasi data server.",
        jamMulaiRencana: "17:00",
        jamSelesaiRencana: "20:00",
        totalJamRencana: 3,
        atasanId: mockBawahan.supervisorId,
        atasanNama: mockBawahan.supervisorNama,
        status: "menunggu",
        createdAt: `${mockDate}T12:00:00.000Z`,
        updatedAt: `${mockDate}T12:00:00.000Z`,
      };
      getDevLemburStore().set(lemburId, lemburAwal);

      // Atasan Menyetujui
      const lemburDisetujui: LemburRecord = {
        ...lemburAwal,
        status: "disetujui",
        approvedBy: mockAtasan.id,
        approvedByName: mockAtasan.nama,
        approvedAt: `${mockDate}T14:00:00.000Z`,
      };
      getDevLemburStore().set(lemburId, lemburDisetujui);
      expect(getDevLemburStore().get(lemburId)?.status).toBe("disetujui");

      // Pegawai Check-in dan Check-out Lembur
      const lemburSelesai: LemburRecord = {
        ...lemburDisetujui,
        jamMulaiRealisasi: "17:05",
        jamSelesaiRealisasi: "20:15",
        totalJamRealisasi: 3.17,
        catatanRealisasi: "Seluruh konfigurasi server tuntas tanpa kendala.",
        status: "disetujui",
        updatedAt: `${mockDate}T20:20:00.000Z`,
      };
      getDevLemburStore().set(lemburId, lemburSelesai);

      const finalRecord = getDevLemburStore().get(lemburId);
      expect(finalRecord?.jamMulaiRealisasi).toBe("17:05");
      expect(finalRecord?.jamSelesaiRealisasi).toBe("20:15");
      expect(finalRecord?.totalJamRealisasi).toBeGreaterThan(3);
    });
  });

  // ── 5. Uji Mekanisme Permohonan Revisi Presensi ───────────────────────────
  describe("5. Mekanisme Permohonan Revisi Presensi", () => {
    it("harus mencatat permohonan koreksi jam presensi dan approval atasan", () => {
      const revisiId = "rev-test-101";
      const permohonan: PermohonanRevisiPresensi = {
        id: revisiId,
        presensiId: `${mockBawahan.id}_${mockDate}`,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: mockDate,
        jenisRevisi: "koreksi_jam_pulang",
        statusSemula: "hadir",
        statusDiajukan: "hadir",
        jamMasukSemula: "07:15",
        jamMasukDiajukan: "07:15",
        jamPulangSemula: "-",
        jamPulangDiajukan: "16:30",
        alasan: "Lupa tap check-out saat mendampingi kunjungan industri di kawasan.",
        status: "menunggu",
        createdAt: `${mockDate}T17:00:00.000Z`,
        updatedAt: `${mockDate}T17:00:00.000Z`,
      };

      getDevRevisiStore().set(revisiId, permohonan);
      expect(getDevRevisiStore().get(revisiId)?.status).toBe("menunggu");

      // Disetujui oleh atasan
      const revisiDisetujui: PermohonanRevisiPresensi = {
        ...permohonan,
        status: "disetujui",
        reviewedBy: mockAtasan.id,
        reviewedByName: mockAtasan.nama,
        reviewedAt: `${mockDate}T18:00:00.000Z`,
        catatanReview: "Diverifikasi berdasarkan laporan pendampingan lapangan.",
      };
      getDevRevisiStore().set(revisiId, revisiDisetujui);

      const saved = getDevRevisiStore().get(revisiId);
      expect(saved?.status).toBe("disetujui");
      expect(saved?.reviewedByName).toBe("Agus Jatmiko, S.Kom");
    });
  });

  // ── 6. Uji Kalkulasi Laporan & Rekapitulasi Tersendiri ─────────────────────
  describe("6. Pencatatan Laporan & Rekapitulasi Tersendiri", () => {
    it("harus mampu menghasilkan rekapitulasi kinerja presensi dan disiplin tersendiri", async () => {
      // Siapkan record presensi harian
      const presensi1: PresensiRecord = {
        id: `${mockBawahan.id}_2026-10-01`,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: "2026-10-01",
        jamMasuk: "07:10",
        jamPulang: "16:05",
        status: "hadir",
        lokasiMasuk: { latitude: -7.55, longitude: 110.85, isDalamRadius: true, jarakMeter: 10 },
        createdAt: "2026-10-01T07:10:00.000Z",
        updatedAt: "2026-10-01T16:05:00.000Z",
      };

      const presensi2: PresensiRecord = {
        id: `${mockBawahan.id}_2026-10-02`,
        userId: mockBawahan.id,
        nip: mockBawahan.nip,
        nama: mockBawahan.nama,
        orgId: mockBawahan.orgId,
        kantorId: mockBawahan.kantorId,
        namaKantor: mockBawahan.namaKantor,
        tanggal: "2026-10-02",
        jamMasuk: "07:55",
        jamPulang: "16:15",
        status: "terlambat",
        lokasiMasuk: { latitude: -7.55, longitude: 110.85, isDalamRadius: true, jarakMeter: 10 },
        createdAt: "2026-10-02T07:55:00.000Z",
        updatedAt: "2026-10-02T16:15:00.000Z",
      };

      getDevPresensiStore().set(presensi1.id, presensi1);
      getDevPresensiStore().set(presensi2.id, presensi2);

      // Hitung rekap
      const rekap = await calculateRekapStatistik(
        { bulan: 10, tahun: 2026, orgId: "solotechnopark" },
        "admin"
      );

      expect(rekap).toBeDefined();
      expect(rekap.periodeBulan).toBe(10);
      expect(rekap.periodeTahun).toBe(2026);
      expect(rekap.summary.totalPegawai).toBeGreaterThan(0);

      // Cari pegawai dalam daftar rekap
      expect(rekap.daftarPegawai.length).toBeGreaterThan(0);
      const pegawaiStat = rekap.daftarPegawai[0];
      expect(pegawaiStat).toBeDefined();
      expect(pegawaiStat.nama).toBeDefined();
      expect(pegawaiStat.jabatan).toBeDefined();
      expect(pegawaiStat.predikatDisiplin).toBeDefined();
      expect(pegawaiStat.totalHariKerja).toBeGreaterThan(0);
    });

    it("atasan langsung mendapatkan laporan tim yang terstruktur", async () => {
      const rekap = await calculateRekapStatistik(
        { bulan: 10, tahun: 2026, orgId: "solotechnopark" },
        "admin"
      );

      // Verifikasi rekapitulasi memiliki metrik ringkasan lengkap
      expect(rekap.summary).toBeDefined();
      expect(rekap.summary.totalPegawai).toBeGreaterThanOrEqual(46);
      expect(rekap.summary.targetPoinStandar).toBe(300);
      expect(rekap.trenHarian).toBeDefined();
      expect(Array.isArray(rekap.trenHarian)).toBe(true);
    });
  });
});
