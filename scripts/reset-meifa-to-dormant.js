/**
 * Script Reset Akun Alumni Meifa Annastasya ke DORMANT
 * dan melepaskan tautan akun dari user penguji.
 */

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
const saPath = path.join(__dirname, '..', 'service-account-katalog.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(saPath)),
    projectId: 'katalog-solo-technopark',
  });
}
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function resetMeifa() {
  console.log('=== MEMULAI RESET STATUS ALUMNI MEIFA ANNASTASYA ===');

  const alumniId = '6nZza8bfrpPxjLMnE1EX';
  const alumniRef = db.collection('alumnis').doc(alumniId);
  const alumniSnap = await alumniRef.get();

  if (!alumniSnap.exists) {
    console.error(`Dokumen alumni ${alumniId} tidak ditemukan!`);
    process.exit(1);
  }

  const alumniData = alumniSnap.data();
  console.log(`Ditemukan data alumni: ${alumniData.name} | Status saat ini: ${alumniData.status}`);

  const claimedUserId = alumniData.claimedByUserId;

  // 1. Reset Dokumen Alumni ke DORMANT
  const resetPayload = {
    status: 'DORMANT',
    isVerified: false,
    claimedByUserId: admin.firestore.FieldValue.delete(),
    claimedAt: admin.firestore.FieldValue.delete(),
    isLookingForJob: false,
    githubUrl: admin.firestore.FieldValue.delete(),
    linkedinUrl: admin.firestore.FieldValue.delete(),
    portfolioUrl: admin.firestore.FieldValue.delete(),
    resumeFileUrl: admin.firestore.FieldValue.delete(),
    bio: admin.firestore.FieldValue.delete(),
    skills: admin.firestore.FieldValue.delete(),
    tools: admin.firestore.FieldValue.delete(),
    certifications: admin.firestore.FieldValue.delete(),
    projects: admin.firestore.FieldValue.delete(),
    experienceLevel: admin.firestore.FieldValue.delete(),
    industry: admin.firestore.FieldValue.delete(),
    workSetup: admin.firestore.FieldValue.delete(),
    education: admin.firestore.FieldValue.delete(),
    major: admin.firestore.FieldValue.delete(),
    languages: admin.firestore.FieldValue.delete(),
    company: '',
    currentJob: '',
    employmentStatus: 'Proses Verifikasi',
    updatedAt: Date.now()
  };

  await alumniRef.update(resetPayload);
  console.log(`✓ Dokumen alumni ${alumniId} berhasil direset menjadi DORMANT.`);

  // 2. Bersihkan Dokumen Users & Custom Claims jika ada
  if (claimedUserId) {
    console.log(`Membersihkan tautan pada user UID: ${claimedUserId}...`);
    const userRef = db.collection('users').doc(claimedUserId);
    await userRef.update({
      alumniId: admin.firestore.FieldValue.delete(),
      isAlumni: admin.firestore.FieldValue.delete(),
      alumniOrigin: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✓ Field alumni pada users/${claimedUserId} berhasil dihapus.`);

    // Bersihkan custom claims di Firebase Auth
    try {
      const userRecord = await admin.auth().getUser(claimedUserId);
      const claims = { ...(userRecord.customClaims || {}) };
      delete claims.alumniId;
      delete claims.isAlumni;

      await admin.auth().setCustomUserClaims(claimedUserId, claims);
      console.log(`✓ Firebase Auth Custom Claims untuk UID ${claimedUserId} berhasil diperbarui:`, claims);
    } catch (authErr) {
      console.warn(`! Peringatan saat update custom claims auth: ${authErr.message}`);
    }
  }

  // 3. Sinkronisasi Master Cache Alumni (artifacts/blud-app-dev/public/data/cache_alumnis/master)
  console.log('Menyinkronkan master cache alumni...');
  const allAlumnisSnap = await db.collection('alumnis').orderBy('createdAt', 'desc').get();
  const compressed = [];

  allAlumnisSnap.forEach(d => {
    const data = d.data();
    compressed.push({
      id: d.id,
      name: data.name || '',
      nik: data.nik || '',
      gender: data.gender || '',
      domicile: data.domicile || '',
      age: data.age || null,
      uniformSize: data.uniformSize || '',
      shoeSize: data.shoeSize || '',
      phone: data.phone || '',
      email: data.email || '',
      programTaken: data.programTaken || '',
      trainingYear: data.trainingYear || data.graduationYear || '',
      batch: data.batch || '',
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
      status: data.status || 'DORMANT',
      registrationCode: data.registrationCode || '',
      employmentStatus: (!data.employmentStatus || data.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : data.employmentStatus,
      company: data.company || '',
      currentJob: data.currentJob || '',
      birthInfo: data.birthInfo || '',
      address: data.address || '',
      certificationResult: data.certificationResult || '',
      createdAt: data.createdAt || 0,
    });
  });

  const appId = 'blud-app-dev';
  const cacheRef = db.collection(`artifacts/${appId}/public/data/cache_alumnis`).doc('master');
  await cacheRef.set({
    lastUpdated: Date.now(),
    count: compressed.length,
    data: compressed,
  });

  console.log(`✓ Master cache alumni berhasil diperbarui. Total alumni: ${compressed.length}.`);
  console.log('=== RESET SELESAI DENGAN SUKSES ===');
}

resetMeifa().catch(err => {
  console.error('Error saat reset Meifa:', err);
  process.exit(1);
});
