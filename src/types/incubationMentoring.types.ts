// src/types/incubationMentoring.types.ts
import { z } from 'zod';

export const MentoringSessionStatusEnum = z.enum([
  'REQUESTED',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
]);
export type MentoringSessionStatus = z.infer<typeof MentoringSessionStatusEnum>;

export const IncubationMentoringSessionSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  tenantName: z.string(),
  mentorId: z.string(),
  mentorName: z.string(),
  mentorExpertise: z.string().default('Business & Strategy'),
  topic: z.string().min(3, 'Topik mentoring wajib diisi'),
  scheduledAt: z.string(), // ISO String or YYYY-MM-DD HH:mm
  durationMinutes: z.number().default(60),
  locationOrUrl: z.string().default('Ruang Rapat Inkubator STP'),
  status: MentoringSessionStatusEnum.default('SCHEDULED'),
  trlLevel: z.number().min(1).max(9).default(4), // Technology Readiness Level 1-9
  criLevel: z.number().min(1).max(6).default(2), // Commercial Readiness Index 1-6
  mentorFeedback: z.string().optional(),
  actionItems: z.string().optional(),
  mentorRating: z.number().min(1).max(5).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type IncubationMentoringSession = z.infer<typeof IncubationMentoringSessionSchema>;

export const DealRoomAccessStatusEnum = z.enum([
  'PENDING_NDA',
  'ACTIVE_ACCESS',
  'MEETING_REQUESTED',
  'LOI_SUBMITTED',
  'REVOKED',
]);
export type DealRoomAccessStatus = z.infer<typeof DealRoomAccessStatusEnum>;

export const DealRoomAccessSchema = z.object({
  id: z.string().optional(),
  investorUid: z.string(),
  investorName: z.string(),
  investorOrg: z.string(),
  investorEmail: z.string().email(),
  tenantId: z.string(),
  tenantName: z.string(),
  ndaAccepted: z.boolean().default(false),
  ndaAcceptedAt: z.number().optional(),
  ndaSignedName: z.string().optional(),
  status: DealRoomAccessStatusEnum.default('PENDING_NDA'),
  pitchDeckUrl: z.string().optional(),
  financialModelUrl: z.string().optional(),
  meetingDate: z.string().optional(),
  meetingNotes: z.string().optional(),
  loiNotes: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type DealRoomAccess = z.infer<typeof DealRoomAccessSchema>;

export const TenantSubsidyVoucherSchema = z.object({
  id: z.string().optional(),
  voucherCode: z.string().min(4),
  tenantId: z.string(),
  tenantName: z.string(),
  programName: z.string().default('Program Hilirisasi Inkubasi STP'),
  totalPlafond: z.number(),
  usedAmount: z.number().default(0),
  remainingAmount: z.number(),
  serviceCategory: z.enum(['MANUFACTURING', 'LAB_CNC', 'COWORKING', 'ALL']).default('ALL'),
  validUntil: z.string(), // YYYY-MM-DD
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.number().optional(),
});
export type TenantSubsidyVoucher = z.infer<typeof TenantSubsidyVoucherSchema>;

