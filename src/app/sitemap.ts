import { MetadataRoute } from 'next';
import { trainingService } from '@/services/training.service';
import { catalogService } from '@/services/catalog.service';
import { articleService } from '@/services/article.service';
import { eventService } from '@/services/event.service';
import { tenantService } from '@/services/tenant.service';
import { Training, ProductCatalog, Article, AppEvent, Tenant } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/program-pelatihan`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fasilitas`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/e-katalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/event`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/artikel`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ekosistem`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/peta-kawasan`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch dynamic items safely with explicit types
  try {
    const [trainings, products, articles, events, tenants] = await Promise.all([
      trainingService.getTrainings(50).catch(() => [] as Training[]),
      catalogService.getProducts(50).catch(() => [] as ProductCatalog[]),
      articleService.getArticles({ publishedOnly: true, maxLimit: 50 }).catch(() => [] as Article[]),
      eventService.getEvents().catch(() => [] as AppEvent[]),
      tenantService.getAllTenants().catch(() => [] as Tenant[]),
    ]);

    const trainingUrls: MetadataRoute.Sitemap = trainings
      .filter((t: Training) => !!t.id)
      .map((t: Training) => ({
        url: `${baseUrl}/program-pelatihan/${t.id}`,
        lastModified: t.createdAt ? new Date(t.createdAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const productUrls: MetadataRoute.Sitemap = products
      .filter((p: ProductCatalog) => !!p.id)
      .map((p: ProductCatalog) => ({
        url: `${baseUrl}/e-katalog/${p.id}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const articleUrls: MetadataRoute.Sitemap = articles
      .filter((a: Article) => !!a.id)
      .map((a: Article) => ({
        url: `${baseUrl}/artikel/${a.id}`,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    const eventUrls: MetadataRoute.Sitemap = events
      .filter((e: AppEvent) => !!e.id)
      .map((e: AppEvent) => ({
        url: `${baseUrl}/event/${e.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    const tenantUrls: MetadataRoute.Sitemap = tenants
      .filter((tn: Tenant) => !!tn.id)
      .map((tn: Tenant) => ({
        url: `${baseUrl}/ekosistem/${tn.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    return [...staticRoutes, ...trainingUrls, ...productUrls, ...articleUrls, ...eventUrls, ...tenantUrls];
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return staticRoutes;
  }
}
