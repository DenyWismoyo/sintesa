// src/types/partnership.types.ts
import { z } from 'zod';

export const PartnershipTypeEnum = z.enum([
  'VENUE_EVENT',           // Sewa Kawasan & Penyelenggaraan Acara Skala Besar
  'LAB_MANUFACTURING',      // Pemanfaatan Lab Presisi & Riset Terapan (CNC/Robotics/Cyber)
  'TALENT_RECRUITMENT',     // Penyerapan Talenta & Rekrutmen Lulusan Vokasi STP
  'STARTUP_INCUBATION',     // Inkubasi Startup, CSR Venture & Joint Investment
  'MOU_GENERAL',            // Nota Kesepahaman (MoU) & Kerjasama Kelembagaan Umum
  'FINANCING_TRAINING',    // Skema Kredit/Pembiayaan/Beasiswa Pelatihan (Bank/Fintech/CSR)
  'OPEN_PROJECT',          // Pelemparan Proyek Industri ke Ekosistem Alumni STP
  'CONTENT_CO_BRANDING',   // Co-branding Program Pelatihan & Kurikulum Industri
  'RESEARCH_APPLIED',      // Riset Terapan Bersama (Joint R&D)
  'SUPPLIER_ECOSYSTEM',    // Ekosistem Vendor & Pengadaan
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
  isFinancingPartner: z.boolean().default(false),
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

// ==========================================
// 1. SKEMA PEMBIAYAAN & PERBANKAN PELATIHAN
// ==========================================
export const FinancingSchemeTypeEnum = z.enum([
  'KUR_BANK',          // Kredit Usaha Rakyat / Kredit Pelatihan Bank
  'CICILAN_0_PERSEN',  // Cicilan tanpa bunga (Fintech/Bank Mitra)
  'BEASISWA_PENUH',    // Beasiswa 100% dari Mitra Korporasi
  'BEASISWA_PARSIAL',  // Subsidi sebagian dari CSR / Dana Abadi
  'VOUCHER_PELATIHAN', // Voucher / Subsidi Khusus Pemerintah & RSKB
]);
export type FinancingSchemeType = z.infer<typeof FinancingSchemeTypeEnum>;

export const FINANCING_SCHEME_LABELS: Record<FinancingSchemeType, string> = {
  KUR_BANK: 'Kredit Pelatihan / KUR Perbankan',
  CICILAN_0_PERSEN: 'Cicilan 0% Syariah / Fintech',
  BEASISWA_PENUH: 'Beasiswa Penuh Mitra Industri',
  BEASISWA_PARSIAL: 'Subsidi Beasiswa Parsial',
  VOUCHER_PELATIHAN: 'Voucher RSKB Surakarta',
};

export const FinancingSchemeSchema = z.object({
  id: z.string().optional(),
  partnerId: z.string().min(1, 'ID Mitra Perbankan/Fintech wajib terisi'),
  partnerName: z.string().min(2, 'Nama Institusi Keuangan wajib diisi'),
  partnerLogo: z.string().optional(),
  schemeType: FinancingSchemeTypeEnum,
  title: z.string().min(5, 'Nama skema pembiayaan wajib diisi'),
  description: z.string().min(10, 'Deskripsi skema pembiayaan wajib diisi'),
  maxAmount: z.number().default(0),            // Plafon maksimal pembiayaan (Rp)
  tenorMonths: z.number().default(6),           // Tenor cicilan (bulan)
  interestRate: z.number().default(0),          // Suku bunga % per tahun (0 untuk 0%)
  eligiblePrograms: z.array(z.string()).default([]), // ID program pelatihan / nama bidang
  eligibilityCriteria: z.string().min(5, 'Kriteria kelayakan wajib diisi'),
  applicationUrl: z.string().optional(),        // Tautan eksternal (bila ada)
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  quotaTotal: z.number().default(50),           // Kuota total kupon/kursi
  quotaUsed: z.number().default(0),             // Kuota yang telah terpakai
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type FinancingScheme = z.infer<typeof FinancingSchemeSchema>;
export type FinancingSchemeInput = z.input<typeof FinancingSchemeSchema>;

export const FinancingApplicationStatusEnum = z.enum([
  'SUBMITTED',       // Baru dikirim calon peserta
  'STP_REVIEWED',    // Diverifikasi kelayakan awal oleh STP
  'FORWARDED_BANK',  // Diteruskan ke verifikator Bank Mitra
  'BANK_PROCESSING', // Proses scoring / wawancara bank
  'APPROVED',        // Disetujui pihak bank/mitra
  'REJECTED',        // Ditolak
  'DISBURSED',       // Dana/Beasiswa dicairkan ke biaya pelatihan
]);
export type FinancingApplicationStatus = z.infer<typeof FinancingApplicationStatusEnum>;

export const FinancingApplicationSchema = z.object({
  id: z.string().optional(),
  schemeId: z.string().min(1, 'ID Skema pembiayaan wajib diisi'),
  schemeTitle: z.string().optional(),
  partnerId: z.string().min(1, 'ID Mitra Keuangan wajib diisi'),
  partnerName: z.string().optional(),
  applicantName: z.string().min(2, 'Nama lengkap wajib diisi'),
  applicantEmail: z.string().email('Email tidak valid'),
  applicantPhone: z.string().min(8, 'Nomor WhatsApp wajib diisi'),
  applicantNik: z.string().optional(),
  applicantAddress: z.string().optional(),
  programId: z.string().optional(),
  programTitle: z.string().min(2, 'Program pelatihan yang diminati wajib dipilih'),
  trainingFee: z.number().default(0),
  requestedAmount: z.number().default(0),
  preferredTenor: z.number().default(6),
  monthlyIncomeRange: z.string().optional(),
  employmentStatus: z.string().optional(), // 'Fresh Graduate', 'Pekerja Lepas', 'Karyawan', dll.
  proposalNote: z.string().optional(),
  ktpFileUrl: z.string().optional(),
  status: FinancingApplicationStatusEnum.default('SUBMITTED'),
  stpReviewNotes: z.string().optional(),
  bankReviewNotes: z.string().optional(),
  approvedAmount: z.number().optional(),
  approvedTenor: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type FinancingApplication = z.infer<typeof FinancingApplicationSchema>;

// ==========================================
// 2. OPEN PROJECT MARKETPLACE UNTUK ALUMNI
// ==========================================
export const OpenProjectCategoryEnum = z.enum([
  'WEB_MOBILE_DEV',     // Pengembangan Web / Aplikasi Mobile
  'DATA_ANALYTICS',     // Data Analytics & Business Intelligence
  'GRAPHIC_BRANDING',   // Desain Grafis, UI/UX & Creative Media
  'INDUSTRIAL_DESIGN',  // Manufaktur Presisi, CAD/CAM & 3D Modeling
  'CONTENT_DIGITAL',    // Produksi Video & Digital Marketing
  'AUTOMATION_IOT',     // IoT, PLC & Otomasi Pabrik
  'CYBERSECURITY',      // Audit Keamanan Siber & IT Support
  'RESEARCH_SURVEY',    // Survei Lapangan & Riset Terapan
  'OTHER',
]);
export type OpenProjectCategory = z.infer<typeof OpenProjectCategoryEnum>;

export const OPEN_PROJECT_CATEGORY_LABELS: Record<OpenProjectCategory, string> = {
  WEB_MOBILE_DEV: 'Web & Mobile App Development',
  DATA_ANALYTICS: 'Data Analytics & AI Automation',
  GRAPHIC_BRANDING: 'UI/UX & Desain Grafis Kreatif',
  INDUSTRIAL_DESIGN: 'Manufaktur Presisi & CAD/CAM',
  CONTENT_DIGITAL: 'Produksi Media & Digital Ads',
  AUTOMATION_IOT: 'IoT & Otomasi Industri',
  CYBERSECURITY: 'Keamanan Siber & Jaringan',
  RESEARCH_SURVEY: 'Riset Pasar & Survei Lapangan',
  OTHER: 'Proyek Teknologi Lainnya',
};

export const OpenProjectStatusEnum = z.enum([
  'DRAFT',           // Draft oleh Mitra
  'PENDING_REVIEW',  // Menunggu Verifikasi/Kurasi Admin STP
  'ACTIVE',          // Tayang di Publik / Portal Alumni
  'IN_PROGRESS',     // Pelamar Terpilih Sedang Mengerjakan
  'COMPLETED',       // Proyek Selesai & Dinilai
  'CANCELLED',       // Dibatalkan
]);
export type OpenProjectStatus = z.infer<typeof OpenProjectStatusEnum>;

export const OpenProjectSchema = z.object({
  id: z.string().optional(),
  partnerId: z.string().min(1, 'ID Mitra Industri wajib diisi'),
  partnerName: z.string().min(2, 'Nama Instansi/Perusahaan wajib diisi'),
  partnerLogo: z.string().optional(),
  partnerSector: z.string().optional(),
  picName: z.string().optional(),
  picContact: z.string().optional(),
  
  // Konten Proyek
  title: z.string().min(5, 'Judul proyek wajib diisi'),
  category: OpenProjectCategoryEnum,
  description: z.string().min(20, 'Deskripsi proyek minimal 20 karakter'),
  deliverables: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredPrograms: z.array(z.string()).default([]), // Lulusan program mana yang diprioritaskan
  
  // Nilai & Waktu
  projectType: z.enum(['FREELANCE', 'MAGANG_PROYEK', 'KOLABORASI_RISET', 'CSR_COMMUNITY']).default('FREELANCE'),
  budgetType: z.enum(['FIXED', 'NEGOTIABLE', 'SPONSORED', 'REWARD_BASED']).default('FIXED'),
  budgetAmount: z.number().default(0),
  budgetRangeMax: z.number().optional(),
  durationEstimate: z.string().default('1 Bulan'),
  workSetup: z.enum(['REMOTE', 'HYBRID', 'ONSITE_STP', 'ONSITE_COMPANY']).default('REMOTE'),
  maxApplicants: z.number().default(10),
  
  // Kurasi & Status
  status: OpenProjectStatusEnum.default('PENDING_REVIEW'),
  stpCurationNotes: z.string().optional(),
  isFeatured: z.boolean().default(false),
  selectedAlumniId: z.string().optional(),
  selectedAlumniName: z.string().optional(),
  
  // Linimasa
  submissionDeadline: z.string().optional(), // YYYY-MM-DD
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type OpenProject = z.infer<typeof OpenProjectSchema>;
export type OpenProjectInput = z.input<typeof OpenProjectSchema>;

export const ProjectApplicationStatusEnum = z.enum([
  'PENDING',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]);
export type ProjectApplicationStatus = z.infer<typeof ProjectApplicationStatusEnum>;

export const ProjectApplicationSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, 'ID Proyek wajib terisi'),
  projectTitle: z.string().optional(),
  partnerId: z.string().min(1, 'ID Mitra wajib terisi'),
  alumniId: z.string().min(1, 'ID Alumni/Pelamar wajib terisi'),
  alumniName: z.string().min(2, 'Nama alumni wajib diisi'),
  alumniProgram: z.string().optional(),
  alumniEmail: z.string().email().optional(),
  alumniPhone: z.string().optional(),
  proposalLetter: z.string().min(20, 'Surat proposal/pengantar minimal 20 karakter'),
  portfolioLinks: z.array(z.string()).default([]),
  proposedBudget: z.number().optional(),
  proposedTimeline: z.string().optional(),
  status: ProjectApplicationStatusEnum.default('PENDING'),
  partnerFeedback: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type ProjectApplication = z.infer<typeof ProjectApplicationSchema>;
