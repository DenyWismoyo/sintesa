// Lokasi file: src/types/production.types.ts
import { z } from 'zod';

export const ProductionCategoryEnum = z.enum([
  'CNC_MACHINING',
  'FABRIKASI_LAS',
  '3D_PRINTING',
  'ELECTRONICS_IOT',
  'CAD_DESIGN',
  'LAINNYA'
]);
export type ProductionCategory = z.infer<typeof ProductionCategoryEnum>;

export const PRODUCTION_CATEGORY_LABELS: Record<ProductionCategory, string> = {
  CNC_MACHINING: 'CNC & Presisi Machining',
  FABRIKASI_LAS: 'Fabrikasi & Pengelasan Logam',
  '3D_PRINTING': '3D Printing & Additive Mfg',
  ELECTRONICS_IOT: 'Elektronika & Perakitan IoT',
  CAD_DESIGN: 'Desain CAD / Modeling 3D',
  LAINNYA: 'Layanan Manufaktur Khusus'
};

export const ProductionStatusEnum = z.enum([
  'DRAFT',                 // Draf awal dibuat oleh admin/klien
  'ESTIMATION',            // Perhitungan kalkulasi bahan baku & jam mesin
  'VALIDATION',            // Peninjauan kelayakan teknis bengkel
  'APPROVED_WAITING_DP',   // Disetujui, menunggu pembayaran DP
  'IN_PRODUCTION',         // Pengerjaan fisik aktif di bengkel / workshop
  'QUALITY_CONTROL',       // Pengujian presisi & toleransi mutu (QC)
  'READY_FOR_DELIVERY',    // Selesai QC, siap serah terima / kirim
  'DELIVERED',             // Barang dikirim dengan Surat Jalan resmi
  'COMPLETED',             // Selesai lunas & berkas administrasi rampung
  'CANCELLED'              // Dibatalkan
]);
export type ProductionStatus = z.infer<typeof ProductionStatusEnum>;

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draf Pesanan', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ESTIMATION: { label: 'Kalkulasi Biaya', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  VALIDATION: { label: 'Review Teknis', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  APPROVED_WAITING_DP: { label: 'Menunggu DP', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  IN_PRODUCTION: { label: 'Sedang Dikerjakan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  QUALITY_CONTROL: { label: 'Uji Mutu (QC)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  READY_FOR_DELIVERY: { label: 'Siap Kirim', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DELIVERED: { label: 'Terkirim (Surat Jalan)', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  COMPLETED: { label: 'Selesai Lunas', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700 border-rose-200' }
};

export const ClientTypeEnum = z.enum([
  'Instansi',
  'Industri',
  'UMKM',
  'Perorangan',
  'Internal_STP'
]);
export type ClientType = z.infer<typeof ClientTypeEnum>;

export const PaymentStatusEnum = z.enum([
  'UNPAID',
  'DP_PAID',
  'FULL_PAID'
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ProductionItemSchema = z.object({
  id: z.string(),
  partName: z.string().min(1, 'Nama part/komponen wajib diisi'),
  material: z.string().default('Baja ST37'),
  dimensions: z.string().optional().default('-'),
  quantity: z.number().min(1).default(1),
  unit: z.string().default('Pcs'),
  unitPrice: z.number().min(0).default(0),
  totalPrice: z.number().min(0).default(0),
  notes: z.string().optional().default('')
});
export type ProductionItem = z.infer<typeof ProductionItemSchema>;

export const BlueprintFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  uploadedAt: z.number(),
  size: z.number().optional()
});
export type BlueprintFile = z.infer<typeof BlueprintFileSchema>;

export const WorkProgressLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  percentage: z.number().min(0).max(100),
  note: z.string(),
  author: z.string(),
  createdAt: z.number().optional()
});
export type WorkProgressLog = z.infer<typeof WorkProgressLogSchema>;

export const DeliveryOrderInfoSchema = z.object({
  deliveryOrderNumber: z.string(),
  deliveryDate: z.string(),
  driverOrExpedition: z.string().default(''),
  vehicleNumber: z.string().optional().default(''),
  recipientName: z.string().default(''),
  recipientPhone: z.string().optional().default(''),
  deliveryNotes: z.string().optional().default(''),
  createdAt: z.number().optional()
});
export type DeliveryOrderInfo = z.infer<typeof DeliveryOrderInfoSchema>;

export const ProductionOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string(), // e.g. SPK/PROD/YYYYMMDD/XXXX
  clientName: z.string().min(1, 'Nama pemesan wajib diisi'),
  clientType: ClientTypeEnum.default('Industri'),
  clientPhone: z.string().default(''),
  clientEmail: z.string().default(''),
  clientAddress: z.string().default(''),
  clientPic: z.string().default(''),
  
  projectTitle: z.string().min(1, 'Judul proyek/pekerjaan wajib diisi'),
  category: ProductionCategoryEnum.default('CNC_MACHINING'),
  items: z.array(ProductionItemSchema).default([]),
  blueprintFiles: z.array(BlueprintFileSchema).default([]),
  
  estimatedDurationDays: z.number().default(7),
  targetDeliveryDate: z.string(),
  actualDeliveryDate: z.string().nullable().optional(),
  
  status: ProductionStatusEnum.default('DRAFT'),
  productionProgress: z.number().min(0).max(100).default(0),
  assignedTechnician: z.string().default('Tim Manufaktur STP'),
  workshopLocation: z.string().default('Workshop CNC & Fabrikasi STP'),
  workNotes: z.array(WorkProgressLogSchema).default([]),
  
  // Aspek Biaya & Termin Pembayaran
  totalCost: z.number().min(0).default(0),
  dpRequired: z.boolean().default(true),
  dpPercentage: z.number().min(0).max(100).default(30),
  dpAmount: z.number().min(0).default(0),
  dpInvoiceId: z.string().nullable().optional(),
  finalInvoiceId: z.string().nullable().optional(),
  paymentStatus: PaymentStatusEnum.default('UNPAID'),
  
  // Aspek Surat Jalan / Delivery Order (DO)
  deliveryOrder: DeliveryOrderInfoSchema.nullable().optional(),
  
  notes: z.string().optional().default(''),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional()
});

export type ProductionOrder = z.infer<typeof ProductionOrderSchema>;
