// src/types/presensi.ts
import { z } from "zod";

export type UserRole = "admin" | "atasan" | "pegawai";

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
  atasanId?: string;
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
  googleEmail?: string;
  isLinkedGoogle?: boolean;
  linkedGoogleUid?: string;
  linkedGoogleEmail?: string;
  linkedAt?: string;
}

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
  status: StatusRevisiPresensi;
  catatanReview?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}



