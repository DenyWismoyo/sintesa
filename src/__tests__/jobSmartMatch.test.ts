import { describe, it, expect } from 'vitest';
import {
  normalizeSalaryToMonthlyIdr,
  isProgramAligned,
  computeAlumniJobMatch,
} from '@/utils/jobSmartMatch';
import { JobListing } from '@/types/job.types';

function makeMockJob(overrides: Partial<JobListing> = {}): JobListing {
  return {
    id: 'job-test-1',
    title: 'Welder Pipe 6G SMAW/GTAW',
    company: 'PT Rekayasa Konstruksi Nusantara',
    companyType: 'Mitra Industri STP',
    category: 'Manufaktur Presisi & Mekatronika',
    location: 'Surakarta, Jawa Tengah',
    city: 'Surakarta',
    region: 'indonesia',
    workType: 'Full-time',
    workSetup: 'On-site',
    experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
    salary: {
      min: 6000000,
      max: 9000000,
      currency: 'IDR',
      period: 'Bulan',
      isNegotiable: true,
      isDisclosed: true,
    },
    description: 'Mencari juru las pipa bertekanan tinggi bersertifikasi 6G.',
    responsibilities: ['Melakukan pengelasan pipa baja'],
    requirements: ['Sertifikat BNSP Las 6G', 'Menguasai SMAW & GTAW'],
    benefits: ['BPJS Kesehatan & Ketenagakerjaan'],
    skills: ['SMAW', 'GTAW', 'Welding 6G'],
    relevantTrainingPrograms: ['Pelatihan Juru Las (Welder) Standar Industri'],
    applySource: 'Official Web',
    source: 'stp_partner',
    isStpPartner: true,
    isFeatured: true,
    postedAt: Date.now(),
    viewsCount: 0,
    applicantCount: 0,
    isActive: true,
    ...overrides,
  };
}

describe('Bursa Karir Smart Hub — Matching & Currency Normalization', () => {
  describe('normalizeSalaryToMonthlyIdr', () => {
    it('should convert annual USD salary into monthly IDR equivalent accurately', () => {
      const annualUsd = normalizeSalaryToMonthlyIdr({
        min: 90000,
        max: 120000,
        currency: 'USD',
        period: 'Tahun',
        isNegotiable: false,
        isDisclosed: true,
      });
      const monthlyIdr = normalizeSalaryToMonthlyIdr({
        min: 10000000,
        max: 15000000,
        currency: 'IDR',
        period: 'Bulan',
        isNegotiable: true,
        isDisclosed: true,
      });

      // 120,000 USD / 12 = 10,000 USD/bln * 16,000 = 160,000,000 IDR/bln
      expect(annualUsd).toBe(160000000);
      expect(annualUsd).toBeGreaterThan(monthlyIdr);
    });

    it('should return 0 when salary is undisclosed', () => {
      expect(
        normalizeSalaryToMonthlyIdr({
          min: 50000000,
          max: 80000000,
          currency: 'IDR',
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed: false,
        })
      ).toBe(0);
    });
  });

  describe('isProgramAligned', () => {
    it('should match synonymous vocational training names (Welder vs Diklat Pengelasan)', () => {
      const weldingJob = makeMockJob();
      expect(isProgramAligned(weldingJob, 'Diklat Pengelasan Bawah Air & Pipa')).toBe(true);
      expect(isProgramAligned(weldingJob, 'Teknik Las SMAW')).toBe(true);
      expect(isProgramAligned(weldingJob, 'Tata Busana & Menjahit Garmen')).toBe(false);
    });

    it('should align CNC / Manufacturing jobs with Machining alumni programs', () => {
      const cncJob = makeMockJob({
        title: 'Operator Mesin Bubut CNC Milling',
        category: 'Manufaktur Presisi & Mekatronika',
        skills: ['Mastercam', 'SolidWorks', 'CNC'],
        relevantTrainingPrograms: ['Desain Manufaktur & Pemrograman CNC'],
      });
      expect(isProgramAligned(cncJob, 'Diklat Otomasi & Mesin Bubut')).toBe(true);
      expect(isProgramAligned(cncJob, 'Bootcamp Fullstack Web Developer (Next.js & TypeScript)')).toBe(false);
      expect(isProgramAligned(cncJob, 'Digital Marketing UMKM')).toBe(false);
    });
  });

  describe('computeAlumniJobMatch', () => {
    it('should score aligned vocational alumni significantly higher than unrelated alumni', () => {
      const weldingJob = makeMockJob();

      const alignedAlumni = computeAlumniJobMatch(weldingJob, {
        name: 'Budi Santoso',
        programTaken: 'Diklat Pengelasan Pipa 6G',
        skills: ['SMAW', 'GTAW', 'Blueprint Reading'],
        preferredRegion: 'Solo Raya & Jateng',
        preferredWorkSetup: 'On-site',
      });

      const unrelatedAlumni = computeAlumniJobMatch(weldingJob, {
        name: 'Siti Rahma',
        programTaken: 'Bootcamp Digital Marketing & Copywriting',
        skills: ['SEO', 'TikTok Ads', 'Canva'],
        preferredRegion: 'Luar Negeri (Jepang & Korea)',
        preferredWorkSetup: 'Remote',
      });

      expect(alignedAlumni.isProgramMatch).toBe(true);
      expect(alignedAlumni.score).toBeGreaterThanOrEqual(80);
      expect(alignedAlumni.grade).toBe('Sangat Cocok');
      expect(alignedAlumni.matchedSkills).toContain('SMAW');

      expect(unrelatedAlumni.isProgramMatch).toBe(false);
      expect(alignedAlumni.score).toBeGreaterThan(unrelatedAlumni.score + 35);
    });
  });
});
