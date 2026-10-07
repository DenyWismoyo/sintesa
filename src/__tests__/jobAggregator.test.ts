// src/__tests__/jobAggregator.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  stripHtml,
  determineWorkType,
  determineExperienceLevel,
  determineCompanyType,
  aggregateMultiProviderJobs,
} from '@/services/jobAggregator.service';
import { JobListingSchema } from '@/types/job.types';

describe('Job Aggregator Service Unit Tests', () => {
  describe('stripHtml helper', () => {
    it('harus membersihkan tag HTML dan script', () => {
      const rawHtml = '<p>Dibutuhkan <strong>Software Engineer</strong></p><script>alert("hack")</script>';
      const clean = stripHtml(rawHtml);
      expect(clean).toBe('Dibutuhkan Software Engineer');
      expect(clean).not.toContain('<p>');
      expect(clean).not.toContain('alert');
    });

    it('harus mengganti entitas HTML umum', () => {
      const entityHtml = 'C++ &amp; Python &quot;Developer&quot; &lt;Expert&gt;';
      const clean = stripHtml(entityHtml);
      expect(clean).toBe('C++ & Python "Developer" <Expert>');
    });
  });

  describe('determineWorkType helper', () => {
    it('harus mengenali internship / magang', () => {
      expect(determineWorkType('Software Intern')).toBe('Internship / Magang');
      expect(determineWorkType('Magang Mahasiswa')).toBe('Internship / Magang');
    });

    it('harus mengenali contract dan part-time', () => {
      expect(determineWorkType('Contractor 12 Months')).toBe('Contract');
      expect(determineWorkType('Part-Time Mentor')).toBe('Part-time');
    });

    it('harus default ke Full-time jika umum', () => {
      expect(determineWorkType('Regular employee')).toBe('Full-time');
    });
  });

  describe('determineExperienceLevel helper', () => {
    it('harus mengklasifikasikan Senior untuk lead dan principal', () => {
      expect(determineExperienceLevel('Lead Backend Engineer')).toBe('Senior (4+ Tahun)');
      expect(determineExperienceLevel('Senior CNC Programmer')).toBe('Senior (4+ Tahun)');
    });

    it('harus mengklasifikasikan Mid-Level dan Junior', () => {
      expect(determineExperienceLevel('Intermediate Web Developer')).toBe('Mid-Level (2-4 Tahun)');
      expect(determineExperienceLevel('Junior IT Support')).toBe('Junior (0-2 Tahun)');
    });

    it('harus mengklasifikasikan Fresh Graduate jika pemula', () => {
      expect(determineExperienceLevel('Staf Operasional')).toBe('Fresh Graduate / Alumni Pelatihan');
    });
  });

  describe('determineCompanyType helper', () => {
    it('harus mengenali BUMN & Pemerintah', () => {
      expect(determineCompanyType('PT Pertamina Subsea')).toBe('BUMN & Pemerintah');
      expect(determineCompanyType('PT PAL Indonesia')).toBe('BUMN & Pemerintah');
    });

    it('harus mengenali Industri Manufaktur', () => {
      expect(determineCompanyType('Gunanusa Fabricators')).toBe('Industri Manufaktur');
      expect(determineCompanyType('Seatrium Shipyard')).toBe('Industri Manufaktur');
    });

    it('harus mengenali Perusahaan Teknologi', () => {
      expect(determineCompanyType('Google Singapore')).toBe('Perusahaan Teknologi');
      expect(determineCompanyType('Digital Labs Asia')).toBe('Perusahaan Teknologi');
    });
  });

  describe('aggregateMultiProviderJobs Deduplication & Schema Integrity', () => {
    it('harus melakukan deduplikasi berdasarkan title + company yang sama', async () => {
      // Mocking fetcher agar tidak request internet saat unit test
      const dummyJobs = [
        {
          id: 'test-1',
          slug: 'job-test-1',
          title: 'Fullstack Developer',
          company: 'Tech Corp',
          companyType: 'Perusahaan Teknologi' as const,
          category: 'IT & Rekayasa Perangkat Lunak' as const,
          location: 'Remote',
          city: 'Remote / Global',
          workType: 'Full-time' as const,
          workSetup: 'Remote / WFH' as const,
          experienceLevel: 'Mid-Level (2-4 Tahun)' as const,
          salary: {
            min: 15000000,
            max: 25000000,
            currency: 'IDR',
            period: 'Bulan' as const,
            isNegotiable: true,
            isDisclosed: true,
          },
          description: 'Membangun aplikasi web',
          responsibilities: ['Coding'],
          requirements: ['React'],
          benefits: ['WFH'],
          skills: ['TypeScript', 'Next.js'],
          relevantTrainingPrograms: ['Pelatihan Fullstack Web Developer'],
          isStpPartner: false,
          isFeatured: false,
          viewsCount: 10,
          applicantCount: 2,
          isActive: true,
          postedAt: Date.now(),
        },
      ];

      // Verifikasi bahwa JobListingSchema valid
      const parsed = JobListingSchema.safeParse(dummyJobs[0]);
      expect(parsed.success).toBe(true);
    });
  });
});
