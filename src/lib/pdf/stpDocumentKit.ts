// src/lib/pdf/stpDocumentKit.ts
// ============================================================================
// DESIGN KIT DOKUMEN RESMI SOLO TECHNOPARK (PDF VEKTOR MURNI)
// ----------------------------------------------------------------------------
// Bahasa visual diadopsi dari layout Invoice resmi (PrintInvoiceLayout.tsx):
//   - Bar gelap di atas halaman + aksen merah brand STP
//   - Kop kiri: logo + identitas instansi | Kanan: judul besar, nomor, badge
//   - Tabel minimalis (garis tebal di header, garis tipis antar baris)
//   - Panel total di kanan, tanda tangan formal, footer "Dokumen Elektronik Sah"
// Semua teks diukur & di-wrap terhadap lebar kolom sehingga tidak keluar garis,
// dan konten panjang otomatis berpindah halaman dengan kop lanjutan.
// ============================================================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from '@/utils/format';

// ---------------------------------------------------------------------------
// 1. Konstanta Tata Letak & Palet Warna
// ---------------------------------------------------------------------------
export const STP_PAGE = {
  width: 210,
  height: 297,
  margin: 16,
  /** Batas bawah area konten (di bawahnya khusus footer) */
  contentBottom: 272,
  /** Titik mulai konten pada halaman lanjutan */
  continuationTop: 27
} as const;

export const STP_CONTENT_WIDTH = STP_PAGE.width - STP_PAGE.margin * 2; // 178 mm
const M = STP_PAGE.margin;
const R = STP_PAGE.width - STP_PAGE.margin;

export type RGB = [number, number, number];

export const STP_COLORS = {
  ink: [15, 23, 42] as RGB, // slate-900
  text: [30, 41, 59] as RGB, // slate-800
  body: [51, 65, 85] as RGB, // slate-700
  muted: [100, 116, 139] as RGB, // slate-500
  faint: [148, 163, 184] as RGB, // slate-400
  line: [226, 232, 240] as RGB, // slate-200
  lineSoft: [241, 245, 249] as RGB, // slate-100
  panel: [248, 250, 252] as RGB, // slate-50
  brandRed: [222, 49, 56] as RGB, // merah roda gigi logo STP
  brandNavy: [42, 52, 82] as RGB, // navy wordmark "solo"
  stamp: [37, 64, 160] as RGB // biru tinta stempel dinas
};

export type BadgeTone = 'neutral' | 'info' | 'indigo' | 'warning' | 'success' | 'danger';

const BADGE_TONES: Record<BadgeTone, { bg: RGB; border: RGB; text: RGB }> = {
  neutral: { bg: [248, 250, 252], border: [203, 213, 225], text: [71, 85, 105] },
  info: { bg: [239, 246, 255], border: [147, 197, 253], text: [29, 78, 216] },
  indigo: { bg: [238, 242, 255], border: [165, 180, 252], text: [67, 56, 202] },
  warning: { bg: [255, 251, 235], border: [252, 211, 77], text: [180, 83, 9] },
  success: { bg: [236, 253, 245], border: [110, 231, 183], text: [4, 120, 87] },
  danger: { bg: [254, 242, 242], border: [252, 165, 165], text: [185, 28, 28] }
};

// ---------------------------------------------------------------------------
// 2. Profil Instansi (bisa ditimpa dari Pengaturan Sistem / useSetting)
// ---------------------------------------------------------------------------
export interface StpInstitutionProfile {
  name?: string;
  description?: string;
  unit?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
}

export const DEFAULT_STP_PROFILE: Required<StpInstitutionProfile> = {
  name: 'UPTD KST Solo Technopark',
  description: 'Badan Layanan Umum Daerah (BLUD) - Pemerintah Kota Surakarta',
  unit: 'Divisi Layanan Manufaktur & Jasa Produksi',
  address: 'Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta, Jawa Tengah 57126',
  phone: '(0271) 666628',
  email: 'info@solotechnopark.id',
  website: 'solotechnopark.id',
  city: 'Surakarta'
};

export function resolveStpProfile(profile?: StpInstitutionProfile | null): Required<StpInstitutionProfile> {
  const merged = { ...DEFAULT_STP_PROFILE };
  if (!profile) return merged;
  (Object.keys(merged) as (keyof StpInstitutionProfile)[]).forEach((key) => {
    const value = profile[key];
    if (typeof value === 'string' && value.trim()) merged[key] = value.trim();
  });
  return merged;
}

// ---------------------------------------------------------------------------
// 3. Pemuat Logo Resmi (public/logo.png — wordmark + roda gigi, rasio 1.814)
// ---------------------------------------------------------------------------
export const STP_LOGO_URL = '/logo.png';
export const STP_LOGO_RATIO = 800 / 441;

let logoPromise: Promise<string | null> | null = null;

/** Memuat logo STP sebagai DataURL (cache sekali per sesi browser). */
export function loadStpLogo(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!logoPromise) {
    logoPromise = fetch(STP_LOGO_URL)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Logo tidak ditemukan'))))
      .then(
        (blob) =>
          new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => {
        logoPromise = null; // izinkan percobaan ulang berikutnya
        return null;
      });
  }
  return logoPromise;
}

// ---------------------------------------------------------------------------
// 4. Utilitas Teks & Format
// ---------------------------------------------------------------------------
type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic';

export function setFont(
  doc: jsPDF,
  size: number,
  style: FontStyle = 'normal',
  color: RGB = STP_COLORS.text,
  family: 'helvetica' | 'courier' = 'helvetica'
) {
  doc.setFont(family, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function setStroke(doc: jsPDF, color: RGB, width: number) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
}

function setFill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}

/** Memecah teks agar muat dalam lebar tertentu (memakai font yang sedang aktif). */
export function wrap(doc: jsPDF, text: string | number | null | undefined, width: number): string[] {
  const value = text === null || text === undefined || text === '' ? '-' : String(text);
  return doc.splitTextToSize(value, width) as string[];
}

/** Memotong teks satu baris dengan elipsis bila melebihi lebar. */
export function truncate(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(`${t}...`) > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
}

/** Mengecilkan ukuran font sampai teks muat dalam lebar maksimum. */
export function fitFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  style: FontStyle = 'bold',
  family: 'helvetica' | 'courier' = 'helvetica'
): number {
  doc.setFont(family, style);
  let size = start;
  while (size > min) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidth) break;
    size -= 0.5;
  }
  doc.setFontSize(size);
  return size;
}

/** Format Rupiah aman untuk font standar PDF (NBSP diganti spasi biasa). */
export function rupiah(value: number | null | undefined): string {
  return formatRupiah(value || 0).replace(/\u00A0/g, ' ');
}

/** Format tanggal panjang Indonesia: "28 Oktober 2026". */
export function formatTanggal(input?: string | number | null): string {
  if (input === undefined || input === null || input === '') return '-';
  const normalized = typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00` : input;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return String(input);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Kode verifikasi deterministik (FNV-1a) dari nomor dokumen. */
export function verificationCode(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `STP-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

function currentPage(doc: jsPDF): number {
  return (doc as any).internal.getCurrentPageInfo().pageNumber as number;
}

function withOpacity(doc: jsPDF, opacity: number, draw: () => void) {
  const anyDoc = doc as any;
  let applied = false;
  try {
    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity, 'stroke-opacity': opacity }));
      applied = true;
    }
  } catch {
    applied = false;
  }
  draw();
  if (applied) {
    try {
      anyDoc.setGState(new anyDoc.GState({ opacity: 1, 'stroke-opacity': 1 }));
    } catch {
      /* abaikan */
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Konteks Dokumen
// ---------------------------------------------------------------------------
export interface StpDocContext {
  doc: jsPDF;
  title: string;
  subtitle: string;
  docNumber: string;
  logo: string | null;
  profile: Required<StpInstitutionProfile>;
  headerPages: Set<number>;
}

export interface CreateStpDocumentOptions {
  title: string;
  subtitle: string;
  docNumber: string;
  logoBase64?: string | null;
  profile?: StpInstitutionProfile | null;
}

export function createStpDocument(options: CreateStpDocumentOptions): StpDocContext {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `${options.title} ${options.docNumber}`,
    subject: options.subtitle,
    author: resolveStpProfile(options.profile).name,
    creator: 'SINTESA - Sistem Informasi Layanan Solo Technopark'
  });
  return {
    doc,
    title: options.title,
    subtitle: options.subtitle,
    docNumber: options.docNumber,
    logo: options.logoBase64 || null,
    profile: resolveStpProfile(options.profile),
    headerPages: new Set<number>()
  };
}

// ---------------------------------------------------------------------------
// 6. Kop Surat (Halaman Pertama & Halaman Lanjutan)
// ---------------------------------------------------------------------------
function drawTopBar(doc: jsPDF) {
  setFill(doc, STP_COLORS.ink);
  doc.rect(0, 0, STP_PAGE.width, 2.4, 'F');
  setFill(doc, STP_COLORS.brandRed);
  doc.rect(0, 0, 52, 2.4, 'F');
}

/** Badge status ber-border (rata kanan pada rightX). Mengembalikan posisi kiri & bawah. */
export function drawBadge(doc: jsPDF, label: string, tone: BadgeTone, rightX: number, topY: number) {
  const palette = BADGE_TONES[tone];
  setFont(doc, 6.2, 'bold', palette.text);
  const text = label.toUpperCase();
  const width = doc.getTextWidth(text) + 5;
  const height = 5;
  const x = rightX - width;
  setFill(doc, palette.bg);
  setStroke(doc, palette.border, 0.3);
  doc.roundedRect(x, topY, width, height, 1, 1, 'FD');
  doc.text(text, x + 2.5, topY + 3.45);
  return { left: x, bottom: topY + height };
}

function drawLogo(ctx: StpDocContext, x: number, y: number, width: number): boolean {
  if (!ctx.logo) return false;
  try {
    ctx.doc.addImage(ctx.logo, 'PNG', x, y, width, width / STP_LOGO_RATIO, 'stp-logo', 'FAST');
    return true;
  } catch {
    return false;
  }
}

/** Kop utama halaman pertama. Mengembalikan posisi Y awal konten. */
export function drawLetterhead(ctx: StpDocContext, status?: { label: string; tone: BadgeTone }): number {
  const { doc, profile } = ctx;
  drawTopBar(doc);

  const y0 = 11;
  const rightWidth = 60;
  const leftEnd = R - rightWidth - 4;

  // --- Blok kiri: logo + identitas instansi ---
  let textX = M;
  const logoWidth = 34;
  if (drawLogo(ctx, M, y0, logoWidth)) {
    const dividerX = M + logoWidth + 4;
    setStroke(doc, STP_COLORS.line, 0.3);
    doc.line(dividerX, y0 + 0.5, dividerX, y0 + logoWidth / STP_LOGO_RATIO - 0.5);
    textX = dividerX + 4;
  }
  const leftWidth = leftEnd - textX;

  let ly = y0 + 3.6;
  const name = profile.name.toUpperCase();
  const nameSize = fitFontSize(doc, name, leftWidth, 12, 8.5, 'bold');
  setFont(doc, nameSize, 'bold', STP_COLORS.ink);
  doc.text(name, textX, ly);
  ly += 3.8;

  setFont(doc, 6.3, 'bold', STP_COLORS.muted);
  wrap(doc, profile.description.toUpperCase(), leftWidth)
    .slice(0, 2)
    .forEach((line) => {
      doc.text(line, textX, ly);
      ly += 2.8;
    });

  setFont(doc, 6.5, 'bold', STP_COLORS.brandRed);
  doc.text(truncate(doc, profile.unit.toUpperCase(), leftWidth), textX, ly);
  ly += 3.6;

  setFont(doc, 6.4, 'normal', STP_COLORS.muted);
  const contact = [
    profile.phone ? `Telp. ${profile.phone}` : '',
    profile.email,
    profile.website.replace(/^https?:\/\//, '')
  ]
    .filter(Boolean)
    .join('  |  ');
  [...wrap(doc, profile.address, leftWidth).slice(0, 2), ...wrap(doc, contact, leftWidth).slice(0, 2)].forEach(
    (line) => {
      doc.text(line, textX, ly);
      ly += 2.8;
    }
  );

  // --- Blok kanan: judul, subjudul, nomor, status ---
  let ry = y0 + 5.2;
  const titleSize = fitFontSize(doc, ctx.title, rightWidth, 17, 11, 'bold');
  setFont(doc, titleSize, 'bold', STP_COLORS.ink);
  const titleLines = wrap(doc, ctx.title, rightWidth).slice(0, 2);
  titleLines.forEach((line, i) => doc.text(line, R, ry + i * titleSize * 0.42, { align: 'right' }));
  ry += (titleLines.length - 1) * titleSize * 0.42 + 4;

  setFont(doc, 6.2, 'bold', STP_COLORS.faint);
  doc.text(truncate(doc, ctx.subtitle.toUpperCase(), rightWidth), R, ry, { align: 'right' });
  ry += 4.8;

  const numberSize = fitFontSize(doc, ctx.docNumber, rightWidth, 9.5, 6.5, 'bold', 'courier');
  setFont(doc, numberSize, 'bold', STP_COLORS.text, 'courier');
  doc.text(ctx.docNumber, R, ry, { align: 'right' });
  ry += 2.4;

  if (status) {
    ry = drawBadge(doc, status.label, status.tone, R, ry).bottom;
  }

  const logoBottom = ctx.logo ? y0 + logoWidth / STP_LOGO_RATIO : y0;
  const bottom = Math.max(ly, ry + 1, logoBottom) + 3;
  setStroke(doc, STP_COLORS.line, 0.5);
  doc.line(M, bottom, R, bottom);

  ctx.headerPages.add(currentPage(doc));
  return bottom + 6.5;
}

/** Kop ringkas untuk halaman lanjutan. */
export function drawContinuationHeader(ctx: StpDocContext): number {
  const { doc, profile } = ctx;
  drawTopBar(doc);
  let textX = M;
  if (drawLogo(ctx, M, 6.5, 19)) textX = M + 23;

  setFont(doc, 8.5, 'bold', STP_COLORS.ink);
  doc.text(truncate(doc, profile.name.toUpperCase(), 80), textX, 11.5);
  setFont(doc, 6, 'bold', STP_COLORS.muted);
  doc.text(truncate(doc, profile.unit.toUpperCase(), 80), textX, 14.8);

  setFont(doc, 8.5, 'bold', STP_COLORS.ink);
  doc.text(truncate(doc, ctx.title, 70), R, 11.5, { align: 'right' });
  setFont(doc, 7, 'bold', STP_COLORS.muted, 'courier');
  doc.text(truncate(doc, `${ctx.docNumber} (lanjutan)`, 70), R, 14.8, { align: 'right' });

  setStroke(doc, STP_COLORS.line, 0.4);
  doc.line(M, 19.5, R, 19.5);
  ctx.headerPages.add(currentPage(doc));
  return STP_PAGE.continuationTop;
}

/** Pastikan ada ruang setinggi `needed`; jika tidak, pindah ke halaman baru. */
export function ensureSpace(ctx: StpDocContext, y: number, needed: number): number {
  if (y + needed <= STP_PAGE.contentBottom) return y;
  ctx.doc.addPage();
  return drawContinuationHeader(ctx);
}

// ---------------------------------------------------------------------------
// 7. Blok Informasi
// ---------------------------------------------------------------------------
export function drawSectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  setFont(doc, 6.3, 'bold', STP_COLORS.faint);
  doc.text(label.toUpperCase(), x, y);
}

export interface PartyBlock {
  label: string;
  name: string;
  subtitle?: string;
  lines: string[];
}

/** Blok pihak (mis. "Ditagihkan/Dikirim Kepada"). Mengembalikan Y bawah. */
export function drawPartyBlock(doc: jsPDF, x: number, y: number, width: number, block: PartyBlock): number {
  drawSectionLabel(doc, block.label, x, y);
  let cy = y + 5;

  setFont(doc, 10.5, 'bold', STP_COLORS.ink);
  wrap(doc, block.name, width)
    .slice(0, 2)
    .forEach((line) => {
      doc.text(line, x, cy);
      cy += 4.4;
    });

  if (block.subtitle) {
    setFont(doc, 7.4, 'bold', STP_COLORS.muted);
    doc.text(truncate(doc, block.subtitle, width), x, cy);
    cy += 3.9;
  }

  cy += 0.6;
  setFont(doc, 7.3, 'normal', STP_COLORS.body);
  block.lines
    .filter((line) => line && line.trim())
    .forEach((entry) => {
      wrap(doc, entry, width)
        .slice(0, 3)
        .forEach((line) => {
          doc.text(line, x, cy);
          cy += 3.3;
        });
    });
  return cy;
}

export interface KeyValueRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

/** Baris label-nilai dengan pemisah tipis (gaya panel tanggal invoice). */
export function drawKeyValueRows(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: KeyValueRow[],
  label?: string
): number {
  let cy = y;
  if (label) {
    drawSectionLabel(doc, label, x, cy);
    cy += 1.6;
  }
  const labelWidth = 31;
  rows.forEach((row) => {
    setFont(doc, 7.3, 'bold', STP_COLORS.text);
    const valueLines = wrap(doc, row.value, width - labelWidth - 2).slice(0, 3);
    const rowHeight = valueLines.length * 3.3 + 2.8;

    setFont(doc, 7.3, 'normal', STP_COLORS.muted);
    doc.text(row.label, x, cy + 3.7);
    setFont(doc, 7.3, 'bold', row.emphasis ? STP_COLORS.brandRed : STP_COLORS.text);
    valueLines.forEach((line, i) => doc.text(line, x + width, cy + 3.7 + i * 3.3, { align: 'right' }));

    cy += rowHeight;
    setStroke(doc, STP_COLORS.lineSoft, 0.3);
    doc.line(x, cy, x + width, cy);
  });
  return cy;
}

/** Pita sorotan penuh (mis. judul pekerjaan) dengan aksen merah di kiri. */
export function drawHighlightBand(
  ctx: StpDocContext,
  y: number,
  label: string,
  text: string,
  chips: { label: string; tone: BadgeTone }[] = []
): number {
  const { doc } = ctx;
  setFont(doc, 10, 'bold', STP_COLORS.ink);
  const textLines = wrap(doc, text, STP_CONTENT_WIDTH - 10).slice(0, 3);
  const height = 9 + textLines.length * 4.4;
  y = ensureSpace(ctx, y, height + 4);

  setFill(doc, STP_COLORS.panel);
  setStroke(doc, STP_COLORS.line, 0.3);
  doc.rect(M, y, STP_CONTENT_WIDTH, height, 'FD');
  setFill(doc, STP_COLORS.brandRed);
  doc.rect(M, y, 1.3, height, 'F');

  drawSectionLabel(doc, label, M + 5, y + 4.6);
  let chipRight = R - 3;
  chips.forEach((chip) => {
    chipRight = drawBadge(doc, chip.label, chip.tone, chipRight, y + 1.6).left - 1.5;
  });

  setFont(doc, 10, 'bold', STP_COLORS.ink);
  textLines.forEach((line, i) => doc.text(line, M + 5, y + 9.6 + i * 4.4));
  return y + height + 6;
}

// ---------------------------------------------------------------------------
// 8. Tabel Rincian (gaya invoice) dengan sel "kaya" (judul + detail + catatan)
// ---------------------------------------------------------------------------
export interface RichCell {
  title: string;
  details?: string[];
  note?: string;
}

export type TableCell = string | RichCell;

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

interface RichLayout {
  title: string[];
  details: string[];
  note: string[];
  height: number;
}

export function drawItemsTable(
  ctx: StpDocContext,
  startY: number,
  columns: TableColumn[],
  rows: TableCell[][],
  emptyMessage = 'Tidak ada rincian item.'
): number {
  const { doc } = ctx;
  const padX = 2;
  const padY = 2.6;
  const layouts = new Map<string, RichLayout>();

  const body: string[][] = rows.length
    ? rows.map((row, ri) =>
        row.map((cell, ci) => {
          if (typeof cell === 'string') return cell;
          const innerWidth = columns[ci].width - padX * 2;
          setFont(doc, 8.3, 'bold');
          const title = wrap(doc, cell.title, innerWidth);
          setFont(doc, 7, 'normal');
          const details = (cell.details || []).filter(Boolean).flatMap((d) => wrap(doc, d, innerWidth));
          setFont(doc, 6.8, 'italic');
          const note = cell.note ? wrap(doc, cell.note, innerWidth) : [];
          const height =
            padY * 2 + 2.6 + (title.length - 1) * 3.6 + details.length * 3.1 + (note.length ? 0.8 + note.length * 3 : 0) + 1;
          layouts.set(`${ri}:${ci}`, { title, details, note, height });
          return '';
        })
      )
    : [[emptyMessage, ...columns.slice(1).map(() => '')]];

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header.toUpperCase())],
    body,
    theme: 'plain',
    margin: {
      left: M,
      right: M,
      top: STP_PAGE.continuationTop,
      bottom: STP_PAGE.height - STP_PAGE.contentBottom
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: STP_COLORS.body,
      cellPadding: { top: padY, bottom: padY, left: padX, right: padX },
      valign: 'top',
      overflow: 'linebreak'
    },
    headStyles: {
      fontSize: 6.6,
      fontStyle: 'bold',
      textColor: STP_COLORS.ink,
      cellPadding: { top: 2.4, bottom: 2.4, left: padX, right: padX },
      valign: 'middle'
    },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { cellWidth: c.width, halign: c.align || 'left', fontStyle: c.bold ? 'bold' : 'normal' }])
    ),
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.halign = columns[data.column.index]?.align || 'left';
      } else if (data.section === 'body') {
        if (!rows.length) {
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.textColor = STP_COLORS.faint;
        }
        const layout = layouts.get(`${data.row.index}:${data.column.index}`);
        if (layout) data.cell.styles.minCellHeight = layout.height;
      }
    },
    didDrawCell: (data) => {
      const { cell } = data;
      if (data.section === 'head') {
        setStroke(doc, STP_COLORS.ink, 0.45);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        return;
      }
      if (data.section !== 'body') return;
      setStroke(doc, STP_COLORS.line, 0.2);
      doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);

      const layout = layouts.get(`${data.row.index}:${data.column.index}`);
      if (!layout) return;
      const x = cell.x + padX;
      let cy = cell.y + padY + 2.6;
      setFont(doc, 8.3, 'bold', STP_COLORS.ink);
      layout.title.forEach((line, i) => {
        if (i > 0) cy += 3.6;
        doc.text(line, x, cy);
      });
      setFont(doc, 7, 'normal', STP_COLORS.muted);
      layout.details.forEach((line) => {
        cy += 3.1;
        doc.text(line, x, cy);
      });
      if (layout.note.length) {
        cy += 0.8;
        setFont(doc, 6.8, 'italic', STP_COLORS.muted);
        layout.note.forEach((line) => {
          cy += 3;
          doc.text(line, x, cy);
        });
      }
    },
    didDrawPage: () => {
      const page = currentPage(doc);
      if (!ctx.headerPages.has(page)) drawContinuationHeader(ctx);
    }
  });

  return ((doc as any).lastAutoTable?.finalY as number) || startY + 20;
}

// ---------------------------------------------------------------------------
// 9. Daftar Bernomor, Baris Total & Kotak Catatan
// ---------------------------------------------------------------------------
/** Mengukur tinggi daftar bernomor tanpa menggambar. */
export function measureNumberedList(doc: jsPDF, items: string[], width: number, size = 6.9): number {
  setFont(doc, size, 'normal');
  return items.reduce((h, item) => h + wrap(doc, item, width - 4).length * 3 + 0.8, 0);
}

export function drawNumberedList(doc: jsPDF, x: number, y: number, width: number, items: string[], size = 6.9): number {
  let cy = y;
  items.forEach((item, idx) => {
    setFont(doc, size, 'bold', STP_COLORS.muted);
    doc.text(`${idx + 1}.`, x, cy);
    setFont(doc, size, 'normal', STP_COLORS.body);
    wrap(doc, item, width - 4).forEach((line, i) => {
      doc.text(line, x + 4, cy + i * 3);
    });
    cy += wrap(doc, item, width - 4).length * 3 + 0.8;
  });
  return cy;
}

export function drawTotalRow(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  options: { bold?: boolean; size?: number; color?: RGB; labelColor?: RGB } = {}
) {
  const size = options.size || 7.6;
  setFont(doc, size, options.bold ? 'bold' : 'normal', options.labelColor || STP_COLORS.muted);
  doc.text(truncate(doc, label, width * 0.58), x, y);
  setFont(doc, size, 'bold', options.color || STP_COLORS.text);
  doc.text(value, x + width, y, { align: 'right' });
}

/** Kotak hasil akhir (mis. "Sisa Pelunasan" / "LUNAS"). */
export function drawResultBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  tone: 'neutral' | 'success'
): number {
  const palette = tone === 'success' ? BADGE_TONES.success : { bg: STP_COLORS.panel, border: STP_COLORS.line, text: STP_COLORS.ink };
  setFill(doc, palette.bg);
  setStroke(doc, palette.border, 0.3);
  doc.roundedRect(x, y, width, 9, 1.5, 1.5, 'FD');
  setFont(doc, 6.3, 'bold', tone === 'success' ? palette.text : STP_COLORS.muted);
  doc.text(label.toUpperCase(), x + 3, y + 5.6);
  setFont(doc, 10, 'bold', palette.text);
  doc.text(value, x + width - 3, y + 6, { align: 'right' });
  return y + 9;
}

/** Catatan dengan garis vertikal di kiri (gaya "Catatan Tambahan" invoice). */
export function measureNote(doc: jsPDF, text: string, width: number): number {
  setFont(doc, 7, 'normal');
  return wrap(doc, text, width - 4).length * 3.1 + 1.5;
}

export function drawNote(doc: jsPDF, x: number, y: number, width: number, text: string): number {
  setFont(doc, 7, 'normal', STP_COLORS.body);
  const lines = wrap(doc, text, width - 4);
  const height = lines.length * 3.1 + 1.5;
  setStroke(doc, STP_COLORS.line, 0.6);
  doc.line(x + 0.3, y - 2.6, x + 0.3, y - 2.6 + height);
  lines.forEach((line, i) => doc.text(line, x + 3.2, y + i * 3.1));
  return y + height - 2.6;
}

// ---------------------------------------------------------------------------
// 10. Tanda Tangan & Stempel Dinas
// ---------------------------------------------------------------------------
/** Stempel bundar resmi (semi-transparan agar tidak menutupi nama). */
export function drawOfficialStamp(doc: jsPDF, cx: number, cy: number, caption: string) {
  withOpacity(doc, 0.78, () => {
    setStroke(doc, STP_COLORS.stamp, 0.6);
    doc.circle(cx, cy, 12.5, 'S');
    setStroke(doc, STP_COLORS.stamp, 0.25);
    doc.circle(cx, cy, 11.2, 'S');
    doc.line(cx - 9.2, cy - 4.3, cx + 9.2, cy - 4.3);
    doc.line(cx - 9.2, cy + 4.6, cx + 9.2, cy + 4.6);

    setFont(doc, 4.7, 'bold', STP_COLORS.stamp);
    doc.text('SOLO TECHNOPARK', cx, cy - 5.9, { align: 'center' });
    setFont(doc, 8, 'bold', STP_COLORS.stamp);
    doc.text('UPTD KST', cx, cy + 0.5, { align: 'center' });
    setFont(doc, 4.3, 'bold', STP_COLORS.stamp);
    doc.text(truncate(doc, caption.toUpperCase(), 17), cx, cy + 3.3, { align: 'center' });
    doc.text('KOTA SURAKARTA', cx, cy + 8.1, { align: 'center' });
  });
}

export interface SignatureColumn {
  caption: string;
  role: string;
  name?: string;
  sub?: string;
  stampCaption?: string;
}

export const SIGNATURE_BLOCK_HEIGHT = 50;

/** Blok tanda tangan multi-kolom. Tempat & tanggal berada di atas kolom terakhir. */
export function drawSignatureBlock(ctx: StpDocContext, y: number, placeDate: string, columns: SignatureColumn[]): number {
  const { doc } = ctx;
  y = ensureSpace(ctx, y, SIGNATURE_BLOCK_HEIGHT);
  const colWidth = STP_CONTENT_WIDTH / columns.length;
  const innerWidth = colWidth - 8;

  setFont(doc, 7.3, 'normal', STP_COLORS.body);
  doc.text(truncate(doc, placeDate, innerWidth), M + colWidth * (columns.length - 1) + colWidth / 2, y, {
    align: 'center'
  });
  const top = y + 4.6;

  columns.forEach((col, i) => {
    const cx = M + colWidth * i + colWidth / 2;
    setFont(doc, 7.3, 'normal', STP_COLORS.body);
    doc.text(truncate(doc, col.caption, innerWidth), cx, top, { align: 'center' });

    setFont(doc, 7.5, 'bold', STP_COLORS.ink);
    const roleLines = wrap(doc, col.role, innerWidth).slice(0, 2);
    roleLines.forEach((line, li) => doc.text(line, cx, top + 3.8 + li * 3.4, { align: 'center' }));

    const signTop = top + 11.5;
    if (col.stampCaption) drawOfficialStamp(doc, cx - 9, signTop + 9.5, col.stampCaption);

    let nameY = signTop + 22;
    if (col.name && col.name.trim()) {
      setFont(doc, 8, 'bold', STP_COLORS.ink);
      wrap(doc, col.name, innerWidth)
        .slice(0, 2)
        .forEach((line) => {
          const w = doc.getTextWidth(line);
          doc.text(line, cx, nameY, { align: 'center' });
          setStroke(doc, STP_COLORS.ink, 0.25);
          doc.line(cx - w / 2, nameY + 0.9, cx + w / 2, nameY + 0.9);
          nameY += 3.8;
        });
    } else {
      setFont(doc, 8, 'normal', STP_COLORS.faint);
      doc.text('( ...................................... )', cx, nameY, { align: 'center' });
      nameY += 3.8;
    }

    if (col.sub) {
      setFont(doc, 6.6, 'normal', STP_COLORS.muted);
      doc.text(truncate(doc, col.sub, innerWidth), cx, nameY + 0.2, { align: 'center' });
    }
  });

  return top + 11.5 + 22 + 12;
}

// ---------------------------------------------------------------------------
// 11. Footer Semua Halaman
// ---------------------------------------------------------------------------
export function finalizeStpDocument(
  ctx: StpDocContext,
  legalNote: string = 'Dokumen elektronik ini diterbitkan secara sah melalui Sistem Informasi Manajemen SINTESA BLUD Solo Technopark.'
) {
  const { doc } = ctx;
  const total = doc.getNumberOfPages();
  const printedAt = `${new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })} WIB`;
  const code = verificationCode(`${ctx.title}|${ctx.docNumber}`);

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    const lineY = STP_PAGE.contentBottom + 6;
    setStroke(doc, STP_COLORS.line, 0.3);
    doc.line(M, lineY, R, lineY);

    // Segel verifikasi (lingkaran + centang vektor)
    const sealX = M + 3.4;
    const sealY = lineY + 7;
    setStroke(doc, [16, 185, 129], 0.45);
    doc.circle(sealX, sealY, 3.2, 'S');
    doc.setLineWidth(0.6);
    doc.line(sealX - 1.5, sealY + 0.1, sealX - 0.4, sealY + 1.2);
    doc.line(sealX - 0.4, sealY + 1.2, sealX + 1.6, sealY - 1.2);

    const textX = M + 9;
    setFont(doc, 6.3, 'bold', STP_COLORS.ink);
    doc.text('DOKUMEN ELEKTRONIK SAH', textX, lineY + 5.2);
    setFont(doc, 5.8, 'normal', STP_COLORS.muted);
    wrap(doc, `${legalNote} Kode verifikasi: ${code}.`, 108)
      .slice(0, 2)
      .forEach((line, i) => doc.text(line, textX, lineY + 8.2 + i * 2.6));

    setFont(doc, 5.6, 'bold', STP_COLORS.faint);
    doc.text('DICETAK PADA', R, lineY + 4.8, { align: 'right' });
    setFont(doc, 7, 'bold', STP_COLORS.ink, 'courier');
    doc.text(printedAt, R, lineY + 8, { align: 'right' });
    setFont(doc, 5.8, 'normal', STP_COLORS.muted);
    doc.text(`Halaman ${page} dari ${total}`, R, lineY + 11, { align: 'right' });
  }
  doc.setPage(total);
}
