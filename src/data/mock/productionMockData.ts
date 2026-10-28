// Lokasi file: src/data/mock/productionMockData.ts
import { ProductionOrder } from '@/types/production.types';

export const MOCK_PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: 'prod-order-001',
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
        uploadedAt: 1730000000000,
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
    createdAt: 1730000000000 - 86400000 * 3,
    updatedAt: 1730000000000
  },
  {
    id: 'prod-order-002',
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
    workNotes: [
      {
        id: 'log-201',
        date: '2026-10-26',
        percentage: 50,
        note: 'Perakitan rangka hollow SS304 selesai dilas TIG argon.',
        author: 'Wawan Setiawan'
      },
      {
        id: 'log-202',
        date: '2026-10-27',
        percentage: 100,
        note: 'Inspeksi QC dimensi dan uji getaran motor selesai. Lolos uji mutu dan siap kirim.',
        author: 'Wawan Setiawan'
      }
    ],
    deliveryOrder: {
      deliveryOrderNumber: 'SJ/PROD/20261028/0002',
      deliveryDate: '2026-10-28',
      driverOrExpedition: 'Armada Logistik Solo Technopark',
      vehicleNumber: 'AD 8124 TA',
      recipientName: 'Budi Prasetyo (Direktur CV Rekayasa Logam)',
      recipientPhone: '085712345678',
      deliveryNotes: 'Barang telah diinspeksi QC, dipacking rapi dengan bubble wrap dan proteksi sudut kayu. Diterima dalam kondisi sempurna.',
      createdAt: 1730000000000
    },
    notes: 'Selesai dan terkirim dengan dokumen Surat Jalan resmi.',
    createdAt: 1730000000000 - 86400000 * 5,
    updatedAt: 1730000000000
  },
  {
    id: 'prod-order-003',
    orderNumber: 'SPK/PROD/20261028/0103',
    clientName: 'PT AgriTech Solusi Mandiri (Tenant Inkubator)',
    clientType: 'Internal_STP',
    clientPic: 'Dr. Satria Wibawa',
    clientPhone: '081198765432',
    clientEmail: 'satria@agritech-stp.com',
    clientAddress: 'Gedung Inkubator Bisnis Lantai 2 Unit 204 STP',
    projectTitle: 'Enclosure Prototipe Sensor Cuaca & Soil Monitoring IoT',
    category: '3D_PRINTING',
    estimatedDurationDays: 4,
    targetDeliveryDate: '2026-11-01',
    actualDeliveryDate: null,
    status: 'QUALITY_CONTROL',
    productionProgress: 100,
    assignedTechnician: 'Fajar Hidayat (Lab Prototyping STP)',
    workshopLocation: 'Laboratorium Desain & 3D Printing Gedung B STP',
    totalCost: 4500000,
    dpRequired: false,
    dpPercentage: 0,
    dpAmount: 0,
    finalInvoiceId: 'inv-prod-lunas-003',
    paymentStatus: 'UNPAID',
    items: [
      {
        id: 'item-301',
        partName: 'Casing Weatherproof PETG Carbon Fiber',
        material: 'PETG Carbon Fiber Reinforced (Waterproof IP66)',
        dimensions: '180x120x80mm',
        quantity: 5,
        unit: 'Set',
        unitPrice: 600000,
        totalPrice: 3000000,
        notes: 'Layer height 0.16mm, infill 60%, heat-insert brass M3'
      },
      {
        id: 'item-302',
        partName: 'Mounting Bracket Solar Panel SLA Resin',
        material: 'Tough Resin High-Temp 85°C',
        dimensions: '80x50x40mm',
        quantity: 5,
        unit: 'Set',
        unitPrice: 300000,
        totalPrice: 1500000,
        notes: 'UV cured post-processing'
      }
    ],
    blueprintFiles: [],
    workNotes: [
      {
        id: 'log-301',
        date: '2026-10-28',
        percentage: 100,
        note: 'Pencetakan 5 unit casing dan mounting bracket tuntas. Sedang proses inspeksi fitment PCB.',
        author: 'Fajar Hidayat'
      }
    ],
    deliveryOrder: null,
    notes: 'Produk inovasi tenant untuk pameran Hannover Messe & pilot project pertanian.',
    createdAt: 1730000000000 - 86400000,
    updatedAt: 1730000000000
  },
  {
    id: 'prod-order-004',
    orderNumber: 'SPK/PROD/20261028/0104',
    clientName: 'Politeknik Negeri Semesta Surakarta',
    clientType: 'Instansi',
    clientPic: 'Bagus Wicaksono, M.T.',
    clientPhone: '081298877665',
    clientEmail: 'bagus@poltek-semesta.ac.id',
    clientAddress: 'Kampus Terpadu Jebres, Surakarta',
    projectTitle: 'Engineering CAD 3D Design & Mold Injeksi Plastik',
    category: 'CAD_DESIGN',
    estimatedDurationDays: 10,
    targetDeliveryDate: '2026-11-18',
    actualDeliveryDate: null,
    status: 'VALIDATION',
    productionProgress: 15,
    assignedTechnician: 'Rian Pratama (CAD/CAM Specialist STP)',
    workshopLocation: 'Design & Engineering Center Gedung B STP',
    totalCost: 8000000,
    dpRequired: true,
    dpPercentage: 30,
    dpAmount: 2400000,
    dpInvoiceId: null,
    finalInvoiceId: null,
    paymentStatus: 'UNPAID',
    items: [
      {
        id: 'item-401',
        partName: 'Desain 3D CAD Mold Core & Cavity 2-Plates',
        material: 'Digital Engineering Output (STEP & IGES)',
        dimensions: 'Mold Base 250x300mm',
        quantity: 1,
        unit: 'Paket Desain',
        unitPrice: 8000000,
        totalPrice: 8000000,
        notes: 'Lengkap dengan analisis flow mold & cooling line layout'
      }
    ],
    blueprintFiles: [],
    workNotes: [],
    deliveryOrder: null,
    notes: 'Draf desain untuk riset terapan kampus vokasi.',
    createdAt: 1730000000000,
    updatedAt: 1730000000000
  }
];
