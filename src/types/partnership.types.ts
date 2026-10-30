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
  convertedPartnerId: z.string().optional(),
  convertedAt: z.number().optional(),
});
export type PartnershipInquiry = z.infer<typeof PartnershipInquirySchema>;

export const MouContractStatusEnum = z.enum([
  'DRAFT',
  'REVIEW_LEGAL',
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'TERMINATED',
]);
export type MouContractStatus = z.infer<typeof MouContractStatusEnum>;

export const MouContractTypeEnum = z.enum([
  'MOU',      // Nota Kesepahaman
  'PKS',      // Perjanjian Kerja Sama
  'NDA',      // Non-Disclosure Agreement
  'KONTRAK',  // Kontrak Komersial / Layanan
]);
export type MouContractType = z.infer<typeof MouContractTypeEnum>;

export const MouContractSchema = z.object({
  id: z.string().optional(),
  contractNumber: z.string().min(3, 'Nomor dokumen MoU/PKS wajib diisi'),
  title: z.string().min(5, 'Judul kerjasama wajib diisi'),
  contractType: MouContractTypeEnum.default('MOU'),
  partnerId: z.string().optional(),
  partnerName: z.string().min(2, 'Nama mitra wajib diisi'),
  agencyType: z.string().default('Perusahaan Swasta / Multinasional'),
  picPartnerName: z.string().min(2, 'PIC Mitra wajib diisi'),
  picPartnerContact: z.string().min(5, 'Kontak PIC Mitra wajib diisi'),
  picStpName: z.string().min(2, 'PIC Internal STP wajib diisi'),
  scope: z.string().min(5, 'Ruang lingkup kerjasama wajib diisi'),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),   // YYYY-MM-DD
  commitmentBudget: z.number().default(0),
  documentUrl: z.string().optional(),
  status: MouContractStatusEnum.default('ACTIVE'),
  notes: z.string().optional(),
  realizationSummary: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type MouContract = z.infer<typeof MouContractSchema>;

export const PartnerTierEnum = z.enum([
  'MOU_OFFICIAL',
  'CSR_PARTNER',
  'HIRING_PARTNER',
  'GOVERNMENT_RSKB',
]);
export type PartnerTier = z.infer<typeof PartnerTierEnum>;

export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  MOU_OFFICIAL: 'Mitra MoU Resmi',
  CSR_PARTNER: 'Mitra CSR & Pembinaan',
  HIRING_PARTNER: 'Mitra Penyaluran Kerja',
  GOVERNMENT_RSKB: 'Jejaring Pemerintah / RSKB',
};

export const PartnerProfileSchema = z.object({
  id: z.string().optional(),
  inquiryId: z.string().optional(),
  companyName: z.string().min(2, 'Nama perusahaan / instansi wajib diisi'),
  agencyType: z.string().default('Perusahaan Swasta / Multinasional'),
  industrySector: z.string().default('Teknologi & Industri'),
  companyLogo: z.string().optional(),
  websiteUrl: z.string().optional(),
  location: z.string().default('Surakarta, Jawa Tengah'),
  description: z.string().optional(),
  picName: z.string(),
  picPosition: z.string().optional(),
  picEmail: z.string().email('Email PIC tidak valid'),
  picPhone: z.string(),
  picUserId: z.string().optional(),
  tier: PartnerTierEnum.default('HIRING_PARTNER'),
  isVerified: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type PartnerProfile = z.infer<typeof PartnerProfileSchema>;

export const TalentInvitationSchema = z.object({
  id: z.string().optional(),
  alumniId: z.string(),
  alumniName: z.string(),
  alumniProgram: z.string().optional(),
  senderType: z.enum(['PARTNER', 'TENANT']),
  senderEntityId: z.string(),
  senderCompanyName: z.string(),
  senderPicName: z.string(),
  senderPicContact: z.string(),
  senderUid: z.string(),
  roleOffered: z.string().min(2, 'Posisi yang ditawarkan wajib diisi'),
  workType: z.string().default('Full-time'),
  message: z.string().min(5, 'Pesan undangan wawancara wajib diisi'),
  status: z.enum(['PENDING', 'REVIEWED_BY_ADMIN', 'ACCEPTED', 'DECLINED']).default('PENDING'),
  createdAt: z.number().optional(),
});
export type TalentInvitation = z.infer<typeof TalentInvitationSchema>;
