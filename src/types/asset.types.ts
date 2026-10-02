import { z } from 'zod';

export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type AssetStatus = 'Tersedia' | 'Disewa' | 'Pemeliharaan';
export type AssetCategory = string;
export type PaymentTerm = 'FULL_PAYMENT' | 'DOWN_PAYMENT' | 'INSTALLMENT' | 'SUBSCRIPTION';
export type ProductCategory = 'Ruangan' | 'Peralatan' | 'Layanan Teknis' | 'Pelatihan' | 'Produk Tenant' | 'Lainnya';

export interface MaintenanceRecord {
  id: string;
  date: string;
  description: string;
  cost: number;
  technician: string;
}

export const AssetSchema = z.object({
  id: z.string().optional(),
  name: z.string().default('Tanpa Nama'),
  category: z.string().default('Lainnya'),
  assetType: z.string().optional().default('-'),
  location: z.string().optional().default('-'),
  condition: z.custom<AssetCondition>((val) => typeof val === 'string').default('Baik'),
  status: z.custom<AssetStatus>((val) => typeof val === 'string').default('Tersedia'),
  inventoryNumber: z.string().optional().default('-'),
  registerNumber: z.string().optional().default(''),
  brandType: z.string().optional().default('-'),
  material: z.string().optional().default('-'),
  dimensions: z.string().optional().default('-'),
  isRentable: z.boolean().default(false),
  priceValue: z.number().optional().default(0),
  pricingType: z.string().optional().default('Hari'),
  picName: z.string().optional().default(''),
  acquisitionYear: z.string().optional().default(''),
  fundingSource: z.string().optional().default(''),
  imageUrl: z.union([z.string(), z.null()]).optional().transform(v => v || undefined),
  description: z.string().optional().default(''),
  createdAt: z.any().optional().default(() => Date.now()),
  maintenanceHistory: z.array(z.any()).optional().default([]),
  galleryUrls: z.array(z.string()).optional().default([]),
  unresolvedReportsCount: z.number().optional().default(0),
  capacity: z.number().optional().default(0),
  layout: z.string().optional().default(''),
  facilities: z.string().optional().default(''),
  defaultCoaId: z.string().optional()
});
export type Asset = z.infer<typeof AssetSchema>;
