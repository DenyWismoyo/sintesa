import { describe, it, expect } from 'vitest';
import { 
  ProductionOrderSchema, 
  ProductionOrder, 
  PRODUCTION_CATEGORY_LABELS, 
  PRODUCTION_STATUS_LABELS 
} from '@/types/production.types';
import { productionService } from '@/services/production.service';
import { buildDeliveryOrderPdf } from '@/lib/pdf/deliveryOrderPdf';
import { buildWorkOrderPdf } from '@/lib/pdf/workOrderPdf';

describe('Modul Jasa Produksi & Manufaktur STP', () => {
  const sampleOrder: ProductionOrder = {
    id: 'prod-test-01',
    orderNumber: 'SPK/PROD/20261028/8899',
    clientName: 'PT Dirgantara Solusi Presisi',
    clientType: 'Industri',
    clientPhone: '081234567890',
    clientEmail: 'contact@dirgantara.co.id',
    clientAddress: 'Kawasan Industri Palur Kav. 12, Karanganyar',
    clientPic: 'Ir. Bambang Wijaya',
    projectTitle: 'Pembuatan Flange Bending & Shaft CNC Presisi',
    category: 'CNC_MACHINING',
    items: [
      {
        id: 'item-1',
        partName: 'Shaft Utama Rotor D-40',
        material: 'Baja Stainless SUS 304',
        dimensions: 'Diameter 40mm x Panjang 350mm',
        quantity: 10,
        unit: 'Pcs',
        unitPrice: 450000,
        totalPrice: 4500000,
        notes: 'Toleransi H7, Finishing Polish'
      },
      {
        id: 'item-2',
        partName: 'Flange Bracket CNC',
        material: 'Aluminium 6061 T6',
        dimensions: '120mm x 120mm x 15mm',
        quantity: 5,
        unit: 'Pcs',
        unitPrice: 320000,
        totalPrice: 1600000,
        notes: 'Anodizing Biru Presisi'
      }
    ],
    blueprintFiles: [],
    estimatedDurationDays: 10,
    targetDeliveryDate: '2026-11-08',
    status: 'IN_PRODUCTION',
    productionProgress: 45,
    assignedTechnician: 'Agus Santoso (Kepala Lab CNC STP)',
    workshopLocation: 'Workshop CNC & Fabrikasi Gedung C Solo Technopark',
    workNotes: [
      {
        id: 'log-1',
        date: '2026-10-28',
        percentage: 45,
        note: 'Pembubutan kasar selesai, persiapan milling lubang baut',
        author: 'Agus Santoso'
      }
    ],
    totalCost: 6100000,
    dpRequired: true,
    dpPercentage: 30,
    dpAmount: 1830000,
    dpInvoiceId: 'inv-dp-123',
    finalInvoiceId: null,
    paymentStatus: 'DP_PAID',
    deliveryOrder: {
      deliveryOrderNumber: 'SJ/PROD/20261028/1122',
      deliveryDate: '2026-11-08',
      driverOrExpedition: 'Budi (Armada Logistik STP)',
      vehicleNumber: 'AD 9901 ZA',
      recipientName: 'Ir. Bambang Wijaya',
      recipientPhone: '081234567890',
      deliveryNotes: 'Kemasan kayu bersegel, harap periksa keutuhan sebelum tanda tangan.'
    },
    notes: 'Prioritas tinggi untuk perakitan prototype industri',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  describe('1. Zod Runtime Schema Validation', () => {
    it('harus memvalidasi struktur dokumen pesanan produksi secara ketat', () => {
      const parsed = ProductionOrderSchema.safeParse(sampleOrder);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.totalCost).toBe(6100000);
        expect(parsed.data.dpAmount).toBe(1830000);
        expect(parsed.data.category).toBe('CNC_MACHINING');
        expect(parsed.data.status).toBe('IN_PRODUCTION');
      }
    });

    it('harus menolak data yang tidak memiliki clientName atau projectTitle', () => {
      const invalidOrder = { ...sampleOrder, clientName: '', projectTitle: '' };
      const parsed = ProductionOrderSchema.safeParse(invalidOrder);
      expect(parsed.success).toBe(false);
    });

    it('harus memiliki label kategori dan status manufaktur yang ramah pengguna', () => {
      expect(PRODUCTION_CATEGORY_LABELS['CNC_MACHINING']).toContain('CNC');
      expect(PRODUCTION_CATEGORY_LABELS['3D_PRINTING']).toContain('3D Printing');
      expect(PRODUCTION_STATUS_LABELS['READY_FOR_DELIVERY'].label).toBe('Siap Kirim');
      expect(PRODUCTION_STATUS_LABELS['IN_PRODUCTION'].label).toBe('Sedang Dikerjakan');
    });
  });

  describe('2. Business Logic & Number Generators', () => {
    it('harus men-generate format nomor SPK resmi: SPK/PROD/YYYYMMDD/XXXX', () => {
      const spkNumber = productionService.generateOrderNumber();
      expect(spkNumber).toMatch(/^SPK\/PROD\/\d{8}\/\d{4}$/);
    });

    it('harus men-generate format nomor Surat Jalan resmi: SJ/PROD/YYYYMMDD/XXXX', () => {
      const sjNumber = productionService.generateDeliveryOrderNumber();
      expect(sjNumber).toMatch(/^SJ\/PROD\/\d{8}\/\d{4}$/);
    });

    it('harus menghitung proporsi DP 30% dan sisa pelunasan secara presisi', () => {
      const total = 10000000;
      const dpPercent = 30;
      const dpAmount = Math.round((total * dpPercent) / 100);
      const sisa = total - dpAmount;

      expect(dpAmount).toBe(3000000);
      expect(sisa).toBe(7000000);
    });
  });

  describe('3. Generator Dokumen Vektor PDF Murni', () => {
    it('harus mampu menghasilkan dokumen PDF Surat Jalan Resmi (Delivery Order) tanpa crash', () => {
      const doc = buildDeliveryOrderPdf({ order: sampleOrder });
      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0); // A4 Width
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0); // A4 Height

      const pdfArrayBuffer = doc.output('arraybuffer');
      expect(pdfArrayBuffer.byteLength).toBeGreaterThan(1000); // PDF valid terisi data
    });

    it('harus mampu menghasilkan dokumen PDF Surat Perintah Kerja (SPK) tanpa crash', () => {
      const doc = buildWorkOrderPdf({ order: sampleOrder });
      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);

      const pdfArrayBuffer = doc.output('arraybuffer');
      expect(pdfArrayBuffer.byteLength).toBeGreaterThan(1000);
    });
  });
});
