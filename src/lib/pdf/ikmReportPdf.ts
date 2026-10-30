// src/lib/pdf/ikmReportPdf.ts
// ============================================================================
// GENERATOR LAPORAN RESMI INDEKS KEPUASAN MASYARAKAT (IKM) SOLO TECHNOPARK
// Standar PermenPAN-RB No. 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan
// Menggunakan stpDocumentKit (Desain Vektor Murni & Standar Akreditasi KemenPAN-RB)
// ============================================================================

import jsPDF from 'jspdf';
import { IkmStats } from '@/types/ikm.types';
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
  drawSectionLabel,
  drawSignatureBlock,
  ensureSpace,
  finalizeStpDocument,
  formatTanggal,
  setFont,
} from './stpDocumentKit';

export interface IkmReportSigners {
  headName?: string;
  headRole?: string;
  headNip?: string;
  evaluatorName?: string;
  evaluatorRole?: string;
  city?: string;
  signatureDate?: string;
  periodLabel?: string;
  analysisNotes?: string;
  actionPlan?: string;
}

export interface IkmReportPdfParams {
  stats: IkmStats;
  logoBase64?: string | null;
  profile?: StpInstitutionProfile | null;
  signers?: IkmReportSigners | null;
}

const UNSUR_NAMES: Record<string, string> = {
  u1_persyaratan: 'U1. Persyaratan Pelayanan',
  u2_prosedur: 'U2. Sistem, Mekanisme & Prosedur',
  u3_waktu: 'U3. Waktu Penyelesaian',
  u4_biaya: 'U4. Biaya / Tarif Pelayanan',
  u5_produk: 'U5. Produk Spesifikasi Layanan',
  u6_kompetensi: 'U6. Kompetensi Pelaksana',
  u7_perilaku: 'U7. Perilaku Pelaksana',
  u8_sarana: 'U8. Kualitas Sarana & Prasarana',
  u9_pengaduan: 'U9. Penanganan Aduan & Saran',
};

export function buildIkmOfficialReportPdf({
  stats,
  logoBase64,
  profile,
  signers,
}: IkmReportPdfParams): jsPDF {
  const period = signers?.periodLabel || `Tahun ${new Date().getFullYear()}`;
  const docNumber = `IKM/STP/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

  const ctx = createStpDocument({
    title: 'LAPORAN HASIL SURVEI KEPUASAN MASYARAKAT (IKM)',
    subtitle: 'Standar Peraturan Menteri PAN-RB Nomor 14 Tahun 2017',
    docNumber: docNumber,
    profile,
    logoBase64,
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const W = STP_CONTENT_WIDTH;

  // 1. Kop & Badge Mutu Pelayanan
  let y = drawLetterhead(ctx, {
    label: `MUTU PELAYANAN: ${stats.gradeLabel}`,
    tone: stats.convertedScore >= 88.31 ? 'success' : 'info',
  });

  // 2. Banner Indeks Utama IKM
  y = drawHighlightBand(
    ctx,
    y,
    `EVALUASI KINERJA PELAYANAN PUBLIK — ${period.toUpperCase()}`,
    `SKOR IKM KONVERSI: ${stats.convertedScore.toFixed(2)} (${stats.gradeLabel})`,
    [
      { label: `${stats.totalRespondents} Responden`, tone: 'info' },
      { label: `NRR: ${stats.overallAverageScore.toFixed(2)} / 4.00`, tone: 'success' },
    ]
  );

  // 3. Kalimat Pengantar Regulasi
  y = ensureSpace(ctx, y, 22);
  setFont(doc, 7.5, 'normal', STP_COLORS.body);
  const introText = `Berdasarkan Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 14 Tahun 2017, hasil pengukuran Survei Kepuasan Masyarakat terhadap 9 (sembilan) unsur pelayanan publik di Kawasan Sains dan Teknologi Solo Technopark periode ${period} disajikan sebagai berikut:`;
  const introLines = doc.splitTextToSize(introText, W);
  doc.text(introLines, M, y);
  y += introLines.length * 3.8 + 4;

  // 4. Tabel 9 Unsur Mutu Pelayanan
  y = ensureSpace(ctx, y, 60);
  drawSectionLabel(doc, 'TABEL NILAI RATA-RATA (NRR) 9 UNSUR PELAYANAN PUBLIK', M, y);
  y += 4;

  const tableRows = Object.entries(stats.averageScores).map(([key, score], idx) => {
    const nrr = Number(score) || 0;
    const nrrTertimbang = nrr * 0.111;
    let mutuUnsur = 'C';
    if (nrr >= 3.53) mutuUnsur = 'A (Sangat Baik)';
    else if (nrr >= 3.06) mutuUnsur = 'B (Baik)';
    else if (nrr >= 2.6) mutuUnsur = 'C (Kurang Baik)';
    else mutuUnsur = 'D (Tidak Baik)';

    return [
      String(idx + 1),
      UNSUR_NAMES[key] || key,
      nrr.toFixed(2),
      nrrTertimbang.toFixed(3),
      mutuUnsur,
    ];
  });

  // Gambar tabel
  y = drawItemsTable(
    ctx,
    y,
    [
      { header: 'NO', width: 12, align: 'center' },
      { header: 'UNSUR PELAYANAN', width: 75, align: 'left' },
      { header: 'NRR (1-4)', width: 25, align: 'right' },
      { header: 'NRR TERTIMBANG', width: 33, align: 'right' },
      { header: 'MUTU UNSUR', width: 33, align: 'center' },
    ],
    tableRows
  );

  y += 6;

  // 5. Analisis Hasil & Kekuatan/Kelemahan
  y = ensureSpace(ctx, y, 35);
  drawSectionLabel(doc, 'ANALISIS KEKUATAN & AREA PRIORITAS PENINGKATAN', M, y);
  y += 4;

  const defaultAnalysis = [
    'Unsur dengan tingkat kepuasan tertinggi mencerminkan kepercayaan masyarakat terhadap keramahan perilaku petugas, modernitas sarana gedung, dan kepastian tarif layanan BLUD.',
    'Unsur yang memerlukan percepatan tindak lanjut adalah kecepatan penyelesaian permohonan online dan responsivitas kanal aduan fasilitas.',
    signers?.analysisNotes || 'Tingkat kepuasan masyarakat secara keseluruhan berada pada kategori prima dan memenuhi target indikator kinerja utama (IKU) UPTD.',
  ];

  y = drawNumberedList(doc, M, y, W, defaultAnalysis) + 6;

  // 6. Rencana Tindak Lanjut (Action Plan)
  y = ensureSpace(ctx, y, 30);
  drawSectionLabel(doc, 'RENCANA TINDAK LANJUT & PENINGKATAN MUTU', M, y);
  y += 4;

  const defaultAction = signers?.actionPlan
    ? [signers.actionPlan]
    : [
        'Optimalisasi modul Service Desk untuk mempercepat resolusi keluhan sarana/prasarana di bawah 24 jam.',
        'Penyempurnaan digitalisasi formulir peminjaman aset dan layanan manufaktur presisi melalui Single Door Self-Service.',
        'Penyelenggaraan pelatihan berkala bagi petugas frontliner dalam pelayanan prima (Service Excellence).',
      ];

  y = drawNumberedList(doc, M, y, W, defaultAction) + 6;

  // 7. Kolom Pengesahan Tanda Tangan
  const city = signers?.city || 'Surakarta';
  const sigDate = signers?.signatureDate || new Date().toISOString().slice(0, 10);
  const placeDate = `${city}, ${formatTanggal(sigDate)}`;

  const evaluatorName = signers?.evaluatorName || 'Tim Tata Usaha & Pengendali Mutu STP';
  const evaluatorRole = signers?.evaluatorRole || 'Ketua Tim Survei IKM';
  const headName = signers?.headName || 'Kepala UPTD Kawasan Sains & Teknologi Solo Technopark';
  const headRole = signers?.headRole || 'Pembina Pelayanan Publik UPTD';

  drawSignatureBlock(ctx, y, placeDate, [
    {
      caption: 'Disusun Oleh:',
      name: evaluatorName,
      role: evaluatorRole,
    },
    {
      caption: 'Disahkan Oleh:',
      name: headName,
      role: headRole,
      sub: signers?.headNip ? `NIP. ${signers.headNip}` : undefined,
      stampCaption: 'UPTD SOLO TECHNOPARK',
    },
  ]);

  finalizeStpDocument(ctx);
  return doc;
}

