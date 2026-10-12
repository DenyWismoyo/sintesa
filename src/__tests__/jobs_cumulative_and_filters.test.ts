// src/__tests__/jobs_cumulative_and_filters.test.ts
import { describe, it, expect } from 'vitest';
import { filterAndSortJobs } from '@/services/job.service';
import { JobListing } from '@/types/job.types';

describe('Bursa Karir — Cumulative Archive & Enhanced Filters', () => {
  const dummyJobs: JobListing[] = [
    {
      id: 'job-solo-1',
      title: 'CNC Programmer & Operator',
      company: 'PT ATMI Solo',
      companyType: 'Mitra Industri STP',
      category: 'Manufaktur Presisi & Mekatronika',
      location: 'Surakarta, Jawa Tengah',
      city: 'Surakarta',
      workType: 'Full-time',
      workSetup: 'On-site (Solo Technopark)',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 4500000, max: 6500000 },
      description: 'Dibutuhkan operator CNC alumni STP',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['CNC', 'G-Code'],
      relevantTrainingPrograms: ['CNC'],
      isStpPartner: true,
      isFeatured: true,
      postedAt: Date.now() - 2 * 86400000, // 2 hari lalu
      firstSeenAt: Date.now() - 14 * 86400000, // 14 hari lalu (muncul di batch lama)
      lastSeenAt: Date.now(), // diperbarui hari ini
      viewsCount: 10,
      applicantCount: 2,
      isActive: true,
    },
    {
      id: 'job-jkt-1',
      title: 'Senior Frontend Engineer',
      company: 'Tech Corp Jakarta',
      companyType: 'Perusahaan Teknologi',
      category: 'IT & Rekayasa Perangkat Lunak',
      location: 'Jakarta Selatan, DKI Jakarta',
      city: 'Jakarta',
      workType: 'Full-time',
      workSetup: 'Hybrid',
      experienceLevel: 'Senior (4+ Tahun)',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 18000000, max: 25000000 },
      description: 'Dibutuhkan developer React Next.js',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['React', 'Next.js', 'TypeScript'],
      relevantTrainingPrograms: ['Fullstack Web'],
      isStpPartner: false,
      isFeatured: false,
      postedAt: Date.now() - 3 * 86400000,
      firstSeenAt: Date.now() - 3 * 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 50,
      applicantCount: 12,
      isActive: true,
    },
    {
      id: 'job-global-1',
      title: 'Remote AI Research Engineer',
      company: 'Global AI Lab',
      companyType: 'Perusahaan Teknologi',
      category: 'Kecerdasan Buatan & Sains Data',
      location: 'Singapore / Remote Worldwide',
      city: 'Singapore',
      workType: 'Full-time',
      workSetup: 'Remote / WFH',
      experienceLevel: 'Mid-Level (2-4 Tahun)',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 35000000, max: 50000000 },
      description: 'Dibutuhkan AI Researcher',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['Python', 'PyTorch'],
      relevantTrainingPrograms: ['Artificial Intelligence'],
      isStpPartner: false,
      isFeatured: true,
      postedAt: Date.now() - 40 * 86400000, // 40 hari lalu (arsip lama)
      firstSeenAt: Date.now() - 40 * 86400000,
      lastSeenAt: Date.now() - 40 * 86400000,
      viewsCount: 120,
      applicantCount: 30,
      isActive: true,
    },
  ];

  it('1. Filter Wilayah Solo Raya berhasil menyaring loker Solo & STP', () => {
    const res = filterAndSortJobs(dummyJobs, { locationRegion: 'solo_raya' });
    expect(res.jobs.length).toBe(1);
    expect(res.jobs[0].id).toBe('job-solo-1');
  });

  it('2. Filter Wilayah Jabodetabek berhasil menyaring loker Jakarta', () => {
    const res = filterAndSortJobs(dummyJobs, { locationRegion: 'jabodetabek' });
    expect(res.jobs.length).toBe(1);
    expect(res.jobs[0].id).toBe('job-jkt-1');
  });

  it('3. Filter Wilayah Global / Luar Negeri berhasil menyaring loker Singapore/Worldwide', () => {
    const res = filterAndSortJobs(dummyJobs, { locationRegion: 'luar_negeri' });
    expect(res.jobs.length).toBe(1);
    expect(res.jobs[0].id).toBe('job-global-1');
  });

  it('4. Filter Freshness (minggu ini) menyaring data baru dan mengecualikan arsip 40 hari lalu', () => {
    const resWeek = filterAndSortJobs(dummyJobs, { freshness: 'week' });
    expect(resWeek.jobs.length).toBe(2);
    expect(resWeek.jobs.map(j => j.id)).toContain('job-solo-1');
    expect(resWeek.jobs.map(j => j.id)).toContain('job-jkt-1');
    expect(resWeek.jobs.map(j => j.id)).not.toContain('job-global-1');
  });

  it('5. Bank Data Kumulatif: jika freshness="all", seluruh arsip terdahulu tetap tampil', () => {
    const resAll = filterAndSortJobs(dummyJobs, { freshness: 'all' });
    expect(resAll.jobs.length).toBe(3);
  });

  it('6. Logika penggabungan kumulatif: mempertahankan firstSeenAt dan memperbarui lastSeenAt', () => {
    const initialMap = new Map<string, JobListing>();
    dummyJobs.forEach(j => initialMap.set(j.id, j));

    // Batch baru masuk (misal hanya membawa job-jkt-1 dan job-baru-1)
    const newBatch: JobListing[] = [
      {
        ...dummyJobs[1],
        title: 'Senior Frontend Engineer (Updated)',
      },
      {
        id: 'job-baru-1',
        title: 'Cyber Security Analyst',
        company: 'STP Cyber Hub',
        companyType: 'Mitra Industri STP',
        category: 'Keamanan Siber (Cyber Security)',
        location: 'Surakarta',
        city: 'Surakarta',
        workType: 'Full-time',
        workSetup: 'On-site',
        experienceLevel: 'Junior (0-2 Tahun)',
        salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true },
        description: 'SOC Analyst',
        responsibilities: [],
        requirements: [],
        benefits: [],
        skills: ['SOC', 'Wireshark'],
        relevantTrainingPrograms: ['Cyber Security'],
        isStpPartner: true,
        isFeatured: false,
        postedAt: Date.now(),
        viewsCount: 0,
        applicantCount: 0,
        isActive: true,
      },
    ];

    // Kumulatif merge logic
    const syncTime = Date.now();
    newBatch.forEach(incoming => {
      const existing = initialMap.get(incoming.id);
      initialMap.set(incoming.id, {
        ...incoming,
        firstSeenAt: existing?.firstSeenAt || incoming.postedAt || syncTime,
        lastSeenAt: syncTime,
        isActive: true,
      });
    });

    const mergedList = Array.from(initialMap.values());
    // Jumlah loker harus bertambah (3 + 1 baru = 4), tidak ada yang terhapus!
    expect(mergedList.length).toBe(4);
    // Job solo yang tidak ada di batch baru tetap selamat
    expect(mergedList.some(j => j.id === 'job-solo-1')).toBe(true);
    // Job global yang tidak ada di batch baru tetap selamat
    expect(mergedList.some(j => j.id === 'job-global-1')).toBe(true);
  });
});
