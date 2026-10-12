// Lokasi file: functions/src/callables/jobCache.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Function: Rebuild Master Cache untuk Bursa Karir.
 * Menyimpan seluruh lowongan aktif & terarsip ke dalam 1 dokumen tunggal:
 * `artifacts/{appId}/public/data/cache_jobs` doc `master`
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
    const snapshot = await db.collection('jobs').orderBy('postedAt', 'desc').limit(250).get();
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
        description: data.description ? data.description.substring(0, 1500) : '',
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.slice(0, 5) : [],
        qualifications: Array.isArray(data.qualifications) ? data.qualifications.slice(0, 6) : [],
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

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedJobs.length,
      data: compressedJobs,
    };

    const sizeKB = Buffer.byteLength(JSON.stringify(cachePayload), 'utf8') / 1024;
    if (sizeKB > 850) {
      console.warn(`[JOB CACHE WARNING] Ukuran cache ${sizeKB.toFixed(1)} KB mendekati batas 1MB Firestore.`);
    }

    await db.collection(`artifacts/${appId}/public/data/cache_jobs`).doc('master').set(cachePayload);

    console.log(`[JOB CACHE] Berhasil kompresi & rebuild ${compressedJobs.length} lowongan (${sizeKB.toFixed(1)} KB) di artifacts/${appId}.`);
    return { success: true, count: compressedJobs.length, sizeKB: sizeKB.toFixed(1) };

  } catch (error: any) {
    console.error("[JOB CACHE ERROR]", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache karir: ' + error.message);
  }
});
