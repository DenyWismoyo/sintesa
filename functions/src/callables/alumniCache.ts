import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const rebuildAlumniMasterCache = onCall(async (request) => {
  // 1. Keamanan: Pastikan yang memanggil adalah admin yang login
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Akses Ditolak: Anda harus login.');
  }

  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin_pelatihan'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache alumni.');
  }

  const appId = request.data.appId || 'blud-app-dev';

  try {
    // 2. Baca seluruh data alumni (Ini memakan N Reads, tetapi HANYA terjadi saat ada perubahan data, bukan setiap kali halaman dibuka)
    const snapshot = await db.collection('alumnis').orderBy('createdAt', 'desc').get();
    
    const compressedAlumnis: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // 3. Kompresi Payload: Hanya simpan field yang benar-benar ditampilkan di tabel & filter frontend
      // Kita pastikan format kosong/Belum bekerja berubah menjadi Proses Verifikasi di Database Cache
      compressedAlumnis.push({
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        programTaken: data.programTaken || '',
        trainingYear: data.trainingYear || data.graduationYear || '',
        batch: data.batch || '',
        status: data.status || 'DORMANT',
        registrationCode: data.registrationCode || '',
        employmentStatus: (!data.employmentStatus || data.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : data.employmentStatus,
        company: data.company || '',
        currentJob: data.currentJob || '',
        birthInfo: data.birthInfo || '',
        address: data.address || '',
        certificationResult: data.certificationResult || '',
        createdAt: data.createdAt || 0
      });
    });

    // 4. Simpan ke dalam SATU dokumen tunggal (Aggregated Document)
    // Dokumen ini yang nantinya akan di-fetch oleh frontend dengan biaya hanya 1 READ!
    await db.collection(`artifacts/${appId}/public/data/cache_alumnis`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAlumnis.length,
      data: compressedAlumnis // Array ribuan data
    });

    console.log(`[ALUMNI CACHE] Berhasil mengkompresi ${compressedAlumnis.length} data menjadi 1 dokumen cache.`);

    return { success: true, count: compressedAlumnis.length };

  } catch (error: any) {
    console.error("[ALUMNI CACHE ERROR] Gagal membangun ulang cache:", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache alumni: ' + error.message);
  }
});