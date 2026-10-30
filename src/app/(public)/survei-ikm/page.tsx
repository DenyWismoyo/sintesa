// src/app/(public)/survei-ikm/page.tsx
import { Metadata } from 'next';
import SurveiIkmClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Survei Kepuasan Masyarakat (IKM) | Solo Technopark',
  description: 'Kuesioner evaluasi kualitas pelayanan publik Solo Technopark sesuai PermenPAN-RB No. 14 Tahun 2017.',
};

export default function SurveiIkmPage() {
  return <SurveiIkmClientPage />;
}

