// src/types/serviceDesk.types.ts
import { z } from 'zod';

export const WorkOrderPriorityEnum = z.enum(['RENDAH', 'SEDANG', 'TINGGI', 'DARURAT']);
export type WorkOrderPriority = z.infer<typeof WorkOrderPriorityEnum>;

export const WorkOrderStatusEnum = z.enum([
  'OPEN',           // Tiket baru masuk / Menunggu triase
  'ASSIGNED',       // Sudah diterbitkan SPK & ditugaskan teknisi
  'IN_PROGRESS',    // Sedang dalam pengerjaan
  'WAITING_PARTS',  // Menunggu suku cadang / material
  'RESOLVED',       // Selesai dikerjakan teknisi (Menunggu verifikasi BAST)
  'CLOSED',         // BAST ditandatangani & tiket ditutup
  'CANCELLED',      // Dibatalkan
]);
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>;

export const WorkOrderSourceEnum = z.enum([
  'PUBLIC_REPORT',   // Dari QR scan lapor-aset publik
  'TENANT_TICKET',   // Dari helpdesk tenant
  'INTERNAL_STAFF',  // Dari pegawai internal STP
  'PREVENTIVE',      // Jadwal perawatan berkala rutin
]);
export type WorkOrderSource = z.infer<typeof WorkOrderSourceEnum>;

export const PartUsedSchema = z.object({
  id: z.string().optional(),
  partName: z.string().min(1, 'Nama suku cadang wajib diisi'),
  qty: z.number().min(1),
  unit: z.string().default('Pcs'),
  unitCost: z.number().default(0),
  totalCost: z.number().default(0),
});
export type PartUsed = z.infer<typeof PartUsedSchema>;

export const WorkOrderSchema = z.object({
  id: z.string().optional(),
  spkNumber: z.string().min(3, 'Nomor SPK wajib diisi'),
  title: z.string().min(3, 'Judul aduan / pekerjaan wajib diisi'),
  assetId: z.string().optional(),
  assetName: z.string().min(2, 'Nama aset / fasilitas wajib diisi'),
  location: z.string().default('Kawasan Solo Technopark'),
  source: WorkOrderSourceEnum.default('INTERNAL_STAFF'),
  sourceReportId: z.string().optional(), // ID dari laporan asal
  reporterName: z.string().min(2, 'Nama pelapor wajib diisi'),
  reporterContact: z.string().optional(),
  issueDescription: z.string().min(5, 'Deskripsi masalah wajib diisi'),
  priority: WorkOrderPriorityEnum.default('SEDANG'),
  status: WorkOrderStatusEnum.default('OPEN'),
  technicianName: z.string().optional(),
  technicianPhone: z.string().optional(),
  partsUsed: z.array(PartUsedSchema).default([]),
  estimatedCost: z.number().default(0),
  actualCost: z.number().default(0),
  completionNotes: z.string().optional(),
  beforePhotoUrl: z.string().optional(),
  afterPhotoUrl: z.string().optional(),
  bastSignedDate: z.string().optional(), // Tanggal BAST
  targetCompletionDate: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type WorkOrder = z.infer<typeof WorkOrderSchema>;

