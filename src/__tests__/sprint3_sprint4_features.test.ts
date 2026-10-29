import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alumniService } from '@/services/alumni.service';
import { exportAlumniTracerStudy } from '@/services/careerExport.service';

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

vi.mock('@/lib/appId', () => ({
  getAppId: () => 'blud-app-dev',
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('Sprint 3 & 4: E-Sertifikat Verification & Tracer Study Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sprint 3: Certificate Verification Method', () => {
    it('harus menolak input kode verifikasi yang kosong', async () => {
      const res = await alumniService.verifyCertificate('');
      expect(res.found).toBe(false);
      expect(res.error).toContain('nomor sertifikat');
    });

    it('harus mengembalikan found: false jika kode tidak ditemukan di firestore', async () => {
      const res = await alumniService.verifyCertificate('KODE-INVALID-999');
      expect(res.found).toBe(false);
    });
  });

  describe('Sprint 4: Tracer Study Export', () => {
    it('harus dapat memproses array alumni dan mengekspor ke format XLSX/CSV', () => {
      const dummyAlumni = [
        {
          id: 'alumni-1',
          name: 'Budi Santoso',
          registrationCode: 'AL-2024-111111',
          originSource: 'STP_VOKASI',
          programTaken: 'Teknik CNC & Manufaktur Presisi',
          graduationYear: '2024',
          employmentStatus: 'Bekerja (Full-time)',
          company: 'PT Rekayasa Industri Solo',
          currentJob: 'Operator CNC',
          phone: '08123456789',
          email: 'budi@example.com',
        },
        {
          id: 'alumni-2',
          name: 'Siti Aminah',
          registrationCode: 'RSKB-2024-222222',
          originSource: 'RSKB_SURAKARTA',
          programTaken: 'Digital Marketing & E-Commerce',
          graduationYear: '2024',
          employmentStatus: 'Wirausaha / Membangun Bisnis',
          company: 'Kripik Solo Mantap',
          currentJob: 'Owner',
          phone: '08198765432',
          email: 'siti@example.com',
        },
      ];

      expect(() => exportAlumniTracerStudy(dummyAlumni, 'XLSX')).not.toThrow();
      expect(() => exportAlumniTracerStudy(dummyAlumni, 'CSV')).not.toThrow();
    });
  });
});

