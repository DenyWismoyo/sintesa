/**
 * Script Seeder Database: Akun Kas Billing (COA), Pengaturan Bank BLUD,
 * Contoh Pesanan Jasa Produksi & Manufaktur, Contoh Invoices, dan Order Terkait.
 * 
 * Penggunaan: node scripts/seed-billing-and-production-data.js
 */

const path = require('path');
const fs = require('fs');

const saPath = path.join(__dirname, '..', 'service-account-katalog.json');

if (!fs.existsSync(saPath)) {
  console.error('File service-account-katalog.json tidak ditemukan!');
  process.exit(1);
}

const sa = require(saPath);

let app, db;
try {
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  app = initializeApp({
    credential: cert(sa),
    projectId: 'katalog-solo-technopark'
  }, 'seedBillingProductionApp');
  db = getFirestore(app);
} catch (e) {
  const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');
  app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: 'katalog-solo-technopark'
  }, 'seedBillingProductionApp');
  db = app.firestore();
}
const appId = process.env.APP_ID || process.env.NEXT_PUBLIC_APP_ID || 'blud-app-dev';

console.log(`\n🚀 Memulai Penyuntikan Data ke Firestore [katalog-solo-technopark]`);
console.log(`📁 Target AppId: "${appId}"`);

async function runSeeder() {
  const batch = db.batch();
  const timestamp = Date.now();

  // =========================================================================
  // 1. REKENING KAS / CHART OF ACCOUNTS (COA) UNTUK DOMPET PENCATATAN BILLING
  // =========================================================================
  console.log('\n[1/5] Menyiapkan Rekening Kas & Bank (Dompet Pencatatan Billing)...');
  const accountsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('accounts');

  const accounts = [
    {
      id: 'acc-kas-loket',
      code: '1-1001',
      name: 'Kas Operasional Loket BLUD',
      type: 'KAS_BANK',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 12500000,
      isSystem: true,
      bankName: 'Kas Tunai Loket STP',
      accountNumber: '-',
      accountHolder: 'Bendahara Penerimaan BLUD',
      isReceivingAccount: true,
      createdAt: timestamp
    },
    {
      id: 'acc-bank-jateng',
      code: '1-1002',
      name: 'Bank Jateng - Rekening Operasional BLUD STP',
      type: 'KAS_BANK',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 85400000,
      isSystem: true,
      bankName: 'Bank Jateng',
      accountNumber: '1002-0899-7771',
      accountHolder: 'UPTD KST SOLO TECHNOPARK',
      isReceivingAccount: true,
      createdAt: timestamp
    },
    {
      id: 'acc-bank-mandiri',
      code: '1-1003',
      name: 'Bank Mandiri - Jasa Produksi & Manufaktur',
      type: 'KAS_BANK',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 42000000,
      isSystem: false,
      bankName: 'Bank Mandiri',
      accountNumber: '138-00-9876543-2',
      accountHolder: 'SOLO TECHNOPARK MANUFAKTUR',
      isReceivingAccount: true,
      createdAt: timestamp
    },
    {
      id: 'acc-bank-bni',
      code: '1-1004',
      name: 'Bank BNI - Virtual Account & QRIS BLUD',
      type: 'KAS_BANK',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 29800000,
      isSystem: false,
      bankName: 'Bank BNI',
      accountNumber: '988-002-20261014',
      accountHolder: 'STP PAYMENT GATEWAY',
      isReceivingAccount: true,
      createdAt: timestamp
    },
    {
      id: 'acc-piutang-usaha',
      code: '1-1010',
      name: 'Piutang Usaha & Jasa Layanan',
      type: 'PIUTANG',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 22700000,
      isSystem: true,
      createdAt: timestamp
    },
    {
      id: 'acc-pendapatan-produksi',
      code: '4-1001',
      name: 'Pendapatan Jasa Produksi & Manufaktur',
      type: 'PENDAPATAN',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 0,
      isSystem: true,
      createdAt: timestamp
    },
    {
      id: 'acc-pendapatan-sewa',
      code: '4-1002',
      name: 'Pendapatan Sewa Fasilitas Kawasan',
      type: 'PENDAPATAN',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 0,
      isSystem: true,
      createdAt: timestamp
    },
    {
      id: 'acc-pendapatan-katalog',
      code: '4-1003',
      name: 'Pendapatan Penjualan Produk E-Katalog',
      type: 'PENDAPATAN',
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      balance: 0,
      isSystem: true,
      createdAt: timestamp
    }
  ];

  accounts.forEach((acc) => {
    const ref = accountsRef.doc(acc.id);
    batch.set(ref, acc, { merge: true });
    console.log(`  ✓ Akun [${acc.code}] ${acc.name}`);
  });

  // =========================================================================
  // 2. PENGATURAN KEUANGAN & REKENING RESMI TAGIHAN (SETTINGS)
  // =========================================================================
  console.log('\n[2/5] Menyiapkan Pengaturan Rekening Tagihan Resmi...');
  const financeSettingRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('settings').doc('finance');

  const financeSetting = {
    taxRate: 11,
    invoicePrefix: 'INV/',
    defaultDueDays: 7,
    bankAccounts: [
      {
        bankName: 'Bank Jateng',
        accountNumber: '1002-0899-7771',
        accountHolder: 'UPTD KST SOLO TECHNOPARK'
      },
      {
        bankName: 'Bank Mandiri',
        accountNumber: '138-00-9876543-2',
        accountHolder: 'SOLO TECHNOPARK MANUFAKTUR'
      },
      {
        bankName: 'Bank BNI',
        accountNumber: '988-002-20261014',
        accountHolder: 'STP PAYMENT GATEWAY'
      }
    ],
    updatedAt: timestamp
  };
  batch.set(financeSettingRef, financeSetting, { merge: true });
  console.log('  ✓ 3 Rekening Resmi Transfer Invoice tersimpan di settings/finance');

  // =========================================================================
  // 3. PESANAN JASA PRODUKSI & MANUFAKTUR (PRODUCTION ORDERS)
  // =========================================================================
  console.log('\n[3/5] Menyiapkan Contoh SPK Jasa Produksi & Manufaktur...');
  const prodOrdersRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('production_orders');

  const prodOrders = [
    // Order 1: CNC Machining Sedang Berjalan (DP Paid, 65% Progress)
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
          uploadedAt: timestamp,
          size: 4580000
        }
      ],
      workNotes: [
        {
          id: 'log-1',
          date: '2026-10-25',
          percentage: 25,
          note: 'Penerimaan material ST52 & Duralium. Verifikasi dimensi potong dan facing awal.',
          author: 'Agus Santoso',
          createdAt: timestamp - 86400000 * 3
        },
        {
          id: 'log-2',
          date: '2026-10-27',
          percentage: 45,
          note: 'Roughing milling CNC 4-axis selesai pada 2 unit base plate. Datum hole terbentuk.',
          author: 'Agus Santoso',
          createdAt: timestamp - 86400000
        },
        {
          id: 'log-3',
          date: '2026-10-28',
          percentage: 65,
          note: 'Finishing kontur duralium 7075. Toleransi aman, lanjut pengerjaan pin guide.',
          author: 'Agus Santoso',
          createdAt: timestamp
        }
      ],
      deliveryOrder: null,
      notes: 'Pekerjaan prioritas tinggi, klien membutuhkan untuk setup jalur produksi baru.',
      createdAt: timestamp - 86400000 * 3,
      updatedAt: timestamp
    },

    // Order 2: Fabrikasi Logam Selesai (Surat Jalan Resmi Diterbitkan & Lunas)
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
          author: 'Wawan Setiawan',
          createdAt: timestamp - 86400000 * 2
        },
        {
          id: 'log-202',
          date: '2026-10-27',
          percentage: 100,
          note: 'Inspeksi QC dimensi dan uji getaran motor selesai. Lolos uji mutu dan siap kirim.',
          author: 'Wawan Setiawan',
          createdAt: timestamp - 86400000
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
        createdAt: timestamp
      },
      notes: 'Selesai dan terkirim dengan dokumen Surat Jalan resmi.',
      createdAt: timestamp - 86400000 * 5,
      updatedAt: timestamp
    },

    // Order 3: 3D Printing & Enclosure IoT (Internal Tenant STP)
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
          author: 'Fajar Hidayat',
          createdAt: timestamp
        }
      ],
      deliveryOrder: null,
      notes: 'Produk inovasi tenant untuk pameran Hannover Messe & pilot project pertanian.',
      createdAt: timestamp - 86400000,
      updatedAt: timestamp
    }
  ];

  prodOrders.forEach((order) => {
    const ref = prodOrdersRef.doc(order.id);
    batch.set(ref, order, { merge: true });
    console.log(`  ✓ SPK [${order.orderNumber}] ${order.projectTitle} (${order.status})`);
  });

  // =========================================================================
  // 4. CONTOH INVOICE DI MENU BILLING (PRODUKSI, BOOKING, KATALOG, TRAINING)
  // =========================================================================
  console.log('\n[4/5] Menyiapkan Contoh Invoice Berbagai Kategori di Billing...');
  const invoicesRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('invoices');

  const invoices = [
    // Invoice 1: DP 40% Produksi CNC (Lunas ke Bank Jateng)
    {
      id: 'inv-prod-dp-001',
      invoiceNumber: 'INV/PROD/DP/20261028/1001',
      customerName: 'PT Techno Presisi Indonesia',
      customerType: 'Umum',
      customerEmail: 'bambang@technopresisi.co.id',
      customerPhone: '081234567890',
      items: [
        {
          id: 'item-inv-1',
          referenceId: 'prod-order-001',
          referenceType: 'PRODUCTION',
          description: 'Uang Muka (DP 40%) - Fabrikasi Fixture & Precision Tooling CNC 4-Axis',
          subDescription: 'Nomor SPK: SPK/PROD/20261028/0101 | Kategori: CNC & Presisi Machining',
          unit: 'Paket Pekerjaan',
          quantity: 1,
          unitPrice: 7400000,
          total: 7400000
        }
      ],
      subTotal: 7400000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 7400000,
      paidAmount: 7400000,
      remainingAmount: 0,
      term: 'DOWN_PAYMENT',
      date: '2026-10-25',
      dueDate: '2026-11-01',
      status: 'PAID',
      issuerName: 'Kasir Utama BLUD STP',
      issuerRole: 'Bendahara Penerimaan',
      issuerNIP: '19880512 201402 1 003',
      paymentBankName: 'Bank Jateng',
      paymentAccountNumber: '1002-0899-7771',
      paymentAccountHolder: 'UPTD KST SOLO TECHNOPARK',
      notes: 'Pembayaran DP 40% SPK/PROD/20261028/0101 sebagai syarat resmi memulai proses machining CNC.',
      history: [
        {
          id: 'pay-001',
          date: '2026-10-26',
          amount: 7400000,
          method: 'TRANSFER_BANK (Bank Jateng)',
          status: 'SUCCESS'
        }
      ],
      createdAt: timestamp - 86400000 * 3,
      updatedAt: timestamp - 86400000 * 2
    },

    // Invoice 2: Pelunasan Akhir Produksi Fabrikasi (Lunas dengan Kwitansi)
    {
      id: 'inv-prod-lunas-002',
      invoiceNumber: 'INV/PROD/LUNAS/20261028/1002',
      customerName: 'CV Rekayasa Logam Surakarta',
      customerType: 'Umum',
      customerEmail: 'budi@rekayasalogam.id',
      customerPhone: '085712345678',
      items: [
        {
          id: 'item-inv-2',
          referenceId: 'prod-order-002',
          referenceType: 'PRODUCTION',
          description: 'Pelunasan Akhir (Sisa 50%) - Fabrikasi Rangka Mesin Sortir Kopi Otomatis',
          subDescription: 'Nomor SPK: SPK/PROD/20261025/0088 | Surat Jalan: SJ/PROD/20261028/0002',
          unit: 'Paket Pekerjaan',
          quantity: 1,
          unitPrice: 6000000,
          total: 6000000
        }
      ],
      subTotal: 6000000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 6000000,
      paidAmount: 6000000,
      remainingAmount: 0,
      term: 'FULL_PAYMENT',
      date: '2026-10-27',
      dueDate: '2026-11-03',
      status: 'PAID',
      issuerName: 'Kasir Utama BLUD STP',
      issuerRole: 'Bendahara Penerimaan',
      issuerNIP: '19880512 201402 1 003',
      paymentBankName: 'Bank Mandiri',
      paymentAccountNumber: '138-00-9876543-2',
      paymentAccountHolder: 'SOLO TECHNOPARK MANUFAKTUR',
      notes: 'Pelunasan pekerjaan selesai sebelum penyerahan barang dengan Surat Jalan resmi.',
      history: [
        {
          id: 'pay-002',
          date: '2026-10-28',
          amount: 6000000,
          method: 'TRANSFER_BANK (Bank Mandiri)',
          status: 'SUCCESS'
        }
      ],
      createdAt: timestamp - 86400000,
      updatedAt: timestamp
    },

    // Invoice 3: Booking Fasilitas / Ruang Konferensi (PENDING)
    {
      id: 'inv-book-2001',
      invoiceNumber: 'INV/BOOK/20261028/2001',
      customerName: 'PT Ruang Maju Bersama',
      customerType: 'Umum',
      customerEmail: 'finance@ruangmaju.com',
      customerPhone: '081399887766',
      items: [
        {
          id: 'item-inv-3',
          referenceId: 'book-001',
          referenceType: 'BOOKING',
          description: 'Sewa Convention Hall Gedung Utama & Sound System (1 Hari Penuh)',
          subDescription: 'Acara: Solo Digital Tech Summit 2026 (Kapasitas 500 Peserta)',
          unit: 'Hari',
          quantity: 1,
          unitPrice: 8500000,
          total: 8500000
        }
      ],
      subTotal: 8500000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 8500000,
      paidAmount: 0,
      remainingAmount: 8500000,
      term: 'FULL_PAYMENT',
      date: '2026-10-28',
      dueDate: '2026-11-04',
      status: 'PENDING',
      issuerName: 'Petugas Loket BLUD',
      issuerRole: 'Staf Layanan Aset',
      issuerNIP: '19920315 201903 2 007',
      paymentBankName: 'Bank Jateng',
      paymentAccountNumber: '1002-0899-7771',
      paymentAccountHolder: 'UPTD KST SOLO TECHNOPARK',
      notes: 'Silakan lakukan transfer ke rekening resmi Bank Jateng UPTD KST Solo Technopark sebelum tanggal jatuh tempo.',
      history: [],
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // Invoice 4: Pembelian Produk E-Katalog (PENDING)
    {
      id: 'inv-katalog-3001',
      invoiceNumber: 'INV/KATALOG/20261028/3001',
      customerName: 'Dinas Komunikasi & Informatika Kota Surakarta',
      customerType: 'Tenant',
      customerEmail: 'diskominfo@surakarta.go.id',
      customerPhone: '0271-642020',
      items: [
        {
          id: 'item-inv-4',
          referenceId: 'ord-katalog-001',
          referenceType: 'CATALOG',
          description: 'Perangkat Smart Gateway IoT & Sensor Lingkungan Solo Technopark',
          subDescription: 'Katalog Produk Inovasi STP Hardware Lab - Model SG-200X',
          unit: 'Unit',
          quantity: 2,
          unitPrice: 7100000,
          total: 14200000
        }
      ],
      subTotal: 14200000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 14200000,
      paidAmount: 0,
      remainingAmount: 14200000,
      term: 'FULL_PAYMENT',
      date: '2026-10-28',
      dueDate: '2026-11-05',
      status: 'PENDING',
      issuerName: 'Admin E-Katalog STP',
      issuerRole: 'Staf Komersialisasi Produk',
      issuerNIP: '19900820 201701 1 004',
      paymentBankName: 'Bank Jateng',
      paymentAccountNumber: '1002-0899-7771',
      paymentAccountHolder: 'UPTD KST SOLO TECHNOPARK',
      notes: 'Pengadaan barang melalui sistem e-katalog inovasi daerah Kota Surakarta.',
      history: [],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  invoices.forEach((inv) => {
    const ref = invoicesRef.doc(inv.id);
    batch.set(ref, inv, { merge: true });
    console.log(`  ✓ Invoice [${inv.invoiceNumber}] - ${inv.customerName} (Rp ${inv.totalAmount.toLocaleString('id-ID')})`);
  });

  // =========================================================================
  // 5. DATA ORDER E-KATALOG & BOOKING PENDUKUNG
  // =========================================================================
  console.log('\n[5/5] Menyiapkan Order E-Katalog & Booking Fasilitas...');
  const ordersRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('orders');
  const bookingsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('bookings');

  // Order Katalog
  const katalogOrder = {
    id: 'ord-katalog-001',
    orderNumber: 'ORD/KAT/20261028/001',
    customerName: 'Dinas Komunikasi & Informatika Kota Surakarta',
    customerEmail: 'diskominfo@surakarta.go.id',
    customerPhone: '0271-642020',
    totalPrice: 14200000,
    status: 'PENDING',
    items: [
      {
        id: 'cat-item-1',
        name: 'Smart Gateway IoT & Sensor Lingkungan',
        price: 7100000,
        quantity: 2
      }
    ],
    invoiceId: 'inv-katalog-3001',
    createdAt: timestamp
  };
  batch.set(ordersRef.doc(katalogOrder.id), katalogOrder, { merge: true });
  console.log(`  ✓ Order E-Katalog [${katalogOrder.orderNumber}] tersimpan.`);

  // Booking Aset
  const bookingAsset = {
    id: 'book-001',
    bookingNumber: 'BOOK/20261028/001',
    assetId: 'asset-convention-hall',
    assetName: 'Convention Hall Gedung Utama STP',
    tenantName: 'PT Ruang Maju Bersama',
    clientEmail: 'finance@ruangmaju.com',
    clientPhone: '081399887766',
    startDate: '2026-11-10',
    endDate: '2026-11-10',
    totalPrice: 8500000,
    status: 'APPROVED',
    paymentStatus: 'UNPAID',
    invoiceId: 'inv-book-2001',
    createdAt: timestamp
  };
  batch.set(bookingsRef.doc(bookingAsset.id), bookingAsset, { merge: true });
  console.log(`  ✓ Booking Fasilitas [${bookingAsset.bookingNumber}] tersimpan.`);

  // Commit Batch
  console.log('\n⏳ Melakukan commit batch ke Firestore...');
  await batch.commit();
  console.log('\n✨ SEMUA DATA SEED BERHASIL DISUNTIKKAN KE FIRESTORE!');
}

runSeeder().then(() => {
  console.log('\nProses selesai tanpa kendala.');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat menyuntikkan data:', err);
  process.exit(1);
});
