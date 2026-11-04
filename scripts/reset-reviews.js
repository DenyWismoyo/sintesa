// Lokasi file: scripts/reset-reviews.js
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

async function resetReviews() {
  console.log('🔄 Memulai proses reset ulasan & pembersihan database ulasan pelatihan...');

  // 1. Hapus semua ulasan di koleksi training_reviews
  const reviewsSnap = await db.collection('training_reviews').get();
  console.log(`Ditemukan ${reviewsSnap.size} ulasan di koleksi training_reviews.`);
  
  if (reviewsSnap.size > 0) {
    const batch = db.batch();
    reviewsSnap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log(`✅ Sebanyak ${reviewsSnap.size} ulasan berhasil dihapus (kotak ulasan kini bersih).`);
  } else {
    console.log('ℹ️ Koleksi ulasan sudah bersih (0 ulasan).');
  }

  // 2. Update doc program SMK Go Global BP3MI di training_review_programs
  const programRef = db.collection('training_review_programs').doc('smk-go-global-welder-2026');
  await programRef.set({
    id: 'smk-go-global-welder-2026',
    title: 'Pelatihan dan Sertifikasi Welder (SMK Go Global × BP3MI)',
    slug: 'smk-go-global-welder',
    shortDescription: 'Program percepatan kompetensi teknis pengelasan (Welder) bersertifikasi internasional hasil kolaborasi BP3MI Jawa Tengah dan BLUD Solo Technopark untuk penempatan kerja global.',
    category: 'Manufaktur & Vokasi',
    batch: 'Batch II',
    year: '2026',
    organizer: 'Solo Technopark × BP3MI Jawa Tengah',
    partnerInstitution: 'BP3MI Jawa Tengah',
    targetAudience: 'Lulusan SMK Jurusan Teknik Mesin / Pengelasan & Pencari Kerja Vokasi',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    allowPublicReview: true,
    aspects: [
      { id: 'kurikulum', label: 'Kurikulum & Standar Materi', description: 'Kesesuaian kurikulum teori dan praktik dengan standar kompetensi industri luar negeri (SMAW / GTAW / FCAW)', weight: 1 },
      { id: 'instruktur', label: 'Kompetensi Instruktur & Pengajar', description: 'Kejelasan penyampaian materi, bimbingan teknik pengelasan, dan kedisiplinan instruktur penguji', weight: 1 },
      { id: 'fasilitas', label: 'Fasilitas Bengkel & Peralatan K3', description: 'Ketersediaan mesin las modern, elektroda, ruang booth las yang memadai, dan APD keselamatan kerja', weight: 1 },
      { id: 'kesiapan_kerja', label: 'Relevansi & Kesiapan Kerja Global', description: 'Kesiapan mental, tes sertifikasi, dan fasilitasi jalur penempatan ke luar negeri oleh BP3MI', weight: 1 },
      { id: 'pelayanan', label: 'Pelayanan & Fasilitas Penunjang', description: 'Kenyamanan lingkungan belajar, asrama, katering, serta keramahan panitia Solo Technopark', weight: 1 },
    ],
    stats: {
      averageRating: 0,
      totalReviews: 0,
      aspectScores: {
        kurikulum: 0,
        instruktur: 0,
        fasilitas: 0,
        kesiapan_kerja: 0,
        pelayanan: 0,
      },
      ratingCounts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    },
    updatedAt: Date.now(),
  }, { merge: true });

  console.log('✅ Program SMK Go Global Welder 2026 berhasil disinkronkan dengan stats ulasan = 0.');
}

resetReviews()
  .then(() => {
    console.log('🎉 Pembersihan database ulasan selesai 100%!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Gagal mereset ulasan:', err);
    process.exit(1);
  });
