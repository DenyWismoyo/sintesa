// src/__tests__/jobs.test.ts
import { describe, it, expect } from 'vitest';
import {
  JobListingSchema,
  JobAiMatchRequestSchema,
  JobAiMatchResponseSchema,
} from '@/types/job.types';
import { MASTER_JOBS } from '@/data/jobs/masterJobs';
import { filterAndSortJobs } from '@/services/job.service';

describe('Bursa Karir & Talenta Alumni Solo Technopark', () => {
  describe('1. Zod Schema Integrity', () => {
    it('seluruh data MASTER_JOBS harus valid sesuai JobListingSchema', () => {
      expect(MASTER_JOBS.length).toBeGreaterThan(0);
      MASTER_JOBS.forEach((job) => {
        const result = JobListingSchema.safeParse(job);
        expect(result.success, `Job ${job.id} harus valid: ${JSON.stringify(result.error)}`).toBe(
          true
        );
      });
    });

    it('harus memvalidasi payload request AI Matcher dengan benar', () => {
      const validPayload = {
        jobId: 'job-shopee-qa-01',
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
      const res = filterAndSortJobs(MASTER_JOBS, {
        category: 'Manufaktur Presisi & Mekatronika',
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      res.jobs.forEach((j) => {
        expect(j.category).toBe('Manufaktur Presisi & Mekatronika');
      });
    });

    it('harus mampu memfilter lowongan yang selaras dengan program pelatihan alumni STP', () => {
      const res = filterAndSortJobs(MASTER_JOBS, {
        trainingProgram: 'Fullstack Web',
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      res.jobs.forEach((j) => {
        const hasProgram = j.relevantTrainingPrograms.some((p) =>
          p.toLowerCase().includes('fullstack web')
        );
        expect(hasProgram).toBe(true);
      });
    });

    it('harus mampu mencari lowongan berdasarkan keyword query', () => {
      const res = filterAndSortJobs(MASTER_JOBS, {
        query: 'Shopee',
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      expect(res.jobs[0].company.toLowerCase()).toContain('shopee');
    });

    it('harus mampu mengurutkan lowongan berdasarkan gaji tertinggi', () => {
      const res = filterAndSortJobs(MASTER_JOBS, {
        sort: 'salary_high',
      });
      expect(res.jobs.length).toBeGreaterThan(1);
      const firstSalary = res.jobs[0].salary.max || 0;
      const secondSalary = res.jobs[1].salary.max || 0;
      expect(firstSalary).toBeGreaterThanOrEqual(secondSalary);
    });

    it('harus menyaring lowongan khusus mitra resmi STP', () => {
      const res = filterAndSortJobs(MASTER_JOBS, {
        isStpPartner: true,
      });
      expect(res.jobs.length).toBeGreaterThan(0);
      res.jobs.forEach((j) => {
        expect(j.isStpPartner).toBe(true);
      });
    });
  });
});
