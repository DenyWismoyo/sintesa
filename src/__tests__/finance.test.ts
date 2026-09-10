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
});
