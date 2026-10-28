// Lokasi file: scripts/generate-sample-pdfs.ts
import fs from 'fs';
import path from 'path';
import { buildWorkOrderPdf } from '../src/lib/pdf/workOrderPdf';
import { buildDeliveryOrderPdf } from '../src/lib/pdf/deliveryOrderPdf';
import { ProductionOrder } from '../src/types/production.types';

const samplesDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Data Contoh 1: SPK Produksi CNC Machining 4-Axis
const sampleSpkOrder: ProductionOrder = {
  orderNumber: 'SPK/PROD/20261028/0101',
  clientName: 'PT Techno Presisi Indonesia',
  clientType: 'Industri',
  clientPic: 'Ir. Bambang Trihatmojo',
  clientPhone: '081234567890',
  clientEmail: 'bambang@technopresisi.co.id',
  clientAddress: 'Kawasan Industri Cikarang Blok B-12, Bekasi, Jawa Barat',
  projectTitle: 'Fabrikasi Fixture & Precision Tooling CNC 4-Axis',
  category: 'CNC_MACHINING',
  estimatedDurationDays: 14,
  targetDeliveryDate: '2026-11-12',
  actualDeliveryDate: null,
  status: 'IN_PRODUCTION',
  productionProgress: 65,
  assignedTechnician: 'Agus Santoso, S.T. (Senior Machinist STP)',
  workshopLocation: 'Workshop CNC & Bubut Gedung C Lantai 1 STP',
  totalCost: 18500000,
  dpRequired: true,
  dpPercentage: 40,
  dpAmount: 7400000,
  dpInvoiceId: 'inv-prod-dp-001',
  finalInvoiceId: null,
  paymentStatus: 'DP_PAID',
  items: [
    {
      id: 'item-1',
      partName: 'Base Plate Fixture ST52',
      material: 'Baja ST52',
      dimensions: '300x200x40mm',
      quantity: 2,
      unit: 'Set',
      unitPrice: 4500000,
      totalPrice: 9000000,
      notes: 'Toleransi presisi +/- 0.015mm, surface grinding finish'
    },
    {
      id: 'item-2',
      partName: 'Clamping Jaw Duralium 7075-T6',
      material: 'Dural 7075-T6 Aerospace Grade',
      dimensions: '120x50x30mm',
      quantity: 4,
      unit: 'Pcs',
      unitPrice: 1250000,
      totalPrice: 5000000,
      notes: 'Hard anodize clear coat'
    },
    {
      id: 'item-3',
      partName: 'Guide Pin Hardened Ground Steel',
      material: 'Baja SKD11 Hardened 58 HRC',
      dimensions: 'Diameter 20mm x 150mm',
      quantity: 6,
      unit: 'Pcs',
      unitPrice: 750000,
      totalPrice: 4500000,
      notes: 'Cylindrical grinding Ra 0.4'
    }
  ],
  blueprintFiles: [
    {
      id: 'cad-001',
      name: 'Drawing_Fixture_CNC_RevB.step',
      url: 'https://katalog.solotechnopark.id/docs/Drawing_Fixture_CNC_RevB.step',
      uploadedAt: Date.now(),
      size: 4580000
    }
  ],
  workNotes: [
    {
      id: 'log-1',
      date: '2026-10-25',
      percentage: 25,
      note: 'Penerimaan material ST52 & Duralium. Verifikasi dimensi potong dan facing awal.',
      author: 'Agus Santoso'
    },
    {
      id: 'log-2',
      date: '2026-10-27',
      percentage: 45,
      note: 'Roughing milling CNC 4-axis selesai pada 2 unit base plate. Datum hole terbentuk.',
      author: 'Agus Santoso'
    },
    {
      id: 'log-3',
      date: '2026-10-28',
      percentage: 65,
      note: 'Finishing kontur duralium 7075. Toleransi aman, lanjut pengerjaan pin guide.',
      author: 'Agus Santoso'
    }
  ],
  deliveryOrder: null,
  notes: 'Pekerjaan prioritas tinggi, klien membutuhkan untuk setup jalur produksi baru pabrik otomotif.',
  createdAt: Date.now()
};

// Data Contoh 2: Surat Jalan Pengiriman (Delivery Order) Fabrikasi Mesin
const sampleDoOrder: ProductionOrder = {
  orderNumber: 'SPK/PROD/20261025/0088',
  clientName: 'CV Rekayasa Logam Surakarta',
  clientType: 'UMKM',
  clientPic: 'Budi Prasetyo',
  clientPhone: '085712345678',
  clientEmail: 'budi@rekayasalogam.id',
  clientAddress: 'Jl. Slamet Riyadi No. 412, Laweyan, Surakarta',
  projectTitle: 'Fabrikasi Rangka Mesin Sortir Kopi Otomatis',
  category: 'FABRIKASI_LAS',
  estimatedDurationDays: 8,
  targetDeliveryDate: '2026-10-27',
  actualDeliveryDate: '2026-10-28',
  status: 'DELIVERED',
  productionProgress: 100,
  assignedTechnician: 'Wawan Setiawan (Lead Fabricator)',
  workshopLocation: 'Bengkel Fabrikasi & Las Gedung D STP',
  totalCost: 12000000,
  dpRequired: true,
  dpPercentage: 50,
  dpAmount: 6000000,
  dpInvoiceId: 'inv-prod-dp-002',
  finalInvoiceId: 'inv-prod-lunas-002',
  paymentStatus: 'FULL_PAID',
  items: [
    {
      id: 'item-201',
      partName: 'Rangka Utama Mesin Hollow SS304',
      material: 'Stainless Steel 304 (40x40x2mm)',
      dimensions: '1500x800x1200mm',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 7500000,
      totalPrice: 7500000,
      notes: 'Pengelasan TIG argon rapi, hairline finish'
    },
    {
      id: 'item-202',
      partName: 'Hopper Input Corong Biji Kopi',
      material: 'Plat Stainless Steel Food Grade 304 2mm',
      dimensions: '600x500x400mm',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 3000000,
      totalPrice: 3000000,
      notes: 'Bending presisi & poles foodgrade'
    },
    {
      id: 'item-203',
      partName: 'Bracket Motor Penggerak & Transmisi',
      material: 'Baja Siku 50x50x5mm',
      dimensions: '400x300mm',
      quantity: 1,
      unit: 'Set',
      unitPrice: 1500000,
      totalPrice: 1500000,
      notes: 'Powder coating industrial grey'
    }
  ],
  blueprintFiles: [],
  workNotes: [],
  deliveryOrder: {
    deliveryOrderNumber: 'SJ/PROD/20261028/0002',
    deliveryDate: '2026-10-28',
    driverOrExpedition: 'Armada Logistik Solo Technopark',
    vehicleNumber: 'AD 8124 TA',
    recipientName: 'Budi Prasetyo (Direktur CV Rekayasa Logam)',
    recipientPhone: '085712345678',
    deliveryNotes: 'Barang telah diinspeksi lolos QC, dipacking rapi dengan bubble wrap tebal dan proteksi sudut kayu. Diterima dalam kondisi sempurna oleh pemesan.',
    createdAt: Date.now()
  },
  notes: 'Selesai dan terkirim dengan dokumen Surat Jalan resmi.',
  createdAt: Date.now()
};

async function main() {
  console.log('📄 Menghasilkan Dokumen PDF Murni Vektor Resmi Solo Technopark...');

  // Muat Logo Solo Technopark dari public/logo.png
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  let logoBase64: string | undefined = undefined;
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    console.log(`  ✓ Logo resmi dimuat dari: ${logoPath}`);
  }

  // 1. Generate SPK Produksi PDF
  const spkPdf = buildWorkOrderPdf({ order: sampleSpkOrder, logoBase64 });
  const spkBuffer = Buffer.from(spkPdf.output('arraybuffer'));
  const spkPath = path.join(samplesDir, 'SPK_Manufaktur_Resmi_STP.pdf');
  fs.writeFileSync(spkPath, spkBuffer);
  console.log(`  ✓ SPK Resmi berhasil disimpan ke: ${spkPath} (${spkBuffer.length} bytes)`);

  // 2. Generate Surat Jalan (Delivery Order) PDF
  const doPdf = buildDeliveryOrderPdf({ order: sampleDoOrder, logoBase64 });
  const doBuffer = Buffer.from(doPdf.output('arraybuffer'));
  const doPath = path.join(samplesDir, 'Surat_Jalan_Resmi_STP.pdf');
  fs.writeFileSync(doPath, doBuffer);
  console.log(`  ✓ Surat Jalan Resmi berhasil disimpan ke: ${doPath} (${doBuffer.length} bytes)`);

  console.log('\n✨ Pembuatan sampel dokumen PDF vektor resmi rampung!');
}

main().catch(console.error);
