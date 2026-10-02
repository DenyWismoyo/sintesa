// Lokasi file: src/app/(public)/ekosistem/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import { getServerDocRest } from '@/lib/serverFirestore';
import { Tenant } from '@/types/tenant.types';
import TenantDetailClient from './ClientPage';

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 60;

const getTenantServerCached = cache(async (id: string): Promise<Tenant | null> => {
  return await getServerDocRest<Tenant>('tenants', id, 60);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const tenant = await getTenantServerCached(id);

    if (!tenant) {
      return { title: 'Profil Ekosistem & Tenant | KST Solo Technopark' };
    }

    const title = `${tenant.name} | Ekosistem Startup Solo Technopark`;
    const description = tenant.elevatorPitch || tenant.companyDescription?.substring(0, 160) || `Profil startup dan inovator ${tenant.name} yang bernaung di ekosistem Solo Technopark.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/ekosistem/${id}`,
        siteName: 'Solo Technopark',
        images: tenant.logoUrl ? [{ url: tenant.logoUrl, alt: tenant.name }] : [],
        locale: 'id_ID',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: tenant.logoUrl ? [tenant.logoUrl] : [],
      }
    };
  } catch {
    return { title: 'Profil Ekosistem & Tenant | KST Solo Technopark' };
  }
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params;
  const initialTenant = await getTenantServerCached(id);

  return <TenantDetailClient tenantId={id} initialTenant={initialTenant} />;
}