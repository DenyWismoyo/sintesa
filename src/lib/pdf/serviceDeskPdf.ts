// src/lib/pdf/serviceDeskPdf.ts
// ============================================================================
// GENERATOR DOKUMEN SERVICE DESK & PEMELIHARAAN ASET SOLO TECHNOPARK
// 1. Surat Perintah Kerja (SPK) Perbaikan Aset
// 2. Berita Acara Serah Terima (BAST) Penyelesaian Pekerjaan Servis
// Menggunakan stpDocumentKit (Desain Vektor Murni & Standar BLUD)
// ============================================================================

import jsPDF from 'jspdf';
import { WorkOrder } from '@/types/serviceDesk.types';
import {
  BadgeTone,
  STP_COLORS,
  STP_CONTENT_WIDTH,
  STP_PAGE,
  StpInstitutionProfile,
  createStpDocument,
  drawHighlightBand,
  drawItemsTable,
  drawKeyValueRows,
  drawLetterhead,
  drawNote,
  drawNumberedList,
  drawPartyBlock,
  drawResultBox,
  drawSectionLabel,
  drawSignatureBlock,
  drawTotalRow,
  ensureSpace,
  finalizeStpDocument,
  formatTanggal,
  measureNote,
  measureNumberedList,
  rupiah,
  setFont,
  truncate,
} from './stpDocumentKit';

export interface ServiceDeskSigners {
  issuerName?: string;
  issuerRole?: string;
  issuerNip?: string;
  technicianName?: string;
  technicianRole?: string;
  technicianPhone?: string;
  reporterName?: string;
  reporterRole?: string;
  city?: string;
  signatureDate?: string;
}

export interface ServiceDeskPdfParams {
  order: WorkOrder;
  logoBase64?: string | null;
  profile?: StpInstitutionProfile | null;
  signers?: ServiceDeskSigners | null;
  customNotes?: string;
}

const PRIORITY_TONES: Record<string, BadgeTone> = {
  RENDAH: 'neutral',
  SEDANG: 'info',
  TINGGI: 'warning',
  DARURAT: 'danger',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  OPEN: 'neutral',
  ASSIGNED: 'info',
  IN_PROGRESS: 'indigo',
  PENDING_PARTS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'success',
  CANCELLED: 'danger',
};

// ---------------------------------------------------------------------------
// 1. SURAT PERINTAH KERJA (SPK) PERBAIKAN ASET
// ---------------------------------------------------------------------------
export function buildMaintenanceSpkPdf({
  order,
  logoBase64,
  profile,
  signers,
  customNotes,
}: ServiceDeskPdfParams): jsPDF {
  const ctx = createStpDocument({
    title: 'SURAT PERINTAH KERJA (SPK)',
    subtitle: 'Pemeliharaan, Perbaikan Sarana & Fasilitas Kawasan',
    docNumber: order.spkNumber || `SPK/SD/${Date.now().toString().slice(-6)}`,
    profile,
    logoBase64,
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const W = STP_CONTENT_WIDTH;

  // 1. Kop Surat & Letterhead
  const priorityTone = PRIORITY_TONES[order.priority] || 'info';
  let y = drawLetterhead(ctx, {
    label: `PRIORITAS: ${order.priority}`,
    tone: priorityTone,
  });

  // 2. Banner Sorotan Pekerjaan
  y = drawHighlightBand(
    ctx,
    y,
    'SPESIFIKASI PEKERJAAN & LOKASI ASET',
    order.title || 'Perbaikan Fasilitas',
    [
      { label: `Aset: ${order.assetName}`, tone: 'neutral' },
      { label: `Lokasi: ${order.location || 'Kawasan STP'}`, tone: 'info' },
    ]
  );

  // 3. Pihak Terkait (Penerbit & Teknisi Pelaksana)
  const leftX = M;
  const colW = (W - 8) / 2;
  const rightX = M + colW + 8;

  const issuerName = signers?.issuerName || 'Pengelola Sarana & Prasarana';
  const issuerRole = signers?.issuerRole || 'Penanggung Jawab Fasilitas & K3';
  const techName = signers?.technicianName || order.technicianName || 'Tim Teknisi Lapangan';
  const techRole = signers?.technicianRole || 'Teknisi Pemeliharaan STP';

  const partyTopY = y;
  const hLeft = drawPartyBlock(doc, leftX, partyTopY, colW, {
    label: 'PEJABAT PEMBERI TUGAS',
    name: issuerName,
    subtitle: issuerRole,
    lines: [
      'UPTD Kawasan Sains & Teknologi Solo Technopark',
      'Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta',
      signers?.issuerNip ? `NIP/NIK: ${signers.issuerNip}` : 'Manajemen Fasilitas & Aset BLUD',
    ],
  });

  const hRight = drawPartyBlock(doc, rightX, partyTopY, colW, {
    label: 'TEKNISI PELAKSANA TUGAS',
    name: techName,
    subtitle: techRole,
    lines: [
      'Divisi Pemeliharaan & Service Desk STP',
      `Target: ${order.targetCompletionDate ? formatTanggal(order.targetCompletionDate) : 'Sesuai SLA'}`,
      signers?.technicianPhone || order.technicianPhone ? `Telp: ${signers?.technicianPhone || order.technicianPhone}` : 'Siaga On-Call',
    ],
  });

  y = Math.max(hLeft, hRight) + 6;

  // 4. Detail Kerusakan & Parameter Tugas
  y = ensureSpace(ctx, y, 40);
  drawSectionLabel(doc, 'RINCIAN KERUSAKAN & INSTRUKSI KERJA', M, y);
  y += 4;

  const keyValues = [
    { label: 'Keluhan / Masalah', value: order.issueDescription || '-' },
    { label: 'Pelapor Aset', value: `${order.reporterName || 'Staf'} (${order.source || 'INTERNAL'})` },
    { label: 'Estimasi Biaya Suku Cadang', value: order.estimatedCost ? rupiah(order.estimatedCost) : 'Dalam Telaah' },
    { label: 'Tingkat Prioritas', value: order.priority || 'SEDANG' },
  ];

  y = drawKeyValueRows(doc, M, y, W, keyValues) + 6;

  // 5. Ketentuan Standar Operasional Prosedur (SOP)
  y = ensureSpace(ctx, y, 35);
  drawSectionLabel(doc, 'KETENTUAN PELAKSANAAN KERJA (SOP)', M, y);
  y += 4;

  const sopTerms = [
    'Teknisi wajib menerapkan standar Keselamatan dan Kesehatan Kerja (K3) serta mengenakan APD yang sesuai di area kerja.',
    'Pengerjaan tidak boleh mengganggu kenyamanan pengguna tenant, peserta pelatihan, atau agenda MICE yang sedang berlangsung.',
    'Apabila ditemukan kerusakan suku cadang tambahan di luar SPK ini, segera melapor kepada Pengelola Fasilitas sebelum melakukan penggantian.',
    'Setelah perbaikan tuntas, teknisi wajib melakukan uji fungsi (commissioning test) bersama pelapor/pengguna ruangan dan menandatangani BAST.',
  ];

  y = drawNumberedList(doc, M, y, W, sopTerms) + 6;

  // Catatan Tambahan Jika Ada
  if (customNotes) {
    y = ensureSpace(ctx, y, 20);
    y = drawNote(doc, M, y, W, `Catatan Khusus Pengelola: ${customNotes}`) + 6;
  }

  // 6. Kolom Tanda Tangan Resmi
  const city = signers?.city || 'Surakarta';
  const dateStr = formatTanggal(signers?.signatureDate || new Date().toISOString().slice(0, 10));
  const placeDate = `${city}, ${dateStr}`;

  drawSignatureBlock(ctx, y, placeDate, [
    {
      caption: 'Penerima Tugas / Teknisi,',
      name: techName,
      role: techRole,
    },
    {
      caption: 'Mengetahui & Menugaskan,',
      name: issuerName,
      role: issuerRole,
      sub: signers?.issuerNip ? `NIP. ${signers.issuerNip}` : undefined,
      stampCaption: 'UPTD SOLO TECHNOPARK',
    },
  ]);

  finalizeStpDocument(ctx);
  return doc;
}

// ---------------------------------------------------------------------------
// 2. BERITA ACARA SERAH TERIMA (BAST) SELESAI PEKERJAAN
// ---------------------------------------------------------------------------
export function buildMaintenanceBastPdf({
  order,
  logoBase64,
  profile,
  signers,
  customNotes,
}: ServiceDeskPdfParams): jsPDF {
  const bastNumber = `BAST/SD/${Date.now().toString().slice(-6)}`;
  const ctx = createStpDocument({
    title: 'BERITA ACARA SERAH TERIMA (BAST)',
    subtitle: 'Hasil Pemeliharaan & Perbaikan Sarana Prasarana',
    docNumber: bastNumber,
    profile,
    logoBase64,
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const W = STP_CONTENT_WIDTH;

  // 1. Kop & Status Sukses Selesai
  let y = drawLetterhead(ctx, {
    label: 'PEKERJAAN SELESAI (RESOLVED)',
    tone: 'success',
  });

  // 2. Banner Pernyataan Serah Terima
  y = drawHighlightBand(
    ctx,
    y,
    'PERNYATAAN SERAH TERIMA PEKERJAAN',
    `Penyelesaian Perbaikan: ${order.assetName}`,
    [
      { label: `Rujukan: ${order.spkNumber || '-'}`, tone: 'neutral' },
      { label: `Selesai: ${formatTanggal(order.bastSignedDate || new Date().toISOString().slice(0, 10))}`, tone: 'success' },
    ]
  );

  // 3. Pernyataan Pembuka BAST
  y = ensureSpace(ctx, y, 30);
  setFont(doc, 7.5, 'normal', STP_COLORS.body);
  const introText = `Pada hari ini, tanggal ${formatTanggal(order.bastSignedDate || new Date().toISOString().slice(0, 10))}, bertempat di Kawasan Sains dan Teknologi Solo Technopark, telah dilakukan pemeriksaan dan serah terima hasil pekerjaan pemeliharaan sarana/prasarana dengan rincian sebagai berikut:`;
  const introLines = doc.splitTextToSize(introText, W);
  doc.text(introLines, M, y);
  y += introLines.length * 3.8 + 4;

  // 4. Data Teknis Pekerjaan
  const details = [
    { label: 'Objek / Sarana', value: `${order.assetName} (${order.location || 'Kawasan STP'})` },
    { label: 'Uraian Masalah Awal', value: order.issueDescription || '-' },
    { label: 'Tindakan Perbaikan', value: order.completionNotes || 'Pekerjaan perbaikan dan kalibrasi tuntas.' },
    { label: 'Teknisi Pelaksana', value: `${order.technicianName || signers?.technicianName || '-'} (${order.technicianPhone || '-'})` },
    { label: 'Realisasi Biaya Perbaikan', value: order.actualCost ? rupiah(order.actualCost) : 'Rp 0 (Pemeliharaan Rutin)' },
    { label: 'Status Uji Coba', value: 'BAIK & BERFUNGSI NORMAL (100% Lolos Uji Fungsi)' },
  ];

  y = drawKeyValueRows(doc, M, y, W, details) + 6;

  // 5. Kesimpulan & Garansi
  y = ensureSpace(ctx, y, 35);
  drawSectionLabel(doc, 'KESIMPULAN PEMERIKSAAN BERSAMA', M, y);
  y += 4;

  const conclusionPoints = [
    'Seluruh pekerjaan perbaikan fisik dan instalasi telah dilaksanakan sesuai standar operasional yang ditetapkan.',
    'Pihak penerima fasilitas telah melakukan pengecekan langsung dan menyatakan sarana/prasarana telah berfungsi normal tanpa kendala.',
    'Hasil pekerjaan ini dilindungi masa garansi pemeliharaan teknis internal selama 14 (empat belas) hari kalender sejak penandatanganan Berita Acara ini.',
  ];

  y = drawNumberedList(doc, M, y, W, conclusionPoints) + 6;

  if (customNotes) {
    y = ensureSpace(ctx, y, 18);
    y = drawNote(doc, M, y, W, `Catatan Tambahan: ${customNotes}`) + 6;
  }

  // 6. Penandatanganan 3 Pihak (Teknisi, Pengguna/Pelapor, dan Pengelola Fasilitas)
  const city = signers?.city || 'Surakarta';
  const dateStr = formatTanggal(signers?.signatureDate || order.bastSignedDate || new Date().toISOString().slice(0, 10));
  const placeDate = `${city}, ${dateStr}`;

  const techName = signers?.technicianName || order.technicianName || 'Teknisi Lapangan';
  const reporterName = signers?.reporterName || order.reporterName || 'Pengguna / Pelapor Aset';
  const issuerName = signers?.issuerName || 'Pengelola Fasilitas & Sarpras';

  drawSignatureBlock(ctx, y, placeDate, [
    {
      caption: 'Yang Menyerahkan (Teknisi),',
      name: techName,
      role: signers?.technicianRole || 'Teknisi Pelaksana',
    },
    {
      caption: 'Yang Menerima (Pengguna),',
      name: reporterName,
      role: signers?.reporterRole || 'Perwakilan Pemohon / Ruangan',
    },
    {
      caption: 'Mengetahui & Menyetujui,',
      name: issuerName,
      role: signers?.issuerRole || 'Kasubag / Penanggung Jawab Kawasan',
      sub: signers?.issuerNip ? `NIP. ${signers.issuerNip}` : undefined,
      stampCaption: 'UPTD SOLO TECHNOPARK',
    },
  ]);

  finalizeStpDocument(ctx);
  return doc;
}

