// src/services/careerExport.service.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JobListing } from '@/types/job.types';
import { formatSalary } from '@/utils/format';

export type ExportScope =
  | 'CURRENT_FILTER'
  | 'SELECTED_ROWS'
  | 'SOLO_RAYA'
  | 'NATIONAL'
  | 'INTERNATIONAL'
  | 'ALL_ACTIVE';

export type ExportFormat = 'XLSX' | 'CSV' | 'PDF';

export interface CareerColumnDef {
  key: string;
  label: string;
  defaultSelected: boolean;
  getValue: (job: JobListing) => string;
}

export const CAREER_EXPORT_COLUMNS: CareerColumnDef[] = [
  {
    key: 'title',
    label: 'Nama Posisi / Pekerjaan',
    defaultSelected: true,
    getValue: (j) => j.title || '-',
  },
  {
    key: 'company',
    label: 'Nama Perusahaan / Industri',
    defaultSelected: true,
    getValue: (j) => j.company || '-',
  },
  {
    key: 'location',
    label: 'Lokasi & Penempatan',
    defaultSelected: true,
    getValue: (j) => `${j.location || '-'}${j.city ? ` (${j.city})` : ''}`,
  },
  {
    key: 'regionType',
    label: 'Cakupan Wilayah',
    defaultSelected: true,
    getValue: (j) => inferRegionType(j),
  },
  {
    key: 'category',
    label: 'Kategori Kejuruan',
    defaultSelected: true,
    getValue: (j) => j.category || '-',
  },
  {
    key: 'workType',
    label: 'Tipe & Model Kerja',
    defaultSelected: true,
    getValue: (j) => `${j.workType || 'Full-time'} - ${j.workSetup || 'On-site'}`,
  },
  {
    key: 'experienceLevel',
    label: 'Kualifikasi Pengalaman',
    defaultSelected: true,
    getValue: (j) => j.experienceLevel || 'Semua Level',
  },
  {
    key: 'salary',
    label: 'Estimasi Gaji',
    defaultSelected: true,
    getValue: (j) => {
      if (j.salary && j.salary.isDisclosed && (j.salary.min || j.salary.max)) {
        const minStr = j.salary.min ? formatSalary(j.salary.min, j.salary.currency || 'IDR') : 'N/A';
        const maxStr = j.salary.max ? formatSalary(j.salary.max, j.salary.currency || 'IDR') : 'N/A';
        return `${minStr} - ${maxStr} / ${j.salary.period || 'Bulan'}`;
      }
      return 'Kompetitif / Sesuai Kesepakatan';
    },
  },
  {
    key: 'skills',
    label: 'Keahlian Dibutuhkan (Skills)',
    defaultSelected: true,
    getValue: (j) => (j.skills && j.skills.length > 0 ? j.skills.join(', ') : '-'),
  },
  {
    key: 'relevantTrainingPrograms',
    label: 'Program Pelatihan STP Selaras',
    defaultSelected: true,
    getValue: (j) =>
      j.relevantTrainingPrograms && j.relevantTrainingPrograms.length > 0
        ? j.relevantTrainingPrograms.join(', ')
        : 'Penyesuaian Diklat Khusus STP',
  },
  {
    key: 'partnershipScheme',
    label: 'Potensi Skema Kemitraan STP',
    defaultSelected: true,
    getValue: (j) => inferPartnershipScheme(j),
  },
  {
    key: 'sourceType',
    label: 'Status Mitra STP',
    defaultSelected: false,
    getValue: (j) => (j.isStpPartner ? 'Mitra Kawasan STP Resmi' : 'Calon Mitra / Agregator Industri'),
  },
  {
    key: 'sourceUrl',
    label: 'Tautan Pendaftaran / Kontak',
    defaultSelected: false,
    getValue: (j) => j.applicationUrl || j.companyWebsite || j.applicationEmail || '-',
  },
];

export interface CareerExportOptions {
  scope: ExportScope;
  format: ExportFormat;
  selectedColumns: string[];
  filterRegion?: string;
  filterCategory?: string;
  filterTraining?: string;
  signerName?: string;
  signerRole?: string;
  documentTitle?: string;
  notes?: string;
}

/**
 * Deteksi cakupan wilayah: Solo Raya, Nasional, atau Internasional
 */
export function inferRegionType(job: JobListing): string {
  const loc = (job.location + ' ' + (job.city || '')).toLowerCase();
  const foreignKeywords = [
    'singapore', 'singapura', 'malaysia', 'kuala lumpur', 'tokyo', 'japan', 'jepang',
    'philippines', 'filipina', 'thailand', 'bangkok', 'vietnam', 'hanoi', 'worldwide',
    'global', 'remote worldwide', 'united states', 'australia', 'germany', 'jerman',
    'taiwan', 'korea', 'netherlands', 'belanda', 'dubai', 'uae', 'saudi'
  ];
  if (foreignKeywords.some((k) => loc.includes(k))) {
    return 'Luar Negeri (Global)';
  }

  const soloKeywords = [
    'solo', 'surakarta', 'sukoharjo', 'karanganyar', 'sragen', 'boyolali', 'klaten', 'wonogiri', 'stp'
  ];
  if (soloKeywords.some((k) => loc.includes(k)) || job.workSetup?.includes('Solo')) {
    return 'Solo Raya (Lokal)';
  }

  return 'Nasional (Dalam Negeri)';
}

/**
 * Rekomendasi bentuk negosiasi kemitraan STP
 */
export function inferPartnershipScheme(job: JobListing): string {
  if (job.isStpPartner) {
    return 'Penyaluran Talenta Prioritas (MoU Aktif)';
  }
  const region = inferRegionType(job);
  if (region === 'Luar Negeri (Global)') {
    return 'MoU Penyaluran Tenaga Terampil Global / Migran Bersertifikasi';
  }
  if (job.experienceLevel?.includes('Fresh') || job.experienceLevel?.includes('Alumni')) {
    return 'Penyaluran Alumni Langsung & Magang Bersertifikat Industri';
  }
  return 'Penjajakan MoU Rekrutmen & Pelatihan Kustom (Tailor-Made)';
}

/**
 * Saring data lowongan berdasarkan kriteria ekspor yang dipilih
 */
export function filterJobsForExport(
  allJobs: JobListing[],
  currentFilteredJobs: JobListing[],
  selectedIds: string[],
  options: CareerExportOptions
): JobListing[] {
  let list: JobListing[] = [];

  switch (options.scope) {
    case 'SELECTED_ROWS':
      list = allJobs.filter((j) => selectedIds.includes(j.id));
      break;
    case 'SOLO_RAYA':
      list = allJobs.filter((j) => inferRegionType(j) === 'Solo Raya (Lokal)');
      break;
    case 'NATIONAL':
      list = allJobs.filter((j) => inferRegionType(j) === 'Nasional (Dalam Negeri)');
      break;
    case 'INTERNATIONAL':
      list = allJobs.filter((j) => inferRegionType(j) === 'Luar Negeri (Global)');
      break;
    case 'ALL_ACTIVE':
      list = allJobs.filter((j) => j.isActive);
      break;
    case 'CURRENT_FILTER':
    default:
      list = [...currentFilteredJobs];
      break;
  }

  // Filter Tambahan Kategori jika ada
  if (options.filterCategory && options.filterCategory !== 'ALL') {
    list = list.filter((j) => j.category === options.filterCategory);
  }

  // Filter Tambahan Program Pelatihan jika ada
  if (options.filterTraining && options.filterTraining.trim()) {
    const tp = options.filterTraining.toLowerCase().trim();
    list = list.filter((j) =>
      (j.relevantTrainingPrograms || []).some((p) => p.toLowerCase().includes(tp)) ||
      (j.title || '').toLowerCase().includes(tp) ||
      (j.skills || []).some((s) => s.toLowerCase().includes(tp))
    );
  }

  return list;
}

/**
 * Generate dan Unduh File Spreadsheet XLSX
 */
export function exportToXlsx(
  jobs: JobListing[],
  selectedColumnsKeys: string[],
  fileNamePrefix: string = 'Rekap_Peluang_Kemitraan_STP'
): void {
  const activeCols = CAREER_EXPORT_COLUMNS.filter((c) => selectedColumnsKeys.includes(c.key));
  if (activeCols.length === 0) {
    throw new Error('Pilih setidaknya satu kolom untuk diekspor.');
  }

  // Siapkan data baris
  const rows = jobs.map((job, idx) => {
    const rowObj: Record<string, string | number> = {
      No: idx + 1,
    };
    activeCols.forEach((col) => {
      rowObj[col.label] = col.getValue(job);
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Atur lebar kolom otomatis
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.slice(0, 50).map((r) => String(r[key] || '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Peluang Kemitraan STP');

  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const finalFilename = `${fileNamePrefix}_${nowStr}.xlsx`;

  XLSX.writeFile(workbook, finalFilename);
}

/**
 * Generate dan Unduh File Spreadsheet CSV (UTF-8 BOM untuk kompatibilitas penuh Excel)
 */
export function exportToCsv(
  jobs: JobListing[],
  selectedColumnsKeys: string[],
  fileNamePrefix: string = 'Rekap_Peluang_Kemitraan_STP'
): void {
  const activeCols = CAREER_EXPORT_COLUMNS.filter((c) => selectedColumnsKeys.includes(c.key));
  if (activeCols.length === 0) {
    throw new Error('Pilih setidaknya satu kolom untuk diekspor.');
  }

  const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

  const headers = ['No', ...activeCols.map((c) => c.label)];
  const csvRows: string[] = [headers.map(escapeCsv).join(',')];

  jobs.forEach((job, idx) => {
    const values = [String(idx + 1), ...activeCols.map((c) => c.getValue(job))];
    csvRows.push(values.map(escapeCsv).join(','));
  });

  // Tambahkan UTF-8 Byte Order Mark (BOM) agar Microsoft Excel langsung membaca teks dengan sempurna
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Dokumen PDF Resmi Landscape A4 untuk Negosiasi Kemitraan
 */
export async function exportToPdf(
  jobs: JobListing[],
  selectedColumnsKeys: string[],
  options: {
    title?: string;
    signerName?: string;
    signerRole?: string;
    signerNip?: string;
    city?: string;
    notes?: string;
  } = {}
): Promise<void> {
  const activeCols = CAREER_EXPORT_COLUMNS.filter((c) => selectedColumnsKeys.includes(c.key));
  if (activeCols.length === 0) {
    throw new Error('Pilih setidaknya satu kolom untuk diekspor.');
  }

  // Gunakan orientasi Landscape A4 (297 x 210 mm) agar muat matriks industri & talenta
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Bar Aksen STP (Brand Navy & Red)
  doc.setFillColor(42, 52, 82); // Navy STP
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(222, 49, 56); // Red STP
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  let currentY = 14;

  // 2. Kop Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const title = options.title || 'LAPORAN PEMETAAN KEBUTUHAN INDUSTRI & PROSPEK KEMITRAAN PENYALURAN ALUMNI';
  doc.text(title, margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Kawasan Sains dan Teknologi Solo Technopark — Pusat Ekosistem Inovasi, Riset, Pelatihan Vokasi, dan Inkubasi Bisnis',
    margin,
    currentY
  );

  currentY += 4;
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date());

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tanggal Ekstraksi Data: ${todayFormatted} | Total Lowongan Terpetakan: ${jobs.length} Posisi`,
    margin,
    currentY
  );

  // Garis pembatas kop
  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // 3. Ringkasan Eksekutif (Metrics Mini Box)
  const soloCount = jobs.filter((j) => inferRegionType(j) === 'Solo Raya (Lokal)').length;
  const nationalCount = jobs.filter((j) => inferRegionType(j) === 'Nasional (Dalam Negeri)').length;
  const foreignCount = jobs.filter((j) => inferRegionType(j) === 'Luar Negeri (Global)').length;
  const stpPartnerCount = jobs.filter((j) => j.isStpPartner).length;

  const boxWidth = (contentWidth - 9) / 4;
  const boxHeight = 13;

  const summaryBoxes = [
    { label: 'Total Peluang Industri', val: `${jobs.length} Posisi`, color: [16, 185, 129] }, // emerald
    { label: 'Peluang Luar Negeri (Global)', val: `${foreignCount} Posisi`, color: [59, 130, 246] }, // blue
    { label: 'Peluang Nasional (Dalam Negeri)', val: `${nationalCount} Posisi`, color: [139, 92, 246] }, // purple
    { label: 'Solo Raya & Mitra STP', val: `${soloCount} (${stpPartnerCount} Mitra)`, color: [245, 158, 11] }, // amber
  ];

  summaryBoxes.forEach((b, idx) => {
    const x = margin + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label.toUpperCase(), x + 3, currentY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(b.val, x + 3, currentY + 10);
  });

  currentY += boxHeight + 5;

  // 4. Tabel Daftar Lowongan & Penyelarasan Alumni STP
  const tableHeaders = ['No', ...activeCols.map((c) => c.label)];
  const tableBody = jobs.map((job, idx) => [
    String(idx + 1),
    ...activeCols.map((c) => c.getValue(job)),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [42, 52, 82], // Navy STP
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // No
    },
    margin: { left: margin, right: margin, bottom: 25 },
    didDrawPage: (data) => {
      // Footer Setiap Halaman
      const pageNumber = data.pageNumber;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Kemitraan & Penyaluran Alumni Solo Technopark — Halaman ${pageNumber}`,
        margin,
        pageHeight - 8
      );
      doc.text(
        'Dicetak secara otomatis melalui Sistem SINTESA Technopark',
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // Ambil posisi akhir tabel
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 20;

  // 5. Lembar Penandatanganan Pejabat STP (Jika muat di halaman yang sama atau buat halaman baru jika mepet)
  let signY = finalY;
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = 20;
  }

  const signX = pageWidth - margin - 75;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${options.city || 'Surakarta'}, ${todayFormatted}`, signX, signY);

  doc.setFont('helvetica', 'bold');
  doc.text(options.signerRole || 'Divisi Kemitraan Industri & Penyaluran Talenta STP', signX, signY + 4.5);

  signY += 22; // Tempat tanda tangan
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options.signerName || 'Tim Kemitraan Solo Technopark', signX, signY);

  if (options.signerNip) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`NIP. ${options.signerNip}`, signX, signY + 3.5);
  }

  // Unduh atau Pratinjau PDF
  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`Dokumen_Kemitraan_STP_${nowStr}.pdf`);
}
