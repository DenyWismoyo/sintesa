// src/app/(public)/investor-room/page.tsx
import { Metadata } from 'next';
import InvestorRoomClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Investor Virtual Deal Room & Matchmaking | Solo Technopark',
  description: 'Ruang kurasi investasi privat dan deal room ber-NDA untuk investor venture capital dan angel investor.',
};

export default function InvestorRoomPage() {
  return <InvestorRoomClientPage />;
}

