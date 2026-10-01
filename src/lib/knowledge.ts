import fs from 'fs';
import path from 'path';

export interface KnowledgeDoc {
  id: string;
  title: string;
  filename: string;
  category: string;
  keywords: string[];
  content: string;
}

// Data knowledge default jika filesystem tidak dapat diakses
const STATIC_DOCS: Omit<KnowledgeDoc, 'content'>[] = [
  {
    id: 'profil',
    title: 'Profil Kawasan & Ekosistem Solo Technopark',
    filename: '01-profil-kawasan.md',
    category: 'Profil',
    keywords: ['profil', 'tentang', 'sejarah', 'visi', 'misi', 'zona', 'kawasan', 'alamat', 'stk', 'solo technopark', 'mitra', 'shopee', 'garena', 'bank mandiri'],
  },
  {
    id: 'fasilitas',
    title: 'Fasilitas, Ruang Pertemuan & Layanan Sewa',
    filename: '02-fasilitas-layanan.md',
    category: 'Fasilitas',
    keywords: ['fasilitas', 'sewa', 'gedung', 'auditorium', 'ruang', 'meeting', 'rapat', 'coworking', 'lab', 'cnc', 'bengkel', 'tarif', 'harga', 'booking', 'reservasi'],
  },
  {
    id: 'inkubasi',
    title: 'Program Inkubasi Startup & Bisnis Solo Technopark',
    filename: '03-program-inkubasi.md',
    category: 'Inkubasi',
    keywords: ['inkubasi', 'startup', 'umkm', 'bisnis', 'tenant', 'kurasi', 'mentoring', 'modal', 'investor', 'pendanaan', 'demo day', 'pitching'],
  },
  {
    id: 'pelatihan',
    title: 'Program Pelatihan Vokasi & Talenta Digital',
    filename: '04-program-pelatihan.md',
    category: 'Pelatihan',
    keywords: ['pelatihan', 'training', 'kursus', 'vokasi', 'talenta digital', 'coding', 'web', 'ai', 'cnc', 'las', 'underwater welding', 'bnsp', 'sertifikasi'],
  },
  {
    id: 'krenova',
    title: 'Pameran Inovasi & Kreativitas KRENOVA',
    filename: '05-inovasi-krenova.md',
    category: 'Inovasi',
    keywords: ['krenova', 'inovasi', 'pameran', 'kreativitas', 'karya', 'lomba', 'juara', 'hadiah', 'teknologi tepat guna', 'video', 'showcase'],
  },
  {
    id: 'faq',
    title: 'FAQ, Panduan Prosedur & Kontak Resmi',
    filename: '06-faq-prosedur.md',
    category: 'Panduan',
    keywords: ['faq', 'tanya', 'prosedur', 'tata cara', 'kontak', 'whatsapp', 'email', 'jam buka', 'kunjungan', 'magang', 'mbkm', 'pembayaran', 'va', 'rekening'],
  },
];

let cachedDocs: KnowledgeDoc[] | null = null;

/**
 * Memuat seluruh dokumen .md dari folder src/content/knowledge/
 */
export function getAllKnowledgeDocs(): KnowledgeDoc[] {
  if (cachedDocs && cachedDocs.length > 0) {
    return cachedDocs;
  }

  const knowledgeDir = path.join(process.cwd(), 'src', 'content', 'knowledge');
  const docs: KnowledgeDoc[] = [];

  for (const meta of STATIC_DOCS) {
    const filePath = path.join(knowledgeDir, meta.filename);
    let content = '';

    try {
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
      }
    } catch (err) {
      console.warn(`[Knowledge Warning]: Gagal membaca file ${meta.filename}:`, err);
    }

    // Jika file gagal dibaca dari fs, gunakan fallback ringkas
    if (!content) {
      content = `# ${meta.title}\nInformasi resmi kawasan Solo Technopark untuk kategori ${meta.category}. Kunjungi menu terkait pada Katalog Solo Technopark untuk data lengkap.`;
    }

    docs.push({
      ...meta,
      content,
    });
  }

  cachedDocs = docs;
  return docs;
}

/**
 * Mencari dokumen pengetahuan yang paling relevan dengan query pengguna
 */
export function searchKnowledge(query: string, limit = 3): { doc: KnowledgeDoc; score: number }[] {
  const docs = getAllKnowledgeDocs();
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 2);

  const scored = docs.map((doc) => {
    let score = 0;

    // 1. Cek kecocokan keyword metadata
    for (const kw of doc.keywords) {
      if (normalizedQuery.includes(kw)) {
        score += 8;
      }
      for (const token of queryTokens) {
        if (kw.includes(token)) {
          score += 4;
        }
      }
    }

    // 2. Cek kemunculan di judul
    if (doc.title.toLowerCase().includes(normalizedQuery)) {
      score += 15;
    }

    // 3. Cek kemunculan di isi dokumen
    const lowerContent = doc.content.toLowerCase();
    for (const token of queryTokens) {
      const occurrences = lowerContent.split(token).length - 1;
      score += Math.min(occurrences, 6);
    }

    return { doc, score };
  });

  // Urutkan berdasarkan skor tertinggi
  scored.sort((a, b) => b.score - a.score);

  // Jika skor tertinggi masih 0, kembalikan dokumen profil dan faq sebagai default context
  if (scored[0].score === 0) {
    return [
      { doc: docs[0], score: 1 },
      { doc: docs[docs.length - 1], score: 1 },
    ];
  }

  return scored.slice(0, limit);
}

/**
 * Membangun teks konteks terstruktur untuk prompt AI
 */
export function buildGroundedPrompt(query: string, matchedDocs: { doc: KnowledgeDoc; score: number }[]): string {
  const contextSections = matchedDocs
    .map(({ doc }) => {
      return `### DOKUMEN: [${doc.filename}] - ${doc.title} (Kategori: ${doc.category})\n${doc.content}\n---`;
    })
    .join('\n\n');

  return `KUMPULAN PENGETAHUAN RESMI SOLO TECHNOPARK:\n\n${contextSections}`;
}

/**
 * Generator respons fallback cerdas jika koneksi API sedang offline
 */
export function generateOfflineFallback(query: string, matchedDocs: { doc: KnowledgeDoc; score: number }[]): {
  message: string;
  sources: string[];
  quickActions: Array<{ label: string; href: string; type: string }>;
} {
  const topDoc = matchedDocs[0]?.doc || getAllKnowledgeDocs()[0];
  const queryLower = query.toLowerCase();

  let actionLabel = 'Lihat Selengkapnya';
  let actionHref = '/';
  let actionType = 'link';

  if (topDoc.id === 'fasilitas') {
    actionLabel = 'Jelajahi Fasilitas Ruangan';
    actionHref = '/fasilitas';
  } else if (topDoc.id === 'pelatihan') {
    actionLabel = 'Lihat Jadwal Pelatihan';
    actionHref = '/program-pelatihan';
  } else if (topDoc.id === 'inkubasi') {
    actionLabel = 'Daftar Kurasi Startup';
    actionHref = '/curation';
  } else if (topDoc.id === 'krenova') {
    actionLabel = 'Galeri Inovasi Krenova';
    actionHref = '/explore';
  }

  // Buat cuplikan cerdas dari dokumen
  const paragraphs = topDoc.content
    .split('\n\n')
    .filter((p) => p.trim().length > 30 && !p.startsWith('#'));

  const snippet = paragraphs.slice(0, 2).join('\n\n');

  const greeting = queryLower.includes('halo') || queryLower.includes('hai') || queryLower.includes('selamat')
    ? 'Halo! Senang bisa menyapa Anda di Solo Technopark.\n\n'
    : '';

  const message = `${greeting}Berdasarkan arsip resmi kami mengenai **${topDoc.title}**:\n\n${snippet}\n\n*Catatan: Sistem AI sedang dalam mode offline-knowledge terverifikasi. Untuk prosedur resmi, Anda dapat membuka halaman terkait.*`;

  return {
    message,
    sources: [topDoc.filename],
    quickActions: [
      { label: actionLabel, href: actionHref, type: actionType },
      { label: 'Pusat Bantuan & FAQ', href: '/faq', type: 'link' },
    ],
  };
}

/**
 * Generator respons fallback untuk Mode Bebas (General Chat) tanpa pembatasan .md
 */
export function generateFreeOfflineFallback(query: string): {
  message: string;
  sources: string[];
  quickActions: Array<{ label: string; href: string; type: string }>;
} {
  const q = query.trim();
  const qLower = q.toLowerCase();

  let responseText = '';
  if (qLower.includes('halo') || qLower.includes('hai') || qLower.includes('pagi') || qLower.includes('siang') || qLower.includes('malam')) {
    responseText = `Halo! Saya **Asisten AI Solo Technopark** dalam **Mode Percakapan Bebas** ✨.\n\nSaya siap berdiskusi, bertukar pikiran, membantu brainstorming ide inovasi, menulis teks kreatif, atau menjawab pertanyaan umum Anda tanpa batasan arsip kawasan. Apa topik menarik yang ingin kita bahas bersama?`;
  } else if (qLower.includes('ide') || qLower.includes('inovasi') || qLower.includes('startup')) {
    responseText = `Ide yang sangat menarik! Untuk mengembangkan konsep ini ke tingkat berikutnya, berikut beberapa pilar strategis yang bisa Anda pertimbangkan:\n\n1. **Validasi Masalah Pasar:** Pastikan problem yang ingin diselesaikan benar-benar dirasakan oleh target pengguna nyata (*hair-on-fire problem*).\n2. **Diferensiasi & Moat:** Tentukan keunikan produk Anda dibandingkan solusi yang sudah ada di pasar (misal: adopsi AI terapan, efisiensi rantai pasok, atau kemudahan UX).\n3. **Prototipe Cepat (MVP):** Bangun versi sederhana terlebih dahulu untuk mendapatkan umpan balik awal dalam kurun waktu 2-4 minggu.\n\nApakah ada aspek tertentu dari ide Anda yang ingin kita bedah lebih detail?`;
  } else {
    responseText = `Terima kasih atas pertanyaannya! Dalam **Mode Bebas**, saya menganalisis bahwa topik **"${q}"** memiliki ruang eksplorasi yang luas.\n\nSecara umum, pendekatan terbaik untuk mendalami hal ini adalah dengan mengidentifikasi tujuan utama Anda, memecahnya menjadi langkah-langkah terukur, serta memanfaatkan teknologi otomasi dan kecerdasan buatan untuk mempercepat eksekusi.\n\nBeri tahu saya jika Anda ingin saya membuatkan rencana kerja, draf artikel, atau analisis komparatif lebih lanjut!`;
  }

  return {
    message: responseText,
    sources: [],
    quickActions: [
      { label: 'Beralih ke Mode Arsip Kawasan', href: '#mode-knowledge', type: 'mode' },
      { label: 'Katalog Inovasi', href: '/explore', type: 'link' },
    ],
  };
}

