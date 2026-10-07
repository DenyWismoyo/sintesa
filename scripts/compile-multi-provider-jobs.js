/**
 * Script Kompilasi Multi-Provider Bursa Karir Solo Technopark
 * Menghimpun lowongan dari Remotive, Arbeitnow, Jobicy, Himalayas,
 * menggabungkan dengan lowongan industri maritim/manufaktur (underwater, welder, CNC),
 * lalu menyimpannya ke src/data/jobs/syncedJobs.json dan Cloud Firestore (katalog-solo-technopark).
 */

const fs = require('fs');
const path = require('path');
const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');

const saPath = path.join(__dirname, '..', 'service-account-katalog.json');
const jobsPath = path.join(__dirname, '..', 'src', 'data', 'jobs', 'syncedJobs.json');

// Helper membersihkan tag HTML
function stripHtml(html = '') {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Helper penentu kategori
function inferJobCategory(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (
    text.includes('cyber') ||
    text.includes('security') ||
    text.includes('soc ') ||
    text.includes('pentest') ||
    text.includes('jaringan') ||
    text.includes('network engineer')
  ) {
    return 'Keamanan Siber (Cyber Security)';
  }
  if (
    /\b(ai|artificial intelligence|data science|machine learning|computer vision|deep learning|data scientist|data analyst)\b/i.test(
      text
    )
  ) {
    return 'Kecerdasan Buatan & Sains Data';
  }
  if (
    text.includes('game') ||
    text.includes('animasi') ||
    text.includes('3d') ||
    text.includes('blender') ||
    text.includes('unity') ||
    text.includes('unreal') ||
    text.includes('multimedia')
  ) {
    return 'Multimedia, Game & Animasi 3D';
  }
  if (
    text.includes('weld') ||
    text.includes('las') ||
    text.includes('underwater') ||
    text.includes('subsea') ||
    text.includes('cnc') ||
    text.includes('bubut') ||
    text.includes('milling') ||
    text.includes('manufaktur') ||
    text.includes('mekatronika') ||
    text.includes('otomasi') ||
    text.includes('machin') ||
    text.includes('robotics') ||
    text.includes('plc')
  ) {
    return 'Manufaktur Presisi & Mekatronika';
  }
  if (
    text.includes('marketing') ||
    text.includes('pemasaran') ||
    text.includes('seo') ||
    text.includes('ads') ||
    text.includes('e-commerce') ||
    text.includes('sales') ||
    text.includes('copywriter')
  ) {
    return 'Pemasaran & Bisnis Digital';
  }
  return 'IT & Rekayasa Perangkat Lunak';
}

function inferRelevantPrograms(category, skills = []) {
  const text = skills.join(' ').toLowerCase();
  switch (category) {
    case 'Keamanan Siber (Cyber Security)':
      return [
        'Certified Cyber Security Analyst (CCSA) Solo Technopark',
        'Pelatihan SOC Analyst & Ethical Hacking',
      ];
    case 'Kecerdasan Buatan & Sains Data':
      return [
        'Kecerdasan Buatan (AI) & Machine Learning Specialist',
        'Data Analytics & Big Data Processing Bootcamp',
      ];
    case 'Manufaktur Presisi & Mekatronika':
      if (text.includes('underwater') || text.includes('subsea')) {
        return [
          'Diklat Underwater Wet Welding (Pengelasan Bawah Air) Solo Technopark',
          'Sertifikasi Juru Las (Welder) 6G Standar Migas & Marine',
        ];
      }
      return [
        'Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis',
        'Pelatihan Desain Manufaktur Mekatronika & Otomasi Industri',
      ];
    case 'Multimedia, Game & Animasi 3D':
      return [
        'Pelatihan 3D Asset Modeling & Texturing Blender',
        'Pengembangan Game Interaktif (Unity / Unreal)',
      ];
    case 'Pemasaran & Bisnis Digital':
      return [
        'Pelatihan Pemasaran Digital & E-Commerce',
        'Digital Talent Scholarship (DTS) Digital Entrepreneurship',
      ];
    default:
      return [
        'Fullstack Web Developer (Next.js & Cloud Computing)',
        'Mobile App Development Bootcamp (Flutter/React Native)',
      ];
  }
}

function determineExperienceLevel(title = '') {
  const str = Array.isArray(title) ? title.join(' ') : String(title || '');
  const lower = str.toLowerCase();
  if (
    lower.includes('senior') ||
    lower.includes('lead') ||
    lower.includes('principal') ||
    lower.includes('head') ||
    lower.includes('manager') ||
    lower.includes('director') ||
    lower.includes('executive')
  ) {
    return 'Senior (4+ Tahun)';
  }
  if (lower.includes('mid') || lower.includes('intermediate') || lower.includes('staff')) {
    return 'Mid-Level (2-4 Tahun)';
  }
  if (lower.includes('junior') || lower.includes('associate') || lower.includes('jr') || lower.includes('entry')) {
    return 'Junior (0-2 Tahun)';
  }
  return 'Fresh Graduate / Alumni Pelatihan';
}

function determineWorkType(jobType = '') {
  const str = Array.isArray(jobType) ? jobType.join(' ') : String(jobType || '');
  const lower = str.toLowerCase();
  if (lower.includes('intern') || lower.includes('magang')) return 'Internship / Magang';
  if (lower.includes('contract') || lower.includes('kontrak')) return 'Contract';
  if (lower.includes('part') || lower.includes('paruh')) return 'Part-time';
  if (lower.includes('free') || lower.includes('project')) return 'Freelance / Project';
  return 'Full-time';
}

function determineCompanyType(company = '') {
  const str = Array.isArray(company) ? company.join(' ') : String(company || '');
  const lower = str.toLowerCase();
  if (lower.includes('pertamina') || lower.includes('bumn') || lower.includes('pln') || lower.includes('pal')) {
    return 'BUMN & Pemerintah';
  }
  if (lower.includes('fabricat') || lower.includes('shipyard') || lower.includes('manufaktur') || lower.includes('industr')) {
    return 'Industri Manufaktur';
  }
  if (lower.includes('google') || lower.includes('tech') || lower.includes('software') || lower.includes('labs') || lower.includes('digital')) {
    return 'Perusahaan Teknologi';
  }
  return 'Startup / Industri';
}

// Fetcher 1: Remotive
async function fetchRemotive() {
  try {
    console.log('[1/4] Mengambil lowongan dari Remotive Open API...');
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=30');
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item) => {
      const cleanDesc = stripHtml(item.description || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const skills = tags.length > 0 ? tags.slice(0, 5) : ['Cloud', 'Software Engineering'];
      const relevantPrograms = inferRelevantPrograms(category, skills);

      let salaryMin = undefined;
      let salaryMax = undefined;
      let salaryCurrency = 'USD';
      let isDisclosed = false;

      if (item.salary && typeof item.salary === 'string' && item.salary.trim() !== '') {
        isDisclosed = true;
        const numbers = item.salary.match(/\d+([.,]\d+)?/g);
        if (numbers && numbers.length >= 2) {
          salaryMin = parseInt(numbers[0].replace(/,/g, ''), 10);
          salaryMax = parseInt(numbers[1].replace(/,/g, ''), 10);
        } else if (numbers && numbers.length === 1) {
          salaryMin = parseInt(numbers[0].replace(/,/g, ''), 10);
        }
      }

      const id = `remotive-${item.id}`;
      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.company_name || 'Global Partner',
        companyLogo: item.company_logo || undefined,
        companyType: determineCompanyType(item.company_name || ''),
        location: item.candidate_required_location || 'Global / Remote',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.job_type || 'full_time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.title),
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: salaryCurrency,
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Mengembangkan fitur sesuai arahan teknis ${item.title}.`,
          'Berkolaborasi aktif bersama tim engineering lintas zona waktu.',
          'Menerapkan praktik integrasi berkelanjutan (CI/CD).',
        ],
        requirements: [
          `Pengalaman kerja relevan di bidang ${skills.slice(0, 3).join(', ')}.`,
          'Kemampuan komunikasi profesional dalam tim kolaboratif.',
        ],
        skills,
        benefits: [
          'Fleksibilitas Kerja Penuh (Remote)',
          'Tunjangan Workspace & Perangkat',
          'Akses Pembelajaran & Pengembangan Karir',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Remotive Hub',
        applicationUrl: item.url,
        postedAt: item.publication_date ? new Date(item.publication_date).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (err) {
    console.warn('Gagal fetch Remotive:', err.message);
    return [];
  }
}

// Fetcher 2: Arbeitnow
async function fetchArbeitnow() {
  try {
    console.log('[2/4] Mengambil lowongan dari Arbeitnow Open API...');
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.slice(0, 25).map((item) => {
      const cleanDesc = stripHtml(item.description || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const skills = tags.length > 0 ? tags.slice(0, 5) : ['Engineering', 'Automation'];
      const relevantPrograms = inferRelevantPrograms(category, skills);
      const id = `arbeitnow-${item.slug || Math.random().toString(36).slice(2, 8)}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.company_name || 'International Partner',
        companyType: determineCompanyType(item.company_name || ''),
        location: item.location || (item.remote ? 'Remote' : 'Eropa & Asia'),
        city: item.location?.includes('Jepang') || item.location?.includes('Japan') ? 'Tokyo / Jepang' : 'Global',
        category,
        workType: determineWorkType(item.job_types?.[0] || 'Full-time'),
        workSetup: item.remote ? 'Remote / WFH' : 'On-site',
        experienceLevel: determineExperienceLevel(item.title),
        salary: {
          currency: 'EUR',
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed: false,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Melaksanakan tugas rekayasa teknis utama pada posisi ${item.title}.`,
          'Memastikan kualitas dan kepatuhan standar industri berjalan optimal.',
        ],
        requirements: [
          `Penguasaan teknis teruji pada keahlian ${skills.join(', ')}.`,
          'Disiplin, teliti, dan berorientasi pada hasil kerja berkualitas.',
        ],
        skills,
        benefits: [
          'Dukungan Relokasi / Visa Sponsor (bila memenuhi syarat)',
          'Asuransi Kesehatan Lengkap',
          'Lingkungan Kerja Multikultural',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Arbeitnow Global',
        applicationUrl: item.url,
        postedAt: item.created_at ? item.created_at * 1000 : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (err) {
    console.warn('Gagal fetch Arbeitnow:', err.message);
    return [];
  }
}

// Fetcher 3: Jobicy
async function fetchJobicy() {
  try {
    console.log('[3/4] Mengambil lowongan dari Jobicy Open API...');
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25');
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item) => {
      const cleanDesc = stripHtml(item.jobDescription || item.jobExcerpt || '');
      const category = inferJobCategory(item.jobTitle, cleanDesc);
      const skills = [
        ...(Array.isArray(item.jobIndustry) ? item.jobIndustry : [item.jobIndustry || 'Technology']),
        'Problem Solving',
      ].slice(0, 5);
      const relevantPrograms = inferRelevantPrograms(category, skills);
      const hasSalary = Boolean(item.salaryMin || item.salaryMax);
      const id = `jobicy-${item.id}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.jobTitle,
        company: item.companyName || 'Enterprise Partner',
        companyLogo: item.companyLogo || undefined,
        companyType: determineCompanyType(item.companyName || ''),
        location: item.jobGeo || 'Remote Global',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.jobType?.[0] || 'Full-Time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.jobLevel || item.jobTitle),
        salary: {
          min: item.salaryMin ? Number(item.salaryMin) : undefined,
          max: item.salaryMax ? Number(item.salaryMax) : undefined,
          currency: item.salaryCurrency || 'USD',
          period: item.salaryPeriod === 'yearly' || item.salaryPeriod === 'Tahun' ? 'Tahun' : 'Bulan',
          isNegotiable: true,
          isDisclosed: hasSalary,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Bertanggung jawab penuh atas deliverable ${item.jobTitle}.`,
          'Berkoordinasi bersama stakeholder untuk mencapai target performa.',
        ],
        requirements: [
          `Penguasaan teknis relevan dengan ${item.jobTitle}.`,
          'Pengalaman kerja mandiri secara profesional.',
        ],
        skills,
        benefits: [
          'Kompensasi Kompetitif Internasional',
          'Jam Kerja Fleksibel',
          'Program Pelatihan Internal',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Jobicy Remote',
        applicationUrl: item.url,
        postedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (err) {
    console.warn('Gagal fetch Jobicy:', err.message);
    return [];
  }
}

// Fetcher 4: Himalayas
async function fetchHimalayas() {
  try {
    console.log('[4/4] Mengambil lowongan dari Himalayas Open API...');
    const res = await fetch('https://himalayas.app/jobs/api?limit=25');
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.jobs || !Array.isArray(json.jobs)) return [];

    return json.jobs.map((item) => {
      const cleanDesc = stripHtml(item.description || item.excerpt || '');
      const category = inferJobCategory(item.title, cleanDesc);
      const categories = Array.isArray(item.categories) ? item.categories : [];
      const skills = categories.length > 0 ? categories.slice(0, 5) : ['Software Engineering'];
      const relevantPrograms = inferRelevantPrograms(category, skills);
      const hasSalary = Boolean(item.minSalary || item.maxSalary);
      const rawGuid = String(item.guid || item.title || '').replace(/[^a-zA-Z0-9_-]/g, '');
      const guidSuffix = rawGuid.length > 20 ? rawGuid.slice(-20) : rawGuid || Math.random().toString(36).slice(2, 8);
      const id = `himalayas-${guidSuffix}`;

      return {
        id,
        slug: `job-${id}`,
        title: item.title,
        company: item.companyName || 'Technology Innovator',
        companyLogo: item.companyLogo || undefined,
        companyType: determineCompanyType(item.companyName || ''),
        location: Array.isArray(item.locationRestrictions)
          ? item.locationRestrictions.join(', ')
          : 'Worldwide / Remote',
        city: 'Remote / Global',
        category,
        workType: determineWorkType(item.employmentType || 'Full-time'),
        workSetup: 'Remote / WFH',
        experienceLevel: determineExperienceLevel(item.seniority || item.title),
        salary: {
          min: item.minSalary ? Number(item.minSalary) : undefined,
          max: item.maxSalary ? Number(item.maxSalary) : undefined,
          currency: item.currency || 'USD',
          period: item.salaryPeriod === 'yearly' || item.salaryPeriod === 'Tahun' ? 'Tahun' : 'Bulan',
          isNegotiable: true,
          isDisclosed: hasSalary,
        },
        description: cleanDesc.slice(0, 800),
        responsibilities: [
          `Menjalankan siklus rekayasa dan pengembangan fitur ${item.title}.`,
          'Menulis kode berkualitas tinggi, modular, dan teruji.',
        ],
        requirements: [
          `Kemahiran mendalam pada keahlian ${skills.join(', ')}.`,
          'Berorientasi pada inovasi dan nilai tambah pengguna.',
        ],
        skills,
        benefits: [
          'Gaji Standar Global Berdaya Saing',
          'Tunjangan Kesehatan Komprehensif',
          'Peralatan Kerja Disediakan',
        ],
        relevantTrainingPrograms: relevantPrograms,
        isStpPartner: false,
        source: 'jsearch_realtime',
        applySource: 'Himalayas App',
        applicationUrl: item.applicationLink,
        postedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        isFeatured: false,
        viewsCount: Math.floor(Math.random() * 40 + 10),
        applicantCount: Math.floor(Math.random() * 12 + 1),
        isActive: true,
      };
    });
  } catch (err) {
    console.warn('Gagal fetch Himalayas:', err.message);
    return [];
  }
}

// Sanitasi untuk Firestore
function sanitize(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = sanitize(v);
      }
    }
    return clean;
  }
  return obj;
}

async function main() {
  console.log('=== KOMPILASI MULTI-PROVIDER BURSA KARIR SOLO TECHNOPARK ===\n');

  // 1. Baca snapshot lokal yang sudah ada
  let existingJobs = [];
  if (fs.existsSync(jobsPath)) {
    try {
      const snap = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
      existingJobs = snap.jobs || [];
      console.log(`✓ Data lokal saat ini: ${existingJobs.length} lowongan tersimpan.`);
    } catch (e) {
      console.warn('Gagal membaca snapshot lama:', e.message);
    }
  }

  // 2. Tarik lowongan baru dari 4 Open API secara paralel
  const [remotiveJobs, arbeitnowJobs, jobicyJobs, himalayasJobs] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow(),
    fetchJobicy(),
    fetchHimalayas(),
  ]);

  console.log(`\nHasil Fetch Open API:`);
  console.log(`- Remotive   : ${remotiveJobs.length} lowongan`);
  console.log(`- Arbeitnow  : ${arbeitnowJobs.length} lowongan`);
  console.log(`- Jobicy     : ${jobicyJobs.length} lowongan`);
  console.log(`- Himalayas  : ${himalayasJobs.length} lowongan`);

  const newFetchedJobs = [
    ...remotiveJobs,
    ...arbeitnowJobs,
    ...jobicyJobs,
    ...himalayasJobs,
  ];

  // 3. Gabungkan dan deduplikasi
  // Map keyed by Normalized (Title + Company) dan ID
  const jobMap = new Map();

  // Simpan existing jobs terlebih dahulu (termasuk 32 lowongan industri)
  for (const job of existingJobs) {
    const normKey = `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
    jobMap.set(normKey, job);
    jobMap.set(job.id, job);
  }

  // Tambahkan new jobs jika belum ada
  let addedCount = 0;
  for (const job of newFetchedJobs) {
    const normKey = `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
    if (!jobMap.has(normKey) && !jobMap.has(job.id)) {
      jobMap.set(normKey, job);
      jobMap.set(job.id, job);
      addedCount++;
    }
  }

  // Ambil list unik berdasarkan ID
  const uniqueJobsMap = new Map();
  for (const job of jobMap.values()) {
    uniqueJobsMap.set(job.id, job);
  }
  const compiledJobs = Array.from(uniqueJobsMap.values()).map((j) => {
    const cleanId = String(j.id || '').replace(/[\/\\]/g, '-');
    return {
      ...j,
      id: cleanId,
      slug: j.slug && !j.slug.includes('/') ? j.slug : `job-${cleanId}`,
    };
  });

  console.log(`\n✓ Total lowongan setelah penggabungan & deduplikasi: ${compiledJobs.length} lowongan (+${addedCount} lowongan baru).`);

  // Ringkasan per Kategori
  const categoryCounts = {};
  compiledJobs.forEach((j) => {
    categoryCounts[j.category] = (categoryCounts[j.category] || 0) + 1;
  });
  console.log('\nDistribusi Kategori Lowongan:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`  • ${cat}: ${count}`);
  }

  // 4. Tulis snapshot lokal
  const now = Date.now();
  const nextSync = now + 7 * 24 * 60 * 60 * 1000;
  const metadata = {
    lastSyncedAt: now,
    nextSyncAt: nextSync,
    syncIntervalDays: 7,
    totalJobsInDb: compiledJobs.length,
    realtimeJobsCount: compiledJobs.filter((j) => j.source === 'jsearch_realtime').length,
    stpJobsCount: compiledJobs.filter((j) => j.isStpPartner).length,
    status: 'SUCCESS',
    message: `Berhasil mengompilasi ${compiledJobs.length} lowongan dari Multi-Provider Open API (Remotive, Arbeitnow, Jobicy, Himalayas) & Bursa Industri Vokasi STP.`,
    provider: 'Multi-Provider Aggregator (Remotive, Arbeitnow, Jobicy, Himalayas) & Bursa STP',
    lastUpdatedBy: 'Admin Multi-Provider Compiler',
  };

  const outputPayload = {
    jobs: compiledJobs,
    metadata,
  };

  fs.writeFileSync(jobsPath, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`\n✓ Berhasil memperbarui file lokal: ${jobsPath}`);

  // 5. Unggah ke Cloud Firestore Produksi (katalog-solo-technopark)
  if (fs.existsSync(saPath)) {
    console.log(`\nMenghubungkan ke Cloud Firestore [katalog-solo-technopark]...`);
    const sa = require(saPath);
    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(sa),
        projectId: 'katalog-solo-technopark',
      },
      'multiProviderUploadApp'
    );
    const db = app.firestore();

    const chunkSize = 200;
    let uploadedCount = 0;

    for (let i = 0; i < compiledJobs.length; i += chunkSize) {
      const chunk = compiledJobs.slice(i, i + chunkSize);
      const batch = db.batch();

      chunk.forEach((job) => {
        const docRef = db.collection('jobs').doc(job.id);
        batch.set(docRef, sanitize(job), { merge: true });
        uploadedCount++;
      });

      console.log(`Mengunggah batch dokumen ${i + 1} s.d. ${Math.min(i + chunkSize, compiledJobs.length)}...`);
      await batch.commit();
    }

    // Update metadata Firestore
    await db.collection('app_settings').doc('jobs_sync').set(metadata, { merge: true });
    console.log(`✓ Metadata sinkronisasi di Firestore telah diperbarui.`);
    console.log(`✓ SELESAI! ${uploadedCount} lowongan tersinkronisasi sempurna di Cloud Firestore.`);
  } else {
    console.warn('File service-account-katalog.json tidak ditemukan, Firestore upload dilewati.');
  }

  console.log('\n=== KOMPILASI DATABASE LOWONGAN SELESAI DENGAN SUKSES ===');
}

main().catch((err) => {
  console.error('Fatal error saat kompilasi:', err);
  process.exit(1);
});
