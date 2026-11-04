// Lokasi file: src/app/(public)/review-pelatihan/[id]/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ReviewPelatihanClientPage from '../ClientPage';
import { Loader2 } from 'lucide-react';
import { learningReviewService } from '@/services/learningReview.service';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = await learningReviewService.getReviewProgramById(params.id);
  const title = program
    ? `Ulasan: ${program.title} | Solo Technopark`
    : 'Ulasan Program Pelatihan Vokasi | Solo Technopark';
  const description =
    program?.shortDescription ||
    'Beri ulasan dan penilaian objektif untuk program pelatihan vokasi di Solo Technopark secara anonim, mudah, dan transparan tanpa perlu login.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: program?.imageUrl ? [program.imageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: program?.imageUrl ? [program.imageUrl] : undefined,
    },
  };
}

export default function DirectProgramReviewPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="font-bold text-slate-600 text-sm">Memuat portal ulasan pelatihan...</p>
        </div>
      }
    >
      <ReviewPelatihanClientPage initialProgramId={params.id} isDirectProgramPage={true} />
    </Suspense>
  );
}

