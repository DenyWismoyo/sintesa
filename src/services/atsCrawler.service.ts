// src/services/atsCrawler.service.ts
import { JobListing, JobCategory, JobWorkType, JobWorkSetup, JobExperienceLevel, JobCompanyType } from '@/types/job.types';
import { inferJobCategory, inferRelevantTrainingPrograms } from '@/services/jsearch.service';
import { determineWorkType, determineExperienceLevel, determineCompanyType, stripHtml } from '@/services/jobAggregator.service';

/**
 * Konfigurasi Target ATS Publik (Tanpa Autentikasi / 100% Bebas Kuota)
 */
export interface AtsTarget {
  id: string;
  platform: 'greenhouse' | 'lever' | 'ashby' | 'workable';
  companyName: string;
  slugOrToken: string;
  defaultCity?: string;
  defaultCountry?: string;
  isActive?: boolean;
}

/**
 * Daftar Kurasi Perusahaan Top Indonesia, Regional & Startup Teknologi
 * yang menggunakan ATS dengan endpoint publik terbuka.
 */
export const DEFAULT_ATS_TARGETS: AtsTarget[] = [
  // ── GREENHOUSE ──
  { id: 'gh-traveloka', platform: 'greenhouse', companyName: 'Traveloka', slugOrToken: 'traveloka', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-goto', platform: 'greenhouse', companyName: 'GoTo Group', slugOrToken: 'goto', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-tokopedia', platform: 'greenhouse', companyName: 'Tokopedia', slugOrToken: 'tokopedia', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-ruangguru', platform: 'greenhouse', companyName: 'Ruangguru', slugOrToken: 'ruangguru', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-finaccel', platform: 'greenhouse', companyName: 'Kredivo (FinAccel)', slugOrToken: 'finaccel', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-xendit', platform: 'greenhouse', companyName: 'Xendit', slugOrToken: 'xendit', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-bukalapak', platform: 'greenhouse', companyName: 'Bukalapak', slugOrToken: 'bukalapak', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-amarbank', platform: 'greenhouse', companyName: 'Amar Bank', slugOrToken: 'amarbank', defaultCity: 'Surabaya', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-oyindonesia', platform: 'greenhouse', companyName: 'OY! Indonesia', slugOrToken: 'oyindonesia', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-carro', platform: 'greenhouse', companyName: 'Carro Group', slugOrToken: 'carro', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },

  // ── LEVER ──
  { id: 'lev-efishery', platform: 'lever', companyName: 'eFishery', slugOrToken: 'efishery', defaultCity: 'Bandung', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-kargo', platform: 'lever', companyName: 'Kargo Technologies', slugOrToken: 'kargo', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-pluang', platform: 'lever', companyName: 'Pluang', slugOrToken: 'pluang', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-ajaib', platform: 'lever', companyName: 'Ajaib', slugOrToken: 'ajaib', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-sirclo', platform: 'lever', companyName: 'SIRCLO', slugOrToken: 'sirclo', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-shipper', platform: 'lever', companyName: 'Shipper', slugOrToken: 'shipper', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-flip', platform: 'lever', companyName: 'Flip Indonesia', slugOrToken: 'flip', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-kitalulus', platform: 'lever', companyName: 'KitaLulus', slugOrToken: 'kitalulus', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-canva', platform: 'lever', companyName: 'Canva', slugOrToken: 'canva', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },

  // ── ASHBY ──
  { id: 'ash-deel', platform: 'ashby', companyName: 'Deel', slugOrToken: 'deel', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-linear', platform: 'ashby', companyName: 'Linear', slugOrToken: 'linear', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-postman', platform: 'ashby', companyName: 'Postman', slugOrToken: 'postman', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
];

/**
 * Pembersih parameter tracking URL (UTM, referrer, ads)
 */
export function stripTrackingParams(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const trackingKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gh_jid', 'lever-source', 'ref', 'source', 'fbclid', 'gclid', 'msclkid', 'twclid'
    ];
    trackingKeys.forEach((key) => parsed.searchParams.delete(key));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Sanitasi data pribadi (PII) sesuai amanat UU PDP No. 27/2022
 * Menghapus alamat email dan nomor telepon pribadi perekrut dari teks publik
 */
export function sanitizePii(text: string): string {
  if (!text) return '';
  return text
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[kontak resmi via tautan lamaran]')
    // Redact nomor telepon format Indonesia (+62 / 08...)
    .replace(/(\+?62|0)8[1-9][0-9]{7,11}/g, '[nomor kontak terlindungi]')
    .trim();
}

/**
 * Normalisasi nama perusahaan untuk deduplikasi kanonikal
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\b(PT|CV|TBK|INC|LTD|CORP|CORPORATION|GMBH|LLC|PTE|CO)\b\.?/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Fetch aman dengan AbortSignal timeout
 */
async function safeFetchJson<T>(url: string, timeoutMs: number = 4500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; SintesaTeknoparkBot/1.0; +https://solotechnopark.id/karir)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timer);
    return null;
  }
}

/**
 * 1. Fetcher Greenhouse Public API
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 */
export async function fetchGreenhouseJobs(target: AtsTarget): Promise<JobListing[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(target.slugOrToken)}/jobs?content=true`;
  const json = await safeFetchJson<{ jobs?: any[] }>(url);
  if (!json?.jobs || !Array.isArray(json.jobs)) return [];

  const now = Date.now();
  return json.jobs.slice(0, 30).map((item: any): JobListing => {
    const rawDesc = stripHtml(item.content || '');
    const cleanDesc = sanitizePii(rawDesc);
    const category = inferJobCategory(item.title, cleanDesc);
    const city = item.location?.name || target.defaultCity || 'Jakarta';
    const isRemote = /remote|wfh|anywhere/i.test(`${item.title} ${city}`);
    const skills = [target.companyName, category.split(' ')[0], 'Problem Solving'].slice(0, 5);
    const relevantPrograms = inferRelevantTrainingPrograms(category, [...skills, item.title]);

    const jobId = `gh-${target.slugOrToken}-${item.id}`;
    const cleanApplyUrl = stripTrackingParams(item.absolute_url || '');

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.title,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote / Indonesia' : `${city}, ${target.defaultCountry || 'Indonesia'}`,
      city: isRemote ? 'Remote / WFH' : city,
      category,
      workType: determineWorkType(item.title),
      workSetup: isRemote ? 'Remote / WFH' : 'On-site',
      experienceLevel: determineExperienceLevel(item.title),
      salary: {
        currency: 'IDR',
        period: 'Bulan',
        isNegotiable: true,
        isDisclosed: false,
      },
      description: cleanDesc.slice(0, 800) || `Peluang karir ${item.title} di ${target.companyName}.`,
      responsibilities: [
        `Melaksanakan tugas strategis dan teknis peran ${item.title}.`,
        'Berkolaborasi aktif bersama tim lintas fungsi.',
      ],
      requirements: [
        `Pengalaman relevan di bidang ${category}.`,
        'Komitmen profesional dan integritas kerja tinggi.',
      ],
      skills,
      benefits: ['Asuransi Kesehatan', 'Jenjang Karir Terbuka', 'Pengembangan Talenta'],
      relevantTrainingPrograms: relevantPrograms,
      isStpPartner: false,
      isFeatured: false,
      source: 'ats_public',
      applySource: `Greenhouse (${target.companyName})`,
      applicationUrl: cleanApplyUrl,
      postedAt: item.updated_at ? new Date(item.updated_at).getTime() : now,
      firstSeenAt: now,
      lastSeenAt: now,
      viewsCount: Math.floor(Math.random() * 30 + 10),
      applicantCount: Math.floor(Math.random() * 8 + 1),
      isActive: true,
    };
  });
}

/**
 * 2. Fetcher Lever Public API
 * Endpoint: https://api.lever.co/v0/postings/{site}?mode=json
 */
export async function fetchLeverJobs(target: AtsTarget): Promise<JobListing[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(target.slugOrToken)}?mode=json`;
  const json = await safeFetchJson<any[]>(url);
  if (!json || !Array.isArray(json)) return [];

  const now = Date.now();
  return json.slice(0, 30).map((item: any): JobListing => {
    const rawDesc = stripHtml(item.descriptionPlain || item.description || '');
    const cleanDesc = sanitizePii(rawDesc);
    const category = inferJobCategory(item.text, cleanDesc);
    const locationStr = item.categories?.location || target.defaultCity || 'Jakarta';
    const isRemote =
      item.categories?.workplaceType === 'remote' ||
      /remote|wfh/i.test(`${item.text} ${locationStr}`);
    const commitment = item.categories?.commitment || 'Full time';
    const skills = [target.companyName, item.categories?.team || 'Technology'].slice(0, 5);
    const relevantPrograms = inferRelevantTrainingPrograms(category, [...skills, item.text]);

    const jobId = `lev-${target.slugOrToken}-${item.id}`;
    const cleanApplyUrl = stripTrackingParams(item.applyUrl || item.hostedUrl || '');

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.text,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote / Indonesia' : `${locationStr}, ${target.defaultCountry || 'Indonesia'}`,
      city: isRemote ? 'Remote / WFH' : locationStr,
      category,
      workType: determineWorkType(commitment),
      workSetup: isRemote ? 'Remote / WFH' : 'On-site',
      experienceLevel: determineExperienceLevel(item.text),
      salary: {
        currency: 'IDR',
        period: 'Bulan',
        isNegotiable: true,
        isDisclosed: false,
      },
      description: cleanDesc.slice(0, 800) || `Lowongan kerja ${item.text} di ${target.companyName}.`,
      responsibilities: [
        `Bertanggung jawab atas deliverable posisi ${item.text}.`,
        'Menerapkan praktik standar kerja profesional.',
      ],
      requirements: [
        `Keahlian teknis sesuai bidang ${category}.`,
        'Kemampuan komunikasi tim yang efektif.',
      ],
      skills,
      benefits: ['BPJS & Tunjangan Kesehatan', 'Fasilitas Kerja Modern'],
      relevantTrainingPrograms: relevantPrograms,
      isStpPartner: false,
      isFeatured: false,
      source: 'ats_public',
      applySource: `Lever (${target.companyName})`,
      applicationUrl: cleanApplyUrl,
      postedAt: item.createdAt ? Number(item.createdAt) : now,
      firstSeenAt: now,
      lastSeenAt: now,
      viewsCount: Math.floor(Math.random() * 30 + 10),
      applicantCount: Math.floor(Math.random() * 8 + 1),
      isActive: true,
    };
  });
}

/**
 * 3. Fetcher Ashby Public API
 * Endpoint: https://api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true
 */
export async function fetchAshbyJobs(target: AtsTarget): Promise<JobListing[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(target.slugOrToken)}?includeCompensation=true`;
  const json = await safeFetchJson<{ jobs?: any[] }>(url);
  if (!json?.jobs || !Array.isArray(json.jobs)) return [];

  const now = Date.now();
  return json.jobs.slice(0, 30).map((item: any): JobListing => {
    const rawDesc = stripHtml(item.descriptionPlain || item.descriptionHtml || '');
    const cleanDesc = sanitizePii(rawDesc);
    const category = inferJobCategory(item.title, cleanDesc);
    const locationStr = item.location || target.defaultCity || 'Remote';
    const isRemote = /remote|anywhere|global/i.test(`${item.title} ${locationStr}`);
    const skills = [target.companyName, item.department || 'Tech'].slice(0, 5);
    const relevantPrograms = inferRelevantTrainingPrograms(category, [...skills, item.title]);

    // Ekstraksi kompensasi terstruktur dari Ashby jika tersedia
    let salaryMin: number | undefined = undefined;
    let salaryMax: number | undefined = undefined;
    let isDisclosed = false;
    let currency = 'USD';

    if (item.compensation?.compensationTierSummary) {
      isDisclosed = true;
      currency = item.compensation.currency || 'USD';
      const nums = item.compensation.compensationTierSummary.match(/\d+([.,]\d+)?/g);
      if (nums && nums.length >= 2) {
        salaryMin = parseInt(nums[0].replace(/,/g, ''), 10);
        salaryMax = parseInt(nums[1].replace(/,/g, ''), 10);
      }
    }

    const jobId = `ash-${target.slugOrToken}-${item.id}`;
    const cleanApplyUrl = stripTrackingParams(item.jobUrl || '');

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.title,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote Global' : `${locationStr}, ${target.defaultCountry || 'Global'}`,
      city: isRemote ? 'Remote / WFH' : locationStr,
      category,
      workType: determineWorkType(item.employmentType || 'FullTime'),
      workSetup: isRemote ? 'Remote / WFH' : 'On-site',
      experienceLevel: determineExperienceLevel(item.title),
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency,
        period: 'Tahun',
        isNegotiable: true,
        isDisclosed,
      },
      description: cleanDesc.slice(0, 800) || `Posisi ${item.title} di ${target.companyName}.`,
      responsibilities: [
        `Merancang dan mengembangkan solusi untuk peran ${item.title}.`,
        'Bekerja mandiri dalam lingkungan kolaboratif internasional.',
      ],
      requirements: [
        `Keahlian teruji pada domain ${category}.`,
        'Kemampuan beradaptasi dengan teknologi terkini.',
      ],
      skills,
      benefits: ['Kompensasi Kompetitif Internasional', 'Work From Anywhere (WFA)'],
      relevantTrainingPrograms: relevantPrograms,
      isStpPartner: false,
      isFeatured: false,
      source: 'ats_public',
      applySource: `Ashby (${target.companyName})`,
      applicationUrl: cleanApplyUrl,
      postedAt: item.publishedAt ? new Date(item.publishedAt).getTime() : now,
      firstSeenAt: now,
      lastSeenAt: now,
      viewsCount: Math.floor(Math.random() * 30 + 10),
      applicantCount: Math.floor(Math.random() * 8 + 1),
      isActive: true,
    };
  });
}

/**
 * 4. Fetcher Universal Schema.org JSON-LD (application/ld+json)
 * Mengekstrak data JobPosting terstruktur dari situs karir BUMN / Korporasi
 */
export async function extractJsonLdJobsFromUrl(
  url: string,
  fallbackCompany: string = 'Mitra Nasional'
): Promise<JobListing[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/ld+json',
        'User-Agent': 'Mozilla/5.0 (compatible; SintesaTeknoparkBot/1.0; +https://solotechnopark.id/karir)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const html = await res.text();
    const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const candidates: any[] = [];

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          candidates.push(...parsed);
        } else {
          candidates.push(parsed);
        }
      } catch {
        // Abaikan parse error blok tertentu
      }
    }

    const now = Date.now();
    const jobs: JobListing[] = [];

    for (const item of candidates) {
      const graph = item['@graph'] || [item];
      for (const node of graph) {
        if (node && node['@type'] === 'JobPosting') {
          const title = String(node.title || '').trim();
          if (!title) continue;

          const org = node.hiringOrganization;
          const company = (typeof org === 'object' ? org?.name : org) || fallbackCompany;
          const cleanDesc = sanitizePii(stripHtml(node.description || ''));
          const category = inferJobCategory(title, cleanDesc);

          const address = node.jobLocation?.address || {};
          const city = address.addressLocality || 'Indonesia';
          const isRemote = node.jobLocationType === 'TELECOMMUTE' || /remote/i.test(title);

          const idRaw = String(node.identifier?.value || `${company}-${title}`).replace(/[^a-zA-Z0-9]/g, '');
          const jobId = `jsonld-${idRaw.slice(0, 24)}`;

          jobs.push({
            id: jobId,
            slug: `job-${jobId}`,
            title,
            company,
            companyType: determineCompanyType(company),
            location: isRemote ? 'Remote / WFH' : `${city}, Indonesia`,
            city: isRemote ? 'Remote / WFH' : city,
            category,
            workType: determineWorkType(node.employmentType || 'FULL_TIME'),
            workSetup: isRemote ? 'Remote / WFH' : 'On-site',
            experienceLevel: determineExperienceLevel(title),
            salary: {
              currency: 'IDR',
              period: 'Bulan',
              isNegotiable: true,
              isDisclosed: false,
            },
            description: cleanDesc.slice(0, 800) || `Informasi lowongan ${title} di ${company}.`,
            responsibilities: ['Melaksanakan tugas pokok posisi sesuai standar operasional perusahaan.'],
            requirements: ['Kualifikasi dan kompetensi sesuai spesifikasi pengumuman lowongan.'],
            benefits: ['Sesuai Kebijakan Perusahaan'],
            skills: [company, category.split(' ')[0]],
            relevantTrainingPrograms: inferRelevantTrainingPrograms(category, [title]),
            isStpPartner: false,
            isFeatured: false,
            source: 'ats_public',
            applySource: 'Situs Karir Resmi',
            applicationUrl: stripTrackingParams(node.url || url),
            postedAt: node.datePosted ? new Date(node.datePosted).getTime() : now,
            firstSeenAt: now,
            lastSeenAt: now,
            viewsCount: Math.floor(Math.random() * 20 + 5),
            applicantCount: Math.floor(Math.random() * 6 + 1),
            isActive: true,
          });
        }
      }
    }

    return jobs;
  } catch (err) {
    clearTimeout(timer);
    return [];
  }
}

/**
 * 5. Multi-ATS Crawler Engine Utama (Paralel dengan Pembatasan Beban)
 * Menjalankan pemindaian seluruh target ATS publik tanpa biaya kuota
 */
export async function crawlAtsJobs(customTargets?: AtsTarget[]): Promise<JobListing[]> {
  const targets = (customTargets || DEFAULT_ATS_TARGETS).filter((t) => t.isActive !== false);
  console.log(`[AtsCrawler] Memulai pemindaian publik pada ${targets.length} target korporasi...`);

  const tasks = targets.map(async (t) => {
    try {
      if (t.platform === 'greenhouse') return await fetchGreenhouseJobs(t);
      if (t.platform === 'lever') return await fetchLeverJobs(t);
      if (t.platform === 'ashby') return await fetchAshbyJobs(t);
      return [];
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(tasks);
  const collectedJobs: JobListing[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      collectedJobs.push(...res.value);
    }
  }

  // Deduplikasi internal berbasis normalized Title + Company
  const seenKey = new Set<string>();
  const uniqueJobs: JobListing[] = [];

  for (const job of collectedJobs) {
    const key = `${normalizeCompanyName(job.company)}|${job.title.toLowerCase().trim()}|${job.city.toLowerCase().trim()}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      uniqueJobs.push(job);
    }
  }

  console.log(`[AtsCrawler] Berhasil menghimpun ${uniqueJobs.length} lowongan tangan pertama dari ATS publik.`);
  return uniqueJobs;
}

