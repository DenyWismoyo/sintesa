import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { marked } from 'marked';

async function generateMarkdownPdf() {
  const mdPath = path.resolve('public/docs/panduan-alur-billing-dan-keuangan-lintas-divisi.md');
  const outputPdfPath = path.resolve('public/docs/panduan-alur-billing-dan-keuangan-lintas-divisi.pdf');
  const samplePdfPath = path.resolve('public/samples/Panduan_Billing_Keuangan_STP.pdf');
  const tempHtmlPath = path.resolve('public/docs/temp_markdown_print.html');

  console.log('📖 Membaca file Markdown:', mdPath);
  const rawContent = fs.readFileSync(mdPath, 'utf8');

  // 1. Ekstrak Frontmatter (YAML metadata di atas)
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

  // 2. Pre-process GitHub Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
  markdownBody = markdownBody.replace(
    /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gi,
    (match, alertType, content) => {
      const type = alertType.toUpperCase();
      const cleanContent = content
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, ''))
        .join('\n')
      const iconMap: Record<string, string> = {
        NOTE: 'ℹ️',
        TIP: '💡',
        IMPORTANT: '🟣',
        WARNING: '⚠️',
        CAUTION: '🛑'
      };
      const icon = iconMap[type] || 'ℹ️';

      return `<div class="markdown-alert markdown-alert-${type.toLowerCase()}">
  <div class="markdown-alert-title"><span class="alert-icon">${icon}</span> ${type}</div>
  <div class="markdown-alert-content">\n\n${cleanContent}\n\n</div>
</div>\n\n`;
    }
  );

  // 3. Konversi Markdown ke HTML via marked
  let parsedHtml = await marked.parse(markdownBody);

  // 3.1 Transformasi blok mermaid agar dirender menjadi diagram vektor visual
  parsedHtml = parsedHtml.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,
    (_match, code) => {
      const unescaped = code
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<pre class="mermaid">\n${unescaped.trim()}\n</pre>`;
    }
  );

  // 4. Logo Base64
  let logoBase64 = '';
  const logoPath = path.resolve('public/logo.png');
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }

  // 5. Template HTML Bergaya GitHub Markdown CSS (Compact A4 Export)
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${frontmatter.title || 'Panduan Billing & Keuangan Lintas Divisi'}</title>
  <!-- Mermaid.js untuk diagram grafis -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true, showSequenceNumbers: true }
    });
  </script>
  <style>
    /* CSS GitHub Markdown Compact Export */
    @page {
      size: A4;
      margin: 14mm 16mm 16mm 16mm;
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2328;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }

    /* Header Dokumen Dinas GitHub Style */
    .document-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 18px;
      border-bottom: 2px solid #d0d7de;
    }

    .doc-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .doc-brand img {
      height: 38px;
      width: auto;
    }

    .doc-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #656d76;
    }

    .badge-status {
      display: inline-block;
      padding: 2px 7px;
      font-size: 7.5pt;
      font-weight: 600;
      border-radius: 12px;
      background-color: #ddf4ff;
      color: #0969da;
      border: 1px solid #54aeff;
      margin-top: 3px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 18px;
      margin-bottom: 10px;
      font-weight: 600;
      line-height: 1.25;
      color: #1f2328;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #d0d7de;
      margin-top: 22px;
    }

    h2 {
      font-size: 14pt;
      padding-bottom: 0.25em;
      border-bottom: 1px solid #d0d7de;
      margin-top: 18px;
    }

    h3 {
      font-size: 12pt;
      margin-top: 14px;
    }

    h4 {
      font-size: 11pt;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
    }

    a {
      color: #0969da;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Blockquotes */
    blockquote {
      margin: 10px 0;
      padding: 0 1em;
      color: #57606a;
      border-left: 0.25em solid #d0d7de;
      font-size: 10pt;
    }

    /* GitHub Alert Callouts */
    .markdown-alert {
      padding: 8px 14px;
      margin: 12px 0;
      border-left: 4px solid #d0d7de;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .markdown-alert-title {
      font-weight: 700;
      font-size: 9.5pt;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .markdown-alert-content {
      font-size: 10pt;
      margin-top: 2px;
    }

    .markdown-alert-content p:last-child {
      margin-bottom: 0;
    }

    .markdown-alert-note {
      border-left-color: #0969da;
      background-color: #f0f8ff;
      color: #0969da;
    }
    .markdown-alert-note .markdown-alert-content { color: #1f2328; }

    .markdown-alert-tip {
      border-left-color: #1a7f37;
      background-color: #dafbe1;
      color: #1a7f37;
    }
    .markdown-alert-tip .markdown-alert-content { color: #1f2328; }

    .markdown-alert-important {
      border-left-color: #8250df;
      background-color: #fbefff;
      color: #8250df;
    }
    .markdown-alert-important .markdown-alert-content { color: #1f2328; }

    .markdown-alert-warning {
      border-left-color: #9a6700;
      background-color: #fff8c5;
      color: #9a6700;
    }
    .markdown-alert-warning .markdown-alert-content { color: #1f2328; }

    .markdown-alert-caution {
      border-left-color: #cf222e;
      background-color: #ffebe9;
      color: #cf222e;
    }
    .markdown-alert-caution .markdown-alert-content { color: #1f2328; }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table th, table td {
      border: 1px solid #d0d7de;
      padding: 6px 10px;
      text-align: left;
    }

    table th {
      background-color: #f6f8fa;
      font-weight: 600;
      color: #1f2328;
    }

    table tr:nth-child(2n) {
      background-color: #fcfcfc;
    }

    /* Code & Pre */
    code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 88%;
      background-color: rgba(175, 184, 193, 0.2);
      padding: 0.18em 0.38em;
      border-radius: 4px;
    }

    pre {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 9pt;
      line-height: 1.45;
      background-color: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 10px 14px;
      overflow-x: auto;
      margin: 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 100%;
      border-radius: 0;
    }

    /* Mermaid Container */
    .mermaid {
      background-color: #fbfcfd;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 12px;
      margin: 14px 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3px;
    }

    li > p {
      margin-bottom: 4px;
    }

    /* Horizontal Rule */
    hr {
      height: 2px;
      background-color: #d0d7de;
      border: none;
      margin: 18px 0;
    }

    /* Footer Cetak */
    .document-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #d0d7de;
      font-size: 8pt;
      color: #656d76;
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
        <div style="font-weight: 700; font-size: 11pt; color: #1f2328;">BLUD SOLO TECHNOPARK</div>
        <div style="font-size: 8.5pt; color: #57606a;">Sistem Informasi Manajemen Terpadu SINTESA</div>
      </div>
    </div>
    <div class="doc-meta">
      <div>Versi: <strong>${frontmatter.version || '2.5.0-Enterprise'}</strong></div>
      <div>Tanggal: ${frontmatter.date || '2026-10-28'}</div>
      <div><span class="badge-status">Official SOP Guide</span></div>
    </div>
  </div>

  <!-- Konten Markdown yang Dikonversi -->
  <div class="markdown-body">
    ${parsedHtml}
  </div>

  <!-- Footer Pengesahan -->
  <div class="document-footer">
    <div>Unit Keuangan & Tata Kelola Sistem Informasi BLUD Solo Technopark</div>
    <div>Dokumen Elektronik Sah SINTESA — Ekspor PDF Berstandar GitHub Markdown</div>
  </div>
</body>
</html>`;

  // Tulis file HTML sementara
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');
  console.log('  ✓ Template HTML GitHub Markdown berhasil dibuat di:', tempHtmlPath);

  // 6. Jalankan Headless Edge untuk Export ke PDF
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserExe = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

  if (!browserExe) {
    throw new Error('Tidak ditemukan Microsoft Edge atau Google Chrome pada sistem!');
  }

  console.log('🚀 Menjalankan Headless Browser:', browserExe);

  // Parameter export PDF compact
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=6000',
    `--print-to-pdf=${outputPdfPath}`,
    tempHtmlPath
  ];

  execFileSync(browserExe, args, { stdio: 'inherit' });

  // Salin juga ke public/samples untuk ketersediaan sampel
  fs.copyFileSync(outputPdfPath, samplePdfPath);

  // Hapus HTML sementara
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }

  const stat = fs.statSync(outputPdfPath);
  console.log(`✨ Dokumen PDF Berhasil Dihasilkan!`);
  console.log(`  📄 Output Utama: ${outputPdfPath} (${stat.size} bytes)`);
  console.log(`  📄 Sampel Unduh: ${samplePdfPath}`);
}

generateMarkdownPdf().catch(err => {
  console.error('❌ Gagal menghasilkan PDF dari Markdown:', err);
  process.exit(1);
});
