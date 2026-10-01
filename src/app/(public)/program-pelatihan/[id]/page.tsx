// Lokasi file: src/app/(public)/program-pelatihan/[id]/page.tsx

import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClientPage from './ClientPage';
import { Training } from '@/types'; // Import tipe data Training

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

// FASE 1: SEO & Dynamic Open Graph untuk Detail Pelatihan
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'trainings', resolvedParams.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { title: 'Program Tidak Ditemukan | KST Solo' };
    }

    const data = snap.data();
    const training = { id: snap.id, ...data } as Training;
    
    const title = `${training.title} | Pelatihan KST Solo Technopark`;
    const description = training.description?.substring(0, 160) || 'Ikuti pelatihan intensif dan tingkatkan keahlian Anda bersama KST Solo Technopark.';
    
    // API OG Dinamis Khusus Pelatihan (Bisa dipanggil jika Anda membuat endpointnya nanti)
    const formattedPrice = training.isFree ? 'GRATIS' : (training.price ? training.price.toLocaleString('id-ID') : 'Hubungi Kami');
    
    // Untuk saat ini kita fallback menggunakan API OG Katalog dengan parameter sedikit dimodifikasi
    const dynamicOgUrl = `${APP_URL}/api/og/katalog?title=${encodeURIComponent(training.title || '')}&price=${encodeURIComponent(formattedPrice)}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/program-pelatihan/${training.id}`,
        siteName: 'Solo Technopark',
        images: [
          {
            url: dynamicOgUrl,
            width: 1200,
            height: 630,
            alt: training.title,
          },
        ],
        locale: 'id_ID',
        type: 'article', // 'article' lebih cocok dari 'website' untuk detail kursus
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [dynamicOgUrl],
      },
      alternates: {
        canonical: `${APP_URL}/program-pelatihan/${training.id}`,
      }
    };
  } catch (error) {
    return { title: 'Program Pelatihan | KST Solo Technopark' };
  }
}

// FASE 2: JSON-LD Course Schema Injection
export default async function Page({ params }: Props) {
  let jsonLd = null;

  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'trainings', resolvedParams.id);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const training = snap.data() as Training;
      
      // Standar Schema.org untuk Kursus / Pelatihan (Google Course Carousel)
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: training.title,
        description: training.description,
        image: training.imageUrl || `${APP_URL}/placeholder-image.jpg`,
        provider: {
          '@type': 'Organization',
          name: 'Solo Technopark',
          sameAs: APP_URL
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: training.type === 'Offline' ? 'Onsite' : 'Online',
          courseWorkload: training.durationDisplay || 'PT10H', // Contoh ISO 8601 durasi
        },
        offers: {
          '@type': 'Offer',
          category: training.isFree ? 'Free' : 'Paid',
          priceCurrency: 'IDR',
          price: training.isFree ? 0 : (training.price || 0),
        }
      };
    }
  } catch (error) {
    console.warn("Gagal memuat JSON-LD untuk pelatihan di server:", error);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClientPage />
    </>
  );
}