// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MASTER_JOBS } from '@/data/jobs/masterJobs';
import { filterAndSortJobs } from '@/services/job.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Ambil detail jika parameter id diberikan
    const jobId = searchParams.get('id');
    if (jobId) {
      const job = MASTER_JOBS.find((j) => j.id === jobId || j.slug === jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, message: 'Lowongan pekerjaan tidak ditemukan.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }

    // Filter daftar lowongan
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const workType = searchParams.get('workType') || undefined;
    const workSetup = searchParams.get('workSetup') || undefined;
    const experienceLevel = searchParams.get('experienceLevel') || undefined;
    const trainingProgram = searchParams.get('trainingProgram') || undefined;
    const isStpPartnerParam = searchParams.get('isStpPartner');
    const isStpPartner = isStpPartnerParam !== null ? isStpPartnerParam === 'true' : undefined;
    const sort = (searchParams.get('sort') as any) || 'newest';

    const result = filterAndSortJobs(MASTER_JOBS, {
      query,
      category,
      workType,
      workSetup,
      experienceLevel,
      trainingProgram,
      isStpPartner,
      sort,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/jobs] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses data lowongan pekerjaan: ' + error.message },
      { status: 500 }
    );
  }
}
