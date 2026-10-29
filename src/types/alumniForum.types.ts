// src/types/alumniForum.types.ts
import { z } from 'zod';
import { AlumniOriginSourceEnum } from './ecosystem.types';

export const ForumZoneEnum = z.enum([
  'ZONE_A_ALUMNI_ONLY',
  'ZONE_B_INDUSTRY_BRIDGE',
]);
export type ForumZone = z.infer<typeof ForumZoneEnum>;

export const ForumThreadKindEnum = z.enum([
  'DISCUSSION',
  'JOB_SPOTLIGHT',
  'MICRO_PROJECT',
  'EVENT_AMA',
  'CV_REVIEW',
  'ALUMNI_REFERRAL',
]);
export type ForumThreadKind = z.infer<typeof ForumThreadKindEnum>;

export const ForumActorTypeEnum = z.enum([
  'ALUMNI_STP',
  'ALUMNI_RSKB',
  'PARTNER_INDUSTRI',
  'TENANT_STP',
  'ADMIN_MENTOR',
]);
export type ForumActorType = z.infer<typeof ForumActorTypeEnum>;

export const VocationalTrackEnum = z.enum([
  'Semua Kejuruan',
  'IT & Perangkat Lunak',
  'AI, Data & Cyber Security',
  'Manufaktur CNC & Mekanik',
  'Pengelasan (Welder) & Fabrikasi',
  'Multimedia, Desain & Animasi 3D',
  'Bisnis Digital & Wirausaha RSKB',
]);
export type VocationalTrack = z.infer<typeof VocationalTrackEnum>;

export const VOCATIONAL_TRACKS: VocationalTrack[] = [
  'Semua Kejuruan',
  'IT & Perangkat Lunak',
  'AI, Data & Cyber Security',
  'Manufaktur CNC & Mekanik',
  'Pengelasan (Welder) & Fabrikasi',
  'Multimedia, Desain & Animasi 3D',
  'Bisnis Digital & Wirausaha RSKB',
];

export interface ForumChannelDefinition {
  id: string;
  slug: string;
  name: string;
  shortLabel: string;
  description: string;
  zone: ForumZone;
  defaultThreadKind: ForumThreadKind;
  sortOrder: number;
}

export const DEFAULT_FORUM_CHANNELS: ForumChannelDefinition[] = [
  // ZONA A: RUANG INTERNAL KHUSUS ALUMNI (TERTUTUP DARI MITRA & TENANT)
  {
    id: 'papan-resmi-stp-rskb',
    slug: 'papan-resmi-stp-rskb',
    name: '#papan-resmi-stp-rskb',
    shortLabel: 'Papan Resmi STP & RSKB',
    description: 'Pengumuman resmi, jadwal walk-in interview tertutup, dan panggilan penyaluran kerja prioritas.',
    zone: 'ZONE_A_ALUMNI_ONLY',
    defaultThreadKind: 'DISCUSSION',
    sortOrder: 1,
  },
  {
    id: 'loker-referral-alumni',
    slug: 'loker-referral-alumni',
    name: '#loker-referral-alumni',
    shortLabel: 'Loker Referral Alumni',
    description: 'Info lowongan orang dalam (internal hiring) dari alumni senior yang sudah bekerja di industri.',
    zone: 'ZONE_A_ALUMNI_ONLY',
    defaultThreadKind: 'ALUMNI_REFERRAL',
    sortOrder: 2,
  },
  {
    id: 'klinik-cv-dan-wawancara',
    slug: 'klinik-cv-dan-wawancara',
    name: '#klinik-cv-dan-wawancara',
    shortLabel: 'Klinik CV & Wawancara',
    description: 'Ruang aman sesama alumni untuk bedah CV, diskusi kisaran gaji, dan kisi-kisi tes teknikal.',
    zone: 'ZONE_A_ALUMNI_ONLY',
    defaultThreadKind: 'CV_REVIEW',
    sortOrder: 3,
  },
  {
    id: 'jejak-sukses-dan-perantauan',
    slug: 'jejak-sukses-dan-perantauan',
    name: '#jejak-sukses-dan-perantauan',
    shortLabel: 'Jejak Sukses & Rantau',
    description: 'Kisah inspiratif alumni, jejaring perantauan kawasan industri, dan solidaritas angkatan.',
    zone: 'ZONE_A_ALUMNI_ONLY',
    defaultThreadKind: 'DISCUSSION',
    sortOrder: 4,
  },

  // ZONA B: RUANG JEMBATAN INDUSTRI x ALUMNI (MITRA RESMI & STARTUP TENANT TERLIBAT)
  {
    id: 'sapa-industri-dan-rekrutmen',
    slug: 'sapa-industri-dan-rekrutmen',
    name: '#sapa-industri-dan-rekrutmen',
    shortLabel: 'Sapa Industri & AMA HRD',
    description: 'Tanya-jawab langsung bersama HRD Mitra Resmi dan diskusi seputar lowongan aktif Bursa Karir.',
    zone: 'ZONE_B_INDUSTRY_BRIDGE',
    defaultThreadKind: 'JOB_SPOTLIGHT',
    sortOrder: 5,
  },
  {
    id: 'bursa-proyek-dan-wirausaha',
    slug: 'bursa-proyek-dan-wirausaha',
    name: '#bursa-proyek-dan-wirausaha',
    shortLabel: 'Bursa Proyek & UMKM RSKB',
    description: 'Order proyek mikro/freelance dari Mitra & Startup Tenant serta kolaborasi usaha alumni RSKB.',
    zone: 'ZONE_B_INDUSTRY_BRIDGE',
    defaultThreadKind: 'MICRO_PROJECT',
    sortOrder: 6,
  },
  {
    id: 'ruang-kejuruan-dan-studi-kasus',
    slug: 'ruang-kejuruan-dan-studi-kasus',
    name: '#ruang-kejuruan-dan-studi-kasus',
    shortLabel: 'Ruang Kejuruan & Studi Kasus',
    description: 'Pemecahan masalah teknis (IT, CNC, AI, Las, Desain) yang memupuk poin reputasi kompetensi.',
    zone: 'ZONE_B_INDUSTRY_BRIDGE',
    defaultThreadKind: 'DISCUSSION',
    sortOrder: 7,
  },
];

// --- 4 JENIS SEMATAN INTERAKTIF (RICH ACTIONABLE EMBEDS - SPRINT 4) ---

export const ForumJobEmbedSchema = z.object({
  jobId: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  workType: z.string().default('Full-time'),
  salaryText: z.string().optional(),
});
export type ForumJobEmbed = z.infer<typeof ForumJobEmbedSchema>;

export const ForumPortfolioEmbedSchema = z.object({
  alumniId: z.string(),
  name: z.string(),
  programTaken: z.string().optional(),
  originSource: AlumniOriginSourceEnum.optional(),
  skills: z.array(z.string()).default([]),
  portfolioUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  reputationScore: z.number().default(0).optional(),
});
export type ForumPortfolioEmbed = z.infer<typeof ForumPortfolioEmbedSchema>;

export const ForumMicroProjectBriefSchema = z.object({
  budgetRange: z.string(),
  deadline: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  teamQuota: z.number().default(1),
  projectStatus: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']).default('OPEN'),
  applicantUids: z.array(z.string()).default([]),
});
export type ForumMicroProjectBrief = z.infer<typeof ForumMicroProjectBriefSchema>;

export const ForumEventAmaEmbedSchema = z.object({
  eventDate: z.string(),
  eventTime: z.string(),
  locationOrLink: z.string(),
  quota: z.number().default(50),
  rsvpUids: z.array(z.string()).default([]),
});
export type ForumEventAmaEmbed = z.infer<typeof ForumEventAmaEmbedSchema>;

// --- SKEMA UTAMA THREAD & BALASAN FORUM ---

export const ForumThreadSchema = z.object({
  id: z.string().optional(),
  channelId: z.string(),
  zone: ForumZoneEnum,
  threadKind: ForumThreadKindEnum.default('DISCUSSION'),
  vocationalTrack: z.string().default('Semua Kejuruan'),
  title: z.string().min(4, 'Judul topik minimal 4 karakter'),
  content: z.string().min(10, 'Isi diskusi minimal 10 karakter'),
  authorUid: z.string(),
  authorName: z.string(),
  authorActorType: ForumActorTypeEnum,
  authorBadgeLabel: z.string(),
  authorAvatarUrl: z.string().optional(),
  authorAlumniId: z.string().optional(),
  authorEntityId: z.string().optional(),

  // Rich Actionable Embeds
  jobEmbed: ForumJobEmbedSchema.optional(),
  portfolioEmbed: ForumPortfolioEmbedSchema.optional(),
  microProjectBrief: ForumMicroProjectBriefSchema.optional(),
  eventAmaEmbed: ForumEventAmaEmbedSchema.optional(),

  // Sinkronisasi 2 Arah Bursa Karir <-> Forum
  linkedJobId: z.string().optional(),
  promotedToJobId: z.string().optional(),

  // Interaksi & Reputasi
  upvotedByUids: z.array(z.string()).default([]),
  upvoteCount: z.number().default(0),
  replyCount: z.number().default(0),
  acceptedReplyId: z.string().optional(),
  isPinned: z.boolean().default(false),

  // Moderasi & Clario AI Safety (Sprint 5)
  moderationStatus: z.enum(['PUBLISHED', 'PENDING_REVIEW', 'FLAGGED']).default('PUBLISHED'),
  aiSafetyScore: z.number().default(100).optional(),
  aiFlagReason: z.string().optional(),
  reportedCount: z.number().default(0),

  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
export type ForumThread = z.infer<typeof ForumThreadSchema>;

export const ForumReplySchema = z.object({
  id: z.string().optional(),
  threadId: z.string(),
  zone: ForumZoneEnum,
  content: z.string().min(2, 'Balasan tidak boleh kosong'),
  authorUid: z.string(),
  authorName: z.string(),
  authorActorType: ForumActorTypeEnum,
  authorBadgeLabel: z.string(),
  authorAlumniId: z.string().optional(),
  portfolioEmbed: ForumPortfolioEmbedSchema.optional(),
  isAcceptedSolution: z.boolean().default(false),
  endorsedByMentor: z.boolean().default(false),
  upvotedByUids: z.array(z.string()).default([]),
  upvoteCount: z.number().default(0),
  moderationStatus: z.enum(['PUBLISHED', 'FLAGGED']).default('PUBLISHED'),
  aiFlagReason: z.string().optional(),
  createdAt: z.number(),
});
export type ForumReply = z.infer<typeof ForumReplySchema>;

// --- PELACAKAN LAMARAN KERJA CLOSED-LOOP (SPRINT 4) ---

export const JobApplicationStatusEnum = z.enum([
  'APPLIED',
  'REVIEWED',
  'INTERVIEWING',
  'HIRED',
  'REJECTED',
]);
export type JobApplicationStatus = z.infer<typeof JobApplicationStatusEnum>;

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  APPLIED: 'Lamaran Terkirim',
  REVIEWED: 'Ditinjau HRD',
  INTERVIEWING: 'Tahap Wawancara',
  HIRED: 'Diterima Bekerja (HIRED)',
  REJECTED: 'Belum Sesuai',
};

export const JobApplicationSchema = z.object({
  id: z.string().optional(),
  jobId: z.string(),
  jobTitle: z.string(),
  companyName: z.string(),
  partnerId: z.string().optional(),
  tenantId: z.string().optional(),
  applicantUid: z.string(),
  alumniId: z.string().optional(),
  applicantName: z.string().min(2, 'Nama pelamar wajib diisi'),
  applicantEmail: z.string().email('Email pelamar tidak valid'),
  applicantPhone: z.string().optional(),
  originSource: AlumniOriginSourceEnum.default('STP_VOKASI').optional(),
  programTaken: z.string().optional(),
  skills: z.array(z.string()).default([]),
  resumeUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  coverNote: z.string().optional(),
  aiMatchScore: z.number().optional(),
  forumReputationScore: z.number().default(0).optional(),
  status: JobApplicationStatusEnum.default('APPLIED'),
  statusNote: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
export type JobApplication = z.infer<typeof JobApplicationSchema>;

// --- NOTIFIKASI PINTAR & BROADCAST TERARAH (SPRINT 5) ---

export const EcosystemNotificationSchema = z.object({
  id: z.string().optional(),
  recipientUid: z.string(), // uid spesifik, 'BROADCAST_ALUMNI', atau 'ADMIN_DESK'
  targetTrack: z.string().optional(),
  title: z.string(),
  message: z.string(),
  linkUrl: z.string().default('/alumni-portal'),
  category: z
    .enum([
      'FORUM_REPLY',
      'SOLUTION_ACCEPTED',
      'JOB_APPLICATION',
      'INTERVIEW_INVITE',
      'BROADCAST_ALERT',
      'MODERATION_ALERT',
    ])
    .default('BROADCAST_ALERT'),
  readByUids: z.array(z.string()).default([]),
  createdAt: z.number(),
});
export type EcosystemNotification = z.infer<typeof EcosystemNotificationSchema>;

