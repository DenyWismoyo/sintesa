// Lokasi file: src/services/learningReview.service.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from 'firebase/firestore';
import { 
  TrainingReviewProgram, 
  TrainingReviewProgramSchema,
  TrainingReviewItem, 
  TrainingReviewItemSchema 
} from '@/types';

const PROGRAMS_COLLECTION = 'training_review_programs';
const REVIEWS_COLLECTION = 'training_reviews';

// Data Default / Seed Awal Program SMK Go Global BP3MI
export const DEFAULT_SMK_GO_GLOBAL_PROGRAM: TrainingReviewProgram = {
  id: 'smk-go-global-welder-2026',
  title: 'Pelatihan dan Sertifikasi Welder (SMK Go Global)',
  slug: 'smk-go-global-welder',
  shortDescription: 'Program percepatan kompetensi teknis pengelasan (Welder) bersertifikasi internasional hasil kolaborasi BP3MI Jawa Tengah dan BLUD Solo Technopark untuk penempatan kerja global.',
  category: 'Manufaktur & Vokasi',
  batch: 'Batch II',
  year: '2026',
  organizer: 'Solo Technopark × BP3MI Jawa Tengah',
  partnerInstitution: 'BP3MI Jawa Tengah',
  targetAudience: 'Lulusan SMK Jurusan Teknik Mesin / Pengelasan & Pencari Kerja Vokasi',
  imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
  status: 'ACTIVE',
  allowPublicReview: true,
  aspects: [
    { id: 'kurikulum', label: 'Kurikulum & Standar Materi', description: 'Kesesuaian kurikulum teori dan praktik dengan standar kompetensi industri luar negeri (SMAW / GTAW / FCAW)', weight: 1 },
    { id: 'instruktur', label: 'Kompetensi Instruktur & Pengajar', description: 'Kejelasan penyampaian materi, bimbingan teknik pengelasan, dan kedisiplinan instruktur penguji', weight: 1 },
    { id: 'fasilitas', label: 'Fasilitas Bengkel & Peralatan K3', description: 'Ketersediaan mesin las modern, elektroda, ruang booth las yang memadai, dan APD keselamatan kerja', weight: 1 },
    { id: 'kesiapan_kerja', label: 'Relevansi & Kesiapan Kerja Global', description: 'Kesiapan mental, tes sertifikasi, dan fasilitasi jalur penempatan ke luar negeri oleh BP3MI', weight: 1 },
    { id: 'pelayanan', label: 'Pelayanan & Fasilitas Penunjang', description: 'Kenyamanan lingkungan belajar, asrama, katering, serta keramahan panitia Solo Technopark', weight: 1 },
  ],
  stats: {
    averageRating: 4.9,
    totalReviews: 8,
    aspectScores: {
      kurikulum: 4.9,
      instruktur: 5.0,
      fasilitas: 4.8,
      kesiapan_kerja: 4.9,
      pelayanan: 4.8,
    },
    ratingCounts: { '5': 7, '4': 1, '3': 0, '2': 0, '1': 0 },
  },
  createdAt: Date.now() - 15 * 86400 * 1000,
  updatedAt: Date.now(),
};

// Seed Contoh Review Awal untuk SMK Go Global
export const DEFAULT_INITIAL_REVIEWS: TrainingReviewItem[] = [
  {
    id: 'rev-001',
    programId: 'smk-go-global-welder-2026',
    programTitle: 'Pelatihan dan Sertifikasi Welder (SMK Go Global)',
    reviewerName: 'Aurel Rizka Affandi',
    reviewerRole: 'PESERTA',
    reviewerRoleCustom: 'Peserta Welder Batch II (Kendal)',
    reviewerInstitution: 'SMK N Kendal',
    overallRating: 5,
    aspectRatings: { kurikulum: 5, instruktur: 5, fasilitas: 5, kesiapan_kerja: 5, pelayanan: 5 },
    headline: 'Pelatihan Sangat Intensif, Peralatan Las Sesuai Standar Pabrik Jepang',
    feedback: 'Instruktur di Solo Technopark sangat teliti mengajarkan sudut elektroda dan penetrasi las. Booth praktiknya bersih, exhaust ventilasi bagus sehingga aman untuk pernapasan. Saya merasa jauh lebih percaya diri menghadapi tes kerja di luar negeri.',
    suggestions: 'Semoga durasi praktik malam hari bisa ditambah untuk memperbanyak jam terbang sebelum ujian sertifikasi BNSP.',
    isRecommended: true,
    status: 'PUBLISHED',
    adminResponse: 'Terima kasih Aurel atas ulasannya! Kami bangga dengan dedikasi Anda selama pelatihan. Terus asah keterampilan dan sukses dalam penempatan kerja luar negeri.',
    adminResponseAt: Date.now() - 5 * 86400 * 1000,
    likesCount: 14,
    createdAt: Date.now() - 7 * 86400 * 1000,
  },
  {
    id: 'rev-002',
    programId: 'smk-go-global-welder-2026',
    programTitle: 'Pelatihan dan Sertifikasi Welder (SMK Go Global)',
    reviewerName: 'Bambang Supriyanto, S.T., M.Eng.',
    reviewerRole: 'MENTOR',
    reviewerRoleCustom: 'Instruktur Penguji Las Asosiasi Pengelasan Indonesia',
    reviewerInstitution: 'Asosiasi Pengelasan Indonesia (API)',
    overallRating: 5,
    aspectRatings: { kurikulum: 5, instruktur: 5, fasilitas: 4, kesiapan_kerja: 5, pelayanan: 5 },
    headline: 'Peserta Memiliki Disiplin Kerja Tinggi dan Mentalitas Siap Bersaing Global',
    feedback: 'Program SMK Go Global ini menjadi jembatan yang sangat efektif antara lulusan SMK Jawa Tengah dengan kebutuhan industri galangan kapal dan manufaktur internasional. Tingkat kelulusan tes visual dan bending peserta angkatan ini mencapai di atas 90%.',
    suggestions: 'Perlu terus memperbarui modul welding otomatis (orbital welding) untuk mengantisipasi teknologi masa depan.',
    isRecommended: true,
    status: 'PUBLISHED',
    adminResponse: 'Masukan yang sangat berharga Bapak Bambang. Kurikulum orbital welding sedang kami rancang bersama mitra industri untuk batch mendatang.',
    adminResponseAt: Date.now() - 3 * 86400 * 1000,
    likesCount: 21,
    createdAt: Date.now() - 4 * 86400 * 1000,
  },
  {
    id: 'rev-003',
    programId: 'smk-go-global-welder-2026',
    programTitle: 'Pelatihan dan Sertifikasi Welder (SMK Go Global)',
    reviewerName: 'PT Danareksa Global Talent (Mitra Rekruter)',
    reviewerRole: 'INDUSTRI',
    reviewerRoleCustom: 'Agency Rekrutmen Tenaga Terampil Luar Negeri',
    reviewerInstitution: 'PT Danareksa Global Talent',
    overallRating: 5,
    aspectRatings: { kurikulum: 5, instruktur: 5, fasilitas: 5, kesiapan_kerja: 5, pelayanan: 4 },
    headline: 'Lulusan Memiliki Sertifikat Resmi dan Sikap Kerja (Attitude) yang Matang',
    feedback: 'Sebagai mitra penyalur tenaga kerja ke Asia Timur, kami melihat lulusan welder dari Solo Technopark yang bekerjasama dengan BP3MI memiliki keunggulan pada kedisiplinan K3 dan kemampuan membaca diagram ISO welding symbols.',
    suggestions: 'Pertahankan pembekalan bahasa asing (Jepang/Korea/Inggris teknis) secara paralel selama pelatihan.',
    isRecommended: true,
    status: 'PUBLISHED',
    adminResponse: 'Terima kasih atas kepercayaan PT Danareksa. Kami berkomitmen terus menyuplai talenta terbaik Indonesia ke kancah global.',
    adminResponseAt: Date.now() - 1 * 86400 * 1000,
    likesCount: 18,
    createdAt: Date.now() - 2 * 86400 * 1000,
  },
];

export const learningReviewService = {
  /**
   * Mengambil semua program yang dibuka untuk direview
   * Otomatis melakukan seed jika koleksi masih kosong
   */
  getReviewPrograms: async (statusFilter?: string): Promise<TrainingReviewProgram[]> => {
    try {
      const q = statusFilter && statusFilter !== 'ALL'
        ? query(collection(db, PROGRAMS_COLLECTION), where('status', '==', statusFilter))
        : query(collection(db, PROGRAMS_COLLECTION), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Otomatis Seed Program SMK Go Global BP3MI jika belum ada
        await setDoc(doc(db, PROGRAMS_COLLECTION, DEFAULT_SMK_GO_GLOBAL_PROGRAM.id), DEFAULT_SMK_GO_GLOBAL_PROGRAM);
        
        // Seed contoh ulasan awal
        for (const rev of DEFAULT_INITIAL_REVIEWS) {
          await setDoc(doc(db, REVIEWS_COLLECTION, rev.id!), rev);
        }

        return [DEFAULT_SMK_GO_GLOBAL_PROGRAM];
      }

      const list: TrainingReviewProgram[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as TrainingReviewProgram);
      });
      return list;
    } catch (err) {
      console.error('Error fetching review programs:', err);
      // Fallback data statis jika offline / network trouble
      return [DEFAULT_SMK_GO_GLOBAL_PROGRAM];
    }
  },

  /**
   * Ambil detail program berdasarkan ID
   */
  getReviewProgramById: async (id: string): Promise<TrainingReviewProgram | null> => {
    try {
      const snap = await getDoc(doc(db, PROGRAMS_COLLECTION, id));
      if (!snap.exists()) {
        if (id === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id) {
          return DEFAULT_SMK_GO_GLOBAL_PROGRAM;
        }
        return null;
      }
      return { id: snap.id, ...snap.data() } as TrainingReviewProgram;
    } catch (err) {
      console.error('Error fetching review program by id:', err);
      if (id === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id) {
        return DEFAULT_SMK_GO_GLOBAL_PROGRAM;
      }
      return null;
    }
  },

  /**
   * Simpan atau buat program review baru (Admin)
   */
  saveReviewProgram: async (data: Partial<TrainingReviewProgram>): Promise<{ success: boolean; id: string }> => {
    try {
      const id = data.id || `program-${Date.now()}`;
      const payload: TrainingReviewProgram = {
        id,
        title: data.title || 'Program Pelatihan',
        slug: data.slug || id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        shortDescription: data.shortDescription || '',
        category: data.category || 'Manufaktur & Vokasi',
        batch: data.batch || 'Batch I',
        year: data.year || new Date().getFullYear().toString(),
        organizer: data.organizer || 'Solo Technopark',
        partnerInstitution: data.partnerInstitution || '',
        targetAudience: data.targetAudience || 'Umum & Lulusan Vokasi',
        imageUrl: data.imageUrl || '',
        status: data.status || 'ACTIVE',
        allowPublicReview: data.allowPublicReview ?? true,
        aspects: data.aspects && data.aspects.length > 0 ? data.aspects : DEFAULT_SMK_GO_GLOBAL_PROGRAM.aspects,
        stats: data.stats || {
          averageRating: 0,
          totalReviews: 0,
          aspectScores: {},
          ratingCounts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, PROGRAMS_COLLECTION, id), payload, { merge: true });
      return { success: true, id };
    } catch (err: any) {
      console.error('Error saving review program:', err);
      throw new Error(err.message || 'Gagal menyimpan program review');
    }
  },

  /**
   * Hapus program review (Admin)
   */
  deleteReviewProgram: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, PROGRAMS_COLLECTION, id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting review program:', err);
      throw new Error(err.message || 'Gagal menghapus program review');
    }
  },

  /**
   * Mengambil ulasan untuk program tertentu
   */
  getProgramReviews: async (programId: string, statusFilter: string = 'PUBLISHED'): Promise<TrainingReviewItem[]> => {
    try {
      let q = query(
        collection(db, REVIEWS_COLLECTION),
        where('programId', '==', programId),
        orderBy('createdAt', 'desc')
      );

      if (statusFilter !== 'ALL') {
        q = query(
          collection(db, REVIEWS_COLLECTION),
          where('programId', '==', programId),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty && programId === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id) {
        return DEFAULT_INITIAL_REVIEWS;
      }

      const reviews: TrainingReviewItem[] = [];
      snapshot.forEach(d => {
        reviews.push({ id: d.id, ...d.data() } as TrainingReviewItem);
      });
      return reviews;
    } catch (err) {
      console.error('Error fetching reviews:', err);
      if (programId === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id) {
        return DEFAULT_INITIAL_REVIEWS;
      }
      return [];
    }
  },

  /**
   * Mengambil semua ulasan (untuk panel admin moderasi)
   */
  getAllReviewsForAdmin: async (): Promise<TrainingReviewItem[]> => {
    try {
      const q = query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return DEFAULT_INITIAL_REVIEWS;
      }

      const reviews: TrainingReviewItem[] = [];
      snapshot.forEach(d => {
        reviews.push({ id: d.id, ...d.data() } as TrainingReviewItem);
      });
      return reviews;
    } catch (err) {
      console.error('Error fetching all reviews for admin:', err);
      return DEFAULT_INITIAL_REVIEWS;
    }
  },

  /**
   * Kirim review baru dari publik (Akses Publik Tanpa Perlu Login)
   */
  submitPublicReview: async (reviewInput: Partial<TrainingReviewItem>): Promise<{ success: boolean; id: string }> => {
    try {
      const programId = reviewInput.programId || DEFAULT_SMK_GO_GLOBAL_PROGRAM.id;
      const parsed = TrainingReviewItemSchema.parse({
        ...reviewInput,
        programId,
        programTitle: reviewInput.programTitle || 'Program Pelatihan',
        status: 'PUBLISHED', // Default dipublikasikan
        likesCount: 0,
        createdAt: Date.now(),
      });

      const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), parsed);

      // Hitung ulang statistik program
      try {
        const reviewsSnap = await getDocs(
          query(collection(db, REVIEWS_COLLECTION), where('programId', '==', programId), where('status', '==', 'PUBLISHED'))
        );

        let total = 0;
        let sumOverall = 0;
        const counts: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        const aspectSums: Record<string, number> = {};
        const aspectCounts: Record<string, number> = {};

        reviewsSnap.forEach(d => {
          const r = d.data() as TrainingReviewItem;
          total++;
          sumOverall += r.overallRating || 5;
          const scoreKey = String(Math.round(r.overallRating || 5));
          counts[scoreKey] = (counts[scoreKey] || 0) + 1;

          if (r.aspectRatings) {
            Object.entries(r.aspectRatings).forEach(([aspKey, aspVal]) => {
              aspectSums[aspKey] = (aspectSums[aspKey] || 0) + aspVal;
              aspectCounts[aspKey] = (aspectCounts[aspKey] || 0) + 1;
            });
          }
        });

        const avg = total > 0 ? Number((sumOverall / total).toFixed(1)) : 5;
        const aspectScores: Record<string, number> = {};
        Object.keys(aspectSums).forEach(aspKey => {
          aspectScores[aspKey] = Number((aspectSums[aspKey] / (aspectCounts[aspKey] || 1)).toFixed(1));
        });

        await updateDoc(doc(db, PROGRAMS_COLLECTION, programId), {
          'stats.averageRating': avg,
          'stats.totalReviews': total,
          'stats.ratingCounts': counts,
          'stats.aspectScores': aspectScores,
          updatedAt: Date.now(),
        });
      } catch (statErr) {
        console.warn('Gagal mengupdate agregat statistik program:', statErr);
      }

      return { success: true, id: docRef.id };
    } catch (err: any) {
      console.error('Error submitting public review:', err);
      throw new Error(err.message || 'Gagal mengirim ulasan.');
    }
  },

  /**
   * Moderasi Ulasan (Admin: Ubah Status PUBLISHED/PENDING/REJECTED atau Tanggapi)
   */
  moderateReview: async (
    reviewId: string, 
    status: 'PUBLISHED' | 'PENDING' | 'REJECTED', 
    adminResponse?: string
  ): Promise<{ success: boolean }> => {
    try {
      const updatePayload: any = { status };
      if (typeof adminResponse === 'string') {
        updatePayload.adminResponse = adminResponse;
        updatePayload.adminResponseAt = Date.now();
      }
      await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), updatePayload);
      return { success: true };
    } catch (err: any) {
      console.error('Error moderating review:', err);
      throw new Error(err.message || 'Gagal memoderasi ulasan.');
    }
  },

  /**
   * Tambah Like / Reaksi Berguna pada ulasan (Publik)
   */
  likeReview: async (reviewId: string): Promise<{ success: boolean }> => {
    try {
      await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
        likesCount: increment(1)
      });
      return { success: true };
    } catch (err) {
      console.warn('Gagal memberi like review:', err);
      return { success: false };
    }
  }
};

