// Lokasi file: src/app/(public)/e-katalog/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import ClientPage from './ClientPage';
import { ProductCatalog } from '@/types';
import { catalogService } from '@/services/catalog.service';
import { getServerDocRest } from '@/lib/serverFirestore';

type Props = {
  params: Promise<{ id: string }>
};

// Telah disesuaikan dengan domain produksi Anda
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

// OPTIMASI 1: ISR Edge Caching (Cache 60 detik di level CDN/Server)
export const revalidate = 60;

// OPTIMASI 2: Request Deduplication dengan React.cache & Fast REST Fetch
const getProductServerCached = cache(async (id: string): Promise<ProductCatalog | null> => {
  return await getServerDocRest<ProductCatalog>('catalogs', id, 60);
});

// OPTIMASI 3: Pre-generate daftar ID untuk routing & prefetching instan di CDN
export async function generateStaticParams() {
  try {
    const products = await catalogService.getProducts(100);
    return products.map(p => ({ id: p.id }));
  } catch {
    return [];
  }
}

// FASE 1: Supercharge generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await getProductServerCached(id);

    if (!product) {
      return { title: 'Detail Layanan | E-Katalog KST Solo Technopark' };
    }
    
    const title = `${product.name} | E-Katalog KST Solo Technopark`;
    const description = product.shortDescription || product.description?.substring(0, 160) || 'Jelajahi inovasi dan produk dari KST Solo Technopark.';
    
    // Dynamic OG API untuk link preview yang konsisten
    const formattedPrice = product.price ? product.price.toLocaleString('id-ID') : '0';
    const dynamicOgUrl = `${APP_URL}/api/og/katalog?title=${encodeURIComponent(product.name || '')}&price=${formattedPrice}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/e-katalog/${product.id || id}`,
        siteName: 'Solo Technopark',
        images: [
          {
            url: dynamicOgUrl,
            width: 1200,
            height: 630,
            alt: product.name || 'Produk KST',
          },
        ],
        locale: 'id_ID',
        type: 'website', 
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [dynamicOgUrl],
      },
      alternates: {
        canonical: `${APP_URL}/e-katalog/${product.id || id}`,
      }
    };
  } catch (error) {
    console.warn("Metadata fetch error (bisa diabaikan saat dev):", error);
    return { title: 'E-Katalog | KST Solo Technopark' };
  }
}

// FASE 2: Page Component dengan data hydration langsung ke ClientPage
export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await getProductServerCached(id);

  let jsonLd = null;
  if (product) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images?.[0] || `${APP_URL}/placeholder-image.jpg`,
      description: product.shortDescription || product.description,
      offers: {
        '@type': 'Offer',
        url: `${APP_URL}/e-katalog/${id}`,
        priceCurrency: 'IDR',
        price: product.price || 0,
        availability: product.isPublished ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      },
      brand: {
        '@type': 'Brand',
        name: product.tenantName || (product.ownerType === 'TENANT' ? 'Tenant KST' : 'Internal BLUD KST Solo')
      }
    };
  }

  return (
    <>
      {/* Inject JSON-LD Script ke Head jika berhasil didapatkan */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* OPTIMASI 4: Kirim product yang sudah di-fetch ke ClientPage agar loading instan */}
      <ClientPage initialProduct={product} />
    </>
  );
}