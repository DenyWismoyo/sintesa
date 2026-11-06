// src/utils/jobContactUtils.ts
import { JobListing } from '@/types/job.types';

/**
 * Format nomor telepon Indonesia menjadi format standar internasional WhatsApp (62xxx)
 */
export function formatWhatsappNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('62')) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Tautan pencarian langsung terverifikasi di LinkedIn Jobs
 */
export function getLinkedInJobsUrl(job: JobListing): string {
  if (job.linkedinJobUrl && job.linkedinJobUrl.startsWith('http')) {
    return job.linkedinJobUrl;
  }
  const query = `${job.company} ${job.title}`.trim();
  const location = job.city ? `&location=${encodeURIComponent(job.city + ', Indonesia')}` : '';
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}${location}`;
}

/**
 * Tautan pencarian Google Jobs terverifikasi
 */
export function getGoogleJobsUrl(job: JobListing): string {
  const query = `lowongan ${job.title} ${job.company} karir apply`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Tautan pencarian lowongan di JobStreet Indonesia
 */
export function getJobstreetSearchUrl(job: JobListing): string {
  const query = `${job.title} ${job.company}`.replace(/[\/\\]/g, ' ').trim();
  return `https://id.jobstreet.com/id/job-search/${encodeURIComponent(query)}-jobs/`;
}

/**
 * Tautan pencarian lowongan di Glints
 */
export function getGlintsSearchUrl(job: JobListing): string {
  const query = `${job.company} ${job.title}`.trim();
  return `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(query)}`;
}

/**
 * Ekstraksi nama domain dari URL secara aman
 */
export function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Format pesan sapaan resmi WhatsApp ke HRD
 */
export function getWhatsappChatUrl(phone: string, job: JobListing, applicantName?: string): string {
  const cleanNumber = formatWhatsappNumber(phone);
  const nameLabel = applicantName?.trim() ? applicantName.trim() : 'Kandidat Pelamar';
  const text = `Halo Tim HRD / Rekrutmen ${job.company},\n\nPerkenalkan saya ${nameLabel}. Saya mendapatkan informasi lowongan kerja untuk posisi *${job.title}* melalui Portal Karir Solo Technopark.\n\nSaya bermaksud menanyakan detail persyaratan dan menyampaikan berkas lamaran saya untuk posisi tersebut. Apakah lowongan ini masih terbuka?\n\nTerima kasih banyak atas perhatian dan kesempatannya.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Format link email mailto ke HRD dengan template subjek dan pembuka profesional
 */
export function getMailtoLink(email: string, job: JobListing, applicantName?: string): string {
  const nameLabel = applicantName?.trim() ? applicantName.trim() : 'Talenta Solo Technopark';
  const subject = `Lamaran Pekerjaan: ${job.title} - ${nameLabel}`;
  const body = `Yth. Tim Rekrutmen & HRD ${job.company},

Dengan hormat,

Sehubungan dengan informasi lowongan pekerjaan untuk posisi ${job.title} di ${job.company} yang saya peroleh melalui Portal Karir Solo Technopark, saya bermaksud untuk mengajukan surat lamaran kerja dan melampirkan berkas portofolio/CV saya untuk posisi tersebut.

Data Singkat Pelamar:
- Nama: ${applicantName?.trim() || '[Nama Lengkap Anda]'}
- Posisi yang Dilamar: ${job.title}
- Nomor Kontak / WA: [Nomor HP / WhatsApp]
- Portofolio / LinkedIn: [Tautan CV / LinkedIn]

Bersama email ini, saya lampirkan curriculum vitae (CV) dan dokumen pendukung terkait kompetensi saya. Saya sangat berharap diberikan kesempatan untuk mengikuti tahapan seleksi wawancara lebih lanjut.

Demikian surat lamaran ini saya sampaikan. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.

Hormat saya,
${applicantName?.trim() || '[Nama Lengkap Anda]'}`;

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Tautan pencarian poster/flyer loker di Instagram via Google Search (tidak terhalang login-wall Instagram)
 */
export function getInstagramSearchUrl(job: JobListing): string {
  if (job.instagramUrl && job.instagramUrl.startsWith('http')) {
    return job.instagramUrl;
  }
  const cleanComp = job.company
    .replace(/^PT\s+/i, '')
    .replace(/^CV\s+/i, '')
    .trim();
  const query = `site:instagram.com ("loker" OR "lowongan" OR "rekrutmen") "${cleanComp}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Tautan eksplorasi tagar loker langsung di aplikasi/web Instagram
 */
export function getInstagramTagUrl(job: JobListing): string {
  if (job.instagramUrl && job.instagramUrl.startsWith('http')) {
    return job.instagramUrl;
  }
  const cleanComp = job.company
    .replace(/^PT\s+/i, '')
    .replace(/^CV\s+/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 25)
    .toLowerCase();
  return `https://www.instagram.com/explore/tags/loker${cleanComp}/`;
}

/**
 * Tautan verifikasi lowongan resmi di SIAPkerja / KarirHub Kemnaker RI
 */
export function getKemnakerSearchUrl(job: JobListing): string {
  const cleanComp = job.company.replace(/^PT\s+/i, '').replace(/^CV\s+/i, '').trim();
  return `https://karirhub.kemnaker.go.id/vacancies?search=${encodeURIComponent(cleanComp)}`;
}

/**
 * Tautan Google Search untuk memvalidasi keberadaan pengumuman resmi (flyer / edaran / PDF rekrutmen)
 */
export function getOfficialVerificationSearchUrl(job: JobListing): string {
  const query = `pengumuman lowongan "${job.title}" "${job.company}" resmi`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}


