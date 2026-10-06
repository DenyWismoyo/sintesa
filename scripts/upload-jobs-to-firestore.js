/**
 * Script Upload 150 Lowongan Asia & ASEAN ke Firestore Produksi (katalog-solo-technopark)
 * Menggunakan Service Account Admin resmi
 */

const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');
const path = require('path');
const fs = require('fs');

const saPath = path.join(__dirname, '..', 'service-account-katalog.json');
const jobsPath = path.join(__dirname, '..', 'src', 'data', 'jobs', 'syncedJobs.json');

if (!fs.existsSync(saPath)) {
  console.error('File service-account-katalog.json tidak ditemukan!');
  process.exit(1);
}

if (!fs.existsSync(jobsPath)) {
  console.error('File syncedJobs.json tidak ditemukan!');
  process.exit(1);
}

const sa = require(saPath);
const snapshot = require(jobsPath);
const jobs = snapshot.jobs || [];

console.log(`Menyiapkan upload ${jobs.length} lowongan ke Firestore [katalog-solo-technopark]...`);

const app = admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: 'katalog-solo-technopark',
}, 'prodUploadApp');

const db = app.firestore();

function sanitize(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = sanitize(v);
      }
    }
    return clean;
  }
  return obj;
}

async function upload() {
  const chunkSize = 200;
  let savedCount = 0;

  for (let i = 0; i < jobs.length; i += chunkSize) {
    const chunk = jobs.slice(i, i + chunkSize);
    const batch = db.batch();

    chunk.forEach((job) => {
      const docRef = db.collection('jobs').doc(job.id);
      batch.set(docRef, sanitize(job), { merge: true });
      savedCount++;
    });

    console.log(`Mengunggah batch ${i + 1} s.d. ${Math.min(i + chunkSize, jobs.length)}...`);
    await batch.commit();
  }

  // Update metadata sinkronisasi
  const now = Date.now();
  const nextSync = now + 7 * 24 * 60 * 60 * 1000;
  await db.collection('app_settings').doc('jobs_sync').set({
    lastSyncedAt: now,
    nextSyncAt: nextSync,
    syncIntervalDays: 7,
    totalJobsInDb: jobs.length,
    realtimeJobsCount: jobs.length,
    stpJobsCount: 0,
    status: 'SUCCESS',
    message: `Berhasil menyinkronkan ${jobs.length} lowongan Asia & ASEAN murni dari internet (RapidAPI JSearch).`,
    provider: 'JSearch RapidAPI v2',
    lastUpdatedBy: 'Admin Upload Production',
  }, { merge: true });

  console.log(`\nSELESAI! ${savedCount} lowongan berhasil tersimpan ke Firestore koleksi 'jobs'.`);
}

upload()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Gagal upload:', err);
    process.exit(1);
  });
