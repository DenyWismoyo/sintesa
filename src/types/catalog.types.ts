import { z } from 'zod';

export const BundleItemSchema = z.object({
  id: z.string(), 
  type: z.enum(['ASSET_ROOM', 'ASSET_EQUIPMENT', 'TRAINING_TICKET', 'CUSTOM_SERVICE']),
  name: z.string(),
  qty: z.number().default(1),
  unitPrice: z.number(), 
  isRequired: z.boolean().default(true), 
});
export type BundleItem = z.infer<typeof BundleItemSchema>;

export const ProductCatalogSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  category: z.string().default('Umum'),
  shortDescription: z.string().optional().default(''),
  ownerType: z.enum(['INTERNAL', 'TENANT']).default('INTERNAL'),
  tenantId: z.string().optional(),
  tenantName: z.string().optional().default(''),
  price: z.coerce.number().default(0),
  pricingType: z.string().default('Tetap'),
  isNegotiable: z.boolean().default(false),
  description: z.string().default(''),
  highlights: z.array(z.string()).default([]),
  specifications: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  coverImage: z.string().optional().nullable(),
  ctaType: z.enum(['WHATSAPP', 'BOOKING_FORM', 'EXTERNAL_LINK', 'INVOICE']).default('WHATSAPP'),
  ctaLink: z.string().optional().default(''),
  ctaText: z.string().default('Hubungi Kami'),
  isPublished: z.boolean().default(true),
  createdAt: z.number().optional(),
  
  productType: z.enum(['SINGLE', 'BUNDLE']).default('SINGLE').optional(), 
  bundleItems: z.array(BundleItemSchema).optional().default([]), 
  isPriceCalculated: z.boolean().default(false).optional(), 
});
export type ProductCatalog = z.infer<typeof ProductCatalogSchema>;

