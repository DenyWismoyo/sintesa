// src/lib/pdf/workOrderPdf.ts
// ============================================================================
// SURAT PERINTAH KERJA (SPK) JASA PRODUKSI — PDF VEKTOR MURNI
// Mengadopsi bahasa visual Invoice resmi melalui stpDocumentKit.
// ============================================================================
import jsPDF from 'jspdf';
import {
  ProductionOrder,
  ProductionStatus,
  PRODUCTION_CATEGORY_LABELS,
  PRODUCTION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS
} from '@/types/production.types';
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
  truncate
} from './stpDocumentKit';

export interface WorkOrderSigners {
  clientSigner?: { name?: string; role?: string; sub?: string };
  technicianSigner?: { name?: string; role?: string; sub?: string };
  issuerSigner?: { name?: string; role?: string; nip?: string; sub?: string };
  city?: string;
  signatureDate?: string;
}

export interface WorkOrderPdfParams {
  order: ProductionOrder;
  /** DataURL logo resmi (gunakan loadStpLogo() di browser). */
  logoBase64?: string | null;
  /** Profil instansi dari Pengaturan Sistem (opsional). */
  profile?: StpInstitutionProfile | null;
  /** Pejabat penerbit SPK (opsional, backward compatible). */
  issuer?: { name?: string; nip?: string; role?: string } | null;
  /** Kustomisasi lengkap penandatangan 3 pihak (opsional). */
  signers?: WorkOrderSigners | null;
}

const STATUS_TONES: Record<ProductionStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ESTIMATION: 'warning',
  VALIDATION: 'info',
  APPROVED_WAITING_DP: 'warning',
  IN_PRODUCTION: 'indigo',
  QUALITY_CONTROL: 'indigo',
  READY_FOR_DELIVERY: 'success',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger'
};

const CLIENT_TYPE_LABEL: Record<string, string> = {
  Instansi: 'Instansi Pemerintah',
  Industri: 'Industri / Korporasi',
  UMKM: 'UMKM',
  Perorangan: 'Perorangan',
  Internal_STP: 'Internal Solo Technopark'
};

function buildTerms(order: ProductionOrder): string[] {
  return [
    'Pekerjaan dilaksanakan sesuai spesifikasi, dimensi, dan toleransi pada gambar kerja/CAD yang telah disetujui pemesan.',
    order.dpRequired
      ? `Produksi dimulai setelah uang muka (DP) ${order.dpPercentage || 0}% diverifikasi oleh Bendahara Penerimaan BLUD.`
      : 'Produksi dimulai setelah SPK ini ditandatangani oleh para pihak.',
    'Perubahan spesifikasi setelah SPK terbit dapat memengaruhi biaya dan jadwal, dan dituangkan dalam addendum tertulis.',
    'Barang diserahkan dengan Surat Jalan resmi setelah lolos uji mutu (QC) dan kewajiban pembayaran diselesaikan.'
  ];
}

/**
 * Membangun Dokumen Vektor PDF Murni untuk Surat Perintah Kerja (SPK) & Estimasi Biaya Produksi
 */
export function buildWorkOrderPdf({ order, logoBase64, profile, issuer, signers }: WorkOrderPdfParams): jsPDF {
  const ctx = createStpDocument({
    title: 'SURAT PERINTAH KERJA',
    subtitle: 'Work Order - Jasa Produksi & Manufaktur',
    docNumber: order.orderNumber || 'SPK/PROD/-',
    logoBase64,
    profile
  });
  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const R = STP_PAGE.width - STP_PAGE.margin;
  const colGap = 10;
  const colWidth = (STP_CONTENT_WIDTH - colGap) / 2;

  const statusLabel = PRODUCTION_STATUS_LABELS[order.status]?.label || order.status;
  let y = drawLetterhead(ctx, { label: statusLabel, tone: STATUS_TONES[order.status] || 'neutral' });

  // 1. PIHAK PEMESAN & INFORMASI SPK ---------------------------------------
  const issueDate = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const leftBottom = drawPartyBlock(doc, M, y, colWidth, {
    label: 'Ditujukan Kepada (Pemesan)',
    name: order.clientName || 'Mitra Industri / Klien',
    subtitle: `Klien ${CLIENT_TYPE_LABEL[order.clientType] || order.clientType || 'Komersial'}`,
    lines: [
      order.clientAddress || '',
      order.clientPic ? `UP. ${order.clientPic}` : '',
      order.clientPhone ? `Telp./WA ${order.clientPhone}` : '',
      order.clientEmail || ''
    ]
  });

  const rightBottom = drawKeyValueRows(
    doc,
    M + colWidth + colGap,
    y,
    colWidth,
    [
      { label: 'Tanggal Terbit', value: formatTanggal(issueDate) },
      { label: 'Kategori Layanan', value: PRODUCTION_CATEGORY_LABELS[order.category] || order.category },
      { label: 'Target Selesai', value: formatTanggal(order.targetDeliveryDate), emphasis: true },
      { label: 'Durasi Pengerjaan', value: `${order.estimatedDurationDays || 7} hari kerja` },
      { label: 'Lokasi Workshop', value: order.workshopLocation || 'Workshop Manufaktur STP' },
      { label: 'Pelaksana Teknis', value: order.assignedTechnician || 'Tim Manufaktur STP' }
    ],
    'Informasi SPK'
  );
  y = Math.max(leftBottom, rightBottom) + 6;

  // 2. JUDUL PEKERJAAN ------------------------------------------------------
  y = drawHighlightBand(ctx, y, 'Judul Pekerjaan', order.projectTitle || '-', [
    { label: `Progres ${order.productionProgress || 0}%`, tone: 'indigo' }
  ]);

  // 3. TABEL RINCIAN PEKERJAAN ---------------------------------------------
  const items = order.items || [];
  y = drawItemsTable(
    ctx,
    y,
    [
      { header: 'No', width: 8, align: 'center' },
      { header: 'Uraian Pekerjaan / Komponen', width: 78 },
      { header: 'Qty', width: 20, align: 'center', bold: true },
      { header: 'Harga Satuan', width: 34, align: 'right' },
      { header: 'Jumlah', width: 38, align: 'right', bold: true }
    ],
    items.map((item, idx) => [
      String(idx + 1),
      {
        title: item.partName,
        details: [`Material: ${item.material || '-'}   |   Dimensi: ${item.dimensions || '-'}`],
        note: item.notes ? `Catatan: ${item.notes}` : undefined
      },
      `${item.quantity} ${item.unit || 'Pcs'}`,
      rupiah(item.unitPrice),
      rupiah(item.totalPrice || item.quantity * item.unitPrice)
    ]),
    'Belum ada rincian komponen pada SPK ini.'
  );
  y += 7;

  // 4. KETENTUAN (KIRI) & RINGKASAN BIAYA (KANAN) ---------------------------
  const rightWidth = 74;
  const rightX = R - rightWidth;
  const leftWidth = STP_CONTENT_WIDTH - rightWidth - 10;

  const terms = buildTerms(order);
  const blueprints = order.blueprintFiles || [];
  const leftHeight =
    4.5 +
    measureNumberedList(doc, terms, leftWidth) +
    (order.notes ? 7 + measureNote(doc, order.notes, leftWidth) : 0) +
    (blueprints.length ? 7 + blueprints.length * 3.2 : 0);

  const itemsSubtotal = items.reduce((sum, it) => sum + (it.totalPrice || it.quantity * it.unitPrice || 0), 0);
  const totalCost = order.totalCost || itemsSubtotal;
  const adjustment = totalCost - itemsSubtotal;
  const rightHeight = 46 + (adjustment !== 0 ? 5.2 : 0);

  y = ensureSpace(ctx, y, Math.max(leftHeight, rightHeight) + 4);

  // Kiri: ketentuan, catatan, lampiran
  drawSectionLabel(doc, 'Ketentuan Pelaksanaan Pekerjaan', M, y + 2);
  let ly = drawNumberedList(doc, M, y + 6.5, leftWidth, terms);
  if (order.notes) {
    drawSectionLabel(doc, 'Catatan Khusus', M, ly + 3);
    ly = drawNote(doc, M, ly + 7.5, leftWidth, order.notes);
  }
  if (blueprints.length) {
    drawSectionLabel(doc, 'Lampiran Gambar Teknik', M, ly + 4);
    ly += 8.2;
    setFont(doc, 6.9, 'normal', STP_COLORS.body);
    blueprints.forEach((file) => {
      doc.text(truncate(doc, `- ${file.name}`, leftWidth), M, ly);
      ly += 3.2;
    });
  }

  // Kanan: ringkasan biaya
  let ry = y + 2;
  drawTotalRow(doc, rightX, ry, rightWidth, 'Subtotal Rincian', rupiah(itemsSubtotal));
  ry += 5.2;
  if (adjustment !== 0) {
    drawTotalRow(doc, rightX, ry, rightWidth, 'Penyesuaian Biaya', `${adjustment < 0 ? '- ' : ''}${rupiah(Math.abs(adjustment))}`);
    ry += 5.2;
  }
  doc.setDrawColor(...STP_COLORS.ink);
  doc.setLineWidth(0.45);
  doc.line(rightX, ry - 2, R, ry - 2);
  ry += 3.6;
  drawTotalRow(doc, rightX, ry, rightWidth, 'Total Biaya Produksi', rupiah(totalCost), {
    bold: true,
    size: 9,
    color: STP_COLORS.ink,
    labelColor: STP_COLORS.ink
  });
  ry += 6;
  drawTotalRow(
    doc,
    rightX,
    ry,
    rightWidth,
    order.dpRequired ? `Uang Muka / DP (${order.dpPercentage || 0}%)` : 'Uang Muka / DP',
    order.dpRequired ? rupiah(order.dpAmount) : 'Tidak diwajibkan'
  );
  ry += 5.2;
  drawTotalRow(
    doc,
    rightX,
    ry,
    rightWidth,
    'Status Pembayaran',
    PAYMENT_STATUS_LABELS[order.paymentStatus]?.label || order.paymentStatus
  );
  ry += 4;

  const paid = order.paymentStatus === 'FULL_PAID' ? totalCost : order.paymentStatus === 'DP_PAID' ? order.dpAmount || 0 : 0;
  const remaining = Math.max(0, totalCost - paid);
  ry =
    remaining <= 0 && totalCost > 0
      ? drawResultBox(doc, rightX, ry, rightWidth, 'Status', 'LUNAS', 'success')
      : drawResultBox(
          doc,
          rightX,
          ry,
          rightWidth,
          order.paymentStatus === 'UNPAID' ? 'Belum Dibayar' : 'Sisa Pelunasan',
          rupiah(remaining),
          'neutral'
        );

  y = Math.max(ly, ry) + 10;

  // 5. TANDA TANGAN PARA PIHAK ----------------------------------------------
  const signCity = signers?.city || ctx.profile.city || 'Surakarta';
  const signDateStr = signers?.signatureDate || issueDate;
  
  const clientName = signers?.clientSigner?.name !== undefined ? signers.clientSigner.name : (order.clientPic || '');
  const clientRole = signers?.clientSigner?.role || 'Pemesan / Klien';
  const clientSub = signers?.clientSigner?.sub || order.clientName;

  const techName = signers?.technicianSigner?.name !== undefined ? signers.technicianSigner.name : (order.assignedTechnician || '');
  const techRole = signers?.technicianSigner?.role || 'Penanggung Jawab Teknis';
  const techSub = signers?.technicianSigner?.sub || 'Workshop Jasa Produksi STP';

  const issuerName = signers?.issuerSigner?.name !== undefined 
    ? signers.issuerSigner.name 
    : (issuer?.name || '');
  const issuerRole = signers?.issuerSigner?.role || issuer?.role || 'Kepala Divisi Layanan Manufaktur & Jasa Produksi';
  const issuerNip = signers?.issuerSigner?.nip || issuer?.nip;
  const issuerSub = issuerNip ? `NIP. ${issuerNip}` : (signers?.issuerSigner?.sub || ctx.profile.name);

  y = drawSignatureBlock(ctx, y, `${signCity}, ${formatTanggal(signDateStr)}`, [
    {
      caption: 'Menyetujui,',
      role: clientRole,
      name: clientName,
      sub: clientSub
    },
    {
      caption: 'Pelaksana,',
      role: techRole,
      name: techName,
      sub: techSub
    },
    {
      caption: 'Diterbitkan oleh,',
      role: issuerRole,
      name: issuerName,
      sub: issuerSub,
      stampCaption: 'Jasa Produksi'
    }
  ]);

  finalizeStpDocument(
    ctx,
    'SPK ini diterbitkan melalui SINTESA dan menjadi dasar resmi pelaksanaan pekerjaan setelah ditandatangani para pihak.'
  );
  return doc;
}
