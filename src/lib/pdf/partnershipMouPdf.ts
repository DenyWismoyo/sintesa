// src/lib/pdf/partnershipMouPdf.ts
// ============================================================================
// GENERATOR DOKUMEN KEMITRAAN INDUSTRI & B2B SOLO TECHNOPARK
// 1. Draf Nota Kesepahaman (MoU / PKS) Standar BLUD
// 2. Lembar Disposisi & Telaah Kelayakan Kerjasama (Executive Memo)
// Menggunakan stpDocumentKit (Desain Vektor Murni & Standar Hukum BLUD)
// ============================================================================

import jsPDF from 'jspdf';
import { MouContract } from '@/types/partnership.types';
import {
  BadgeTone,
  STP_COLORS,
  STP_CONTENT_WIDTH,
  STP_PAGE,
  StpInstitutionProfile,
  createStpDocument,
  drawHighlightBand,
  drawKeyValueRows,
  drawLetterhead,
  drawNote,
  drawNumberedList,
  drawPartyBlock,
  drawSectionLabel,
  drawSignatureBlock,
  ensureSpace,
  finalizeStpDocument,
  formatTanggal,
  setFont,
  truncate,
} from './stpDocumentKit';

export interface PartnershipSigners {
  firstPartyName?: string;
  firstPartyRole?: string;
  firstPartyNip?: string;
  secondPartyName?: string;
  secondPartyRole?: string;
  secondPartyOrg?: string;
  secondPartyAddress?: string;
  city?: string;
  signatureDate?: string;
}

export interface PartnershipPdfParams {
  contract: MouContract;
  logoBase64?: string | null;
  profile?: StpInstitutionProfile | null;
  signers?: PartnershipSigners | null;
  customScope?: string;
  customNotes?: string;
}

const SCOPE_LABELS: Record<string, string> = {
  VENUE_EVENT: 'Sewa Kawasan, Auditorium & Penyelenggaraan MICE Event',
  LAB_MANUFACTURING: 'Riset Terapan, Co-Innovation Lab & Manufaktur Presisi CNC',
  TALENT_RECRUITMENT: 'Penyaluran Tenaga Kerja Industri & Rekrutmen Talenta IT/Vokasi',
  STARTUP_INCUBATION: 'Inkubasi Bisnis, Program Bapak Asuh UMKM & Program CSR Berdampak',
};

// ---------------------------------------------------------------------------
// 1. DRAF NOTA KESEPAHAMAN (MoU / PKS) STANDAR KERJASAMA BLUD
// ---------------------------------------------------------------------------
export function buildPartnershipMouPdf({
  contract,
  logoBase64,
  profile,
  signers,
  customScope,
  customNotes,
}: PartnershipPdfParams): jsPDF {
  const docNumber = contract.contractNumber || `MOU/STP/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
  const ctx = createStpDocument({
    title: 'NOTA KESEPAHAMAN BERSAMA (MoU)',
    subtitle: 'Kerjasama Strategis Penyelenggaraan Ekosistem Sains & Teknologi',
    docNumber: docNumber,
    profile,
    logoBase64,
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const W = STP_CONTENT_WIDTH;

  // 1. Kop Surat & Badge Jenis Kerjasama
  let y = drawLetterhead(ctx, {
    label: contract.agencyType || contract.contractType || 'MITRA INDUSTRI',
    tone: 'indigo',
  });

  // 2. Banner Judul Kerjasama
  const scopeDesc = customScope || SCOPE_LABELS[contract.scope] || contract.scope || 'Kolaborasi Ekosistem Inovasi';
  y = drawHighlightBand(
    ctx,
    y,
    'KESEPAKATAN KERJASAMA STRATEGIS PENTAHELIX',
    `Sinergi: ${contract.partnerName}`,
    [
      { label: `Fokus: ${truncate(doc, scopeDesc, 40)}`, tone: 'indigo' },
    ]
  );

  // 3. Kalimat Pembuka Para Pihak
  y = ensureSpace(ctx, y, 20);
  setFont(doc, 7.5, 'normal', STP_COLORS.body);
  const city = signers?.city || 'Surakarta';
  const sigDate = signers?.signatureDate || contract.startDate || new Date().toISOString().slice(0, 10);
  const introText = `Pada hari ini, tanggal ${formatTanggal(sigDate)}, bertempat di Kota ${city}, para pihak yang bertanda tangan di bawah ini bersepakat untuk mengikatkan diri dalam Nota Kesepahaman Bersama (Memorandum of Understanding):`;
  const introLines = doc.splitTextToSize(introText, W);
  doc.text(introLines, M, y);
  y += introLines.length * 3.8 + 4;

  // 4. Identitas PIHAK PERTAMA & PIHAK KEDUA
  const leftX = M;
  const colW = (W - 8) / 2;
  const rightX = M + colW + 8;

  const firstPartyName = signers?.firstPartyName || 'Kepala UPTD Kawasan Sains & Teknologi Solo Technopark';
  const firstPartyRole = signers?.firstPartyRole || 'Pejabat Penandatangan Kerjasama BLUD';
  const secondPartyName = signers?.secondPartyName || contract.picPartnerName || 'Direktur Utama / Pimpinan Mitra';
  const secondPartyOrg = signers?.secondPartyOrg || contract.partnerName;
  const secondPartyRole = signers?.secondPartyRole || 'Pimpinan Berwenang';

  const partyTopY = y;
  const hLeft = drawPartyBlock(doc, leftX, partyTopY, colW, {
    label: 'PIHAK PERTAMA (STP)',
    name: firstPartyName,
    subtitle: firstPartyRole,
    lines: [
      'UPTD KST Solo Technopark (Pemkot Surakarta)',
      'Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta',
      signers?.firstPartyNip ? `NIP: ${signers.firstPartyNip}` : 'Instansi Pemerintah BLUD',
    ],
  });

  const hRight = drawPartyBlock(doc, rightX, partyTopY, colW, {
    label: 'PIHAK KEDUA (MITRA)',
    name: secondPartyName,
    subtitle: secondPartyRole,
    lines: [
      secondPartyOrg,
      signers?.secondPartyAddress || 'Alamat Kantor Pusat / Perwakilan Mitra',
      contract.picPartnerContact ? `Kontak PIC: ${contract.picPartnerContact}` : 'Perwakilan Resmi Mitra',
    ],
  });

  y = Math.max(hLeft, hRight) + 6;

  // 5. Pasal-Pasal Standar
  y = ensureSpace(ctx, y, 40);
  drawSectionLabel(doc, 'PASAL 1: MAKSUD DAN TUJUAN', M, y);
  y += 4;
  const pasal1 = [
    'Maksud dari Nota Kesepahaman ini adalah sebagai landasan formal dan operasional bagi PARA PIHAK dalam menyinergikan potensi, sumber daya, dan sarana teknologi yang dimiliki masing-masing pihak.',
    'Tujuan kerjasama ini adalah untuk mewujudkan hilirisasi riset inovasi, pemanfaatan fasilitas modern bersama, peningkatan kualitas SDM vokasi, dan akselerasi pertumbuhan industri nasional.',
  ];
  y = drawNumberedList(doc, M, y, W, pasal1) + 6;

  y = ensureSpace(ctx, y, 40);
  drawSectionLabel(doc, 'PASAL 2: RUANG LINGKUP KERJASAMA', M, y);
  y += 4;
  const pasal2 = [
    `Pelaksanaan program bersama pada bidang: ${scopeDesc}.`,
    'Pemanfaatan bersama fasilitas laboratorium terapan, venue MICE, permesinan presisi, dan ekosistem startup binaan Solo Technopark.',
    'Pertukaran keahlian praktisi, penyusunan silabus vokasi industri, serta penyaluran talenta bersertifikasi kompetensi.',
    'Penyusunan Perjanjian Kerja Sama (PKS) teknis terpisah untuk setiap turunan program yang memiliki implikasi hukum dan pembiayaan.',
  ];
  y = drawNumberedList(doc, M, y, W, pasal2) + 6;

  y = ensureSpace(ctx, y, 40);
  drawSectionLabel(doc, 'PASAL 3: JANGKA WAKTU & KETENTUAN HUKUM', M, y);
  y += 4;
  const pasal3 = [
    `Nota Kesepahaman ini berlaku efektif sejak tanggal ${formatTanggal(contract.startDate)} sampai dengan tanggal ${formatTanggal(contract.endDate)}, dan dapat diperpanjang atas kesepakatan tertulis PARA PIHAK.`,
    'PARA PIHAK berkomitmen menjunjung tinggi prinsip tata kelola yang baik (Good Governance), transparansi keterbukaan informasi, dan kepatuhan terhadap regulasi PPK-BLUD.',
    'Segala bentuk kerahasiaan dokumen teknis, hak cipta intelektual, dan data finansial dilindungi oleh klausul Non-Disclosure Agreement (NDA).',
  ];
  y = drawNumberedList(doc, M, y, W, pasal3) + 6;

  if (customNotes || contract.notes) {
    y = ensureSpace(ctx, y, 20);
    y = drawNote(doc, M, y, W, `Ketentuan Khusus: ${customNotes || contract.notes}`) + 6;
  }

  // 6. Kolom Tanda Tangan Para Pihak (Dengan Materai Standar)
  const placeDate = `${city}, ${formatTanggal(sigDate)}`;

  drawSignatureBlock(ctx, y, placeDate, [
    {
      caption: 'PIHAK PERTAMA,',
      name: firstPartyName,
      role: firstPartyRole,
      sub: signers?.firstPartyNip ? `NIP. ${signers.firstPartyNip}` : undefined,
      stampCaption: 'UPTD SOLO TECHNOPARK',
    },
    {
      caption: 'PIHAK KEDUA,',
      name: secondPartyName,
      role: secondPartyRole,
      stampCaption: secondPartyOrg,
    },
  ]);

  finalizeStpDocument(ctx);
  return doc;
}

// ---------------------------------------------------------------------------
// 2. LEMBAR DISPOSISI & TELAAH KELAYAKAN KERJASAMA (EXECUTIVE MEMO)
// ---------------------------------------------------------------------------
export function buildPartnershipDispositionPdf({
  contract,
  logoBase64,
  profile,
  signers,
  customNotes,
}: PartnershipPdfParams): jsPDF {
  const memoNumber = `MEMO/B2B/${Date.now().toString().slice(-6)}`;
  const ctx = createStpDocument({
    title: 'LEMBAR DISPOSISI & TELAAH KERJASAMA',
    subtitle: 'Telaah Usulan Kemitraan Strategis & B2B Hub Solo Technopark',
    docNumber: memoNumber,
    profile,
    logoBase64,
  });

  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const W = STP_CONTENT_WIDTH;

  // 1. Kop Surat & Status
  let y = drawLetterhead(ctx, {
    label: 'TELAAH KELAYAKAN RESMI',
    tone: 'info',
  });

  // 2. Banner Mitra
  y = drawHighlightBand(
    ctx,
    y,
    'TELAAH USULAN CALON MITRA STRATEGIS',
    contract.partnerName,
    [
      { label: contract.agencyType || contract.contractType, tone: 'neutral' },
      { label: truncate(doc, SCOPE_LABELS[contract.scope] || contract.scope, 35), tone: 'indigo' },
    ]
  );

  // 3. Matriks Parameter Kemitraan
  const rows = [
    { label: 'Nama Lembaga / Mitra', value: contract.partnerName },
    { label: 'Bentuk Badan Hukum', value: contract.agencyType || 'BUMN / Swasta Nasional' },
    { label: 'Penanggung Jawab Mitra (PIC)', value: `${contract.picPartnerName || '-'} (${contract.picPartnerContact || '-'})` },
    { label: 'PIC Pendamping STP', value: contract.picStpName || '-' },
    { label: 'Rencana Masa Kerjasama', value: `${formatTanggal(contract.startDate)} s.d. ${formatTanggal(contract.endDate)}` },
    { label: 'Status Saat Ini', value: contract.status || 'DRAFT' },
  ];

  y = drawKeyValueRows(doc, M, y, W, rows) + 6;

  // 4. Rekomendasi Tim Kemitraan
  y = ensureSpace(ctx, y, 35);
  drawSectionLabel(doc, 'HASIL TELAAH TEKNIS & REKOMENDASI KELAYAKAN', M, y);
  y += 4;

  const rekomendasi = [
    'Profil calon mitra telah terverifikasi sah memiliki legalitas usaha dan rekam jejak industri yang selaras dengan klaster teknologi Solo Technopark.',
    'Peluang pemanfaatan fasilitas dan pendapatan BLUD dinilai potensial serta memperkuat jejaring ekosistem riset terapan di Surakarta.',
    'Rekomendasi Tim Partnership Desk: DAPAT DILANJUTKAN KE PENANDATANGANAN NOTA KESEPAHAMAN (MoU) RESMI.',
  ];

  y = drawNumberedList(doc, M, y, W, rekomendasi) + 6;

  if (customNotes || contract.notes) {
    y = ensureSpace(ctx, y, 18);
    y = drawNote(doc, M, y, W, `Catatan Khusus Verifikator: ${customNotes || contract.notes}`) + 6;
  }

  // 5. Lembar Disposisi Arahan Pimpinan
  y = ensureSpace(ctx, y, 45);
  drawSectionLabel(doc, 'KOLOM ARAHAN & DISPOSISI PIMPINAN (DIREKTUR / KEPALA UPTD)', M, y);
  y += 3;

  doc.setDrawColor(...STP_COLORS.line);
  doc.setLineWidth(0.3);
  doc.rect(M, y, W, 22, 'S');

  setFont(doc, 7, 'normal', STP_COLORS.faint);
  doc.text('[ ] Disetujui untuk ditandatangani MoU resminya', M + 4, y + 6);
  doc.text('[ ] Dijadwalkan audiensi tatap muka / pemaparan proposal B2B', M + 4, y + 11);
  doc.text('[ ] Perlu revisi klausul pasal sebelum proses penandatanganan', M + 4, y + 16);

  y += 26;

  // 6. Tanda Tangan Tim Telaah & Disposisi
  const city = signers?.city || 'Surakarta';
  const placeDate = `${city}, ${formatTanggal(new Date().toISOString().slice(0, 10))}`;

  drawSignatureBlock(ctx, y, placeDate, [
    {
      caption: 'Diteliti Oleh:',
      name: signers?.secondPartyName || 'Tim Kemitraan Industri',
      role: 'Analis Kerjasama B2B',
    },
    {
      caption: 'Disetujui Oleh:',
      name: signers?.firstPartyName || 'Kepala UPTD KST Solo Technopark',
      role: 'Kuasa Pengguna Anggaran / BLUD',
      sub: signers?.firstPartyNip ? `NIP. ${signers.firstPartyNip}` : undefined,
      stampCaption: 'UPTD SOLO TECHNOPARK',
    },
  ]);

  finalizeStpDocument(ctx);
  return doc;
}

