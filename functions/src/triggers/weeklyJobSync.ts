import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function getServerAppId(): string {
  return process.env.APP_ID || process.env.NEXT_PUBLIC_APP_ID || "blud-app-dev";
}

// Daftar target ATS terverifikasi (selaras penuh dengan Next.js atsCrawler.service.ts)
const ATS_TARGETS: Array<{
  platform: "greenhouse" | "lever" | "ashby";
  company: string;
  token: string;
  city: string;
  country: string;
}> = [
  { platform: "lever", company: "Amar Bank (Tunaiku)", token: "amarbank", city: "Jakarta", country: "Indonesia" },
  { platform: "greenhouse", company: "Xendit", token: "xendit", city: "Jakarta", country: "Indonesia" },
  { platform: "lever", company: "PayJoy Indonesia", token: "payjoy", city: "Jakarta", country: "Indonesia" },
  { platform: "greenhouse", company: "Kredivo (FinAccel)", token: "finaccel", city: "Jakarta", country: "Indonesia" },
  { platform: "greenhouse", company: "OY! Indonesia", token: "oyindonesia", city: "Jakarta", country: "Indonesia" },
  { platform: "lever", company: "Ninja Van", token: "ninjavan", city: "Singapura & Jakarta", country: "Singapura" },
  { platform: "ashby", company: "Airwallex", token: "airwallex", city: "Singapura", country: "Singapura" },
  { platform: "greenhouse", company: "PayPay Corporation", token: "paypay", city: "Tokyo", country: "Jepang" },
  { platform: "greenhouse", company: "Coupang", token: "coupang", city: "Seoul", country: "Korea Selatan" },
  { platform: "ashby", company: "Deel", token: "deel", city: "Remote", country: "Global" },
  { platform: "ashby", company: "Linear", token: "linear", city: "Remote", country: "Global" },
  { platform: "ashby", company: "Postman", token: "postman", city: "Remote", country: "Global" },
  { platform: "ashby", company: "Supabase", token: "supabase", city: "Remote", country: "Global" },
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
    ["utm_source", "utm_medium", "utm_campaign", "gh_jid", "lever-source", "ref", "fbclid", "gclid"].forEach((k) =>
      u.searchParams.delete(k)
    );
    return u.toString();
  } catch {
    return url;
  }
}

function inferRegionServer(city: string, location: string, fallbackCountry: string, company: string): string {
  const primary = `${city} ${location}`.toLowerCase();
  const full = `${primary} ${fallbackCountry}`.toLowerCase();
  if (/singapore|singapura|malaysia|kuala lumpur|philippines|taguig|manila|vietnam|bangkok|thailand/i.test(primary)) {
    return "asean";
  }
  if (/japan|jepang|tokyo|osaka|korea|seoul|busan|taiwan|taipei/i.test(primary)) {
    return "east_asia";
  }
  if (/indonesia|jakarta|surakarta|solo|semarang|surabaya|bandung|yogyakarta|bali|batam|bekasi|tangerang/i.test(primary)) {
    return "indonesia";
  }
  if (/indonesia/i.test(full) || (!/remote|global|worldwide/i.test(primary) && /indonesia/i.test(company))) {
    return "indonesia";
  }
  if (/singapore|singapura|malaysia/i.test(full)) return "asean";
  if (/japan|jepang|korea/i.test(full)) return "east_asia";
  return "global_remote";
}

function inferCategoryServer(title: string, desc: string): string {
  const t = (title || "").toLowerCase();
  const full = `${t} ${(desc || "").slice(0, 400).toLowerCase()}`;

  if (
    /\b(support|customer service|clerk|admin|operations|hr|recruiter|finance|accounting|sales|business development|marketing|seo|social media|copywriter|brand|collection)\b/i.test(t) &&
    !/\b(data|ai|ml|engineer|developer|security|cyber)\b/i.test(t)
  ) {
    return "Pemasaran & Bisnis Digital";
  }
  if (/\b(cyber|security|infosec|pentest|soc\b|network engineer)/i.test(t)) {
    return "Keamanan Siber (Cyber Security)";
  }
  if (/\b(ai\b|artificial intelligence|data scien|machine learning|ml engineer|computer vision|deep learning|data analyst)/i.test(t)) {
    return "Kecerdasan Buatan & Sains Data";
  }
  if (/\b(underwater|diver|cnc|mesin|mekatronik|welder|welding|pengelasan|juru las|machinist|cad\/cam|manufaktur|manufacturing|plc|teknisi|maintenance|garmen|sewing)\b/i.test(full)) {
    return "Manufaktur Presisi & Mekatronika";
  }
  if (/\b(3d|game|animasi|blender|multimedia|unity|ui\/ux|product designer|graphic designer|video editor)\b/i.test(full)) {
    return "Multimedia, Game & Animasi 3D";
  }
  if (/\b(marketing|e-commerce|seo|social media|copywriter|penjualan)\b/i.test(full)) {
    return "Pemasaran & Bisnis Digital";
  }
  return "IT & Rekayasa Perangkat Lunak";
}

function extractSkillsServer(title: string, desc: string, category: string): string[] {
  const corpus = `${title} ${desc.slice(0, 1500)}`;
  const dict: Array<[RegExp, string]> = [
    [/\btypescript\b/i, "TypeScript"],
    [/\breact(\.js|js)?\b/i, "React.js"],
    [/\bnext(\.js|js)\b/i, "Next.js"],
    [/\bnode(\.js|js)\b/i, "Node.js"],
    [/\bpython\b/i, "Python"],
    [/\bgolang\b/i, "Golang"],
    [/\bjava\b/i, "Java"],
    [/\bflutter\b/i, "Flutter"],
    [/\bsql\b|\bpostgresql\b/i, "SQL & Database"],
    [/\baws\b|\bgcp\b|\bcloud\b/i, "Cloud Infrastructure"],
    [/\bdocker\b|\bkubernetes\b/i, "Docker & Kubernetes"],
    [/\bmachine learning\b/i, "Machine Learning"],
    [/\bdata analysis\b|\banalytics\b/i, "Data Analytics"],
    [/\bcyber\s*security\b|\binfosec\b/i, "Cyber Security"],
    [/\bfigma\b|\bui\/ux\b/i, "UI/UX & Figma"],
    [/\bcnc\b|\bcad\/cam\b/i, "CNC & CAD/CAM"],
    [/\bweld(ing|er)?\b|\bsmaw\b|\bgmaw\b/i, "Welding / Pengelasan"],
    [/\bplc\b|\bautomation\b|\bmekatronika\b/i, "Otomasi & PLC"],
    [/\bqa\b|\bquality assurance\b/i, "QA & Testing"],
    [/\bseo\b|\bdigital marketing\b/i, "Digital Marketing"],
  ];
  const found: string[] = [];
  for (const [rx, label] of dict) {
    if (rx.test(corpus) && !found.includes(label)) {
      found.push(label);
      if (found.length >= 5) break;
    }
  }
  if (found.length === 0) {
    if (category === "Manufaktur Presisi & Mekatronika") return ["Teknik Manufaktur", "K3 Industri", "Quality Control"];
    if (category === "Pemasaran & Bisnis Digital") return ["Komunikasi Bisnis", "Manajemen Operasional", "Digital Marketing"];
    if (category === "Kecerdasan Buatan & Sains Data") return ["Python", "SQL & Database", "Data Analytics"];
    return ["Software Engineering", "System Architecture", "Problem Solving"];
  }
  return found;
}

function inferProgramsServer(category: string, title: string, skills: string[]): string[] {
  const s = `${title} ${skills.join(" ")}`.toLowerCase();
  if (category === "Manufaktur Presisi & Mekatronika") {
    if (/weld|las|smaw|gmaw/.test(s)) {
      return ["Pelatihan Juru Las (Welder) 3G/4G/6G", "Sertifikasi Pengelasan Pelat & Pipa Standar BNSP / IIW"];
    }
    return ["Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis", "Pelatihan Teknisi Otomasi Industri & Mekatronika"];
  }
  if (category === "Kecerdasan Buatan & Sains Data") {
    return ["Pelatihan Artificial Intelligence & Computer Vision", "Bootcamp Data Science & Machine Learning Engineer"];
  }
  if (category === "Keamanan Siber (Cyber Security)") {
    return ["Pelatihan Cyber Security Defense & Ethical Hacking"];
  }
  if (category === "Multimedia, Game & Animasi 3D") {
    return ["Bootcamp 3D Animation & Game Asset Creation", "Pelatihan UI/UX Design & Product Prototyping"];
  }
  if (category === "Pemasaran & Bisnis Digital") {
    return ["Pelatihan Digital Marketing, SEO & E-Commerce Specialist"];
  }
  return ["Bootcamp Fullstack Web Developer (Next.js & TypeScript)"];
}

/**
 * Helper pengumpul data dari ATS (Greenhouse, Lever, Ashby) & Open API (Remotive, Himalayas, Jobicy, Arbeitnow)
 */
async function harvestZeroCostJobs(now: number): Promise<{ jobs: any[]; respondedPrefixes: string[] }> {
  const jobs: any[] = [];
  const respondedPrefixes: string[] = [];

  // 1. Fetch ATS Targets (Greenhouse, Lever, Ashby)
  for (const t of ATS_TARGETS) {
    try {
      const url =
        t.platform === "greenhouse"
          ? `https://boards-api.greenhouse.io/v1/boards/${t.token}/jobs?content=true`
          : t.platform === "lever"
          ? `https://api.lever.co/v0/postings/${t.token}?mode=json`
          : `https://api.ashbyhq.com/posting-api/job-board/${t.token}?includeCompensation=true`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;

      const json = await res.json();
      if (t.platform === "greenhouse" && Array.isArray(json?.jobs)) {
        if (json.jobs.length > 0) respondedPrefixes.push(`gh-${t.token}-`);
        json.jobs.slice(0, 20).forEach((j: any) => {
          const rawDesc = cleanPii(j.content || "");
          const cityRaw = j.location?.name || t.city;
          const isRemote = /remote|wfh|anywhere/i.test(`${j.title} ${cityRaw}`);
          const city = isRemote ? "Remote / WFH" : cityRaw;
          const region = inferRegionServer(cityRaw, cityRaw, t.country, t.company);
          const category = inferCategoryServer(j.title, rawDesc);
          const skills = extractSkillsServer(j.title, rawDesc, category);
          const currency = region === "indonesia" ? "IDR" : region === "east_asia" ? (t.country === "Jepang" ? "JPY" : "KRW") : region === "asean" ? "SGD" : "USD";

          jobs.push({
            id: `gh-${t.token}-${j.id}`,
            slug: `job-gh-${t.token}-${j.id}`,
            title: j.title,
            company: t.company,
            companyType: "Perusahaan Teknologi",
            location: isRemote ? "Remote Global" : `${city}, ${region === "indonesia" ? "Indonesia" : t.country}`,
            city,
            region,
            country: region === "indonesia" ? "Indonesia" : t.country,
            category,
            workType: /intern|magang/i.test(j.title) ? "Internship / Magang" : "Full-time",
            workSetup: isRemote ? "Remote / WFH" : "On-site",
            experienceLevel: /senior|lead|principal/i.test(j.title) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            salary: { currency, period: "Bulan", isNegotiable: true, isDisclosed: false },
            description: rawDesc.slice(0, 800) || `Peluang karir ${j.title} di ${t.company}.`,
            responsibilities: [`Melaksanakan tugas teknis utama peran ${j.title}.`, "Berkolaborasi aktif bersama tim lintas fungsi."],
            requirements: [`Menguasai kompetensi: ${skills.slice(0, 3).join(", ")}.`, `Kualifikasi relevan di bidang ${category}.`],
            benefits: ["Asuransi Kesehatan", "Jenjang Karir Terbuka"],
            skills,
            relevantTrainingPrograms: inferProgramsServer(category, j.title, skills),
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
        if (json.length > 0) respondedPrefixes.push(`lev-${t.token}-`);
        json.slice(0, 20).forEach((j: any) => {
          const rawDesc = cleanPii(j.descriptionPlain || j.description || "");
          const cityRaw = j.categories?.location || t.city;
          const isRemote = j.categories?.workplaceType === "remote" || /remote|wfh/i.test(`${j.text} ${cityRaw}`);
          const city = isRemote ? "Remote / WFH" : cityRaw;
          const region = inferRegionServer(cityRaw, cityRaw, t.country, t.company);
          const category = inferCategoryServer(j.text, rawDesc);
          const skills = extractSkillsServer(j.text, rawDesc, category);
          const currency = region === "indonesia" ? "IDR" : region === "asean" ? "USD" : "USD";

          jobs.push({
            id: `lev-${t.token}-${j.id}`,
            slug: `job-lev-${t.token}-${j.id}`,
            title: j.text,
            company: t.company,
            companyType: "Perusahaan Teknologi",
            location: isRemote ? "Remote Global" : `${city}, ${region === "indonesia" ? "Indonesia" : t.country}`,
            city,
            region,
            country: region === "indonesia" ? "Indonesia" : t.country,
            category,
            workType: /intern|magang/i.test(j.text) ? "Internship / Magang" : "Full-time",
            workSetup: isRemote ? "Remote / WFH" : "On-site",
            experienceLevel: /senior|lead/i.test(j.text) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            salary: { currency, period: "Bulan", isNegotiable: true, isDisclosed: false },
            description: rawDesc.slice(0, 800) || `Peluang karir ${j.text} di ${t.company}.`,
            responsibilities: [`Bertanggung jawab atas deliverable posisi ${j.text}.`],
            requirements: [`Menguasai kompetensi: ${skills.slice(0, 3).join(", ")}.`],
            benefits: ["BPJS & Tunjangan Kesehatan", "Fasilitas Kerja Modern"],
            skills,
            relevantTrainingPrograms: inferProgramsServer(category, j.text, skills),
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
      } else if (t.platform === "ashby" && Array.isArray(json?.jobs)) {
        if (json.jobs.length > 0) respondedPrefixes.push(`ash-${t.token}-`);
        json.jobs.slice(0, 20).forEach((j: any) => {
          const rawDesc = cleanPii(j.descriptionPlain || j.descriptionHtml || "");
          const cityRaw = j.location || t.city;
          const isRemote = /remote|anywhere|global/i.test(`${j.title} ${cityRaw}`);
          const city = isRemote ? "Remote / WFH" : cityRaw;
          const region = inferRegionServer(cityRaw, cityRaw, t.country, t.company);
          const category = inferCategoryServer(j.title, rawDesc);
          const skills = extractSkillsServer(j.title, rawDesc, category);

          let salaryMin: number | undefined;
          let salaryMax: number | undefined;
          let isDisclosed = false;
          const currency = j.compensation?.currency || "USD";
          if (j.compensation?.compensationTierSummary) {
            const nums = j.compensation.compensationTierSummary.match(/\d+([.,]\d+)?/g);
            if (nums && nums.length >= 2) {
              isDisclosed = true;
              salaryMin = parseInt(nums[0].replace(/,/g, ""), 10);
              salaryMax = parseInt(nums[1].replace(/,/g, ""), 10);
            }
          }

          jobs.push({
            id: `ash-${t.token}-${j.id}`,
            slug: `job-ash-${t.token}-${j.id}`,
            title: j.title,
            company: t.company,
            companyType: "Perusahaan Teknologi",
            location: isRemote ? "Remote Global" : `${city}, ${t.country}`,
            city,
            region,
            country: region === "indonesia" ? "Indonesia" : t.country,
            category,
            workType: /intern|magang/i.test(j.title) ? "Internship / Magang" : "Full-time",
            workSetup: isRemote ? "Remote / WFH" : "On-site",
            experienceLevel: /senior|lead|staff/i.test(j.title) ? "Senior (4+ Tahun)" : "Junior (0-2 Tahun)",
            salary: { min: salaryMin, max: salaryMax, currency, period: "Tahun", isNegotiable: true, isDisclosed },
            description: rawDesc.slice(0, 800) || `Posisi ${j.title} di ${t.company}.`,
            responsibilities: [`Merancang dan mengembangkan solusi pada posisi ${j.title}.`],
            requirements: [`Menguasai kompetensi: ${skills.slice(0, 3).join(", ")}.`],
            benefits: ["Kompensasi Kompetitif Internasional", "Work From Anywhere"],
            skills,
            relevantTrainingPrograms: inferProgramsServer(category, j.title, skills),
            applicationUrl: stripTracking(j.jobUrl || ""),
            applySource: `Ashby (${t.company})`,
            source: "ats_public",
            isStpPartner: false,
            postedAt: j.publishedAt ? new Date(j.publishedAt).getTime() : now,
            firstSeenAt: now,
            lastSeenAt: now,
            deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            updatedAt: now,
          });
        });
      }
    } catch {
      // Safe fallback per target
    }
  }

  // 2. Fetch Open APIs: Remotive, Himalayas, Jobicy (Zero-Cost)
  const openSources = [
    {
      name: "Remotive Hub",
      url: "https://remotive.com/api/remote-jobs?limit=20",
      parse: (json: any) =>
        (json?.jobs || []).map((item: any) => {
          const desc = cleanPii(item.description || "");
          const category = inferCategoryServer(item.title, desc);
          const skills = Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : extractSkillsServer(item.title, desc, category);
          return {
            id: `remotive-${item.id}`,
            slug: `job-remotive-${item.id}`,
            title: item.title,
            company: item.company_name || "Global Partner",
            companyLogo: item.company_logo_url || null,
            companyType: "Perusahaan Teknologi",
            location: item.candidate_required_location || "Global / Remote",
            city: "Remote / Global",
            region: inferRegionServer("", item.candidate_required_location || "", "Global", item.company_name || ""),
            country: "Global",
            category,
            workType: "Full-time",
            workSetup: "Remote / WFH",
            experienceLevel: /senior|lead/i.test(item.title) ? "Senior (4+ Tahun)" : "Fresh Graduate / Alumni Pelatihan",
            salary: { currency: "USD", period: "Bulan", isNegotiable: true, isDisclosed: false },
            description: desc.slice(0, 800),
            responsibilities: [`Mengembangkan solusi teknis untuk posisi ${item.title}.`],
            requirements: [`Menguasai: ${skills.slice(0, 3).join(", ")}.`],
            benefits: ["Remote Work", "Pengembangan Karir"],
            skills,
            relevantTrainingPrograms: inferProgramsServer(category, item.title, skills),
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
          };
        }),
    },
    {
      name: "Himalayas App",
      url: "https://himalayas.app/jobs/api?limit=15",
      parse: (json: any) =>
        (json?.jobs || []).map((item: any) => {
          const desc = cleanPii(item.description || item.excerpt || "");
          const category = inferCategoryServer(item.title, desc);
          const skills = Array.isArray(item.categories) && item.categories.length > 0 ? item.categories.slice(0, 5) : extractSkillsServer(item.title, desc, category);
          const rawGuid = String(item.guid || item.title || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(-20);
          return {
            id: `himalayas-${rawGuid}`,
            slug: `job-himalayas-${rawGuid}`,
            title: item.title,
            company: item.companyName || "Technology Innovator",
            companyLogo: item.companyLogo || null,
            companyType: "Perusahaan Teknologi",
            location: Array.isArray(item.locationRestrictions) ? item.locationRestrictions.join(", ") : "Worldwide / Remote",
            city: "Remote / Global",
            region: "global_remote",
            country: "Global",
            category,
            workType: "Full-time",
            workSetup: "Remote / WFH",
            experienceLevel: /senior|lead/i.test(item.title) ? "Senior (4+ Tahun)" : "Junior (0-2 Tahun)",
            salary: {
              min: item.minSalary ? Number(item.minSalary) : undefined,
              max: item.maxSalary ? Number(item.maxSalary) : undefined,
              currency: item.currency || "USD",
              period: "Tahun",
              isNegotiable: true,
              isDisclosed: Boolean(item.minSalary || item.maxSalary),
            },
            description: desc.slice(0, 800),
            responsibilities: [`Menjalankan siklus pengembangan untuk posisi ${item.title}.`],
            requirements: [`Menguasai: ${skills.slice(0, 3).join(", ")}.`],
            benefits: ["Gaji Standar Global", "Remote Work"],
            skills,
            relevantTrainingPrograms: inferProgramsServer(category, item.title, skills),
            applicationUrl: stripTracking(item.applicationLink || ""),
            applySource: "Himalayas App",
            source: "open_api",
            isStpPartner: false,
            postedAt: now,
            firstSeenAt: now,
            lastSeenAt: now,
            deadlineAt: now + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            updatedAt: now,
          };
        }),
    },
  ];

  for (const src of openSources) {
    try {
      const res = await fetch(src.url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = await res.json();
        jobs.push(...src.parse(json));
      }
    } catch {
      // Lanjut aman
    }
  }

  return { jobs, respondedPrefixes };
}

/**
 * Helper Rebuild Master Cache di Firestore (Menyimpan Utuh Seluruh Atribut JobListing!)
 */
async function rebuildMasterCacheHelper(now: number, nextSyncAt: number) {
  try {
    const appId = getServerAppId();
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
        companyWebsite: d.companyWebsite || null,
        companyType: d.companyType || "Perusahaan Teknologi",
        category: d.category || "IT & Rekayasa Perangkat Lunak",
        location: d.location || "Indonesia",
        city: d.city || "",
        region: d.region || "indonesia",
        country: d.country || "Indonesia",
        workType: d.workType || "Full-time",
        workSetup: d.workSetup || "On-site",
        experienceLevel: d.experienceLevel || "Fresh Graduate / Alumni Pelatihan",
        salary: d.salary || { currency: "IDR", period: "Bulan", isNegotiable: true, isDisclosed: false },
        description: d.description ? d.description.substring(0, 800) : "",
        responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities.slice(0, 5) : [],
        requirements: Array.isArray(d.requirements) ? d.requirements.slice(0, 5) : [],
        benefits: Array.isArray(d.benefits) ? d.benefits.slice(0, 5) : [],
        skills: Array.isArray(d.skills) ? d.skills : [],
        relevantTrainingPrograms: Array.isArray(d.relevantTrainingPrograms) ? d.relevantTrainingPrograms : [],
        applicationUrl: d.applicationUrl || null,
        applicationEmail: d.applicationEmail || null,
        contactPhone: d.contactPhone || null,
        contactWhatsapp: d.contactWhatsapp || null,
        officialCareerUrl: d.officialCareerUrl || null,
        applySource: d.applySource || "Official Web",
        isStpPartner: Boolean(d.isStpPartner),
        isFeatured: Boolean(d.isFeatured),
        source: d.source || "stp_partner",
        postedAt: d.postedAt || now,
        deadlineAt: d.deadlineAt || now + 30 * 24 * 60 * 60 * 1000,
        firstSeenAt: d.firstSeenAt || now,
        lastSeenAt: d.lastSeenAt || now,
        viewsCount: Number(d.viewsCount || 0),
        applicantCount: Number(d.applicantCount || 0),
        partnerId: d.partnerId || null,
        tenantId: d.tenantId || null,
        approvalStatus: d.approvalStatus || "APPROVED",
        isActive: d.isActive !== false,
      });
    });

    const CHUNK_SIZE = 80;
    const cacheColRef = db.collection(`artifacts/${appId}/public/data/cache_jobs`);
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

async function sweepClosedAtsJobs(respondedPrefixes: string[], freshIds: Set<string>, now: number) {
  if (!respondedPrefixes.length) return 0;
  try {
    const activeAtsSnap = await db
      .collection("jobs")
      .where("source", "==", "ats_public")
      .where("isActive", "==", true)
      .limit(400)
      .get();

    if (activeAtsSnap.empty) return 0;
    const batch = db.batch();
    let closedCount = 0;

    activeAtsSnap.forEach((docSnap) => {
      const id = docSnap.id;
      if (respondedPrefixes.some((pref) => id.startsWith(pref)) && !freshIds.has(id)) {
        batch.update(docSnap.ref, { isActive: false, updatedAt: now });
        closedCount++;
      }
    });

    if (closedCount > 0) {
      await batch.commit();
      console.log(`[ActiveAtsSweeper] Menonaktifkan ${closedCount} lowongan ATS yang telah ditutup perekrut.`);
    }
    return closedCount;
  } catch (err) {
    console.warn("[ActiveAtsSweeper] Gagal memeriksa penutupan ATS:", err);
    return 0;
  }
}

/**
 * 1. Cloud Function v2 Daily Scheduler:
 * Berjalan setiap hari pukul 04:00 WIB (100% Zero-Cost Quota)
 * Menarik lowongan segar dari ATS korporasi & Open API gratis + Active Sweeper
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

    const { jobs: zeroCostJobs, respondedPrefixes } = await harvestZeroCostJobs(now);
    const freshIds = new Set(zeroCostJobs.map((j: any) => j.id));
    let savedCount = 0;

    for (let i = 0; i < zeroCostJobs.length; i += 350) {
      const chunk = zeroCostJobs.slice(i, i + 350);
      const batch = db.batch();
      chunk.forEach((job: any) => {
        const jobRef = db.collection("jobs").doc(job.id);
        batch.set(jobRef, job, { merge: true });
        savedCount++;
      });
      await batch.commit();
    }

    await sweepClosedAtsJobs(respondedPrefixes, freshIds, now);

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
    const { jobs: zeroCostJobs, respondedPrefixes } = await harvestZeroCostJobs(now);
    const freshIds = new Set(zeroCostJobs.map((j: any) => j.id));

    for (let i = 0; i < zeroCostJobs.length; i += 350) {
      const chunk = zeroCostJobs.slice(i, i + 350);
      const batch = db.batch();
      chunk.forEach((job: any) => {
        const jobRef = db.collection("jobs").doc(job.id);
        batch.set(jobRef, job, { merge: true });
        totalSaved++;
      });
      await batch.commit();
    }

    await sweepClosedAtsJobs(respondedPrefixes, freshIds, now);

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
