// src/lib/pdf/deliveryOrderPdf.ts
// ============================================================================
// SURAT JALAN (DELIVERY ORDER) JASA PRODUKSI — PDF VEKTOR MURNI
// Mengadopsi bahasa visual Invoice resmi melalui stpDocumentKit.
// ============================================================================
import jsPDF from 'jspdf';
import { ProductionOrder, PRODUCTION_CATEGORY_LABELS } from '@/types/production.types';
import {
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
  drawSectionLabel,
  drawSignatureBlock,
  ensureSpace,
  finalizeStpDocument,
  formatTanggal,
  measureNote,
  measureNumberedList,
  setFont,
  truncate
} from './stpDocumentKit';

export interface DeliveryOrderSigners {
  handoverSigner?: { name?: string; role?: string; sub?: string };
  driverSigner?: { name?: string; role?: string; sub?: string };
  recipientSigner?: { name?: string; role?: string; sub?: string };
  city?: string;
  signatureDate?: string;
}

export interface DeliveryOrderPdfParams {
  order: ProductionOrder;
  /** DataURL logo resmi (gunakan loadStpLogo() di browser). */
  logoBase64?: string | null;
  /** Profil instansi dari Pengaturan Sistem (opsional). */
  profile?: StpInstitutionProfile | null;
  /** Kustomisasi lengkap penandatangan 3 pihak Surat Jalan (opsional). */
  signers?: DeliveryOrderSigners | null;
}

const CLIENT_TYPE_LABEL: Record<string, string> = {
  Instansi: 'Instansi Pemerintah',
  Industri: 'Industri / Korporasi',
  UMKM: 'UMKM',
  Perorangan: 'Perorangan',
  Internal_STP: 'Internal Solo Technopark'
};

const HANDOVER_TERMS = [
  'Barang telah melalui pemeriksaan mutu (QC) Workshop Jasa Produksi Solo Technopark sebelum dikirim.',
  'Penerima wajib memeriksa jumlah dan kondisi fisik barang sebelum menandatangani Surat Jalan ini.',
  'Keberatan atas kondisi barang disampaikan paling lambat 2 x 24 jam sejak barang diterima.'
];

const CONDITION_CHECKS = ['Baik dan lengkap sesuai daftar', 'Terdapat kerusakan / cacat fisik', 'Jumlah tidak sesuai daftar'];

/**
 * Membangun Dokumen Vektor PDF Murni untuk Surat Jalan Resmi (Delivery Order)
 */
export function buildDeliveryOrderPdf({ order, logoBase64, profile, signers }: DeliveryOrderPdfParams): jsPDF {
  const delivery = order.deliveryOrder;
  const doNumber =
    delivery?.deliveryOrderNumber || `SJ/PROD/${new Date().toISOString().split('T')[0].replace(/-/g, '')}/XXXX`;
  const deliveryDate = delivery?.deliveryDate || new Date().toISOString().split('T')[0];
  const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';

  const ctx = createStpDocument({
    title: 'SURAT JALAN',
    subtitle: 'Delivery Order - Jasa Produksi & Manufaktur',
    docNumber: doNumber,
    logoBase64,
    profile
  });
  const { doc } = ctx;
  const M = STP_PAGE.margin;
  const R = STP_PAGE.width - STP_PAGE.margin;
  const colGap = 10;
  const colWidth = (STP_CONTENT_WIDTH - colGap) / 2;

  let y = drawLetterhead(ctx, isDelivered ? { label: 'Terkirim', tone: 'success' } : { label: 'Siap Kirim', tone: 'info' });

  // 1. TUJUAN PENGIRIMAN & INFORMASI PENGIRIMAN -----------------------------
  const leftBottom = drawPartyBlock(doc, M, y, colWidth, {
    label: 'Dikirim Kepada',
    name: order.clientName || 'Mitra Industri / Klien',
    subtitle: `Klien ${CLIENT_TYPE_LABEL[order.clientType] || order.clientType || 'Komersial'}`,
    lines: [
      order.clientAddress || 'Alamat serah terima sesuai kesepakatan SPK.',
      `UP. ${delivery?.recipientName || order.clientPic || order.clientName}`,
      delivery?.recipientPhone || order.clientPhone ? `Telp./WA ${delivery?.recipientPhone || order.clientPhone}` : ''
    ]
  });

  const rightBottom = drawKeyValueRows(
    doc,
    M + colWidth + colGap,
    y,
    colWidth,
    [
      { label: 'Tanggal Kirim', value: formatTanggal(deliveryDate), emphasis: true },
      { label: 'Referensi SPK', value: order.orderNumber || '-' },
      { label: 'Ekspedisi / Pengemudi', value: delivery?.driverOrExpedition || 'Kurir Internal STP' },
      { label: 'No. Kendaraan', value: delivery?.vehicleNumber || '-' },
      { label: 'Asal Pengiriman', value: order.workshopLocation || 'Workshop Manufaktur STP' }
    ],
    'Informasi Pengiriman'
  );
  y = Math.max(leftBottom, rightBottom) + 6;

  // 2. PEKERJAAN TERKAIT ----------------------------------------------------
  y = drawHighlightBand(ctx, y, 'Pekerjaan / Proyek', order.projectTitle || '-', [
    { label: PRODUCTION_CATEGORY_LABELS[order.category] || order.category, tone: 'neutral' }
  ]);

  // 3. DAFTAR BARANG --------------------------------------------------------
  const items = order.items || [];
  y = drawItemsTable(
    ctx,
    y,
    [
      { header: 'No', width: 8, align: 'center' },
      { header: 'Nama Barang / Komponen', width: 84 },
      { header: 'Jumlah', width: 22, align: 'center', bold: true },
      { header: 'Keterangan Mutu (QC)', width: 64 }
    ],
    items.map((item, idx) => [
      String(idx + 1),
      {
        title: item.partName,
        details: [`Material: ${item.material || '-'}   |   Dimensi: ${item.dimensions || '-'}`]
      },
      `${item.quantity} ${item.unit || 'Pcs'}`,
      item.notes || 'Lolos inspeksi mutu (QC)'
    ]),
    'Belum ada daftar barang pada Surat Jalan ini.'
  );

  // Rekapitulasi muatan
  const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  y = ensureSpace(ctx, y + 3, 10);
  doc.setFillColor(...STP_COLORS.panel);
  doc.setDrawColor(...STP_COLORS.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, STP_CONTENT_WIDTH, 8, 1.2, 1.2, 'FD');
  drawSectionLabel(doc, 'Rekapitulasi Muatan', M + 3, y + 5.1);
  setFont(doc, 8, 'bold', STP_COLORS.ink);
  doc.text(`${items.length} jenis barang   |   ${totalQty} satuan total`, R - 3, y + 5.3, { align: 'right' });
  y += 15;

  // 4. CATATAN & KETENTUAN (KIRI) | PEMERIKSAAN PENERIMA (KANAN) ------------
  const rightWidth = 70;
  const rightX = R - rightWidth;
  const leftWidth = STP_CONTENT_WIDTH - rightWidth - 10;
  const notes =
    delivery?.deliveryNotes ||
    'Barang dikemas dengan pelindung yang memadai. Mohon diperiksa bersama pengantar pada saat serah terima.';

  const leftHeight = 4.5 + measureNote(doc, notes, leftWidth) + 8 + measureNumberedList(doc, HANDOVER_TERMS, leftWidth);
  const rightHeight = 6 + CONDITION_CHECKS.length * 5.4 + 10;
  y = ensureSpace(ctx, y, Math.max(leftHeight, rightHeight) + 4);

  drawSectionLabel(doc, 'Catatan Pengiriman', M, y + 2);
  let ly = drawNote(doc, M, y + 6.5, leftWidth, notes);
  drawSectionLabel(doc, 'Ketentuan Serah Terima', M, ly + 4);
  ly = drawNumberedList(doc, M, ly + 8.5, leftWidth, HANDOVER_TERMS);

  // Kotak pemeriksaan kondisi (diisi penerima)
  const boxHeight = rightHeight;
  doc.setFillColor(...STP_COLORS.panel);
  doc.setDrawColor(...STP_COLORS.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, y - 1, rightWidth, boxHeight, 1.5, 1.5, 'FD');
  drawSectionLabel(doc, 'Kondisi Barang (diisi penerima)', rightX + 3.5, y + 3.6);
  let ry = y + 8.5;
  CONDITION_CHECKS.forEach((label) => {
    doc.setDrawColor(...STP_COLORS.muted);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.rect(rightX + 3.5, ry - 2.6, 3, 3, 'FD');
    setFont(doc, 7.2, 'normal', STP_COLORS.body);
    doc.text(truncate(doc, label, rightWidth - 12), rightX + 8.5, ry);
    ry += 5.4;
  });
  setFont(doc, 7.2, 'normal', STP_COLORS.body);
  doc.text('Jumlah koli diterima:', rightX + 3.5, ry + 1.5);
  doc.setDrawColor(...STP_COLORS.faint);
  doc.setLineWidth(0.25);
  doc.line(rightX + 31, ry + 2, rightX + rightWidth - 4, ry + 2);
  ry = y - 1 + boxHeight;

  y = Math.max(ly, ry) + 10;

  // 5. TANDA TANGAN 3 PIHAK -------------------------------------------------
  const signCity = signers?.city || ctx.profile.city || 'Surakarta';
  const signDateStr = signers?.signatureDate || deliveryDate;

  const handoverName = signers?.handoverSigner?.name !== undefined 
    ? signers.handoverSigner.name 
    : (order.assignedTechnician || '');
  const handoverRole = signers?.handoverSigner?.role || 'Gudang & QC Jasa Produksi STP';
  const handoverSub = signers?.handoverSigner?.sub || ctx.profile.name;

  const driverName = signers?.driverSigner?.name !== undefined 
    ? signers.driverSigner.name 
    : (delivery?.driverOrExpedition || '');
  const driverRole = signers?.driverSigner?.role || 'Pengemudi / Ekspedisi';
  const driverSub = signers?.driverSigner?.sub || (delivery?.vehicleNumber ? `No. Kendaraan ${delivery.vehicleNumber}` : '');

  const recipientName = signers?.recipientSigner?.name !== undefined 
    ? signers.recipientSigner.name 
    : (delivery?.recipientName || '');
  const recipientRole = signers?.recipientSigner?.role || 'Penerima Barang (TTD & Cap)';
  const recipientSub = signers?.recipientSigner?.sub || order.clientName;

  drawSignatureBlock(ctx, y, `${signCity}, ${formatTanggal(signDateStr)}`, [
    {
      caption: 'Yang Menyerahkan,',
      role: handoverRole,
      name: handoverName,
      sub: handoverSub,
      stampCaption: 'Jasa Produksi'
    },
    {
      caption: 'Pengantar,',
      role: driverRole,
      name: driverName,
      sub: driverSub
    },
    {
      caption: 'Diterima oleh,',
      role: recipientRole,
      name: recipientName,
      sub: recipientSub
    }
  ]);

  finalizeStpDocument(
    ctx,
    'Surat Jalan diterbitkan melalui SINTESA. Lembar yang ditandatangani penerima menjadi bukti serah terima barang yang sah.'
  );
  return doc;
}
