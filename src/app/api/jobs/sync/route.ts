// src/app/api/jobs/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jobDbService } from '@/services/jobDb.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || 'blud-cron-secret';

    // Simple security bearer token check
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token !== secret && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, message: 'Akses tidak diizinkan.' },
          { status: 401 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const force = Boolean(body.force);

    console.log(`[API /api/jobs/sync] Memicu sinkronisasi mingguan kumulatif (force: ${force})...`);
    const result = await jobDbService.syncWeeklyJobs({ force });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      syncedCount: result.syncedCount,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('[API /api/jobs/sync] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menjalankan sinkronisasi: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const meta = await jobDbService.getSyncMetadata();
    return NextResponse.json({
      success: true,
      metadata: meta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil metadata sinkronisasi: ' + error.message },
      { status: 500 }
    );
  }
}
