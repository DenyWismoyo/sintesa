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
import {
  aggregateMultiProviderJobs,
  aggregateMultiProviderJobsWithReport,
  balanceRegionalProportion,
  RegionalProportionStats,
} from '@/services/jobAggregator.service';
import { normalizeCompanyName, sanitizePii, stripTrackingParams, inferJobRegion } from '@/services/atsCrawler.service';
import SYNCED_SNAPSHOT from '@/data/jobs/syncedJobs.json';
import { getAppId } from '@/lib/appId';
import { computeAlumniJobMatch } from '@/utils/jobSmartMatch';
import { Alumni } from '@/types/ecosystem.types';

const JOBS_COLLECTION = 'jobs';
const SYNC_METADATA_DOC = 'app_settings/jobs_sync';
const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari (seminggu sekali)
const JOB_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari masa aktif assumed TTL

export interface JobSyncMetadata {
  lastSyncedAt: number | null;
  nextSyncAt: number | null;
  lastDailySyncAt?: number | null;
  syncIntervalDays: number;
  totalJobsInDb: number;
  realtimeJobsCount: number;
  stpJobsCount: number;
  status: 'IDLE' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message?: string;
  provider: string;
  regionalDistribution?: RegionalProportionStats;
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

/**
 * Mengirimkan notifikasi Smart Job Alert in-app kepada alumni Open-to-Work
 * ketika sinkronisasi harian/mingguan menemukan lowongan baru yang sangat selaras.
 */
async function dispatchSmartJobAlerts(newJobs: JobListing[]): Promise<void> {
  if (!newJobs.length || typeof window !== 'undefined') return;
  try {
    const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
    const adminDb = getAdminDefaultDb();
    const appId = getAppId();

    const alumniSnap = await adminDb
      .collection('alumnis')
      .where('status', '==', 'CLAIMED')
      .limit(200)
      .get();

    if (alumniSnap.empty) return;

    const notifCol = adminDb.collection(`artifacts/${appId}/public/data/ecosystem_notifications`);
    const batch = adminDb.batch();
    let alertCount = 0;

    alumniSnap.forEach((docSnap) => {
      const alumni = { id: docSnap.id, ...docSnap.data() } as Alumni;
      if (!alumni.claimedByUserId) return;
      if (alumni.jobAlertEnabled === false) return;
      if (alumni.isLookingForJob === false && alumni.internalStatus === 'HIRED') return;

      const matched = newJobs
        .map((job) => ({ job, match: computeAlumniJobMatch(job, alumni) }))
        .filter((x) => x.match.score >= 70)
        .sort((a, b) => b.match.score - a.match.score);

      if (matched.length > 0 && alertCount < 50) {
        const top = matched[0];
        const notifRef = notifCol.doc();
        batch.set(notifRef, {
          id: notifRef.id,
          recipientUid: alumni.claimedByUserId,
          title: `🎯 ${matched.length} Lowongan Baru Cocok (${top.match.score}% Match)`,
          message: `${top.job.title} di ${top.job.company}${matched.length > 1 ? ` dan ${matched.length - 1} posisi lain` : ''} selaras dengan profil kejuruan Anda.`,
          linkUrl: `/karir/${top.job.id}`,
          category: 'JOB_ALERT',
          readByUids: [],
          createdAt: Date.now(),
        });
        alertCount++;
      }
    });

    if (alertCount > 0) {
      await batch.commit();
      console.log(`[SmartJobAlert] Mengirimkan ${alertCount} notifikasi lowongan baru yang relevan ke alumni.`);
    }
  } catch (err) {
    console.warn('[SmartJobAlert] Melewati pengiriman job alert otomatis:', (err as any)?.message || err);
  }
}

export const jobDbService = {
  /**
   * Mengambil metadata status sinkronisasi:
   * Prioritas 1: Firestore app_settings/jobs_sync (Single Source of Truth)
   * Prioritas 2: Local snapshot syncedJobs.json (hanya fallback offline)
   */
  async getSyncMetadata(): Promise<JobSyncMetadata> {
    if (typeof window === 'undefined') {
      try {
        const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
        const adminDb = getAdminDefaultDb();
        const adminSnap = await adminDb.doc(SYNC_METADATA_DOC).get();
        if (adminSnap.exists) {
          return adminSnap.data() as JobSyncMetadata;
        }
      } catch {
        // Lanjut ke client SDK
      }
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Metadata timeout')), 1500)
      );
      const snap = await Promise.race([getDoc(doc(db, SYNC_METADATA_DOC)), timeoutPromise]);
      if (snap.exists()) {
        return snap.data() as JobSyncMetadata;
      }
    } catch {
      // Fallback ke local snapshot jika jaringan bermasalah
    }

    const local = readLocalSnapshot();
    if (local?.metadata) {
      return local.metadata;
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

    // 2. Fallback: Query langsung dari Firestore collection 'jobs'
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
      // Fallback ke snapshot lokal
    }

    // 3. Last-resort fallback: Local persistent snapshot (mode offline/darurat)
    const local = readLocalSnapshot();
    if (local?.jobs && local.jobs.length > 0) {
      return local.jobs;
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

      // Di lingkungan server Node.js, gunakan Firebase Admin SDK untuk akses penuh tanpa restriksi client
      if (typeof window === 'undefined') {
        try {
          const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
          const adminDb = getAdminDefaultDb();
          const CHUNK_SIZE = 80;
          const cacheCol = adminDb.collection(`artifacts/${appId}/public/data/cache_jobs`);
          const masterDoc = cacheCol.doc('master');

          if (jobs.length <= CHUNK_SIZE) {
            await masterDoc.set({
              lastUpdated: Date.now(),
              count: jobs.length,
              isChunked: false,
              data: jobs,
            }, { merge: true });
            console.log(`[jobDbService] Admin Master Cache berhasil diperbarui di artifacts/${appId} (${jobs.length} loker)`);
            return true;
          }

          const totalChunks = Math.ceil(jobs.length / CHUNK_SIZE);
          const chunkIds: string[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const chunkId = `chunk_${i}`;
            chunkIds.push(chunkId);
            const chunkData = jobs.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            await cacheCol.doc(chunkId).set({
              index: i,
              count: chunkData.length,
              data: chunkData,
              lastUpdated: Date.now(),
            }, { merge: true });
          }

          await masterDoc.set({
            lastUpdated: Date.now(),
            count: jobs.length,
            isChunked: true,
            totalChunks,
            chunkIds,
          }, { merge: true });

          console.log(`[jobDbService] Admin Master Cache Chunked berhasil diperbarui di artifacts/${appId} (${jobs.length} loker dalam ${totalChunks} chunks)`);
          return true;
        } catch {
          // Lanjut ke fallback client SDK
        }
      }

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

    // Di server Node.js, prioritaskan Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
        const adminDb = getAdminDefaultDb();
        const chunkSize = 400;
        let saved = 0;
        for (let i = 0; i < jobs.length; i += chunkSize) {
          const chunk = jobs.slice(i, i + chunkSize);
          const batch = adminDb.batch();
          chunk.forEach((job) => {
            const jobRef = adminDb.collection(JOBS_COLLECTION).doc(job.id);
            batch.set(jobRef, sanitizeForFirestore(job), { merge: true });
            saved++;
          });
          await batch.commit();
        }
        return saved || jobs.length;
      } catch {
        // Fallback ke client SDK
      }
    }

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
   * Sinkronisasi Harian Cepat (Daily Fast-Sync, 100% Zero-Cost Quota)
   * Menarik data tangan pertama dari endpoint ATS publik (Greenhouse, Lever, Ashby)
   * serta 4 Open API gratis tanpa kuota berbayar.
   */
  async syncDailyJobs(): Promise<{
    success: boolean;
    syncedCount: number;
    metadata: JobSyncMetadata;
    message: string;
  }> {
    const meta = await this.getSyncMetadata();
    const now = Date.now();

    console.log('[jobDbService] Memulai sinkronisasi harian (ATS Publik & Open API 100% Gratis)...');

    try {
      // 1. Tarik lowongan paralel dari ATS Publik & Open API beserta daftar board yang aktif merespons
      const { jobs: freshJobs, respondedAtsPrefixes } = await aggregateMultiProviderJobsWithReport({
        includeAts: true,
        includeRemotive: true,
        includeJobicy: true,
        includeHimalayas: true,
        includeArbeitnow: true,
      });

      const freshIds = new Set(freshJobs.map((fj) => fj.id));

      // 2. Ambil bank data saat ini
      const existingJobs = await this.getJobsFromFirestore();
      const combinedMap = new Map<string, JobListing>();
      const seenCompositeKeys = new Set<string>();
      const newlyDiscoveredJobs: JobListing[] = [];

      // 3. Masukkan lowongan eksisting ke Map & terapkan Active ATS Sweeper + TTL 30 hari
      existingJobs.forEach((j) => {
        const normKey = `${normalizeCompanyName(j.company)}|${j.title.toLowerCase().trim()}|${(j.city || '').toLowerCase().trim()}`;
        if (!seenCompositeKeys.has(normKey)) {
          seenCompositeKeys.add(normKey);

          const isStp = Boolean(j.isStpPartner);
          const lastSeen = j.lastSeenAt || j.postedAt || now;
          const isExpiredByTtl = !isStp && now - lastSeen > JOB_TTL_MS;

          // Active ATS Sweeper: Jika board ATS perusahaan merespons hari ini tetapi ID lowongan ini sudah hilang/ditutup
          const isClosedOnLiveAts =
            !isStp &&
            j.source === 'ats_public' &&
            respondedAtsPrefixes.some((pref) => j.id.startsWith(pref)) &&
            !freshIds.has(j.id);

          combinedMap.set(j.id, {
            ...j,
            firstSeenAt: j.firstSeenAt || j.postedAt || now,
            lastSeenAt: lastSeen,
            isActive: isExpiredByTtl || isClosedOnLiveAts ? false : j.isActive !== false,
          });
        }
      });

      // 4. Tambahkan atau mutakhirkan lowongan baru dari penarikan harian
      freshJobs.forEach((newJob) => {
        const cleanJob: JobListing = {
          ...newJob,
          applicationUrl: stripTrackingParams(newJob.applicationUrl || ''),
          description: sanitizePii(newJob.description || ''),
        };

        const normKey = `${normalizeCompanyName(cleanJob.company)}|${cleanJob.title.toLowerCase().trim()}|${(cleanJob.city || '').toLowerCase().trim()}`;
        const prev = combinedMap.get(cleanJob.id);

        if (prev) {
          combinedMap.set(cleanJob.id, {
            ...cleanJob,
            viewsCount: prev.viewsCount || 0,
            applicantCount: prev.applicantCount || 0,
            firstSeenAt: prev.firstSeenAt || cleanJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          });
        } else if (!seenCompositeKeys.has(normKey)) {
          seenCompositeKeys.add(normKey);
          const created: JobListing = {
            ...cleanJob,
            firstSeenAt: cleanJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          };
          combinedMap.set(cleanJob.id, created);
          newlyDiscoveredJobs.push(created);
        }
      });

      const allJobsToSave: JobListing[] = Array.from(combinedMap.values());
      // Terapkan penyeimbangan porsi regional: Minimal 60% Indonesia & Maksimal 40% Luar Negeri
      const { balancedJobs, stats } = balanceRegionalProportion(allJobsToSave, 0.60);
      const stpCount = balancedJobs.filter((j) => j.isStpPartner).length;

      const updatedMetadata: JobSyncMetadata = {
        ...meta,
        lastDailySyncAt: now,
        totalJobsInDb: balancedJobs.length,
        realtimeJobsCount: balancedJobs.length - stpCount,
        stpJobsCount: stpCount,
        status: 'SUCCESS',
        message: `Sinkronisasi harian sukses. Terhimpun ${balancedJobs.length} loker (Porsi: ${stats.indonesiaPercent}% Indonesia, ${stats.overseasPercent}% Luar Negeri & Regional [ASEAN: ${stats.aseanCount}, Asia Timur: ${stats.eastAsiaCount}, Remote: ${stats.globalRemoteCount}]).`,
        provider: 'ATS Publik & Open API Multi-Provider (Zero Cost)',
        regionalDistribution: stats,
      };

      writeLocalSnapshot(balancedJobs, updatedMetadata);
      await this.saveJobsToFirestore(balancedJobs).catch(() => {});
      await this.rebuildMasterCache(getAppId(), balancedJobs).catch(() => {});
      if (newlyDiscoveredJobs.length > 0) {
        dispatchSmartJobAlerts(newlyDiscoveredJobs).catch(() => {});
      }

      try {
        if (typeof window === 'undefined') {
          const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
          await getAdminDefaultDb().doc(SYNC_METADATA_DOC).set(updatedMetadata, { merge: true });
        } else {
          await setDoc(doc(db, SYNC_METADATA_DOC), updatedMetadata, { merge: true });
        }
      } catch {
        // Fallback
      }

      return {
        success: true,
        syncedCount: balancedJobs.length,
        metadata: updatedMetadata,
        message: updatedMetadata.message || 'Sinkronisasi harian berhasil.',
      };
    } catch (err: any) {
      console.error('[jobDbService] Gagal sinkronisasi harian:', err);
      return {
        success: false,
        syncedCount: 0,
        metadata: meta,
        message: 'Gagal sinkronisasi harian: ' + err.message,
      };
    }
  },

  /**
   * Sinkronisasi berkala seminggu sekali (Weekly Deep-Sync & Data Hygiene)
   * Menghimpun ATS publik, Open API, dan penelusuran lokal hemat kuota
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

    console.log('[jobDbService] Memulai deep sync mingguan (ATS + Open API + Lokal)...');

    try {
      const realtimeJobs: JobListing[] = [];
      let respondedAtsPrefixes: string[] = [];

      // 1. Eksekusi ATS Publik & Open API (Tulang punggung Zero-Cost)
      try {
        const report = await aggregateMultiProviderJobsWithReport({
          includeAts: true,
          includeRemotive: true,
          includeJobicy: true,
          includeHimalayas: true,
          includeArbeitnow: true,
        });
        realtimeJobs.push(...report.jobs);
        respondedAtsPrefixes = report.respondedAtsPrefixes;
      } catch (aggErr) {
        console.warn('[jobDbService] Gagal agregasi open API:', aggErr);
      }

      // 2. Jika RapidAPI tersedia, jalankan Micro-Batch hemat kuota untuk area prioritas Solo & Indonesia
      const hasApiKey = Boolean(process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY);
      if (hasApiKey) {
        const priorityClusters = [
          { query: 'lowongan kerja di Solo' },
          { query: 'teknisi di Indonesia' },
          { query: 'lowongan IT di Jakarta' },
        ];

        const fetchPromises = priorityClusters.map((target) =>
          fetchJSearchJobs({ query: target.query }).catch(() => ({ jobs: [], total: 0, isRealtime: false }))
        );

        const results = await Promise.allSettled(fetchPromises);
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.jobs?.length) {
            realtimeJobs.push(...res.value.jobs);
          }
        });
      }

      const freshIds = new Set(realtimeJobs.map((rj) => rj.id));
      const newlyDiscoveredJobs: JobListing[] = [];

      // 3. PENGGABUNGAN KUMULATIF MINGGUAN DENGAN RESOLUSI ENTITAS, ACTIVE ATS SWEEPER & TTL
      const existingJobs = await this.getJobsFromFirestore();
      const combinedMap = new Map<string, JobListing>();
      const seenCompositeKeys = new Set<string>();

      existingJobs.forEach((j) => {
        const normKey = `${normalizeCompanyName(j.company)}|${j.title.toLowerCase().trim()}|${(j.city || '').toLowerCase().trim()}`;
        if (!seenCompositeKeys.has(normKey)) {
          seenCompositeKeys.add(normKey);

          const isStp = Boolean(j.isStpPartner);
          const lastSeen = j.lastSeenAt || j.postedAt || now;
          const isExpiredByTtl = !isStp && now - lastSeen > JOB_TTL_MS;
          const isClosedOnLiveAts =
            !isStp &&
            j.source === 'ats_public' &&
            respondedAtsPrefixes.some((pref) => j.id.startsWith(pref)) &&
            !freshIds.has(j.id);

          combinedMap.set(j.id, {
            ...j,
            firstSeenAt: j.firstSeenAt || j.postedAt || now,
            lastSeenAt: lastSeen,
            isActive: isExpiredByTtl || isClosedOnLiveAts ? false : j.isActive !== false,
          });
        }
      });

      // Tambahkan dan mutakhirkan lowongan baru dari sinkronisasi minggu ini
      realtimeJobs.forEach((newJob) => {
        const cleanJob: JobListing = {
          ...newJob,
          applicationUrl: stripTrackingParams(newJob.applicationUrl || ''),
          description: sanitizePii(newJob.description || ''),
        };

        const normKey = `${normalizeCompanyName(cleanJob.company)}|${cleanJob.title.toLowerCase().trim()}|${(cleanJob.city || '').toLowerCase().trim()}`;
        const prev = combinedMap.get(cleanJob.id);

        if (prev) {
          combinedMap.set(cleanJob.id, {
            ...cleanJob,
            viewsCount: prev.viewsCount || 0,
            applicantCount: prev.applicantCount || 0,
            firstSeenAt: prev.firstSeenAt || cleanJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          });
        } else if (!seenCompositeKeys.has(normKey)) {
          seenCompositeKeys.add(normKey);
          const created: JobListing = {
            ...cleanJob,
            firstSeenAt: cleanJob.postedAt || now,
            lastSeenAt: now,
            isActive: true,
          };
          combinedMap.set(cleanJob.id, created);
          newlyDiscoveredJobs.push(created);
        }
      });

      const allJobsToSave: JobListing[] = Array.from(combinedMap.values());
      // Terapkan penyeimbangan porsi regional: Minimal 60% Indonesia & Maksimal 40% Luar Negeri (ASEAN, Jepang, Korea, Global)
      const { balancedJobs, stats } = balanceRegionalProportion(allJobsToSave, 0.60);

      // 4. Perbarui metadata jadwal seminggu sekali
      const nextSyncAt = now + SYNC_INTERVAL_MS;
      const stpCount = balancedJobs.filter((j) => j.isStpPartner).length;

      const providerName = hasApiKey
        ? 'ATS Publik, Multi-Provider Open API & JSearch Micro-Batch'
        : 'ATS Publik & Open API Multi-Provider (100% Zero Cost)';

      const updatedMetadata: JobSyncMetadata = {
        lastSyncedAt: now,
        nextSyncAt,
        lastDailySyncAt: now,
        syncIntervalDays: 7,
        totalJobsInDb: balancedJobs.length,
        realtimeJobsCount: balancedJobs.length - stpCount,
        stpJobsCount: stpCount,
        status: 'SUCCESS',
        message: `Berhasil mengakumulasi ${balancedJobs.length} lowongan aktif & terverifikasi (Porsi: ${stats.indonesiaPercent}% Indonesia, ${stats.overseasPercent}% Luar Negeri & Regional [ASEAN: ${stats.aseanCount}, Asia Timur: ${stats.eastAsiaCount}, Remote: ${stats.globalRemoteCount}]). Sinkronisasi mingguan berikutnya dalam 7 hari.`,
        provider: providerName,
        regionalDistribution: stats,
      };

      // 5. Simpan snapshot lokal & simpan ke Firestore & Master Cache
      writeLocalSnapshot(balancedJobs, updatedMetadata);
      await this.saveJobsToFirestore(balancedJobs).catch(() => {});
      await this.rebuildMasterCache(getAppId(), balancedJobs).catch(() => {});
      if (newlyDiscoveredJobs.length > 0) {
        dispatchSmartJobAlerts(newlyDiscoveredJobs).catch(() => {});
      }

      // Simpan metadata ke Firestore jika online
      try {
        if (typeof window === 'undefined') {
          const { getAdminDefaultDb } = await import('@/lib/firebaseAdmin');
          await getAdminDefaultDb().doc(SYNC_METADATA_DOC).set(updatedMetadata, { merge: true });
        } else {
          const metaPromise = setDoc(doc(db, SYNC_METADATA_DOC), updatedMetadata, { merge: true });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Meta timeout')), 2000)
          );
          await Promise.race([metaPromise, timeoutPromise]);
        }
      } catch (metaErr) {
        // Fallback snapshot tetap aman
      }

      console.log(`[jobDbService] Sinkronisasi kumulatif sukses! ${balancedJobs.length} lowongan tersimpan di bank data (${stats.indonesiaPercent}% ID / ${stats.overseasPercent}% LN).`);

      return {
        success: true,
        syncedCount: balancedJobs.length,
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
      partnerId: data.partnerId,
      tenantId: data.tenantId,
      submittedByUid: data.submittedByUid,
      approvalStatus: data.approvalStatus || 'APPROVED',
      rejectionReason: data.rejectionReason,
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
