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
  const allowedRoles = ['super_admin', 'admin', 'direktur', 'admin_pelatihan', 'operator_pelatihan'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache alumni.');
  }

  const appId = request.data.appId || 'blud-app-dev';

  try {
    // 2. Baca seluruh data alumni tanpa filter orderBy di query Firestore agar dokumen tanpa createdAt tidak terlewat
    const snapshot = await db.collection('alumnis').get();
    
    const compressedAlumnis: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      compressedAlumnis.push({
        id: doc.id,
        name: data.name || '',
        nik: data.nik || '',
        gender: data.gender || '',
        domicile: data.domicile || '',
        age: data.age || undefined,
        uniformSize: data.uniformSize || '',
        shoeSize: data.shoeSize || '',
        phone: data.phone || '',
        email: data.email || '',
        programTaken: data.programTaken || '',
        trainingYear: data.trainingYear || data.graduationYear || '',
        graduationYear: data.graduationYear || data.trainingYear || '',
        batch: data.batch || '',
        status: data.status || 'DORMANT',
        registrationCode: data.registrationCode || '',
        certificateNumber: data.certificateNumber || '',
        employmentStatus: (!data.employmentStatus || data.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : data.employmentStatus,
        company: data.company || '',
        currentJob: data.currentJob || '',
        birthInfo: data.birthInfo || '',
        address: data.address || '',
        postCode: data.postCode || '',
        certificationResult: data.certificationResult || '',
        originSource: data.originSource || 'STP_VOKASI',
        originInstitution: data.originInstitution || '',
        partnerInstitution: data.partnerInstitution || '',
        targetPlacement: data.targetPlacement || '',
        targetCountry: data.targetCountry || '',
        courseStartDate: data.courseStartDate || '',
        courseEndDate: data.courseEndDate || '',
        district: data.district || '',
        photoUrl: data.photoUrl || '',
        isVerified: Boolean(data.isVerified),
        isLookingForJob: Boolean(data.isLookingForJob),
        internalStatus: data.internalStatus || 'AVAILABLE',
        skills: Array.isArray(data.skills) ? data.skills : [],
        tools: Array.isArray(data.tools) ? data.tools : [],
        bio: data.bio || '',
        experienceLevel: data.experienceLevel || '',
        industry: data.industry || '',
        workSetup: data.workSetup || '',
        education: data.education || '',
        major: data.major || '',
        portfolioUrl: data.portfolioUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        githubUrl: data.githubUrl || '',
        resumeFileUrl: data.resumeFileUrl || data.resumeUrl || '',
        createdAt: data.createdAt || 0
      });
    });

    compressedAlumnis.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 4. Simpan ke dalam SATU dokumen tunggal (Aggregated Document)
    await db.collection(`artifacts/${appId}/public/data/cache_alumnis`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAlumnis.length,
      data: compressedAlumnis
    });

    console.log(`[ALUMNI CACHE] Berhasil mengkompresi ${compressedAlumnis.length} data menjadi 1 dokumen cache.`);

    return { success: true, count: compressedAlumnis.length };

  } catch (error: any) {
    console.error("[ALUMNI CACHE ERROR] Gagal membangun ulang cache:", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache alumni: ' + error.message);
  }
});
