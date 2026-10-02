// Lokasi file: src/types/affiliate.types.ts

import { z } from 'zod';

// 1. Status Mitra Afiliasi
export const AffiliateStatusSchema = z.enum([
  'PENDING',    // Menunggu persetujuan admin
  'APPROVED',   // Aktif & dapat mempromosikan serta menghasilkan komisi
  'REJECTED',   // Ditolak admin
  'SUSPENDED'   // Dinonaktifkan sementara
]);
export type AffiliateStatus = z.infer<typeof AffiliateStatusSchema>;

// 2. Profil Mitra Afiliasi
export const AffiliatePartnerSchema = z.object({
  id: z.string(),                     // userId Firebase Auth
  userId: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  referralCode: z.string().min(3).max(20), // e.g. "STP-ANDI"
  status: AffiliateStatusSchema.default('PENDING'),
  
  // Data Profil & Media Promosi
  promotionChannels: z.array(z.string()).default([]), // ['Instagram', 'Kampus', 'Komunitas']
  promotionNotes: z.string().optional(),
  
  // Data Rekening Pencairan Komisi
  bankName: z.string(),              // e.g. "BCA", "Mandiri", "BRI", "BSI", "GoPay"
  accountNumber: z.string(),
  accountHolderName: z.string(),

  // Statistik & Saldo Dompet
  totalClicks: z.number().default(0),
  totalConversions: z.number().default(0),
  totalEarnings: z.number().default(0),      // Total rupiah komisi yang pernah didapat
  availableBalance: z.number().default(0),   // Saldo siap ditarik
  pendingBalance: z.number().default(0),     // Saldo transaksi menunggu kliring
  withdrawnAmount: z.number().default(0),    // Total rupiah yang sudah dicairkan
  
  createdAt: z.number(),
  approvedAt: z.number().optional(),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
});
export type AffiliatePartner = z.infer<typeof AffiliatePartnerSchema>;

// 3. Catatan Transaksi Komisi (Commission Ledger)
export const CommissionRecordSchema = z.object({
  id: z.string().optional(),
  affiliateId: z.string(),
  referralCode: z.string(),
  
  // Asal Transaksi
  domain: z.enum(['PELATIHAN', 'FASILITAS', 'KATALOG']),
  itemId: z.string(),
  itemTitle: z.string(),
  invoiceId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  
  // Perhitungan Keuangan
  transactionAmount: z.number(),
  commissionRate: z.number(),             // misal 0.05 (5%)
  commissionAmount: z.number(),           // Rupiah komisi
  
  status: z.enum(['PENDING_PAYMENT', 'CLEARED', 'CANCELLED']).default('PENDING_PAYMENT'),
  clearedAt: z.number().optional(),
  createdAt: z.number(),
});
export type CommissionRecord = z.infer<typeof CommissionRecordSchema>;

// 4. Pengajuan Pencairan Dana (Payout Request)
export const AffiliatePayoutRequestSchema = z.object({
  id: z.string().optional(),
  affiliateId: z.string(),
  referralCode: z.string(),
  amount: z.number().min(50000),          // Minimal penarikan Rp 50.000
  
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolderName: z.string(),
  
  status: z.enum(['REQUESTED', 'APPROVED', 'TRANSFERRED', 'REJECTED']).default('REQUESTED'),
  proofReceiptUrl: z.string().optional(), // Bukti transfer bank dari admin
  adminNotes: z.string().optional(),
  
  requestedAt: z.number(),
  processedAt: z.number().optional(),
  processedBy: z.string().optional(),
});
export type AffiliatePayoutRequest = z.infer<typeof AffiliatePayoutRequestSchema>;

// 5. Pengaturan Tarif Komisi Global
export const AffiliateSettingsSchema = z.object({
  trainingCommissionRate: z.number().default(0.05), // 5%
  facilityCommissionRate: z.number().default(0.05), // 5%
  catalogCommissionRate: z.number().default(0.05),  // 5%
  cookieAttributionDays: z.number().default(30),   // 30 hari
  minPayoutAmount: z.number().default(50000),       // Rp 50.000
  termsAndConditions: z.string().optional()
});
export type AffiliateSettings = z.infer<typeof AffiliateSettingsSchema>;
