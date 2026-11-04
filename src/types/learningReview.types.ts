// Lokasi file: src/types/learningReview.types.ts
import { z } from 'zod';

export const ReviewAspectSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  weight: z.number().default(1),
});
export type ReviewAspect = z.infer<typeof ReviewAspectSchema>;

export const ReviewerRoleEnum = z.enum([
  'PESERTA',   // Peserta / Siswa Pelatihan
  'MENTOR',    // Instruktur / Mentor / Penguji
  'PUBLIK',    // Masyarakat Umum / Pengamat Vokasi
  'INDUSTRI',  // Perwakilan Industri Mitra / Perusahaan Rekruter
]);
export type ReviewerRole = z.infer<typeof ReviewerRoleEnum>;

export const REVIEWER_ROLE_LABELS: Record<ReviewerRole, string> = {
  PESERTA: 'Peserta Pelatihan / Alumni',
  MENTOR: 'Instruktur / Mentor / Penguji',
  PUBLIK: 'Masyarakat Umum / Pemerhati',
  INDUSTRI: 'Mitra Industri / Perusahaan',
};

export const REVIEWER_ROLE_BADGES: Record<ReviewerRole, string> = {
  PESERTA: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  MENTOR: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  PUBLIK: 'bg-amber-50 text-amber-800 border-amber-200',
  INDUSTRI: 'bg-purple-50 text-purple-800 border-purple-200',
};

export const ReviewStatusEnum = z.enum([
  'PUBLISHED',
  'PENDING',
  'REJECTED',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

export const TrainingReviewProgramSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  category: z.string().default('Manufaktur & Vokasi'),
  batch: z.string().default('Batch II'),
  year: z.string().default('2026'),
  organizer: z.string().default('Solo Technopark'),
  partnerInstitution: z.string().optional(),
  targetAudience: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).default('ACTIVE'),
  allowPublicReview: z.boolean().default(true),
  aspects: z.array(ReviewAspectSchema).default([
    { id: 'kurikulum', label: 'Kurikulum & Materi', description: 'Kesesuaian silabus dengan standar industri', weight: 1 },
    { id: 'instruktur', label: 'Instruktur & Pengajar', description: 'Kompetensi dan metode penyampaian instruktur', weight: 1 },
    { id: 'fasilitas', label: 'Fasilitas & Alat Praktik', description: 'Kelengkapan bengkel kerja dan alat keselamatan (K3)', weight: 1 },
    { id: 'kesiapan_kerja', label: 'Relevansi & Kesiapan Kerja', description: 'Peluang dan kesiapan penempatan kerja nyata', weight: 1 },
  ]),
  stats: z.object({
    averageRating: z.number().default(0),
    totalReviews: z.number().default(0),
    aspectScores: z.record(z.string(), z.number()).default({}),
    ratingCounts: z.record(z.string(), z.number()).default({ '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }),
  }).default({
    averageRating: 0,
    totalReviews: 0,
    aspectScores: {},
    ratingCounts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
  }),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});
export type TrainingReviewProgram = z.infer<typeof TrainingReviewProgramSchema>;

export const TrainingReviewItemSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  programTitle: z.string(),
  reviewerName: z.string().min(2, 'Nama minimal 2 karakter'),
  reviewerRole: ReviewerRoleEnum.default('PESERTA'),
  reviewerRoleCustom: z.string().optional(),
  reviewerEmail: z.string().optional(),
  reviewerInstitution: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  aspectRatings: z.record(z.string(), z.number()).default({}),
  headline: z.string().min(3, 'Judul ulasan minimal 3 karakter'),
  feedback: z.string().min(10, 'Ulasan minimal 10 karakter'),
  suggestions: z.string().optional(),
  isRecommended: z.boolean().default(true),
  status: ReviewStatusEnum.default('PUBLISHED'),
  adminResponse: z.string().optional(),
  adminResponseAt: z.number().optional(),
  likesCount: z.number().default(0),
  createdAt: z.number().default(() => Date.now()),
});
export type TrainingReviewItem = z.infer<typeof TrainingReviewItemSchema>;

