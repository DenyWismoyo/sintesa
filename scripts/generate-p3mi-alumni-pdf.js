/**
 * Script Pembuat Dokumen PDF Resmi:
 * "DAFTAR KODE KLAIM ALUMNI & PANDUAN AKTIVASI BP3MI JAWA TENGAH × SOLO TECHNOPARK"
 * Dilengkapi tutorial langkah demi langkah cara klaim akun alumni secara organik.
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const sharp = require('sharp');

// Firebase Admin initialization
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
const saPath = path.join(__dirname, '..', 'service-account-katalog.json');

if (!fs.existsSync(saPath)) {
  console.error('File service-account-katalog.json tidak ditemukan!');
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

async function generateP3miPdf() {
  console.log('=== MEMULAI GENERATE PDF DAFTAR PESERTA & KODE P3MI ===');

  // 1. Ambil data 40 peserta dari Firestore
  const snap = await db.collection('alumnis')
    .where('originSource', '==', 'KERJASAMA_P3MI')
    .get();

  const participants = [];
  snap.forEach(docSnap => {
    const d = docSnap.data();
    participants.push({
      id: docSnap.id,
      name: d.name || 'Peserta',
      nik: d.nik || '-',
      registrationCode: d.registrationCode || '-',
      domicile: d.domicile || '-',
      phone: d.phone || '-',
      email: d.email || '-',
      uniformSize: d.uniformSize || '-',
      shoeSize: d.shoeSize || '-',
      status: d.status === 'CLAIMED' ? 'Aktif' : 'Siap Klaim'
    });
  });

  // Urutkan berdasarkan nama
  participants.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  console.log(`Mengambil ${participants.length} data peserta dari database.`);

  // 2. Siapkan logo Solo Technopark
  const logoPath = path.join(__dirname, '..', 'public', 'logo-stp.png');
  let logoBase64 = null;
  if (fs.existsSync(logoPath)) {
    try {
      const optimized = await sharp(logoPath)
        .resize(300, null, { withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      logoBase64 = `data:image/png;base64,${optimized.toString('base64')}`;
    } catch (err) {
      console.warn('Gagal memproses logo:', err);
    }
  }

  // 3. Inisialisasi jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  // Warna Palet Resmi
  const C_NAVY = [15, 23, 42];      // #0f172a
  const C_EMERALD = [5, 150, 105];  // #059669
  const C_TEAL_BG = [240, 253, 250];// #f0fdfa
  const C_SLATE_DARK = [51, 65, 85];// #334155
  const C_SLATE_MUTED = [100, 116, 139]; // #64748b
  const C_SLATE_LIGHT = [248, 250, 252]; // #f8fafc
  const C_BORDER = [226, 232, 240]; // #e2e8f0

  // ==========================================
  // HALAMAN 1: COVER & PANDUAN CARA KLAIM
  // ==========================================

  // Header Bar Atas
  doc.setFillColor(...C_NAVY);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line Emerald
  doc.setFillColor(...C_EMERALD);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Logo STP (jika ada)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 5, 34, 18);
  }

  // Teks Header Kop
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SOLO TECHNOPARK × BP3MI JAWA TENGAH', margin + (logoBase64 ? 40 : 0), 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Kawasan Sains & Teknologi Terpadu Kota Surakarta — Program SMK Go Global', margin + (logoBase64 ? 40 : 0), 18);
  doc.text('Portal Resmi: https://katalog.solotechnopark.id | Helpdesk: 0812-3456-7890', margin + (logoBase64 ? 40 : 0), 23);

  // Judul Dokumen Utama
  let curY = 40;
  doc.setTextColor(...C_NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DAFTAR KODE KLAIM ALUMNI & PANDUAN AKTIVASI', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C_EMERALD);
  doc.text('PROGRAM SMK GO GLOBAL BP3MI JAWA TENGAH — BATCH II (WELDER)', margin, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C_SLATE_MUTED);
  doc.text('Pelatihan & Sertifikasi Welder (14 Oktober – 4 November 2026) | Terbit: November 2026', margin, curY);

  curY += 8;

  // ------------------------------------------
  // KOTAK TUTORIAL: LANGKAH-LANGKAH KLAIM ALUMNI
  // ------------------------------------------
  doc.setFillColor(...C_TEAL_BG);
  doc.setDrawColor(...C_EMERALD);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, curY, contentWidth, 125, 4, 4, 'FD');

  let boxY = curY + 8;
  doc.setTextColor(...C_EMERALD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PANDUAN AKTIVASI AKUN ALUMNI (5 LANGKAH MUDAH)', margin + 6, boxY);

  boxY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...C_SLATE_DARK);
  doc.text('Ikuti panduan berikut agar profil Anda terverifikasi resmi dan langsung terhubung dengan lowongan kerja mitra global:', margin + 6, boxY);

  boxY += 8;

  const steps = [
    {
      num: '1',
      title: 'Buka Portal Solo Technopark',
      desc: 'Buka tautan https://katalog.solotechnopark.id/login melalui browser HP atau komputer Anda.'
    },
    {
      num: '2',
      title: 'Login / Masuk dengan Akun Email',
      desc: 'Masuk menggunakan email aktif Anda. Jika baru pertama kali mengakses, klik "Daftar Akun Baru" dengan email yang sama saat pendaftaran pelatihan.'
    },
    {
      num: '3',
      title: 'Buka Menu "Akun Saya" (Profil)',
      desc: 'Setelah berhasil masuk ke dashboard, klik foto / nama profil Anda di pojok kanan atas, lalu pilih menu "Akun Saya" (Profil).'
    },
    {
      num: '4',
      title: 'Klaim Akun Anda (Tersedia 2 Cara Mudah):',
      desc: '• CARA 1 (Otomatis 1-Klik): Jika email Anda cocok, sistem akan menampilkan banner hijau "Data Pelatihan Terdeteksi". Cukup klik tombol "Aktifkan Akun Alumni (1-Klik)".\n• CARA 2 (Manual Kode/NIK): Pada kotak "Klaim Status Alumni", masukkan Kode Registrasi Unik Anda (contoh: P3MI-2026-XXXXXX) atau NIK KTP (opsional), lalu klik tombol panah.'
    },
    {
      num: '5',
      title: 'Selesai & Nikmati Akses Bursa Karir Global',
      desc: 'Profil Anda otomatis mendapat badge resmi "Alumni BP3MI Jawa Tengah (SMK Go Global)" dan portofolio Anda langsung masuk ke Katalog Talenta Resmi yang dilihat oleh industri & perusahaan perekrut global.'
    }
  ];

  steps.forEach(step => {
    // Lingkaran Angka
    doc.setFillColor(...C_EMERALD);
    doc.circle(margin + 10, boxY + 1.5, 3.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(step.num, margin + 9, boxY + 2.5);

    // Judul Langkah
    doc.setTextColor(...C_NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(step.title, margin + 17, boxY + 2);

    // Deskripsi Langkah
    boxY += 4.5;
    doc.setTextColor(...C_SLATE_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitDesc = doc.splitTextToSize(step.desc, contentWidth - 24);
    doc.text(splitDesc, margin + 17, boxY);

    boxY += (splitDesc.length * 3.5) + 3;
  });

  // ------------------------------------------
  // KOTAK KEUNTUNGAN / BENEFIT
  // ------------------------------------------
  curY = 176;
  doc.setFillColor(...C_SLATE_LIGHT);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'FD');

  let benY = curY + 6;
  doc.setTextColor(...C_NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Keuntungan Setelah Akun Alumni Terverifikasi:', margin + 6, benY);

  benY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C_SLATE_DARK);

  const benefits = [
    '✓ Akses Bursa Karir Eksklusif & Loker Luar Negeri (Asia, ASEAN, Eropa) khusus lulusan welder sertifikasi.',
    '✓ Profil Anda dipromosikan langsung ke Perusahaan Rekruter & Mitra Industri Manufaktur Solo Technopark.',
    '✓ Verifikasi Ijazah & Sertifikat Digital resmi yang dapat dibagikan ke LinkedIn atau CV pelamar kerja.',
    '✓ Akses prioritas untuk mengikuti program pembekalan bahasa, wawancara kerja, dan pengurusan visa kerja.'
  ];

  benefits.forEach(b => {
    doc.text(b, margin + 6, benY);
    benY += 5.5;
  });

  // Catatan Kaki Halaman 1
  curY = 222;
  doc.setFillColor(254, 243, 199); // amber 100
  doc.setDrawColor(245, 158, 11); // amber 500
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 24, 3, 3, 'FD');

  doc.setTextColor(146, 64, 14); // amber 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CATATAN PENTING KEAMANAN KODE KLAIM:', margin + 5, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('1. Kode Registrasi unik pada halaman berikutnya bersifat rahasia dan hanya dapat diklaim 1 (satu) kali per akun.', margin + 5, curY + 11);
  doc.text('2. NIK KTP Anda bersifat opsional sebagai alternatif jika Anda lupa membawa atau kehilangan catatan kode unik.', margin + 5, curY + 16);
  doc.text('3. Jika ada kendala aktivasi, silakan hubungi Koordinator Pelatihan STP / BP3MI Jawa Tengah.', margin + 5, curY + 21);

  // Footer Halaman 1
  doc.setTextColor(...C_SLATE_MUTED);
  doc.setFontSize(7.5);
  doc.text('Solo Technopark — Dokumen Resmi Pelatihan & Penyaluran Karir BP3MI', margin, 288);
  doc.text('Halaman 1 dari 3', pageWidth - margin - 22, 288);

  // ==========================================
  // HALAMAN 2 & 3: TABEL DIREKTORI 40 PESERTA
  // ==========================================
  doc.addPage();

  // Header kecil di Halaman 2
  doc.setFillColor(...C_NAVY);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setFillColor(...C_EMERALD);
  doc.rect(0, 16, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DAFTAR PESERTA & KODE KLAIM ALUMNI BP3MI JAWA TENGAH (BATCH II - WELDER)', margin, 11);

  // Persiapkan baris tabel
  const tableRows = participants.map((p, idx) => [
    idx + 1,
    p.name,
    p.nik !== '-' ? p.nik : '(Opsional)',
    p.registrationCode,
    p.domicile,
    p.phone !== '-' ? p.phone : '-',
    `${p.uniformSize} / ${p.shoeSize}`,
    p.status
  ]);

  autoTable(doc, {
    startY: 24,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [[
      'No', 
      'Nama Lengkap Peserta', 
      'NIK (KTP)', 
      'Kode Registrasi Unik', 
      'Domisili', 
      'No. WhatsApp', 
      'Seragam / Sepatu', 
      'Status'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: C_SLATE_DARK,
      lineColor: C_BORDER,
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: C_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'center', font: 'courier', fontSize: 7.5 },
      3: { cellWidth: 32, halign: 'center', font: 'courier', fontStyle: 'bold', textColor: C_EMERALD },
      4: { cellWidth: 26 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: function(data) {
      // Footer pada setiap halaman tabel
      const pageNum = doc.internal.getNumberOfPages();
      doc.setTextColor(...C_SLATE_MUTED);
      doc.setFontSize(7.5);
      doc.text('Solo Technopark — Dokumen Resmi Pelatihan & Penyaluran Karir BP3MI', margin, 288);
      doc.text(`Halaman ${pageNum} dari 3`, pageWidth - margin - 22, 288);
    }
  });

  // Tambahkan stempel pengesahan di akhir tabel jika cukup ruang
  let finalY = doc.lastAutoTable.finalY + 8;
  if (finalY > 230) {
    doc.addPage();
    finalY = 30;
  }

  // Blok Tanda Tangan / Pengesahan
  const signY = finalY;
  const colW = contentWidth / 2;

  doc.setTextColor(...C_SLATE_DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  // Kiri: BP3MI Jawa Tengah
  doc.text('Mengetahui,', margin + 10, signY);
  doc.text('BP3MI Jawa Tengah', margin + 10, signY + 4.5);
  doc.text('Koordinator Program SMK Go Global', margin + 10, signY + 9);
  doc.text('_____________________________________', margin + 10, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text('Tim Penempatan BP3MI Jateng', margin + 10, signY + 33);

  // Kanan: Solo Technopark
  doc.setFont('helvetica', 'normal');
  doc.text('Surakarta, November 2026', margin + colW + 10, signY);
  doc.text('BLUD Solo Technopark', margin + colW + 10, signY + 4.5);
  doc.text('Divisi Diklat Vokasi & Bursa Karir', margin + colW + 10, signY + 9);
  doc.text('_____________________________________', margin + colW + 10, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text('Manajer Pelatihan & Karir STP', margin + colW + 10, signY + 33);

  // 4. Simpan File PDF
  const outDir = path.join(__dirname, '..', 'public', 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfFileName = 'DAFTAR_KODE_KLAIM_ALUMNI_P3MI_WELDER_2026.pdf';
  const pdfFilePath = path.join(outDir, pdfFileName);

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(pdfFilePath, Buffer.from(pdfBytes));

  console.log(`\nDokumen PDF Berhasil Dibuat: ${pdfFilePath}`);
  console.log(`Ukuran File: ${(fs.statSync(pdfFilePath).size / 1024).toFixed(1)} KB`);
  console.log(`Total Halaman: ${doc.internal.getNumberOfPages()}`);
  console.log('=== SELESAI ===');
}

generateP3miPdf().catch(err => {
  console.error('Error generate PDF:', err);
  process.exit(1);
});
