import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Daftar target ATS terkemuka untuk pemindaian zero-cost
const ATS_TARGETS = [
  { platform: "greenhouse", company: "Traveloka", token: "traveloka", city: "Jakarta" },
  { platform: "greenhouse", company: "GoTo Group", token: "goto", city: "Jakarta" },
  { platform: "greenhouse", company: "Tokopedia", token: "tokopedia", city: "Jakarta" },
  { platform: "greenhouse", company: "Ruangguru", token: "ruangguru", city: "Jakarta" },
  { platform: "greenhouse", company: "Kredivo", token: "finaccel", city: "Jakarta" },
  { platform: "greenhouse", company: "Xendit", token: "xendit", city: "Jakarta" },
  { platform: "lever", company: "eFishery", token: "efishery", city: "Bandung" },
  { platform: "lever", company: "Ajaib", token: "ajaib", city: "Jakarta" },
  { platform: "lever", company: "Pluang", token: "pluang", city: "Jakarta" },
  { platform: "lever", company: "Flip Indonesia", token: "flip", city: "Jakarta" },
];

function cleanPii(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[kontak resmi via web]")
    .replace(/(\+?62|0)8[1-9][0-9]{7,11}/g, "[nomor terlindungi]")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripTracking(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    ["utm_source", "utm_medium", "utm_campaign", "gh_jid", "ref", "fbclid"].forEach((k) =>
      u.searchParams.delete(k)
    );
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Helper pengumpul data dari ATS & Open API (100% Bebas Biaya)
 */
async function harvestZeroCostJobs(now: number): Promise<any[]> {
  const jobs: any[] = [];

  // 1. Fetch ATS Targets (Greenhouse & Lever)
  for (const t of ATS_TARGETS) {
    try {
      const url =
        t.platform === "greenhouse"
          ? `https://boards-api.greenhouse.io/v1/boards/${t.token}/jobs?content=true`
          : `https://api.lever.co/v0/postings/${t.token}?mode=json`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;

      const json = await res.json();
      if (t.platform === "greenhouse" && Array.isArray(json?.jobs)) {
        json.jobs.slice(0, 15).forEach((j: any) => {
          const rawDesc = cleanPii(j.content || "");
          const isRemote = /remote|wfh/i.test(`${j.title} ${j.location?.name || ""}`);
          const city = isRemote ? "Remote / WFH" : (j.location?.name || t.city);
          jobs.push({
            id: `gh-${t.token}-${j.id}`,
            slug: `job-gh-${t.token}-${j.id}`,
            title: j.title,
            company: t.company,
            companyType: "Perusahaan Teknologi",
            location: isRemote ? "Remote / Indonesia" : `${city}, Indonesia`,
            city,
            category: "IT & Rekayasa Perangkat Lunak",
            workType: /intern|magang/i.test(j.title) ? "Internship / Magang" : "Full-time",
            workSetup: isRemote ? "Remote / WFH" : "On-site",
            experienceLevel: /senior|lead/i.test(j.title) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            description: rawDesc.slice(0, 800) || `Peluang karir ${j.title} di ${t.company}.`,
            applicationUrl: stripTracking(j.absolute_url || ""),
            applySource: `Greenhouse (${t.company})`,
            source: "ats_public",
            isStpPartner: false,
            postedAt: j.updated_at ? new Date(j.updated_at).getTime() : now,
            firstSeenAt: now,
            lastSeenAt: now,
            deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            updatedAt: now,
          });
        });
      } else if (t.platform === "lever" && Array.isArray(json)) {
        json.slice(0, 15).forEach((j: any) => {
          const rawDesc = cleanPii(j.descriptionPlain || j.description || "");
          const isRemote = j.categories?.workplaceType === "remote" || /remote|wfh/i.test(`${j.text}`);
          const city = isRemote ? "Remote / WFH" : (j.categories?.location || t.city);
          jobs.push({
            id: `lev-${t.token}-${j.id}`,
            slug: `job-lev-${t.token}-${j.id}`,
            title: j.text,
            company: t.company,
            companyType: "Perusahaan Teknologi",
            location: isRemote ? "Remote / Indonesia" : `${city}, Indonesia`,
            city,
            category: "IT & Rekayasa Perangkat Lunak",
            workType: /intern|magang/i.test(j.text) ? "Internship / Magang" : "Full-time",
            workSetup: isRemote ? "Remote / WFH" : "On-site",
            experienceLevel: /senior|lead/i.test(j.text) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            description: rawDesc.slice(0, 800) || `Peluang karir ${j.text} di ${t.company}.`,
            applicationUrl: stripTracking(j.applyUrl || j.hostedUrl || ""),
            applySource: `Lever (${t.company})`,
            source: "ats_public",
            isStpPartner: false,
            postedAt: j.createdAt ? Number(j.createdAt) : now,
            firstSeenAt: now,
            lastSeenAt: now,
            deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            updatedAt: now,
          });
        });
      }
    } catch {
      // Safe fallback
    }
  }

  // 2. Fetch Open API Remotive (Posisi Remote Tech)
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=25", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.jobs)) {
        json.jobs.forEach((item: any) => {
          jobs.push({
            id: `remotive-${item.id}`,
            slug: `job-remotive-${item.id}`,
            title: item.title,
            company: item.company_name || "Global Partner",
            companyType: "Perusahaan Teknologi",
            location: item.candidate_required_location || "Global / Remote",
            city: "Remote / Global",
            category: "IT & Rekayasa Perangkat Lunak",
            workType: "Full-time",
            workSetup: "Remote / WFH",
            experienceLevel: /senior/i.test(item.title) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            description: cleanPii(item.description || "").slice(0, 800),
            applicationUrl: stripTracking(item.url || ""),
            applySource: "Remotive Hub",
            source: "open_api",
            isStpPartner: false,
            postedAt: item.publication_date ? new Date(item.publication_date).getTime() : now,
            firstSeenAt: now,
            lastSeenAt: now,
            deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            updatedAt: now,
          });
        });
      }
    }
  } catch {
    // Safe fallback
  }

  return jobs;
}

/**
 * Helper Rebuild Master Cache di Firestore
 */
async function rebuildMasterCacheHelper(now: number, nextSyncAt: number) {
  try {
    const snapAll = await db.collection("jobs").orderBy("postedAt", "desc").limit(1000).get();
    const compressedJobs: any[] = [];
    snapAll.forEach((docSnap) => {
      const d = docSnap.data();
      compressedJobs.push({
        id: docSnap.id,
        slug: d.slug || docSnap.id,
        title: d.title || "",
        company: d.company || "",
        companyLogo: d.companyLogo || null,
        category: d.category || "IT & Rekayasa Perangkat Lunak",
        location: d.location || "Indonesia",
        city: d.city || "",
        workType: d.workType || "Full-time",
        workSetup: d.workSetup || "On-site",
        experienceLevel: d.experienceLevel || "Fresh Graduate / Alumni Pelatihan",
        description: d.description ? d.description.substring(0, 800) : "",
        skills: Array.isArray(d.skills) ? d.skills : [],
        relevantTrainingPrograms: Array.isArray(d.relevantTrainingPrograms) ? d.relevantTrainingPrograms : [],
        applicationUrl: d.applicationUrl || null,
        isStpPartner: Boolean(d.isStpPartner),
        source: d.source || "stp_partner",
        postedAt: d.postedAt || now,
        firstSeenAt: d.firstSeenAt || now,
        lastSeenAt: d.lastSeenAt || now,
        isActive: d.isActive !== false,
      });
    });

    const CHUNK_SIZE = 80;
    const cacheColRef = db.collection("artifacts/blud-app-dev/public/data/cache_jobs");
    const masterDocRef = cacheColRef.doc("master");

    if (compressedJobs.length <= CHUNK_SIZE) {
      await masterDocRef.set(
        {
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          count: compressedJobs.length,
          lastSyncedAt: now,
          nextSyncAt,
          isChunked: false,
          data: compressedJobs,
        },
        { merge: true }
      );
    } else {
      const totalChunks = Math.ceil(compressedJobs.length / CHUNK_SIZE);
      const chunkIds: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkId = `chunk_${i}`;
        chunkIds.push(chunkId);
        const chunkData = compressedJobs.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await cacheColRef.doc(chunkId).set(
          {
            index: i,
            count: chunkData.length,
            data: chunkData,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await masterDocRef.set(
        {
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          count: compressedJobs.length,
          lastSyncedAt: now,
          nextSyncAt,
          isChunked: true,
          totalChunks,
          chunkIds,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[JobSyncScheduler] Gagal merebuild Master Cache:", err);
  }
}

/**
 * 1. Cloud Function v2 Daily Scheduler:
 * Berjalan setiap hari pukul 04:00 WIB (100% Zero-Cost Quota)
 * Menarik lowongan segar dari ATS korporasi & Open API gratis
 */
export const dailyJobSyncScheduler = onSchedule(
  {
    schedule: "every day 04:00",
    timeZone: "Asia/Jakarta",
    region: "asia-southeast2",
    retryCount: 1,
  },
  async () => {
    const now = Date.now();
    console.log("[Daily Job Sync] Memulai pemindaian harian zero-cost (ATS & Open API)...");

    const zeroCostJobs = await harvestZeroCostJobs(now);
    let savedCount = 0;

    if (zeroCostJobs.length > 0) {
      const batch = db.batch();
      zeroCostJobs.forEach((job) => {
        const jobRef = db.collection("jobs").doc(job.id);
        batch.set(jobRef, job, { merge: true });
        savedCount++;
      });
      await batch.commit();
    }

    const nextSyncAt = now + 24 * 60 * 60 * 1000;
    await db.collection("app_settings").doc("jobs_sync").set(
      {
        lastDailySyncAt: now,
        status: "SUCCESS",
        lastRunBy: "Cloud Functions Daily Scheduler (Zero Cost)",
        updatedAt: now,
      },
      { merge: true }
    );

    await rebuildMasterCacheHelper(now, nextSyncAt);
    console.log(`[Daily Job Sync] Sukses! ${savedCount} lowongan dimutakhirkan secara harian.`);
  }
);

/**
 * 2. Cloud Function v2 Weekly Scheduler:
 * Berjalan otomatis seminggu sekali (setiap Senin jam 03.00 WIB)
 * Melakukan pembersihan data kedaluwarsa (TTL 30 hari), agregasi ATS, dan micro-batch JSearch lokal
 */
export const weeklyJobSyncScheduler = onSchedule(
  {
    schedule: "every monday 03:00",
    timeZone: "Asia/Jakarta",
    region: "asia-southeast2",
    retryCount: 2,
  },
  async () => {
    const now = Date.now();
    console.log("[Weekly Job Sync] Memulai deep-sync mingguan & pembersihan data kedaluwarsa...");

    let totalSaved = 0;

    // 1. Eksekusi ATS & Open API Gratis
    const zeroCostJobs = await harvestZeroCostJobs(now);
    if (zeroCostJobs.length > 0) {
      const batch = db.batch();
      zeroCostJobs.forEach((job) => {
        const jobRef = db.collection("jobs").doc(job.id);
        batch.set(jobRef, job, { merge: true });
        totalSaved++;
      });
      await batch.commit();
    }

    // 2. Jika RapidAPI tersedia, jalankan Micro-Batch hemat kuota untuk area prioritas Solo & Indonesia
    const apiKey = process.env.RAPIDAPI_KEY;
    if (apiKey) {
      const targetClusters = [
        { query: "lowongan kerja di Solo" },
        { query: "teknisi di Indonesia" },
        { query: "lowongan IT di Jakarta" },
      ];

      for (const target of targetClusters) {
        try {
          const url = new URL("https://jsearch.p.rapidapi.com/search-v2");
          url.searchParams.set("query", target.query);
          url.searchParams.set("page", "1");
          url.searchParams.set("num_pages", "1");

          const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "jsearch.p.rapidapi.com",
            },
          });

          if (!res.ok) continue;

          const json = await res.json();
          const rawJobs: any[] = json.data?.jobs || (Array.isArray(json.data) ? json.data : []);

          if (rawJobs.length > 0) {
            const batch = db.batch();
            rawJobs.forEach((job) => {
              const jobId = `jsearch-${job.job_id}`;
              const jobRef = db.collection("jobs").doc(jobId);
              const city = job.job_city || job.job_state || "Jakarta";
              const location = `${city}, Indonesia`;

              batch.set(
                jobRef,
                {
                  id: jobId,
                  slug: `${(job.job_title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${job.job_id.slice(-6)}`,
                  title: job.job_title,
                  company: job.employer_name,
                  companyLogo: job.employer_logo || null,
                  companyWebsite: job.employer_website || null,
                  companyType: "Startup / Industri",
                  location,
                  city,
                  workType: job.job_employment_type === "INTERN" ? "Internship / Magang" : "Full-time",
                  workSetup: job.job_is_remote ? "Remote / WFH" : "On-site",
                  experienceLevel: "Fresh Graduate / Alumni Pelatihan",
                  description: cleanPii(job.job_description || "").slice(0, 800),
                  applicationUrl: stripTracking(job.job_apply_link || ""),
                  applySource: job.job_publisher || "RapidAPI JSearch",
                  source: "jsearch_realtime",
                  isStpPartner: false,
                  isFeatured: false,
                  postedAt: job.job_posted_at_timestamp ? job.job_posted_at_timestamp * 1000 : now,
                  firstSeenAt: job.job_posted_at_timestamp ? job.job_posted_at_timestamp * 1000 : now,
                  lastSeenAt: now,
                  deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
                  isActive: true,
                  updatedAt: now,
                },
                { merge: true }
              );
              totalSaved++;
            });
            await batch.commit();
          }
        } catch {
          // Lanjut ke target berikutnya
        }
      }
    }

    // 3. TTL Cleanup: Nonaktifkan lowongan non-STP yang tidak terdeteksi > 30 hari
    try {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const expiredSnap = await db
        .collection("jobs")
        .where("isStpPartner", "==", false)
        .where("lastSeenAt", "<", thirtyDaysAgo)
        .limit(200)
        .get();

      if (!expiredSnap.empty) {
        const pruneBatch = db.batch();
        expiredSnap.forEach((d) => {
          pruneBatch.update(d.ref, { isActive: false, updatedAt: now });
        });
        await pruneBatch.commit();
        console.log(`[Weekly Job Sync] Pembersihan TTL: ${expiredSnap.size} lowongan lama dinonaktifkan.`);
      }
    } catch (ttlErr) {
      console.warn("[Weekly Job Sync] Gagal TTL cleanup:", ttlErr);
    }

    // 4. Perbarui metadata sinkronisasi
    const nextSyncAt = now + 7 * 24 * 60 * 60 * 1000;
    await db.collection("app_settings").doc("jobs_sync").set(
      {
        lastSyncedAt: now,
        nextSyncAt,
        syncIntervalDays: 7,
        totalJobsInDb: totalSaved,
        status: "SUCCESS",
        provider: apiKey
          ? "ATS Publik, Open API Multi-Provider & JSearch Micro-Batch"
          : "ATS Publik & Open API Multi-Provider (100% Zero Cost)",
        lastRunBy: "Cloud Functions Scheduler (Weekly Deep-Sync)",
      },
      { merge: true }
    );

    // 5. Rebuild Master Cache
    await rebuildMasterCacheHelper(now, nextSyncAt);
    console.log(`[Weekly Job Sync] Sukses! ${totalSaved} lowongan tersimpan & Master Cache disegarkan.`);
  }
);
