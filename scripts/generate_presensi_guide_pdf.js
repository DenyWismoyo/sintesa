const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const sharp = require('sharp');

// Load master data pegawai dari stpUsers.ts
function loadStpUsers() {
  const filePath = path.resolve(__dirname, '../src/data/presensi/stpUsers.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/export const STP_CREDENTIALS_LIST:\s*StpCredentialItem\[\]\s*=\s*(\[[\s\S]*?\]);/);
  if (match) {
    return JSON.parse(match[1]);
  }
  return [];
}

const STP_CREDENTIALS_LIST = loadStpUsers();

async function generatePresensiGuidePdf() {
  console.log("Memulai perancangan ulang Dokumen Panduan Presensi Techno Sign PDF...");

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14; // margin kiri & kanan
  const contentWidth = pageWidth - margin * 2; // 182 mm

  // Optimasi Logo STP ke resolusi cetak kompak (lebar 360px, tinggi ~190px)
  const logoPath = path.resolve(__dirname, '../public/logo-stp.png');
  let logoBase64 = null;
  if (fs.existsSync(logoPath)) {
    const optimizedLogoBuf = await sharp(logoPath)
      .resize(360, null, { withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    logoBase64 = `data:image/png;base64,${optimizedLogoBuf.toString('base64')}`;
  }

  // Palet Warna Resmi & Mewah (Corporate Luxury Minimalist)
  const colors = {
    primary: [6, 95, 70],          // Emerald 800
    primaryMedium: [16, 185, 129],  // Emerald 500
    primaryBg: [240, 253, 244],     // Emerald 50
    primaryBadge: [209, 250, 229],  // Emerald 100
    slateDark: [15, 23, 42],        // Slate 900
    slateBody: [51, 65, 85],        // Slate 700
    slateMuted: [100, 116, 139],    // Slate 500
    borderLight: [226, 232, 240],   // Slate 200
    cardBg: [248, 250, 252],        // Slate 50
    accentCyan: [14, 116, 144],     // Cyan 700
    amberBg: [254, 243, 199],       // Amber 100
    amberText: [146, 64, 14],       // Amber 800
  };

  // ============================================================================
  // FUNGSI HEADER KOP SURAT LENGKAP (HALAMAN 1)
  // ============================================================================
  function drawFullKop(yPos = 9) {
    if (logoBase64) {
      try {
        // Logo STP: lebar 32mm, tinggi 15mm
        doc.addImage(logoBase64, 'PNG', margin, yPos + 0.5, 32, 15);
      } catch (e) {
        console.warn("Gagal menambahkan logo:", e);
      }
    }

    const textLeft = margin + 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.slateDark);
    doc.text("PEMERINTAH KOTA SURAKARTA", textLeft, yPos + 3.5);

    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.text("UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK", textLeft, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.slateMuted);
    doc.text("Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126", textLeft, yPos + 12);
    doc.text("Website: https://solotechnopark.id  •  Portal Presensi: https://katalog.solotechnopark.id/presensi", textLeft, yPos + 15.5);

    // Garis Kop Pembatas Ganda
    const lineY = yPos + 18.5;
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.7);
    doc.line(margin, lineY, margin + contentWidth, lineY);

    doc.setDrawColor(...colors.primaryMedium);
    doc.setLineWidth(0.25);
    doc.line(margin, lineY + 1.2, margin + contentWidth, lineY + 1.2);

    return lineY + 4;
  }

  // ============================================================================
  // FUNGSI RUNNING HEADER KOMPAK (HALAMAN 2, 3, 4)
  // ============================================================================
  function drawRunningHeader(title = "PANDUAN OPERASIONAL SISTEM PRESENSI TECHNO SIGN v3.0") {
    const yPos = 8;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, yPos, 22, 10);
      } catch (e) {}
    }

    const textLeft = margin + 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.slateMuted);
    doc.text("UPTD KST SOLO TECHNOPARK  •  DOKUMEN RESMI INTERNAL", textLeft, yPos + 4);

    doc.setFontSize(8.5);
    doc.setTextColor(...colors.primary);
    doc.text(title, textLeft, yPos + 8);

    const lineY = yPos + 11.5;
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.3);
    doc.line(margin, lineY, margin + contentWidth, lineY);

    return lineY + 4; // Y rekomendasi untuk konten halaman
  }

  // ============================================================================
  // HELPER MENGGAMBAR KARTU LANGKAH DENGAN AUTO-HEIGHT (BEBAS TUMPUKAN)
  // ============================================================================
  function drawStepCard(stepNum, title, items, startY) {
    const badgeW = 7;
    const paddingX = 4;
    const paddingY = 3.5;
    const textStartX = margin + paddingX + badgeW + 3;
    const maxTextW = contentWidth - (paddingX * 2 + badgeW + 5);

    // Hitung tinggi total konten secara dinamis
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    let totalContentH = 0;
    const parsedItems = items.map((item) => {
      const lines = doc.splitTextToSize(item, maxTextW);
      totalContentH += lines.length * 3.7 + 1.2;
      return lines;
    });

    const cardHeight = Math.max(24, paddingY * 2 + 5.5 + totalContentH);

    // Gambar Kotak Card
    doc.setFillColor(...colors.cardBg);
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, startY, contentWidth, cardHeight, 2, 2, 'FD');

    // Number Badge (Lingkaran Hijau)
    const badgeCenterY = startY + paddingY + 3.2;
    doc.setFillColor(...colors.primary);
    doc.circle(margin + paddingX + 3.5, badgeCenterY, 3.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(String(stepNum), margin + paddingX + 3.5, badgeCenterY + 1, { align: 'center' });

    // Judul Langkah
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.slateDark);
    doc.text(title, textStartX, startY + paddingY + 4.2);

    // Garis pemisah halus di bawah judul
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.15);
    doc.line(textStartX, startY + paddingY + 6.5, margin + contentWidth - paddingX, startY + paddingY + 6.5);

    // Teks Isi (Bullet Points)
    let currentTextY = startY + paddingY + 10.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.slateBody);

    parsedItems.forEach((lines) => {
      lines.forEach((line) => {
        doc.text(line, textStartX, currentTextY);
        currentTextY += 3.7;
      });
      currentTextY += 1.2;
    });

    return startY + cardHeight + 3; // Jarak ke card berikutnya
  }

  // ============================================================================
  // HALAMAN 1: KOP SURAT, RINGKASAN KUNCI, LANGKAH 1, 2, 3, & PERSYARATAN TEKNIS
  // ============================================================================
  let currentY = drawFullKop(9);

  // Judul Dokumen Utama
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("PANDUAN OPERASIONAL & DIREKTORI AKUN PEGAWAI", margin + contentWidth / 2, currentY + 3.5, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(...colors.primary);
  doc.text("SISTEM PRESENSI DIGITAL & KINERJA HARIAN (TECHNO SIGN v3.0)", margin + contentWidth / 2, currentY + 8, { align: 'center' });

  currentY += 12;

  // HERO BOX: RINGKASAN EKSEKUTIF & AKSES KUNCI (Lebar 182mm, Tinggi 44mm, Sangat Lapang & Bernapas)
  const heroBoxH = 44;
  doc.setFillColor(...colors.primaryBg);
  doc.setDrawColor(...colors.primaryMedium);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, heroBoxH, 2.5, 2.5, 'FD');

  // Label Header Hero
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primary);
  doc.text("INFORMASI PENTING OPERASIONAL PRESENSI PEGAWAI", margin + 5, currentY + 5.5);

  const heroLineY = currentY + 7.5;
  doc.setDrawColor(...colors.primaryMedium);
  doc.setLineWidth(0.2);
  doc.line(margin + 5, heroLineY, margin + contentWidth - 5, heroLineY);

  // Konten 2 Kolom Presisi
  const colW = (contentWidth - 16) / 2; // 83 mm per kolom
  const col1Left = margin + 5;
  const col2Left = margin + 5 + colW + 6;

  // Kolom 1
  let col1Y = heroLineY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.slateBody);
  doc.text("Tautan Portal Aplikasi Presensi:", col1Left, col1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.accentCyan);
  doc.text("https://katalog.solotechnopark.id/presensi", col1Left, col1Y + 3.8);

  col1Y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("Metode Login Utama:", col1Left, col1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateDark);
  doc.text("Kode Akses NIP  (Contoh: STP-50120)", col1Left, col1Y + 3.8);

  col1Y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("Kata Sandi Awal Default:", col1Left, col1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("StpUser2026!  (Wajib diperbarui di profil)", col1Left, col1Y + 3.8);

  // Kolom 2
  let col2Y = heroLineY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("Ketentuan Presensi Datang (Check-In):", col2Left, col2Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("Maksimal pukul 07:30 WIB", col2Left, col2Y + 3.8);

  col2Y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("Ketentuan Presensi Pulang (Check-Out):", col2Left, col2Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("Mulai pukul 16:00 WIB", col2Left, col2Y + 3.8);

  col2Y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("Radius Validasi Lokasi Absensi:", col2Left, col2Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateDark);
  doc.text("Polygon 8-Hektar Kawasan Solo Technopark", col2Left, col2Y + 3.8);

  currentY += heroBoxH + 5;

  // Header Section Langkah (Bagian 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("PANDUAN OPERASIONAL PRESENSI (BAGIAN 1 DARI 2)", margin, currentY + 3);

  currentY += 6;

  // Langkah 1
  currentY = drawStepCard(
    1,
    "Instalasi Aplikasi ke Ponsel Pintar (Progressive Web App - PWA)",
    [
      "• Buka browser di ponsel Anda (disarankan Google Chrome untuk Android, atau Safari untuk iPhone).",
      "• Akses tautan resmi: https://katalog.solotechnopark.id/presensi",
      "• Ketuk tombol menu peramban (ikon titik tiga atau tombol Bagikan/Share), lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).",
      "• Ikon aplikasi Techno Sign resmi (perisai hijau neon) akan terpasang di layar utama untuk akses instan tanpa unduh PlayStore/AppStore.",
    ],
    currentY
  );

  // Langkah 2
  currentY = drawStepCard(
    2,
    "Otentikasi Akun Pegawai (Login Menggunakan Kode Akses NIP)",
    [
      "• Buka aplikasi Techno Sign, lalu masukkan Kode Akses NIP Anda (Contoh: STP-50120 atau STP-53851).",
      "• Masukkan kata sandi awal: StpUser2026! kemudian klik tombol 'Masuk ke Presensi'.",
      "• Jika lupa kode akses NIP, silakan periksa tabel direktori pegawai pada lembar lampiran dokumen ini.",
      "• Demi menjaga keamanan privasi dan akun, segera perbarui kata sandi Anda di menu pengaturan profil.",
    ],
    currentY
  );

  // Langkah 3
  currentY = drawStepCard(
    3,
    "Pencatatan Presensi Datang Pagi (Check-In Kehadiran & AI Liveness)",
    [
      "• Pastikan ponsel Anda telah berada di dalam lingkungan kawasan Solo Technopark dan fitur GPS (Lokasi Akurasi Tinggi) aktif.",
      "• Masuk ke menu 'Presensi', lalu berikan izin browser untuk mengakses Kamera dan Lokasi GPS.",
      "• Sistem otomatis memverifikasi batas koordinat kawasan Solo Technopark Jl. Ki Hajar Dewantara No. 19 Jebres.",
      "• Posisikan wajah Anda pada lingkaran kamera dengan penerangan cukup, lalu ambil swafoto (Check-In).",
      "• Tekan 'Kirim Presensi', sistem akan mencatat waktu kehadiran dan bukti swafoto terenkripsi ke server cloud.",
    ],
    currentY
  );

  // KOTAK PERSYARATAN TEKNIS PERANGKAT (Mengisi bagian bawah Halaman 1 agar proporsional dan elegan)
  const reqBoxH = 34;
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.borderLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, contentWidth, reqBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateDark);
  doc.text("PERSYARATAN TEKNIS PERANGKAT PEGAWAI:", margin + 5, currentY + 5);

  const reqLineY = currentY + 7;
  doc.setDrawColor(...colors.borderLight);
  doc.setLineWidth(0.15);
  doc.line(margin + 5, reqLineY, margin + contentWidth - 5, reqLineY);

  const reqColW = (contentWidth - 14) / 2;
  const reqCol1 = margin + 5;
  const reqCol2 = margin + 5 + reqColW + 4;

  let reqY = reqLineY + 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.slateBody);

  doc.text("• GPS Akurasi Tinggi: Wajib aktif untuk deteksi polygon kawasan STP.", reqCol1, reqY);
  doc.text("• Izin Kamera: Diperlukan untuk swafoto biometrik (AI Liveness).", reqCol1, reqY + 5);
  doc.text("• Mikrofon (Opsional): Untuk fitur pendiktean suara Logbook LKH.", reqCol1, reqY + 10);

  doc.text("• Koneksi Data: Jaringan 4G/5G atau WiFi resmi kawasan Solo Technopark.", reqCol2, reqY);
  doc.text("• Browser: Google Chrome (Android/Windows) & Safari (iOS).", reqCol2, reqY + 5);
  doc.text("• Bebas Mock GPS: Menonaktifkan opsi developer/aplikasi fake GPS.", reqCol2, reqY + 10);

  // ============================================================================
  // HALAMAN 2: LANGKAH 4, 5, 6, PROTOKOL ANTI-FRAUD MODULAR & PUSAT BANTUAN
  // ============================================================================
  doc.addPage();
  currentY = drawRunningHeader("PANDUAN OPERASIONAL SISTEM PRESENSI TECHNO SIGN v3.0");

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("PANDUAN OPERASIONAL PRESENSI (BAGIAN 2 DARI 2)", margin, currentY + 3);

  currentY += 6;

  // Langkah 4
  currentY = drawStepCard(
    4,
    "Pelaporan Kinerja Harian (Logbook LKH & Target Poin SKP)",
    [
      "• Setelah Check-In berhasil, buka menu 'Logbook Kinerja' atau 'LKH' untuk mendokumentasikan kegiatan kerja.",
      "• Pilih kategori tugas dan uraian kegiatan yang telah dilaksanakan sesuai sasaran kinerja pegawai (SKP).",
      "• Fitur Cepat Suara: Tekan ikon mikrofon untuk mendiktekan laporan kerja secara lisan (Voice-to-Text).",
      "• Unggah berkas atau foto bukti pendukung pekerjaan, lalu simpan laporan hingga akumulasi mencapai minimal 100 Poin SKP/hari.",
    ],
    currentY
  );

  // Langkah 5
  currentY = drawStepCard(
    5,
    "Pencatatan Presensi Pulang Kerja (Check-Out Kehadiran)",
    [
      "• Presensi kepulangan dapat dilakukan mulai pukul 16:00 WIB setelah menyelesaikan seluruh jam kerja kedinasan.",
      "• Masuk ke menu 'Presensi' dan pilih opsi 'Check-Out Pulang'.",
      "• Lakukan swafoto ulang di lokasi kerja sebagai konfirmasi kepulangan fisik yang sah.",
      "• Sistem akan menghitung total jam kerja efektif harian secara otomatis dan memperbarui rekap kehadiran Anda.",
    ],
    currentY
  );

  // Langkah 6
  currentY = drawStepCard(
    6,
    "Layanan Mandiri: Pengajuan Izin, Cuti, Lembur, dan Revisi Presensi",
    [
      "• Izin & Cuti: Pilih menu 'Pengajuan Izin' jika berhalangan hadir (Sakit, Cuti Tahunan, atau Dinas Luar) disertai bukti surat.",
      "• Surat Tugas Lembur: Ajukan form lembur apabila mendapatkan penugasan kedinasan di luar jam kerja reguler.",
      "• Revisi Presensi: Apabila terjadi kendala jaringan internet saat presensi di lokasi, ajukan revisi melalui form koreksi.",
      "• Seluruh pengajuan akan langsung diteruskan ke sistem dashboard Atasan/Admin untuk ditinjau dan disetujui secara digital.",
    ],
    currentY
  );

  // KOTAK PROTOKOL ANTI-FRAUD MODULAR (4 Card Bersekat Rapi, Nol Overlap)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("KETENTUAN PROTOKOL KEAMANAN & ANTI-FRAUD (ZERO-TRUST)", margin, currentY + 2);

  currentY += 5;

  const afModules = [
    {
      title: "1. Polygon Geofencing 8-Hektar Kawasan",
      desc: "Presensi hanya sah jika koordinat GPS perangkat berada di dalam perimeter fisik kawasan Solo Technopark. Presensi di luar batas pagar kawasan akan otomatis ditolak oleh server.",
    },
    {
      title: "2. Deteksi GPS Palsu (Mock Location Provider Block)",
      desc: "Aplikasi fake location atau developer mock provider akan diblokir seketika. Setiap upaya manipulasi lokasi dicatat dalam sistem audit integritas pegawai.",
    },
    {
      title: "3. AI Liveness & Stempel Forensik Digital",
      desc: "Kecerdasan buatan memverifikasi bahwa swafoto diambil langsung dari orang asli secara fisik (bukan foto dari layar HP/laptop). Foto dicap koordinat & stempel waktu permanen.",
    },
    {
      title: "4. Catatan Audit Forensik Tidak Dapat Dimanipulasi",
      desc: "Setiap riwayat Check-In, Check-Out, dan logbook terkunci dengan jejak IP address, User-Agent, dan timestamp presisi yang terenkripsi dan tidak dapat diubah oleh siapapun.",
    },
  ];

  const afCardH = 14.5;
  afModules.forEach((m) => {
    // Card Background
    doc.setFillColor(...colors.primaryBg);
    doc.setDrawColor(...colors.primaryMedium);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, afCardH, 1.8, 1.8, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...colors.primary);
    doc.text(m.title, margin + 4, currentY + 4.5);

    // Desc
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.9);
    doc.setTextColor(...colors.slateBody);
    const descLines = doc.splitTextToSize(m.desc, contentWidth - 8);
    let descY = currentY + 8;
    descLines.forEach((dl) => {
      doc.text(dl, margin + 4, descY);
      descY += 3.3;
    });

    currentY += afCardH + 2;
  });

  currentY += 2;

  // KOTAK PUSAT BANTUAN & HELPDESK BLUD STP (Mengisi bagian bawah Halaman 2 secara sempurna)
  const helpBoxH = 26;
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.borderLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, contentWidth, helpBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateDark);
  doc.text("PUSAT DUKUNGAN & LAYANAN BANTUAN TEKNIS (HELPDESK BLUD STP):", margin + 5, currentY + 5);

  const helpLineY = currentY + 7;
  doc.setDrawColor(...colors.borderLight);
  doc.setLineWidth(0.15);
  doc.line(margin + 5, helpLineY, margin + contentWidth - 5, helpLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.slateBody);

  const hCol1 = margin + 5;
  const hCol2 = margin + 5 + 92;

  doc.text("• Unit Pengelola: Sub Bagian Tata Usaha & Divisi IT STP", hCol1, helpLineY + 5);
  doc.text("• Lokasi Kantor: Gedung Utama Solo Technopark Lantai 2", hCol1, helpLineY + 10);
  doc.text("• Jam Pelayanan: Senin s/d Jumat, Pukul 08:00 – 16:00 WIB", hCol1, helpLineY + 15);

  doc.text("• Kendala Akun: Hubungi Admin Presensi di unit kerja masing-masing", hCol2, helpLineY + 5);
  doc.text("• Reset Sandi: Ajukan verifikasi ke Sub Bagian Tata Usaha", hCol2, helpLineY + 10);
  doc.text("• Form Revisi: Gunakan menu revisi aplikasi jika kendala jaringan", hCol2, helpLineY + 15);

  // ============================================================================
  // HALAMAN 3 & 4: DIREKTORI RESMI KREDENSIAL PEGAWAI SOLO TECHNOPARK
  // (Email kedinasan dihilangkan total, layout tabel lapang, pengesahan resmi di akhir)
  // ============================================================================
  doc.addPage();
  currentY = drawRunningHeader("DIREKTORI RESMI KREDENSIAL & KODE AKSES PEGAWAI");

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.slateDark);
  doc.text("DIREKTORI KODE AKSES NIP PEGAWAI SOLO TECHNOPARK", margin, currentY + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...colors.slateMuted);
  doc.text(
    "Daftar 46 pegawai resmi terdaftar pada database presensi. Gunakan Kode Akses NIP untuk otentikasi login:",
    margin,
    currentY + 7.5
  );

  currentY += 11;

  // Siapkan Data Tabel (HANYA NO, KODE AKSES NIP, NAMA LENGKAP, UNIT KERJA / PENUGASAN, ROLE AKSES)
  // Kolom email kedinasan dihilangkan sepenuhnya sesuai instruksi pengguna.
  const tableData = STP_CREDENTIALS_LIST.map((u, idx) => [
    idx + 1,
    u.accessCode,
    u.nama,
    u.jabatan || u.departmentName || "-",
    u.role.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { top: 26, bottom: 16, left: margin, right: margin },
    head: [["No", "Kode Akses (NIP)", "Nama Lengkap Pegawai", "Unit Kerja / Penugasan", "Role"]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.9,
      textColor: colors.slateBody,
      lineColor: colors.borderLight,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.6,
      halign: 'left',
      cellPadding: 2.6,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { halign: 'center', fontStyle: 'bold', textColor: colors.primary, cellWidth: 32 },
      2: { fontStyle: 'bold', textColor: colors.slateDark, cellWidth: 62 },
      3: { cellWidth: 57 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
    },
    didDrawPage: (data) => {
      // Jika melompat ke halaman berikutnya dari tabel (halaman ke-4 dokumen), gambar running header
      if (data.pageNumber > 1) {
        drawRunningHeader("DIREKTORI RESMI KREDENSIAL & KODE AKSES PEGAWAI");
      }
    },
  });

  // ============================================================================
  // PENGESAHAN DOKUMEN RESMI PADA HALAMAN AKHIR (DI BAWAH TABEL)
  // ============================================================================
  const lastTableY = doc.lastAutoTable.finalY;
  const signY = Math.min(lastTableY + 8, pageHeight - 55);

  // Catatan Kerahasiaan di Kiri
  const noteW = 95;
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.borderLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, signY, noteW, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("KETENTUAN KERAHASIAAN KREDENSIAL:", margin + 4, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...colors.slateBody);
  const noteText = [
    "1. Kode Akses NIP dan kata sandi bersifat rahasia kedinasan internal.",
    "2. Pegawai dilarang membagikan atau memindahtangankan akun kepada siapapun.",
    "3. Seluruh aktivitas presensi dan pelaporan kinerja dipantau oleh sistem audit forensik.",
    "4. Penggantian kata sandi berkala wajib dilakukan melalui menu pengaturan profil.",
  ];
  let noteTextY = signY + 10;
  noteText.forEach((nt) => {
    doc.text(nt, margin + 4, noteTextY);
    noteTextY += 5;
  });

  // Pengesahan Pemimpin BLUD di Kanan
  const signLeft = margin + noteW + 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.slateBody);
  doc.text("Surakarta, 12 Oktober 2026", signLeft + 15, signY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text("Pemimpin BLUD Solo Technopark", signLeft + 10, signY + 9.5);

  // Ruang Tanda Tangan / Stempel
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.slateMuted);
  doc.text("[ Ditandatangani Secara Elektronik ]", signLeft + 10, signY + 22);

  // Nama Pejabat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...colors.slateDark);
  doc.text("YUDIT CAHYANTORO NYOTO SAPUTRO, S.T., M.T.", signLeft, signY + 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...colors.slateMuted);
  doc.text("NIP. STP-22757  •  Pemimpin BLUD", signLeft + 14, signY + 33);

  // ============================================================================
  // FOOTER & NOMOR HALAMAN DI SELURUH LEMBAR
  // ============================================================================
  const totalPages = doc.getNumberOfPages();
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 9;
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, margin + contentWidth, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...colors.slateMuted);
    doc.text(
      `Dokumen Resmi UPTD KST Solo Technopark  •  Dicetak: ${printDateStr}`,
      margin,
      footerY + 3.8
    );

    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - margin,
      footerY + 3.8,
      { align: 'right' }
    );
  }

  // Simpan file ke public/docs/ dan mirror di public/
  const outDir = path.resolve(__dirname, '../public/docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'panduan-presensi-techno-sign.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, pdfBuffer);

  const rootPublicPdf = path.resolve(__dirname, '../public/panduan-presensi.pdf');
  fs.writeFileSync(rootPublicPdf, pdfBuffer);

  console.log(`✅ PDF Panduan Presensi berhasil diperbarui di: ${outPath} (${pdfBuffer.length} bytes, ${totalPages} halaman)`);
  console.log(`✅ Salinan root berhasil diperbarui di: ${rootPublicPdf}`);
}

generatePresensiGuidePdf().catch(console.error);
