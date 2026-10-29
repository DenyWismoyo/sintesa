// Lokasi file: src/app/(public)/fasilitas/[id]/sewa/page.tsx
import { Metadata } from 'next';
import { cache } from 'react';
import { getServerDocRest } from '@/lib/serverFirestore';
import { Asset } from '@/types/asset.types';
import RoomDetailClient from '../ClientPage';

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

const getAssetServerCached = cache(async (id: string): Promise<Asset | null> => {
  return await getServerDocRest<Asset>('assets', id, 60);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const room = await getAssetServerCached(id);
  if (!room) {
    return { title: 'Formulir Sewa Fasilitas | KST Solo Technopark' };
  }
  return {
    title: `Ajukan Sewa ${room.name} | KST Solo Technopark`,
    description: `Formulir reservasi dan pengajuan peminjaman resmi ${room.name} di Kawasan Sains dan Teknologi Solo Technopark.`,
  };
}

export default async function RoomBookingWorkspacePage({ params }: Props) {
  const { id } = await params;
  const initialRoom = await getAssetServerCached(id);
  return <RoomDetailClient roomId={id} initialRoom={initialRoom} defaultOpenBooking={true} />;
}

