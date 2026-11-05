// src/__tests__/ats_zero_cost_crawler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stripTrackingParams,
  sanitizePii,
  normalizeCompanyName,
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  inferJobRegion,
  AtsTarget,
} from '@/services/atsCrawler.service';
import { balanceRegionalProportion } from '@/services/jobAggregator.service';
import { JobListing, JobListingSchema } from '@/types/job.types';

describe('ATS Zero-Cost Crawler & Data Hygiene Suite', () => {
  describe('1. stripTrackingParams helper', () => {
    it('harus membuang parameter tracking pemasaran (UTM, referrer, ads)', () => {
      const dirtyUrl =
        'https://boards.greenhouse.io/traveloka/jobs/12345?utm_source=linkedin&utm_medium=job_post&utm_campaign=hiring_2026&gh_jid=12345&ref=telegram';
      const clean = stripTrackingParams(dirtyUrl);
      expect(clean).toBe('https://boards.greenhouse.io/traveloka/jobs/12345');
      expect(clean).not.toContain('utm_source');
      expect(clean).not.toContain('utm_medium');
      expect(clean).not.toContain('gh_jid');
    });

    it('harus mempertahankan query parameter esensial non-tracking', () => {
      const urlWithId = 'https://jobs.lever.co/efishery/abc-xyz?mode=json';
      const clean = stripTrackingParams(urlWithId);
      expect(clean).toContain('mode=json');
    });

    it('harus mengembalikan string kosong atau url asli jika format tidak valid', () => {
      expect(stripTrackingParams('')).toBe('');
      expect(stripTrackingParams('not-a-valid-url')).toBe('not-a-valid-url');
    });
  });

  describe('2. sanitizePii helper (UU PDP No. 27/2022 Compliance)', () => {
    it('harus menyaring dan menyamarkan alamat email individu perekrut/HRD', () => {
      const textWithEmail =
        'Kirim CV ke hrd.budi@perusahaan.co.id atau talent.acquisition@tokopedia.com untuk proses wawancara.';
      const sanitized = sanitizePii(textWithEmail);
      expect(sanitized).not.toContain('hrd.budi@perusahaan.co.id');
      expect(sanitized).not.toContain('talent.acquisition@tokopedia.com');
      expect(sanitized).toContain('[kontak resmi via tautan lamaran]');
    });

    it('harus menyaring dan menyamarkan nomor WhatsApp dan telepon Indonesia', () => {
      const textWithPhone =
        'Informasi lebih lanjut hubungi PIC di 081234567890 atau WhatsApp +6281987654321.';
      const sanitized = sanitizePii(textWithPhone);
      expect(sanitized).not.toContain('081234567890');
      expect(sanitized).not.toContain('+6281987654321');
      expect(sanitized).toContain('[nomor kontak terlindungi]');
    });

    it('harus aman saat menerima teks kosong', () => {
      expect(sanitizePii('')).toBe('');
    });
  });

  describe('3. normalizeCompanyName helper', () => {
    it('harus menghapus penanda badan hukum (PT, CV, Tbk, Inc, Ltd, LLC, GmbH)', () => {
      expect(normalizeCompanyName('PT Traveloka Indonesia, Tbk')).toBe('traveloka indonesia');
      expect(normalizeCompanyName('CV. Solo Manufaktur Kreasi')).toBe('solo manufaktur kreasi');
      expect(normalizeCompanyName('GoTo Gojek Tokopedia Inc.')).toBe('goto gojek tokopedia');
      expect(normalizeCompanyName('Siemens AG / GmbH')).toBe('siemens ag');
    });

    it('harus membersihkan spasi ganda dan karakter khusus', () => {
      expect(normalizeCompanyName('  PT.  Bank   BTPN   Syariah  ')).toBe('bank btpn syariah');
    });
  });

  describe('4. ATS Fetchers Schema Conformance', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('harus memetakan payload Greenhouse ke skema valid JobListing', async () => {
      const mockTarget: AtsTarget = {
        id: 'gh-traveloka',
        platform: 'greenhouse',
        companyName: 'Traveloka',
        slugOrToken: 'traveloka',
        defaultCity: 'Jakarta',
        defaultCountry: 'Indonesia',
      };

      const mockGhResponse = {
        jobs: [
          {
            id: 987654,
            title: 'Senior Frontend Engineer',
            updated_at: '2026-10-15T08:00:00.000Z',
            content: '<p>Bergabung bersama kami di Traveloka. Email rec@traveloka.com</p>',
            absolute_url: 'https://boards.greenhouse.io/traveloka/jobs/987654?utm_source=test',
            location: { name: 'Jakarta, Indonesia' },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGhResponse,
      } as any);

      const jobs = await fetchGreenhouseJobs(mockTarget);
      expect(jobs.length).toBe(1);

      const job = jobs[0];
      expect(job.title).toBe('Senior Frontend Engineer');
      expect(job.company).toBe('Traveloka');
      expect(job.source).toBe('ats_public');
      expect(job.applySource).toContain('Greenhouse');
      expect(job.applicationUrl).toBe('https://boards.greenhouse.io/traveloka/jobs/987654');
      expect(job.description).not.toContain('rec@traveloka.com');

      const parsed = JobListingSchema.safeParse(job);
      expect(parsed.success).toBe(true);
    });

    it('harus memetakan payload Lever ke skema valid JobListing', async () => {
      const mockTarget: AtsTarget = {
        id: 'lev-efishery',
        platform: 'lever',
        companyName: 'eFishery',
        slugOrToken: 'efishery',
        defaultCity: 'Bandung',
      };

      const mockLeverResponse = [
        {
          id: 'efish-101',
          text: 'IoT Hardware Engineer',
          createdAt: 1730000000000,
          descriptionPlain: 'Mengembangkan sensor kolam pintar dan aktuator pakan otomatis.',
          applyUrl: 'https://jobs.lever.co/efishery/efish-101/apply?lever-source=web',
          categories: {
            location: 'Bandung, Indonesia',
            commitment: 'Full-time',
            workplaceType: 'hybrid',
            team: 'Hardware & IoT',
          },
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLeverResponse,
      } as any);

      const jobs = await fetchLeverJobs(mockTarget);
      expect(jobs.length).toBe(1);

      const job = jobs[0];
      expect(job.title).toBe('IoT Hardware Engineer');
      expect(job.company).toBe('eFishery');
      expect(job.source).toBe('ats_public');
      expect(job.applicationUrl).toBe('https://jobs.lever.co/efishery/efish-101/apply');

      const parsed = JobListingSchema.safeParse(job);
      expect(parsed.success).toBe(true);
    });

    it('harus memetakan payload Ashby dengan data kompensasi/gaji ke JobListing', async () => {
      const mockTarget: AtsTarget = {
        id: 'ash-deel',
        platform: 'ashby',
        companyName: 'Deel',
        slugOrToken: 'deel',
        defaultCity: 'Remote',
      };

      const mockAshbyResponse = {
        jobs: [
          {
            id: 'ashby-555',
            title: 'Staff Software Architect',
            publishedAt: '2026-10-01T12:00:00.000Z',
            descriptionPlain: 'Mendesain arsitektur microservices berskala tinggi.',
            jobUrl: 'https://jobs.ashbyhq.com/deel/ashby-555',
            location: 'Remote Global',
            employmentType: 'FullTime',
            compensation: {
              compensationTierSummary: '$120,000 - $160,000 / year',
              currency: 'USD',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAshbyResponse,
      } as any);

      const jobs = await fetchAshbyJobs(mockTarget);
      expect(jobs.length).toBe(1);

      const job = jobs[0];
      expect(job.salary?.isDisclosed).toBe(true);
      expect(job.salary?.min).toBe(120000);
      expect(job.salary?.max).toBe(160000);
      expect(job.salary?.currency).toBe('USD');

      const parsed = JobListingSchema.safeParse(job);
      expect(parsed.success).toBe(true);
    });
  });

  describe('5. inferJobRegion helper (Deteksi Wilayah Geografis)', () => {
    it('harus mengklasifikasikan lowongan Indonesia secara akurat', () => {
      expect(inferJobRegion({ location: 'Jakarta, Indonesia' })).toBe('indonesia');
      expect(inferJobRegion({ city: 'Surakarta', location: 'Jawa Tengah' })).toBe('indonesia');
      expect(inferJobRegion({ location: 'Balikpapan, Kalimantan Timur' })).toBe('indonesia');
      expect(inferJobRegion({ isStpPartner: true })).toBe('indonesia');
      expect(inferJobRegion({ company: 'PT Pertamina Marine Engineering' })).toBe('indonesia');
    });

    it('harus mengklasifikasikan lowongan ASEAN secara akurat', () => {
      expect(inferJobRegion({ location: 'Singapore, Singapore' })).toBe('asean');
      expect(inferJobRegion({ location: 'Shah Alam, Selangor, Malaysia' })).toBe('asean');
      expect(inferJobRegion({ location: 'Bangkok, Thailand' })).toBe('asean');
      expect(inferJobRegion({ location: 'Taguig, Philippines' })).toBe('asean');
      expect(inferJobRegion({ location: 'Ho Chi Minh City, Vietnam' })).toBe('asean');
    });

    it('harus mengklasifikasikan lowongan Asia Timur (Jepang & Korea Selatan) secara akurat', () => {
      expect(inferJobRegion({ location: 'Tokyo, Japan' })).toBe('east_asia');
      expect(inferJobRegion({ location: 'Yokohama, Jepang' })).toBe('east_asia');
      expect(inferJobRegion({ location: 'Seoul, South Korea' })).toBe('east_asia');
      expect(inferJobRegion({ location: 'Busan, Korea Selatan' })).toBe('east_asia');
      expect(inferJobRegion({ location: 'Taipei, Taiwan' })).toBe('east_asia');
    });

    it('harus mengklasifikasikan lowongan remote global sebagai fallback', () => {
      expect(inferJobRegion({ location: 'Worldwide / Remote' })).toBe('global_remote');
      expect(inferJobRegion({ location: 'Anywhere in the world' })).toBe('global_remote');
    });
  });

  describe('6. balanceRegionalProportion helper (Target Rasio 60:40)', () => {
    it('harus menyeimbangkan porsi bank data agar Indonesia minimal 60% dan Luar Negeri maksimal 40%', () => {
      const createDummyJob = (id: string, region: 'indonesia' | 'asean' | 'east_asia' | 'global_remote'): JobListing => ({
        id,
        title: `Engineer ${id}`,
        company: `Company ${id}`,
        companyType: 'Industri Manufaktur',
        city: 'Jakarta',
        location: region === 'indonesia' ? 'Jakarta, Indonesia' : region === 'asean' ? 'Singapura' : region === 'east_asia' ? 'Tokyo, Jepang' : 'Remote',
        category: 'IT & Rekayasa Perangkat Lunak',
        workType: 'Full-time',
        workSetup: 'On-site',
        experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
        salary: { isNegotiable: true, isDisclosed: true, currency: 'IDR', period: 'Bulan' },
        description: 'Test job description',
        responsibilities: [],
        requirements: [],
        benefits: [],
        skills: [],
        relevantTrainingPrograms: [],
        isStpPartner: false,
        isFeatured: false,
        postedAt: Date.now(),
        viewsCount: 0,
        applicantCount: 0,
        isActive: true,
        region,
        country: region === 'indonesia' ? 'Indonesia' : 'Global',
      });

      // Buat dataset: 60 lowongan Indonesia, 40 ASEAN, 40 Asia Timur, 40 Global Remote (Total: 180 lowongan)
      const mockJobs: JobListing[] = [
        ...Array.from({ length: 60 }, (_, i) => createDummyJob(`id-indo-${i}`, 'indonesia')),
        ...Array.from({ length: 40 }, (_, i) => createDummyJob(`id-asean-${i}`, 'asean')),
        ...Array.from({ length: 40 }, (_, i) => createDummyJob(`id-east-${i}`, 'east_asia')),
        ...Array.from({ length: 40 }, (_, i) => createDummyJob(`id-global-${i}`, 'global_remote')),
      ];

      const { balancedJobs, stats } = balanceRegionalProportion(mockJobs, 0.60);

      // Indonesia harus dipertahankan seluruhnya (60 lowongan)
      expect(stats.indonesiaCount).toBe(60);
      expect(stats.indonesiaPercent).toBeGreaterThanOrEqual(60);

      // Luar negeri harus dibatasi proporsional: 60 * (40/60) = 40 lowongan
      expect(stats.overseasCount).toBe(40);
      expect(stats.overseasPercent).toBeLessThanOrEqual(40);
      expect(stats.total).toBe(100);

      // Sub-regional ASEAN & Asia Timur harus terwakili dalam porsi luar negeri
      expect(stats.aseanCount).toBeGreaterThan(0);
      expect(stats.eastAsiaCount).toBeGreaterThan(0);
    });
  });
});

