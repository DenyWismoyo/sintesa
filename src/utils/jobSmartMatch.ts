// src/utils/jobSmartMatch.ts
import { JobListing, JobSalary } from '@/types/job.types';
import { Alumni } from '@/types/ecosystem.types';

/**
 * Estimasi kurs konversi ke IDR untuk penyetaraan urutan Gaji Tertinggi (salary_high)
 * lintas mata uang dan periode pembayaran (Bulan vs Tahun).
 */
const CURRENCY_TO_IDR_RATE: Record<string, number> = {
  IDR: 1,
  USD: 16000,
  SGD: 12000,
  MYR: 3600,
  JPY: 108,
  KRW: 11.6,
  EUR: 17200,
  GBP: 20200,
  AUD: 10500,
};

export function normalizeSalaryToMonthlyIdr(salary?: JobSalary): number {
  if (!salary || !salary.isDisclosed) return 0;
  const rawMax = salary.max || salary.min || 0;
  if (rawMax <= 0) return 0;

  const curr = (salary.currency || 'IDR').toUpperCase();
  const rate = CURRENCY_TO_IDR_RATE[curr] ?? 1;
  const inIdr = rawMax * rate;

  if (salary.period === 'Tahun') {
    return Math.round(inIdr / 12);
  }
  return Math.round(inIdr);
}

/**
 * Kamus klaster sinonim kejuruan Solo Technopark & RSKB
 * Digunakan agar perbedaan penamaan diklat (misal "Welder" vs "Juru Las" vs "Pengelasan")
 * tetap saling mengenali secara akurat.
 */
const VOCATIONAL_SYNONYM_CLUSTERS: string[][] = [
  ['welder', 'welding', 'las', 'pengelasan', 'smaw', 'gmaw', 'gtaw', '6g', '3g', '4g', 'pipa', 'underwater', 'bawah air', 'subsea'],
  ['cnc', 'bubut', 'milling', 'machinist', 'machining', 'cad', 'cam', 'mastercam', 'solidworks', 'manufaktur', 'manufacturing', 'mekatronika', 'plc', 'otomasi', 'automation'],
  ['garmen', 'garment', 'menjahit', 'jahit', 'sewing', 'tekstil', 'apparel', 'tata busana'],
  ['otomotif', 'kendaraan', 'ev', 'baterai', 'mekanik', 'teknisi motor', 'mobil'],
  ['web', 'fullstack', 'frontend', 'backend', 'react', 'nextjs', 'next.js', 'typescript', 'javascript', 'node', 'laravel', 'php', 'software', 'programmer', 'developer'],
  ['ai', 'artificial intelligence', 'data science', 'data analyst', 'machine learning', 'python', 'computer vision', 'deep learning'],
  ['cyber', 'security', 'keamanan siber', 'network', 'jaringan', 'cloud', 'devops', 'pentest', 'soc'],
  ['desain', 'design', 'ui/ux', 'multimedia', '3d', 'blender', 'animasi', 'game', 'unity', 'grafis', 'video', 'kreatif'],
  ['digital marketing', 'pemasaran', 'seo', 'social media', 'e-commerce', 'marketplace', 'tiktok', 'copywriter', 'bisnis digital', 'sales', 'wirausaha', 'umkm'],
];

const STOPWORDS = new Set([
  'pelatihan',
  'diklat',
  'bootcamp',
  'sertifikasi',
  'program',
  'kursus',
  'kelas',
  'solo',
  'technopark',
  'surakarta',
  'standar',
  'industri',
  'dan',
  'untuk',
  'dengan',
  'tingkat',
  'dasar',
  'lanjut',
  'reguler',
  'mandiri',
  'vokasi',
]);

export function extractMeaningfulTokens(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .split(/[\s/,-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholePhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const escaped = escapeRegExp(phrase.toLowerCase().trim());
  if (!escaped) return false;
  const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
  return regex.test(text);
}

function getClusterIndices(text: string): number[] {
  const lower = text.toLowerCase();
  const indices: number[] = [];
  VOCATIONAL_SYNONYM_CLUSTERS.forEach((cluster, idx) => {
    if (cluster.some((kw) => containsWholePhrase(lower, kw))) {
      indices.push(idx);
    }
  });
  return indices;
}

/**
 * Mengecek apakah sebuah lowongan selaras dengan nama program pelatihan (milik alumni atau filter UI)
 */
export function isProgramAligned(job: JobListing, programName?: string | null): boolean {
  if (!programName || !programName.trim()) return false;
  const target = programName.toLowerCase().trim();

  const jobCorpus = [
    ...job.relevantTrainingPrograms,
    job.title,
    job.category,
    ...job.skills,
  ]
    .join(' ')
    .toLowerCase();

  if (
    job.relevantTrainingPrograms.some((p) => {
      const pLower = p.toLowerCase().trim();
      return (
        pLower.length >= 3 &&
        (containsWholePhrase(target, pLower) || containsWholePhrase(pLower, target))
      );
    })
  ) {
    return true;
  }

  // Cek kesamaan klaster kejuruan
  const targetClusters = getClusterIndices(target);
  if (targetClusters.length > 0) {
    const jobClusters = getClusterIndices(jobCorpus);
    if (targetClusters.some((c) => jobClusters.includes(c))) {
      return true;
    }
  }

  // Cek irisan token bermakna utuh
  const tokens = extractMeaningfulTokens(target);
  if (tokens.length === 0) return false;
  const matchedTokens = tokens.filter((t) => containsWholePhrase(jobCorpus, t));
  return matchedTokens.length >= Math.min(2, tokens.length);
}

export interface AlumniJobMatchSummary {
  score: number; // 0 - 100
  grade: 'Sangat Cocok' | 'Cocok' | 'Potensial' | 'Eksplorasi';
  matchedSkills: string[];
  isProgramMatch: boolean;
  reasons: string[];
}

/**
 * Menghitung skor keselarasan proaktif (0-100%) antara Profil Alumni yang login dengan Lowongan Kerja.
 * Berjalan instan di memori tanpa latensi API sehingga bisa meranking ratusan lowongan secara real-time.
 */
export function computeAlumniJobMatch(
  job: JobListing,
  alumni?: Partial<Alumni> | null
): AlumniJobMatchSummary {
  if (!alumni) {
    return {
      score: 0,
      grade: 'Eksplorasi',
      matchedSkills: [],
      isProgramMatch: false,
      reasons: [],
    };
  }

  let score = 20; // Baseline akses eksklusif alumni
  const reasons: string[] = [];

  // 1. Keselarasan Program Pelatihan / Kejuruan (Maks +40 poin)
  const programsToCheck = [
    alumni.programTaken,
    ...(alumni.trainingHistory || []),
    alumni.major,
    alumni.industry,
  ].filter(Boolean) as string[];

  const isProgramMatch = programsToCheck.some((prog) => isProgramAligned(job, prog));
  if (isProgramMatch) {
    score += 40;
    if (alumni.programTaken) {
      reasons.push(`Selaras diklat ${alumni.programTaken}`);
    } else {
      reasons.push('Selaras bidang kejuruan Anda');
    }
  } else if (programsToCheck.length > 0) {
    // Cek irisan parsial 1 token utuh pada judul/deskripsi
    const allProgTokens = programsToCheck.flatMap(extractMeaningfulTokens);
    const jobText = `${job.title} ${job.category} ${job.skills.join(' ')}`.toLowerCase();
    if (allProgTokens.some((t) => containsWholePhrase(jobText, t))) {
      score += 18;
      reasons.push('Bidang industri beririsan');
    }
  }

  // 2. Keselarasan Skills, Tools & Sertifikasi (Maks +25 poin)
  const alumniSkillList = Array.from(
    new Set(
      [
        ...(alumni.skills || []),
        ...(alumni.tools || []),
        ...(alumni.endorsedSkills || []),
        ...(alumni.certifications || []),
      ]
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

  const matchedSkills: string[] = [];
  if (alumniSkillList.length > 0) {
    const jobSkillCorpus = `${job.title} ${job.skills.join(' ')} ${job.requirements.join(' ')} ${job.description}`.toLowerCase();
    alumniSkillList.forEach((skill) => {
      const cleanSkill = skill.toLowerCase();
      if (cleanSkill.length >= 2 && containsWholePhrase(jobSkillCorpus, cleanSkill)) {
        matchedSkills.push(skill);
      }
    });

    if (matchedSkills.length > 0) {
      const skillBonus = Math.min(25, matchedSkills.length * 9);
      score += skillBonus;
      reasons.push(`${matchedSkills.length} keahlian cocok (${matchedSkills.slice(0, 2).join(', ')})`);
    }
  }

  // 3. Keselarasan Preferensi Lokasi / Target Negara & Model Kerja (Maks +10 poin)
  const prefSetup = (alumni.preferredWorkSetup || alumni.workSetup || '').toLowerCase();
  if (prefSetup && prefSetup !== 'all') {
    if (
      job.workSetup.toLowerCase().includes(prefSetup) ||
      prefSetup.includes(job.workSetup.toLowerCase())
    ) {
      score += 5;
    }
  }

  const prefRegion = (
    alumni.preferredRegion ||
    alumni.targetCountry ||
    alumni.targetPlacement ||
    alumni.domicile ||
    ''
  ).toLowerCase();

  if (prefRegion) {
    const jobLocCorpus = `${job.location} ${job.city} ${job.country || ''} ${job.region || ''}`.toLowerCase();
    if (
      (prefRegion.includes('jepang') && jobLocCorpus.includes('jepang')) ||
      (prefRegion.includes('korea') && jobLocCorpus.includes('korea')) ||
      (prefRegion.includes('solo') && (jobLocCorpus.includes('solo') || jobLocCorpus.includes('surakarta'))) ||
      (prefRegion === job.region) ||
      jobLocCorpus.includes(prefRegion)
    ) {
      score += 5;
      reasons.push(`Sesuai target wilayah (${job.city || job.location})`);
    }
  }

  // 4. Keselarasan Pengalaman & Prioritas Mitra Kawasan STP (Maks +8 poin)
  if (job.isStpPartner) {
    score += 4;
    reasons.push('Mitra prioritas penyaluran STP');
  }
  if (
    job.experienceLevel.includes('Fresh Graduate') &&
    (!alumni.experienceLevel || alumni.experienceLevel.toLowerCase().includes('fresh') || alumni.experienceLevel.toLowerCase().includes('pemula'))
  ) {
    score += 4;
  } else if (
    alumni.experienceLevel &&
    job.experienceLevel.toLowerCase().includes(alumni.experienceLevel.toLowerCase().split(' ')[0])
  ) {
    score += 4;
  }

  const finalScore = Math.max(15, Math.min(98, Math.round(score)));

  let grade: AlumniJobMatchSummary['grade'] = 'Eksplorasi';
  if (finalScore >= 80) grade = 'Sangat Cocok';
  else if (finalScore >= 62) grade = 'Cocok';
  else if (finalScore >= 45) grade = 'Potensial';

  return {
    score: finalScore,
    grade,
    matchedSkills,
    isProgramMatch,
    reasons,
  };
}
