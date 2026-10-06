// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { filterAndSortJobs } from '@/services/job.service';
import { jobDbService } from '@/services/jobDb.service';
import { JobListing } from '@/types/job.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Ambil detail jika parameter id diberikan
    const jobId = searchParams.get('id');
    if (jobId) {
      const job = await jobDbService.getJobById(jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, message: 'Lowongan pekerjaan tidak ditemukan.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }

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

    // 1. Ambil data langsung dari Database (murni dari internet)
    let jobsFromDb = await jobDbService.getJobsFromFirestore();

    // 2. Jika Database masih kosong, lakukan inisialisasi / sinkronisasi dari RapidAPI
    if (jobsFromDb.length === 0) {
      try {
        const syncRes = await jobDbService.syncWeeklyJobs({ force: true });
        if (syncRes.success) {
          jobsFromDb = await jobDbService.getJobsFromFirestore();
        }
      } catch (initErr) {
        console.warn('[API /api/jobs] Gagal initial sync ke Firestore:', initErr);
      }
    }

    // Murni seluruh data yang ditarik dari internet (RapidAPI JSearch)
    const activePool: JobListing[] = jobsFromDb;

    // 3. Filter dan sort seluruh pool lowongan
    const result = filterAndSortJobs(activePool, {
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

    const syncMeta = await jobDbService.getSyncMetadata();

    return NextResponse.json(
      {
        success: true,
        ...result,
        meta: {
          databaseStorage: 'Cloud Firestore (koleksi: jobs)',
          totalInDatabase: activePool.length,
          lastSyncedAt: syncMeta.lastSyncedAt,
          nextSyncAt: syncMeta.nextSyncAt,
          syncIntervalDays: syncMeta.syncIntervalDays || 7,
          isRealtimeEnabled: Boolean(process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY),
          provider: syncMeta.provider || 'JSearch RapidAPI',
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
