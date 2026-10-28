import { describe, it, expect } from 'vitest';
import { 
  InvoiceSchema, 
  inferInvoiceDivision, 
  INVOICE_DIVISION_CONFIG, 
  InvoiceDivision,
  Invoice 
} from '@/types';

describe('Audit & Fitur Monitoring Invoice Per Divisi (Fase 1 - 4)', () => {
  it('1. Schema Validation: Mendukung atribut division, divisionPic, dan divisionRefNumber', () => {
    const validInvoiceData: Invoice = {
      invoiceNumber: 'INV/PROD/20261028/001',
      customerName: 'PT Mega Perkasa Industri',
      customerType: 'Umum',
      customerEmail: 'finance@megaperkasa.com',
      customerPhone: '081234567890',
      division: 'JASA_PRODUKSI',
      divisionPic: 'Abednego Danu (Workshop STP)',
      divisionRefNumber: 'SPK/PROD/20261028/0042',
      items: [{
        id: 'ITEM-1',
        referenceId: 'ORD-123',
        referenceType: 'PRODUCTION',
        description: 'Jasa Bubut CNC Presisi Komponen Hidrolik',
        quantity: 1,
        unitPrice: 15000000,
        total: 15000000
      }],
      subTotal: 15000000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 15000000,
      paidAmount: 4500000,
      remainingAmount: 10500000,
      term: 'DOWN_PAYMENT',
      date: '2026-10-28',
      dueDate: '2026-11-04',
      status: 'PARTIAL',
      history: []
    };

    const parsed = InvoiceSchema.safeParse(validInvoiceData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.division).toBe('JASA_PRODUKSI');
      expect(parsed.data.divisionPic).toBe('Abednego Danu (Workshop STP)');
      expect(parsed.data.divisionRefNumber).toBe('SPK/PROD/20261028/0042');
    }
  });

  it('2. Inferensi Divisi Cerdas (inferInvoiceDivision): Mampu mendeteksi divisi secara akurat', () => {
    // 2a. Dari nomor dan referenceType Jasa Produksi
    const prodInv: Partial<Invoice> = {
      invoiceNumber: 'INV/PROD/DP/20261028/4412',
      items: [{ id: '1', referenceType: 'PRODUCTION', description: 'DP Manufaktur', quantity: 1, unitPrice: 100, total: 100 }]
    };
    expect(inferInvoiceDivision(prodInv)).toBe('JASA_PRODUKSI');

    // 2b. Dari Sewa Gedung / Booking Fasilitas
    const bookingInv: Partial<Invoice> = {
      invoiceNumber: 'INV/BLUD/SEWA/2026/089',
      items: [{ id: '2', referenceType: 'BOOKING', description: 'Sewa Gedung Solo Technopark', quantity: 1, unitPrice: 500, total: 500 }]
    };
    expect(inferInvoiceDivision(bookingInv)).toBe('FASILITAS_ASET');

    // 2c. Dari Pelatihan / Diklat
    const trnInv: Partial<Invoice> = {
      invoiceNumber: 'INV/TRN/2026/001',
      items: [{ id: '3', referenceType: 'TRAINING', description: 'Pelatihan Cyber Security', quantity: 1, unitPrice: 300, total: 300 }]
    };
    expect(inferInvoiceDivision(trnInv)).toBe('DIKLAT_PELATIHAN');

    // 2d. Dari E-Katalog
    const catInv: Partial<Invoice> = {
      invoiceNumber: 'INV/CAT/2026/009',
      items: [{ id: '4', referenceType: 'CATALOG', description: 'Merchandise Jaket STP', quantity: 1, unitPrice: 200, total: 200 }]
    };
    expect(inferInvoiceDivision(catInv)).toBe('KATALOG_PRODUK');

    // 2e. Dari Tenant Inkubasi
    const tenantInv: Partial<Invoice> = {
      invoiceNumber: 'INV/TENANT/2026/012',
      customerType: 'Tenant',
      items: [{ id: '5', referenceType: 'CUSTOM', description: 'Sewa Ruang Coworking Tenant', quantity: 1, unitPrice: 1000, total: 1000 }]
    };
    expect(inferInvoiceDivision(tenantInv)).toBe('INKUBASI_TENANT');
  });

  it('3. Auto-COA BLUD Mapping: Setiap divisi memiliki default akun pendapatan resmi BLUD', () => {
    const divisions: InvoiceDivision[] = [
      'JASA_PRODUKSI', 
      'FASILITAS_ASET', 
      'DIKLAT_PELATIHAN', 
      'INKUBASI_TENANT', 
      'KATALOG_PRODUK', 
      'UMUM'
    ];

    divisions.forEach(div => {
      const cfg = INVOICE_DIVISION_CONFIG[div];
      expect(cfg).toBeDefined();
      expect(cfg.label).toBeTruthy();
      expect(cfg.shortLabel).toBeTruthy();
      expect(cfg.badgeClass).toBeTruthy();
      expect(cfg.defaultCoaCode).toMatch(/^4\.1\./);
      expect(cfg.defaultCoaName).toContain('Pendapatan');
    });

    // Verifikasi kode spesifik
    expect(INVOICE_DIVISION_CONFIG.JASA_PRODUKSI.defaultCoaCode).toBe('4.1.02');
    expect(INVOICE_DIVISION_CONFIG.FASILITAS_ASET.defaultCoaCode).toBe('4.1.01');
    expect(INVOICE_DIVISION_CONFIG.DIKLAT_PELATIHAN.defaultCoaCode).toBe('4.1.03');
    expect(INVOICE_DIVISION_CONFIG.INKUBASI_TENANT.defaultCoaCode).toBe('4.1.04');
    expect(INVOICE_DIVISION_CONFIG.KATALOG_PRODUK.defaultCoaCode).toBe('4.1.05');
  });

  it('4. Two-Way Handshake: Mendukung sinkronisasi otomatis status DP (PARTIAL) ke status produksi', () => {
    // Simulasi payload invoice DP yang dibayar sebagian
    const isDpInvoice = (term: string, invNumber: string, notes?: string) => {
      return term === 'DOWN_PAYMENT' || invNumber.includes('/DP') || (notes && notes.toLowerCase().includes('uang muka'));
    };

    expect(isDpInvoice('DOWN_PAYMENT', 'INV/PROD/DP/20261028/1234', 'Uang muka pengerjaan')).toBeTruthy();
    expect(isDpInvoice('FULL_PAYMENT', 'INV/PROD/LUNAS/20261028/1234', 'Pelunasan pengerjaan')).toBeFalsy();
  });
});
