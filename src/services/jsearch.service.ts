// src/services/jsearch.service.ts
import { JobListing, JobCategory, JobWorkType, JobWorkSetup } from '@/types/job.types';

export interface JSearchRawJob {
  job_id: string;
  employer_name: string;
  employer_logo?: string | null;
  employer_website?: string | null;
  job_employment_type?: string;
  job_title: string;
  job_apply_link?: string;
  job_description?: string;
  job_is_remote?: boolean;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_timestamp?: number;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_period?: string | null;
  job_required_skills?: string[] | null;
  job_publisher?: string | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}

interface JSearchApiResponse {
  status: string;
  data?: JSearchRawJob[];
  message?: string;
}

// In-memory cache sederhana untuk menghemat kuota RapidAPI JSearch
interface CacheEntry {
  timestamp: number;
  data: JobListing[];
}
const cacheMap = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

/**
 * Inferensi Kategori Pekerjaan berdasarkan judul dan deskripsi
 */
export function inferJobCategory(title: string, description: string = ''): JobCategory {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes('cyber') ||
    text.includes('security') ||
    text.includes('soc ') ||
    text.includes('pentest') ||
    text.includes('jaringan') ||
    text.includes('network engineer')
  ) {
    return 'Keamanan Siber (Cyber Security)';
  }

  if (
    /\b(ai|artificial intelligence|data science|machine learning|computer vision|deep learning|data scientist|data analyst)\b/i.test(
      text
    )
  ) {
    return 'Kecerdasan Buatan & Sains Data';
  }

  if (
    text.includes('underwater') ||
    text.includes('diver') ||
    text.includes('subsea') ||
    text.includes('penyelam') ||
    text.includes('cnc') ||
    text.includes('mesin') ||
    text.includes('mekatronik') ||
    text.includes('welder') ||
    text.includes('pengelasan') ||
    text.includes('juru las') ||
    text.includes('operator produksi') ||
    text.includes('machinist') ||
    text.includes('cad/cam') ||
    text.includes('manufaktur') ||
    text.includes('manufacturing') ||
    text.includes('fabricat')
  ) {
    return 'Manufaktur Presisi & Mekatronika';
  }

  if (
    text.includes('3d') ||
    text.includes('game') ||
    text.includes('animasi') ||
    text.includes('blender') ||
    text.includes('multimedia') ||
    text.includes('unity') ||
    text.includes('unreal') ||
    text.includes('ui/ux') ||
    text.includes('graphic designer')
  ) {
    return 'Multimedia, Game & Animasi 3D';
  }

  if (
    text.includes('marketing') ||
    text.includes('e-commerce') ||
    text.includes('seo') ||
    text.includes('social media') ||
    text.includes('copywriter') ||
    text.includes('penjualan') ||
    text.includes('advertiser')
  ) {
    return 'Pemasaran & Bisnis Digital';
  }

  return 'IT & Rekayasa Perangkat Lunak';
}

/**
 * Pemetaan Program Pelatihan Solo Technopark yang relevan
 */
export function inferRelevantTrainingPrograms(category: JobCategory, skills: string[]): string[] {
  const skillsText = skills.join(' ').toLowerCase();

  switch (category) {
    case 'IT & Rekayasa Perangkat Lunak':
      if (skillsText.includes('react') || skillsText.includes('next') || skillsText.includes('frontend')) {
        return ['Bootcamp Fullstack Web Developer (Next.js & TypeScript)', 'Pelatihan Frontend Modern UI'];
      }
      if (skillsText.includes('qa') || skillsText.includes('test')) {
        return ['Pelatihan Software Quality Assurance & Automation Testing'];
      }
      return ['Bootcamp Fullstack Web Developer (Next.js & TypeScript)'];

    case 'Kecerdasan Buatan & Sains Data':
      return [
        'Pelatihan Artificial Intelligence & Computer Vision',
        'Bootcamp Data Science & Machine Learning Engineer',
      ];

    case 'Keamanan Siber (Cyber Security)':
      return [
        'Pelatihan Cyber Security Defense & Ethical Hacking',
        'Administrasi Jaringan & Cloud Security',
      ];

    case 'Manufaktur Presisi & Mekatronika':
      if (
        skillsText.includes('underwater') ||
        skillsText.includes('diver') ||
        skillsText.includes('bawah air') ||
        skillsText.includes('subsea')
      ) {
        return [
          'Diklat Underwater Wet Welding (Pengelasan Bawah Air) Solo Technopark',
          'Sertifikasi Juru Las (Welder) 6G Standar Migas & Marine',
        ];
      }
      if (
        skillsText.includes('weld') ||
        skillsText.includes('las') ||
        skillsText.includes('smaw') ||
        skillsText.includes('gmaw') ||
        skillsText.includes('gtaw')
      ) {
        return [
          'Pelatihan Juru Las (Welder) 3G/4G/6G',
          'Sertifikasi Pengelasan Pelat & Pipa Standar BNSP / IIW',
        ];
      }
      if (
        skillsText.includes('cnc') ||
        skillsText.includes('bubut') ||
        skillsText.includes('milling') ||
        skillsText.includes('machin')
      ) {
        return [
          'Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis',
          'Pelatihan Desain Manufaktur CAD/CAM Mastercam',
        ];
      }
      return [
        'Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis',
        'Pelatihan Desain Manufaktur Mekatronika & Otomasi Industri',
      ];

    case 'Multimedia, Game & Animasi 3D':
      return [
        'Pelatihan 3D Asset Modeling & Texturing Blender',
        'Pengembangan Game Interaktif (Unity / Unreal)',
      ];

    case 'Pemasaran & Bisnis Digital':
      return [
        'Pelatihan Pemasaran Digital & E-Commerce',
        'Digital Talent Scholarship (DTS) Digital Entrepreneurship',
      ];

    default:
      return ['Program Pelatihan Vokasi Terpadu Solo Technopark'];
  }
}

/**
 * Ekstraksi Keahlian (Skills) dari teks deskripsi
 */
export function extractSkillsFromDescription(description: string, rawSkills?: string[] | null): string[] {
  if (rawSkills && rawSkills.length > 0) {
    return rawSkills.slice(0, 8);
  }

  const commonKeywords = [
    'Underwater Welding', 'Commercial Diving', 'Subsea Inspection', 'Welding 3G/6G',
    'SMAW', 'GMAW', 'GTAW', 'FCAW', 'TIG Welding', 'MIG Welding', 'NDT Inspection',
    'CNC Milling', 'CNC Lathe', 'Machining 5-Axis', 'Mastercam', 'AutoCAD', 'SolidWorks',
    'Mekatronika', 'PLC', 'Otomasi Industri', 'Mesin Bubut',
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'PHP',
    'HTML/CSS', 'Tailwind', 'SQL', 'PostgreSQL', 'Docker', 'Git', 'API', 'Figma',
    'Linux', 'Cyber Security', 'Network', 'Firewall', 'Wireshark', 'SIEM',
    'Blender', 'Unity', '3D Modeling', 'Photoshop', 'Illustrator',
    'SEO', 'Google Ads', 'Meta Ads', 'Copywriting', 'E-Commerce', 'Content Creator'
  ];

  const found: string[] = [];
  const lowerDesc = description.toLowerCase();

  for (const kw of commonKeywords) {
    if (lowerDesc.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }

  return found.length > 0 ? found.slice(0, 7) : ['Keahlian Teknis Relevan', 'Komunikasi & Tim'];
}

/**
 * Normalisasi data mentah JSearch ke struktur JobListing Sintesa
 */
export function normalizeJSearchJob(raw: JSearchRawJob): JobListing {
  const category = inferJobCategory(raw.job_title, raw.job_description || '');
  const skills = extractSkillsFromDescription(raw.job_description || '', raw.job_required_skills);
  const relevantPrograms = inferRelevantTrainingPrograms(category, skills);

  // Normalisasi Tipe Pekerjaan
  let workType: JobWorkType = 'Full-time';
  if (raw.job_employment_type === 'INTERN') workType = 'Internship / Magang';
  else if (raw.job_employment_type === 'CONTRACTOR') workType = 'Contract';
  else if (raw.job_employment_type === 'PARTTIME') workType = 'Part-time';

  // Normalisasi Setup Kerja
  let workSetup: JobWorkSetup = 'On-site';
  if (raw.job_is_remote) {
    workSetup = 'Remote / WFH';
  } else if (
    raw.job_city?.toLowerCase().includes('solo') ||
    raw.job_city?.toLowerCase().includes('surakarta')
  ) {
    workSetup = 'On-site (Solo Technopark)';
  } else {
    workSetup = 'Hybrid';
  }

  // Normalisasi Negara & Kota
  const rawCountry = (raw.job_country || '').toUpperCase();
  const countryNameMap: Record<string, string> = {
    ID: 'Indonesia',
    SG: 'Singapura',
    MY: 'Malaysia',
    PH: 'Filipina',
    TH: 'Thailand',
    VN: 'Vietnam',
    JP: 'Jepang',
    KR: 'Korea Selatan',
  };

  const currencyMap: Record<string, string> = {
    ID: 'IDR',
    SG: 'SGD',
    MY: 'MYR',
    PH: 'PHP',
    TH: 'THB',
    VN: 'VND',
    JP: 'JPY',
    KR: 'KRW',
  };

  const countryName = countryNameMap[rawCountry] || raw.job_country || 'Indonesia';
  const inferredCurrency = currencyMap[rawCountry] || 'IDR';

  const city = raw.job_city || raw.job_state || (rawCountry === 'SG' ? 'Singapura' : 'Jakarta');
  const location = `${city}, ${countryName}`;

  // Format Gaji & Periode
  const hasSalary = typeof raw.job_min_salary === 'number' && raw.job_min_salary > 0;
  const currency = raw.job_salary_currency || inferredCurrency;
  let period: 'Bulan' | 'Tahun' | 'Proyek' = 'Bulan';
  if (raw.job_salary_period === 'YEAR') period = 'Tahun';
  else period = 'Bulan';

  const salary = {
    min: raw.job_min_salary || undefined,
    max: raw.job_max_salary || undefined,
    currency,
    period,
    isNegotiable: true,
    isDisclosed: hasSalary,
  };

  // Bersihkan slug
  const cleanSlug = `${raw.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${raw.job_id.slice(-6)}`;

  return {
    id: `jsearch-${raw.job_id}`,
    slug: cleanSlug,
    title: raw.job_title,
    company: raw.employer_name,
    companyLogo: raw.employer_logo || undefined,
    companyWebsite: raw.employer_website || undefined,
    companyType: 'Startup / Industri',
    category,
    location,
    city,
    workType,
    workSetup,
    experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
    salary,
    description: raw.job_description || 'Deskripsi pekerjaan tersedia pada tautan portal resmi.',
    responsibilities: raw.job_highlights?.Responsibilities || [
      'Menjalankan tugas dan tanggung jawab sesuai spesifikasi pekerjaan',
      'Berkolaborasi secara aktif dalam tim kerja industri',
    ],
    requirements: raw.job_highlights?.Qualifications || [
      'Memiliki motivasi tinggi dan keterampilan yang relevan',
      'Lulusan pelatihan vokasi atau perguruan tinggi terkait',
    ],
    benefits: raw.job_highlights?.Benefits || [
      'Paket kompensasi dan jenjang karir sesuai standar industri',
    ],
    skills,
    relevantTrainingPrograms: relevantPrograms,
    applicationUrl: raw.job_apply_link || undefined,
    applicationEmail: undefined,
    applySource: raw.job_publisher || 'Portal Kerja Realtime',
    source: 'jsearch_realtime',
    isStpPartner: false,
    isFeatured: false,
    postedAt: raw.job_posted_at_timestamp ? raw.job_posted_at_timestamp * 1000 : Date.now(),
    deadlineAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 hari ke depan
    viewsCount: Math.floor(Math.random() * 80 + 20),
    applicantCount: Math.floor(Math.random() * 15 + 2),
    isActive: true,
  };
}

/**
 * Service Utama Pengambil Lowongan Realtime via JSearch RapidAPI
 */
export async function fetchJSearchJobs(options: {
  query?: string;
  category?: string;
  country?: string;
  page?: number;
  location?: string;
}): Promise<{ jobs: JobListing[]; total: number; isRealtime: boolean }> {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY;

  if (!apiKey) {
    return { jobs: [], total: 0, isRealtime: false };
  }

  // Bangun kata kunci query
  let searchQuery = options.query?.trim() || '';
  if (!searchQuery && options.category && options.category !== 'all') {
    searchQuery = options.category;
  }

  // Cek apakah query sudah mengandung penanda lokasi atau negara
  const hasExplicitLocation =
    Boolean(options.country) ||
    Boolean(options.location) ||
    /\b(in|di|jakarta|solo|surakarta|bandung|surabaya|semarang|singapore|kuala lumpur|malaysia|tokyo|japan|philippines|manila|thailand|bangkok|vietnam)\b/i.test(
      searchQuery
    );

  let fullQuery = searchQuery;
  if (!fullQuery) {
    fullQuery = 'teknologi OR manufaktur di Indonesia';
  } else if (!hasExplicitLocation) {
    const locationQuery = options.location || 'Indonesia';
    fullQuery = `${searchQuery} di ${locationQuery}`;
  }

  const page = options.page || 1;
  const countryParam = options.country?.toLowerCase();

  // Cek In-Memory Cache
  const cacheKey = `jsearch_${fullQuery}_c${countryParam || 'none'}_p${page}`;
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      jobs: cached.data,
      total: cached.data.length,
      isRealtime: true,
    };
  }

  try {
    const url = new URL('https://jsearch.p.rapidapi.com/search-v2');
    url.searchParams.set('query', fullQuery);
    if (countryParam) {
      url.searchParams.set('country', countryParam);
    }
    url.searchParams.set('page', String(page));
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('date_posted', 'all');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 600 }, // Next.js fetch cache 10 menit
    });

    if (!res.ok) {
      console.warn(`[JSearch API] Gagal memanggil API: ${res.status} ${res.statusText}`);
      return { jobs: [], total: 0, isRealtime: false };
    }

    const json: any = await res.json();
    let rawJobsList: JSearchRawJob[] = [];

    if (Array.isArray(json.data)) {
      rawJobsList = json.data;
    } else if (json.data && Array.isArray(json.data.jobs)) {
      rawJobsList = json.data.jobs;
    }

    // Jika pencarian dengan lokasi spesifik menghasilkan 0, coba fallback query
    if (rawJobsList.length === 0 && searchQuery && searchQuery !== fullQuery) {
      try {
        const fallbackUrl = new URL('https://jsearch.p.rapidapi.com/search-v2');
        fallbackUrl.searchParams.set('query', searchQuery);
        if (countryParam) {
          fallbackUrl.searchParams.set('country', countryParam);
        }
        fallbackUrl.searchParams.set('page', '1');
        fallbackUrl.searchParams.set('num_pages', '1');

        const fallbackRes = await fetch(fallbackUrl.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          },
        });

        if (fallbackRes.ok) {
          const fallbackJson: any = await fallbackRes.json();
          if (Array.isArray(fallbackJson.data)) {
            rawJobsList = fallbackJson.data;
          } else if (fallbackJson.data && Array.isArray(fallbackJson.data.jobs)) {
            rawJobsList = fallbackJson.data.jobs;
          }
        }
      } catch (fbErr) {
        // Abaikan error fallback
      }
    }

    if (!rawJobsList.length) {
      return { jobs: [], total: 0, isRealtime: false };
    }

    const normalizedJobs = rawJobsList.map(normalizeJSearchJob);

    // Simpan ke Cache
    cacheMap.set(cacheKey, {
      timestamp: Date.now(),
      data: normalizedJobs,
    });

    return {
      jobs: normalizedJobs,
      total: normalizedJobs.length,
      isRealtime: true,
    };
  } catch (error) {
    console.error('[JSearch API] Terjadi kesalahan koneksi:', error);
    return { jobs: [], total: 0, isRealtime: false };
  }
}
