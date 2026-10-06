// src/app/api/jobs/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jobDbService } from '@/services/jobDb.service';

export const dynamic = 'force-dynamic';

/**
 * GET: Mengambil status dan jadwal sinkronisasi lowongan pekerjaan
 */
export async function GET() {
  try {
    const metadata = await jobDbService.getSyncMetadata();
    const now = Date.now();
    const isDue = !metadata.lastSyncedAt || !metadata.nextSyncAt || now >= metadata.nextSyncAt;

    return NextResponse.json({
      success: true,
      metadata,
      isDue,
      nextSyncHuman: metadata.nextSyncAt
        ? new Date(metadata.nextSyncAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Belum dijadwalkan',
      lastSyncHuman: metadata.lastSyncedAt
        ? new Date(metadata.lastSyncedAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Belum pernah disinkronkan',
    });
  } catch (error: any) {
    console.error('[API /api/jobs/sync GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil metadata sinkronisasi: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Menjalankan sinkronisasi database mingguan dari RapidAPI ke Firestore
 * Mendukung parameter: ?force=true
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const result = await jobDbService.syncWeeklyJobs({ force });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      syncedCount: result.syncedCount,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('[API /api/jobs/sync POST] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses sinkronisasi lowongan: ' + error.message },
      { status: 500 }
    );
  }
}
