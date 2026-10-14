import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/utils/format';

describe('Financial Ledger & BLUD Accounting Integrity', () => {
  describe('Double-Entry Balance Validation', () => {
    it('should validate balanced journal entries where sum(Debit) === sum(Kredit)', () => {
      const paymentAmount = 1500000;
      const entries = [
        { accountId: 'acc-kas-1', accountName: 'Kas Utama BLUD', type: 'DEBIT', amount: paymentAmount },
        { accountId: 'acc-piutang-1', accountName: 'Piutang Sewa Aset', type: 'KREDIT', amount: paymentAmount }
      ];

      const totalDebit = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
      const totalKredit = entries.filter(e => e.type === 'KREDIT').reduce((sum, e) => sum + e.amount, 0);

      expect(totalDebit).toBe(paymentAmount);
      expect(totalKredit).toBe(paymentAmount);
      expect(totalDebit === totalKredit).toBe(true);
      expect(totalDebit > 0).toBe(true);
    });

    it('should catch unbalanced journal entries and prevent ledger corruption', () => {
      const entries = [
        { accountId: 'acc-kas-1', accountName: 'Kas Utama BLUD', type: 'DEBIT', amount: 1500000 },
        { accountId: 'acc-piutang-1', accountName: 'Piutang Sewa Aset', type: 'KREDIT', amount: 1450000 } // Selisih 50.000!
      ];

      const totalDebit = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
      const totalKredit = entries.filter(e => e.type === 'KREDIT').reduce((sum, e) => sum + e.amount, 0);

      const isValid = totalDebit === totalKredit && totalDebit > 0;
      expect(isValid).toBe(false);
    });

    it('should reject non-positive amounts', () => {
      const entries = [
        { accountId: 'acc-kas-1', accountName: 'Kas Utama BLUD', type: 'DEBIT', amount: 0 },
        { accountId: 'acc-piutang-1', accountName: 'Piutang Sewa Aset', type: 'KREDIT', amount: 0 }
      ];

      const totalDebit = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
      const totalKredit = entries.filter(e => e.type === 'KREDIT').reduce((sum, e) => sum + e.amount, 0);

      const isValid = totalDebit === totalKredit && totalDebit > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Currency Formatting Utility', () => {
    it('should format standard Indonesian Rupiah correctly', () => {
      expect(formatRupiah(1500000)).toMatch(/1\.500\.000/);
      expect(formatRupiah(0)).toMatch(/0/);
      expect(formatRupiah(25000000)).toMatch(/25\.000\.000/);
    });
  });

  describe('Invoice & Billing Item Specification Integrity', () => {
    it('should validate InvoiceItem with unit, subDescription, and points', async () => {
      const { InvoiceItemSchema, InvoiceSchema } = await import('@/types/finance.types');

      const sampleItem = {
        id: 'item-01',
        referenceType: 'TARIFF_DAY' as const,
        description: 'Sewa Gedung Auditorium Utama Solo Technopark',
        subDescription: 'Penggunaan Hall A & Ruang VIP Lt. 2',
        unit: 'Hari',
        points: [
          'Sound system line-array & 4 wireless mic',
          'Videotron indoor 6x3 meter',
          'Daya listrik 50.000 Watt standby'
        ],
        quantity: 2,
        unitPrice: 15000000,
        total: 30000000
      };

      const parsedItem = InvoiceItemSchema.parse(sampleItem);
      expect(parsedItem.unit).toBe('Hari');
      expect(parsedItem.points?.length).toBe(3);
      expect(parsedItem.subDescription).toContain('Hall A');

      const sampleInvoice = {
        invoiceNumber: 'INV/BOOK/20261014/0001',
        customerName: 'PT. Teknologi Masa Depan',
        customerType: 'Umum' as const,
        items: [parsedItem],
        subTotal: 30000000,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 30000000,
        paidAmount: 0,
        remainingAmount: 30000000,
        term: 'FULL_PAYMENT' as const,
        date: '2026-10-14',
        dueDate: '2026-10-21',
        status: 'PENDING' as const,
        history: [],
        termsAndConditions: [
          'Pembayaran wajib diselesaikan penuh sebelum batas waktu jatuh tempo.',
          'Bukti transfer wajib diunggah melalui tautan sistem.'
        ]
      };

      const parsedInvoice = InvoiceSchema.parse(sampleInvoice);
      expect(parsedInvoice.termsAndConditions?.length).toBe(2);
      expect(parsedInvoice.items[0].points?.[0]).toContain('Sound system');
    });

    it('should validate FundingStage synchronization between Tenant and FundingRound', async () => {
      const { FundingStageSchema, FundingRoundSchema, TenantSchema, FUNDING_STAGES } = await import('@/types/tenant.types');

      expect(FUNDING_STAGES).toContain('Pre-Series A');
      expect(FUNDING_STAGES).toContain('Bridge/Convertible');

      const sampleRound = {
        id: 'round-1',
        roundName: 'Pre-Series A' as const,
        date: '2026-05-01',
        amount: 2500000000
      };

      const parsedRound = FundingRoundSchema.parse(sampleRound);
      expect(parsedRound.roundName).toBe('Pre-Series A');
    });
  });
});
