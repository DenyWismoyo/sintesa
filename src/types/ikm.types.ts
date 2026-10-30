// src/types/ikm.types.ts
import { z } from 'zod';

export const IkmServiceTypeEnum = z.enum([
  'SEWA_FASILITAS',
  'JASA_PRODUKSI',
  'PELATIHAN_LMS',
  'INKUBASI_TENANT',
  'EVENT_SEMINAR',
  'LAYANAN_UMUM',
]);
export type IkmServiceType = z.infer<typeof IkmServiceTypeEnum>;

export const IKM_SERVICE_LABELS: Record<IkmServiceType, string> = {
  SEWA_FASILITAS: 'Sewa Fasilitas & Venue',
  JASA_PRODUKSI: 'Jasa Manufaktur & Lab Presisi',
  PELATIHAN_LMS: 'Pelatihan & Uji Kompetensi',
  INKUBASI_TENANT: 'Inkubasi & Akselerasi Bisnis',
  EVENT_SEMINAR: 'Event & MICE Ekosistem',
  LAYANAN_UMUM: 'Pelayanan Publik & Informasi',
};

// 9 Unsur Pelayanan menurut PermenPAN-RB No. 14/2017 (Skala 1 - 4)
export const IkmScoreSchema = z.object({
  u1_persyaratan: z.number().min(1).max(4),     // Kemudahan persyaratan pelayanan
  u2_prosedur: z.number().min(1).max(4),        // Kemudahan sistem, mekanisme, prosedur
  u3_waktu: z.number().min(1).max(4),           // Kecepatan waktu penyelesaian pelayanan
  u4_biaya: z.number().min(1).max(4),           // Kewajaran biaya/tarif pelayanan
  u5_produk: z.number().min(1).max(4),          // Kesesuaian hasil spesifikasi layanan
  u6_kompetensi: z.number().min(1).max(4),      // Kemampuan & ketrampilan petugas pelaksana
  u7_perilaku: z.number().min(1).max(4),        // Kesopanan, keramahan & responsif petugas
  u8_sarana: z.number().min(1).max(4),          // Kualitas sarana dan prasarana/fasilitas
  u9_pengaduan: z.number().min(1).max(4),       // Kecepatan dan penanganan aduan/keluhan
});
export type IkmScore = z.infer<typeof IkmScoreSchema>;

export const IkmSurveySchema = z.object({
  id: z.string().optional(),
  serviceType: IkmServiceTypeEnum,
  serviceReferenceId: z.string().optional(), // ID Booking / Order / Invoice / Event
  respondentName: z.string().min(2, 'Nama responden wajib diisi'),
  respondentEmail: z.string().optional(),
  respondentPhone: z.string().optional(),
  respondentAgency: z.string().optional(), // Instansi / Startup / Pribadi
  scores: IkmScoreSchema,
  averageScore: z.number(), // 1.00 - 4.00
  convertedScore: z.number(), // Nilai konversi (averageScore * 25) -> 25 - 100
  grade: z.enum(['A', 'B', 'C', 'D']), // A = Sangat Baik, B = Baik, C = Kurang Baik, D = Buruk
  feedback: z.string().optional(),
  createdAt: z.number().optional(),
});
export type IkmSurvey = z.infer<typeof IkmSurveySchema>;

export interface IkmStats {
  totalRespondents: number;
  overallAverageScore: number;
  convertedScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  averageScores: Record<string, number>;
}


