// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MASTER_JOBS } from '@/data/jobs/masterJobs';
import { filterAndSortJobs } from '@/services/job.service';
import { fetchJSearchJobs } from '@/services/jsearch.service';
import { JobListing } from '@/types/job.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Ambil parameter filter
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const workType = searchParams.get('workType') || undefined;
    const workSetup = searchParams.get('workSetup') || undefined;
    const experienceLevel = searchParams.get('experienceLevel') || undefined;
    const trainingProgram = searchParams.get('trainingProgram') || undefined;
    const isStpPartnerParam = searchParams.get('isStpPartner');
    const isStpPartner = isStpPartnerParam !== null ? isStpPartnerParam === 'true' : undefined;
    const sourceParam = (searchParams.get('source') as any) || 'all';
    const sort = (searchParams.get('sort') as any) || 'newest';

    // 1. Ambil data lowongan realtime dari JSearch jika API Key tersedia
    const hasApiKey = Boolean(process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY);
    let realtimeJobs: JobListing[] = [];
    let isRealtimeActive = false;

    if (hasApiKey && sourceParam !== 'stp_partner') {
      try {
        const jsearchResult = await fetchJSearchJobs({
          query,
          category,
          location: 'Surakarta, Solo, Jawa Tengah, Indonesia',
        });
        realtimeJobs = jsearchResult.jobs;
        isRealtimeActive = jsearchResult.isRealtime;
      } catch (jsearchErr) {
        console.warn('[API /api/jobs] Gagal menarik data realtime JSearch:', jsearchErr);
      }
    }

    // 2. Gabungkan data: Mitra Kawasan Solo Technopark + Lowongan Realtime Industri
    // Berikan tag source eksplisit pada master jobs jika belum ada
    const localMasterJobs: JobListing[] = MASTER_JOBS.map((j) => ({
      ...j,
      source: j.source || 'stp_partner',
    }));

    const combinedPool: JobListing[] = [...localMasterJobs, ...realtimeJobs];

    // Ambil detail jika parameter id diberikan
    const jobId = searchParams.get('id');
    if (jobId) {
      const job = combinedPool.find((j) => j.id === jobId || j.slug === jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, message: 'Lowongan pekerjaan tidak ditemukan.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }

    // 3. Filter dan sort seluruh pool lowongan
    const result = filterAndSortJobs(combinedPool, {
      query,
      category,
      workType,
      workSetup,
      experienceLevel,
      trainingProgram,
      isStpPartner,
      source: sourceParam,
      sort,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
        meta: {
          isRealtimeEnabled: hasApiKey,
          isRealtimeActive,
          realtimeJobsCount: realtimeJobs.length,
          stpMasterJobsCount: localMasterJobs.length,
          provider: hasApiKey ? 'JSearch RapidAPI' : 'Internal Master STP',
        },
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
