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
  name: z.string(),
  category: z.string(),
  shortDescription: z.string().optional(),
  ownerType: z.enum(['INTERNAL', 'TENANT']).default('INTERNAL'),
  tenantId: z.string().optional(),
  tenantName: z.string().optional(),
  price: z.number(),
  pricingType: z.string(),
  isNegotiable: z.boolean().default(false),
  description: z.string(),
  highlights: z.array(z.string()).default([]),
  specifications: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()),
  ctaType: z.enum(['WHATSAPP', 'BOOKING_FORM', 'EXTERNAL_LINK', 'INVOICE']).default('WHATSAPP'),
  ctaLink: z.string().optional(),
  ctaText: z.string().default('Hubungi Kami'),
  isPublished: z.boolean(),
  createdAt: z.number().optional(),
  
  productType: z.enum(['SINGLE', 'BUNDLE']).default('SINGLE').optional(), 
  bundleItems: z.array(BundleItemSchema).optional(), 
  isPriceCalculated: z.boolean().default(false).optional(), 
});
export type ProductCatalog = z.infer<typeof ProductCatalogSchema>;
