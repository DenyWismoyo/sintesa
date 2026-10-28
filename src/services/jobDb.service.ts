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
import { getAppId } from '@/lib/appId';

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

let memoryCache: { jobs: JobListing[]; metadata?: JobSyncMetadata } | null = null;

function readLocalSnapshot(): { jobs: JobListing[]; metadata?: JobSyncMetadata } | null {
  if (memoryCache && Array.isArray(memoryCache.jobs) && memoryCache.jobs.length > 0) {
    return memoryCache;
  }
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(process.cwd(), 'src', 'data', 'jobs', 'syncedJobs.json');
      if (fs.existsSync(localPath)) {
        const parsed = JSON.parse(fs.readFileSync(localPath, 'utf8'));
        if (parsed && Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
          memoryCache = parsed;
          return memoryCache;
        }
      }
    } catch {
      // Fallback diam
    }
  }
  if (SYNCED_SNAPSHOT && Array.isArray((SYNCED_SNAPSHOT as any).jobs)) {
    memoryCache = SYNCED_SNAPSHOT as any;
    return memoryCache;
  }
  return null;
}

async function writeLocalSnapshot(jobs: JobListing[], metadata: JobSyncMetadata) {
  memoryCache = { jobs, metadata };
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
   * Mengambil lowongan langsung dari database:
   * Prioritas 1: Master Cache dokumen artifacts/{appId}/public/data/cache_jobs doc 'master' (1 Read tunggal)
   * Prioritas 2: Local persistent snapshot syncedJobs.json
   * Prioritas 3: Query root collection 'jobs'
   */
  async getJobsFromFirestore(): Promise<JobListing[]> {
    const appId = getAppId();

    // 1. Coba baca dari Firestore Master Cache (Mendukung Single Document & Chunked Documents)
    try {
      const cacheRef = doc(db, `artifacts/${appId}/public/data/cache_jobs`, 'master');
      const cachePromise = getDoc(cacheRef);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Cache timeout')), 1800)
      );
      const cacheSnap = await Promise.race([cachePromise, timeoutPromise]);
      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        if (cacheData) {
          // Jika menggunakan chunked cache (karena >80 loker melebihi batas 1MB)
          if (cacheData.isChunked && Array.isArray(cacheData.chunkIds) && cacheData.chunkIds.length > 0) {
            const chunkPromises = cacheData.chunkIds.map((cid: string) =>
              getDoc(doc(db, `artifacts/${appId}/public/data/cache_jobs`, cid))
            );
            const chunkSnaps = await Promise.all(chunkPromises);
            const combined: JobListing[] = [];
            chunkSnaps.forEach((cs) => {
              if (cs.exists()) {
                const cd = cs.data();
                if (cd && Array.isArray(cd.data)) {
                  combined.push(...cd.data);
                }
              }
            });
            if (combined.length > 0) {
              return combined;
            }
          } else if (Array.isArray(cacheData.data) && cacheData.data.length > 0) {
            return cacheData.data as JobListing[];
          }
        }
      }
    } catch {
      // Lanjut ke fallback
    }

    // 2. Cek local persistent snapshot
    const local = readLocalSnapshot();
    if (local?.jobs && local.jobs.length > 0) {
      return local.jobs;
    }

    // 3. Fallback: Query langsung dari Firestore collection 'jobs'
    try {
      const fetchPromise = getDocs(
        query(collection(db, JOBS_COLLECTION), orderBy('postedAt', 'desc'), limit(1000))
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
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
    } catch {
      // Fallback
    }

    return [];
  },

  /**
   * Rebuild Master Cache di artifacts/{appId}/public/data/cache_jobs/master
   * Memecah data ke beberapa chunk jika melebihi batas 1MB dokumen Firestore
   */
  async rebuildMasterCache(appId: string = getAppId(), jobsToCache?: JobListing[]): Promise<boolean> {
    try {
      const jobs = jobsToCache || (await this.getJobsFromFirestore());
      if (!jobs.length) return false;

      const cacheColRef = collection(db, `artifacts/${appId}/public/data/cache_jobs`);
      const masterDocRef = doc(cacheColRef, 'master');

      const CHUNK_SIZE = 80;
      if (jobs.length <= CHUNK_SIZE) {
        await setDoc(masterDocRef, {
          lastUpdated: Date.now(),
          count: jobs.length,
          isChunked: false,
          data: jobs,
        }, { merge: true });
        console.log(`[jobDbService] Master Cache berhasil diperbarui di artifacts/${appId} (${jobs.length} loker)`);
        return true;
      }

      // Chunked Cache untuk menghindari batas 1MB Firestore per dokumen
      const totalChunks = Math.ceil(jobs.length / CHUNK_SIZE);
      const chunkIds: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkId = `chunk_${i}`;
        chunkIds.push(chunkId);
        const chunkData = jobs.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkRef = doc(cacheColRef, chunkId);
        await setDoc(chunkRef, {
          index: i,
          count: chunkData.length,
          data: chunkData,
          lastUpdated: Date.now(),
        }, { merge: true });
      }

      await setDoc(masterDocRef, {
        lastUpdated: Date.now(),
        count: jobs.length,
        isChunked: true,
        totalChunks,
        chunkIds,
      }, { merge: true });

      console.log(`[jobDbService] Master Cache Chunked berhasil diperbarui di artifacts/${appId} (${jobs.length} loker dalam ${totalChunks} chunks)`);
      return true;
    } catch (err) {
      console.warn('[jobDbService] Gagal memperbarui Master Cache:', err);
      return false;
    }
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

      // 3. PENGGABUNGAN KUMULATIF MINGGUAN: Seluruh lowongan yang pernah tercatat sebelumnya TIDAK AKAN HILANG
      const existingJobs = await this.getJobsFromFirestore();
      const combinedMap = new Map<string, JobListing>();
      const seenTitleCompany = new Set<string>();

      // Masukkan SEMUA lowongan terdahulu ke Map bank data kumulatif
      existingJobs.forEach((j) => {
        const tcKey = `${j.title.toLowerCase().trim()}|${j.company.toLowerCase().trim()}`;
        if (!seenTitleCompany.has(tcKey)) {
          seenTitleCompany.add(tcKey);
          combinedMap.set(j.id, {
            ...j,
            firstSeenAt: j.firstSeenAt || j.postedAt || now,
            lastSeenAt: j.lastSeenAt || j.postedAt || now,
            isActive: j.isActive !== false,
          });
        }
      });

      // Tambahkan dan mutakhirkan lowongan baru dari sinkronisasi minggu ini
      realtimeJobs.forEach((newJob) => {
        const tcKey = `${newJob.title.toLowerCase().trim()}|${newJob.company.toLowerCase().trim()}`;
        const prev = combinedMap.get(newJob.id);
        if (prev) {
          combinedMap.set(newJob.id, {
            ...newJob,
            firstSeenAt: prev.firstSeenAt || newJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          });
        } else if (!seenTitleCompany.has(tcKey)) {
          seenTitleCompany.add(tcKey);
          combinedMap.set(newJob.id, {
            ...newJob,
            firstSeenAt: newJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          });
        }
      });

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
        message: `Berhasil mengakumulasi ${allJobsToSave.length} lowongan (bank data kumulatif terus bertambah). Update berikutnya dalam 7 hari.`,
        provider: providerName,
      };

      // 5. Simpan snapshot lokal & simpan ke Firestore & Master Cache
      writeLocalSnapshot(allJobsToSave, updatedMetadata);
      await this.saveJobsToFirestore(allJobsToSave).catch(() => {});
      await this.rebuildMasterCache(getAppId(), allJobsToSave).catch(() => {});

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

      console.log(`[jobDbService] Sinkronisasi kumulatif sukses! ${allJobsToSave.length} lowongan tersimpan di bank data.`);

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

  /**
   * Menambahkan lowongan baru secara manual (oleh Mitra STP / Admin)
   */
  async createJob(data: Partial<JobListing>): Promise<JobListing> {
    const now = Date.now();
    const id = data.id || `stp-manual-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newJob: JobListing = {
      id,
      title: data.title || 'Lowongan Baru',
      company: data.company || 'Mitra Solo Technopark',
      companyLogo: data.companyLogo,
      companyWebsite: data.companyWebsite,
      companyType: data.companyType || 'Mitra Industri STP',
      category: data.category || 'IT & Rekayasa Perangkat Lunak',
      location: data.location || 'Surakarta, Jawa Tengah',
      city: data.city || 'Surakarta',
      workType: data.workType || 'Full-time',
      workSetup: data.workSetup || 'On-site (Solo Technopark)',
      experienceLevel: data.experienceLevel || 'Fresh Graduate / Alumni Pelatihan',
      salary: data.salary || {
        currency: 'IDR',
        period: 'Bulan',
        isNegotiable: true,
        isDisclosed: true,
      },
      description: data.description || '',
      responsibilities: data.responsibilities || [],
      requirements: data.requirements || [],
      benefits: data.benefits || [],
      skills: data.skills || [],
      relevantTrainingPrograms: data.relevantTrainingPrograms || [],
      applicationUrl: data.applicationUrl,
      applicationEmail: data.applicationEmail,
      applySource: data.applySource || 'Official Web',
      source: 'stp_partner',
      isStpPartner: data.isStpPartner !== undefined ? data.isStpPartner : true,
      isFeatured: Boolean(data.isFeatured),
      postedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      viewsCount: 0,
      applicantCount: 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const existingJobs = await this.getJobsFromFirestore();
    const updatedJobs = [newJob, ...existingJobs.filter((j) => j.id !== id)];

    const meta = await this.getSyncMetadata();
    writeLocalSnapshot(updatedJobs, { ...meta, totalJobsInDb: updatedJobs.length });
    await this.saveJobsToFirestore([newJob]).catch(() => {});
    await this.rebuildMasterCache(getAppId(), updatedJobs).catch(() => {});

    return newJob;
  },

  /**
   * Memperbarui data lowongan
   */
  async updateJob(id: string, updates: Partial<JobListing>): Promise<boolean> {
    const existingJobs = await this.getJobsFromFirestore();
    const index = existingJobs.findIndex((j) => j.id === id);
    if (index === -1) return false;

    const updatedJob: JobListing = {
      ...existingJobs[index],
      ...updates,
      lastSeenAt: Date.now(),
    };

    existingJobs[index] = updatedJob;

    const meta = await this.getSyncMetadata();
    writeLocalSnapshot(existingJobs, meta);
    await this.saveJobsToFirestore([updatedJob]).catch(() => {});
    await this.rebuildMasterCache(getAppId(), existingJobs).catch(() => {});

    return true;
  },

  /**
   * Menghapus lowongan dari database
   */
  async deleteJob(id: string): Promise<boolean> {
    const existingJobs = await this.getJobsFromFirestore();
    const filtered = existingJobs.filter((j) => j.id !== id);
    if (filtered.length === existingJobs.length) return false;

    const meta = await this.getSyncMetadata();
    writeLocalSnapshot(filtered, { ...meta, totalJobsInDb: filtered.length });
    await this.rebuildMasterCache(getAppId(), filtered).catch(() => {});

    // Hapus dari Firestore jika online
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, JOBS_COLLECTION, id));
    } catch {
      // Abaikan jika offline
    }

    return true;
  },
};
