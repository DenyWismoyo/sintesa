// src/services/job.service.ts
import {
  JobListing,
  JobFilterParams,
  JobAiMatchRequest,
  JobAiMatchResponse,
} from '@/types/job.types';
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
      if (filters.source && filters.source !== 'all') params.set('source', filters.source);
      if (filters.locationRegion && filters.locationRegion !== 'all') params.set('locationRegion', filters.locationRegion);
      if (filters.freshness && filters.freshness !== 'all') params.set('freshness', filters.freshness);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.includeInactive) params.set('includeInactive', 'true');
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);

      try {
        const fetchOptions: RequestInit = filters.includeInactive ? { cache: 'no-store' } : {};
        if (filters.includeInactive) {
          params.set('_t', String(Date.now()));
        }
        const res = await fetch(`/api/jobs?${params.toString()}`, fetchOptions);
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch (err) {
        console.warn('[jobService] API fetch gagal, beralih ke database snapshot:', err);
      }
    }

    // Fallback database snapshot murni internet
    try {
      const { jobDbService } = await import('@/services/jobDb.service');
      const allJobs = await jobDbService.getJobsFromFirestore();
      return filterAndSortJobs(allJobs, filters);
    } catch {
      return filterAndSortJobs([], filters);
    }
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
        console.warn('[jobService] Detail API fetch gagal, fallback database:', err);
      }
    }

    try {
      const { jobDbService } = await import('@/services/jobDb.service');
      return await jobDbService.getJobById(idOrSlug);
    } catch {
      return null;
    }
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
  let result = [...allJobs];

  // Filter Status Aktif
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      result = result.filter((job) => job.isActive);
    } else if (filters.status === 'inactive') {
      result = result.filter((job) => !job.isActive);
    }
  } else if (!filters.includeInactive) {
    // Default untuk publik: hanya tampilkan lowongan yang aktif
    result = result.filter((job) => job.isActive !== false);
  }

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

  // Filter Relevan dengan Pelatihan Tertentu (Bidirectional & Tokenized Intelligent Matching)
  if (filters.trainingProgram && filters.trainingProgram.trim()) {
    const tp = filters.trainingProgram.toLowerCase().trim();

    // Token kata kunci penting (mengabaikan stopwords umum)
    const stopWords = new Set([
      'pelatihan', 'bootcamp', 'diklat', 'sertifikasi', 'standar', 'dan', 'atau', 'dengan',
      'untuk', 'resmi', 'operator', 'tingkat', 'level', 'program', 'ahli', 'studi', 'solo',
      'technopark', 'stp', 'the', 'and', 'for', 'with', 'in', 'of', 'dasar', 'lanjut'
    ]);

    const tokens = tp
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((tok) => tok.length >= 3 && !stopWords.has(tok));

    result = result.filter((job) => {
      // 1. Direct bidirectional matching pada relevantTrainingPrograms
      const matchDirect = (job.relevantTrainingPrograms || []).some((p) => {
        const pLower = p.toLowerCase();
        return pLower.includes(tp) || tp.includes(pLower);
      });
      if (matchDirect) return true;

      // 2. Tokenized matching pada relevantTrainingPrograms
      if (tokens.length > 0) {
        const matchTokensOnPrograms = (job.relevantTrainingPrograms || []).some((p) => {
          const pLower = p.toLowerCase();
          return tokens.some((tok) => pLower.includes(tok));
        });
        if (matchTokensOnPrograms) return true;

        // 3. Fallback matching pada job.title, job.category, dan job.skills
        const jobTitleLower = (job.title || '').toLowerCase();
        const categoryLower = (job.category || '').toLowerCase();
        const skillsLower = (job.skills || []).join(' ').toLowerCase();

        const matchTokensOnJob = tokens.some(
          (tok) =>
            jobTitleLower.includes(tok) ||
            categoryLower.includes(tok) ||
            skillsLower.includes(tok)
        );
        if (matchTokensOnJob) return true;
      }

      return false;
    });
  }

  // Filter Mitra Resmi STP
  if (filters.isStpPartner !== undefined) {
    result = result.filter((job) => job.isStpPartner === filters.isStpPartner);
  }

  // Filter Sumber Lowongan (Mitra STP vs Realtime JSearch)
  if (filters.source && filters.source !== 'all') {
    if (filters.source === 'stp_partner') {
      result = result.filter((job) => job.source === 'stp_partner' || job.isStpPartner);
    } else if (filters.source === 'jsearch_realtime') {
      result = result.filter((job) => job.source === 'jsearch_realtime');
    }
  }

  // Filter Wilayah / Regional Geografis
  if (filters.locationRegion && filters.locationRegion !== 'all') {
    const soloKeywords = ['solo', 'surakarta', 'sukoharjo', 'karanganyar', 'sragen', 'boyolali', 'klaten', 'wonogiri', 'stp', 'technopark'];
    const jaboKeywords = ['jakarta', 'bogor', 'depok', 'tangerang', 'bekasi', 'dki', 'jabodetabek', 'bsd', 'banten', 'cikarang'];
    const jawaKeywords = [
      ...soloKeywords,
      ...jaboKeywords,
      'bandung', 'semarang', 'surabaya', 'yogyakarta', 'jogja', 'malang', 'sidoarjo', 'cirebon', 'jawa', 'java', 'jateng', 'jatim', 'jabar', 'diy'
    ];
    const foreignKeywords = [
      'singapore', 'singapura', 'malaysia', 'kuala lumpur', 'tokyo', 'japan', 'jepang',
      'philippines', 'filipina', 'thailand', 'bangkok', 'vietnam', 'hanoi', 'worldwide',
      'anywhere', 'global', 'remote worldwide', 'united states', 'australia', 'germany'
    ];

    result = result.filter((job) => {
      const loc = (job.location + ' ' + (job.city || '')).toLowerCase();
      const setup = job.workSetup;

      if (filters.locationRegion === 'solo_raya') {
        return soloKeywords.some((k) => loc.includes(k)) || setup === 'On-site (Solo Technopark)';
      }
      if (filters.locationRegion === 'jabodetabek') {
        return jaboKeywords.some((k) => loc.includes(k));
      }
      if (filters.locationRegion === 'jawa') {
        return jawaKeywords.some((k) => loc.includes(k));
      }
      if (filters.locationRegion === 'luar_negeri') {
        return (
          foreignKeywords.some((k) => loc.includes(k)) ||
          (!loc.includes('indonesia') && !jawaKeywords.some((k) => loc.includes(k)) && foreignKeywords.some((k) => loc.includes(k)))
        );
      }
      if (filters.locationRegion === 'luar_jawa') {
        // Lokasi di Indonesia tapi bukan di pulau Jawa
        const isForeign = foreignKeywords.some((k) => loc.includes(k));
        const isJawa = jawaKeywords.some((k) => loc.includes(k));
        return !isForeign && !isJawa;
      }
      return true;
    });
  }

  // Filter Freshness / Periode Kemunculan Data Kumulatif
  if (filters.freshness && filters.freshness !== 'all') {
    const now = Date.now();
    const oneDay = 86400000;
    if (filters.freshness === 'week') {
      const sevenDaysAgo = now - 7 * oneDay;
      result = result.filter((job) => {
        const time = job.lastSeenAt || job.firstSeenAt || job.postedAt;
        return time >= sevenDaysAgo;
      });
    } else if (filters.freshness === 'month') {
      const thirtyDaysAgo = now - 30 * oneDay;
      result = result.filter((job) => {
        const time = job.lastSeenAt || job.firstSeenAt || job.postedAt;
        return time >= thirtyDaysAgo;
      });
    }
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
