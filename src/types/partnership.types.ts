// src/types/partnership.types.ts
import { z } from 'zod';

export const PartnershipTypeEnum = z.enum([
  'VENUE_EVENT',           // Sewa Kawasan & Penyelenggaraan Acara Skala Besar
  'LAB_MANUFACTURING',      // Pemanfaatan Lab Presisi & Riset Terapan (CNC/Robotics/Cyber)
  'TALENT_RECRUITMENT',     // Penyerapan Talenta & Rekrutmen Lulusan Vokasi STP
  'STARTUP_INCUBATION',     // Inkubasi Startup, CSR Venture & Joint Investment
  'MOU_GENERAL',            // Nota Kesepahaman (MoU) & Kerjasama Kelembagaan Umum
]);
export type PartnershipType = z.infer<typeof PartnershipTypeEnum>;

export const PartnershipInquirySchema = z.object({
  id: z.string().optional(),
  agencyName: z.string(),
  agencyType: z.enum([
    'BUMN / BUMD',
    'Kementerian / Instansi Pemerintah',
    'Perusahaan Swasta / Multinasional',
    'Perguruan Tinggi / Lembaga Riset',
    'Asosiasi / Organisasi Profesi',
    'Lainnya',
  ]),
  picName: z.string(),
  picPosition: z.string(),
  picEmail: z.string(),
  picPhone: z.string(),
  partnershipType: PartnershipTypeEnum,
  subject: z.string(),
  proposalSummary: z.string(),
  estimatedTimeline: z.string().optional(),
  targetParticipants: z.number().optional(),
  estimatedBudget: z.number().optional(),
  status: z.enum(['PENDING', 'CONTACTED', 'MEETING_SCHEDULED', 'MOU_DRAFTED', 'CLOSED']).default('PENDING'),
  createdAt: z.number().optional(),
  adminNotes: z.string().optional(),
});
export type PartnershipInquiry = z.infer<typeof PartnershipInquirySchema>;
