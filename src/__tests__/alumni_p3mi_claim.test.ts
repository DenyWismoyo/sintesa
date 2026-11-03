import { describe, it, expect } from 'vitest';
import { 
  AlumniSchema, 
  AlumniOriginSourceEnum, 
  ALUMNI_ORIGIN_LABELS, 
  ALUMNI_ORIGIN_BADGES, 
  AlumniOriginSource 
} from '@/types';

describe('Standardisasi Alumni & Fleksibilitas Klaim (P3MI / BP3MI / STP / RSKB)', () => {
  it('harus memiliki semua enum jalur program asal alumni dengan benar', () => {
    const validOrigins: AlumniOriginSource[] = [
      'STP_VOKASI',
      'PELATIHAN_MANDIRI',
      'KERJASAMA_P3MI',
      'RSKB_SURAKARTA',
      'CSR_INDUSTRI',
      'OPD_PEMKOT',
      'INKUBASI_WIRAUSAHA',
      'KERJASAMA_LEMBAGA',
    ];

    validOrigins.forEach(origin => {
      expect(AlumniOriginSourceEnum.options).toContain(origin);
      expect(ALUMNI_ORIGIN_LABELS[origin]).toBeDefined();
      expect(ALUMNI_ORIGIN_BADGES[origin]).toBeDefined();
    });
  });

  it('harus memvalidasi AlumniSchema dengan NIK opsional (dapat diisi atau dikosongkan)', () => {
    // 1. Valid dengan NIK 16 digit lengkap
    const alumniWithNik = AlumniSchema.safeParse({
      name: "Aurel Rizka Affandi",
      nik: "3324161410070001",
      gender: "Laki-Laki",
      domicile: "Kabupaten Kendal",
      age: 18,
      uniformSize: "M",
      shoeSize: "42",
      programTaken: "Pelatihan dan Sertifikasi Welder (SMK Go Global)",
      batch: "Batch II",
      originSource: "KERJASAMA_P3MI",
      partnerInstitution: "BP3MI Jawa Tengah",
      targetPlacement: "Global / Luar Negeri (SMK Go Global)",
      registrationCode: "P3MI-2026-752691",
      status: "DORMANT",
    });
    expect(alumniWithNik.success).toBe(true);

    // 2. Valid tanpa NIK (NIK kosong / undefined / opsional)
    const alumniWithoutNik = AlumniSchema.safeParse({
      name: "Bintang Arya Wijaya",
      nik: "",
      gender: "Laki-Laki",
      domicile: "Kabupaten Sragen",
      uniformSize: "L",
      shoeSize: "42",
      programTaken: "Pelatihan dan Sertifikasi Welder (SMK Go Global)",
      batch: "Batch II",
      originSource: "KERJASAMA_P3MI",
      partnerInstitution: "BP3MI Jawa Tengah",
      registrationCode: "P3MI-2026-796653",
      status: "DORMANT",
    });
    expect(alumniWithoutNik.success).toBe(true);
  });

  it('harus memvalidasi pengenalan identifier klaim yang fleksibel (Kode Registrasi unik atau NIK opsional)', () => {
    function parseClaimIdentifier(input: string): { type: 'CODE' | 'NIK' | 'INVALID'; cleanValue: string } {
      const clean = input.trim();
      if (!clean) return { type: 'INVALID', cleanValue: '' };

      if (/^\d{10,18}$/.test(clean)) {
        return { type: 'NIK', cleanValue: clean };
      }

      if (/^[A-Z0-9-]{6,30}$/i.test(clean)) {
        return { type: 'CODE', cleanValue: clean.toUpperCase() };
      }

      return { type: 'INVALID', cleanValue: clean };
    }

    // Uji Kode BP3MI
    const p3miCode = parseClaimIdentifier('P3MI-2026-684672');
    expect(p3miCode.type).toBe('CODE');
    expect(p3miCode.cleanValue).toBe('P3MI-2026-684672');

    // Uji Kode STP Reguler
    const stpCode = parseClaimIdentifier('AL-2026-123456');
    expect(stpCode.type).toBe('CODE');
    expect(stpCode.cleanValue).toBe('AL-2026-123456');

    // Uji NIK 16 Digit
    const nikInput = parseClaimIdentifier('3324160401070001');
    expect(nikInput.type).toBe('NIK');
    expect(nikInput.cleanValue).toBe('3324160401070001');

    // Uji Input tidak valid
    const invalidInput = parseClaimIdentifier('abc');
    expect(invalidInput.type).toBe('INVALID');
  });
});

