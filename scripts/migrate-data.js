/**
 * Script Migrasi Data Firestore dari teknopark-surakarta ke katalog-solo-technopark
 * Jalankan dengan: node scripts/migrate-data.js
 */

const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');
const path = require('path');
const fs = require('fs');

// Path credentials
const sourceKeyPath = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/98fc9d66-0789-41ff-8e83-9c2e47d22c1d/scratch/sa-key.json';
const destKeyPath = path.join(__dirname, '..', 'service-account-katalog.json');

if (!fs.existsSync(destKeyPath)) {
  console.error('File service-account-katalog.json tidak ditemukan!');
  process.exit(1);
}

// Inisialisasi Source App (teknopark-surakarta)
let sourceApp;
if (fs.existsSync(sourceKeyPath)) {
  sourceApp = admin.initializeApp({
    credential: admin.credential.cert(require(sourceKeyPath)),
  }, 'sourceApp');
} else {
  console.log('Catatan: Service account source tidak ditemukan di scratch path, melewati migrasi langsung.');
}

// Inisialisasi Destination App (katalog-solo-technopark)
const destApp = admin.initializeApp({
  credential: admin.credential.cert(require(destKeyPath)),
}, 'destApp');

const sourceDb = sourceApp ? sourceApp.firestore() : null;
const destDb = destApp.firestore();

// Daftar koleksi penting untuk sistem Katalog & Kawasan STP
const TARGET_COLLECTIONS = [
  'catalogs',
  'tenants',
  'assets',
  'trainings',
  'alumnis',
  'events',
  'siteConfig',
  'faqs',
  'users'
];

async function migrateCollection(colName) {
  if (!sourceDb) return;
  console.log(`\nMemulai migrasi koleksi: ${colName}...`);
  const snapshot = await sourceDb.collection(colName).get();
  console.log(`Ditemukan ${snapshot.docs.length} dokumen di [${colName}].`);

  if (snapshot.empty) return;

  const batchSize = 400;
  let batch = destDb.batch();
  let count = 0;
  let totalMigrated = 0;

  for (const doc of snapshot.docs) {
    const destRef = destDb.collection(colName).doc(doc.id);
    batch.set(destRef, doc.data(), { merge: true });
    count++;
    totalMigrated++;

    if (count >= batchSize) {
      await batch.commit();
      console.log(`  -> Berhasil menyimpan ${totalMigrated} dokumen ke [${colName}]`);
      batch = destDb.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`  -> Selesai migrasi koleksi [${colName}]: Total ${totalMigrated} dokumen.`);
  }
}

async function run() {
  console.log('=== MIGRASI DATA FIRESTORE KE KATALOG-SOLO-TECHNOPARK ===');
  if (!sourceDb) {
    console.log('Sumber data lama tidak tersedia.');
    return;
  }

  for (const col of TARGET_COLLECTIONS) {
    try {
      await migrateCollection(col);
    } catch (err) {
      console.error(`Gagal memigrasi koleksi ${col}:`, err.message);
    }
  }
  console.log('\n=== MIGRASI SELESAI ===');
}

run().catch(console.error);
