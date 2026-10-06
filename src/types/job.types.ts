// src/types/job.types.ts
import { z } from 'zod';

export const JobCategoryEnum = z.enum([
  'IT & Rekayasa Perangkat Lunak',
  'Kecerdasan Buatan & Sains Data',
  'Keamanan Siber (Cyber Security)',
  'Multimedia, Game & Animasi 3D',
  'Manufaktur Presisi & Mekatronika',
  'Pemasaran & Bisnis Digital',
]);
export type JobCategory = z.infer<typeof JobCategoryEnum>;

export const JobWorkTypeEnum = z.enum([
  'Full-time',
  'Internship / Magang',
  'Contract',
  'Freelance / Project',
  'Part-time',
]);
export type JobWorkType = z.infer<typeof JobWorkTypeEnum>;

export const JobWorkSetupEnum = z.enum([
  'On-site (Solo Technopark)',
  'On-site',
  'Hybrid',
  'Remote / WFH',
]);
export type JobWorkSetup = z.infer<typeof JobWorkSetupEnum>;

export const JobExperienceLevelEnum = z.enum([
  'Fresh Graduate / Alumni Pelatihan',
  'Junior (0-2 Tahun)',
  'Mid-Level (2-4 Tahun)',
  'Senior (4+ Tahun)',
]);
export type JobExperienceLevel = z.infer<typeof JobExperienceLevelEnum>;

export const JobCompanyTypeEnum = z.enum([
  'Mitra Industri STP',
  'Tenant Inkubasi Startup STP',
  'BUMN & Pemerintah',
  'Perusahaan Teknologi',
  'Industri Manufaktur',
]);
export type JobCompanyType = z.infer<typeof JobCompanyTypeEnum>;

export const JobSalarySchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().default('IDR'),
  period: z.enum(['Bulan', 'Tahun', 'Proyek']).default('Bulan'),
  isNegotiable: z.boolean().default(true),
  isDisclosed: z.boolean().default(true),
});
export type JobSalary = z.infer<typeof JobSalarySchema>;

export const JobListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().optional(),
  company: z.string(),
  companyLogo: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyType: JobCompanyTypeEnum.default('Mitra Industri STP'),
  category: JobCategoryEnum,
  location: z.string(),
  city: z.string().default('Surakarta'),
  workType: JobWorkTypeEnum.default('Full-time'),
  workSetup: JobWorkSetupEnum.default('On-site'),
  experienceLevel: JobExperienceLevelEnum.default('Fresh Graduate / Alumni Pelatihan'),
  salary: JobSalarySchema.default({
    currency: 'IDR',
    period: 'Bulan',
    isNegotiable: true,
    isDisclosed: true,
  }),
  description: z.string(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  relevantTrainingPrograms: z.array(z.string()).default([]),
  applicationUrl: z.string().optional(),
  applicationEmail: z.string().optional(),
  isStpPartner: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  postedAt: z.number(),
  deadlineAt: z.number().optional(),
  viewsCount: z.number().default(0),
  applicantCount: z.number().default(0),
  isActive: z.boolean().default(true),
});
export type JobListing = z.infer<typeof JobListingSchema>;

export interface JobFilterParams {
  query?: string;
  category?: string;
  workType?: string;
  workSetup?: string;
  experienceLevel?: string;
  trainingProgram?: string;
  isStpPartner?: boolean;
  sort?: 'newest' | 'salary_high' | 'featured';
  page?: number;
  limit?: number;
}

export const JobAiMatchRequestSchema = z.object({
  jobId: z.string(),
  alumniName: z.string().optional(),
  alumniProgram: z.string().optional(),
  alumniSkills: z.array(z.string()).default([]),
  alumniExperience: z.string().optional(),
  resumeSnippet: z.string().optional(),
});
export type JobAiMatchRequest = z.infer<typeof JobAiMatchRequestSchema>;

export const JobAiMatchResponseSchema = z.object({
  matchScore: z.number(), // 0 - 100
  matchGrade: z.enum(['Sangat Cocok', 'Cocok', 'Potensial', 'Perlu Peningkatan Skill']),
  executiveSummary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  alumniAdvantages: z.array(z.string()),
  recommendedPreparation: z.array(z.string()),
});
export type JobAiMatchResponse = z.infer<typeof JobAiMatchResponseSchema>;
