// src/__tests__/visionary_partnership.test.ts
import { describe, it, expect } from 'vitest';
import {
  PartnershipTypeEnum,
  FinancingSchemeSchema,
  FinancingApplicationSchema,
  OpenProjectSchema,
  ProjectApplicationSchema,
} from '@/types/partnership.types';

describe('Visionary Partnership Ecosystem — Zod Schema & Domain Tests', () => {
  it('harus memvalidasi tipe kemitraan baru (FINANCING_TRAINING, OPEN_PROJECT, dsb)', () => {
    expect(PartnershipTypeEnum.safeParse('FINANCING_TRAINING').success).toBe(true);
    expect(PartnershipTypeEnum.safeParse('OPEN_PROJECT').success).toBe(true);
    expect(PartnershipTypeEnum.safeParse('CONTENT_CO_BRANDING').success).toBe(true);
    expect(PartnershipTypeEnum.safeParse('RESEARCH_APPLIED').success).toBe(true);
    expect(PartnershipTypeEnum.safeParse('INVALID_TYPE').success).toBe(false);
  });

  it('harus memvalidasi FinancingSchemeSchema dengan default values yang tepat', () => {
    const validScheme = {
      partnerId: 'bank-bpd-jateng',
      partnerName: 'Bank Jateng',
      schemeType: 'KUR_BANK' as const,
      title: 'KUR Vokasi Manufaktur',
      description: 'Pembiayaan berbunga lunak untuk peserta pelatihan mesin presisi',
      eligibilityCriteria: 'KTP Jawa Tengah, min 18 th',
    };

    const parsed = FinancingSchemeSchema.safeParse(validScheme);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.interestRate).toBe(0);
      expect(parsed.data.tenorMonths).toBe(6);
      expect(parsed.data.quotaTotal).toBe(50);
      expect(parsed.data.isActive).toBe(true);
    }
  });

  it('harus memvalidasi FinancingApplicationSchema dari calon peserta', () => {
    const validApp = {
      schemeId: 'scheme-bsi-cicilan-0',
      partnerId: 'bank-bsi',
      applicantName: 'Budi Santoso',
      applicantEmail: 'budi@example.com',
      applicantPhone: '081234567890',
      programTitle: 'Akademi AI & Machine Learning',
      trainingFee: 8500000,
    };

    const parsed = FinancingApplicationSchema.safeParse(validApp);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('SUBMITTED');
      expect(parsed.data.trainingFee).toBe(8500000);
    }
  });

  it('harus memvalidasi OpenProjectSchema untuk pelemparan proyek mitra ke alumni', () => {
    const validProject = {
      partnerId: 'pt-rekayasa-presisi',
      partnerName: 'PT Rekayasa Presisi Nusantara',
      title: 'Desain 3D Fixture Jig untuk Turbin PLTMH',
      category: 'INDUSTRIAL_DESIGN' as const,
      description: 'Dibutuhkan alumni diklat CNC Presisi / CAD-CAM STP untuk menyusun gambar kerja 3D',
      deliverables: ['File 3D CAD', 'Gambar kerja 2D detail'],
      requiredSkills: ['SolidWorks', 'GD&T'],
      budgetAmount: 14500000,
      durationEstimate: '3 Minggu',
    };

    const parsed = OpenProjectSchema.safeParse(validProject);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('PENDING_REVIEW');
      expect(parsed.data.workSetup).toBe('REMOTE');
      expect(parsed.data.budgetType).toBe('FIXED');
    }
  });

  it('harus memvalidasi ProjectApplicationSchema lamaran alumni', () => {
    const validApplication = {
      projectId: 'proj-123',
      partnerId: 'pt-rekayasa-presisi',
      alumniId: 'alumni-456',
      alumniName: 'Ahmad Fadillah',
      proposalLetter: 'Saya memiliki sertifikasi Solidworks CSWA dan telah menyelesaikan capstone project CAD/CAM di STP.',
      portfolioLinks: ['https://github.com/ahmad/fixture-cad'],
    };

    const parsed = ProjectApplicationSchema.safeParse(validApplication);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('PENDING');
      expect(parsed.data.portfolioLinks.length).toBe(1);
    }
  });
});

