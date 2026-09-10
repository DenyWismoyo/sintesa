import { Metadata } from 'next';
import ClientThreadPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Detail Diskusi Ekosistem | KST Smart Hub',
  description: 'Forum kolaborasi, riset, dan pendanaan di kawasan ekosistem Solo Technopark.',
};

export default async function HubThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ClientThreadPage threadId={resolvedParams.id} />;
}