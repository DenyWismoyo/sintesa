// Lokasi file: src/types/article.types.ts

import { z } from 'zod';

export const ArticleCtaTypeSchema = z.enum([
  'NONE',        // Tanpa CTA
  'CATALOG',     // CTA ke Produk / Layanan Katalog
  'TRAINING',    // CTA ke Program Pelatihan
  'FACILITY',    // CTA ke Fasilitas / Ruangan
  'WHATSAPP',    // CTA ke WhatsApp CS STP
  'CUSTOM',      // CTA Kustom URL
]);
export type ArticleCtaType = z.infer<typeof ArticleCtaTypeSchema>;

export const ArticleCtaConfigSchema = z.object({
  type: ArticleCtaTypeSchema.default('NONE'),
  title: z.string().optional(),          // Judul Box CTA, misal: "Siap Menguasai Pengelasan Bersertifikat?"
  description: z.string().optional(),    // Deskripsi Singkat, misal: "Ikuti pelatihan intensif di Solo Technopark dengan kurikulum standar industri."
  buttonText: z.string().optional(),     // Label Tombol, misal: "Lihat Detail Pelatihan"
  targetId: z.string().optional(),       // ID item rujukan (ID Training / Catalog / Asset)
  targetUrl: z.string().optional(),      // URL langsung (/program-pelatihan/id, /e-katalog/id, /fasilitas, dll)
  targetBadge: z.string().optional(),    // Misal: "Sertifikasi BNSP" / "Kuota Terbatas"
  priceDisplay: z.string().optional(),   // Misal: "Rp 1.500.000" / "Gratis"
});
export type ArticleCtaConfig = z.infer<typeof ArticleCtaConfigSchema>;

export const ArticleCategorySchema = z.enum([
  'Panduan Pelatihan',
  'Berita & Event',
  'Inovasi & Teknologi',
  'Fasilitas & Bisnis',
  'Profil Tenant',
  'Umum',
]);
export type ArticleCategory = z.infer<typeof ArticleCategorySchema>;

export const ArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Judul artikel minimal 5 karakter"),
  slug: z.string(),
  category: ArticleCategorySchema.default('Berita & Event'),
  excerpt: z.string().min(10, "Ringkasan artikel minimal 10 karakter"),
  content: z.string().min(20, "Isi artikel minimal 20 karakter"),
  coverImageUrl: z.string().optional(),
  authorName: z.string().default('Humas Solo Technopark'),
  authorRole: z.string().default('Tim Redaksi'),
  authorAvatarUrl: z.string().optional(),
  readTimeMins: z.number().default(3),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  cta: ArticleCtaConfigSchema.optional(),
  viewCount: z.number().default(0),
  publishedAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type Article = z.infer<typeof ArticleSchema>;
