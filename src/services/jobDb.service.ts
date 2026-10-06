// src/services/jobDb.service.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobListing, JobListingSchema, JobFilterParams } from '@/types/job.types';
import { MASTER_JOBS } from '@/data/jobs/masterJobs';
import { fetchJSearchJobs } from '@/services/jsearch.service';

const JOBS_COLLECTION = 'jobs';
const SYNC_METADATA_DOC = 'app_settings/jobs_sync';
const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari (seminggu sekali)

export interface JobSyncMetadata {
  lastSyncedAt: number | null;
  nextSyncAt: number | null;
  syncIntervalDays: number;
  totalJobsInDb: number;
  realtimeJobsCount: number;
  stpJobsCount: number;
  status: 'IDLE' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message?: string;
  provider: string;
}

export const jobDbService = {
  /**
   * Mengambil metadata status sinkronisasi mingguan
   */
  async getSyncMetadata(): Promise<JobSyncMetadata> {
    try {
      const snap = await getDoc(doc(db, SYNC_METADATA_DOC));
      if (snap.exists()) {
        return snap.data() as JobSyncMetadata;
      }
    } catch (err) {
      console.warn('[jobDbService] Gagal membaca metadata sync:', err);
    }

    return {
      lastSyncedAt: null,
      nextSyncAt: null,
      syncIntervalDays: 7,
      totalJobsInDb: 0,
      realtimeJobsCount: 0,
      stpJobsCount: 0,
      status: 'IDLE',
      provider: 'JSearch RapidAPI',
    };
  },

  /**
   * Mengambil lowongan langsung dari database Firestore
   */
  async getJobsFromFirestore(): Promise<JobListing[]> {
    try {
      const snap = await getDocs(
        query(collection(db, JOBS_COLLECTION), orderBy('postedAt', 'desc'), limit(150))
      );

      const jobs: JobListing[] = [];
      snap.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        const parsed = JobListingSchema.safeParse(data);
        if (parsed.success) {
          jobs.push(parsed.data);
        }
      });

      return jobs;
    } catch (err) {
      console.warn('[jobDbService] Gagal membaca Firestore jobs:', err);
      return [];
    }
  },

  /**
   * Mengambil detail satu lowongan pekerjaan berdasarkan ID atau Slug
   */
  async getJobById(idOrSlug: string): Promise<JobListing | null> {
    try {
      // 1. Coba cari direct doc id
      const snap = await getDoc(doc(db, JOBS_COLLECTION, idOrSlug));
      if (snap.exists()) {
        const parsed = JobListingSchema.safeParse({ id: snap.id, ...snap.data() });
        if (parsed.success) return parsed.data;
      }

      // 2. Coba cari by slug
      const slugQuery = query(
        collection(db, JOBS_COLLECTION),
        where('slug', '==', idOrSlug),
        limit(1)
      );
      const slugSnap = await getDocs(slugQuery);
      if (!slugSnap.empty) {
        const d = slugSnap.docs[0];
        const parsed = JobListingSchema.safeParse({ id: d.id, ...d.data() });
        if (parsed.success) return parsed.data;
      }
    } catch (err) {
      console.warn('[jobDbService] Gagal membaca job detail dari Firestore:', err);
    }

    // Fallback ke master jobs in-memory
    const fallback = MASTER_JOBS.find((j) => j.id === idOrSlug || j.slug === idOrSlug);
    return fallback || null;
  },

  /**
   * Menyimpan / memperbarui daftar lowongan ke Firestore dalam batch
   */
  async saveJobsToFirestore(jobs: JobListing[]): Promise<number> {
    if (!jobs.length) return 0;

    let savedCount = 0;
    // Firestore batch dibatasi maksimal 500 operasi per commit
    const chunkSize = 400;

    for (let i = 0; i < jobs.length; i += chunkSize) {
      const chunk = jobs.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((job) => {
        const jobRef = doc(db, JOBS_COLLECTION, job.id);
        batch.set(jobRef, job, { merge: true });
        savedCount++;
      });

      await batch.commit();
    }

    return savedCount;
  },

  /**
   * Sinkronisasi berkala seminggu sekali dari RapidAPI ke Database Firestore
   */
  async syncWeeklyJobs(options: { force?: boolean } = {}): Promise<{
    success: boolean;
    syncedCount: number;
    metadata: JobSyncMetadata;
    message: string;
  }> {
    const meta = await this.getSyncMetadata();
    const now = Date.now();

    // Cek apakah sudah lewat 7 hari atau user meminta paksa (force sync)
    const isDue = !meta.lastSyncedAt || !meta.nextSyncAt || now >= meta.nextSyncAt;

    if (!isDue && !options.force) {
      const remainingDays = Math.ceil(((meta.nextSyncAt || now) - now) / (1000 * 60 * 60 * 24));
      return {
        success: true,
        syncedCount: 0,
        metadata: {
          ...meta,
          status: 'SKIPPED',
          message: `Data masih mutakhir. Sinkronisasi otomatis berikutnya dalam ${remainingDays} hari.`,
        },
        message: `Sinkronisasi dilewati: Jadwal update berikutnya ${remainingDays} hari lagi. Gunakan opsi force untuk memperbarui sekarang.`,
      };
    }

    console.log('[jobDbService] Memulai sinkronisasi lowongan dari RapidAPI JSearch ke Firestore...');

    try {
      // 1. Siapkan data master mitra kawasan Solo Technopark
      const stpMasterJobs: JobListing[] = MASTER_JOBS.map((j) => ({
        ...j,
        source: 'stp_partner',
        isStpPartner: true,
      }));

      // 2. Tarik lowongan realtime dari RapidAPI JSearch
      const hasApiKey = Boolean(process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY);
      let realtimeJobs: JobListing[] = [];

      if (hasApiKey) {
        // Tarik beberapa klaster industri utama Solo Technopark
        const categoriesToFetch = [
          'IT Software Web Developer',
          'Teknisi Mesin CNC Manufaktur Mekatronika',
          'Cyber Security Jaringan',
          'Digital Marketing E-Commerce',
          '3D Designer Animator',
        ];

        for (const cat of categoriesToFetch) {
          try {
            const res = await fetchJSearchJobs({
              query: cat,
              location: 'Solo, Surakarta, Jawa Tengah, Indonesia',
            });
            if (res.jobs.length) {
              realtimeJobs.push(...res.jobs);
            }
          } catch (fetchErr) {
            console.warn(`[jobDbService] Gagal fetch kategori ${cat}:`, fetchErr);
          }
        }

        // Deduplikasi berdasarkan ID
        const seenIds = new Set<string>();
        realtimeJobs = realtimeJobs.filter((job) => {
          if (seenIds.has(job.id)) return false;
          seenIds.add(job.id);
          return true;
        });
      }

      // 3. Gabungkan seluruh lowongan
      const allJobsToSave: JobListing[] = [...stpMasterJobs, ...realtimeJobs];

      // 4. Simpan ke Firestore
      const totalSaved = await this.saveJobsToFirestore(allJobsToSave);

      // 5. Perbarui metadata jadwal seminggu sekali
      const nextSyncAt = now + SYNC_INTERVAL_MS;
      const updatedMetadata: JobSyncMetadata = {
        lastSyncedAt: now,
        nextSyncAt,
        syncIntervalDays: 7,
        totalJobsInDb: allJobsToSave.length,
        realtimeJobsCount: realtimeJobs.length,
        stpJobsCount: stpMasterJobs.length,
        status: 'SUCCESS',
        message: `Berhasil menyinkronkan ${allJobsToSave.length} lowongan ke database (${realtimeJobs.length} live RapidAPI + ${stpMasterJobs.length} mitra STP).`,
        provider: hasApiKey ? 'JSearch RapidAPI' : 'Internal Master STP',
      };

      await setDoc(doc(db, SYNC_METADATA_DOC), updatedMetadata, { merge: true });

      console.log(`[jobDbService] Sinkronisasi sukses! ${totalSaved} dokumen tersimpan di Firestore.`);

      return {
        success: true,
        syncedCount: totalSaved,
        metadata: updatedMetadata,
        message: updatedMetadata.message || 'Sinkronisasi lowongan selesai.',
      };
    } catch (error: any) {
      console.error('[jobDbService] Gagal sinkronisasi lowongan:', error);

      const failedMetadata: JobSyncMetadata = {
        ...meta,
        status: 'FAILED',
        message: 'Gagal sinkronisasi: ' + error.message,
      };
      await setDoc(doc(db, SYNC_METADATA_DOC), failedMetadata, { merge: true }).catch(() => {});

      return {
        success: false,
        syncedCount: 0,
        metadata: failedMetadata,
        message: error.message || 'Terjadi kesalahan saat sinkronisasi lowongan.',
      };
    }
  },
};
