// src/app/api/jobs/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jobDbService } from '@/services/jobDb.service';
import { verifyApiRequestAuth } from '@/lib/firebaseAdmin';
import { canPerformAction, PERMISSIONS } from '@/config/roles';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
    const isCronAuthorized = Boolean(
      secret && authHeader && authHeader === `Bearer ${secret}`
    );

    if (!isCronAuthorized) {
      const authUser = await verifyApiRequestAuth(request);
      if (!authUser || !canPerformAction(authUser.role, PERMISSIONS.MANAGE_CAREER)) {
        return NextResponse.json(
          { success: false, message: 'Akses ditolak: Hanya Administrator Karir atau Cron Resmi yang diizinkan.' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body.force || searchParams.get('force') === 'true');

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
