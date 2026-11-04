// Lokasi file: src/services/learningReview.service.ts
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storage.service';
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

// Data Default Program SMK Go Global BP3MI (Satu-satunya Target Ulasan Utama)
export const DEFAULT_SMK_GO_GLOBAL_PROGRAM: TrainingReviewProgram = {
  id: 'smk-go-global-welder-2026',
  title: 'Pelatihan dan Sertifikasi Welder (SMK Go Global × BP3MI)',
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
    averageRating: 0,
    totalReviews: 0,
    aspectScores: {
      kurikulum: 0,
      instruktur: 0,
      fasilitas: 0,
      kesiapan_kerja: 0,
      pelayanan: 0,
    },
    ratingCounts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
  },
  createdAt: Date.now() - 15 * 86400 * 1000,
  updatedAt: Date.now(),
};

// Reset Ulasan Awal Menjadi Kosong (Bersih / Organik)
export const DEFAULT_INITIAL_REVIEWS: TrainingReviewItem[] = [];

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
   * Ambil detail program berdasarkan ID atau Slug
   */
  getReviewProgramById: async (idOrSlug: string): Promise<TrainingReviewProgram | null> => {
    try {
      // 1. Coba cari berdasarkan Document ID
      const snap = await getDoc(doc(db, PROGRAMS_COLLECTION, idOrSlug));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as TrainingReviewProgram;
      }

      // 2. Jika tidak ada dokumen dengan ID tersebut, coba cari berdasarkan field 'slug'
      const q = query(
        collection(db, PROGRAMS_COLLECTION),
        where('slug', '==', idOrSlug),
        limit(1)
      );
      const slugSnap = await getDocs(q);
      if (!slugSnap.empty) {
        const d = slugSnap.docs[0];
        return { id: d.id, ...d.data() } as TrainingReviewProgram;
      }

      // 3. Fallback jika default program
      if (
        idOrSlug === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id ||
        idOrSlug === DEFAULT_SMK_GO_GLOBAL_PROGRAM.slug
      ) {
        return DEFAULT_SMK_GO_GLOBAL_PROGRAM;
      }
      return null;
    } catch (err) {
      console.error('Error fetching review program by id/slug:', err);
      if (
        idOrSlug === DEFAULT_SMK_GO_GLOBAL_PROGRAM.id ||
        idOrSlug === DEFAULT_SMK_GO_GLOBAL_PROGRAM.slug
      ) {
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
   * Helper cerdas penyamaran nama anonim pengulas
   */
  getAnonymousReviewerName: (role?: string, customDetail?: string): string => {
    switch (role) {
      case 'PESERTA':
        return customDetail ? `Peserta Welder (${customDetail}) • Anonim` : 'Peserta Pelatihan • Anonim';
      case 'MENTOR':
        return customDetail ? `Instruktur Penguji (${customDetail}) • Anonim` : 'Instruktur / Mentor • Anonim';
      case 'INDUSTRI':
        return customDetail ? `Mitra Industri (${customDetail}) • Anonim` : 'Mitra Industri / Perusahaan • Anonim';
      case 'PUBLIK':
      default:
        return 'Masyarakat / Pengamat Vokasi • Anonim';
    }
  },

  /**
   * Upload Banner Gambar Program Pelatihan ke Firebase Storage
   */
  uploadProgramBanner: async (file: File): Promise<string> => {
    return await storageService.uploadImage(file, 'training_reviews/banners');
  },

  /**
   * Reset / Kosongkan Seluruh Ulasan Pengulas (Admin Action)
   */
  resetAllReviews: async (programId: string = DEFAULT_SMK_GO_GLOBAL_PROGRAM.id): Promise<{ success: boolean; deletedCount: number }> => {
    try {
      const q = programId === 'ALL'
        ? collection(db, REVIEWS_COLLECTION)
        : query(collection(db, REVIEWS_COLLECTION), where('programId', '==', programId));
        
      const snap = await getDocs(q);
      let count = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, REVIEWS_COLLECTION, d.id));
        count++;
      }

      // Reset juga agregat statistik program terkait
      if (programId && programId !== 'ALL') {
        try {
          await updateDoc(doc(db, PROGRAMS_COLLECTION, programId), {
            'stats.averageRating': 0,
            'stats.totalReviews': 0,
            'stats.aspectScores': {
              kurikulum: 0,
              instruktur: 0,
              fasilitas: 0,
              kesiapan_kerja: 0,
              pelayanan: 0,
            },
            'stats.ratingCounts': { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn('Gagal reset stats program:', e);
        }
      }

      return { success: true, deletedCount: count };
    } catch (err: any) {
      console.error('Error resetting reviews:', err);
      throw new Error(err.message || 'Gagal mereset ulasan.');
    }
  },

  /**
   * Kirim review baru dari publik (Akses Publik Tanpa Perlu Login & Anonim-First)
   */
  submitPublicReview: async (reviewInput: Partial<TrainingReviewItem>): Promise<{ success: boolean; id: string }> => {
    try {
      const programId = reviewInput.programId || DEFAULT_SMK_GO_GLOBAL_PROGRAM.id;
      const isAnon = reviewInput.isAnonymous !== false; // Default anonim
      let finalReviewerName = (reviewInput.reviewerName || '').trim();

      if (isAnon) {
        // Jika nama kosong atau memilih anonim, gunakan nama aman
        if (!finalReviewerName || finalReviewerName.toLowerCase().includes('anonim')) {
          finalReviewerName = learningReviewService.getAnonymousReviewerName(
            reviewInput.reviewerRole,
            reviewInput.reviewerRoleCustom || reviewInput.reviewerInstitution
          );
        } else {
          // Samarkan inisial jika user menulis nama
          const parts = finalReviewerName.split(' ');
          const masked = parts.map(p => p.length > 2 ? p[0] + '*'.repeat(p.length - 1) : p).join(' ');
          finalReviewerName = `${masked} (Anonim)`;
        }
      } else if (!finalReviewerName) {
        finalReviewerName = 'Pengulas Terverifikasi';
      }

      const parsed = TrainingReviewItemSchema.parse({
        ...reviewInput,
        programId,
        programTitle: reviewInput.programTitle || 'Pelatihan dan Sertifikasi Welder (SMK Go Global × BP3MI)',
        reviewerName: finalReviewerName,
        isAnonymous: isAnon,
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

