// Lokasi file: src/app/(public)/jasa-produksi/page.tsx
import { Metadata } from 'next';
import JasaProduksiPublicClient from './ClientPage';

export const metadata: Metadata = {
  title: 'Layanan Jasa Produksi & Manufaktur Presisi | Solo Technopark',
  description: 'Pusat layanan permesinan CNC 5-Axis, simulasi pengelasan, 3D printing industri, reverse engineering, dan fabrikasi logam presisi Solo Technopark.',
  keywords: ['jasa cnc solo', 'manufaktur presisi stp', '3d printing solo technopark', 'reverse engineering', 'fabrikasi logam blud'],
};

export default function JasaProduksiPublicPage() {
  return <JasaProduksiPublicClient />;
}

