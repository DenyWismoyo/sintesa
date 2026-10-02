import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const rebuildTenantMasterCache = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Akses Ditolak: Anda harus login.');
  }

  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin_tenant'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache tenant.');
  }

  const appId = request.data.appId || 'blud-app-dev';

  try {
    const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
    const compressedTenants: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      compressedTenants.push({
        id: doc.id,
        name: data.name || '',
        ownerName: data.ownerName || '',
        email: data.email || '',
        contact: data.contact || '',
        sector: data.sector || 'Lainnya',
        segment: data.segment || 'StartUp',
        status: data.status || 'Aktif',
        pipelineStage: data.pipelineStage || 'Pra-Inkubasi',
        currentHealthScore: data.currentHealthScore || 'Unknown',
        logoUrl: data.logoUrl || '',
        coverImageUrl: data.coverImageUrl || '', // PERBAIKAN BUG: Ditambahkan
        elevatorPitch: data.elevatorPitch || '', // PERBAIKAN BUG: Ditambahkan
        isRaising: data.isRaising || false,
        fundingStage: data.fundingStage || 'Bootstrapped',
        isVerified: data.isVerified || false,
        createdAt: data.createdAt || 0
      });
    });

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedTenants.length,
      data: compressedTenants 
    };

    const sizeKB = Buffer.byteLength(JSON.stringify(cachePayload), 'utf8') / 1024;
    if (sizeKB > 850) {
      console.warn(`[TENANT CACHE WARNING] Ukuran cache tenant ${sizeKB.toFixed(1)} KB mendekati batas 1MB Firestore.`);
    }

    await db.collection(`artifacts/${appId}/public/data/cache_tenants`).doc('master').set(cachePayload);

    console.log(`[TENANT CACHE] Berhasil mengkompresi ${compressedTenants.length} data tenant (${sizeKB.toFixed(1)} KB).`);
    return { success: true, count: compressedTenants.length };

  } catch (error: any) {
    console.error("[TENANT CACHE ERROR]", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache: ' + error.message);
  }
});