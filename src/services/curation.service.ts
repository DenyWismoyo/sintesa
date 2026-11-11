// Lokasi file: src/services/curation.service.ts
// Service Layer untuk Sintesa Universal AI Curation & Assessment Engine

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  CurationTemplate,
  CurationAssessment,
  CurationToken,
  CurationDomain,
  CuratorAssessment,
} from '@/types/curation.types';
import { catalogService } from '@/services/catalog.service';
import { tenantService } from '@/services/tenant.service';
import { alumniService } from '@/services/alumni.service';

const getCollectionPath = (subCol: string) => {
  const appId = getAppId();
  return `artifacts/${appId}/public/data/${subCol}`;
};

// ==========================================
// 4 TEMPLATE MASTER BAWAAN RESMI SOLO TECHNOPARK
// ==========================================
export const DEFAULT_MASTER_TEMPLATES: CurationTemplate[] = [
  {
    id: 'master-product-curation',
    trackName: 'Kurasi Produk E-Katalog & UMKM',
    trackDescription: 'Evaluasi komprehensif kelayakan mutu, kemasan, legalitas, dan kesiapan pasar untuk promosi resmi di Master E-Katalog Solo Technopark.',
    trackIcon: 'ShoppingBag',
    curationDomain: 'PRODUCT_CURATION',
    category: 'Produk Fisik & UMKM',
    isActive: true,
    version: 1,
    lastUpdated: new Date().toISOString(),
    order: 1,
    formMode: 'standard',
    aiPromptConfig: {
      aiPersona: 'Kurator Produk Ritel & Auditor Mutu UMKM Solo Technopark',
      reportTone: 'consultative',
      gradingStrictness: 'standard',
      assessmentGoal: 'Menentukan kesiapan ritel produk, kualitas kemasan, pemenuhan izin edar, dan potensi promosi di E-Katalog.',
      mediaAnalysisFocus: 'packaging-label',
      targetAudience: 'umkm',
      formPurpose: 'assessment',
      expectedMetrics: [
        'Kualitas & Standar Mutu',
        'Desain Kemasan & Branding',
        'Kapasitas & Konsistensi Produksi',
        'Legalitas & Sertifikasi (PIRT/Halal/BPOM)',
        'Struktur Harga & Margin',
        'Daya Saing & Pasar',
        'Kualitas Visual Foto Produk',
      ],
      expectedAnalysisBlocks: [
        'Kesiapan Ritel Modern',
        'Kepatuhan Izin & Regulasi',
        'Strategi Penetrasi Pasar',
      ],
      expectedRecommendations: [
        'Optimalisasi Kemasan & Label',
        'Penyempurnaan Izin Edar',
        'Skalabilitas Kapasitas Suplai',
        'Strategi Promosi E-Katalog',
      ],
      customReadinessTiers: [
        'Pre-Incubation (0-39)',
        'Development Needed (40-59)',
        'Market Ready (60-74)',
        'Retail Ready (75-89)',
        'Premium Export Ready (90-100)',
      ],
      customScoringRubric: 'Utamakan kelengkapan izin legalitas dan konsistensi kemasan. Beri penalti jika produk makanan tidak berizin.',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Profil Usaha & Identitas Produk',
        description: 'Informasi dasar mengenai identitas produk dan entitas produsen.',
        fields: [
          { id: 'namaUsaha', label: 'Nama Usaha / Merek Brand', type: 'text', required: true, gridSpan: 2 },
          { id: 'namaProduk', label: 'Nama Spesifik Produk', type: 'text', required: true, gridSpan: 2 },
          { id: 'kategoriProduk', label: 'Kategori Produk', type: 'select', required: true, gridSpan: 1, options: [
            { label: 'Makanan & Minuman (F&B)', value: 'F&B', weight: 80 },
            { label: 'Fashion & Tekstil', value: 'Fashion', weight: 80 },
            { label: 'Kriya & Kerajinan', value: 'Kriya', weight: 80 },
            { label: 'Manufaktur & Perangkat', value: 'Manufaktur', weight: 90 },
            { label: 'Kosmetik & Herbal', value: 'Herbal', weight: 85 },
          ]},
          { id: 'hargaJual', label: 'Estimasi Harga Jual Konsumen (Rp)', type: 'number', required: true, gridSpan: 1 },
          { id: 'deskripsiProduk', label: 'Deskripsi Keunggulan & Bahan Baku Produk', type: 'textarea', required: true, gridSpan: 2 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Legalitas, Izin Edar & Kemasan',
        description: 'Verifikasi kepatuhan hukum dan tampilan kemasan produk.',
        fields: [
          { id: 'izinLegalitas', label: 'Kelengkapan Izin Edar yang Dimiliki', type: 'checkbox', required: true, gridSpan: 2, options: [
            { label: 'NIB (Nomor Induk Berusaha)', value: 'NIB', weight: 20 },
            { label: 'Sertifikat Halal Resmi', value: 'HALAL', weight: 30 },
            { label: 'PIRT / Izin Dinkes', value: 'PIRT', weight: 25 },
            { label: 'BPOM MD/ML', value: 'BPOM', weight: 40 },
            { label: 'Hak Cipta / Merek HKI', value: 'HKI', weight: 20 },
          ]},
          { id: 'kemasanBahan', label: 'Jenis Kemasan Utama', type: 'radio', required: true, gridSpan: 2, options: [
            { label: 'Plastik Polos / Klip Sederhana', value: 'Plastik Biasa', weight: 40 },
            { label: 'Standing Pouch Sablon / Stiker Rapi', value: 'Pouch Sablon', weight: 75 },
            { label: 'Kemasan Ritel Printing Penuh / Box Karton Eksklusif', value: 'Full Printing', weight: 95 },
            { label: 'Kemasan Botol / Kaleng Bersegel', value: 'Botol Segel', weight: 90 },
          ]},
          { id: 'kapasitasBulanan', label: 'Kapasitas Produksi Rata-rata per Bulan', type: 'text', required: true, gridSpan: 2, placeholder: 'Cth: 1.500 pcs per bulan' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Bukti Foto & Dokumen Pendukung',
        description: 'Unggah bukti visual untuk dianalisis oleh Clario Vision AI.',
        fields: [
          { id: 'fotoProduk', label: 'Foto Produk Utama (Latar Bersih / Kemasan Terlihat Jelas)', type: 'file', required: true, fileAccept: 'image/*', gridSpan: 2 },
          { id: 'dokumenLegalitas', label: 'Dokumen / Foto Sertifikat Izin Edar (Opsional)', type: 'file', required: false, fileAccept: 'image/*,.pdf', gridSpan: 2 },
        ],
      },
    ],
  },
  {
    id: 'master-alumni-assessment',
    trackName: 'Asesmen Kesiapan Kerja & Kompetensi Alumni',
    trackDescription: 'Evaluasi kemahiran teknis, pemahaman K3, studi kasus industri, dan kesiapan penempatan kerja alumni pelatihan vokasi & P3MI Solo Technopark.',
    trackIcon: 'GraduationCap',
    curationDomain: 'ALUMNI_ASSESSMENT',
    category: 'Vokasi & Ketenagakerjaan',
    isActive: true,
    version: 1,
    lastUpdated: new Date().toISOString(),
    order: 2,
    formMode: 'standard',
    aiPromptConfig: {
      aiPersona: 'Lead Assessor Vokasi & Rekruter Industri Solo Technopark',
      reportTone: 'academic',
      gradingStrictness: 'strict',
      assessmentGoal: 'Menguji kemahiran teknis, pemahaman regulasi K3, etos kerja, dan kecocokan profil alumni dengan lowongan kerja mitra industri.',
      targetAudience: 'student',
      formPurpose: 'assessment',
      expectedMetrics: [
        'Penguasaan Teknis Kejuruan',
        'Kepatuhan K3 & Standar Industri',
        'Problem Solving Kasus Nyata',
        'Komunikasi & Bahasa Kerja',
        'Kedisiplinan & Etos Kerja',
        'Kelengkapan Portofolio & Sertifikat',
      ],
      expectedAnalysisBlocks: [
        'Kesiapan Penempatan Industri',
        'Kekuatan Teknis vs Area Gap',
        'Rekomendasi Jalur Karir Unggulan',
      ],
      expectedRecommendations: [
        'Penguatan Sertifikasi BNSP Lanjutan',
        'Penyempurnaan Portofolio Bukti Kerja',
        'Simulasi Wawancara HRD Mitra Industri',
      ],
      customReadinessTiers: [
        'Perlu Pendampingan Dasar (0-49)',
        'Siap Magang Industri (50-69)',
        'Siap Kerja Nasional (70-84)',
        'Talenta Unggul / Siap Global P3MI (85-100)',
      ],
      customScoringRubric: 'Ukur kejelasan penalaran studi kasus dan kepatuhan prosedur keselamatan kerja (K3).',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Biodata & Riwayat Pelatihan',
        description: 'Informasi jalur kepesertaan dan kejuruan yang telah diselesaikan.',
        fields: [
          { id: 'namaUsaha', label: 'Nama Lengkap Peserta / Alumni', type: 'text', required: true, gridSpan: 2 },
          { id: 'nikKtp', label: 'Nomor Induk Kependudukan (16 Digit NIK)', type: 'text', required: true, gridSpan: 1 },
          { id: 'noHpWa', label: 'Nomor WhatsApp Aktif', type: 'text', required: true, gridSpan: 1 },
          { id: 'kejuruanPelatihan', label: 'Bidang Kejuruan / Program Pelatihan', type: 'select', required: true, gridSpan: 2, options: [
            { label: 'Welding / Pengelasan 3G-6G (SMK Go Global P3MI)', value: 'Welder' },
            { label: 'Otomasi Industri & PLC Mekatronika', value: 'Otomasi' },
            { label: 'Teknik Manufaktur & Pemrograman CNC', value: 'CNC' },
            { label: 'Software Engineering & Web Development', value: 'IT_Dev' },
            { label: 'Desain Komunikasi Visual & Multimedia', value: 'Multimedia' },
          ]},
        ],
      },
      {
        stepNumber: 2,
        title: 'Uji Pemahaman Teknis & Studi Kasus K3',
        description: 'Jawab skenario operasional industri berikut dengan jujur dan lugas.',
        fields: [
          { id: 'prosedurK3', label: 'Jelaskan tindakan darurat pertama jika terjadi kebocoran gas / korsleting listrik di bengkel kerja Anda:', type: 'textarea', required: true, gridSpan: 2 },
          { id: 'pengalamanAlat', label: 'Peralatan utama dan mesin industri apa saja yang sudah Anda kuasai secara mandiri?', type: 'textarea', required: true, gridSpan: 2 },
          { id: 'kesiapanPenempatan', label: 'Kesiapan Lokasi Penempatan Kerja:', type: 'radio', required: true, gridSpan: 2, options: [
            { label: 'Siap Ditempatkan di Seluruh Indonesia & Luar Negeri (P3MI)', value: 'Global', weight: 100 },
            { label: 'Siap Penempatan Regional Jawa Tengah / DIY', value: 'Regional', weight: 80 },
            { label: 'Hanya bersedia di wilayah Solo Raya', value: 'Lokal', weight: 60 },
          ]},
        ],
      },
      {
        stepNumber: 3,
        title: 'Bukti Portofolio & Sertifikat',
        description: 'Unggah bukti hasil kerja praktikum atau dokumen sertifikat kelulusan.',
        fields: [
          { id: 'fileSertifikat', label: 'Foto Sertifikat Pelatihan / Uji Kompetensi (PDF / Foto)', type: 'file', required: true, fileAccept: 'image/*,.pdf', gridSpan: 2 },
          { id: 'linkPortofolio', label: 'Tautan Portofolio / GitHub / LinkedIn (Opsional)', type: 'text', required: false, gridSpan: 2, placeholder: 'https://...' },
        ],
      },
    ],
  },
  {
    id: 'master-tenant-incubation',
    trackName: 'Seleksi & Evaluasi Tenant Startup / Bisnis',
    trackDescription: 'Skrining kesiapterapan teknologi (TRL), validasi model bisnis, dan traksi pasar untuk program inkubasi Solo Technopark.',
    trackIcon: 'Rocket',
    curationDomain: 'TENANT_INCUBATION',
    category: 'Startup & Akselerasi',
    isActive: true,
    version: 1,
    lastUpdated: new Date().toISOString(),
    order: 3,
    formMode: 'standard',
    aiPromptConfig: {
      aiPersona: 'Analis Investasi Venture Capital & Kurator Inkubasi Bisnis STP',
      reportTone: 'consultative',
      gradingStrictness: 'strict',
      assessmentGoal: 'Menilai kesiapan teknologi (TRL), unit economics, kelayakan founder, dan menentukan rute inkubasi.',
      targetAudience: 'startup',
      formPurpose: 'assessment',
      expectedMetrics: [
        'Kesiapan Teknologi (TRL / Moat)',
        'Validasi Masalah & Product-Market Fit',
        'Model Bisnis & Unit Economics',
        'Traksi Pengguna & Pendapatan',
        'Kapasitas & Komposisi Tim Founder',
        'Tata Kelola & Kekayaan Intelektual',
      ],
      expectedAnalysisBlocks: [
        'Analisis Moat & Keunggulan Kompetitif',
        'Valuasi & Kebutuhan Pendanaan',
        'Rute Program Inkubasi Rekomendasi',
      ],
      expectedRecommendations: [
        'Eksperimen Validasi Traksi Cepat',
        'Perapihan Legalitas HKI & PT',
        'Penyusunan Financial Model 3 Tahun',
      ],
      customReadinessTiers: [
        'Ideation / Bootstrap (0-49)',
        'Pra-Inkubasi (50-69)',
        'Inkubasi Reguler (70-84)',
        'Siap Akselerasi / Investasi (85-100)',
      ],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Profil Startup & Masalah Pasar',
        description: 'Jelaskan nilai inovasi dan solusi yang ditawarkan.',
        fields: [
          { id: 'namaUsaha', label: 'Nama Startup / Inisiatif Bisnis', type: 'text', required: true, gridSpan: 2 },
          { id: 'problemStatement', label: 'Masalah Utama yang Ingin Diselesaikan', type: 'textarea', required: true, gridSpan: 2 },
          { id: 'solusiTeknologi', label: 'Solusi Teknologi & Inovasi (Moat)', type: 'textarea', required: true, gridSpan: 2 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Traksi & Model Bisnis',
        description: 'Metrik pengguna dan skema pendapatan.',
        fields: [
          { id: 'skemaMonetisasi', label: 'Skema Pendapatan Utama', type: 'radio', required: true, gridSpan: 2, options: [
            { label: 'B2B SaaS / Kontrak Retainer', value: 'B2B SaaS', weight: 90 },
            { label: 'B2C Transaksional / Marketplace', value: 'B2C', weight: 75 },
            { label: 'Jasa Agensi / Kustomisasi Proyek', value: 'Agensi', weight: 70 },
            { label: 'Belum Monetisasi (Tahap Riset)', value: 'Riset', weight: 45 },
          ]},
          { id: 'omsetBulanan', label: 'Rata-rata Pendapatan Bulanan (MRR)', type: 'text', required: true, gridSpan: 1, placeholder: 'Cth: Rp 25.000.000 / bulan' },
          { id: 'jumlahPengguna', label: 'Total Pengguna Aktif / Klien', type: 'text', required: true, gridSpan: 1, placeholder: 'Cth: 12 Klien B2B' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Dokumen Pitch Deck / Rencana Bisnis',
        description: 'Unggah presentasi ringkas untuk penelaahan komite kurator.',
        fields: [
          { id: 'pitchDeckFile', label: 'Pitch Deck Presentasi (PDF)', type: 'file', required: true, fileAccept: '.pdf', gridSpan: 2 },
        ],
      },
    ],
  },
  {
    id: 'master-custom-krenova',
    trackName: 'Penjurian Inovasi Daerah & Krenova',
    trackDescription: 'Instrumen penilaian inovasi teknologi, kebermanfaatan sosial, dan komersialisasi karya masyarakat / akademisi.',
    trackIcon: 'Award',
    curationDomain: 'CUSTOM_INNOVATION',
    category: 'Inovasi & Riset',
    isActive: true,
    version: 1,
    lastUpdated: new Date().toISOString(),
    order: 4,
    formMode: 'standard',
    aiPromptConfig: {
      aiPersona: 'Dewan Juri Riset & Inovasi Daerah Solo Technopark',
      reportTone: 'academic',
      gradingStrictness: 'standard',
      assessmentGoal: 'Menilai kebaruan inovasi, dampak ekonomi bagi masyarakat, dan kelayakan implementasi.',
      targetAudience: 'community',
      formPurpose: 'assessment',
      expectedMetrics: [
        'Kebaruan & Orisinalitas',
        'Kemanfaatan bagi Masyarakat',
        'Kelayakan Implementasi & Biaya',
        'Keberlanjutan Inovasi',
        'Kesiapan Hak Paten / HKI',
      ],
      expectedAnalysisBlocks: [
        'Nilai Manfaat Sosial-Ekonomi',
        'Dampak terhadap Kawasan Solo Raya',
      ],
      expectedRecommendations: [
        'Pendaftaran HKI Paten Sederhana',
        'Uji Coba Lapangan (Pilot Project)',
      ],
      customReadinessTiers: [
        'Gagasan Awal (0-49)',
        'Prototipe Teruji (50-74)',
        'Inovasi Siap Implementasi (75-89)',
        'Inovasi Unggulan Daerah (90-100)',
      ],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Identitas Inovasi',
        description: 'Rincian judul dan latar belakang penemuan/inovasi.',
        fields: [
          { id: 'namaUsaha', label: 'Judul Karya Inovasi', type: 'text', required: true, gridSpan: 2 },
          { id: 'namaInovator', label: 'Nama Inovator / Tim Peneliti', type: 'text', required: true, gridSpan: 2 },
          { id: 'latarBelakang', label: 'Uraian Masalah Nyata yang Mendasari Inovasi', type: 'textarea', required: true, gridSpan: 2 },
          { id: 'spesifikasiTeknis', label: 'Spesifikasi Teknis & Cara Kerja Solusi', type: 'textarea', required: true, gridSpan: 2 },
        ],
      },
    ],
  },
];

// ==========================================
// CURATION SERVICE API
// ==========================================
export const curationService = {
  // 1. TEMPLATE MANAGEMENT
  getTemplates: async (domain?: CurationDomain): Promise<CurationTemplate[]> => {
    try {
      const colPath = getCollectionPath('curation_templates');
      let q = query(collection(db, colPath), where('isActive', '==', true));
      if (domain) {
        q = query(collection(db, colPath), where('isActive', '==', true), where('curationDomain', '==', domain));
      }
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CurationTemplate));
      
      // Jika database masih kosong, kembalikan default master templates dan jalankan auto-seed di latar
      if (list.length === 0) {
        curationService.seedDefaultTemplatesIfEmpty().catch(() => {});
        return domain ? DEFAULT_MASTER_TEMPLATES.filter((t) => t.curationDomain === domain) : DEFAULT_MASTER_TEMPLATES;
      }
      
      return list.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (err) {
      console.warn('[CurationService] Fallback ke DEFAULT_MASTER_TEMPLATES:', err);
      return domain ? DEFAULT_MASTER_TEMPLATES.filter((t) => t.curationDomain === domain) : DEFAULT_MASTER_TEMPLATES;
    }
  },

  getTemplateById: async (id: string): Promise<CurationTemplate | null> => {
    try {
      const colPath = getCollectionPath('curation_templates');
      const docSnap = await getDoc(doc(db, colPath, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CurationTemplate;
      }
      // Cek fallback default
      const foundDefault = DEFAULT_MASTER_TEMPLATES.find((t) => t.id === id);
      return foundDefault || null;
    } catch (err) {
      console.error('[CurationService] Gagal memuat template:', err);
      return DEFAULT_MASTER_TEMPLATES.find((t) => t.id === id) || null;
    }
  },

  saveTemplate: async (template: CurationTemplate): Promise<void> => {
    const colPath = getCollectionPath('curation_templates');
    const docRef = doc(db, colPath, template.id);
    await setDoc(docRef, {
      ...template,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const colPath = getCollectionPath('curation_templates');
    await deleteDoc(doc(db, colPath, id));
  },

  seedDefaultTemplatesIfEmpty: async (): Promise<void> => {
    const colPath = getCollectionPath('curation_templates');
    for (const tpl of DEFAULT_MASTER_TEMPLATES) {
      const docRef = doc(db, colPath, tpl.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, tpl);
      }
    }
  },

  // 2. ASSESSMENT INSTANCES (ENTRIES)
  getAssessments: async (domain?: CurationDomain, status?: string): Promise<CurationAssessment[]> => {
    try {
      const colPath = getCollectionPath('curation_assessments');
      let q = query(collection(db, colPath), orderBy('createdAt', 'desc'), limit(100));
      if (domain) {
        q = query(collection(db, colPath), where('curationDomain', '==', domain), orderBy('createdAt', 'desc'), limit(100));
      }
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CurationAssessment));
      if (status && status !== 'ALL') {
        list = list.filter((a) => a.status === status);
      }
      return list;
    } catch (err) {
      console.error('[CurationService] Error getAssessments:', err);
      return [];
    }
  },

  getAssessmentById: async (id: string): Promise<CurationAssessment | null> => {
    try {
      const colPath = getCollectionPath('curation_assessments');
      const snap = await getDoc(doc(db, colPath, id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as CurationAssessment;
      }
      return null;
    } catch (err) {
      console.error('[CurationService] Error getAssessmentById:', err);
      return null;
    }
  },

  saveAssessment: async (assessment: CurationAssessment): Promise<void> => {
    const colPath = getCollectionPath('curation_assessments');
    const docRef = doc(db, colPath, assessment.id);
    await setDoc(docRef, {
      ...assessment,
      updatedAt: Date.now(),
    }, { merge: true });
  },

  updateCuratorValidation: async (
    assessmentId: string,
    curatorData: CuratorAssessment,
    isFinal: boolean
  ): Promise<void> => {
    const colPath = getCollectionPath('curation_assessments');
    const docRef = doc(db, colPath, assessmentId);
    await updateDoc(docRef, {
      status: isFinal ? 'Curator_Validated' : 'Curator_Draft',
      score: curatorData.verifiedScore,
      readinessLevel: curatorData.verifiedLevel,
      curatorAssessment: curatorData,
      updatedAt: Date.now(),
    });
  },

  // 3. 1-CLICK SYNC KE MODUL LAIN DI EKOSISTEM SINTESA
  syncToCatalogProduct: async (assessment: CurationAssessment, catalogPrice: number): Promise<{ success: boolean; message: string }> => {
    if (!assessment.linkedEntityId) {
      throw new Error('ID Tenant tidak terhubung ke asesmen ini.');
    }
    const tenant = await tenantService.getTenantById(assessment.linkedEntityId);
    if (!tenant) throw new Error('Tenant tidak ditemukan dalam database.');

    const verifiedScore = assessment.curatorAssessment?.verifiedScore || assessment.score || 0;
    const verifiedLevel = assessment.curatorAssessment?.verifiedLevel || assessment.readinessLevel || 'Market Ready';

    const productPayload: any = {
      id: `curated-${assessment.id}`,
      name: assessment.formData.namaProduk || assessment.subjekName,
      description: assessment.formData.deskripsiProduk || 'Produk terkurasi Solo Technopark',
      category: assessment.formData.kategoriProduk || tenant.sector || 'Umum',
      images: assessment.storageFilePaths?.filter(p => /\.(png|jpe?g|webp)$/i.test(p)) || [],
      isCurated: true,
      curation: {
        productQuality: verifiedScore,
        brandingPackaging: verifiedScore,
        productPhoto: verifiedScore,
        legality: verifiedScore,
        productionConsistency: verifiedScore,
        marketPotential: verifiedScore,
        innovation: verifiedScore,
        totalScore: verifiedScore,
        readinessLevel: verifiedLevel,
        curatedAt: Date.now(),
        curatedBy: assessment.curatorAssessment?.validatedBy || 'Admin Kurator STP',
      },
      aiInsights: {
        targetMarket: assessment.aiResult?.recommendations?.[0]?.content || 'Pasar Ritel & E-Katalog Nasional',
        idealPrice: `Rp ${Number(catalogPrice).toLocaleString('id-ID')}`,
        distributionChannel: 'Solo Technopark E-Katalog & Business Matching',
        packagingImprovement: assessment.curatorAssessment?.curatorNotes || 'Siap tayang ke publik.',
      },
    };

    const res = await catalogService.promoteTenantProductToCatalog(tenant, productPayload, catalogPrice);
    return {
      success: true,
      message: res.updated ? 'Produk berhasil diperbarui di Master E-Katalog!' : 'Produk resmi ditayangkan ke Master E-Katalog Publik!',
    };
  },

  syncToAlumniProfile: async (assessment: CurationAssessment): Promise<{ success: boolean; message: string }> => {
    if (!assessment.linkedEntityId) {
      throw new Error('ID Alumni tidak terikat.');
    }
    const alumni = await alumniService.getAlumniById(assessment.linkedEntityId);
    if (!alumni) throw new Error('Data Alumni tidak ditemukan.');
    if (!alumni.id) throw new Error('ID Alumni tidak valid.');

    const score = assessment.curatorAssessment?.verifiedScore || assessment.score || 0;
    const level = assessment.curatorAssessment?.verifiedLevel || assessment.readinessLevel || 'Siap Kerja';

    await alumniService.updateAlumni(alumni.id, {
      isVerified: true,
      certificationResult: `Lulus Asesmen AI (${score}/100 - ${level})`,
      skills: Array.from(new Set([...(alumni.skills || []), ...(assessment.curatorAssessment?.tags || ['Vokasi Teruji'])])),
    });

    return {
      success: true,
      message: `Profil alumni ${alumni.name} berhasil diperbarui dengan skor kompetensi ${score}/100!`,
    };
  },

  syncToTenantIncubation: async (assessment: CurationAssessment): Promise<{ success: boolean; message: string }> => {
    if (!assessment.linkedEntityId) {
      throw new Error('ID Tenant tidak terikat.');
    }
    const tenant = await tenantService.getTenantById(assessment.linkedEntityId);
    if (!tenant) throw new Error('Data Tenant tidak ditemukan.');
    if (!tenant.id) throw new Error('ID Tenant tidak valid.');

    const level = assessment.curatorAssessment?.verifiedLevel || assessment.readinessLevel || 'Pra-Inkubasi';
    const score = assessment.curatorAssessment?.verifiedScore || assessment.score || 0;

    await tenantService.updateTenant(tenant.id, {
      smeReadinessLevel: level as any,
      aiCurationData: {
        totalScore: score,
        readinessLevel: level,
        curatedAt: Date.now(),
        recommendations: {
          incubationRoute: assessment.curatorAssessment?.finalRoute || assessment.aiResult?.incubationRoute || 'Inkubasi Reguler',
          nextActionSteps: assessment.aiResult?.nextActionSteps?.map(s => s.task) || [],
        },
      },
    });

    return {
      success: true,
      message: `Status inkubasi tenant ${tenant.name} berhasil disinkronkan ke level ${level}!`,
    };
  },

  redeemToken: async (tokenCode: string, _participantName?: string): Promise<void> => {
    const token = await curationService.validateToken(tokenCode);
    if (token) {
      await curationService.incrementTokenUse(token.id);
    }
  },

  // 4. BATCH TOKEN MANAGEMENT
  getTokens: async (): Promise<CurationToken[]> => {
    try {
      const colPath = getCollectionPath('curation_tokens');
      const snap = await getDocs(query(collection(db, colPath), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CurationToken));
    } catch {
      return [];
    }
  },

  createToken: async (tokenData: Omit<CurationToken, 'id' | 'usedCount' | 'createdAt'>): Promise<CurationToken> => {
    const colPath = getCollectionPath('curation_tokens');
    const id = doc(collection(db, colPath)).id;
    const newToken: CurationToken = {
      ...tokenData,
      id,
      code: tokenData.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, colPath, id), newToken);
    return newToken;
  },

  validateToken: async (code: string): Promise<CurationToken | null> => {
    const cleanCode = code.trim().toUpperCase();
    const colPath = getCollectionPath('curation_tokens');
    const q = query(
      collection(db, colPath),
      where('code', '==', cleanCode),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const token = { id: snap.docs[0].id, ...snap.docs[0].data() } as CurationToken;

    if (token.maxUses && token.usedCount >= token.maxUses) return null;
    if (token.expiresAt && Date.now() > token.expiresAt) return null;

    return token;
  },

  incrementTokenUse: async (tokenId: string): Promise<void> => {
    const colPath = getCollectionPath('curation_tokens');
    const docRef = doc(db, colPath, tokenId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data().usedCount || 0;
      await updateDoc(docRef, { usedCount: current + 1 });
    }
  },
};

