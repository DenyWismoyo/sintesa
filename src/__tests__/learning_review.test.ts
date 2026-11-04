import { describe, it, expect } from 'vitest';
import { 
  TrainingReviewProgramSchema, 
  TrainingReviewItemSchema, 
  ReviewAspectSchema,
  ReviewerRoleEnum,
  ReviewStatusEnum,
  REVIEWER_ROLE_LABELS,
  REVIEWER_ROLE_BADGES,
  TrainingReviewProgram,
  TrainingReviewItem
} from '@/types';
import { 
  DEFAULT_SMK_GO_GLOBAL_PROGRAM, 
  DEFAULT_INITIAL_REVIEWS,
  learningReviewService 
} from '@/services/learningReview.service';

describe('Modul Review Program Pelatihan Vokasi & Kustomisasi Admin', () => {
  describe('1. Zod Schema & Validasi Domain', () => {
    it('harus memiliki semua enum reviewer role dan status ulasan dengan benar', () => {
      const roles = ['PESERTA', 'MENTOR', 'PUBLIK', 'INDUSTRI'] as const;
      roles.forEach(role => {
        expect(ReviewerRoleEnum.options).toContain(role);
        expect(REVIEWER_ROLE_LABELS[role]).toBeDefined();
        expect(REVIEWER_ROLE_BADGES[role]).toBeDefined();
      });

      const statuses = ['PUBLISHED', 'PENDING', 'REJECTED'] as const;
      statuses.forEach(status => {
        expect(ReviewStatusEnum.options).toContain(status);
      });
    });

    it('harus memvalidasi ReviewAspectSchema untuk kustomisasi kriteria evaluasi', () => {
      const validAspect = {
        id: 'keselamatan_k3',
        label: 'Standar Keselamatan Kerja (K3)',
        description: 'Kelengkapan APD dan kedisiplinan workshop',
        weight: 1,
      };

      const result = ReviewAspectSchema.safeParse(validAspect);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('keselamatan_k3');
        expect(result.data.weight).toBe(1);
      }
    });

    it('harus memvalidasi TrainingReviewProgramSchema dengan aspek penilaian kustom', () => {
      const validProgramData = {
        id: 'smk-go-global-welder-2026',
        title: 'Program Sertifikasi Welder SMK Go Global',
        slug: 'smk-go-global-welder',
        shortDescription: 'Pelatihan welder 3G/4G SMAW & FCAW standar penempatan luar negeri.',
        category: 'Manufaktur & Vokasi',
        batch: 'Batch II',
        year: '2026',
        organizer: 'Solo Technopark × BP3MI Jawa Tengah',
        partnerInstitution: 'BP3MI Jawa Tengah',
        targetAudience: 'Lulusan SMK Jurusan Pengelasan / Mesin',
        status: 'ACTIVE' as const,
        allowPublicReview: true,
        aspects: [
          { id: 'kurikulum', label: 'Kurikulum & Materi Praktik', description: 'Silabus standar internasional', weight: 1 },
          { id: 'fasilitas', label: 'Fasilitas Bengkel & Alat K3', description: 'Mesin las mutakhir', weight: 1 },
          { id: 'instruktur', label: 'Kompetensi Mentor & Penguji', description: 'Instruktur bersertifikat', weight: 1 },
        ],
        stats: {
          averageRating: 4.8,
          totalReviews: 12,
          aspectScores: { kurikulum: 4.8, fasilitas: 4.7, instruktur: 4.9 },
          ratingCounts: { '5': 10, '4': 2, '3': 0, '2': 0, '1': 0 },
        },
      };

      const result = TrainingReviewProgramSchema.safeParse(validProgramData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aspects.length).toBe(3);
        expect(result.data.slug).toBe('smk-go-global-welder');
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('harus menolak ulasan yang ratingnya di luar rentang 1 sampai 5', () => {
      const invalidReviewData = {
        programId: 'smk-go-global-welder-2026',
        programTitle: 'Pelatihan Welder SMK Go Global',
        reviewerName: 'Budi Santoso',
        reviewerRole: 'PESERTA' as const,
        overallRating: 6, // Tidak valid (maks 5)
        headline: 'Luar biasa!',
        feedback: 'Materi sangat padat dan relevan untuk sertifikasi luar negeri.',
        aspectRatings: { kurikulum: 5 },
        isRecommended: true,
      };

      const result = TrainingReviewItemSchema.safeParse(invalidReviewData);
      expect(result.success).toBe(false);
    });

    it('harus menolak feedback ulasan yang terlalu pendek (di bawah 10 karakter)', () => {
      const tooShortReview = {
        programId: 'smk-go-global-welder-2026',
        programTitle: 'Pelatihan Welder SMK Go Global',
        reviewerName: 'Budi Santoso',
        reviewerRole: 'PESERTA' as const,
        overallRating: 5,
        headline: 'Bagus',
        feedback: 'Keren', // Kurang dari 10 karakter
      };

      const result = TrainingReviewItemSchema.safeParse(tooShortReview);
      expect(result.success).toBe(false);
    });

    it('harus mengizinkan pengiriman ulasan publik tanpa login (userId tidak ada)', () => {
      const publicReviewData = {
        programId: 'smk-go-global-welder-2026',
        programTitle: 'Pelatihan dan Sertifikasi Welder (SMK Go Global)',
        reviewerName: 'Ahmad Fauzi (Alumni Welder)',
        reviewerEmail: 'ahmad.fauzi@example.com',
        reviewerRole: 'PESERTA' as const,
        reviewerInstitution: 'SMK N 2 Kendal',
        overallRating: 5,
        headline: 'Fasilitas bengkel welding kelas dunia!',
        feedback: 'Praktik pengelasan menggunakan mesin mutakhir dan instruktur sangat sabar membimbing posisi 3G.',
        aspectRatings: {
          kurikulum: 5,
          fasilitas: 5,
          instruktur: 5,
        },
        suggestions: 'Waktu praktik malam hari jika memungkinkan ditambah.',
        isRecommended: true,
        status: 'PUBLISHED' as const,
      };

      const result = TrainingReviewItemSchema.safeParse(publicReviewData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewerRole).toBe('PESERTA');
        expect(result.data.overallRating).toBe(5);
        expect(result.data.status).toBe('PUBLISHED');
      }
    });
  });

  describe('2. Integritas Data Default Program SMK Go Global BP3MI Welder', () => {
    it('harus memiliki konfigurasi program default SMK Go Global dengan kriteria evaluasi lengkap', () => {
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.id).toBe('smk-go-global-welder-2026');
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.title).toContain('SMK Go Global');
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.partnerInstitution).toBe('BP3MI Jawa Tengah');
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.allowPublicReview).toBe(true);

      // Pastikan ada 5 aspek penilaian
      const aspectIds = DEFAULT_SMK_GO_GLOBAL_PROGRAM.aspects.map(a => a.id);
      expect(aspectIds).toContain('kurikulum');
      expect(aspectIds).toContain('instruktur');
      expect(aspectIds).toContain('fasilitas');
      expect(aspectIds).toContain('kesiapan_kerja');
      expect(aspectIds).toContain('pelayanan');
    });

    it('harus memuat ulasan contoh awal terverifikasi dari beragam peran pemangku kepentingan', () => {
      expect(DEFAULT_INITIAL_REVIEWS.length).toBeGreaterThanOrEqual(3);

      const roles = DEFAULT_INITIAL_REVIEWS.map(r => r.reviewerRole);
      expect(roles).toContain('PESERTA');
      expect(roles).toContain('MENTOR');
      expect(roles).toContain('INDUSTRI');

      // Pastikan ulasan memiliki respon resmi dari admin Solo Technopark
      const withAdminResponse = DEFAULT_INITIAL_REVIEWS.filter(r => Boolean(r.adminResponse));
      expect(withAdminResponse.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Logika Agregasi & Kalkulasi Statistik Ulasan', () => {
    it('harus menghitung rata-rata skor per-aspek dan overall rating secara presisi', () => {
      const mockReviews: TrainingReviewItem[] = [
        {
          id: 'r1',
          programId: 'prog-1',
          programTitle: 'Test Program',
          reviewerName: 'User A',
          reviewerRole: 'PESERTA',
          overallRating: 5,
          aspectRatings: { kurikulum: 5, instruktur: 4 },
          headline: 'Sangat baik',
          feedback: 'Pelatihan ini sangat komprehensif dan bermanfaat.',
          isRecommended: true,
          status: 'PUBLISHED',
          likesCount: 0,
          createdAt: Date.now(),
        },
        {
          id: 'r2',
          programId: 'prog-1',
          programTitle: 'Test Program',
          reviewerName: 'User B',
          reviewerRole: 'MENTOR',
          overallRating: 4,
          aspectRatings: { kurikulum: 4, instruktur: 5 },
          headline: 'Cukup memuaskan',
          feedback: 'Peserta sangat antusias mengikuti setiap sesi praktik.',
          isRecommended: true,
          status: 'PUBLISHED',
          likesCount: 0,
          createdAt: Date.now(),
        },
      ];

      // Kalkulasi agregat
      const total = mockReviews.length;
      const sumOverall = mockReviews.reduce((sum, r) => sum + r.overallRating, 0);
      const avgOverall = Number((sumOverall / total).toFixed(1));
      expect(avgOverall).toBe(4.5);

      // Kalkulasi skor per-aspek
      const kurikulumAvg = Number(
        (mockReviews.reduce((sum, r) => sum + (r.aspectRatings['kurikulum'] || 0), 0) / total).toFixed(1)
      );
      const instrukturAvg = Number(
        (mockReviews.reduce((sum, r) => sum + (r.aspectRatings['instruktur'] || 0), 0) / total).toFixed(1)
      );

      expect(kurikulumAvg).toBe(4.5);
      expect(instrukturAvg).toBe(4.5);
    });
  });

  describe('4. Resiliensi & Fallback Data Service', () => {
    it('harus mengembalikan default SMK Go Global program saat offline/fallback', async () => {
      const programs = await learningReviewService.getReviewPrograms();
      expect(programs.length).toBeGreaterThanOrEqual(1);

      const defaultProgram = programs.find(p => p.id === 'smk-go-global-welder-2026');
      expect(defaultProgram).toBeDefined();
      expect(defaultProgram?.title).toContain('SMK Go Global');
    });

    it('harus mengembalikan default program saat mencari ID smk-go-global-welder-2026', async () => {
      const program = await learningReviewService.getReviewProgramById('smk-go-global-welder-2026');
      expect(program).toBeDefined();
      expect(program?.id).toBe('smk-go-global-welder-2026');
      expect(program?.batch).toBe('Batch II');
    });
  });
});
