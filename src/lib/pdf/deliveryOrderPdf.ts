// src/lib/pdf/deliveryOrderPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionOrder } from '@/types/production.types';

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
function renderDeliveryStpStamp(doc: jsPDF, cx: number, cy: number, nomorDoc: string) {
  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.65);
  doc.circle(cx, cy, 13.5, 'S');

  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 12.6, 'S');

  // Teks Lengkung / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(37, 99, 235);
  doc.text('UPTD KST SOLO TECHNOPARK', cx, cy - 9, { align: 'center' });
  doc.text('DIVISI JASA PRODUKSI & QC', cx, cy + 10.5, { align: 'center' });

  // Garis Pembatas
  doc.setLineWidth(0.25);
  doc.line(cx - 10, cy - 5, cx + 10, cy - 5);
  doc.line(cx - 10, cy + 5, cx + 10, cy + 5);

  // Pusat Stempel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED & DISPATCHED', cx, cy - 1.5, { align: 'center' });

  doc.setFontSize(5);
  doc.setTextColor(37, 99, 235);
  doc.text('GOODS INSPECTED', cx, cy + 1.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text(nomorDoc, cx, cy + 3.8, { align: 'center' });
}

export interface DeliveryOrderPdfParams {
  order: ProductionOrder;
  logoBase64?: string | null;
}

/**
 * Membangun Dokumen Vektor PDF Murni untuk Surat Jalan Resmi (Delivery Order)
 */
export function buildDeliveryOrderPdf({ order, logoBase64 }: DeliveryOrderPdfParams): jsPDF {
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

  // Teks Kop
  const headerTextX = marginLeft + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PEMERINTAH KOTA SURAKARTA', headerTextX, currentY + 1);

  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235); // Blue STP
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

  // 2. JUDUL DOKUMEN & NOMOR RESMI
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT JALAN PENGIRIMAN BARANG', pageWidth / 2, currentY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(DELIVERY ORDER / DISPATCH NOTE)', pageWidth / 2, currentY + 4.5, { align: 'center' });

  const doNumber = order.deliveryOrder?.deliveryOrderNumber || `SJ/PROD/${new Date().toISOString().split('T')[0].replace(/-/g, '')}/XXXX`;
  currentY += 10;
  
  // Badge Nomor Surat Jalan
  const badgeWidth = 90;
  const badgeX = (pageWidth - badgeWidth) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(badgeX, currentY - 4, badgeWidth, 7, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(`Nomor: ${doNumber}`, pageWidth / 2, currentY + 0.8, { align: 'center' });

  // 3. DUA KARTU INFORMASI (PENERIMA & DATA PENGIRIMAN)
  currentY += 9;
  const colWidth = (contentWidth - 6) / 2;
  const cardHeight = 36;

  // Kartu Kiri: Kepada Yth / Klien
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, currentY, colWidth, cardHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TUJUAN PENGIRIMAN (PENERIMA):', marginLeft + 4, currentY + 6);

  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(order.clientName || 'Mitra Industri / Klien', marginLeft + 4, currentY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Tipe: ${order.clientType || 'Komersial'} | UP: ${order.clientPic || order.clientName}`, marginLeft + 4, currentY + 16.5);
  
  // Alamat dipotong / wrap
  const addressLines = doc.splitTextToSize(order.clientAddress || 'Alamat serah terima sesuai kesepakatan SPK.', colWidth - 8);
  doc.text(addressLines.slice(0, 2), marginLeft + 4, currentY + 21.5);
  
  doc.setTextColor(100, 116, 139);
  doc.text(`Telp/WA: ${order.clientPhone || '-'}`, marginLeft + 4, currentY + 31);

  // Kartu Kanan: Detail Pengiriman
  const rightColX = marginLeft + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, currentY, colWidth, cardHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMASI PENGIRIMAN & SPK:', rightColX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('No. SPK / Proyek', rightColX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.orderNumber}`, rightColX + 35, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal Kirim', rightColX + 4, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.deliveryOrder?.deliveryDate || new Date().toISOString().split('T')[0]}`, rightColX + 35, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas / Ekspedisi', rightColX + 4, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.deliveryOrder?.driverOrExpedition || 'Kurir Internal STP'}`, rightColX + 35, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('No. Kendaraan', rightColX + 4, currentY + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.deliveryOrder?.vehicleNumber || '-'}`, rightColX + 35, currentY + 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Lokasi Workshop', rightColX + 4, currentY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${order.workshopLocation || 'Workshop Manufaktur STP'}`, rightColX + 35, currentY + 32);

  // 4. TABEL RINCIAN BARANG HASIL PRODUKSI (jspdf-autotable)
  currentY += cardHeight + 6;

  const tableRows = (order.items || []).map((item, idx) => [
    idx + 1,
    item.partName,
    `${item.material || '-'}\nDimensi: ${item.dimensions || '-'}`,
    item.quantity,
    item.unit || 'Pcs',
    item.notes || 'Lolos Uji Toleransi & Inspeksi Mutu QC'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Part / Komponen', 'Spesifikasi & Material', 'Qty', 'Satuan', 'Keterangan Mutu / QC']],
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
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 50 },
      2: { cellWidth: 55 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 18 },
      5: { cellWidth: 32, fontSize: 7.5 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: marginLeft, right: marginRight }
  });

  // Ambil posisi Y setelah tabel
  const lastTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  currentY = lastTableY + 4;

  // 5. KOTAK CATATAN KHUSUS & KETENTUAN PENGIRIMAN
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(marginLeft, currentY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('CATATAN KHUSUS & PERHATIAN SERAH TERIMA BARANG:', marginLeft + 3.5, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 53, 15);
  const deliveryNotes = order.deliveryOrder?.deliveryNotes 
    ? order.deliveryOrder.deliveryNotes 
    : '1. Barang yang tercantum di atas telah melalui proses Quality Control (QC) Laboratorium Manufaktur Solo Technopark.\n2. Mohon periksa kembali kondisi fisik dan kuantitas barang saat serah terima sebelum menandatangani lembar Surat Jalan ini.';
  
  const notesLines = doc.splitTextToSize(deliveryNotes, contentWidth - 7);
  doc.text(notesLines, marginLeft + 3.5, currentY + 8);

  // 6. LEMBAR TANDA TANGAN 3 PIHAK RESMI (3 COLUMNS)
  currentY += 20;
  const sigColWidth = contentWidth / 3;

  // Kolom 1: Yang Menyerahkan (Gudang & QC STP)
  const col1X = marginLeft;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Yang Menyerahkan,', col1X + sigColWidth / 2, currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Gudang & QC Produksi STP', col1X + sigColWidth / 2, currentY + 4.5, { align: 'center' });

  // Stempel resmi di tengah kolom 1
  renderDeliveryStpStamp(doc, col1X + sigColWidth / 2, currentY + 19, doNumber);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${order.assignedTechnician || 'Tim Manufaktur STP'} )`, col1X + sigColWidth / 2, currentY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: ' + (order.deliveryOrder?.deliveryDate || '-'), col1X + sigColWidth / 2, currentY + 38, { align: 'center' });

  // Kolom 2: Petugas Ekspedisi / Supir
  const col2X = marginLeft + sigColWidth;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas Pengantar,', col2X + sigColWidth / 2, currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Pengemudi / Ekspedisi', col2X + sigColWidth / 2, currentY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${order.deliveryOrder?.driverOrExpedition || '...........................................'} )`, col2X + sigColWidth / 2, currentY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: ' + (order.deliveryOrder?.deliveryDate || '-'), col2X + sigColWidth / 2, currentY + 38, { align: 'center' });

  // Kolom 3: Penerima Barang
  const col3X = marginLeft + sigColWidth * 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Diterima dengan Baik Oleh,', col3X + sigColWidth / 2, currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Tanda Tangan & Cap Pemesan', col3X + sigColWidth / 2, currentY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${order.deliveryOrder?.recipientName || order.clientPic || '...........................................'} )`, col3X + sigColWidth / 2, currentY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: .......................................', col3X + sigColWidth / 2, currentY + 38, { align: 'center' });

  // 7. FOOTER RESMI DOKUMEN SISTEM
  const footerY = 286;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, footerY, pageWidth - marginRight, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen Sah Terverifikasi Sistem Informasi Layanan Teknopark (SINTESA) - UPTD KST Solo Technopark`, marginLeft, footerY + 3.5);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman 1 dari 1`, pageWidth - marginRight, footerY + 3.5, { align: 'right' });

  return doc;
}
