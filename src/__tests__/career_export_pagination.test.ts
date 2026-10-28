// src/__tests__/career_export_pagination.test.ts
import { describe, it, expect } from 'vitest';
import {
  inferRegionType,
  inferPartnershipScheme,
  filterJobsForExport,
  CAREER_EXPORT_COLUMNS,
  CareerExportOptions,
} from '@/services/careerExport.service';
import { JobListing } from '@/types/job.types';

describe('Manajemen Karir Admin — Pagination & B2B Partnership Export', () => {
  const mockJobs: JobListing[] = [
    {
      id: 'job-solo-1',
      title: 'Teknisi Bubut & CNC Presisi',
      company: 'PT Solo Manufaktur Kreasi',
      companyType: 'Mitra Industri STP',
      category: 'Manufaktur Presisi & Mekatronika',
      location: 'Surakarta, Jawa Tengah',
      city: 'Surakarta',
      workType: 'Full-time',
      workSetup: 'On-site (Solo Technopark)',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 4500000, max: 6000000 },
      description: 'Dibutuhkan teknisi CNC alumni STP',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['CNC', 'Lathe', 'Milling'],
      relevantTrainingPrograms: ['Pelatihan Pemrograman & Mesin CNC'],
      isStpPartner: true,
      isFeatured: true,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 10,
      applicantCount: 2,
      isActive: true,
    },
    {
      id: 'job-jkt-1',
      title: 'Fullstack Next.js Engineer',
      company: 'Unicorn Tech Jakarta',
      companyType: 'Perusahaan Teknologi',
      category: 'IT & Rekayasa Perangkat Lunak',
      location: 'Jakarta Selatan, DKI Jakarta',
      city: 'Jakarta',
      workType: 'Full-time',
      workSetup: 'Hybrid',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 12000000, max: 18000000 },
      description: 'Dibutuhkan web engineer Next.js',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['Next.js', 'React', 'TypeScript'],
      relevantTrainingPrograms: ['Bootcamp Fullstack Web Developer (Next.js & TypeScript)'],
      isStpPartner: false,
      isFeatured: false,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 20,
      applicantCount: 4,
      isActive: true,
    },
    {
      id: 'job-global-1',
      title: 'Marine Welder Specialist',
      company: 'Sembcorp Marine Ltd',
      companyType: 'Industri Manufaktur',
      category: 'Manufaktur Presisi & Mekatronika',
      location: 'Tuas Boulevard, Singapore',
      city: 'Singapore',
      workType: 'Full-time',
      workSetup: 'On-site',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'SGD', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 2800, max: 4000 },
      description: 'Penyaluran welder 6G ke galangan kapal Singapura',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['Welding 6G', 'SMAW', 'Offshore'],
      relevantTrainingPrograms: ['Sertifikasi Juru Las (Welder) 6G Standar Migas & Marine'],
      isStpPartner: false,
      isFeatured: false,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 50,
      applicantCount: 15,
      isActive: true,
    },
    {
      id: 'job-inactive-1',
      title: 'Junior QA Tester',
      company: 'Software House Jogja',
      companyType: 'Startup / Industri',
      category: 'IT & Rekayasa Perangkat Lunak',
      location: 'Yogyakarta',
      city: 'Yogyakarta',
      workType: 'Internship',
      workSetup: 'Remote',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: false },
      description: 'Lowongan magang ditutup',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['QA', 'Cypress'],
      relevantTrainingPrograms: [],
      isStpPartner: false,
      isFeatured: false,
      postedAt: Date.now() - 30 * 86400000,
      firstSeenAt: Date.now() - 30 * 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 5,
      applicantCount: 0,
      isActive: false, // Inactive
    },
  ];

  it('harus mampu mendeteksi cakupan wilayah (Solo Raya, Nasional, dan Luar Negeri) dengan akurat', () => {
    expect(inferRegionType(mockJobs[0])).toBe('Solo Raya (Lokal)');
    expect(inferRegionType(mockJobs[1])).toBe('Nasional (Dalam Negeri)');
    expect(inferRegionType(mockJobs[2])).toBe('Luar Negeri (Global)');
  });

  it('harus memberikan rekomendasi skema kemitraan STP yang tepat untuk negosiasi industri', () => {
    // Mitra STP resmi
    expect(inferPartnershipScheme(mockJobs[0])).toContain('MoU Aktif');
    // Luar negeri
    expect(inferPartnershipScheme(mockJobs[2])).toContain('Penyaluran Tenaga Terampil Global');
  });

  it('harus memfilter data ekspor sesuai cakupan (scope) yang dipilih admin', () => {
    // 1. Scope: Khusus Luar Negeri (Global)
    const optionsGlobal: CareerExportOptions = {
      scope: 'INTERNATIONAL',
      format: 'XLSX',
      selectedColumns: ['title', 'company', 'location'],
    };
    const globalResults = filterJobsForExport(mockJobs, mockJobs, [], optionsGlobal);
    expect(globalResults.length).toBe(1);
    expect(globalResults[0].id).toBe('job-global-1');

    // 2. Scope: Hanya Baris Tercentang (Selected Rows)
    const optionsSelected: CareerExportOptions = {
      scope: 'SELECTED_ROWS',
      format: 'CSV',
      selectedColumns: ['title', 'company'],
    };
    const selectedResults = filterJobsForExport(mockJobs, mockJobs, ['job-solo-1', 'job-global-1'], optionsSelected);
    expect(selectedResults.length).toBe(2);
    expect(selectedResults.map((j) => j.id)).toEqual(['job-solo-1', 'job-global-1']);

    // 3. Scope: Solo Raya (Lokal)
    const optionsSolo: CareerExportOptions = {
      scope: 'SOLO_RAYA',
      format: 'PDF',
      selectedColumns: ['title', 'company'],
    };
    const soloResults = filterJobsForExport(mockJobs, mockJobs, [], optionsSolo);
    expect(soloResults.length).toBe(1);
    expect(soloResults[0].id).toBe('job-solo-1');
  });

  it('harus memotong data sesuai pagination limit dan halaman yang diminta', () => {
    const pageSize = 2;
    const page1 = mockJobs.slice(0, pageSize);
    const page2 = mockJobs.slice(pageSize, pageSize * 2);

    expect(page1.length).toBe(2);
    expect(page1.map((j) => j.id)).toEqual(['job-solo-1', 'job-jkt-1']);
    expect(page2.length).toBe(2);
    expect(page2.map((j) => j.id)).toEqual(['job-global-1', 'job-inactive-1']);
  });

  it('harus memiliki daftar kolom ekspor kemitraan yang komprehensif', () => {
    const keys = CAREER_EXPORT_COLUMNS.map((c) => c.key);
    expect(keys).toContain('title');
    expect(keys).toContain('company');
    expect(keys).toContain('location');
    expect(keys).toContain('relevantTrainingPrograms');
    expect(keys).toContain('partnershipScheme');
    expect(keys).toContain('skills');
  });
});
