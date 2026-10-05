// src/lib/presensi/validations.ts
import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(3, "Identifier (NIP/Email/Access Code) minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const CheckInSchema = z.object({
  userId: z.string().min(1, "User ID wajib ada"),
  nip: z.string().min(1, "NIP / Access Code wajib ada"),
  nama: z.string().min(1, "Nama wajib ada"),
  orgId: z.string().min(1, "Org ID wajib ada"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  shiftId: z.string().optional(),
  kantorId: z.string().optional(),
  namaKantor: z.string().optional(),
  jarakMeter: z.number().optional(),
  koordinat: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  fotoUrl: z.string().url("Format URL swafoto tidak valid"),
  isValidLocation: z.boolean(),
  alamat: z.string().optional(),
  catatan: z.string().optional(),
  gpsAccuracyMeter: z.number().optional(),
  isMockDetected: z.boolean().optional(),
});

export const CheckOutSchema = z.object({
  userId: z.string().min(1, "User ID wajib ada"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  shiftId: z.string().optional(),
  kantorId: z.string().optional(),
  namaKantor: z.string().optional(),
  jarakMeter: z.number().optional(),
  koordinat: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  fotoUrl: z.string().url("Format URL swafoto tidak valid"),
  isValidLocation: z.boolean(),
  alamat: z.string().optional(),
  catatan: z.string().optional(),
  gpsAccuracyMeter: z.number().optional(),
  isMockDetected: z.boolean().optional(),
});

export const CreatePegawaiSchema = z.object({
  nip: z.string().min(3, "NIP atau Kode Pegawai minimal 3 karakter"),
  nama: z.string().min(3, "Nama lengkap pegawai wajib diisi minimal 3 karakter"),
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi awal minimal 6 karakter").optional(),
  role: z.enum(["admin", "atasan", "pegawai"]),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  golongan: z.string().min(1, "Golongan / Kategori wajib diisi"),
  instansi: z.string().optional(),
  orgId: z.string().optional(),
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  kantorId: z.string().min(1, "Kantor wajib diisi"),
  namaKantor: z.string().min(1, "Nama Kantor wajib diisi"),
  atasanId: z.string().optional(),
  atasanNama: z.string().optional(),
  nomorHp: z.string().optional(),
});

export const JenisRevisiPresensiSchema = z.enum([
  "koreksi_jam_masuk",
  "koreksi_jam_pulang",
  "koreksi_status",
  "presensi_susulan",
]);

export const AjukanRevisiPresensiSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  jenisRevisi: JenisRevisiPresensiSchema,
  statusSemula: z.string().min(1, "Status semula wajib dipilih"),
  statusDiajukan: z.string().min(1, "Status yang diajukan wajib dipilih"),
  jamMasukSemula: z.string().optional(),
  jamMasukDiajukan: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam masuk harus HH:MM (contoh: 07:30)")
    .optional()
    .or(z.literal("")),
  jamPulangSemula: z.string().optional(),
  jamPulangDiajukan: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam pulang harus HH:MM (contoh: 16:30)")
    .optional()
    .or(z.literal("")),
  alasan: z
    .string()
    .min(10, "Alasan permohonan revisi minimal 10 karakter")
    .max(500, "Alasan permohonan revisi maksimal 500 karakter"),
  lampiranUrl: z
    .string()
    .url("Format URL lampiran tidak valid")
    .optional()
    .or(z.literal("")),
});
