import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function v2 Scheduler:
 * Berjalan otomatis seminggu sekali (setiap Senin jam 03.00 WIB)
 * Menarik lowongan kerja terbaru dari RapidAPI JSearch dan menyimpannya ke Firestore koleksi 'jobs'.
 */
export const weeklyJobSyncScheduler = onSchedule(
  {
    schedule: "every monday 03:00",
    timeZone: "Asia/Jakarta",
    region: "asia-southeast2",
    retryCount: 2,
  },
  async () => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.warn("[Weekly Job Sync] RAPIDAPI_KEY tidak dikonfigurasi di Cloud Functions. Melewati sinkronisasi otomatis.");
      return;
    }

    console.log("[Weekly Job Sync] Memulai sinkronisasi lowongan pekerjaan mingguan dari RapidAPI JSearch...");

    const targetClusters: Array<{ query: string; country?: string }> = [
      // Indonesia
      { query: "lowongan IT di Jakarta" },
      { query: "lowongan programmer Jakarta" },
      { query: "lowongan web developer di Indonesia" },
      { query: "lowongan kerja di Solo" },
      { query: "teknisi di Indonesia" },
      { query: "teknik", country: "id" },
      // ASEAN
      { query: "software engineer in Singapore" },
      { query: "developer in Kuala Lumpur" },
      { query: "software engineer", country: "my" },
      { query: "web developer", country: "ph" },
      { query: "software engineer", country: "th" },
      { query: "software developer", country: "vn" },
      // Asia Timur (Jepang)
      { query: "IT", country: "jp" },
      { query: "engineer", country: "jp" },
      { query: "software", country: "jp" },
      { query: "developer", country: "jp" },
    ];

    let totalSaved = 0;
    const now = Date.now();

    for (const target of targetClusters) {
      try {
        const url = new URL("https://jsearch.p.rapidapi.com/search-v2");
        url.searchParams.set("query", target.query);
        if (target.country) {
          url.searchParams.set("country", target.country);
        }
        url.searchParams.set("page", "1");
        url.searchParams.set("num_pages", "1");

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        });

        if (!res.ok) {
          console.warn(`[Weekly Job Sync] Gagal query '${target.query}': ${res.statusText}`);
          continue;
        }

        const json = await res.json();
        const rawJobs: any[] = json.data?.jobs || (Array.isArray(json.data) ? json.data : []);

        if (rawJobs.length > 0) {
          const batch = db.batch();

          rawJobs.forEach((job) => {
            const jobId = `jsearch-${job.job_id}`;
            const jobRef = db.collection("jobs").doc(jobId);

            const countryCode = (job.job_country || "").toUpperCase();
            const countryNameMap: Record<string, string> = {
              ID: "Indonesia",
              SG: "Singapura",
              MY: "Malaysia",
              PH: "Filipina",
              TH: "Thailand",
              VN: "Vietnam",
              JP: "Jepang",
              KR: "Korea Selatan",
            };

            const city = job.job_city || job.job_state || (countryCode === "SG" ? "Singapura" : "Jakarta");
            const countryName = countryNameMap[countryCode] || job.job_country || "Indonesia";
            const location = `${city}, ${countryName}`;

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
                description: job.job_description || "Rincian pekerjaan tersedia di portal lamaran.",
                applicationUrl: job.job_apply_link || null,
                applySource: job.job_publisher || "RapidAPI JSearch",
                source: "jsearch_realtime",
                isStpPartner: false,
                isFeatured: false,
                postedAt: job.job_posted_at_timestamp ? job.job_posted_at_timestamp * 1000 : now,
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
      } catch (err) {
        console.error(`[Weekly Job Sync] Terjadi error pada query '${queryStr}':`, err);
      }
    }

    // Perbarui metadata sinkronisasi
    const nextSyncAt = now + 7 * 24 * 60 * 60 * 1000;
    await db.collection("app_settings").doc("jobs_sync").set(
      {
        lastSyncedAt: now,
        nextSyncAt,
        syncIntervalDays: 7,
        totalJobsInDb: totalSaved,
        status: "SUCCESS",
        provider: "JSearch RapidAPI",
        lastRunBy: "Cloud Functions Scheduler (Weekly)",
      },
      { merge: true }
    );

    console.log(`[Weekly Job Sync] Sukses! ${totalSaved} lowongan tersimpan di database.`);
  }
);
