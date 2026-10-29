import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { marked } from 'marked';

async function generateAllRoleGuidesPdf() {
  const panduanDir = path.resolve('public/panduan');
  const pdfOutputDir = path.resolve('public/panduan/pdf');

  if (!fs.existsSync(pdfOutputDir)) {
    fs.mkdirSync(pdfOutputDir, { recursive: true });
  }

  // 1. Dapatkan daftar seluruh berkas panduan .md (00 sampai 12)
  const mdFiles = fs.readdirSync(panduanDir)
    .filter(file => file.endsWith('.md') && /^\d{2}-/.test(file))
    .sort();

  console.log(`🚀 Memulai pembuatan PDF untuk ${mdFiles.length} berkas panduan di ${panduanDir}...\n`);

  // 2. Siapkan logo Solo Technopark sebagai Base64
  let logoBase64 = '';
  const logoStpPath = path.resolve('public/logo-stp.png');
  const logoAltPath = path.resolve('public/logo.png');
  const chosenLogoPath = fs.existsSync(logoStpPath) ? logoStpPath : (fs.existsSync(logoAltPath) ? logoAltPath : null);

  if (chosenLogoPath) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(chosenLogoPath).toString('base64')}`;
    console.log(`  ✓ Menggunakan logo: ${chosenLogoPath}`);
  }

  // 3. Tentukan path browser headless (Edge atau Chrome)
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserExe = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

  if (!browserExe) {
    throw new Error('Tidak ditemukan Microsoft Edge atau Google Chrome untuk mencetak PDF!');
  }
  console.log(`  ✓ Browser Headless: ${browserExe}\n`);

  const results: { file: string; pdfName: string; size: number }[] = [];

  for (let i = 0; i < mdFiles.length; i++) {
    const mdFileName = mdFiles[i];
    const mdFilePath = path.join(panduanDir, mdFileName);
    const pdfFileName = mdFileName.replace(/\.md$/, '.pdf');
    const pdfFilePath = path.join(pdfOutputDir, pdfFileName);
    const tempHtmlPath = path.join(pdfOutputDir, `temp_${mdFileName}.html`);

    console.log(`[${i + 1}/${mdFiles.length}] 📖 Memproses: ${mdFileName} -> ${pdfFileName}`);

    const rawContent = fs.readFileSync(mdFilePath, 'utf8');

    // Ekstrak judul utama (Heading #)
    let docTitle = 'Panduan Operasional Solo Technopark';
    let docSubtitle = 'Sistem Informasi Manajemen Terpadu SINTESA';
    const titleMatch = rawContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      docTitle = titleMatch[1].replace(/^[^\w\s]+/, '').trim();
    }
    const subtitleMatch = rawContent.match(/^##\s+(.+)$/m);
    if (subtitleMatch) {
      docSubtitle = subtitleMatch[1].replace(/^[^\w\s]+/, '').trim();
    }

    let markdownBody = rawContent;

    // Pre-process GitHub Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
    markdownBody = markdownBody.replace(
      /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gi,
      (_match, alertType, content) => {
        const type = alertType.toUpperCase();
        const cleanContent = content
          .split('\n')
          .map((line: string) => line.replace(/^>\s?/, ''))
          .join('\n');
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

    // Konversi Markdown ke HTML via marked
    let parsedHtml = await marked.parse(markdownBody);

    // Transformasi blok mermaid agar dirender menjadi diagram grafis
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

    // Template HTML Bergaya Enterprise Document A4
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
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
    /* CSS GitHub & Enterprise SOP Compact Export */
    @page {
      size: A4;
      margin: 14mm 16mm 16mm 16mm;
      @bottom-right {
        content: counter(page);
        font-size: 8.5pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }

    /* Header Dokumen Dinas Resmi */
    .document-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 20px;
      border-bottom: 2px solid #cbd5e1;
    }

    .doc-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .doc-brand img {
      height: 44px;
      width: auto;
      object-fit: contain;
    }

    .doc-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }

    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 12px;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 18px;
      margin-bottom: 8px;
      font-weight: 700;
      line-height: 1.3;
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 16pt;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      margin-top: 10px;
      color: #1e3a8a;
    }

    h2 {
      font-size: 13pt;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      margin-top: 18px;
      color: #0f172a;
    }

    h3 {
      font-size: 11pt;
      margin-top: 14px;
      color: #1e40af;
    }

    h4 {
      font-size: 10pt;
      color: #334155;
    }

    p {
      margin-top: 0;
      margin-bottom: 8px;
    }

    a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    /* Blockquotes */
    blockquote {
      margin: 8px 0;
      padding: 6px 12px;
      color: #475569;
      background-color: #f8fafc;
      border-left: 3px solid #3b82f6;
      border-radius: 0 4px 4px 0;
      font-size: 9.5pt;
    }

    /* GitHub Alert Callouts */
    .markdown-alert {
      padding: 8px 14px;
      margin: 10px 0;
      border-left: 4px solid #cbd5e1;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .markdown-alert-title {
      font-weight: 700;
      font-size: 9pt;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .markdown-alert-content {
      font-size: 9.5pt;
      margin-top: 2px;
    }

    .markdown-alert-content p:last-child {
      margin-bottom: 0;
    }

    .markdown-alert-note {
      border-left-color: #2563eb;
      background-color: #eff6ff;
      color: #1e40af;
    }
    .markdown-alert-note .markdown-alert-content { color: #1e293b; }

    .markdown-alert-tip {
      border-left-color: #16a34a;
      background-color: #f0fdf4;
      color: #15803d;
    }
    .markdown-alert-tip .markdown-alert-content { color: #1e293b; }

    .markdown-alert-important {
      border-left-color: #9333ea;
      background-color: #faf5ff;
      color: #7e22ce;
    }
    .markdown-alert-important .markdown-alert-content { color: #1e293b; }

    .markdown-alert-warning {
      border-left-color: #d97706;
      background-color: #fffbeb;
      color: #b45309;
    }
    .markdown-alert-warning .markdown-alert-content { color: #1e293b; }

    .markdown-alert-caution {
      border-left-color: #dc2626;
      background-color: #fef2f2;
      color: #b91c1c;
    }
    .markdown-alert-caution .markdown-alert-content { color: #1e293b; }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table th, table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }

    table th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }

    table tr:nth-child(2n) {
      background-color: #f8fafc;
    }

    /* Code & Pre */
    code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
      font-size: 88%;
      background-color: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f172a;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 8.5pt;
      line-height: 1.45;
      margin: 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      color: inherit;
    }

    /* Mermaid Diagrams */
    pre.mermaid {
      background-color: #f8fafc;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin: 12px 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 8px;
      padding-left: 18px;
    }

    li {
      margin-bottom: 3px;
    }

    /* Footer Cetak */
    .document-footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Header Dokumen Instansi -->
  <div class="document-header">
    <div class="doc-brand">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Solo Technopark" />` : ''}
      <div>
        <div style="font-weight: 800; font-size: 11pt; color: #0f172a; letter-spacing: 0.5px;">BLUD SOLO TECHNOPARK</div>
        <div style="font-size: 8pt; color: #475569; font-weight: 500;">Sistem Informasi Manajemen Terpadu SINTESA</div>
      </div>
    </div>
    <div class="doc-meta">
      <div style="font-weight: 700; color: #1e40af; font-size: 9pt;">${docTitle}</div>
      <div style="font-size: 7.5pt; color: #64748b;">Edisi: Oktober 2026 • Versi 1.0</div>
      <div><span class="badge-status">Buku Panduan Resmi</span></div>
    </div>
  </div>

  <!-- Konten Panduan -->
  <div class="markdown-body">
    ${parsedHtml}
  </div>

  <!-- Footer Pengesahan -->
  <div class="document-footer">
    <div>Unit Tata Kelola & Tata Usaha BLUD Solo Technopark • Dokumen Panduan Operasional SINTESA</div>
    <div>Dicetak Secara Elektronik • Hak Cipta Dilindungi Undang-Undang</div>
  </div>
</body>
</html>`;

    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

    // Parameter cetak headless Edge/Chrome
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=6000',
      `--print-to-pdf=${pdfFilePath}`,
      tempHtmlPath
    ];

    try {
      execFileSync(browserExe, args, { stdio: 'pipe' });
      const stat = fs.statSync(pdfFilePath);
      results.push({ file: mdFileName, pdfName: pdfFileName, size: stat.size });
      console.log(`  ✓ Berhasil: ${pdfFileName} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (printErr: any) {
      console.error(`  ❌ Gagal mencetak ${pdfFileName}:`, printErr.message);
    } finally {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    }
  }

  console.log(`\n🎉 SELESAI! Seluruh ${results.length} berkas PDF berhasil dihasilkan di:`);
  console.log(`📁 ${pdfOutputDir}\n`);
  console.table(results);
}

generateAllRoleGuidesPdf().catch(err => {
  console.error('❌ Error eksekusi generator PDF:', err);
  process.exit(1);
});

