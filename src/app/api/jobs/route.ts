// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { filterAndSortJobs } from '@/services/job.service';
import { jobDbService } from '@/services/jobDb.service';
import { JobListing } from '@/types/job.types';
import { verifyApiRequestAuth, getAdminDefaultDb } from '@/lib/firebaseAdmin';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { removeUndefinedFields } from '@/lib/presensi/firebase-admin';

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
    const locationRegion = (searchParams.get('locationRegion') as any) || 'all';
    const freshness = (searchParams.get('freshness') as any) || 'all';
    const sort = (searchParams.get('sort') as any) || 'newest';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const statusParam = (searchParams.get('status') as any) || undefined;
    const approvalStatus = (searchParams.get('approvalStatus') as any) || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;

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
      locationRegion,
      freshness,
      sort,
      includeInactive,
      status: statusParam,
      approvalStatus,
      partnerId,
      tenantId,
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
          'Cache-Control': includeInactive
            ? 'no-store, no-cache, must-revalidate, max-age=0'
            : 'public, s-maxage=15, stale-while-revalidate=60',
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

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyApiRequestAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan untuk mengelola lowongan kerja.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const isCareerAdmin = canPerformAction(authUser.role, PERMISSIONS.MANAGE_CAREER);
    const canSubmitDraft = canPerformAction(authUser.role, PERMISSIONS.SUBMIT_PARTNER_JOB);

    // 1. Aksi Force Sync API (Khusus Admin Bursa Karir)
    if (body.action === 'sync') {
      if (!isCareerAdmin) {
        return NextResponse.json(
          { success: false, message: 'Hanya Administrator Karir yang dapat memicu sinkronisasi.' },
          { status: 403 }
        );
      }
      const syncResult = await jobDbService.syncWeeklyJobs({ force: true });
      return NextResponse.json({
        success: syncResult.success,
        syncedCount: syncResult.syncedCount,
        metadata: syncResult.metadata,
        message: syncResult.message,
      });
    }

    if (!isCareerAdmin && !canSubmitDraft) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki izin untuk mempublikasikan lowongan.' },
        { status: 403 }
      );
    }

    // 2. Aksi Tambah Lowongan Baru (Admin langsung APPROVED; Mitra/Tenant masuk antrean PENDING_APPROVAL)
    const sanitizedPayload: Partial<JobListing> = isCareerAdmin
      ? {
          ...body,
          submittedByUid: authUser.uid,
          approvalStatus: body.approvalStatus || 'APPROVED',
          isActive: body.isActive !== undefined ? body.isActive : true,
        }
      : {
          ...body,
          source: 'stp_partner',
          isStpPartner: true,
          isFeatured: false,
          isActive: false,
          approvalStatus: 'PENDING_APPROVAL',
          submittedByUid: authUser.uid,
          partnerId: authUser.partnerId || body.partnerId,
          tenantId: authUser.tenantId || body.tenantId,
          companyType: authUser.role === 'tenant' ? 'Tenant Inkubasi Startup STP' : 'Mitra Industri STP',
        };

    const newJob = await jobDbService.createJob(sanitizedPayload);

    // Pastikan tersimpan persisten via Firebase Admin SDK (bypass client rules di server runtime)
    try {
      await getAdminDefaultDb()
        .collection('jobs')
        .doc(newJob.id)
        .set(removeUndefinedFields(newJob), { merge: true });
    } catch (adminErr) {
      console.warn('[API /api/jobs POST] Fallback local snapshot digunakan:', adminErr);
    }

    return NextResponse.json({
      success: true,
      job: newJob,
      message: isCareerAdmin
        ? 'Lowongan pekerjaan berhasil ditambahkan dan ditayangkan.'
        : 'Draf lowongan berhasil dikirim dan menunggu persetujuan Admin Karir STP.',
    });
  } catch (error: any) {
    console.error('[API /api/jobs POST] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menyimpan lowongan.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyApiRequestAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    const isCareerAdmin = canPerformAction(authUser.role, PERMISSIONS.MANAGE_CAREER);
    const canSubmitDraft = canPerformAction(authUser.role, PERMISSIONS.SUBMIT_PARTNER_JOB);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID lowongan wajib disertakan.' },
        { status: 400 }
      );
    }

    let safeUpdates: Partial<JobListing> = updates;

    if (!isCareerAdmin) {
      if (!canSubmitDraft) {
        return NextResponse.json(
          { success: false, message: 'Hak akses tidak mencukupi.' },
          { status: 403 }
        );
      }
      const existing = await jobDbService.getJobById(id);
      if (!existing || existing.submittedByUid !== authUser.uid) {
        return NextResponse.json(
          { success: false, message: 'Anda hanya dapat mengubah draf lowongan milik instansi Anda.' },
          { status: 403 }
        );
      }
      safeUpdates = {
        ...updates,
        approvalStatus: 'PENDING_APPROVAL',
        isActive: false,
        isFeatured: false,
      };
    }

    const success = await jobDbService.updateJob(id, safeUpdates);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Lowongan tidak ditemukan atau gagal diperbarui.' },
        { status: 404 }
      );
    }

    try {
      await getAdminDefaultDb()
        .collection('jobs')
        .doc(id)
        .set(removeUndefinedFields({ ...safeUpdates, lastSeenAt: Date.now() }), { merge: true });
    } catch (adminErr) {
      console.warn('[API /api/jobs PUT] Admin Firestore sync dilewati:', adminErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Data lowongan berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('[API /api/jobs PUT] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui lowongan.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyApiRequestAuth(request);
    if (!authUser || !canPerformAction(authUser.role, PERMISSIONS.MANAGE_CAREER)) {
      return NextResponse.json(
        { success: false, message: 'Hanya Administrator Karir yang diizinkan menghapus lowongan.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Parameter id wajib disertakan.' },
        { status: 400 }
      );
    }

    const success = await jobDbService.deleteJob(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Lowongan tidak ditemukan atau gagal dihapus.' },
        { status: 404 }
      );
    }

    try {
      await getAdminDefaultDb().collection('jobs').doc(id).delete();
    } catch {
      // Abaikan jika dokumen tidak ada di Firestore
    }

    return NextResponse.json({
      success: true,
      message: 'Lowongan berhasil dihapus dari database.',
    });
  } catch (error: any) {
    console.error('[API /api/jobs DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus lowongan.' },
      { status: 500 }
    );
  }
}
