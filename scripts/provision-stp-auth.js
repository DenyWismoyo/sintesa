/**
 * Script Provisioning Seluruh User Presensi Solo Technopark ke Firebase Auth & Firestore
 * - Membaca 46 profil pegawai dari named database 'presensi-pegawai'
 * - Memasukkan / Mengupdate akun di Firebase Authentication dengan password resmi: StpUser2026!
 * - Menetapkan displayName, emailVerified = true
 * - Custom claims MENGGUNAKAN 'presensiRole' (BUKAN 'role') agar tidak bentrok dengan catalog admin
 * - Menyinkronkan dokumen users/{uid} di Firestore 'presensi-pegawai'
 */

const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));
const { Firestore } = require(path.join(__dirname, '../functions/node_modules/@google-cloud/firestore'));
const sa = require(path.join(__dirname, '../service-account-katalog.json'));

const DEFAULT_PASSWORD = 'StpUser2026!';

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id
});

const presensiDb = new Firestore({
  projectId: sa.project_id,
  credentials: sa,
  databaseId: 'presensi-pegawai'
});

async function runProvisioning() {
  console.log('=== MEMULAI PROVISIONING USER PRESENSI SOLO TECHNOPARK ===\n');

  // 1. Ambil seluruh data master user dari Firestore presensi-pegawai
  const snapshot = await presensiDb.collection('users').get();
  console.log(`Ditemukan ${snapshot.docs.length} dokumen di database presensi-pegawai [users].`);

  const masterUsers = new Map();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.email && data.email.endsWith('@solotechnopark.id')) {
      const emailLower = data.email.trim().toLowerCase();
      // Simpan data terlengkap
      if (!masterUsers.has(emailLower) || doc.id.startsWith('stp-')) {
        masterUsers.set(emailLower, {
          originalDocId: doc.id,
          ...data
        });
      }
    }
  });

  console.log(`Total unik pegawai (@solotechnopark.id): ${masterUsers.size}\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let syncDocCount = 0;
  let errors = [];

  const summaryResults = [];

  for (const [email, userData] of masterUsers.entries()) {
    const nama = userData.nama || email.split('@')[0];
    const role = userData.role || 'pegawai';
    const accessCode = userData.accessCode || userData.nip || '';
    // PENTING: Gunakan 'presensiRole' (BUKAN 'role') agar tidak bentrok dengan
    // catalog admin role. Pegawai STP hanya butuh presensi, bukan catalog admin.
    const claims = {
      presensiRole: role,   // claim khusus presensi
      orgId: 'solotechnopark',
      // 'role' TIDAK diset → user tidak mendapat akses ke catalog admin portal
    };

    let authUser = null;

    try {
      // Cek apakah user sudah ada di Auth
      try {
        authUser = await admin.auth().getUserByEmail(email);
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
      }

      if (authUser) {
        // Update user: pastikan password aktif, displayName terisi, emailVerified = true
        await admin.auth().updateUser(authUser.uid, {
          password: DEFAULT_PASSWORD,
          displayName: nama,
          emailVerified: true,
          disabled: false
        });
        await admin.auth().setCustomUserClaims(authUser.uid, claims);
        updatedCount++;
        console.log(`[UPDATE] ${email} -> UID: ${authUser.uid} (Password & Claims Aktif)`);
      } else {
        // Buat user baru di Auth
        authUser = await admin.auth().createUser({
          email: email,
          password: DEFAULT_PASSWORD,
          displayName: nama,
          emailVerified: true,
          disabled: false
        });
        await admin.auth().setCustomUserClaims(authUser.uid, claims);
        createdCount++;
        console.log(`[CREATE] ${email} -> UID: ${authUser.uid} (Akun Baru Berhasil Dibuat)`);
      }

      // Sinkronkan dokumen profil di Firestore presensi-pegawai dengan ID = authUser.uid
      const profileToSave = {
        ...userData,
        id: authUser.uid,
        authUid: authUser.uid,
        email: email,
        nama: nama,
        role: role,
        accessCode: accessCode,
        nip: accessCode,
        orgId: 'solotechnopark',
        passwordDefault: DEFAULT_PASSWORD,
        updatedAt: new Date().toISOString()
      };

      // Simpan di users/{uid}
      await presensiDb.collection('users').doc(authUser.uid).set(profileToSave, { merge: true });

      // Pastikan dokumen original juga terupdate dengan authUid
      if (userData.originalDocId && userData.originalDocId !== authUser.uid) {
        await presensiDb.collection('users').doc(userData.originalDocId).set({
          authUid: authUser.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      syncDocCount++;

      summaryResults.push({
        nama: nama,
        email: email,
        accessCode: accessCode,
        role: role,
        uid: authUser.uid,
        status: 'AKTIF'
      });

    } catch (err) {
      console.error(`[ERROR] Gagal memproses ${email}:`, err.message);
      errors.push({ email, error: err.message });
    }
  }

  console.log('\n=== REKAP PROVISIONING SELESAI ===');
  console.log(`Akun Baru Dibuat       : ${createdCount}`);
  console.log(`Akun Berhasil Diupdate : ${updatedCount}`);
  console.log(`Profil Disinkronkan     : ${syncDocCount}`);
  console.log(`Error Terjadi          : ${errors.length}`);

  if (errors.length > 0) {
    console.log('Detail Error:', JSON.stringify(errors, null, 2));
  }

  return summaryResults;
}

runProvisioning()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
