const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');

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
  console.log("Memulai pembuatan Dokumen Panduan Presensi Techno Sign PDF...");

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178 mm

  // Load logo dan optimasi ke resolusi cetak kompak (400px) menggunakan sharp
  const sharp = require('sharp');
  const logoPath = path.resolve(__dirname, '../public/logo-stp.png');
  let logoBase64 = null;
  if (fs.existsSync(logoPath)) {
    const optimizedLogoBuf = await sharp(logoPath)
      .resize(400, null, { withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    logoBase64 = `data:image/png;base64,${optimizedLogoBuf.toString('base64')}`;
  }

  // Helper Warna
  const colors = {
    primary: [6, 95, 70],       // Emerald 800
    primaryLight: [16, 185, 129], // Emerald 500
    primaryBg: [236, 253, 245],   // Emerald 50
    slateDark: [15, 23, 42],     // Slate 900
    slateBody: [51, 65, 85],     // Slate 700
    slateMuted: [100, 116, 139], // Slate 500
    borderLight: [226, 232, 240],// Slate 200
    cardBg: [248, 250, 252],     // Slate 50
    accentCyan: [8, 145, 178],   // Cyan 600
  };

  // Helper Header Kop Surat
  function drawKopHeader(yPos) {
    if (logoBase64) {
      try {
        // Aspek rasio logo STP sekitar 1.8:1
        doc.addImage(logoBase64, 'PNG', margin, yPos, 34, 16);
      } catch (e) {
        console.warn("Gagal menambahkan logo:", e);
      }
    }

    const textLeft = margin + 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colors.slateDark);
    doc.text("PEMERINTAH KOTA SURAKARTA", textLeft, yPos + 3.5);

    doc.setFontSize(11.5);
    doc.setTextColor(...colors.primary);
    doc.text("UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK", textLeft, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.slateMuted);
    doc.text("Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126", textLeft, yPos + 12);
    doc.text("Website: https://solotechnopark.id  |  Portal Presensi: https://katalog.solotechnopark.id/presensi", textLeft, yPos + 15.5);

    // Garis Kop Pembatas
    const lineY = yPos + 18.5;
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(margin, lineY, margin + contentWidth, lineY);

    doc.setDrawColor(...colors.primaryLight);
    doc.setLineWidth(0.25);
    doc.line(margin, lineY + 1.2, margin + contentWidth, lineY + 1.2);

    return lineY + 4;
  }

  // ============================================================================
  // HALAMAN 1: KOP, HERO BOX, LANGKAH 1 & 2 & 3
  // ============================================================================
  let currentY = drawKopHeader(12);

  // Judul Dokumen
  currentY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...colors.slateDark);
  doc.text("PANDUAN OPERASIONAL & DIREKTORI AKUN PEGAWAI", margin + contentWidth / 2, currentY, { align: 'center' });

  currentY += 5.5;
  doc.setFontSize(11);
  doc.setTextColor(...colors.primary);
  doc.text("SISTEM PRESENSI DIGITAL & KINERJA HARIAN (TECHNO SIGN v3.0)", margin + contentWidth / 2, currentY, { align: 'center' });

  // Hero Quick Info Card (Minimalist Luxury)
  currentY += 5;
  const cardHeight = 28;
  doc.setFillColor(...colors.primaryBg);
  doc.setDrawColor(...colors.primaryLight);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'FD');

  // Isi Hero Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.primary);
  doc.text("INFORMASI KUNCI SISTEM PRESENSI TECHNO SIGN:", margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateBody);

  const col1X = margin + 5;
  const col2X = margin + 92;

  doc.text("• Tautan Akses Aplikasi:", col1X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.accentCyan);
  doc.text("https://katalog.solotechnopark.id/presensi", col1X + 33, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("• Kata Sandi Default:", col1X, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateDark);
  doc.text("StpUser2026!  (Bisa diubah setelah login)", col1X + 33, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("• Metode Login:", col1X, currentY + 22);
  doc.text("Kode Akses NIP (misal STP-50120) ATAU Email Google STP", col1X + 33, currentY + 22);

  doc.text("• Jam Datang (Masuk):", col2X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("Maksimal 07:30 WIB", col2X + 33, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("• Jam Pulang (Keluar):", col2X, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("Minimal 16:00 WIB", col2X + 33, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateBody);
  doc.text("• Batas Lokasi Absensi:", col2X, currentY + 22);
  doc.text("Kawasan 8-Hektar Solo Technopark", col2X + 33, currentY + 22);

  currentY += cardHeight + 8;

  // Subjudul: 6 Langkah Cepat Penggunaan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("PANDUAN LANGKAH DEMI LANGKAH (STEP-BY-STEP)", margin, currentY);

  currentY += 4;

  // Helper Fungsi Menggambar Step Box Minimalis
  function drawStepBox(stepNum, title, descLines, yStart, boxH = 26) {
    // Background Card
    doc.setFillColor(...colors.cardBg);
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, yStart, contentWidth, boxH, 2.5, 2.5, 'FD');

    // Number Badge Bulat
    doc.setFillColor(...colors.primary);
    doc.circle(margin + 7, yStart + 7, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(stepNum), margin + 7, yStart + 8.2, { align: 'center' });

    // Step Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.slateDark);
    doc.text(title, margin + 14, yStart + 7.5);

    // Step Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.slateBody);

    let textY = yStart + 13;
    descLines.forEach((line) => {
      doc.text(line, margin + 14, textY);
      textY += 4.2;
    });

    return yStart + boxH + 3.5;
  }

  // Langkah 1
  currentY = drawStepBox(
    1,
    "Akses & Pasang Aplikasi ke Handphone (Instalasi PWA)",
    [
      "• Buka peramban di ponsel Anda (Google Chrome di Android, atau Safari di iPhone).",
      "• Kunjungi link: https://katalog.solotechnopark.id/presensi",
      "• Tekan menu browser lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).",
      "• Icon aplikasi Techno Sign resmi (berlogo perisai hijau neon) akan muncul di layar ponsel.",
    ],
    currentY,
    28
  );

  // Langkah 2
  currentY = drawStepBox(
    2,
    "Masuk ke Akun Pegawai (Login)",
    [
      "• Masukkan Kode Akses / NIP (misal: STP-50120) atau Email resmi (@solotechnopark.id).",
      "• Masukkan kata sandi default: StpUser2026! lalu tekan tombol 'Masuk'.",
      "• Alternatif: Gunakan tombol 'Masuk dengan Google' jika akun Anda sudah ditautkan.",
      "• Sangat disarankan untuk segera memperbarui sandi Anda di menu Profil demi keamanan akun.",
    ],
    currentY,
    28
  );

  // Langkah 3
  currentY = drawStepBox(
    3,
    "Melakukan Presensi Datang (Check-In Kehadiran)",
    [
      "• Pastikan Anda telah berada di lingkungan Kawasan Solo Technopark dan GPS ponsel aktif.",
      "• Masuk ke menu 'Presensi / Scan', izinkan peramban mengakses Kamera dan Lokasi GPS.",
      "• Sistem akan otomatis memvalidasi koordinat 8-hektar kawasan STP (Geofence Zero-Trust).",
      "• Ambil swafoto (wajah jelas tanpa masker/kacamata hitam), lalu tekan 'Konfirmasi Presensi'.",
      "• Status kehadiran Anda akan tercatat secara instan ke database presensi cloud.",
    ],
    currentY,
    32
  );

  // ============================================================================
  // HALAMAN 2: LANGKAH 4, 5, 6 & FITUR ANTI-FRAUD
  // ============================================================================
  doc.addPage();
  currentY = drawKopHeader(12);

  // Langkah 4
  currentY += 3;
  currentY = drawStepBox(
    4,
    "Pengisian Laporan Kinerja Harian (Logbook LKH / SKP)",
    [
      "• Setelah berhasil Check-In, buka menu 'Logbook Kinerja' atau 'LKH'.",
      "• Pilih jenis kegiatan tugas kedinasan yang Anda kerjakan atau gunakan templat cepat.",
      "• Tips Efisiensi: Gunakan fitur Voice-to-Text (ikon mikrofon) untuk mendikte laporan secara lisan.",
      "• Masukkan volume kegiatan dan unggah foto/dokumen bukti pendukung.",
      "• Pastikan akumulasi harian Anda memenuhi target minimal 100 Poin Kinerja SKP.",
    ],
    currentY,
    32
  );

  // Langkah 5
  currentY = drawStepBox(
    5,
    "Melakukan Presensi Pulang (Check-Out)",
    [
      "• Presensi pulang dapat dilakukan setelah pukul 16:00 WIB (jam kerja reguler).",
      "• Masuk ke menu 'Presensi', pilih opsi 'Check-Out Pulang'.",
      "• Lakukan swafoto ulang di lokasi kerja. PENTING: Dilarang menggunakan foto check-in pagi.",
      "• Sistem menghitung durasi jam kerja efektif hari tersebut dan merangkum riwayat kehadiran.",
    ],
    currentY,
    28
  );

  // Langkah 6
  currentY = drawStepBox(
    6,
    "Pengajuan Izin, Cuti, Lembur, dan Revisi Kehadiran",
    [
      "• Menu Izin/Cuti: Digunakan untuk izin dinas luar, cuti tahunan, atau sakit (wajib lampirkan surat dokter).",
      "• Menu Lembur: Digunakan jika ada penugasan lembur yang telah disetujui oleh atasan.",
      "• Menu Revisi: Jika ada kendala teknis (mati listrik/sinyal drop saat absen), ajukan koreksi dengan alasan.",
      "• Seluruh pengajuan akan langsung masuk ke dashboard Atasan/Admin untuk proses verifikasi digital.",
    ],
    currentY,
    28
  );

  // Box Keamanan & Anti-Fraud Suite
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.slateDark);
  doc.text("KETENTUAN KEAMANAN & PROTOKOL ANTI-FRAUD (ZERO-TRUST)", margin, currentY);

  currentY += 4;
  const afBoxH = 46;
  doc.setFillColor(...colors.primaryBg);
  doc.setDrawColor(...colors.primaryLight);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, currentY, contentWidth, afBoxH, 3, 3, 'FD');

  const afItems = [
    {
      title: "1. Polygon Geofencing 8 Hektar",
      desc: "Presensi hanya sah jika dilakukan di dalam koordinat fisik kawasan Solo Technopark. Sistem menolak presensi di luar batas pagar (termasuk area kampus UNS di seberang jalan).",
    },
    {
      title: "2. Deteksi GPS Palsu (Mock Location Block)",
      desc: "Penggunaan aplikasi Fake GPS, Mock Provider, atau spoofing lokasi akan langsung terdeteksi, dibatalkan oleh server, dan dicatat dalam audit trail forensik sistem.",
    },
    {
      title: "3. AI Liveness & Stempel Forensik Digital",
      desc: "Setiap swafoto diverifikasi oleh kecerdasan buatan (Clario Vision) untuk memastikan orang asli (bukan foto dari layar HP/laptop). Foto otomatis dicap stempel koordinat & NIP permanen.",
    },
    {
      title: "4. Audit Log Immutable (Tidak Dapat Dimanipulasi)",
      desc: "Setiap riwayat Check-In, Check-Out, dan koreksi data tersimpan aman dengan jejak IP Address, User-Agent, dan timestamp presisi yang tidak dapat diubah oleh siapapun.",
    },
  ];

  let afTextY = currentY + 7;
  afItems.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...colors.primary);
    doc.text(item.title + ": ", margin + 5, afTextY);

    const titleW = doc.getTextWidth(item.title + ": ");
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(...colors.slateBody);

    const lines = doc.splitTextToSize(item.desc, contentWidth - 10 - titleW);
    doc.text(lines[0], margin + 5 + titleW, afTextY);
    if (lines.length > 1) {
      afTextY += 3.8;
      doc.text(lines.slice(1).join(" "), margin + 5, afTextY);
    }
    afTextY += 6;
  });

  // Catatan Bantuan Helpdesk di bawah
  currentY += afBoxH + 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.slateMuted);
  doc.text(
    "* Jika mengalami kendala saat login atau presensi, silakan hubungi Tim IT / Admin BLUD Solo Technopark melalui Helpdesk internal.",
    margin,
    currentY
  );

  // ============================================================================
  // HALAMAN 3 & 4: DIREKTORI RESMI KREDENSIAL PEGAWAI SOLO TECHNOPARK
  // ============================================================================
  doc.addPage();
  currentY = drawKopHeader(12);

  currentY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.slateDark);
  doc.text("DIREKTORI RESMI AKUN PEGAWAI SOLO TECHNOPARK", margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateMuted);
  doc.text(
    "Daftar 46 akun pegawai terdaftar pada database 'presensi-pegawai'. Gunakan Kode Akses NIP atau Email untuk login:",
    margin,
    currentY
  );

  currentY += 4;

  // Format data tabel untuk autoTable
  const tableData = STP_CREDENTIALS_LIST.map((u, idx) => [
    idx + 1,
    u.nama,
    u.jabatan || "-",
    u.email,
    u.accessCode,
    u.role.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["No", "Nama Lengkap Pegawai", "Jabatan / Divisi", "Email Kedinasan", "Kode Akses (NIP)", "Role"]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.8,
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
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 44 },
      2: { cellWidth: 46 },
      3: { textColor: colors.accentCyan, cellWidth: 46 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 14 },
    },
    didDrawPage: (data) => {
      // Header kop di halaman selanjutnya jika ada pagebreak
      if (data.pageNumber > 3) {
        drawKopHeader(12);
      }
    },
  });

  // Footer & Penomoran Halaman di Setiap Lembar
  const totalPages = doc.getNumberOfPages();
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Garis Footer
    const footerY = pageHeight - 11;
    doc.setDrawColor(...colors.borderLight);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, margin + contentWidth, footerY);

    // Teks Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.slateMuted);
    doc.text(
      `Dokumen Resmi UPTD KST Solo Technopark  •  Dicetak: ${printDateStr}`,
      margin,
      footerY + 4
    );

    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - margin,
      footerY + 4,
      { align: 'right' }
    );
  }

  // Simpan file PDF ke public/docs/
  const outDir = path.resolve(__dirname, '../public/docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'panduan-presensi-techno-sign.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, pdfBuffer);

  // Buat juga salinan di root public/ agar bisa diakses via /panduan-presensi.pdf
  const rootPublicPdf = path.resolve(__dirname, '../public/panduan-presensi.pdf');
  fs.writeFileSync(rootPublicPdf, pdfBuffer);

  console.log(`✅ PDF Panduan Presensi berhasil dibuat di: ${outPath} (${pdfBuffer.length} bytes)`);
  console.log(`✅ Salinan root dibuat di: ${rootPublicPdf}`);
}

generatePresensiGuidePdf().catch(console.error);
