/**
 * Helper Script: Menampilkan nilai ENV yang siap di-copas ke Firebase App Hosting
 * Jalankan secara lokal: node scripts/export-apphosting-env.js
 */
const fs = require('fs');
const path = require('path');

const saPath = path.resolve(__dirname, '../service-account-katalog.json');
if (!fs.existsSync(saPath)) {
  console.error("File service-account-katalog.json tidak ditemukan!");
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));

console.log("==============================================================================");
console.log("DAFTAR ENVIRONMENT VARIABLE UNTUK FIREBASE APP HOSTING (Cloud Run)");
console.log("==============================================================================\n");
console.log("1. FIREBASE_ADMIN_PROJECT_ID:");
console.log(sa.project_id);
console.log("\n2. FIREBASE_ADMIN_CLIENT_EMAIL:");
console.log(sa.client_email);
console.log("\n3. FIREBASE_ADMIN_PRIVATE_KEY (Private Key format satu baris):");
console.log(JSON.stringify(sa.private_key));
console.log("\n4. FIREBASE_SERVICE_ACCOUNT_KEY (Alternatif: Seluruh isi JSON utuh dalam 1 variabel):");
console.log(JSON.stringify(JSON.stringify(sa)));
console.log("\n==============================================================================");
