// src/services/jobAggregator.service.ts
import {
  JobListing,
  JobCategory,
  JobWorkType,
  JobWorkSetup,
  JobExperienceLevel,
  JobCompanyType,
  JobSalary,
} from '@/types/job.types';
import {
  inferJobCategory,
  inferRelevantTrainingPrograms,
} from '@/services/jsearch.service';

/**
 * Helper untuk menentukan WorkType
 */
export function determineWorkType(jobType: any = ''): JobWorkType {
  const str = Array.isArray(jobType) ? jobType.join(' ') : String(jobType || '');
  const lower = str.toLowerCase();
  if (lower.includes('intern') || lower.includes('magang')) return 'Internship / Magang';
  if (lower.includes('contract') || lower.includes('kontrak')) return 'Contract';
  if (lower.includes('part') || lower.includes('paruh')) return 'Part-time';
  if (lower.includes('free') || lower.includes('project')) return 'Freelance / Project';
  return 'Full-time';
}

/**
 * Helper untuk menentukan ExperienceLevel
 */
export function determineExperienceLevel(title: any = ''): JobExperienceLevel {
  const str = Array.isArray(title) ? title.join(' ') : String(title || '');
  const lower = str.toLowerCase();
  if (
    lower.includes('senior') ||
    lower.includes('lead') ||
    lower.includes('principal') ||
    lower.includes('head') ||
    lower.includes('manager') ||
    lower.includes('director') ||
    lower.includes('executive')
  ) {
    return 'Senior (4+ Tahun)';
  }
  if (lower.includes('mid') || lower.includes('intermediate') || lower.includes('staff')) {
    return 'Mid-Level (2-4 Tahun)';
  }
  if (lower.includes('junior') || lower.includes('associate') || lower.includes('jr') || lower.includes('entry')) {
    return 'Junior (0-2 Tahun)';
  }
  return 'Fresh Graduate / Alumni Pelatihan';
}

/**
 * Helper untuk menentukan CompanyType
 */
export function determineCompanyType(company: any = ''): JobCompanyType {
  const str = Array.isArray(company) ? company.join(' ') : String(company || '');
  const lower = str.toLowerCase();
  if (
    lower.includes('pertamina') ||
    lower.includes('bumn') ||
    lower.includes('pln') ||
    lower.includes('pal')
  ) {
    return 'BUMN & Pemerintah';
  }
  if (
    lower.includes('fabricat') ||
    lower.includes('shipyard') ||
    lower.includes('manufaktur') ||
    lower.includes('industr')
  ) {
    return 'Industri Manufaktur';
  }
  if (
    lower.includes('google') ||
    lower.includes('tech') ||
    lower.includes('software') ||
    lower.includes('labs') ||
    lower.includes('digital')
  ) {
    return 'Perusahaan Teknologi';
  }
  return 'Startup / Industri';
}

/**
 * Helper untuk membersihkan tag HTML dari teks deskripsi
 */
export function stripHtml(html: string = ''): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * 1. Provider Remotive (100% Gratis, Tanpa API Key)
 * Sangat unggul untuk Tech, Software Dev, QA, Data, AI, & DevOps
 */
export async function fetchRemotiveJobs(limit: number = 25): Promise<JobListing[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[RemotiveProvider] HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { jobs?: any[] };
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item: any): JobListing => {
      const cleanDesc = stripHtml(item.description || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
      const skills = tags.length > 0 ? tags.slice(0, 6) : ['Remote', 'Software'];
      const relevantPrograms = inferRelevantTrainingPrograms(category, [
        ...skills,
        item.title,
      ]);

      // Parsing estimasi gaji dari string Remotive (mis: "$45-$120/Hour", "$80,000 - $100,000")
      let salaryMin: number | undefined = undefined;
      let salaryMax: number | undefined = undefined;
      let salaryCurrency = 'USD';
      let isDisclosed = false;

      if (item.salary && typeof item.salary === 'string' && item.salary.trim() !== '') {
        isDisclosed = true;
        const numbers = item.salary.match(/\d+([.,]\d+)?/g);
        if (numbers && numbers.length >= 2) {
          salaryMin = parseInt(numbers[0].replace(/,/g, ''), 10);
          salaryMax = parseInt(numbers[1].replace(/,/g, ''), 10);
        } else if (numbers && numbers.length === 1) {
          salaryMin = parseInt(numbers[0].replace(/,/g, ''), 10);
        }
      }

      const id = `remotive-${item.id}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.company_name || 'Global Partner',
        companyLogo: item.company_logo || item.company_logo_url || undefined,
        companyType: determineCompanyType(item.company_name || ''),
        location: item.candidate_required_location || 'Global / Remote',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.job_type || 'full_time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.title),
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: salaryCurrency,
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Mengembangkan dan mengelola arsitektur fitur sesuai spesifikasi ${item.title}.`,
          'Berkolaborasi aktif bersama tim engineering lintas zona waktu.',
          'Menerapkan praktik pengujian dan integrasi berkelanjutan (CI/CD).',
        ],
        requirements: [
          `Pengalaman di bidang ${skills.slice(0, 3).join(', ')} atau relevan.`,
          'Kemampuan komunikasi tertulis dan verbal yang baik dalam lingkungan kerja modern.',
        ],
        skills,
        benefits: [
          'Fleksibilitas Kerja Penuh (Remote)',
          'Tunjangan Perangkat & Workspace',
          'Akses Pembelajaran & Pengembangan Karir',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Remotive Hub',
        applicationUrl: item.url,
        postedAt: item.publication_date ? new Date(item.publication_date).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (error: any) {
    console.warn('[RemotiveProvider] Error:', error.message);
    return [];
  }
}

/**
 * 2. Provider Arbeitnow (100% Gratis, Tanpa API Key)
 * Memiliki lowongan Engineering, Automation, Robotics, dan Visa Sponsorship
 */
export async function fetchArbeitnowJobs(): Promise<JobListing[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[ArbeitnowProvider] HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { data?: any[] };
    if (!json.data || !Array.isArray(json.data)) return [];

    // Ambil maksimal 25 lowongan berkualitas
    return json.data.slice(0, 25).map((item: any): JobListing => {
      const cleanDesc = stripHtml(item.description || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
      const skills = tags.length > 0 ? tags.slice(0, 5) : ['Engineering', 'Automation'];
      const relevantPrograms = inferRelevantTrainingPrograms(category, [
        ...skills,
        item.title,
      ]);

      const id = `arbeitnow-${item.slug || Math.random().toString(36).slice(2, 8)}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.company_name || 'International Partner',
        companyType: determineCompanyType(item.company_name || ''),
        location: item.location || (item.remote ? 'Remote' : 'Eropa & Asia'),
        city: item.location?.includes('Jepang') || item.location?.includes('Japan') ? 'Tokyo / Jepang' : 'Global',
        category,
        workType: determineWorkType(item.job_types?.[0] || 'Full-time'),
        workSetup: item.remote ? 'Remote / WFH' : 'On-site',
        experienceLevel: determineExperienceLevel(item.title),
        salary: {
          currency: 'EUR',
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed: false,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Melaksanakan tugas teknis utama pada posisi ${item.title}.`,
          'Memastikan kualitas dan standar kepatuhan teknis berjalan optimal.',
        ],
        requirements: [
          `Pengalaman kerja atau portofolio teruji pada domain ${skills.join(', ')}.`,
          'Disiplin, teliti, dan berorientasi pada penyelesaian masalah.',
        ],
        skills,
        benefits: [
          'Dukungan Relokasi / Visa jika berlaku',
          'Asuransi Kesehatan & Jaminan Hari Tua',
          'Lingkungan Kerja Multikultural',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Arbeitnow Global',
        applicationUrl: item.url,
        postedAt: item.created_at ? item.created_at * 1000 : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (error: any) {
    console.warn('[ArbeitnowProvider] Error:', error.message);
    return [];
  }
}

/**
 * 3. Provider Jobicy (100% Gratis, Tanpa API Key)
 * Menyediakan data gaji terstruktur (salaryMin, salaryMax, salaryCurrency)
 */
export async function fetchJobicyJobs(count: number = 20): Promise<JobListing[]> {
  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=${count}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[JobicyProvider] HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { jobs?: any[] };
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item: any): JobListing => {
      const cleanDesc = stripHtml(item.jobDescription || item.jobExcerpt || '');
      const category = inferJobCategory(item.jobTitle, cleanDesc);
      const skills = [
        ...(Array.isArray(item.jobIndustry) ? item.jobIndustry : [item.jobIndustry || 'Tech']),
        'Problem Solving',
      ].slice(0, 5);
      const relevantPrograms = inferRelevantTrainingPrograms(category, [
        ...skills,
        item.jobTitle,
      ]);

      const hasSalary = Boolean(item.salaryMin || item.salaryMax);
      const id = `jobicy-${item.id}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.jobTitle,
        company: item.companyName || 'Enterprise Partner',
        companyLogo: item.companyLogo || undefined,
        companyType: determineCompanyType(item.companyName || ''),
        location: item.jobGeo || 'Remote Global',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.jobType?.[0] || 'Full-Time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.jobLevel || item.jobTitle),
        salary: {
          min: item.salaryMin ? Number(item.salaryMin) : undefined,
          max: item.salaryMax ? Number(item.salaryMax) : undefined,
          currency: item.salaryCurrency || 'USD',
          period: item.salaryPeriod === 'yearly' || item.salaryPeriod === 'Tahun' ? 'Tahun' : 'Bulan',
          isNegotiable: true,
          isDisclosed: hasSalary,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Bertanggung jawab penuh atas deliverable peran ${item.jobTitle}.`,
          'Berkoordinasi dengan stakeholder terkait untuk mencapai target performa.',
        ],
        requirements: [
          `Penguasaan teknis relevan dengan posisi ${item.jobTitle}.`,
          'Pengalaman kerja mandiri secara profesional.',
        ],
        skills,
        benefits: [
          'Kompensasi Kompetitif Internasional',
          'Jam Kerja Fleksibel',
          'Program Pelatihan Internal',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Jobicy Remote',
        applicationUrl: item.url,
        postedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (error: any) {
    console.warn('[JobicyProvider] Error:', error.message);
    return [];
  }
}

/**
 * 4. Provider Himalayas (100% Gratis, Tanpa API Key)
 * Menyediakan data kompensasi yang sangat akurat dan tagging mendalam
 */
export async function fetchHimalayasJobs(limit: number = 20): Promise<JobListing[]> {
  try {
    const res = await fetch(`https://himalayas.app/jobs/api?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[HimalayasProvider] HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { jobs?: any[] };
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item: any): JobListing => {
      const cleanDesc = stripHtml(item.description || item.excerpt || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const categories: string[] = Array.isArray(item.categories) ? item.categories : [];
      const skills = categories.length > 0 ? categories.slice(0, 5) : ['Software Engineering'];
      const relevantPrograms = inferRelevantTrainingPrograms(category, [
        ...skills,
        item.title,
      ]);

      const hasSalary = Boolean(item.minSalary || item.maxSalary);
      const rawGuid = String(item.guid || item.title || '').replace(/[^a-zA-Z0-9_-]/g, '');
      const guidSuffix = rawGuid.length > 20 ? rawGuid.slice(-20) : rawGuid || Math.random().toString(36).slice(2, 8);
      const id = `himalayas-${guidSuffix}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.companyName || 'Technology Innovator',
        companyLogo: item.companyLogo || undefined,
        companyType: determineCompanyType(item.companyName || ''),
        location: Array.isArray(item.locationRestrictions)
          ? item.locationRestrictions.join(', ')
          : 'Worldwide / Remote',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.employmentType || 'Full-time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.seniority || item.title),
        salary: {
          min: item.minSalary ? Number(item.minSalary) : undefined,
          max: item.maxSalary ? Number(item.maxSalary) : undefined,
          currency: item.currency || 'USD',
          period: item.salaryPeriod === 'yearly' || item.salaryPeriod === 'Tahun' ? 'Tahun' : 'Bulan',
          isNegotiable: true,
          isDisclosed: hasSalary,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Menjalankan siklus rekayasa dan pengembangan untuk ${item.title}.`,
          'Menulis kode berkualitas tinggi, modular, dan dapat diuji.',
        ],
        requirements: [
          `Kemahiran mendalam dalam keahlian ${skills.join(', ')}.`,
          'Berorientasi pada inovasi dan kepuasan pengguna.',
        ],
        skills,
        benefits: [
          'Gaji Standar Global Berdaya Saing',
          'Tunjangan Kesehatan Lengkap',
          'Peralatan Kerja Disediakan',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Himalayas App',
        applicationUrl: item.applicationLink,
        postedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (error: any) {
    console.warn('[HimalayasProvider] Error:', error.message);
    return [];
  }
}

/**
 * 5. Multi-Provider Aggregator Engine Utama
 * Mengumpulkan lowongan secara paralel dari seluruh open API dan menyatukannya
 */
export async function aggregateMultiProviderJobs(options: {
  includeRemotive?: boolean;
  includeArbeitnow?: boolean;
  includeJobicy?: boolean;
  includeHimalayas?: boolean;
} = {}): Promise<JobListing[]> {
  const {
    includeRemotive = true,
    includeArbeitnow = true,
    includeJobicy = true,
    includeHimalayas = true,
  } = options;

  console.log('[JobAggregator] Memulai agregasi paralel dari multi-provider open API...');

  const tasks: Promise<JobListing[]>[] = [];
  if (includeRemotive) tasks.push(fetchRemotiveJobs(30));
  if (includeArbeitnow) tasks.push(fetchArbeitnowJobs());
  if (includeJobicy) tasks.push(fetchJobicyJobs(25));
  if (includeHimalayas) tasks.push(fetchHimalayasJobs(25));

  const results = await Promise.allSettled(tasks);
  const collectedJobs: JobListing[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      collectedJobs.push(...res.value);
    }
  }

  // Deduplikasi berdasarkan kombinasi normalized Title + Company
  const seenKey = new Set<string>();
  const uniqueJobs: JobListing[] = [];

  for (const job of collectedJobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      uniqueJobs.push(job);
    }
  }

  console.log(`[JobAggregator] Berhasil menghimpun ${uniqueJobs.length} lowongan unik dari Open API.`);
  return uniqueJobs;
}
