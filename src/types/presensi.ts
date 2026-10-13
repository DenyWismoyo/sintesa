// src/types/presensi.ts
import { z } from "zod";

/**
 * Role sistem: "admin" = Admin Presensi (akses manajemen penuh),
 * "pegawai" = Semua pegawai operasional (termasuk pimpinan).
 * Hierarki kewenangan kini ditentukan oleh rankLevel (1-10) dan supervisorId,
 * bukan role. Role "atasan" telah dihapus.
 */
export type UserRole = "admin" | "pegawai";

export type PresensiStatus =
  | "hadir"
  | "terlambat"
  | "izin"
  | "sakit"
  | "cuti"
  | "dinas"
  | "alpa"
  | "libur"
  | "lembur";

export type LKHStatus = "draft" | "submitted" | "approved" | "rejected";

export type LemburStatus =
  | "draft"
  | "diajukan"
  | "disetujui"
  | "ditolak"
  | "selesai";

export type LemburJenis = "hari_kerja" | "hari_libur" | "hari_raya";

export interface UserProfile {
  id: string;
  nip: string;
  accessCode?: string; // Alternatif login non-PNS (e.g. STP-22757)
  nama: string;
  email: string;
  role: UserRole;
  jabatan: string;
  golongan: string; // misal: BLUD, Staf, Kepala Divisi
  instansi: string; // UPTD KST Solo Technopark
  departmentId: string;
  departmentName: string;

  /**
   * Level hierarki numerik pegawai (1=Pemimpin BLUD, 10=Magang/Honorer).
   * Digunakan sebagai pengganti role-based hierarchy untuk approval.
   * Skema: 1=Pemimpin BLUD, 2=Pejabat Teknis, 3=Manager,
   *        4=Kepala Divisi, 5-6=Instruktur Senior, 7-8=Instruktur/Staf Senior,
   *        9=Staf/Operator, 10=Magang/Honorer.
   */
  /** ID master jabatan yang dipilih (referensi ke MasterJabatan) */
  jabatanId?: string;

  /**
   * Level hierarki numerik pegawai (1=Pemimpin BLUD, 10=Magang/Honorer).
   * Digunakan sebagai pengganti role-based hierarchy untuk approval.
   * Nilai ini otomatis disinkronisasi dari MasterJabatan yang dipilih,
   * atau bisa disesuaikan secara manual oleh Admin.
   */
  rankLevel?: number;

  /**
   * ID atasan langsung pegawai ini. Diset oleh Admin melalui panel manajemen pegawai.
   * Approval izin/lembur/revisi/LKH hanya bisa dilakukan oleh supervisorId ini atau admin.
   */
  supervisorId?: string;
  supervisorNama?: string;

  /** @deprecated Gunakan supervisorId. Dipertahankan untuk backward compat data Firestore lama. */
  atasanId?: string;
  /** @deprecated Gunakan supervisorNama. Dipertahankan untuk backward compat. */
  atasanNama?: string;

  fotoUrl?: string;
  orgId: string;
  nomorHp?: string;
  kantorId?: string;
  namaKantor?: string;
  allowedKantorIds?: string[];
  storageUsedBytes: number;
  storageLimitBytes: number;
  createdAt?: string;
  canAccessCatalogAdmin?: boolean;
  catalogRole?: string;
  googleEmail?: string;
  isLinkedGoogle?: boolean;
  linkedGoogleUid?: string;
  linkedGoogleEmail?: string;
  linkedAt?: string;
}

/**
 * Master Data Jabatan & Hierarki Dinamis.
 * Level menentukan derajat kewenangan (1=Tertinggi/Pimpinan Puncak, angka lebih besar = tingkatan di bawahnya).
 * Tidak di-hardcode ke angka kaku 1-10; admin bebas menambah jabatan dan menentukan levelnya.
 */
export interface MasterJabatan {
  id: string;
  namaJabatan: string;
  /** Angka level hierarki (1=Tertinggi, makin kecil makin tinggi kewenangannya) */
  level: number;
  /** ID jabatan atasan langsung dalam organogram pohon hierarki */
  parentJabatanId?: string | null;
  /** Nama jabatan atasan langsung (denormalisasi untuk display cepat) */
  parentJabatanNama?: string | null;
  /** Subdivisi atau unit kerja default yang terkait dengan jabatan ini */
  departemen?: string;
  /** Klasifikasi birokrasi / jenis jabatan */
  tipeJabatan?: "struktural" | "fungsional" | "pelaksana";
  /** Status operasional jabatan */
  status: "aktif" | "nonaktif";
  /** Keterangan atau uraian tugas ringkas */
  keterangan?: string;
  orgId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LevelHierarkiItem {
  level: number;
  label: string;
  short: string;
}

export const DAFTAR_LEVEL_HIERARKI: LevelHierarkiItem[] = [
  { level: 1, label: "Level 1 — Pemimpin BLUD / Direktur Eksekutif", short: "Pemimpin BLUD" },
  { level: 2, label: "Level 2 — Pejabat Keuangan & Teknis", short: "Pejabat Teknis" },
  { level: 3, label: "Level 3 — Manager Operasional", short: "Manager" },
  { level: 4, label: "Level 4 — Kepala Divisi / Unit", short: "Kepala Divisi" },
  { level: 5, label: "Level 5 — Instruktur Senior / Koordinator", short: "Instruktur Senior" },
  { level: 6, label: "Level 6 — Instruktur Ahli", short: "Instruktur Ahli" },
  { level: 7, label: "Level 7 — Instruktur Muda", short: "Instruktur Muda" },
  { level: 8, label: "Level 8 — Staf Senior", short: "Staf Senior" },
  { level: 9, label: "Level 9 — Staf Pelaksana / Operator", short: "Staf Pelaksana" },
  { level: 10, label: "Level 10 — Magang / Tenaga Teknis Lepas", short: "Magang / Lepas" },
];

export type KategoriKantor =
  | "Pusat"
  | "OPD / Dinas"
  | "Kecamatan"
  | "Kelurahan"
  | "UPTD"
  | "Puskesmas"
  | "Kawasan Khusus";

export interface GeolocationPoint {
  lat: number;
  lng: number;
}

export interface KantorUnit {
  id: string;
  kodeKantor: string;
  namaKantor: string;
  kategori: KategoriKantor;
  alamat: string;
  koordinat: GeolocationPoint;
  radiusMeter: number;
  jamMasukMaksimal?: string;
  jamPulangMinimal?: string;
  orgId: string;
  isActive: boolean;
  geofenceType?: "radius" | "polygon";
  polygonCoordinates?: GeolocationPoint[];
}

export interface UploadedFileMetadata {
  id: string;
  userId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  kegiatanId?: string;
  kegiatanDeskripsi?: string;
  type: "foto" | "dokumen";
}

export interface PresensiCheckPoint {
  waktu: string; // ISO string
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  serverVerifiedDistanceMeter?: number;
  alamat?: string;
  catatan?: string;
  ipAddress?: string;
  userAgent?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
  isSuspiciousTravel?: boolean;
}

export interface PresensiRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // Format: YYYY-MM-DD
  shiftId?: string;
  kantorId?: string;
  namaKantor?: string;
  checkIn?: PresensiCheckPoint;
  checkOut?: PresensiCheckPoint;
  status: PresensiStatus;
  durasiKerjaMenit?: number;
  keterangan?: string;
  suratIzinUrl?: string;
  izinId?: string;
  lemburRecordId?: string;
  isRevisi?: boolean;
  revisiId?: string;
  revisiNote?: string;
  revisiBy?: string;
  revisiAt?: string;
}

export interface LKHItem {
  id: string;
  aktivitasId?: number; // Referensi 152 Master Aktivitas
  kategoriAktivitas?: string;
  namaAktivitasBaku?: string;
  deskripsi: string;
  outputKegiatan: string;
  volumeKegiatan: number;
  satuanKegiatan: string;
  jamMulai: string; // '08:00'
  jamSelesai: string; // '10:00'
  nilaiPoin: number;
  totalPoin: number;
  lampiranFotoUrls?: string[];
  lampiranDokumenUrls?: string[];
}

export interface LKHRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // Format: YYYY-MM-DD
  atasanId?: string;
  atasanNama?: string;
  kegiatan: LKHItem[];
  totalPoinHarian: number;
  targetPoinHarian: number;
  isTargetTercapai: boolean;
  status: LKHStatus;
  catatanPegawai?: string;
  catatanAtasan?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PengajuanIzinItem {
  id: string;
  userId: string;
  nama: string;
  nip: string;
  orgId: string;
  atasanId: string;
  jenis: "Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar";
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  dokumenUrl?: string;
  dokumenNama?: string;
  status: "menunggu" | "disetujui" | "ditolak";
  createdAt: string;
}

export interface LemburRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  jenis: LemburJenis;
  alasanLembur: string;
  jamMulaiRencana: string;
  jamSelesaiRencana: string;
  atasanId: string;
  atasanNama: string;
  status: LemburStatus;
  checkInLembur?: PresensiCheckPoint;
  checkOutLembur?: PresensiCheckPoint;
  durasiLemburMenit?: number;
  suratPerintahLemburUrl?: string;
  catatanAtasan?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  presensiRecordId?: string;
}

export interface CheckInPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  shiftId?: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface CheckOutPayload {
  userId: string;
  tanggal: string;
  shiftId?: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface PengajuanLemburPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  jenis: LemburJenis;
  alasanLembur: string;
  jamMulaiRencana: string;
  jamSelesaiRencana: string;
  atasanId: string;
  atasanNama: string;
  suratPerintahLemburUrl?: string;
}

export interface CheckInLemburPayload {
  userId: string;
  tanggal: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface CheckOutLemburPayload {
  userId: string;
  tanggal: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  logoUrl?: string;
  themeColor?: string;
  defaultJamMasukMaksimal: string;
  defaultJamPulangMinimal: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export type JenisRevisiPresensi =
  | "koreksi_jam_masuk"
  | "koreksi_jam_pulang"
  | "koreksi_status"
  | "presensi_susulan";

export type StatusRevisiPresensi = "menunggu" | "disetujui" | "ditolak";

export interface PermohonanRevisiPresensi {
  id: string;
  presensiId?: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  kantorId?: string;
  namaKantor?: string;
  tanggal: string; // YYYY-MM-DD
  jenisRevisi: JenisRevisiPresensi;
  statusSemula: PresensiStatus | "belum_absen";
  statusDiajukan: PresensiStatus;
  jamMasukSemula?: string;
  jamMasukDiajukan?: string;
  jamPulangSemula?: string;
  jamPulangDiajukan?: string;
  alasan: string;
  lampiranUrl?: string;
  supervisorId?: string;
  atasanId?: string;
  status: StatusRevisiPresensi;
  catatanReview?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}



