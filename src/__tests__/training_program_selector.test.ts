// src/__tests__/training_program_selector.test.ts
import { describe, it, expect } from 'vitest';
import { STP_MASTER_TRAINING_PROGRAMS } from '@/app/(public)/karir/components/TrainingProgramSelector';
import { filterAndSortJobs } from '@/services/job.service';
import { JobListing } from '@/types/job.types';

describe('Bursa Karir — TrainingProgramSelector & Intelligent Matching', () => {
  it('harus memuat seluruh katalog program pelatihan STP lintas 6 klaster industri', () => {
    expect(STP_MASTER_TRAINING_PROGRAMS.length).toBeGreaterThanOrEqual(20);

    const clusters = new Set(STP_MASTER_TRAINING_PROGRAMS.map((p) => p.clusterKey));
    expect(clusters.has('manufaktur')).toBe(true);
    expect(clusters.has('it')).toBe(true);
    expect(clusters.has('ai')).toBe(true);
    expect(clusters.has('cyber')).toBe(true);
    expect(clusters.has('multimedia')).toBe(true);
    expect(clusters.has('bisnis')).toBe(true);

    // Verifikasi setiap item memiliki atribut lengkap
    STP_MASTER_TRAINING_PROGRAMS.forEach((prog) => {
      expect(prog.id).toBeTruthy();
      expect(prog.name).toBeTruthy();
      expect(prog.cluster).toBeTruthy();
      expect(prog.skills.length).toBeGreaterThan(0);
    });
  });

  const sampleJobs: JobListing[] = [
    {
      id: 'job-cnc',
      title: 'CNC Milling Specialist',
      company: 'PT ATMI Surakarta',
      companyType: 'Mitra Industri STP',
      category: 'Manufaktur Presisi & Mekatronika',
      location: 'Surakarta, Jawa Tengah',
      city: 'Surakarta',
      workType: 'Full-time',
      workSetup: 'On-site (Solo Technopark)',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 4500000, max: 6500000 },
      description: 'Operator mesin CNC milling 5-axis alumni pelatihan STP',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['CNC', 'Milling', 'Mastercam'],
      relevantTrainingPrograms: ['CNC'],
      isStpPartner: true,
      isFeatured: true,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 15,
      applicantCount: 3,
      isActive: true,
    },
    {
      id: 'job-web',
      title: 'Fullstack Next.js Developer',
      company: 'Solo Techno Venture',
      companyType: 'Tenant Inkubasi STP',
      category: 'IT & Rekayasa Perangkat Lunak',
      location: 'Surakarta, Jawa Tengah',
      city: 'Surakarta',
      workType: 'Full-time',
      workSetup: 'Hybrid',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 6000000, max: 9000000 },
      description: 'Membangun aplikasi Next.js & TypeScript',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['Next.js', 'React', 'TypeScript'],
      relevantTrainingPrograms: ['Fullstack Web'],
      isStpPartner: true,
      isFeatured: false,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 20,
      applicantCount: 5,
      isActive: true,
    },
    {
      id: 'job-cyber',
      title: 'Junior Cyber Security Analyst',
      company: 'PT Solusi Siber Nusantara',
      companyType: 'Perusahaan Teknologi',
      category: 'Keamanan Siber (Cyber Security)',
      location: 'Semarang, Jawa Tengah',
      city: 'Semarang',
      workType: 'Full-time',
      workSetup: 'Remote',
      experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
      salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: true, min: 7000000, max: 10000000 },
      description: 'Penetration testing & network security monitoring',
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills: ['Security', 'Wireshark', 'Linux'],
      relevantTrainingPrograms: ['Cyber Security'],
      isStpPartner: false,
      isFeatured: false,
      postedAt: Date.now() - 86400000,
      firstSeenAt: Date.now() - 86400000,
      lastSeenAt: Date.now(),
      viewsCount: 12,
      applicantCount: 1,
      isActive: true,
    },
  ];

  it('harus mencocokkan program pelatihan panjang dari selector dengan label ringkas di data lowongan (bidirectional matching)', () => {
    // Pengguna memilih judul lengkap dari TrainingProgramSelector
    const resWeb = filterAndSortJobs(sampleJobs, {
      trainingProgram: 'Bootcamp Fullstack Web Developer (Next.js & TypeScript)',
    });
    expect(resWeb.jobs.map((j) => j.id)).toContain('job-web');
    expect(resWeb.jobs.map((j) => j.id)).not.toContain('job-cnc');

    const resCnc = filterAndSortJobs(sampleJobs, {
      trainingProgram: 'Pelatihan Operator & Pemrograman Mesin CNC Milling & Bubut 5-Axis',
    });
    expect(resCnc.jobs.map((j) => j.id)).toContain('job-cnc');
    expect(resCnc.jobs.map((j) => j.id)).not.toContain('job-web');
  });

  it('harus tetap mendukung query singkatan atau kata kunci pendek (misal: "CNC", "Cyber", "Web")', () => {
    const resShortCnc = filterAndSortJobs(sampleJobs, {
      trainingProgram: 'CNC',
    });
    expect(resShortCnc.jobs.map((j) => j.id)).toContain('job-cnc');

    const resShortCyber = filterAndSortJobs(sampleJobs, {
      trainingProgram: 'Cyber Security',
    });
    expect(resShortCyber.jobs.map((j) => j.id)).toContain('job-cyber');
    expect(resShortCyber.jobs.map((j) => j.id)).not.toContain('job-cnc');
  });

  it('harus fallback mencocokkan ke judul atau kategori pekerjaan jika relevantTrainingPrograms kosong', () => {
    const jobWithoutExplicitTraining: JobListing = {
      ...sampleJobs[0],
      id: 'job-welder-fallback',
      title: 'Juru Las Pipa Bawah Air (Underwater Welder)',
      relevantTrainingPrograms: [], // kosong
      category: 'Manufaktur Presisi & Mekatronika',
    };

    const res = filterAndSortJobs([jobWithoutExplicitTraining], {
      trainingProgram: 'Diklat Underwater Wet Welding (Pengelasan Bawah Air)',
    });

    expect(res.jobs.map((j) => j.id)).toContain('job-welder-fallback');
  });
});
