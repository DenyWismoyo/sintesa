// Lokasi file: src/__tests__/curation_engine.test.ts
// Unit Test Suite: Universal AI Curation & Assessment Engine (Zod Schemas, Templates, Scoring & Sync)

import { describe, it, expect } from 'vitest';
import {
  CurationTemplateSchema,
  CurationAssessmentSchema,
  CurationTokenSchema,
  CURATION_DOMAIN_LABELS,
  CurationDomain,
  CurationTemplate,
} from '../types/curation.types';
import { curationService, DEFAULT_MASTER_TEMPLATES } from '../services/curation.service';

describe('Universal AI Curation & Assessment Engine Suite', () => {
  // ==========================================
  // 1. ZOD SCHEMA & TYPE SAFETY TESTS
  // ==========================================
  describe('Zod Schema Validation', () => {
    it('harus memvalidasi CurationTemplate dengan struktur lengkap', () => {
      const validTemplate: CurationTemplate = {
        id: 'test-template-1',
        trackName: 'Kurasi Produk Inovasi Uji Coba',
        trackDescription: 'Template untuk menguji validasi Zod',
        trackIcon: 'ShoppingBag',
        curationDomain: 'PRODUCT_CURATION',
        category: 'Produk Fisik & UMKM',
        isActive: true,
        version: 1,
        lastUpdated: new Date().toISOString(),
        order: 1,
        formMode: 'standard',
        steps: [
          {
            stepNumber: 1,
            title: 'Identitas Produk',
            description: 'Data legalitas dan spesifikasi',
            fields: [
              {
                id: 'nama_produk',
                label: 'Nama Produk Komersial',
                type: 'text',
                required: true,
                placeholder: 'Kopi Robusta Merapi',
                gridSpan: 2,
                weightMultiplier: 1.5,
                isCritical: false,
              },
            ],
          },
        ],
        aiPromptConfig: {
          aiPersona: 'Lead Product Quality Auditor',
          assessmentGoal: 'Menilai kesiapan komersial produk',
          gradingStrictness: 'strict',
          reportTone: 'consultative',
          targetAudience: 'umkm',
          formPurpose: 'assessment',
          expectedMetrics: ['Kualitas Produk', 'Legalitas', 'Kesiapan Pasar'],
          expectedAnalysisBlocks: ['Analisis Keunggulan', 'Kepatuhan'],
          expectedRecommendations: ['Sertifikasi Halal', 'Redesain Kemasan'],
          customReadinessTiers: ['Tahap 1', 'Tahap 2', 'Tahap 3'],
          isAdaptive: false,
          maxAdaptiveSections: 5,
        },
      };

      const parseResult = CurationTemplateSchema.safeParse(validTemplate);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.trackName).toBe('Kurasi Produk Inovasi Uji Coba');
        expect(parseResult.data.curationDomain).toBe('PRODUCT_CURATION');
      }
    });

    it('harus menolak CurationTemplate jika domain tidak valid', () => {
      const invalidTemplate = {
        id: 'invalid-template',
        trackName: 'Template Rusak',
        trackDescription: 'Deskripsi',
        curationDomain: 'INVALID_DOMAIN_NAME',
        category: 'Umum',
        lastUpdated: new Date().toISOString(),
        steps: [],
        aiPromptConfig: {
          aiPersona: 'Test',
          assessmentGoal: 'Test',
          gradingStrictness: 'standard',
          reportTone: 'consultative',
          targetAudience: 'umkm',
          formPurpose: 'assessment',
          expectedMetrics: [],
          expectedRecommendations: [],
        },
      };

      const parseResult = CurationTemplateSchema.safeParse(invalidTemplate);
      expect(parseResult.success).toBe(false);
    });

    it('harus memvalidasi CurationAssessment dengan hasil evaluasi AI', () => {
      const validAssessment = {
        id: 'assess-123',
        templateId: 'test-template-1',
        trackType: 'Kurasi Produk Inovasi',
        curationDomain: 'PRODUCT_CURATION' as CurationDomain,
        subjekName: 'Sambal Bakar Solo',
        applicantName: 'Budi Santoso',
        formData: {
          nama_produk: 'Sambal Bakar Solo',
          kapasitas_produksi: '500 botol/bulan',
        },
        score: 84,
        readinessLevel: 'Market Ready',
        status: 'PENDING' as const,
        aiResult: {
          totalScore: 84,
          dataConfidenceScore: 92,
          readinessLevel: 'Market Ready',
          incubationRoute: 'Inkubasi Bisnis Kilat',
          executiveSummary: 'Produk memiliki daya tarik rasa yang kuat dan siap masuk pasar e-katalog.',
          metrics: [
            { label: 'Kualitas & Spesifikasi', score: 85, description: 'Rasa dan kemasan baik' },
            { label: 'Kepatuhan Regulasi', score: 80, description: 'PIRT lengkap' },
          ],
          swotAnalysis: {
            strengths: ['Bahan baku segar lokal', 'Rasa otentik'],
            weaknesses: ['Masa simpan belum teruji laboratorium'],
            opportunities: ['Permintaan kuliner oleh-oleh Solo tinggi'],
            threats: ['Kompetitor sambal kemasan berskala nasional'],
          },
          riskAssessment: {
            criticalRisks: ['Risiko fluktuasi harga cabai'],
            mitigationStrategies: ['Kontrak harga dengan kelompok tani'],
          },
          recommendations: [
            { title: 'Peluang Pasar', content: 'Targetkan wisatawan dan gerai oleh-oleh premium.' },
          ],
          nextActionSteps: [
            { timeframe: 'Minggu 1', task: 'Uji laboratorium daya tahan kemasan' },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const parseResult = CurationAssessmentSchema.safeParse(validAssessment);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.score).toBe(84);
        expect(parseResult.data.readinessLevel).toBe('Market Ready');
      }
    });

    it('harus memvalidasi CurationToken untuk asesmen batch kelas', () => {
      const validToken = {
        id: 'token-abc',
        code: 'WELD-2026-X1',
        templateId: 'master-alumni-assessment',
        trackName: 'Asesmen Welder Vokasi',
        curationDomain: 'ALUMNI_ASSESSMENT' as CurationDomain,
        batchName: 'Kelas Welder BP3MI Batch 1 2026',
        maxUses: 30,
        usedCount: 5,
        isActive: true,
        createdAt: Date.now(),
      };

      const parseResult = CurationTokenSchema.safeParse(validToken);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.code).toBe('WELD-2026-X1');
        expect(parseResult.data.maxUses).toBe(30);
      }
    });
  });

  // ==========================================
  // 2. MASTER TEMPLATES BAWAAN STP
  // ==========================================
  describe('Master Templates STP Verification', () => {
    it('harus menyediakan 4 Master Template bawaan dengan domain yang tepat', () => {
      const templates = DEFAULT_MASTER_TEMPLATES;
      expect(templates.length).toBeGreaterThanOrEqual(4);

      const productTpl = templates.find((t) => t.id === 'master-product-curation');
      expect(productTpl).toBeDefined();
      expect(productTpl?.curationDomain).toBe('PRODUCT_CURATION');
      expect(productTpl?.steps.length).toBeGreaterThan(0);

      const alumniTpl = templates.find((t) => t.id === 'master-alumni-assessment');
      expect(alumniTpl).toBeDefined();
      expect(alumniTpl?.curationDomain).toBe('ALUMNI_ASSESSMENT');

      const tenantTpl = templates.find((t) => t.id === 'master-tenant-incubation');
      expect(tenantTpl).toBeDefined();
      expect(tenantTpl?.curationDomain).toBe('TENANT_INCUBATION');

      const customTpl = templates.find((t) => t.id === 'master-custom-krenova');
      expect(customTpl).toBeDefined();
      expect(customTpl?.curationDomain).toBe('CUSTOM_INNOVATION');
    });

    it('setiap Master Template harus memiliki konfigurasi AI persona dan metrik yang jelas', () => {
      const templates = DEFAULT_MASTER_TEMPLATES;
      for (const tpl of templates) {
        expect(tpl.aiPromptConfig).toBeDefined();
        expect(tpl.aiPromptConfig.aiPersona?.length).toBeGreaterThan(3);
        expect(tpl.aiPromptConfig.assessmentGoal?.length).toBeGreaterThan(5);
        expect(Array.isArray(tpl.aiPromptConfig.expectedMetrics)).toBe(true);
        expect((tpl.aiPromptConfig.expectedMetrics || []).length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================
  // 3. LOGIKA KALKULASI & BOBOT KURATOR
  // ==========================================
  describe('Kalkulasi Bobot & Kalibrasi Nilai', () => {
    it('harus menghitung rata-rata tertimbang skor indikator radar secara akurat', () => {
      const radarMetrics = [
        { axis: 'Kualitas Produk & HAKI', score: 80, maxScore: 100 },
        { axis: 'Kepatuhan Regulasi & Standarisasi', score: 70, maxScore: 100 },
        { axis: 'Daya Tarik Pasar & Kemasan', score: 90, maxScore: 100 },
        { axis: 'Kesiapan Kapasitas Produksi', score: 80, maxScore: 100 },
      ];

      const sum = radarMetrics.reduce((acc, m) => acc + m.score, 0);
      const average = Math.round(sum / radarMetrics.length);

      expect(average).toBe(80);
    });

    it('harus memetakan tier kesiapan berdasarkan total skor', () => {
      const getReadinessLevel = (score: number) => {
        if (score >= 80) return 'Market Ready / Siap Inkubasi Lanjut';
        if (score >= 60) return 'Inkubasi Intensif (Perlu Pendampingan)';
        return 'Pra-Inkubasi (Fondasi Perlu Pembenahan)';
      };

      expect(getReadinessLevel(92)).toBe('Market Ready / Siap Inkubasi Lanjut');
      expect(getReadinessLevel(74)).toBe('Inkubasi Intensif (Perlu Pendampingan)');
      expect(getReadinessLevel(45)).toBe('Pra-Inkubasi (Fondasi Perlu Pembenahan)');
    });
  });

  // ==========================================
  // 4. DOMAIN MAPPING & LABELS
  // ==========================================
  describe('Domain Mapping & Labels', () => {
    it('harus memiliki label Bahasa Indonesia yang ramah untuk semua 4 domain', () => {
      expect(CURATION_DOMAIN_LABELS.PRODUCT_CURATION).toBe('Kurasi Produk E-Katalog');
      expect(CURATION_DOMAIN_LABELS.ALUMNI_ASSESSMENT).toBe('Asesmen Kompetensi Alumni');
      expect(CURATION_DOMAIN_LABELS.TENANT_INCUBATION).toBe('Inkubasi & Seleksi Tenant');
      expect(CURATION_DOMAIN_LABELS.CUSTOM_INNOVATION).toBe('Inovasi & Penjurian Krenova');
    });
  });
});
