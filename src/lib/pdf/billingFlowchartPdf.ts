// src/lib/pdf/billingFlowchartPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  createStpDocument,
  drawLetterhead,
  drawContinuationHeader,
  finalizeStpDocument,
  setFont,
  STP_PAGE,
  STP_CONTENT_WIDTH,
  STP_COLORS
} from './stpDocumentKit';

export interface BillingFlowchartPdfParams {
  logoBase64?: string | null;
  generatedDate?: string;
  authorName?: string;
}

/**
 * Fungsi pembantu judul sub-bab
 */
function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  setFont(doc, 8.5, 'bold', STP_COLORS.ink);
  doc.text(title, STP_PAGE.margin, y);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(STP_PAGE.margin, y + 2, STP_PAGE.width - STP_PAGE.margin, y + 2);
  return y + 6;
}

/**
 * Fungsi pembantu untuk menggambar kotak langkah flowchart (Step Box)
 */
function drawFlowStep(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  stepNum: string,
  title: string,
  desc: string,
  tone: 'indigo' | 'emerald' | 'amber' | 'blue' | 'slate' = 'indigo'
) {
  const colors = {
    indigo: { bg: [238, 242, 255], border: [99, 102, 241], text: [67, 56, 202], numBg: [79, 70, 229] },
    emerald: { bg: [236, 253, 245], border: [16, 185, 129], text: [4, 120, 87], numBg: [5, 150, 105] },
    amber: { bg: [255, 251, 235], border: [245, 158, 11], text: [180, 83, 9], numBg: [217, 119, 6] },
    blue: { bg: [239, 246, 255], border: [59, 130, 246], text: [29, 78, 216], numBg: [37, 99, 235] },
    slate: { bg: [248, 250, 252], border: [148, 163, 184], text: [30, 41, 59], numBg: [71, 85, 105] }
  }[tone];

  // Kotak utama
  doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Badge nomor
  doc.setFillColor(colors.numBg[0], colors.numBg[1], colors.numBg[2]);
  doc.roundedRect(x + 2, y + 2, 6, 5, 1, 1, 'F');
  setFont(doc, 7, 'bold', [255, 255, 255]);
  doc.text(stepNum, x + 5, y + 5.5, { align: 'center' });

  // Judul langkah
  setFont(doc, 7.8, 'bold', colors.text as [number, number, number]);
  doc.text(title, x + 9.5, y + 5.5);

  // Deskripsi ringkas
  setFont(doc, 6.5, 'normal', STP_COLORS.body);
  const splitText = doc.splitTextToSize(desc, w - 6);
  doc.text(splitText, x + 3, y + 10);
}

/**
 * Gambar panah alur antar kotak
 */
function drawFlowArrow(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, label?: string) {
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.line(x1, y1, x2, y2);

  // Ujung panah
  if (x1 === x2) {
    const sign = y2 > y1 ? 1 : -1;
    doc.line(x2, y2, x2 - 1.5, y2 - 2 * sign);
    doc.line(x2, y2, x2 + 1.5, y2 - 2 * sign);
    if (label) {
      setFont(doc, 6, 'bold', STP_COLORS.muted);
      doc.text(label, x1 + 2, (y1 + y2) / 2);
    }
  } else if (y1 === y2) {
    const sign = x2 > x1 ? 1 : -1;
    doc.line(x2, y2, x2 - 2 * sign, y2 - 1.5);
    doc.line(x2, y2, x2 - 2 * sign, y2 + 1.5);
    if (label) {
      setFont(doc, 6, 'bold', STP_COLORS.muted);
      doc.text(label, (x1 + x2) / 2, y1 - 1.5, { align: 'center' });
    }
  }
}

/**
 * Membangun Dokumen PDF Resmi Flowchart Alur Invoice Lintas Divisi Solo Technopark
 */
export function buildBillingFlowchartPdf(params: BillingFlowchartPdfParams = {}): jsPDF {
  const { logoBase64, generatedDate = new Date().toLocaleDateString('id-ID'), authorName = 'Bagian Keuangan & BLUD STP' } = params;

  const ctx = createStpDocument({
    title: 'FLOWCHART PROSES OPERASIONAL INVOICE',
    subtitle: 'Pedoman Alur Penerbitan Tagihan Lintas Divisi ke Billing & Kasir BLUD',
    docNumber: 'SOP/STP-FIN/2026/01',
    logoBase64
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const R = STP_PAGE.width - STP_PAGE.margin;
  const contentW = STP_CONTENT_WIDTH;

  // =========================================================================
  // HALAMAN 1: EXECUTIVE SUMMARY & TABEL 5 DIVISI PEMOHON
  // =========================================================================
  let y = drawLetterhead(ctx, { label: 'SOP BAHAN RAPAT', tone: 'indigo' });

  // Banner Pengantar Rapat
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, contentW, 16, 2, 2, 'FD');

  setFont(doc, 8, 'bold', STP_COLORS.text);
  doc.text('Tujuan Dokumen & Kerangka Integrasi Keuangan BLUD:', M + 4, y + 4.5);
  setFont(doc, 6.8, 'normal', STP_COLORS.body);
  const introText =
    'Dokumen ini menetapkan standar operasional baku (SOP) alur penerbitan invoice dari 5 divisi operasional penghasil pendapatan (Profit Center) menuju Loket/Kasir Keuangan Terpadu Solo Technopark (/billing), termasuk pencatatan uang muka (DP), verifikasi bukti bayar, jurnal kas otomatis, dan penutupan piutang.';
  doc.text(doc.splitTextToSize(introText, contentW - 8), M + 4, y + 8.5);

  y += 20;

  // Section 1: Matriks Tanggung Jawab Divisi & Pola Penomoran Tagihan
  y = drawSectionHeader(doc, y, '1. Matriks Penanggung Jawab Divisi & Kode Akun Pendapatan BLUD');

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columns: [
      { header: 'Divisi / Unit BLUD', dataKey: 'division' },
      { header: 'Penanggung Jawab', dataKey: 'role' },
      { header: 'Awalan No. Tagihan', dataKey: 'prefix' },
      { header: 'Trigger Muncul Invoice', dataKey: 'trigger' },
      { header: 'Akun BAS / COA BLUD', dataKey: 'coa' }
    ],
    body: [
      {
        division: 'Jasa Produksi & Manufaktur',
        role: 'Admin Jasa Produksi',
        prefix: 'INV/PROD/DP & LUNAS',
        trigger: 'Draf SPK disetujui / Klik Terbitkan Tagihan',
        coa: '4.1.02 Pendapatan Manufaktur & Fabrikasi'
      },
      {
        division: 'Sewa Fasilitas & Aset',
        role: 'Admin Booking Gedung',
        prefix: 'INV/BLUD/SEWA/...',
        trigger: 'Peminjaman disetujui (Approved Booking)',
        coa: '4.1.01 Pendapatan Sewa Gedung & Laboratorium'
      },
      {
        division: 'Diklat & Pelatihan Kerja',
        role: 'Admin Pelatihan (LMS)',
        prefix: 'INV/TRN/...',
        trigger: 'Pendaftaran peserta / instansi masuk',
        coa: '4.1.03 Pendapatan Jasa Pelatihan & Sertifikasi'
      },
      {
        division: 'Inkubasi Tenant & Startup',
        role: 'Admin Tenant & Inkubator',
        prefix: 'INV/TENANT/...',
        trigger: 'Penerbitan tagihan sewa ruang/coworking',
        coa: '4.1.04 Pendapatan Jasa Inkubasi Startup'
      },
      {
        division: 'Katalog Produk & Merchandise',
        role: 'Admin E-Katalog STP',
        prefix: 'INV/CAT/...',
        trigger: 'Checkout pesanan e-katalog disetujui',
        coa: '4.1.05 Pendapatan Penjualan Produk & Mockup'
      },
      {
        division: 'Layanan Umum & Kasir',
        role: 'Bendahara / Kasir Loket',
        prefix: 'INV/BLUD/...',
        trigger: 'Penerbitan tagihan manual di loket',
        coa: '4.1.99 Pendapatan Jasa Layanan Umum Lainnya'
      }
    ],
    theme: 'grid'
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Arsitektur Two-Way Handshake
  y = drawSectionHeader(doc, y, '2. Model Integrasi Dua Arah (Two-Way Handshake Hook)');

  const boxW = (contentW - 12) / 3;
  const boxH = 22;
  const gap = 6;
  const startX = M;

  drawFlowStep(
    doc,
    startX,
    y,
    boxW,
    boxH,
    '1',
    'DIVISI OPERASIONAL',
    'Admin divisi menerbitkan invoice dari modul kerja masing-masing. Terbentuk tagihan status PENDING di Firestore.',
    'indigo'
  );

  drawFlowArrow(doc, startX + boxW, y + boxH / 2, startX + boxW + gap, y + boxH / 2);

  drawFlowStep(
    doc,
    startX + boxW + gap,
    y,
    boxW,
    boxH,
    '2',
    'LOKET KEUANGAN',
    'Kasir memverifikasi pembayaran (Tunai/VA/QRIS/Transfer), mencatat di jurnal kas & menerbitkan kwitansi resmi.',
    'amber'
  );

  drawFlowArrow(doc, startX + (boxW + gap) * 2, y + boxH / 2, startX + (boxW + gap) * 2 + gap, y + boxH / 2);

  drawFlowStep(
    doc,
    startX + (boxW + gap) * 2 + gap,
    y,
    boxW,
    boxH,
    '3',
    'AUTO-SYNC DIVISI',
    'syncBackToOrigin otomatis mengupdate modul asal: SPK menjadi IN_PRODUCTION, Booking confirmed, Pelatihan aktif.',
    'emerald'
  );

  // =========================================================================
  // HALAMAN 2: FLOWCHART DETAIL PROSES PER DIVISI (PRODUKSI, FASILITAS, DIKLAT)
  // =========================================================================
  doc.addPage();
  y = drawContinuationHeader(ctx);

  y = drawSectionHeader(doc, y, '3. Detail Alur: Divisi Jasa Produksi & Manufaktur');

  const pW = (contentW - 9) / 4;
  const pH = 24;

  drawFlowStep(doc, M, y, pW, pH, 'A1', 'Konsultasi & SPK', 'Klien serahkan CAD/desain. Admin buat rincian biaya & terbitkan SPK resmi.', 'indigo');
  drawFlowArrow(doc, M + pW, y + pH / 2, M + pW + 3, y + pH / 2);

  drawFlowStep(doc, M + pW + 3, y, pW, pH, 'A2', 'Invoice DP (30%)', 'Admin klik "Invoice" pilih jenis Uang Muka. Tagihan INV/PROD/DP terbit di Billing.', 'blue');
  drawFlowArrow(doc, M + (pW + 3) * 2, y + pH / 2, M + (pW + 3) * 2 + 3, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 2 + 3, y, pW, pH, 'A3', 'Kasir Verifikasi', 'Kasir terima bayar DP. Order otomatis DP_PAID & masuk IN_PRODUCTION bengkel.', 'amber');
  drawFlowArrow(doc, M + (pW + 3) * 3 + 3, y + pH / 2, M + (pW + 3) * 3 + 6, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 3 + 6, y, pW, pH, 'A4', 'QC, SJ & Pelunasan', 'Produksi tuntas, lolos QC. Buat Surat Jalan & Invoice Pelunasan (70%). Lunas!', 'emerald');

  y += pH + 10;

  // Detail Divisi Fasilitas & Gedung
  y = drawSectionHeader(doc, y, '4. Detail Alur: Divisi Sewa Fasilitas, Gedung & Laboratorium');

  drawFlowStep(doc, M, y, pW, pH, 'B1', 'Permohonan Sewa', 'Pemohon mengajukan reservasi via web publik / B2B atau loket aset STP.', 'indigo');
  drawFlowArrow(doc, M + pW, y + pH / 2, M + pW + 3, y + pH / 2);

  drawFlowStep(doc, M + pW + 3, y, pW, pH, 'B2', 'Approval & Add-on', 'Admin booking cek slot jadwal, setujui & tambahkan biaya kebersihan/listrik.', 'blue');
  drawFlowArrow(doc, M + (pW + 3) * 2, y + pH / 2, M + (pW + 3) * 2 + 3, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 2 + 3, y, pW, pH, 'B3', 'Invoice INV/SEWA', 'Sistem terbitkan tagihan ke Billing. Kode COA otomatis 4.1.01 (Sewa Gedung).', 'amber');
  drawFlowArrow(doc, M + (pW + 3) * 3 + 3, y + pH / 2, M + (pW + 3) * 3 + 6, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 3 + 6, y, pW, pH, 'B4', 'Pelunasan & Izin', 'Kasir terima pembayaran. Status booking completed, izin pemakaian fasilitas aktif.', 'emerald');

  y += pH + 10;

  // Detail Divisi Diklat & LMS
  y = drawSectionHeader(doc, y, '5. Detail Alur: Divisi Diklat & Pelatihan Kerja (LMS)');

  drawFlowStep(doc, M, y, pW, pH, 'C1', 'Buka Pendaftaran', 'Divisi Diklat rilis batch pelatihan vokasi / sertifikasi kompetensi industri.', 'indigo');
  drawFlowArrow(doc, M + pW, y + pH / 2, M + pW + 3, y + pH / 2);

  drawFlowStep(doc, M + pW + 3, y, pW, pH, 'C2', 'Invoice INV/TRN', 'Peserta/instansi mendaftar. Terbentuk tagihan kursus ber-referralCode.', 'blue');
  drawFlowArrow(doc, M + (pW + 3) * 2, y + pH / 2, M + (pW + 3) * 2 + 3, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 2 + 3, y, pW, pH, 'C3', 'Verifikasi Kasir', 'Kasir verifikasi transfer / QRIS. Akun COA 4.1.03 otomatis teralokasi.', 'amber');
  drawFlowArrow(doc, M + (pW + 3) * 3 + 3, y + pH / 2, M + (pW + 3) * 3 + 6, y + pH / 2);

  drawFlowStep(doc, M + (pW + 3) * 3 + 6, y, pW, pH, 'C4', 'Akses Kelas Aktif', 'Pendaftaran CONFIRMED, peserta mendapatkan akun LMS & modul pembelajaran.', 'emerald');

  // =========================================================================
  // HALAMAN 3: SOP LOKET BILLING KEUANGAN, JURNAL OTOMATIS & MONITORING
  // =========================================================================
  doc.addPage();
  y = drawContinuationHeader(ctx);

  y = drawSectionHeader(doc, y, '6. Prosedur Kerja Kasir & Loket Penerimaan Keuangan BLUD (/billing)');

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columns: [
      { header: 'No', dataKey: 'no' },
      { header: 'Tahapan Operasional Kasir', dataKey: 'step' },
      { header: 'Menu / Fitur di Sistem', dataKey: 'menu' },
      { header: 'Dampak & Integrasi Otomatis', dataKey: 'effect' }
    ],
    body: [
      {
        no: '1',
        step: 'Monitoring Tagihan Masuk Per Divisi',
        menu: 'Tab Invoices (Filter Divisi)',
        effect: 'Kasir menyaring tagihan khusus Jasa Produksi, Fasilitas, Diklat, Tenant, atau Katalog.'
      },
      {
        no: '2',
        step: 'Pemeriksaan Bukti Transfer Pelanggan',
        menu: 'Status Filter: Ada Bukti Transfer',
        effect: 'Kasir mengecek lampiran struk transfer bank / bukti setor yang diunggah klien.'
      },
      {
        no: '3',
        step: 'Pencatatan Pembayaran (DP / Penuh)',
        menu: 'Modal Form Payment / Terima Pembayaran',
        effect: 'Kasir memilih rekening kas bank penerima (mis. Kas Tunai / BPD Jateng BLUD).'
      },
      {
        no: '4',
        step: 'Jurnal Akuntansi Double-Entry Otomatis',
        menu: 'Buku Besar & Jurnal Kasir (Auto)',
        effect: 'Sistem otomatis menjurnal DEBIT: Rekening Kas Bank, KREDIT: Piutang / Pendapatan Divisi.'
      },
      {
        no: '5',
        step: 'Pencetakan Kwitansi Sah STP',
        menu: 'Cetak Kwitansi (PDF Vektor Murni)',
        effect: 'Menerbitkan tanda terima bermaterai/barcode resmi dengan nomor kwitansi urut BLUD.'
      },
      {
        no: '6',
        step: 'Sinkronisasi Otomatis ke Divisi Asal',
        menu: 'Trigger syncBackToOrigin',
        effect: 'Status pesanan bengkel, ruang gedung, atau pelatihan otomatis berubah tanpa input manual.'
      },
      {
        no: '7',
        step: 'Pengawasan Piutang Macet (Aging)',
        menu: 'Tab Aging Piutang (Per Divisi)',
        effect: 'Kasir memantau umur tagihan (>30, >60, >90 hari) dan koordinasi penagihan via PIC Divisi.'
      }
    ],
    theme: 'striped'
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 7: Monitoring Mandiri di Modul Divisi
  y = drawSectionHeader(doc, y, '7. Fitur Pemantauan Mandiri Divisi (Division Invoice Tracker)');

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, contentW, 25, 2, 2, 'FD');

  setFont(doc, 7.8, 'bold', STP_COLORS.text);
  doc.text('Keunggulan Komponen DivisionInvoiceTracker di Menu Operasional:', M + 4, y + 5);
  setFont(doc, 6.8, 'normal', STP_COLORS.body);
  const trackerPoints = [
    '• Transparansi Real-Time: Admin divisi (mis. Jasa Produksi di /jasa-produksi) dapat melihat langsung status pembayaran pesanan tanpa harus bertanya ke kasir.',
    '• Indikator Finansial Lengkap: Menampilkan omzet layanan, kas terealisasi, sisa piutang, dan notifikasi bukti transfer yang baru diunggah klien.',
    '• Fitur Tindakan Cepat: Admin dapat menyalin tautan pembayaran online, memeriksa rincian invoice, dan melacak histori setoran langsung dari modulnya.'
  ];
  let ty = y + 9.5;
  trackerPoints.forEach(p => {
    doc.text(p, M + 4, ty);
    ty += 4.5;
  });

  // Tanda Tangan Pengesahan Dokumen Rapat
  y += 34;
  const signW = 60;
  const signX = R - signW;

  setFont(doc, 7.2, 'normal', STP_COLORS.body);
  doc.text(`Surakarta, ${generatedDate}`, signX, y);
  doc.text('Disiapkan oleh:', signX, y + 4.5);
  setFont(doc, 8, 'bold', STP_COLORS.ink);
  doc.text(authorName, signX, y + 20);
  setFont(doc, 7, 'normal', STP_COLORS.muted);
  doc.text('Unit Keuangan & Sistem Informasi BLUD Solo Technopark', signX, y + 24);

  // Finalisasi Dokumen Resmi
  finalizeStpDocument(ctx);

  return doc;
}
