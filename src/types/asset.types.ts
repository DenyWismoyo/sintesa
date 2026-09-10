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
  name: z.string(),
  category: z.string(),
  assetType: z.string().optional(),
  location: z.string(),
  condition: z.enum(['Baik', 'Rusak Ringan', 'Rusak Berat']),
  status: z.enum(['Tersedia', 'Disewa', 'Pemeliharaan']),
  inventoryNumber: z.string(),
  registerNumber: z.string().optional(),
  brandType: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  isRentable: z.boolean().default(false),
  priceValue: z.number().optional(),
  pricingType: z.string().optional(),
  picName: z.string().optional(),
  acquisitionYear: z.string().optional(),
  fundingSource: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.number(),
  maintenanceHistory: z.array(z.any()).optional(),
  galleryUrls: z.array(z.string()).optional(),
  unresolvedReportsCount: z.number().optional(),
  capacity: z.number().optional(),
  layout: z.string().optional(),
  facilities: z.string().optional(),
  defaultCoaId: z.string().optional()
});
export type Asset = z.infer<typeof AssetSchema>;
