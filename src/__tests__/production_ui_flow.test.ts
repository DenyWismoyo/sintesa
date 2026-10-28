// Lokasi file: src/__tests__/production_ui_flow.test.ts
import { describe, it, expect } from 'vitest';
import { 
  ProductionOrderSchema, 
  ProductionItemSchema, 
  WorkProgressLogSchema, 
  DeliveryOrderInfoSchema,
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS
} from '@/types/production.types';
import { buildWorkOrderPdf } from '@/lib/pdf/workOrderPdf';
import { buildDeliveryOrderPdf } from '@/lib/pdf/deliveryOrderPdf';

describe('Modul Admin Jasa Produksi & Manufaktur STP (Tahap 3 UI & Integrasi)', () => {
  it('harus memiliki mapping status, kategori, dan payment status yang lengkap untuk UI', () => {
    expect(PRODUCTION_STATUS_LABELS.DRAFT.label).toBe('Draf Pesanan');
    expect(PRODUCTION_STATUS_LABELS.IN_PRODUCTION.label).toBe('Sedang Dikerjakan');
    expect(PRODUCTION_STATUS_LABELS.COMPLETED.label).toBe('Selesai Lunas');

    expect(PRODUCTION_CATEGORY_LABELS.CNC_MACHINING).toBe('CNC & Presisi Machining');
    expect(PRODUCTION_CATEGORY_LABELS['3D_PRINTING']).toBe('3D Printing & Additive Mfg');

    expect(PAYMENT_STATUS_LABELS.UNPAID.label).toBe('Belum Bayar');
    expect(PAYMENT_STATUS_LABELS.DP_PAID.label).toBe('DP Terbayar');
    expect(PAYMENT_STATUS_LABELS.FULL_PAID.label).toBe('Lunas');
  });

  it('harus memvalidasi struktur data Surat Jalan & SPK dengan benar', () => {
    const dummyOrder = ProductionOrderSchema.parse({
      orderNumber: 'SPK/PROD/20261028/0001',
      clientName: 'PT Techno Presisi Indonesia',
      clientType: 'Industri',
      projectTitle: 'Pembuatan Jig & Fixture Milling 4-Axis',
      category: 'CNC_MACHINING',
      targetDeliveryDate: '2026-11-15',
      totalCost: 15000000,
      dpPercentage: 30,
      dpAmount: 4500000,
      status: 'IN_PRODUCTION',
      productionProgress: 60,
      items: [
        {
          id: '1',
          partName: 'Base Plate Jig ST52',
          material: 'Baja ST52',
          dimensions: '200x150x30mm',
          quantity: 2,
          unit: 'Set',
          unitPrice: 5000000,
          totalPrice: 10000000,
          notes: 'Toleransi +/- 0.02mm'
        },
        {
          id: '2',
          partName: 'Clamping Arm Aluminium 7075',
          material: 'Dural 7075-T6',
          dimensions: '80x40x25mm',
          quantity: 4,
          unit: 'Pcs',
          unitPrice: 1250000,
          totalPrice: 5000000,
          notes: 'Anodizing clear finish'
        }
      ],
      workNotes: [
        {
          id: 'log-1',
          date: '2026-10-28',
          percentage: 60,
          note: 'Selesai proses milling kontur, lanjut pengeboran lubang pin presisi.',
          author: 'Bambang (Teknisi CNC)'
        }
      ]
    });

    expect(dummyOrder.items).toHaveLength(2);
    expect(dummyOrder.totalCost).toBe(15000000);
    expect(dummyOrder.productionProgress).toBe(60);

    // Verifikasi Dokumen SPK PDF Vektor
    const spkDoc = buildWorkOrderPdf({ order: dummyOrder });
    expect(spkDoc).toBeDefined();
    expect(spkDoc.internal.pages.length).toBeGreaterThanOrEqual(1);

    // Verifikasi Dokumen Surat Jalan PDF Vektor
    const deliveryInfo = DeliveryOrderInfoSchema.parse({
      deliveryOrderNumber: 'SJ/PROD/20261028/0001',
      deliveryDate: '2026-10-28',
      driverOrExpedition: 'Kurir Solo Technopark',
      vehicleNumber: 'AD 9999 XX',
      recipientName: 'Ir. Hendro Wibowo',
      recipientPhone: '081234567890',
      deliveryNotes: 'Barang dikemas rapi dalam 1 box kayu dengan bubble wrap.'
    });

    const deliveryDoc = buildDeliveryOrderPdf({ 
      order: { 
        ...dummyOrder, 
        deliveryOrder: deliveryInfo 
      } 
    });
    expect(deliveryDoc).toBeDefined();
    expect(deliveryDoc.internal.pages.length).toBeGreaterThanOrEqual(1);
  });
});
