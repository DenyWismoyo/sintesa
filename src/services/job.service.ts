// src/services/job.service.ts
import {
  JobListing,
  JobFilterParams,
  JobAiMatchRequest,
  JobAiMatchResponse,
} from '@/types/job.types';
import { MASTER_JOBS } from '@/data/jobs/masterJobs';

export const jobService = {
  /**
   * Mengambil daftar lowongan dengan filter dan pencarian
   */
  async getJobs(filters: JobFilterParams = {}): Promise<{
    jobs: JobListing[];
    total: number;
    categories: { name: string; count: number }[];
  }> {
    // Di browser client, ambil via API endpoint
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (filters.query) params.set('q', filters.query);
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.workType && filters.workType !== 'all') params.set('workType', filters.workType);
      if (filters.workSetup && filters.workSetup !== 'all') params.set('workSetup', filters.workSetup);
      if (filters.experienceLevel && filters.experienceLevel !== 'all') params.set('experienceLevel', filters.experienceLevel);
      if (filters.trainingProgram) params.set('trainingProgram', filters.trainingProgram);
      if (filters.isStpPartner !== undefined) params.set('isStpPartner', String(filters.isStpPartner));
      if (filters.sort) params.set('sort', filters.sort);

      try {
        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch (err) {
        console.warn('[jobService] API fetch gagal, beralih ke local master jobs:', err);
      }
    }

    // Fallback in-memory processing
    return filterAndSortJobs(MASTER_JOBS, filters);
  },

  /**
   * Mengambil detail lowongan pekerjaan berdasarkan ID atau Slug
   */
  async getJobById(idOrSlug: string): Promise<JobListing | null> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/jobs?id=${encodeURIComponent(idOrSlug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.job) return json.job;
        }
      } catch (err) {
        console.warn('[jobService] Detail API fetch gagal, fallback local:', err);
      }
    }

    const found = MASTER_JOBS.find((j) => j.id === idOrSlug || j.slug === idOrSlug);
    return found || null;
  },

  /**
   * Analisis Keselarasan CV / Skill Alumni dengan Lowongan Kerja via Clario AI
   */
  async matchJobWithAI(payload: JobAiMatchRequest): Promise<JobAiMatchResponse> {
    const res = await fetch('/api/jobs/ai-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || 'Gagal memproses analisis AI kesesuaian lowongan.');
    }

    return await res.json();
  },
};

/**
 * Helper internal untuk filtering dan sorting data lowongan
 */
export function filterAndSortJobs(
  allJobs: JobListing[],
  filters: JobFilterParams = {}
): {
  jobs: JobListing[];
  total: number;
  categories: { name: string; count: number }[];
} {
  let result = [...allJobs].filter((job) => job.isActive);

  // Filter Query Search (Title, Company, Description, Skills, Relevant Programs)
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q)) ||
        job.relevantTrainingPrograms.some((p) => p.toLowerCase().includes(q))
    );
  }

  // Filter Kategori
  if (filters.category && filters.category !== 'all') {
    result = result.filter((job) => job.category === filters.category);
  }

  // Filter Tipe Pekerjaan
  if (filters.workType && filters.workType !== 'all') {
    result = result.filter((job) => job.workType === filters.workType);
  }

  // Filter Work Setup
  if (filters.workSetup && filters.workSetup !== 'all') {
    result = result.filter((job) => job.workSetup === filters.workSetup);
  }

  // Filter Pengalaman
  if (filters.experienceLevel && filters.experienceLevel !== 'all') {
    result = result.filter((job) => job.experienceLevel === filters.experienceLevel);
  }

  // Filter Relevan dengan Pelatihan Tertentu
  if (filters.trainingProgram && filters.trainingProgram.trim()) {
    const tp = filters.trainingProgram.toLowerCase().trim();
    result = result.filter((job) =>
      job.relevantTrainingPrograms.some((p) => p.toLowerCase().includes(tp))
    );
  }

  // Filter Mitra Resmi STP
  if (filters.isStpPartner !== undefined) {
    result = result.filter((job) => job.isStpPartner === filters.isStpPartner);
  }

  // Hitung jumlah per kategori dari seluruh data aktif
  const categoryCounts: Record<string, number> = {};
  allJobs.forEach((job) => {
    if (job.isActive) {
      categoryCounts[job.category] = (categoryCounts[job.category] || 0) + 1;
    }
  });

  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Sorting
  if (filters.sort === 'salary_high') {
    result.sort((a, b) => (b.salary.max || 0) - (a.salary.max || 0));
  } else if (filters.sort === 'featured') {
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  } else {
    // Default newest
    result.sort((a, b) => b.postedAt - a.postedAt);
  }

  return {
    jobs: result,
    total: result.length,
    categories,
  };
}
