// src/__tests__/jobs.test.ts
import { describe, it, expect } from 'vitest';
import {
  JobListing,
  JobListingSchema,
  JobAiMatchRequestSchema,
  JobAiMatchResponseSchema,
} from '@/types/job.types';
import { filterAndSortJobs } from '@/services/job.service';

const MOCK_TEST_JOBS: JobListing[] = [
  {
    id: 'test-job-01',
    slug: 'junior-software-qa-engineer',
    title: 'Junior Software QA & Automation Engineer',
    company: 'Shopee Solo Technopark Hub',
    companyType: 'Startup / Industri',
    category: 'IT & Rekayasa Perangkat Lunak',
    location: 'Surakarta, Jawa Tengah',
    city: 'Surakarta',
    workType: 'Full-time',
    workSetup: 'On-site (Solo Technopark)',
    experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
    salary: { min: 5500000, max: 8000000, currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true },
    description: 'Pengujian perangkat lunak manual dan otomatis.',
    responsibilities: ['Menulis test case', 'Automation testing'],
    requirements: ['Memahami QA', 'Pengalaman Postman'],
    benefits: ['Asuransi kesehatan'],
    skills: ['QA', 'Cypress', 'Postman'],
    relevantTrainingPrograms: ['Bootcamp Software Quality Assurance', 'Bootcamp Fullstack Web'],
    applicationUrl: 'https://shopee.co.id/careers',
    applySource: 'LinkedIn',
    source: 'jsearch_realtime',
    isStpPartner: true,
    isFeatured: true,
    postedAt: Date.now() - 100000,
    deadlineAt: Date.now() + 1000000,
    viewsCount: 100,
    applicantCount: 5,
    isActive: true,
  },
  {
    id: 'test-job-02',
    slug: 'cnc-machinist-operator',
    title: 'Operator Mesin CNC Milling 5-Axis',
    company: 'PT ATMI Solo Presisi',
    companyType: 'Startup / Industri',
    category: 'Manufaktur Presisi & Mekatronika',
    location: 'Solo, Jawa Tengah',
    city: 'Surakarta',
    workType: 'Full-time',
    workSetup: 'On-site (Solo Technopark)',
    experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
    salary: { min: 4500000, max: 6500000, currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true },
    description: 'Operator mesin CNC presisi tinggi.',
    responsibilities: ['Operasi mesin CNC', 'Quality check'],
    requirements: ['Memahami G-Code'],
    benefits: ['Tunjangan shift'],
    skills: ['CNC', 'Mastercam', 'G-Code'],
    relevantTrainingPrograms: ['Pelatihan Pemrograman & Pengoperasian Mesin CNC Milling'],
    applicationUrl: 'https://atmi.co.id/karir',
    applySource: 'Indeed',
    source: 'jsearch_realtime',
    isStpPartner: true,
    isFeatured: false,
    postedAt: Date.now() - 50000,
    deadlineAt: Date.now() + 1000000,
    viewsCount: 80,
    applicantCount: 2,
    isActive: true,
  },
];

describe('Bursa Karir & Talenta Alumni Solo Technopark', () => {
  describe('1. Zod Schema Integrity', () => {
    it('seluruh data MOCK_TEST_JOBS harus valid sesuai JobListingSchema', () => {
      expect(MOCK_TEST_JOBS.length).toBeGreaterThan(0);
      MOCK_TEST_JOBS.forEach((job) => {
        const result = JobListingSchema.safeParse(job);
        expect(result.success, `Job ${job.id} harus valid: ${JSON.stringify(result.error)}`).toBe(
          true
        );
      });
    });

    it('harus memvalidasi payload request AI Matcher dengan benar', () => {
      const validPayload = {
        jobId: 'test-job-01',
        alumniName: 'Budi Santoso',
        alumniProgram: 'Bootcamp Software Quality Assurance',
        alumniSkills: ['Postman', 'Manual Testing', 'Cypress'],
      };
      const parseResult = JobAiMatchRequestSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);
    });

    it('harus menolak payload AI Matcher tanpa jobId', () => {
      const invalidPayload = {
        alumniName: 'Budi',
      };
      const parseResult = JobAiMatchRequestSchema.safeParse(invalidPayload);
      expect(parseResult.success).toBe(false);
    });
  });

  describe('2. Job Filtering & Search Logic', () => {
    it('harus mampu memfilter lowongan berdasarkan kategori spesifik', () => {
      const res = filterAndSortJobs(MOCK_TEST_JOBS, {
        category: 'Manufaktur Presisi & Mekatronika',
      });
      expect(res.jobs.length).toBe(1);
      res.jobs.forEach((j) => {
        expect(j.category).toBe('Manufaktur Presisi & Mekatronika');
      });
    });

    it('harus mampu memfilter lowongan yang selaras dengan program pelatihan alumni STP', () => {
      const res = filterAndSortJobs(MOCK_TEST_JOBS, {
        trainingProgram: 'Fullstack Web',
      });
      expect(res.jobs.length).toBe(1);
      res.jobs.forEach((j) => {
        const hasProgram = j.relevantTrainingPrograms.some((p) =>
          p.toLowerCase().includes('fullstack web')
        );
        expect(hasProgram).toBe(true);
      });
    });

    it('harus mampu mencari lowongan berdasarkan keyword query', () => {
      const res = filterAndSortJobs(MOCK_TEST_JOBS, {
        query: 'Shopee',
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      expect(res.jobs[0].company.toLowerCase()).toContain('shopee');
    });

    it('harus mampu mengurutkan lowongan berdasarkan gaji tertinggi', () => {
      const res = filterAndSortJobs(MOCK_TEST_JOBS, {
        sort: 'salary_high',
      });
      expect(res.jobs.length).toBe(2);
      const firstSalary = res.jobs[0].salary.max || 0;
      const secondSalary = res.jobs[1].salary.max || 0;
      expect(firstSalary).toBeGreaterThanOrEqual(secondSalary);
    });

    it('harus menyaring lowongan khusus mitra resmi STP', () => {
      const res = filterAndSortJobs(MOCK_TEST_JOBS, {
        isStpPartner: true,
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      res.jobs.forEach((j) => {
        expect(j.isStpPartner).toBe(true);
      });
    });
  });

  describe('3. Realtime JSearch RapidAPI Normalizer & STP Mapping', () => {
    it('harus mampu menormalisasi raw job JSearch ke JobListing yang valid', async () => {
      const { normalizeJSearchJob, inferJobCategory, inferRelevantTrainingPrograms } = await import(
        '@/services/jsearch.service'
      );

      const rawMockJob = {
        job_id: 'jsearch-abc-123',
        employer_name: 'PT Mitra Teknologi Mandiri',
        employer_logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef',
        employer_website: 'https://mitratek.com',
        job_employment_type: 'FULLTIME',
        job_title: 'Full Stack React & Node.js Developer',
        job_apply_link: 'https://id.linkedin.com/jobs/view/12345678',
        job_description:
          'Kami mencari Fullstack Web Developer yang menguasai React, Next.js, TypeScript, dan Git untuk penempatan area Surakarta / Solo.',
        job_is_remote: false,
        job_city: 'Surakarta',
        job_state: 'Jawa Tengah',
        job_country: 'ID',
        job_posted_at_timestamp: Math.floor(Date.now() / 1000),
        job_min_salary: 6000000,
        job_max_salary: 8500000,
        job_salary_currency: 'IDR',
        job_salary_period: 'MONTH',
        job_required_skills: ['React', 'TypeScript', 'Node.js', 'Git'],
        job_publisher: 'LinkedIn',
      };

      const normalized = normalizeJSearchJob(rawMockJob);

      expect(normalized.id).toBe('jsearch-jsearch-abc-123');
      expect(normalized.title).toBe('Full Stack React & Node.js Developer');
      expect(normalized.category).toBe('IT & Rekayasa Perangkat Lunak');
      expect(normalized.applicationUrl).toBe('https://id.linkedin.com/jobs/view/12345678');
      expect(normalized.applySource).toBe('LinkedIn');
      expect(normalized.source).toBe('jsearch_realtime');
      expect(normalized.workSetup).toBe('On-site (Solo Technopark)');
      expect(normalized.relevantTrainingPrograms).toContain(
        'Bootcamp Fullstack Web Developer (Next.js & TypeScript)'
      );

      // Harus valid sesuai Zod Schema
      const validation = JobListingSchema.safeParse(normalized);
      expect(validation.success, `Normalized job harus valid: ${JSON.stringify(validation.error)}`).toBe(
        true
      );
    });

    it('harus menginferensikan kategori Cyber Security dan Manufaktur CNC dengan tepat', async () => {
      const { inferJobCategory } = await import('@/services/jsearch.service');

      expect(inferJobCategory('SOC Analyst & Cyber Security Engineer')).toBe(
        'Keamanan Siber (Cyber Security)'
      );
      expect(inferJobCategory('Operator Mesin Milling CNC 5-Axis')).toBe(
        'Manufaktur Presisi & Mekatronika'
      );
      expect(inferJobCategory('AI & Computer Vision Research Intern')).toBe(
        'Kecerdasan Buatan & Sains Data'
      );
      expect(inferJobCategory('3D Blender Artist & Unity Developer')).toBe(
        'Multimedia, Game & Animasi 3D'
      );
    });
  });
});
