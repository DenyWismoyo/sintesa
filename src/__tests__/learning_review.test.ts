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

describe('Modul Review Program Pelatihan Vokasi (P3MI Focus & Anonimitas)', () => {
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
          averageRating: 0,
          totalReviews: 0,
          aspectScores: { kurikulum: 0, fasilitas: 0, instruktur: 0 },
          ratingCounts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
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

    it('harus mengizinkan pengiriman ulasan publik anonim secara default', () => {
      const publicReviewData = {
        programId: 'smk-go-global-welder-2026',
        programTitle: 'Pelatihan dan Sertifikasi Welder (SMK Go Global × BP3MI)',
        isAnonymous: true,
        reviewerRole: 'PESERTA' as const,
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
        expect(result.data.isAnonymous).toBe(true);
        expect(result.data.reviewerRole).toBe('PESERTA');
        expect(result.data.overallRating).toBe(5);
        expect(result.data.status).toBe('PUBLISHED');
      }
    });
  });

  describe('2. Pengaturan Fokus P3MI & Reset Bersih Ulasan', () => {
    it('harus menyediakan program SMK Go Global BP3MI sebagai sasaran ulasan utama', () => {
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

    it('harus memastikan daftar ulasan awal di-reset bersih (0 ulasan dummy)', () => {
      expect(DEFAULT_INITIAL_REVIEWS.length).toBe(0);
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.stats.totalReviews).toBe(0);
      expect(DEFAULT_SMK_GO_GLOBAL_PROGRAM.stats.averageRating).toBe(0);
    });

    it('harus menyamarkan nama pengulas secara cerdas via getAnonymousReviewerName', () => {
      const pesertaAnon = learningReviewService.getAnonymousReviewerName('PESERTA', 'Kendal');
      expect(pesertaAnon).toContain('Peserta Welder');
      expect(pesertaAnon).toContain('Anonim');

      const mentorAnon = learningReviewService.getAnonymousReviewerName('MENTOR');
      expect(mentorAnon).toContain('Instruktur');
      expect(mentorAnon).toContain('Anonim');

      const industriAnon = learningReviewService.getAnonymousReviewerName('INDUSTRI', 'Galangan Kapal');
      expect(industriAnon).toContain('Mitra Industri');
      expect(industriAnon).toContain('Anonim');

      const publikAnon = learningReviewService.getAnonymousReviewerName('PUBLIK');
      expect(publikAnon).toContain('Masyarakat');
      expect(publikAnon).toContain('Anonim');
    });
  });

  describe('3. Fitur Upload Banner & Reset Ulasan Admin', () => {
    it('harus memiliki fungsi upload banner gambar dan reset ulasan di service', () => {
      expect(typeof learningReviewService.uploadProgramBanner).toBe('function');
      expect(typeof learningReviewService.resetAllReviews).toBe('function');
    });
  });

  describe('4. Resiliensi & Fallback Data Service', () => {
    it('harus mengembalikan program default SMK Go Global saat offline/fallback', async () => {
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

    it('harus mampu menemukan program pelatihan berdasarkan slug (smk-go-global-welder)', async () => {
      const program = await learningReviewService.getReviewProgramById('smk-go-global-welder');
      expect(program).toBeDefined();
      expect(program?.id).toBe('smk-go-global-welder-2026');
      expect(program?.slug).toBe('smk-go-global-welder');
      expect(program?.title).toContain('SMK Go Global');
    });
  });
});
