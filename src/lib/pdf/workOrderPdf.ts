// src/lib/pdf/workOrderPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionOrder, PRODUCTION_CATEGORY_LABELS } from '@/types/production.types';
import { formatRupiah } from '@/utils/format';

/**
 * Menggambar Lambang Vektor Resmi Solo Technopark jika gambar tidak termuat
 */
function renderStpVectorEmblem(doc: jsPDF, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  // Lingkaran Luar (Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.circle(cx, cy, r, 'F');

  // Lingkaran Aksen Tengah (Indigo/Blue)
  doc.setFillColor(37, 99, 235); // blue-600
  doc.circle(cx, cy, r * 0.82, 'F');

  // Lingkaran Inti (Putih)
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r * 0.62, 'F');

  // Teks Logo S
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 1.05);
  doc.setTextColor(15, 23, 42);
  doc.text('S', cx, cy + size * 0.22, { align: 'center' });

  // Titik Orbit Sains
  doc.setFillColor(37, 99, 235);
  doc.circle(cx + r * 0.45, cy - r * 0.45, 1.2, 'F');
  doc.circle(cx - r * 0.45, cy + r * 0.45, 1.2, 'F');
}

/**
 * Menggambar Stempel Resmi Techno Sign BLUD UPT Solo Technopark
 */
function renderSpkStpStamp(doc: jsPDF, cx: number, cy: number, nomorDoc: string) {
  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.65);
  doc.circle(cx, cy, 13.5, 'S');

  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 12.6, 'S');

  // Teks Lengkung
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(37, 99, 235);
  doc.text('UPTD KST SOLO TECHNOPARK', cx, cy - 9, { align: 'center' });
  doc.text('PPK-BLUD KOTA SURAKARTA', cx, cy + 10.5, { align: 'center' });

  // Garis Pembatas
  doc.setLineWidth(0.25);
  doc.line(cx - 10, cy - 5, cx + 10, cy - 5);
  doc.line(cx - 10, cy + 5, cx + 10, cy + 5);

  // Pusat Stempel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT PERINTAH KERJA', cx, cy - 1.5, { align: 'center' });

  doc.setFontSize(5);
  doc.setTextColor(37, 99, 235);
  doc.text('PRODUCTION APPROVED', cx, cy + 1.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text(nomorDoc, cx, cy + 3.8, { align: 'center' });
}

export interface WorkOrderPdfParams {
  order: ProductionOrder;
  logoBase64?: string | null;
}

/**
 * Membangun Dokumen Vektor PDF Murni untuk Surat Perintah Kerja (SPK) & Estimasi Biaya Produksi
 */
export function buildWorkOrderPdf({ order, logoBase64 }: WorkOrderPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // 1. KOP SURAT RESMI
  let currentY = 14;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginLeft, currentY - 2, 22, 22);
    } catch {
      renderStpVectorEmblem(doc, marginLeft, currentY - 2, 20);
    }
  } else {
    renderStpVectorEmblem(doc, marginLeft, currentY - 2, 20);
  }

  const headerTextX = marginLeft + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PEMERINTAH KOTA SURAKARTA', headerTextX, currentY + 1);

  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text('UPTD KST SOLO TECHNOPARK (PPK-BLUD)', headerTextX, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DIVISI LAYANAN MANUFAKTUR, FABRIKASI & JASA PRODUKSI', headerTextX, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta 57126 | Telp: (0271) 666628 | Email: info@solotechnopark.id', headerTextX, currentY + 15);

  // Garis Ganda Pembatas Kop
  currentY += 19;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

  doc.setLineWidth(0.2);
  doc.line(marginLeft, currentY + 1, pageWidth - marginRight, currentY + 1);

  // 2. JUDUL DOKUMEN & NOMOR SPK
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT PERINTAH KERJA & ESTIMASI PRODUKSI', pageWidth / 2, currentY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(WORK ORDER / MANUFACTURING ORDER SHEET)', pageWidth / 2, currentY + 4.5, { align: 'center' });

  currentY += 10;
  const badgeWidth = 90;
  const badgeX = (pageWidth - badgeWidth) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(badgeX, currentY - 4, badgeWidth, 7, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(`No. SPK: ${order.orderNumber}`, pageWidth / 2, currentY + 0.8, { align: 'center' });

  // 3. DUA KARTU INFORMASI (DATA KLIEN & PARAMETER TEKNIS)
  currentY += 9;
  const colWidth = (contentWidth - 6) / 2;
  const cardHeight = 38;

  // Kartu Kiri: Pemesan
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, currentY, colWidth, cardHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATA PEMESAN / KLIEN:', marginLeft + 4, currentY + 6);

  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(order.clientName || 'Mitra Industri / Klien', marginLeft + 4, currentY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Kategori Klien : ${order.clientType || 'Komersial'}`, marginLeft + 4, currentY + 16.5);
  doc.text(`PIC Lapangan : ${order.clientPic || order.clientName}`, marginLeft + 4, currentY + 21.5);
  doc.text(`Kontak / WA  : ${order.clientPhone || '-'}`, marginLeft + 4, currentY + 26.5);
  doc.text(`Email Resmi  : ${order.clientEmail || '-'}`, marginLeft + 4, currentY + 31.5);

  // Kartu Kanan: Parameter Proyek
  const rightColX = marginLeft + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, currentY, colWidth, cardHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETAIL PEKERJAAN BENGKEL:', rightColX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Judul Proyek', rightColX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(`: ${order.projectTitle}`, colWidth - 36);
  doc.text(titleLines.slice(0, 1), rightColX + 32, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kategori Mesin', rightColX + 4, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`: ${PRODUCTION_CATEGORY_LABELS[order.category] || order.category}`, rightColX + 32, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Lokasi Workshop', rightColX + 4, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.workshopLocation || 'Workshop Manufaktur STP'}`, rightColX + 32, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Selesai', rightColX + 4, currentY + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.targetDeliveryDate || '-'} (${order.estimatedDurationDays || 7} Hari Kerja)`, rightColX + 32, currentY + 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Teknisi PIC', rightColX + 4, currentY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.assignedTechnician || 'Tim Manufaktur STP'}`, rightColX + 32, currentY + 32);

  // 4. TABEL RINCIAN ITEM & BIAYA PRODUKSI (jspdf-autotable)
  currentY += cardHeight + 6;

  const tableRows = (order.items || []).map((item, idx) => [
    idx + 1,
    item.partName,
    `${item.material || '-'}\nDimensi: ${item.dimensions || '-'}`,
    item.quantity,
    item.unit || 'Pcs',
    formatRupiah(item.unitPrice || 0),
    formatRupiah(item.totalPrice || item.quantity * item.unitPrice || 0)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Part / Komponen', 'Spesifikasi & Material', 'Qty', 'Satuan', 'Tarif Satuan', 'Subtotal Biaya']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 42 },
      2: { cellWidth: 48 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: marginLeft, right: marginRight }
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || currentY + 45;
  currentY = lastTableY + 4;

  // 5. KALKULASI FINANSIAL & TERMIN DP (2 KOLOM)
  const finWidth = 85;
  const finX = pageWidth - marginRight - finWidth;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(finX, currentY, finWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Biaya Produksi', finX + 4, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(order.totalCost || 0), finX + finWidth - 4, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Uang Muka / DP (${order.dpPercentage || 30}%)`, finX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(formatRupiah(order.dpAmount || 0), finX + finWidth - 4, currentY + 12, { align: 'right' });

  const sisaPelunasan = Math.max(0, (order.totalCost || 0) - (order.dpAmount || 0));
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sisa Pelunasan (Sebelum Kirim)', finX + 4, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(sisaPelunasan), finX + finWidth - 4, currentY + 18, { align: 'right' });

  // Kotak Instruksi Kerja di sebelah kiri
  const noteWidth = contentWidth - finWidth - 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, currentY, noteWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KETENTUAN PRODUKSI & GAMBAR KERJA:', marginLeft + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const workNotesText = order.notes 
    ? order.notes 
    : '1. Pengerjaan mengacu ketat pada toleransi gambar teknik/CAD terlampir.\n2. Pekerjaan fisik dimulai setelah pembayaran DP diverifikasi Bagian Keuangan BLUD.\n3. Perubahan spesifikasi di tengah pengerjaan dapat mempengaruhi estimasi biaya & jadwal.';
  const splittedNotes = doc.splitTextToSize(workNotesText, noteWidth - 7);
  doc.text(splittedNotes.slice(0, 4), marginLeft + 3.5, currentY + 9);

  // 6. LEMBAR TANDA TANGAN (2 PIHAK)
  currentY += 28;
  const sigColWidth = contentWidth / 2;

  // Kolom Kiri: Pemesan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Disetujui oleh Pemesan / Klien,', marginLeft + sigColWidth / 2, currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(order.clientName || 'Mitra Industri', marginLeft + sigColWidth / 2, currentY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${order.clientPic || '...........................................'} )`, marginLeft + sigColWidth / 2, currentY + 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: .......................................', marginLeft + sigColWidth / 2, currentY + 34, { align: 'center' });

  // Kolom Kanan: UPTD KST Solo Technopark (Dilengkapi Stempel)
  const colRightX = marginLeft + sigColWidth;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('UPTD KST Solo Technopark,', colRightX + sigColWidth / 2, currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Divisi Layanan Manufaktur & Jasa Produksi', colRightX + sigColWidth / 2, currentY + 4.5, { align: 'center' });

  renderSpkStpStamp(doc, colRightX + sigColWidth / 2, currentY + 16, order.orderNumber);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${order.assignedTechnician || 'Tim Manufaktur STP'} )`, colRightX + sigColWidth / 2, currentY + 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: ' + (order.targetDeliveryDate || new Date().toISOString().split('T')[0]), colRightX + sigColWidth / 2, currentY + 34, { align: 'center' });

  // 7. FOOTER RESMI
  const footerY = 286;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, footerY, pageWidth - marginRight, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen Sah SPK Resmi UPTD Kawasan Sains dan Teknologi Solo Technopark (SINTESA)`, marginLeft, footerY + 3.5);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman 1 dari 1`, pageWidth - marginRight, footerY + 3.5, { align: 'right' });

  return doc;
}
