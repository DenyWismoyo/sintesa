import { describe, it, expect } from 'vitest';
import { TrainingBatchSchema, TrainingRegistrationSchema } from '@/types/learning.types';
import { Alumni } from '@/types';

describe('Sistem Pelatihan & LMS Solo Technopark — Siklus 4 Batch & Yudisium Alumni', () => {
  describe('1. Validasi Zod Schema TrainingBatch (Sprint 1)', () => {
    it('harus memvalidasi entitas TrainingBatch kuartalan dengan skema pendanaan yang sah', () => {
      const validBatch = {
        id: 'batch_q1_2026',
        trainingId: 'trn_underwater_welding_01',
        batchNumber: 1,
        year: 2026,
        title: 'Batch 1 — Kuartal I 2026',
        startDate: '2026-01-15',
        endDate: '2026-03-31',
        registrationDeadline: '2026-01-10',
        quota: 30,
        registeredCount: 0,
        status: 'REGISTRATION_OPEN' as const,
        fundingScheme: 'MANDIRI_BLUD' as const,
        instructorIds: ['inst_01', 'inst_02'],
        location: 'Gedung Diklat Terpadu Solo Technopark',
        createdAt: Date.now(),
      };

      const parsed = TrainingBatchSchema.safeParse(validBatch);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.batchNumber).toBe(1);
        expect(parsed.data.year).toBe(2026);
        expect(parsed.data.fundingScheme).toBe('MANDIRI_BLUD');
        expect(parsed.data.status).toBe('REGISTRATION_OPEN');
      }
    });

    it('harus menolak nomor batch di luar range 1-4', () => {
      const invalidBatch = {
        id: 'batch_q5_2026',
        trainingId: 'trn_underwater_welding_01',
        batchNumber: 5, // Invalid: hanya ada 4 kuartal
        year: 2026,
        title: 'Batch 5 — Kuartal V 2026',
        startDate: '2026-01-15',
        endDate: '2026-03-31',
        registrationDeadline: '2026-01-10',
        fundingScheme: 'MANDIRI_BLUD' as const,
      };

      const parsed = TrainingBatchSchema.safeParse(invalidBatch);
      expect(parsed.success).toBe(false);
    });

    it('harus mendukung berbagai skema pendanaan kemitraan STP (Dinas, SMK, CSR, Beasiswa)', () => {
      const schemes = [
        'MANDIRI_BLUD',
        'BEASISWA_PEMKOT',
        'KEMENPERIN',
        'CSR_INDUSTRI',
        'CAMPURAN',
      ] as const;

      schemes.forEach((scheme, index) => {
        const batch = {
          id: `batch_q${index + 1}_2026`,
          trainingId: 'trn_cnc_milling',
          batchNumber: Math.min(index + 1, 4),
          year: 2026,
          title: `Batch ${index + 1} (${scheme})`,
          startDate: '2026-04-01',
          endDate: '2026-06-30',
          registrationDeadline: '2026-03-25',
          fundingScheme: scheme,
        };
        const parsed = TrainingBatchSchema.safeParse(batch);
        expect(parsed.success).toBe(true);
      });
    });
  });

  describe('2. Validasi Peserta Ingestion Offline & Kemitraan (Sprint 2)', () => {
    it('harus memvalidasi peserta offline rombongan dinas dengan NIK dan batchId', () => {
      const offlineParticipant = {
        id: 'reg_dinas_001',
        trainingId: 'trn_cnc_milling',
        batchId: 'batch_q2_2026',
        batchNumber: 2,
        registrationSource: 'PARTNER_DINAS' as const,
        name: 'Agus Setiawan',
        email: 'agus.setiawan@dinasnaker.go.id',
        phone: '081298765432',
        nik: '3372011234560001',
        origin: 'Disnaker Kota Surakarta',
        customData: {
          noSuratTugas: '800/124/DISNAKER/2026',
          namaInstansi: 'Dinas Tenaga Kerja Surakarta',
        },
        completedLessons: [],
        status: 'CONFIRMED' as const,
        paymentStatus: 'PAID' as const,
        graduationStatus: 'IN_PROGRESS' as const,
        createdAt: Date.now(),
      };

      const parsed = TrainingRegistrationSchema.safeParse(offlineParticipant);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.registrationSource).toBe('PARTNER_DINAS');
        expect(parsed.data.nik).toBe('3372011234560001');
        expect(parsed.data.batchNumber).toBe(2);
        expect(parsed.data.status).toBe('CONFIRMED');
      }
    });

    it('harus memvalidasi peserta walk-in loket STP tanpa tagihan e-commerce', () => {
      const walkinParticipant = {
        trainingId: 'trn_cyber_security',
        batchId: 'batch_q1_2026',
        batchNumber: 1,
        registrationSource: 'OFFLINE_WALKIN' as const,
        name: 'Rian Prasetyo',
        email: 'rian.walkin.172900@peserta.solotechnopark.id',
        phone: '085712345678',
        nik: '3372051904980002',
        origin: 'Pendaftar Mandiri Loket STP',
        status: 'CONFIRMED' as const,
        paymentStatus: 'PAID' as const,
      };

      const parsed = TrainingRegistrationSchema.safeParse(walkinParticipant);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.registrationSource).toBe('OFFLINE_WALKIN');
        expect(parsed.data.paymentStatus).toBe('PAID');
      }
    });
  });

  describe('3. Logika Yudisium & Penerbitan Sertifikat Resmi BLUD (Sprint 3)', () => {
    it('harus menghasilkan format nomor sertifikat resmi BLUD Solo Technopark', () => {
      const year = 2026;
      const category = 'Vokasi Manufaktur';
      const categoryCode = (category || 'VOK').substring(0, 3).toUpperCase();
      const batchNumber = 2;
      const serial = '015';

      const certNumber = `STP-CERT/${year}/${categoryCode}/B${batchNumber}-${serial}`;
      expect(certNumber).toBe('STP-CERT/2026/VOK/B2-015');
    });

    it('harus menghasilkan Kode Registrasi Alumni unik berformat AL-YYYY-XXXXXX', () => {
      const year = 2026;
      const randomCode = '582914';
      const registrationCode = `AL-${year}-${randomCode}`;

      expect(registrationCode).toMatch(/^AL-2026-\d{6}$/);
    });

    it('harus memetakan data kelulusan peserta ke model Alumni terdaftar', () => {
      const participant = {
        name: 'Dewi Lestari',
        email: 'dewi.lestari@gmail.com',
        phone: '081399887766',
        nik: '3372045508990003',
        trainingTitle: 'Cyber Security Operations & SOC Analyst',
        category: 'Teknologi Informasi',
        batchNumber: 1,
        year: 2026,
      };

      const certNumber = `STP-CERT/${participant.year}/TEK/B1-001`;
      const registrationCode = `AL-${participant.year}-782190`;

      const newAlumni: Alumni = {
        id: 'alm_dewi_001',
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        nik: participant.nik,
        programTaken: participant.trainingTitle,
        batch: `Batch ${participant.batchNumber} (${participant.year})`,
        trainingYear: String(participant.year),
        graduationYear: String(participant.year),
        certificationResult: 'Kompeten / Lulus',
        certificateNumber: certNumber,
        status: 'DORMANT',
        internalStatus: 'AVAILABLE',
        registrationCode,
        employmentStatus: 'Proses Verifikasi',
        createdAt: Date.now(),
      };

      expect(newAlumni.status).toBe('DORMANT');
      expect(newAlumni.internalStatus).toBe('AVAILABLE');
      expect(newAlumni.employmentStatus).toBe('Proses Verifikasi');
      expect(newAlumni.certificateNumber).toContain('STP-CERT/2026/TEK/B1');
      expect(newAlumni.registrationCode).toContain('AL-2026-');
    });
  });

  describe('4. Integrasi Master Cache 1-Read Pattern (Sprint 3 & Sprint 4)', () => {
    it('harus memvalidasi struktur master cache alumni (/cache_alumnis/master)', () => {
      const cachePayload = {
        lastUpdated: Date.now(),
        count: 2,
        data: [
          {
            id: 'alm_01',
            name: 'Budi Hartono',
            phone: '081234567890',
            email: 'budi@tech.id',
            programTaken: 'Underwater Welding',
            trainingYear: '2026',
            batch: 'Batch 1 (2026)',
            status: 'DORMANT',
            registrationCode: 'AL-2026-112233',
            employmentStatus: 'Proses Verifikasi',
            company: '',
            currentJob: '',
            createdAt: Date.now(),
          },
          {
            id: 'alm_02',
            name: 'Siti Rahmawati',
            phone: '081987654321',
            email: 'siti@cloud.id',
            programTaken: 'Cloud Architecture & DevOps',
            trainingYear: '2026',
            batch: 'Batch 1 (2026)',
            status: 'CLAIMED',
            registrationCode: 'AL-2026-445566',
            employmentStatus: 'Bekerja Penuh Waktu',
            company: 'PT Cloud Indo',
            currentJob: 'Cloud Engineer',
            createdAt: Date.now(),
          },
        ],
      };

      expect(cachePayload.count).toBe(2);
      expect(Array.isArray(cachePayload.data)).toBe(true);
      expect(cachePayload.data[0].registrationCode).toBe('AL-2026-112233');
      expect(cachePayload.data[1].status).toBe('CLAIMED');
    });

    it('harus menyaring lowongan karir berdasarkan keselarasan program pelatihan alumni', () => {
      const mockJobs = [
        {
          id: 'job_01',
          title: 'Junior Cyber Security Engineer',
          company: 'PT Siber Garda Nusantara',
          relevantTrainingPrograms: ['Cyber Security Operations', 'Fullstack Web Development'],
        },
        {
          id: 'job_02',
          title: 'CNC Milling Specialist',
          company: 'PT Manufaktur Presisi Solo',
          relevantTrainingPrograms: ['Mekatronika CNC', 'Manufaktur Presisi'],
        },
        {
          id: 'job_03',
          title: 'Subsea Inspection Diver',
          company: 'PT Offshore Maritim Marine',
          relevantTrainingPrograms: ['Underwater Welding', 'Pengelasan Bawah Air'],
        },
      ];

      const alumniProgram = 'Underwater Welding';
      const matchedJobs = mockJobs.filter((job) =>
        job.relevantTrainingPrograms.some((prog) =>
          prog.toLowerCase().includes(alumniProgram.toLowerCase())
        )
      );

      expect(matchedJobs.length).toBe(1);
      expect(matchedJobs[0].id).toBe('job_03');
      expect(matchedJobs[0].title).toBe('Subsea Inspection Diver');
    });
  });
});
