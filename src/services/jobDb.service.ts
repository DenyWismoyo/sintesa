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
import { JobListing, JobListingSchema } from '@/types/job.types';
import { fetchJSearchJobs } from '@/services/jsearch.service';
import { aggregateMultiProviderJobs } from '@/services/jobAggregator.service';
import SYNCED_SNAPSHOT from '@/data/jobs/syncedJobs.json';

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

function readLocalSnapshot(): { jobs: JobListing[]; metadata?: JobSyncMetadata } | null {
  if (SYNCED_SNAPSHOT && Array.isArray((SYNCED_SNAPSHOT as any).jobs)) {
    return SYNCED_SNAPSHOT as any;
  }
  return null;
}

async function writeLocalSnapshot(jobs: JobListing[], metadata: JobSyncMetadata) {
  if (typeof window === 'undefined') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), 'src', 'data', 'jobs', 'syncedJobs.json');
      fs.writeFileSync(localPath, JSON.stringify({ jobs, metadata }, null, 2), 'utf-8');
    } catch (err) {
      // Abaikan jika read-only
    }
  }
}

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
}

export const jobDbService = {
  /**
   * Mengambil metadata status sinkronisasi mingguan
   */
  async getSyncMetadata(): Promise<JobSyncMetadata> {
    // Coba baca dari local snapshot terlebih dahulu
    const local = readLocalSnapshot();
    if (local?.metadata) {
      return local.metadata;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Metadata timeout')), 1200)
      );
      const snap = await Promise.race([getDoc(doc(db, SYNC_METADATA_DOC)), timeoutPromise]);
      if (snap.exists()) {
        return snap.data() as JobSyncMetadata;
      }
    } catch (err) {
      // Fallback diam
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
   * Mengambil lowongan langsung dari database / persistent snapshot
   */
  async getJobsFromFirestore(): Promise<JobListing[]> {
    // 1. Cek local persistent snapshot
    const local = readLocalSnapshot();
    if (local?.jobs && local.jobs.length > 0) {
      return local.jobs;
    }

    // 2. Coba baca dari Firestore dengan timeout pengaman (mencegah hang gRPC di server)
    try {
      const fetchPromise = getDocs(
        query(collection(db, JOBS_COLLECTION), orderBy('postedAt', 'desc'), limit(150))
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore read timeout')), 1500)
      );

      const snap = await Promise.race([fetchPromise, timeoutPromise]);
      const jobs: JobListing[] = [];
      snap.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        const parsed = JobListingSchema.safeParse(data);
        if (parsed.success) {
          jobs.push(parsed.data);
        }
      });

      if (jobs.length > 0) {
        return jobs;
      }
    } catch (err) {
      // Fallback
    }

    return [];
  },

  /**
   * Mengambil detail satu lowongan pekerjaan berdasarkan ID atau Slug
   */
  async getJobById(idOrSlug: string): Promise<JobListing | null> {
    const allJobs = await this.getJobsFromFirestore();
    const found = allJobs.find((j) => j.id === idOrSlug || j.slug === idOrSlug);
    if (found) return found;

    // Di server Node.js Next.js, gunakan REST API agar terbebas dari issue gRPC stream
    if (typeof window === 'undefined') {
      try {
        const { getServerDocRest } = await import('@/lib/serverFirestore');
        const restDoc = await getServerDocRest<JobListing>(JOBS_COLLECTION, idOrSlug, 60);
        if (restDoc) {
          const parsed = JobListingSchema.safeParse(restDoc);
          if (parsed.success) return parsed.data;
        }
      } catch {
        // Fallback diam
      }
      return null;
    }

    try {
      const snap = await getDoc(doc(db, JOBS_COLLECTION, idOrSlug));
      if (snap.exists()) {
        const parsed = JobListingSchema.safeParse({ id: snap.id, ...snap.data() });
        if (parsed.success) return parsed.data;
      }
    } catch {
      // Abaikan jika offline
    }

    return null;
  },

  /**
   * Menyimpan / memperbarui daftar lowongan ke Firestore dalam batch
   */
  async saveJobsToFirestore(jobs: JobListing[]): Promise<number> {
    if (!jobs.length) return 0;

    let savedCount = 0;
    try {
      const chunkSize = 400;
      for (let i = 0; i < jobs.length; i += chunkSize) {
        const chunk = jobs.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((job) => {
          const jobRef = doc(db, JOBS_COLLECTION, job.id);
          batch.set(jobRef, sanitizeForFirestore(job), { merge: true });
          savedCount++;
        });

        // Berikan timeout pengaman 3 detik untuk commit Firestore
        const commitPromise = batch.commit();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Commit timeout')), 3000)
        );
        await Promise.race([commitPromise, timeoutPromise]);
      }
    } catch (err) {
      console.warn('[jobDbService] Firestore write batch dilewati (offline mode):', (err as any)?.message || err);
    }

    return savedCount || jobs.length;
  },

  /**
   * Sinkronisasi berkala seminggu sekali dari RapidAPI ke Database
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
        syncedCount: meta.totalJobsInDb,
        metadata: {
          ...meta,
          status: 'SKIPPED',
          message: `Data masih mutakhir. Sinkronisasi otomatis berikutnya dalam ${remainingDays} hari.`,
        },
        message: `Sinkronisasi dilewati: Data masih berlaku untuk ${remainingDays} hari ke depan.`,
      };
    }

    console.log('[jobDbService] Memulai sinkronisasi lowongan dari RapidAPI JSearch...');

    try {
      // 1. Tarik lowongan realtime murni dari RapidAPI JSearch internet
      const hasApiKey = Boolean(process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY);
      let realtimeJobs: JobListing[] = [];

      if (hasApiKey) {
        // Klaster target lowongan berfokus pada Indonesia, ASEAN, dan Asia (Jepang & Korea)
        const targetClusters: Array<{ query: string; country?: string }> = [
          // ── Indonesia (Prioritas Utama Kawasan & Alumni Solo Technopark) ──
          { query: 'lowongan IT di Jakarta' },
          { query: 'lowongan programmer Jakarta' },
          { query: 'lowongan web developer di Indonesia' },
          { query: 'lowongan kerja di Solo' },
          { query: 'teknisi di Indonesia' },
          { query: 'teknik', country: 'id' },
          // ── ASEAN (Singapura, Malaysia, Filipina, Thailand, Vietnam) ──
          { query: 'software engineer in Singapore' },
          { query: 'developer in Kuala Lumpur' },
          { query: 'software engineer', country: 'my' },
          { query: 'web developer', country: 'ph' },
          { query: 'software engineer', country: 'th' },
          { query: 'software developer', country: 'vn' },
          // ── Asia Timur (Jepang) ──
          { query: 'IT', country: 'jp' },
          { query: 'engineer', country: 'jp' },
          { query: 'software', country: 'jp' },
          { query: 'developer', country: 'jp' },
        ];

        const fetchPromises = targetClusters.map((target) =>
          fetchJSearchJobs({ query: target.query, country: target.country }).catch((err) => {
            console.warn(`[jobDbService] Gagal fetch target '${target.query}':`, err);
            return { jobs: [], total: 0, isRealtime: false };
          })
        );

        const results = await Promise.allSettled(fetchPromises);
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.jobs?.length) {
            realtimeJobs.push(...res.value.jobs);
          }
        });

        // Deduplikasi berdasarkan ID
        const seenIds = new Set<string>();
        realtimeJobs = realtimeJobs.filter((job) => {
          if (seenIds.has(job.id)) return false;
          seenIds.add(job.id);
          return true;
        });
      }

      // 2. Jika RapidAPI mengembalikan 0 (atau kuota habis/tidak ada key), gunakan Multi-Provider Aggregator
      if (realtimeJobs.length === 0) {
        console.log('[jobDbService] Memanggil Multi-Provider Aggregator (Remotive, Arbeitnow, Jobicy, Himalayas)...');
        try {
          const openApiJobs = await aggregateMultiProviderJobs();
          realtimeJobs.push(...openApiJobs);
        } catch (aggErr) {
          console.warn('[jobDbService] Gagal agregasi open API:', aggErr);
        }
      }

      // 3. Pertahankan lowongan industri & mitra vokasi STP dari database lokal/Firestore
      const existingJobs = await this.getJobsFromFirestore();
      const existingIndustrialJobs = existingJobs.filter(
        (j) => j.isStpPartner || j.id.startsWith('ind-') || j.source === 'stp_partner'
      );

      // Gabungkan & deduplikasi
      const combinedMap = new Map<string, JobListing>();
      existingIndustrialJobs.forEach((j) => combinedMap.set(j.id, j));
      realtimeJobs.forEach((j) => combinedMap.set(j.id, j));

      const allJobsToSave: JobListing[] = Array.from(combinedMap.values());

      // 4. Perbarui metadata jadwal seminggu sekali
      const nextSyncAt = now + SYNC_INTERVAL_MS;
      const stpCount = allJobsToSave.filter((j) => j.isStpPartner).length;
      const isMultiProvider = allJobsToSave.some(
        (j) =>
          j.id.startsWith('remotive-') ||
          j.id.startsWith('arbeitnow-') ||
          j.id.startsWith('jobicy-') ||
          j.id.startsWith('himalayas-')
      );

      const providerName = isMultiProvider
        ? hasApiKey
          ? 'JSearch RapidAPI & Multi-Provider Aggregator'
          : 'Multi-Provider Aggregator (Remotive, Arbeitnow, Jobicy, Himalayas)'
        : hasApiKey
        ? 'JSearch RapidAPI v2'
        : 'Internet Realtime';

      const updatedMetadata: JobSyncMetadata = {
        lastSyncedAt: now,
        nextSyncAt,
        syncIntervalDays: 7,
        totalJobsInDb: allJobsToSave.length,
        realtimeJobsCount: allJobsToSave.length - stpCount,
        stpJobsCount: stpCount,
        status: 'SUCCESS',
        message: `Berhasil menyinkronkan ${allJobsToSave.length} lowongan (mencakup lowongan industri STP & agregasi open API). Update berikutnya dalam 7 hari.`,
        provider: providerName,
      };

      // 5. Simpan snapshot lokal & simpan ke Firestore
      writeLocalSnapshot(allJobsToSave, updatedMetadata);
      await this.saveJobsToFirestore(allJobsToSave).catch(() => {});

      // Simpan metadata ke Firestore jika online
      try {
        const metaPromise = setDoc(doc(db, SYNC_METADATA_DOC), updatedMetadata, { merge: true });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Meta timeout')), 2000)
        );
        await Promise.race([metaPromise, timeoutPromise]);
      } catch (metaErr) {
        // Fallback snapshot tetap aman
      }

      console.log(`[jobDbService] Sinkronisasi sukses! ${allJobsToSave.length} lowongan tersimpan.`);

      return {
        success: true,
        syncedCount: allJobsToSave.length,
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

      return {
        success: false,
        syncedCount: 0,
        metadata: failedMetadata,
        message: error.message || 'Terjadi kesalahan saat sinkronisasi lowongan.',
      };
    }
  },
};
