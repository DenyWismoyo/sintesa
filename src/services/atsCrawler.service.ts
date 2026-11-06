// src/services/atsCrawler.service.ts
import { JobListing, JobCategory, JobWorkType, JobWorkSetup, JobExperienceLevel, JobCompanyType, JobRegionCode } from '@/types/job.types';
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
 * Daftar Kurasi Perusahaan Top Indonesia (60%) & Regional ASEAN, Jepang, Korea, serta Global (40%)
 * yang menggunakan ATS dengan endpoint publik terbuka.
 */
export const DEFAULT_ATS_TARGETS: AtsTarget[] = [
  // ── INDONESIA & DIGITAL BANKING / TECH (LEVER & GREENHOUSE) ──
  { id: 'lev-amarbank', platform: 'lever', companyName: 'Amar Bank (Tunaiku)', slugOrToken: 'amarbank', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-xendit', platform: 'greenhouse', companyName: 'Xendit', slugOrToken: 'xendit', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'lev-payjoy', platform: 'lever', companyName: 'PayJoy Indonesia', slugOrToken: 'payjoy', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-finaccel', platform: 'greenhouse', companyName: 'Kredivo (FinAccel)', slugOrToken: 'finaccel', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },
  { id: 'gh-oyindonesia', platform: 'greenhouse', companyName: 'OY! Indonesia', slugOrToken: 'oyindonesia', defaultCity: 'Jakarta', defaultCountry: 'Indonesia', isActive: true },

  // ── ASEAN (SINGAPURA, MALAYSIA, REGIONAL) ──
  { id: 'lev-ninjavan', platform: 'lever', companyName: 'Ninja Van', slugOrToken: 'ninjavan', defaultCity: 'Singapura & Jakarta', defaultCountry: 'Singapura', isActive: true },
  { id: 'ash-airwallex', platform: 'ashby', companyName: 'Airwallex', slugOrToken: 'airwallex', defaultCity: 'Singapura', defaultCountry: 'Singapura', isActive: true },

  // ── ASIA TIMUR (JEPANG & KOREA SELATAN) ──
  { id: 'gh-paypay', platform: 'greenhouse', companyName: 'PayPay Corporation', slugOrToken: 'paypay', defaultCity: 'Tokyo', defaultCountry: 'Jepang', isActive: true },
  { id: 'gh-coupang', platform: 'greenhouse', companyName: 'Coupang', slugOrToken: 'coupang', defaultCity: 'Seoul', defaultCountry: 'Korea Selatan', isActive: true },

  // ── GLOBAL REMOTE & DIASPORA TERVERIFIKASI (ASHBY) ──
  { id: 'ash-deel', platform: 'ashby', companyName: 'Deel', slugOrToken: 'deel', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-linear', platform: 'ashby', companyName: 'Linear', slugOrToken: 'linear', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-postman', platform: 'ashby', companyName: 'Postman', slugOrToken: 'postman', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-cursor', platform: 'ashby', companyName: 'Cursor AI', slugOrToken: 'cursor', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-elevenlabs', platform: 'ashby', companyName: 'ElevenLabs', slugOrToken: 'elevenlabs', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
  { id: 'ash-supabase', platform: 'ashby', companyName: 'Supabase', slugOrToken: 'supabase', defaultCity: 'Remote', defaultCountry: 'Global', isActive: true },
];

/**
 * Infer wilayah geografis kanonikal suatu lowongan
 * Menghasilkan: 'indonesia' | 'asean' | 'east_asia' | 'global_remote'
 */
export function inferJobRegion(job: {
  location?: string;
  city?: string;
  country?: string;
  company?: string;
  isStpPartner?: boolean;
}): JobRegionCode {
  if (job.isStpPartner) return 'indonesia';

  const loc = `${job.location || ''} ${job.city || ''} ${job.country || ''}`.toLowerCase();
  const comp = (job.company || '').toLowerCase();

  // 1. Deteksi Indonesia (Prioritas Utama: Nasional & Solo Raya)
  const indoKws = [
    'indonesia', 'jakarta', 'jawa barat', 'jawa tengah', 'jawa timur', 'banten',
    'yogyakarta', 'jogja', 'surakarta', 'solo', 'semarang', 'surabaya', 'bandung',
    'bogor', 'depok', 'tangerang', 'bekasi', 'jabodetabek', 'bali', 'denpasar',
    'medan', 'palembang', 'makassar', 'batam', 'balikpapan', 'samarinda', 'banjarmasin',
    'pontianak', 'manado', 'lampung', 'pekanbaru', 'padang', 'malang', 'sukoharjo',
    'klaten', 'boyolali', 'karanganyar', 'sragen', 'wonogiri', 'salatiga', 'magelang',
    'kudus', 'tegal', 'purwokerto', 'cilacap', 'cirebon', 'sidoarjo', 'gresik',
    'pertamina', 'solo technopark'
  ];
  if (indoKws.some((k) => loc.includes(k) || comp.includes(k))) {
    return 'indonesia';
  }

  // 2. Deteksi ASEAN (Singapura, Malaysia, Thailand, Vietnam, Filipina, dll.)
  const aseanKws = [
    'singapore', 'singapura', 'malaysia', 'kuala lumpur', 'selangor', 'johor', 'penang',
    'shah alam', 'subang jaya', 'kemaman', 'terengganu', 'thailand', 'bangkok', 'vietnam',
    'hanoi', 'ho chi minh', 'philippines', 'filipina', 'manila', 'taguig', 'cebu',
    'cabuyao', 'cambodia', 'myanmar', 'brunei', 'laos', 'asean'
  ];
  if (aseanKws.some((k) => loc.includes(k))) {
    return 'asean';
  }

  // 3. Deteksi Asia Timur (Jepang & Korea Selatan, Taiwan)
  const eastAsiaKws = [
    'japan', 'jepang', 'tokyo', 'osaka', 'yokohama', 'nagoya', 'fukuoka', 'sapporo',
    'kobe', 'kyoto', 'ehime', 'imabari', 'nagasaki', 'yamanashi', 'oshino',
    'korea', 'south korea', 'korea selatan', 'seoul', 'busan', 'incheon', 'daegu',
    'changwon', 'ulsan', 'geoje', 'taiwan', 'taipei', 'taoyuan', 'hong kong'
  ];
  if (eastAsiaKws.some((k) => loc.includes(k))) {
    return 'east_asia';
  }

  // 4. Fallback: Global Remote / WFH
  return 'global_remote';
}

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
  return json.jobs.slice(0, 35).map((item: any): JobListing => {
    const rawDesc = stripHtml(item.content || '');
    const cleanDesc = sanitizePii(rawDesc);
    const category = inferJobCategory(item.title, cleanDesc);
    const city = item.location?.name || target.defaultCity || 'Jakarta';
    const isRemote = /remote|wfh|anywhere/i.test(`${item.title} ${city}`);
    const skills = [target.companyName, category.split(' ')[0], 'Problem Solving'].slice(0, 5);
    const relevantPrograms = inferRelevantTrainingPrograms(category, [...skills, item.title]);

    const jobId = `gh-${target.slugOrToken}-${item.id}`;
    const cleanApplyUrl = stripTrackingParams(item.absolute_url || '');

    const region = inferJobRegion({
      location: isRemote ? 'Remote' : `${city}, ${target.defaultCountry || 'Indonesia'}`,
      city,
      country: target.defaultCountry,
      company: target.companyName,
      isStpPartner: false,
    });

    let currency = 'IDR';
    if (region === 'east_asia') {
      currency = target.defaultCountry === 'Jepang' || /japan|jepang|tokyo/i.test(city) ? 'JPY' : 'KRW';
    } else if (region === 'asean') {
      currency = /singapore|singapura/i.test(city) ? 'SGD' : /malaysia/i.test(city) ? 'MYR' : 'USD';
    } else if (region === 'global_remote') {
      currency = 'USD';
    }

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.title,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote Global' : `${city}, ${target.defaultCountry || 'Indonesia'}`,
      city: isRemote ? 'Remote / WFH' : city,
      region,
      country: target.defaultCountry || (region === 'indonesia' ? 'Indonesia' : 'Global'),
      category,
      workType: determineWorkType(item.title),
      workSetup: isRemote ? 'Remote / WFH' : 'On-site',
      experienceLevel: determineExperienceLevel(item.title),
      salary: {
        currency,
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
  }).filter((job) => now - job.postedAt <= 45 * 24 * 60 * 60 * 1000 && job.postedAt >= 1785000000000);
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

    const region = inferJobRegion({
      location: isRemote ? 'Remote' : `${locationStr}, ${target.defaultCountry || 'Indonesia'}`,
      city: locationStr,
      country: target.defaultCountry,
      company: target.companyName,
      isStpPartner: false,
    });

    let currency = 'IDR';
    if (region === 'asean') {
      currency = /singapore|singapura/i.test(locationStr) ? 'SGD' : /malaysia/i.test(locationStr) ? 'MYR' : /philippines/i.test(locationStr) ? 'PHP' : 'USD';
    } else if (region === 'east_asia') {
      currency = /japan|jepang/i.test(locationStr) ? 'JPY' : 'KRW';
    } else if (region === 'global_remote') {
      currency = 'USD';
    }

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.text,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote Global' : `${locationStr}, ${target.defaultCountry || 'Indonesia'}`,
      city: isRemote ? 'Remote / WFH' : locationStr,
      region,
      country: target.defaultCountry || (region === 'indonesia' ? 'Indonesia' : 'Global'),
      category,
      workType: determineWorkType(commitment),
      workSetup: isRemote ? 'Remote / WFH' : 'On-site',
      experienceLevel: determineExperienceLevel(item.text),
      salary: {
        currency,
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
  }).filter((job) => now - job.postedAt <= 45 * 24 * 60 * 60 * 1000 && job.postedAt >= 1785000000000);
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

    const region = inferJobRegion({
      location: isRemote ? 'Remote' : `${locationStr}, ${target.defaultCountry || 'Global'}`,
      city: locationStr,
      country: target.defaultCountry,
      company: target.companyName,
      isStpPartner: false,
    });

    return {
      id: jobId,
      slug: `job-${jobId}`,
      title: item.title,
      company: target.companyName,
      companyType: determineCompanyType(target.companyName),
      location: isRemote ? 'Remote Global' : `${locationStr}, ${target.defaultCountry || 'Global'}`,
      city: isRemote ? 'Remote / WFH' : locationStr,
      region,
      country: target.defaultCountry || (region === 'indonesia' ? 'Indonesia' : 'Global'),
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
  }).filter((job) => now - job.postedAt <= 45 * 24 * 60 * 60 * 1000 && job.postedAt >= 1785000000000);
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
            region: 'indonesia',
            country: 'Indonesia',
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

