// Lokasi file: scripts/generate-flowchart-pdf.ts
import fs from 'fs';
import path from 'path';
import { buildBillingFlowchartPdf } from '../src/lib/pdf/billingFlowchartPdf';

const samplesDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

async function run() {
  console.log('📄 Menghasilkan Dokumen PDF Flowchart Alur Invoice Lintas Divisi STP...');

  // Muat logo resmi
  let logoBase64: string | null = null;
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    console.log(`  ✓ Logo resmi dimuat dari: ${logoPath}`);
  }

  // Generate Dokumen PDF Flowchart Bahan Rapat
  const pdfDoc = buildBillingFlowchartPdf({
    logoBase64,
    generatedDate: '28 Oktober 2026',
    authorName: 'Tim Sinergi Keuangan & IT BLUD Solo Technopark'
  });

  const pdfOutput = path.join(samplesDir, 'Flowchart_Proses_Invoice_Billing_STP.pdf');
  const buffer = Buffer.from(pdfDoc.output('arraybuffer'));
  fs.writeFileSync(pdfOutput, buffer);
  console.log(`  ✓ Dokumen PDF Flowchart tersimpan di: ${pdfOutput} (${buffer.length} bytes)`);

  console.log('\n✨ Pembuatan dokumen PDF Flowchart Bahan Rapat berhasil!');
}

run().catch((err) => {
  console.error('❌ Gagal menghasilkan PDF Flowchart:', err);
  process.exit(1);
});
