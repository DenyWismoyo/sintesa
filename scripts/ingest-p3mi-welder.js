/**
 * Script Ingest Data 40 Peserta Welder (SMK Go Global BP3MI Jawa Tengah)
 * Menelan data dari spreadsheet resmi beserta pemetaan 40 foto peserta.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

const saPath = path.join(__dirname, '..', 'service-account-katalog.json');
const excelPath = 'C:/Users/ASUS/.gemini/antigravity/brain/6f204e71-191a-410c-a040-509119a9ab56/.user_uploaded/media_1793745775801_32dab56a.xlsx';
const photosDir = path.join(__dirname, '..', 'public', 'uploads', 'alumni', 'p3mi');

if (!fs.existsSync(saPath)) {
  console.error('File service-account-katalog.json tidak ditemukan!');
  process.exit(1);
}

if (!fs.existsSync(excelPath)) {
  console.error('File Excel tidak ditemukan di:', excelPath);
  process.exit(1);
}

const sa = require(saPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id || 'katalog-solo-technopark',
  });
}
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

function cleanStr(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function excelDateToJSDate(serial) {
  if (!serial || typeof serial !== 'number') {
    return typeof serial === 'string' ? serial.trim() : '';
  }
  const utcDays = Math.floor(serial - 25569);
  const dateInfo = new Date(utcDays * 86400 * 1000);
  const year = dateInfo.getUTCFullYear();
  const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateInfo.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseUniformAndShoe(raw) {
  if (!raw) return { uniformSize: '', shoeSize: '' };
  const parts = String(raw).split('/');
  const uniformSize = (parts[0] || '').trim();
  const shoeSize = (parts[1] || '').trim();
  return { uniformSize, shoeSize };
}

async function runIngest() {
  console.log('=== MEMULAI INGEST DATA 40 PESERTA BP3MI WELDER ===');
  
  // 1. Baca Foto
  const photoFiles = fs.readdirSync(photosDir);
  console.log(`Ditemukan ${photoFiles.length} file foto di ${photosDir}`);

  // 2. Baca Excel
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const participantRows = allRows.slice(7).filter(r => r[0] && typeof r[0] === 'number');

  console.log(`Ditemukan ${participantRows.length} baris peserta di Excel.`);

  // 3. Ambil data alumni yang sudah ada di Firestore untuk deduplikasi
  const existingSnap = await db.collection('alumnis').get();
  const existingMap = new Map();
  existingSnap.forEach(docSnap => {
    const data = docSnap.data();
    const key = `${cleanStr(data.name)}|${cleanStr(data.programTaken)}`;
    existingMap.set(key, { id: docSnap.id, ...data });
  });

  const usedPhotos = new Set();
  const batchWrite = db.batch();
  let createdCount = 0;
  let updatedCount = 0;

  const enrolledRecords = [];

  for (const row of participantRows) {
    const no = row[0];
    const rawName = String(row[1] || '').trim();
    const rawNik = row[2] ? String(row[2]).trim() : '';
    const rawUniform = row[3];
    const rawDob = row[4];
    const rawAge = row[5];
    const rawGender = String(row[6] || 'Laki-Laki').trim();
    const rawDomicile = String(row[7] || '').trim();
    const rawPhone = String(row[8] || '').replace(/[\u200E\u202A\u202C]/g, '').trim();
    const rawEmail = row[9] ? String(row[9]).trim().toLowerCase() : '';

    const { uniformSize, shoeSize } = parseUniformAndShoe(rawUniform);
    const dobString = excelDateToJSDate(rawDob);
    let calculatedAge = rawAge ? Number(rawAge) : undefined;
    if (!calculatedAge && dobString && dobString.startsWith('19') || dobString.startsWith('20')) {
      const bYear = parseInt(dobString.split('-')[0], 10);
      if (!isNaN(bYear)) calculatedAge = 2026 - bYear;
    }

    // Matching foto
    const cName = cleanStr(rawName);
    let matchedPhoto = photoFiles.find(f => cleanStr(f.replace('_BP3MI.png', '')) === cName);
    if (!matchedPhoto) {
      const words = rawName.split(/\s+/).map(cleanStr).filter(Boolean);
      matchedPhoto = photoFiles.find(f => {
        if (usedPhotos.has(f)) return false;
        const fClean = cleanStr(f.replace('_BP3MI.png', ''));
        if (words.length >= 2) {
          return fClean.includes(words[0]) && fClean.includes(words[1]);
        }
        return fClean.includes(words[0]);
      });
    }

    if (matchedPhoto) {
      usedPhotos.add(matchedPhoto);
    }

    const photoUrl = matchedPhoto ? `/uploads/alumni/p3mi/${matchedPhoto}` : '';

    const programTaken = 'Pelatihan dan Sertifikasi Welder (SMK Go Global)';
    const dedupKey = `${cName}|${cleanStr(programTaken)}`;
    const existing = existingMap.get(dedupKey);

    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const regCode = existing?.registrationCode || `P3MI-2026-${randomDigits}`;

    const alumniPayload = {
      name: rawName,
      nik: rawNik || (existing?.nik || null),
      gender: rawGender,
      domicile: rawDomicile,
      age: calculatedAge || null,
      birthInfo: dobString,
      phone: rawPhone,
      email: rawEmail || null,
      uniformSize,
      shoeSize,
      programTaken,
      batch: 'Batch II',
      originSource: 'KERJASAMA_P3MI',
      originInstitution: 'Solo Technopark',
      partnerInstitution: 'BP3MI Jawa Tengah',
      targetPlacement: 'Global / Luar Negeri (SMK Go Global)',
      courseStartDate: '2026-10-14',
      courseEndDate: '2026-11-04',
      trainingYear: '2026',
      graduationYear: '2026',
      certificationResult: 'Lulus Sertifikasi Welder',
      status: existing?.status || 'DORMANT',
      internalStatus: existing?.internalStatus || 'AVAILABLE',
      employmentStatus: existing?.employmentStatus || 'Proses Verifikasi',
      registrationCode: regCode,
      photoUrl: photoUrl || existing?.photoUrl || '',
      updatedAt: Date.now(),
    };

    if (existing) {
      const ref = db.collection('alumnis').doc(existing.id);
      batchWrite.update(ref, alumniPayload);
      updatedCount++;
      enrolledRecords.push({ id: existing.id, ...alumniPayload });
    } else {
      const ref = db.collection('alumnis').doc();
      alumniPayload.createdAt = Date.now();
      batchWrite.set(ref, alumniPayload);
      createdCount++;
      enrolledRecords.push({ id: ref.id, ...alumniPayload });
    }

    console.log(`[${no}] ${rawName} -> RegCode: ${regCode} | NIK: ${rawNik || '-'} | Foto: ${matchedPhoto || 'TIDAK ADA'}`);
  }

  await batchWrite.commit();
  console.log(`\nCommit Batch Berhasil! Dibuat: ${createdCount}, Diperbarui: ${updatedCount}`);

  // 4. Sinkronisasi Master Cache (1-Read Pattern)
  console.log('\nMenyinkronkan master cache artifacts/blud-app-dev/public/data/cache_alumnis/master...');
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

  console.log(`Master cache berhasil diperbarui dengan total ${compressed.length} alumni.`);
  console.log('=== SELESAI ===');
}

runIngest().catch(err => {
  console.error('Error saat ingest:', err);
  process.exit(1);
});
