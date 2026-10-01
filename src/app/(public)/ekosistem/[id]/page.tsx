// Lokasi file: src/app/(public)/ekosistem/[id]/page.tsx

import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClientPage from './ClientPage';
import { Tenant } from '@/types'; // Import tipe data Tenant

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

// FASE 1: Supercharge generateMetadata dengan info Startup
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'tenants', resolvedParams.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { title: 'Profil Tidak Ditemukan | Ekosistem KST Solo' };
    }

    const tenant = snap.data() as Tenant;
    
    const title = `${tenant.name} - ${tenant.segment || 'Startup'} | Ekosistem KST Solo`;
    const description = tenant.elevatorPitch || tenant.companyDescription?.substring(0, 160) || `Lihat profil inovasi ${tenant.name} di Solo Technopark.`;
    
    // API OG Dinamis Khusus Startup/Ekosistem
    const dynamicOgUrl = `${APP_URL}/api/og/ekosistem?name=${encodeURIComponent(tenant.name || '')}&segment=${encodeURIComponent(tenant.segment || 'StartUp')}&stage=${encodeURIComponent(tenant.fundingStage || 'Bootstrapped')}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/ekosistem/${resolvedParams.id}`,
        siteName: 'Solo Technopark Ekosistem',
        images: [
          {
            url: dynamicOgUrl,
            width: 1200,
            height: 630,
            alt: `Profil ${tenant.name}`,
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
        canonical: `${APP_URL}/ekosistem/${resolvedParams.id}`,
      }
    };
  } catch (error) {
    console.warn("Metadata fetch error:", error);
    return { title: 'Profil Startup | Ekosistem Solo Technopark' };
  }
}

// FASE 2: JSON-LD Organization Schema Injection
export default async function Page({ params }: Props) {
  let jsonLd = null;

  try {
    const resolvedParams = await params;
    const docRef = doc(db, 'tenants', resolvedParams.id);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const tenant = snap.data() as Tenant;
      
      // Standar Schema.org untuk Organisasi/Perusahaan
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: tenant.name,
        description: tenant.companyDescription || tenant.elevatorPitch,
        url: tenant.website ? (tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`) : `${APP_URL}/ekosistem/${resolvedParams.id}`,
        logo: tenant.logoUrl || `${APP_URL}/placeholder-logo.png`,
        industry: tenant.sector || 'Teknologi',
        foundingDate: tenant.joinedAt,
        knowsAbout: tenant.techStack || []
      };
    }
  } catch (error) {
    console.warn("Gagal memuat JSON-LD di sisi server:", error);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Lempar ID ke ClientPage agar memuat data dinamis */}
      <ClientPage tenantId={(await params).id} />
    </>
  );
}