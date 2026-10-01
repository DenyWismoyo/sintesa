// Lokasi file: src/app/(public)/ekosistem/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import ClientPage from './ClientPage';
import { Tenant } from '@/types';
import { getServerDocRest } from '@/lib/serverFirestore';

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 60;

// Request deduplication dengan React.cache & Fast REST Fetch
const getTenantServerCached = cache(async (id: string): Promise<Tenant | null> => {
  return await getServerDocRest<Tenant>('tenants', id, 60);
});

// FASE 1: Supercharge generateMetadata dengan info Startup
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const tenant = await getTenantServerCached(id);

    if (!tenant) {
      return { title: 'Profil Startup | Ekosistem Solo Technopark' };
    }
    
    const title = `${tenant.name} - ${tenant.segment || 'Startup'} | Ekosistem KST Solo`;
    const description = tenant.elevatorPitch || tenant.companyDescription?.substring(0, 160) || `Lihat profil inovasi ${tenant.name} di Solo Technopark.`;
    const dynamicOgUrl = `${APP_URL}/api/og/ekosistem?name=${encodeURIComponent(tenant.name || '')}&segment=${encodeURIComponent(tenant.segment || 'StartUp')}&stage=${encodeURIComponent(tenant.fundingStage || 'Bootstrapped')}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/ekosistem/${id}`,
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
        canonical: `${APP_URL}/ekosistem/${id}`,
      }
    };
  } catch (error) {
    return { title: 'Profil Startup | Ekosistem Solo Technopark' };
  }
}

// FASE 2: JSON-LD Organization Schema Injection & Hydration ke ClientPage
export default async function Page({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantServerCached(id);

  let jsonLd = null;
  if (tenant) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: tenant.name,
      description: tenant.companyDescription || tenant.elevatorPitch,
      url: tenant.website ? (tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`) : `${APP_URL}/ekosistem/${id}`,
      logo: tenant.logoUrl || `${APP_URL}/placeholder-logo.png`,
      industry: tenant.sector || 'Teknologi',
      foundingDate: tenant.joinedAt,
      knowsAbout: tenant.techStack || []
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClientPage tenantId={id} initialTenant={tenant} />
    </>
  );
}