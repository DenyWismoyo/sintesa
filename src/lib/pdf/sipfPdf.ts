// src/lib/pdf/sipfPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from '@/utils/format';

export interface SipfPdfParams {
  sipfNumber: string;
  issueDate: string;
  userName: string;
  agencyName?: string;
  userPhone: string;
  userEmail: string;
  assetName: string;
  location?: string;
  capacity?: number;
  startDate: string;
  endDate: string;
  timeSlot: string;
  purpose: string;
  invoiceNumber?: string;
  totalAmount?: number;
}

export function generateSipfPdf(params: SipfPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. KOP SURAT RESMI
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PEMERINTAH KOTA SURAKARTA', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.text('UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta, Jawa Tengah 57126 | www.solotechnopark.id', pageWidth / 2, 22, { align: 'center' });

  // Garis Aksen Emas/Cyan
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // 2. JUDUL DOKUMEN
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SURAT IZIN PEMAKAIAN FASILITAS & ENTRY PASS KAWASAN', pageWidth / 2, 38, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Dokumen: ${params.sipfNumber}`, pageWidth / 2, 43, { align: 'center' });

  // STATUS SAH / VALID
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(34, 197, 94); // emerald-500
  doc.roundedRect(pageWidth - 55, 33, 42, 13, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('STATUS: RESMI LUNAS', pageWidth - 34, 38, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('IZIN MASUK DITERBITKAN', pageWidth - 34, 43, { align: 'center' });

  // 3. TABEL INFORMASI PEMOHON & RUANGAN
  const infoData = [
    ['Nama Pemegang Izin', `: ${params.userName}`],
    ['Instansi / Perusahaan', `: ${params.agencyName || '-'}`],
    ['Kontak WhatsApp / HP', `: ${params.userPhone}`],
    ['Alamat Email', `: ${params.userEmail}`],
    ['Fasilitas / Ruangan', `: ${params.assetName}`],
    ['Lokasi Gedung', `: ${params.location || 'Kawasan Solo Technopark'}`],
    ['Jadwal Pemakaian', `: ${params.startDate} s.d ${params.endDate}`],
    ['Waktu Operasional', `: ${params.timeSlot}`],
    ['Keperluan / Agenda', `: ${params.purpose}`],
    ['No. Invoice Pelunasan', `: ${params.invoiceNumber || 'LUNAS / RETRIBUSI TERVERIFIKASI'}`],
  ];

  autoTable(doc, {
    startY: 50,
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 },
    },
  });

  const afterInfoY = (doc as any).lastAutoTable?.finalY || 115;

  // 4. KOTAK TATA TERTIB & KETENTUAN PENGGUNAAN
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, afterInfoY + 4, pageWidth - 30, 48, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TATA TERTIB & KETENTUAN OPERASIONAL KAWASAN:', 20, afterInfoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const rules = [
    '1. Tunjukkan surat izin fisik atau digital ini kepada petugas keamanan di Pos Utama saat memasuki kawasan.',
    '2. Dilarang merokok di dalam ruangan ber-AC dan area bebas rokok Solo Technopark.',
    '3. Pengguna wajib menjaga kebersihan, ketertiban umum, dan tidak merusak inventaris fasilitas.',
    '4. Kerusakan peralatan atau fasilitas akibat kelalaian pemakaian menjadi tanggung jawab pihak peminjam.',
    '5. Waktu pemakaian berakhir tepat pada batas jam yang tertera pada surat izin ini.',
  ];

  rules.forEach((rule, idx) => {
    doc.text(rule, 20, afterInfoY + 18 + (idx * 6));
  });

  // 5. TANDA TANGAN ELEKTRONIK & STEMPEL RESMI
  const signY = afterInfoY + 60;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Surakarta, ${params.issueDate}`, pageWidth - 60, signY);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('An. KEPALA UPTD KST SOLO TECHNOPARK', pageWidth - 70, signY + 6);
  doc.text('Koordinator Layanan Fasilitas & Aset', pageWidth - 65, signY + 10);

  // Stempel Digital
  doc.setDrawColor(14, 165, 233);
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(pageWidth - 68, signY + 14, 55, 20, 2, 2, 'FD');
  doc.setTextColor(2, 132, 199);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DIVERIFIKASI SECARA ELEKTRONIK', pageWidth - 40, signY + 22, { align: 'center' });
  doc.text('SISTEM BLUD SINTESA', pageWidth - 40, signY + 28, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text('TIM OPERASIONAL KAWASAN STP', pageWidth - 65, signY + 40);

  // 6. FOOTER
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini merupakan Surat Izin Pemakaian Fasilitas resmi yang diterbitkan secara sah oleh UPTD KST Solo Technopark.', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

