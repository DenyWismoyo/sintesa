import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { marked } from 'marked';

async function generateTechnoparkInvoicePdf() {
  const mdPath = path.resolve('public/docs/invoice-pengembangan-sintesa-stp.md');
  const tempHtmlPath = path.resolve('public/docs/temp_invoice_print.html');

  // Target paths
  const outputPdf1 = path.resolve('public/docs/Invoice-Pengembangan-SINTESA-Solo-Technopark.pdf');
  const paymentHubRoot1 = 'D:\\Project\\GAWE\\Payment SOSO Creative Hub\\Invoice-dan-Berita-Acara-Pengembangan-SINTESA-Solo-Technopark.pdf';
  const paymentHubRoot2 = 'D:\\Project\\GAWE\\Payment SOSO Creative Hub\\Invoice-Technopark-Surakarta-Lengkap.pdf';
  const paymentHubSub = 'D:\\Project\\GAWE\\Payment SOSO Creative Hub\\payment-hub\\Invoice-Technopark-Surakarta-Lengkap.pdf';

  console.log('📖 Membaca file Markdown:', mdPath);
  const rawContent = fs.readFileSync(mdPath, 'utf8');

  // 1. Ekstrak Frontmatter
  let frontmatter: Record<string, string> = {};
  let markdownBody = rawContent;

  if (rawContent.startsWith('---')) {
    const endFmIndex = rawContent.indexOf('---', 3);
    if (endFmIndex !== -1) {
      const fmText = rawContent.slice(3, endFmIndex).trim();
      markdownBody = rawContent.slice(endFmIndex + 3).trim();

      fmText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const val = line.slice(colonIndex + 1).trim();
          frontmatter[key] = val;
        }
      });
    }
  }

  // 2. Pre-process LaTeX Math to styled HTML
  markdownBody = markdownBody.replace(
    /\$\$\\mathbf\{([^}]+)\}\$\$/g,
    '<div class="math-hero">$1</div>'
  );
  markdownBody = markdownBody.replace(
    /\$\$(.*?)\$\$/gs,
    '<div class="math-block">$1</div>'
  );

  // 3. Konversi Markdown ke HTML via marked
  let parsedHtml = await marked.parse(markdownBody);

  // 4. Logo Base64
  let logoBase64 = '';
  const logoPath = path.resolve('public/logo.png');
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }

  // 5. Template HTML Bergaya Dokumen Resmi Penagihan & Kontrak BLUD
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${frontmatter.title || 'Invoice & BAST Pengembangan SINTESA STP'}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 18mm 18mm 18mm;
      @bottom-right {
        content: counter(page);
        font-size: 8.5pt;
        color: #57606a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1f2328;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }

    /* Header Dokumen Dinas */
    .document-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 20px;
      border-bottom: 2.5px solid #0969da;
    }

    .doc-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .doc-brand img {
      height: 42px;
      width: auto;
    }

    .doc-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #656d76;
    }

    .badge-status {
      display: inline-block;
      padding: 3px 8px;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 12px;
      background-color: #ddf4ff;
      color: #0969da;
      border: 1px solid #54aeff;
      margin-top: 4px;
    }

    /* Headings */
    h1, h2, h3, h4 {
      font-weight: 700;
      line-height: 1.25;
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 16pt;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #cbd5e1;
      margin-top: 18px;
      margin-bottom: 12px;
      color: #0969da;
    }

    h2 {
      font-size: 12.5pt;
      padding-bottom: 0.25em;
      border-bottom: 1px solid #e2e8f0;
      margin-top: 18px;
      margin-bottom: 10px;
    }

    h3 {
      font-size: 11pt;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-top: 0;
      margin-bottom: 9px;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table th, table td {
      padding: 7px 10px;
      border: 1px solid #d0d7de;
    }

    table th {
      background-color: #f6f8fa;
      font-weight: 700;
      color: #24292f;
      text-align: left;
    }

    table tr:nth-child(even) td {
      background-color: #fbfcfd;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Math Hero Box */
    .math-hero {
      background-color: #f0fdf4;
      border: 1.5px solid #86efac;
      color: #166534;
      font-size: 13pt;
      font-weight: 800;
      text-align: center;
      padding: 10px;
      border-radius: 6px;
      margin: 12px 0 16px 0;
      letter-spacing: 0.5px;
    }

    .math-block {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px;
      text-align: center;
      margin: 10px 0;
      border-radius: 4px;
      font-weight: 700;
    }

    /* Footer Cetak */
    .document-footer {
      margin-top: 35px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 8pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Header Instansi -->
  <div class="document-header">
    <div class="doc-brand">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Solo Technopark" />` : ''}
      <div>
        <div style="font-weight: 800; font-size: 12pt; color: #0969da; letter-spacing: 0.5px;">BLUD SOLO TECHNOPARK</div>
        <div style="font-size: 9pt; color: #475569;">Kawasan Sains dan Teknologi Kota Surakarta</div>
      </div>
    </div>
    <div class="doc-meta">
      <div>No. Ref: <strong>${frontmatter.invoice_number || 'INV/DEV-SINTESA/STP/2026/10-001'}</strong></div>
      <div>Tanggal: <strong>${frontmatter.invoice_date || '30 Oktober 2026'}</strong></div>
      <div><span class="badge-status">Official Invoice & BAST</span></div>
    </div>
  </div>

  <!-- Konten Markdown -->
  <div class="markdown-body">
    ${parsedHtml}
  </div>

  <!-- Footer Pengesahan -->
  <div class="document-footer">
    <div>UPTD Kawasan Sains dan Teknologi Solo Technopark — Pemkot Surakarta</div>
    <div>Sistem Informasi Kawasan Terpadu (SINTESA) — Dokumen Penagihan Resmi</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');
  console.log('  ✓ Template HTML berhasil dibuat di:', tempHtmlPath);

  // 6. Jalankan Headless Browser untuk cetak ke PDF
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserExe = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

  if (!browserExe) {
    throw new Error('Tidak ditemukan Microsoft Edge atau Google Chrome!');
  }

  console.log('🚀 Menjalankan Headless Browser:', browserExe);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=6000',
    `--print-to-pdf=${outputPdf1}`,
    tempHtmlPath
  ];

  execFileSync(browserExe, args, { stdio: 'inherit' });

  // Salin ke direktori workspace target
  fs.copyFileSync(outputPdf1, paymentHubRoot1);
  fs.copyFileSync(outputPdf1, paymentHubRoot2);
  fs.copyFileSync(outputPdf1, paymentHubSub);

  // Hapus HTML sementara
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }

  const stat = fs.statSync(outputPdf1);
  console.log(`\n🎉 PDF BERHASIL DIGENERATE!`);
  console.log(`  📄 Output Teknopark  : ${outputPdf1} (${stat.size} bytes)`);
  console.log(`  📄 Output GAWE Root 1: ${paymentHubRoot1}`);
  console.log(`  📄 Output GAWE Root 2: ${paymentHubRoot2}`);
  console.log(`  📄 Output Payment Hub: ${paymentHubSub}`);
}

generateTechnoparkInvoicePdf().catch(err => {
  console.error('❌ Gagal menghasilkan PDF:', err);
  process.exit(1);
});

