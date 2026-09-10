// Lokasi file: src/app/(public)/e-katalog/[id]/page.tsx

import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClientPage from './ClientPage';
import { ProductCatalog } from '@/types'; // Tambahkan import tipe datanya di sini

type Props = {
  params: Promise<{ id: string }>
};

// Telah disesuaikan dengan domain produksi Anda
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sintesa.solotechnopark.id';

// FASE 1: Supercharge generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'catalogs', resolvedParams.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { title: 'Produk Tidak Ditemukan | KST Solo' };
    }

    const data = snap.data();
    // Beri tahu TypeScript bahwa ini adalah ProductCatalog
    const product = { id: snap.id, ...data } as ProductCatalog;
    
    const title = `${product.name} | E-Katalog KST Solo Technopark`;
    const description = product.shortDescription || product.description?.substring(0, 160) || 'Jelajahi inovasi dan produk dari KST Solo Technopark.';
    
    // FASE 3 INTEGRATION: Gunakan Dynamic OG API untuk link preview yang konsisten (1200x630)
    const formattedPrice = product.price ? product.price.toLocaleString('id-ID') : '0';
    const dynamicOgUrl = `${APP_URL}/api/og/katalog?title=${encodeURIComponent(product.name || '')}&price=${formattedPrice}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/e-katalog/${product.id || resolvedParams.id}`,
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
        // PERBAIKAN: Ubah 'product' menjadi 'website' agar diterima oleh TypeScript Next.js
        type: 'website', 
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [dynamicOgUrl],
      },
      alternates: {
        canonical: `${APP_URL}/e-katalog/${product.id || resolvedParams.id}`,
      }
    };
  } catch (error) {
    // Error di sini sudah aman karena ada try...catch, akan mengembalikan title default
    console.warn("Metadata fetch error (bisa diabaikan saat dev):", error);
    return { title: 'E-Katalog | KST Solo Technopark' };
  }
}

// FASE 2: Otomatisasi JSON-LD Structured Data
export default async function Page({ params }: Props) {
  let jsonLd = null;

  // PERBAIKAN: Bungkus proses fetch di komponen Page dengan try...catch
  // Untuk mencegah aplikasi crash jika koneksi gRPC Firebase Web SDK terputus di Server Node.js
  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'catalogs', resolvedParams.id);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      // Beri tahu TypeScript bahwa ini adalah ProductCatalog
      const product = snap.data() as ProductCatalog;
      
      // Format JSON-LD untuk Rich Snippet Google
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images?.[0] || `${APP_URL}/placeholder-image.jpg`,
        description: product.shortDescription || product.description,
        offers: {
          '@type': 'Offer',
          url: `${APP_URL}/e-katalog/${resolvedParams.id}`,
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
  } catch (error) {
    // Jika fetch JSON-LD gagal di server, abaikan saja.
    // ClientPage di bawah ini akan mengambil alih fetching data aktual untuk UI di browser.
    console.warn("Gagal memuat JSON-LD di sisi server (aman diabaikan saat dev):", error);
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
      
      {/* Panggil komponen client yang sudah ada */}
      <ClientPage />
    </>
  );
}