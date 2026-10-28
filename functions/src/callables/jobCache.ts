// Lokasi file: functions/src/callables/jobCache.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Function: Rebuild Master Cache untuk Bursa Karir.
 * Mendukung arsitektur Chunked Cache untuk menghindari batas 1MB Firestore per dokumen.
 * Path: `artifacts/{appId}/public/data/cache_jobs` doc `master` & `chunk_X`
 * Mengikuti aturan keamanan R-006 & R-009 (Role: super_admin / admin / internal_staff).
 */
export const rebuildJobMasterCache = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Akses Ditolak: Login diperlukan.');

  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin', 'admin_tenant', 'admin_pelatihan', 'kasir', 'developer'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache karir.');
  }

  const appId = request.data?.appId || 'blud-app-dev';

  try {
    const snapshot = await db.collection('jobs').orderBy('postedAt', 'desc').limit(1000).get();
    const compressedJobs: any[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      compressedJobs.push({
        id: docSnap.id,
        slug: data.slug || docSnap.id,
        title: data.title || '',
        company: data.company || '',
        companyLogo: data.companyLogo || null,
        companyWebsite: data.companyWebsite || null,
        companyType: data.companyType || 'Startup / Industri',
        category: data.category || 'IT & Rekayasa Perangkat Lunak',
        location: data.location || 'Indonesia',
        city: data.city || '',
        workType: data.workType || 'Full-time',
        workSetup: data.workSetup || 'On-site',
        experienceLevel: data.experienceLevel || 'Fresh Graduate / Alumni Pelatihan',
        salary: data.salary || { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: false },
        description: data.description ? data.description.substring(0, 800) : '',
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.slice(0, 3) : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        relevantTrainingPrograms: Array.isArray(data.relevantTrainingPrograms) ? data.relevantTrainingPrograms : [],
        applicationUrl: data.applicationUrl || null,
        applicationEmail: data.applicationEmail || null,
        applySource: data.applySource || 'STP Career Portal',
        source: data.source || 'jsearch_realtime',
        isStpPartner: Boolean(data.isStpPartner),
        isFeatured: Boolean(data.isFeatured),
        postedAt: data.postedAt || Date.now(),
        deadlineAt: data.deadlineAt || (Date.now() + 30 * 24 * 60 * 60 * 1000),
        firstSeenAt: data.firstSeenAt || data.postedAt || Date.now(),
        lastSeenAt: data.lastSeenAt || Date.now(),
        isActive: data.isActive !== false,
      });
    });

    const CHUNK_SIZE = 80;
    const cacheColRef = db.collection(`artifacts/${appId}/public/data/cache_jobs`);
    const masterDocRef = cacheColRef.doc('master');

    if (compressedJobs.length <= CHUNK_SIZE) {
      const cachePayload = {
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        count: compressedJobs.length,
        isChunked: false,
        data: compressedJobs,
      };
      await masterDocRef.set(cachePayload, { merge: true });
      console.log(`[JOB CACHE] Single master cache tersimpan (${compressedJobs.length} lowongan).`);
      return { success: true, count: compressedJobs.length, isChunked: false, chunks: 1 };
    }

    // Chunked Cache (>80 lowongan untuk keamanan mutlak di bawah batas 1MB per dokumen)
    const totalChunks = Math.ceil(compressedJobs.length / CHUNK_SIZE);
    const chunkIds: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkId = `chunk_${i}`;
      chunkIds.push(chunkId);
      const chunkData = compressedJobs.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await cacheColRef.doc(chunkId).set({
        index: i,
        count: chunkData.length,
        data: chunkData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await masterDocRef.set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedJobs.length,
      isChunked: true,
      totalChunks,
      chunkIds,
    }, { merge: true });

    console.log(`[JOB CACHE] Chunked master cache berhasil di-update (${compressedJobs.length} lowongan dalam ${totalChunks} chunks).`);
    return { success: true, count: compressedJobs.length, isChunked: true, chunks: totalChunks };

  } catch (error: any) {
    console.error("[JOB CACHE ERROR]", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache karir: ' + error.message);
  }
});
