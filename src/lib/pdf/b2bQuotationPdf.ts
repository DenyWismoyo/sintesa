// src/lib/pdf/b2bQuotationPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from '@/utils/format';

export interface B2BQuotationRoomItem {
  id: string;
  name: string;
  capacity?: number;
  location?: string;
  pricePerDay: number;
}

export interface B2BQuotationAddonItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
}

export interface B2BQuotationPdfParams {
  quotationNumber?: string;
  dateStr?: string;
  agencyName?: string;
  picName?: string;
  picPosition?: string;
  picPhone?: string;
  picEmail?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  estimatedAttendance?: number;
  rooms: B2BQuotationRoomItem[];
  addons: B2BQuotationAddonItem[];
  discountAmount?: number;
  totalBudget: number;
  isSurveyRequested?: boolean;
  preferredSurveyDate?: string;
  logoBase64?: string;
}

/**
 * Helper untuk memuat gambar logo dari URL menjadi base64 DataURL (di browser)
 */
export async function loadLogoAsDataUrl(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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
  doc.setFillColor(79, 70, 229); // indigo-600
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
  doc.setFillColor(79, 70, 229);
  doc.circle(cx + r * 0.45, cy - r * 0.45, 1.2, 'F');
  doc.circle(cx - r * 0.45, cy + r * 0.45, 1.2, 'F');
}

/**
 * Menggambar Stempel Resmi Techno Sign BLUD UPT Solo Technopark
 */
function renderOfficialTechnoSignStamp(
  doc: jsPDF,
  cx: number,
  cy: number,
  nomorDoc: string
) {
  // Lingkaran Ganda (Indigo Dinas BLUD)
  doc.setDrawColor(67, 56, 202); // indigo-700
  doc.setLineWidth(0.65);
  doc.circle(cx, cy, 14, 'S');

  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 13.1, 'S');

  // Teks Lengkung Atas & Bawah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(67, 56, 202);
  doc.text('UPTD KST SOLO TECHNOPARK', cx, cy - 9.5, { align: 'center' });
  doc.text('PPK-BLUD KOTA SURAKARTA', cx, cy + 11, { align: 'center' });

  // Garis Pembatas Segel
  doc.setLineWidth(0.25);
  doc.line(cx - 11, cy - 5.5, cx + 11, cy - 5.5);
  doc.line(cx - 11, cy + 5.5, cx + 11, cy + 5.5);

  // Pusat Stempel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(79, 70, 229);
  doc.text('TECHNO SIGN', cx, cy - 1.8, { align: 'center' });

  doc.setFontSize(5.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL ESTIMATE', cx, cy + 1.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.3);
  doc.setTextColor(100, 116, 139);
  doc.text(nomorDoc, cx, cy + 4.3, { align: 'center' });

  // Titik Aksen Kiri & Kanan
  doc.setFillColor(67, 56, 202);
  doc.circle(cx - 10.5, cy, 0.6, 'F');
  doc.circle(cx + 10.5, cy, 0.6, 'F');
}

/**
 * Membangun dokumen PDF murni (vektor A4) untuk Draf Penawaran Fasilitas B2B
 */
export function buildB2BQuotationPdf(params: B2BQuotationPdfParams): jsPDF {
  const {
    quotationNumber = `STP/B2B-EST/${Date.now().toString().slice(-6)}`,
    dateStr,
    agencyName = 'Instansi / Korporat Mitra',
    picName = 'Perwakilan Mitra',
    picPosition = 'Penanggung Jawab Acara',
    picPhone = '-',
    picEmail = '-',
    eventType = 'Kegiatan Korporat & Kedinasan',
    startDate,
    endDate,
    durationDays = 1,
    estimatedAttendance = 0,
    rooms = [],
    addons = [],
    discountAmount = 0,
    totalBudget = 0,
    isSurveyRequested = false,
    preferredSurveyDate,
    logoBase64,
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let cursorY = 11;

  const now = new Date();
  const tanggalHariIniStr =
    dateStr ||
    now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  // ────────────────────────────────────────────────────────────────
  // 1. KOP SURAT RESMI KEDINASAN PEMKOT SURAKARTA & SOLO TECHNOPARK
  // ────────────────────────────────────────────────────────────────
  const logoSize = 18;
  const logoX = marginX;
  const logoY = cursorY + 0.5;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch {
      renderStpVectorEmblem(doc, logoX, logoY, logoSize);
    }
  } else {
    renderStpVectorEmblem(doc, logoX, logoY, logoSize);
  }

  // Teks Kop Surat
  const textKopX = marginX + logoSize + 4;
  const textKopWidth = contentWidth - logoSize - 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('PEMERINTAH KOTA SURAKARTA', textKopX + textKopWidth / 2, cursorY + 2.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900 navy
  doc.text('UPT KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK', textKopX + textKopWidth / 2, cursorY + 7.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    'Pusat Inovasi, Vokasi, dan Kewirausahaan Teknologi Berbasis BLUD',
    textKopX + textKopWidth / 2,
    cursorY + 11.5,
    { align: 'center' }
  );

  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta 57126 | Telp: (0271) 666628 | https://solotechnopark.id',
    textKopX + textKopWidth / 2,
    cursorY + 15.5,
    { align: 'center' }
  );

  cursorY += 19;

  // Garis Pembatas Kop Surat Ganda
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.75);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);

  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.25);
  doc.line(marginX, cursorY + 0.8, marginX + contentWidth, cursorY + 0.8);

  cursorY += 5;

  // ────────────────────────────────────────────────────────────────
  // 2. JUDUL DOKUMEN & PITA ESTIMASI RESMI
  // ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DRAF ESTIMASI PENAWARAN RESMI SEWA FASILITAS & PAKET EVENT B2B', marginX + contentWidth / 2, cursorY + 1, {
    align: 'center',
  });

  cursorY += 4.5;

  // Baris Nomor & Badge Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`Nomor Registrasi: ${quotationNumber}`, marginX, cursorY);

  // Badge Kanan: PPK-BLUD RESMI
  const badgeWidth = 48;
  const badgeHeight = 5.2;
  const badgeX = marginX + contentWidth - badgeWidth;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, cursorY - 3.8, badgeWidth, badgeHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('DRAF ESTIMASI RESMI BLUD', badgeX + badgeWidth / 2, cursorY - 0.5, { align: 'center' });

  cursorY += 5;

  // ────────────────────────────────────────────────────────────────
  // 3. INFORMASI PEMOHON & SPESIFIKASI KEGIATAN (2 KOLOM ELEGAN)
  // ────────────────────────────────────────────────────────────────
  const cardHeight = 31;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, contentWidth, cardHeight, 2, 2, 'FD');

  const col1X = marginX + 4;
  const col2X = marginX + contentWidth / 2 + 3;
  let textY = cursorY + 4.5;

  // Kolom 1: Data Instansi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INSTANSI / KORPORAT PEMOHON:', col1X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  const displayAgency = agencyName.length > 38 ? `${agencyName.slice(0, 38)}...` : agencyName;
  doc.text(displayAgency, col1X, textY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PERSON IN CHARGE (PIC) & KONTAK:', col1X, textY + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);
  doc.text(`${picName} (${picPosition})`, col1X, textY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`WA: ${picPhone} | Email: ${picEmail}`, col1X, textY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUS KUNJUNGAN SURVEY LOKASI:', col1X, textY + 20);
  doc.setFont('helvetica', 'bold');
  if (isSurveyRequested) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(100, 116, 139);
  }
  const surveyInfo = isSurveyRequested
    ? `Diminta (${preferredSurveyDate || 'Jadwal Menyusul'})`
    : 'Tidak Membutuhkan Survey';
  doc.text(surveyInfo, col1X, textY + 23);

  // Kolom 2: Spesifikasi Kegiatan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMA / JENIS ACARA:', col2X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  const displayEvent = eventType.length > 38 ? `${eventType.slice(0, 38)}...` : eventType;
  doc.text(displayEvent, col2X, textY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('JADWAL RENCANA PELAKSANAAN:', col2X, textY + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);
  const scheduleStr = startDate
    ? `${startDate} s/d ${endDate || startDate}`
    : 'Menyesuaikan Ketersediaan Kalender';
  doc.text(scheduleStr, col2X, textY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DURASI & PERKIRAAN PESERTA:', col2X, textY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const attendanceStr = estimatedAttendance > 0 ? `${estimatedAttendance} Orang` : 'Menyesuaikan';
  doc.text(`${durationDays} Hari Operasional • Estimasi ${attendanceStr}`, col2X, textY + 19.5);

  cursorY += cardHeight + 4.5;

  // ────────────────────────────────────────────────────────────────
  // 4. TABEL RINCIAN KOMPONEN BIAYA & FASILITAS (autoTable)
  // ────────────────────────────────────────────────────────────────
  const tableRows: any[] = [];
  let rowNumber = 1;

  // Ruangan yang disewa
  rooms.forEach((r) => {
    const subtotal = r.pricePerDay * durationDays;
    tableRows.push([
      rowNumber++,
      `Sewa Ruangan: ${r.name}`,
      `Kapasitas: ${r.capacity || 'Sesuai Tata Letak'} org • Lokasi: ${r.location || 'Kawasan STP'}`,
      `${durationDays} Hari`,
      formatRupiah(r.pricePerDay),
      formatRupiah(subtotal),
    ]);
  });

  // Add-ons & Perlengkapan Operasional
  addons.forEach((a) => {
    const subtotal = a.price * durationDays;
    tableRows.push([
      rowNumber++,
      `Add-on: ${a.name}`,
      a.description || `Satuan: ${a.unit || 'Paket'}`,
      `${durationDays} Hari`,
      formatRupiah(a.price),
      formatRupiah(subtotal),
    ]);
  });

  // Tambahkan baris diskon / bundling jika ada
  if (discountAmount > 0) {
    tableRows.push([
      {
        content: 'Insentif Bundling Mitra B2B (Diskon Multi-Ruangan 10%)',
        colSpan: 5,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] },
      },
      {
        content: `- ${formatRupiah(discountAmount)}`,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] },
      },
    ]);
  }

  // Baris Total Estimasi
  tableRows.push([
    {
      content: 'TOTAL ESTIMASI ANGGARAN FASILITAS (PPK-BLUD):',
      colSpan: 5,
      styles: {
        halign: 'right',
        fontStyle: 'bold',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
    },
    {
      content: formatRupiah(totalBudget),
      styles: {
        halign: 'right',
        fontStyle: 'bold',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
      },
    },
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['No', 'Komponen Fasilitas / Layanan', 'Spesifikasi & Keterangan', 'Durasi', 'Tarif Satuan', 'Subtotal']],
    body: tableRows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900 navy
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 55 },
      2: { halign: 'left', cellWidth: 47 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
    },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || cursorY + 40;
  cursorY = lastTableY + 4;

  // ────────────────────────────────────────────────────────────────
  // 5. KETENTUAN & CATATAN RESMI PENGGUNAAN FASILITAS
  // ────────────────────────────────────────────────────────────────
  const notesHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, notesHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('KETENTUAN DAN CATATAN RESMI PPK-BLUD:', marginX + 3, cursorY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Draf estimasi ini diterbitkan sistem secara otomatis untuk keperluan asistensi anggaran internal instansi.', marginX + 3, cursorY + 7.5);
  doc.text('2. Penetapan jadwal resmi mengikat setelah persetujuan teknis dan penerbitan Surat Bukti Pemesanan definitif.', marginX + 3, cursorY + 11.2);
  doc.text('3. Seluruh transaksi resmi disetorkan melalui Rekening Kas Badan Layanan Umum Daerah (BLUD) UPTD Solo Technopark.', marginX + 3, cursorY + 15);
  doc.text('4. Untuk koordinasi survey fisik (*site visit*), silakan hubungi Layanan Helpdesk B2B STP: (0271) 666628 / 0812-3456-7890.', marginX + 3, cursorY + 18.8);

  cursorY += notesHeight + 5;

  // ────────────────────────────────────────────────────────────────
  // 6. BLOK PENGESAHAN & STEMPEL TECHNO SIGN DIGITAL
  // ────────────────────────────────────────────────────────────────
  const signatureWidth = contentWidth / 2;
  const signLeftX = marginX + 4;
  const signRightX = marginX + contentWidth / 2 + 10;

  // Sisi Kiri: Pemohon / Instansi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Diajukan oleh Perwakilan Mitra:', signLeftX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(agencyName, signLeftX, cursorY + 4);

  // Sisi Kanan: UPT Solo Technopark
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Surakarta, ${tanggalHariIniStr}`, signRightX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('UPT KST SOLO TECHNOPARK', signRightX, cursorY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tim Pengelola Teknis & Layanan Fasilitas B2B', signRightX, cursorY + 7.5);

  // Render Stempel Digital di Sisi Kanan
  const stampCenterX = signRightX + 45;
  const stampCenterY = cursorY + 19;
  renderOfficialTechnoSignStamp(doc, stampCenterX, stampCenterY, quotationNumber);

  cursorY += 26;

  // Garis Bawah Penandatangan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${picName} )`, signLeftX, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Jabatan: ${picPosition}`, signLeftX, cursorY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('( PENGELOLA FASILITAS BLUD )', signRightX, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PPK-BLUD Kota Surakarta', signRightX, cursorY + 3.5);

  // ────────────────────────────────────────────────────────────────
  // 7. FOOTER INTEGRITAS DOKUMEN (HALAMAN 1 DARI 1)
  // ────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 2.5, marginX + contentWidth, footerY - 2.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen resmi digital digenerate melalui Portal Kawasan Sains & Teknologi Solo Technopark • Dicetak pada ${now.toLocaleString('id-ID')}`,
    marginX,
    footerY
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Halaman 1 dari 1', marginX + contentWidth, footerY, { align: 'right' });

  return doc;
}
