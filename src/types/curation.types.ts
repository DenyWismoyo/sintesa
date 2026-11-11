// Lokasi file: src/types/curation.types.ts
// Zod Schemas & TypeScript Types untuk Sintesa Universal AI Curation & Assessment Engine

import { z } from 'zod';

// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================
export const CurationDomainEnum = z.enum([
  'PRODUCT_CURATION',   // Kurasi Produk E-Katalog, UMKM & IKM
  'ALUMNI_ASSESSMENT',  // Asesmen Kompetensi, Kesiapan Kerja & Sertifikasi Alumni
  'TENANT_INCUBATION',  // Seleksi & Evaluasi Tenant Startup / Bisnis
  'CUSTOM_INNOVATION',  // Penjurian Krenova, Inovasi & B2B Custom
]);
export type CurationDomain = z.infer<typeof CurationDomainEnum>;

export const CURATION_DOMAIN_LABELS: Record<CurationDomain, string> = {
  PRODUCT_CURATION: 'Kurasi Produk E-Katalog',
  ALUMNI_ASSESSMENT: 'Asesmen Kompetensi Alumni',
  TENANT_INCUBATION: 'Inkubasi & Seleksi Tenant',
  CUSTOM_INNOVATION: 'Inovasi & Penjurian Krenova',
};

export const CURATION_DOMAIN_DESCRIPTIONS: Record<CurationDomain, string> = {
  PRODUCT_CURATION: 'Evaluasi kelayakan mutu, kemasan, legalitas, dan kesiapan pasar produk untuk promosi di Master E-Katalog.',
  ALUMNI_ASSESSMENT: 'Uji kompetensi teknis, studi kasus K3, dan kesiapan penempatan kerja alumni pelatihan vokasi & P3MI.',
  TENANT_INCUBATION: 'Skrining kelayakan teknologi (TKT), validasi model bisnis, dan traksi pasar untuk inkubasi Solo Technopark.',
  CUSTOM_INNOVATION: 'Instrumen fleksibel untuk penjurian inovasi daerah, riset kampus, atau audit kebutuhan pelatihan korporat.',
};

export const FieldTypeEnum = z.enum([
  'text',
  'textarea',
  'number',
  'radio',
  'checkbox',
  'file',
  'select',
  'date',
]);
export type FieldType = z.infer<typeof FieldTypeEnum>;

export const AssessmentStatusEnum = z.enum([
  'PENDING',
  'ANALYZING',
  'COMPLETED',
  'Curator_Draft',
  'Curator_Validated',
  'REJECTED',
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatusEnum>;

// ==========================================
// 2. FORM BUILDER & TEMPLATE SCHEMAS
// ==========================================
export const FormFieldOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  weight: z.number().optional().default(0),
  description: z.string().optional(),
});
export interface FormFieldOption {
  label: string;
  value: string | number;
  weight?: number;
  description?: string;
}

export const FormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: FieldTypeEnum,
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  options: z.array(FormFieldOptionSchema).optional(),
  fileAccept: z.string().optional(),
  gridSpan: z.union([z.literal(1), z.literal(2)]).optional().default(2),
  weightMultiplier: z.number().optional().default(1),
  isCritical: z.boolean().optional().default(false),
  showIf: z
    .object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains']).default('equals'),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
    .optional(),
  aiReasoning: z.string().optional(),
});
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: FormFieldOption[];
  fileAccept?: string;
  gridSpan?: 1 | 2;
  weightMultiplier?: number;
  isCritical?: boolean;
  showIf?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string | number | boolean;
  };
  aiReasoning?: string;
}

export const FormStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  targetMetrics: z.array(z.string()).optional(),
  fields: z.array(FormFieldSchema),
});
export interface FormStep {
  stepNumber: number;
  title: string;
  icon?: string;
  description?: string;
  targetMetrics?: string[];
  fields: FormField[];
}

export const CustomUiLabelsSchema = z.object({
  scoreLabel: z.string().optional().default('AI Readiness Score'),
  swotLabel: z.string().optional().default('Capability Matrix (SWOT)'),
  riskLabel: z.string().optional().default('Critical Risks & Mitigation Map'),
  roadmapLabel: z.string().optional().default('Rekomendasi Strategis'),
  executionLabel: z.string().optional().default('Action Plan Timeline'),
});
export type CustomUiLabels = z.infer<typeof CustomUiLabelsSchema>;

export const AiPromptConfigSchema = z.object({
  aiPersona: z.string().default('Lead Auditor & Evaluator Senior'),
  reportTone: z.enum(['consultative', 'investigative', 'academic']).optional().default('consultative'),
  gradingStrictness: z.enum(['supportive', 'standard', 'strict']).optional().default('standard'),
  assessmentGoal: z.string().default('Evaluasi kesiapan dan kelayakan'),
  mediaAnalysisFocus: z.enum(['pitch-delivery', 'ui-ux-design', 'product-demo', 'packaging-label', 'portfolio-doc']).optional(),
  riskFramework: z.string().optional(),
  targetAudience: z.enum(['individual', 'company', 'startup', 'umkm', 'government', 'community', 'student', 'general']).optional().default('umkm'),
  formPurpose: z.enum(['assessment', 'counseling', 'monitoring', 'consultation', 'custom']).optional().default('assessment'),
  expectedMetrics: z.array(z.string()).optional().default([]),
  expectedAnalysisBlocks: z.array(z.string()).optional().default([]),
  expectedRecommendations: z.array(z.string()).optional().default([]),
  customReadinessTiers: z.array(z.string()).optional().default([]),
  customSystemPrompt: z.string().optional(),
  negativePrompts: z.string().optional(),
  formatInstructions: z.string().optional(),
  customScoringRubric: z.string().optional(),
  customUiLabels: CustomUiLabelsSchema.optional(),
  isAdaptive: z.boolean().optional().default(false),
  maxAdaptiveSections: z.number().optional().default(5),
});
export interface AiPromptConfig {
  aiPersona: string;
  reportTone?: 'consultative' | 'investigative' | 'academic';
  gradingStrictness?: 'supportive' | 'standard' | 'strict';
  assessmentGoal: string;
  mediaAnalysisFocus?: 'pitch-delivery' | 'ui-ux-design' | 'product-demo' | 'packaging-label' | 'portfolio-doc';
  riskFramework?: string;
  targetAudience?: 'individual' | 'company' | 'startup' | 'umkm' | 'government' | 'community' | 'student' | 'general';
  formPurpose?: 'assessment' | 'counseling' | 'monitoring' | 'consultation' | 'custom';
  expectedMetrics?: string[];
  expectedAnalysisBlocks?: string[];
  expectedRecommendations?: string[];
  customReadinessTiers?: string[];
  customSystemPrompt?: string;
  negativePrompts?: string;
  formatInstructions?: string;
  customScoringRubric?: string;
  customUiLabels?: CustomUiLabels;
  isAdaptive?: boolean;
  maxAdaptiveSections?: number;
}

export const CurationTemplateSchema = z.object({
  id: z.string(),
  trackName: z.string(),
  trackDescription: z.string(),
  trackIcon: z.string().optional().default('ShieldCheck'),
  curationDomain: CurationDomainEnum.default('PRODUCT_CURATION'),
  category: z.string().optional().default('Umum'),
  isActive: z.boolean().optional().default(true),
  version: z.number().optional().default(1),
  lastUpdated: z.string(),
  steps: z.array(FormStepSchema),
  aiPromptConfig: AiPromptConfigSchema,
  formMode: z.enum(['standard', 'adaptive', 'hybrid']).optional().default('standard'),
  preferredQuestionTypes: z.array(z.string()).optional(),
  specificTargetContext: z.string().optional(),
  methodologyContext: z.string().optional(),
  order: z.number().optional().default(0),
});
export interface CurationTemplate {
  id: string;
  trackName: string;
  trackDescription: string;
  trackIcon?: string;
  curationDomain: CurationDomain;
  category?: string;
  isActive?: boolean;
  version?: number;
  lastUpdated: string;
  steps: FormStep[];
  aiPromptConfig: AiPromptConfig;
  formMode?: 'standard' | 'adaptive' | 'hybrid';
  preferredQuestionTypes?: string[];
  specificTargetContext?: string;
  methodologyContext?: string;
  order?: number;
}

// ==========================================
// 3. AI EVALUATION RESULT & METRICS
// ==========================================
export const CurationDynamicMetricSchema = z.object({
  label: z.string(),
  score: z.number(),
  description: z.string(),
});
export interface CurationDynamicMetric {
  label: string;
  score: number;
  description: string;
}

export const SwotAnalysisSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  threats: z.array(z.string()).default([]),
});
export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export const RiskAssessmentSchema = z.object({
  criticalRisks: z.array(z.string()).default([]),
  mitigationStrategies: z.array(z.string()).default([]),
});
export interface RiskAssessment {
  criticalRisks: string[];
  mitigationStrategies: string[];
}

export const RecommendationSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export interface RecommendationSection {
  title: string;
  content: string;
}

export const ActionItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  description: z.string(),
  timeframe: z.string().default('Minggu 1-2'),
  isCompleted: z.boolean().default(false),
  contextualTip: z.string().optional(),
  searchKeyword: z.string().optional(),
});
export interface ActionItem {
  id: string;
  task: string;
  description: string;
  timeframe: string;
  isCompleted: boolean;
  contextualTip?: string;
  searchKeyword?: string;
}

export const FileAnalysisInsightsSchema = z.object({
  documentQuality: z.string().default('Dokumen telah diperiksa.'),
  keyFindingsFromFiles: z.array(z.string()).default([]),
  discrepancies: z.string().optional().default(''),
});
export interface FileAnalysisInsights {
  documentQuality: string;
  keyFindingsFromFiles: string[];
  discrepancies?: string;
}

export const AIResultSchema = z.object({
  totalScore: z.number().default(0),
  readinessLevel: z.string().default('Pre-Incubation'),
  dataConfidenceScore: z.number().default(85),
  contradictionsFound: z.array(z.string()).optional().default([]),
  incubationRoute: z.string().default('Pendampingan Reguler'),
  executiveSummary: z.string().default(''),
  metrics: z.array(CurationDynamicMetricSchema).optional().default([]),
  swotAnalysis: SwotAnalysisSchema.default({ strengths: [], weaknesses: [], opportunities: [], threats: [] }),
  riskAssessment: RiskAssessmentSchema.default({ criticalRisks: [], mitigationStrategies: [] }),
  recommendations: z.array(RecommendationSectionSchema).default([]),
  nextActionSteps: z.array(z.object({ timeframe: z.string(), task: z.string() })).default([]),
  customActionPlan: z.array(ActionItemSchema).optional(),
  fileAnalysisInsights: FileAnalysisInsightsSchema.optional(),
  motivationalQuote: z.string().optional(),
  keyFocusArea: z.string().optional(),
});
export interface AIResult {
  totalScore: number;
  readinessLevel: string;
  dataConfidenceScore?: number;
  confidenceScore?: number;
  contradictionsFound?: string[];
  incubationRoute?: string;
  executiveSummary: string;
  metrics?: CurationDynamicMetric[];
  radarMetrics?: { axis: string; score: number; maxScore?: number }[];
  scoreBreakdown?: {
    productAndTech?: number;
    marketAndFinancial?: number;
    legalAndCompliance?: number;
  };
  swotMatrix?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  swotAnalysis?: SwotAnalysis;
  riskMap?: {
    marketRisk?: string;
    technicalRisk?: string;
    regulatoryRisk?: string;
    financialRisk?: string;
  };
  riskAssessment?: RiskAssessment;
  recommendations?: any;
  nextActionSteps?: { timeframe: string; task: string }[];
  customActionPlan?: ActionItem[];
  fileAnalysisInsights?: FileAnalysisInsights;
  motivationalQuote?: string;
  keyFocusArea?: string;
}

// ==========================================
// 4. CURATOR VALIDATION WORKBENCH
// ==========================================
export const CuratorAssessmentSchema = z.object({
  verifiedScore: z.number(),
  verifiedLevel: z.string(),
  finalRoute: z.string(),
  curatorNotes: z.string(),
  tags: z.array(z.string()).optional().default([]),
  customBlockNotes: z.record(z.string(), z.string()).optional(),
  documentNotes: z.string().optional(),
  metricsNotes: z.string().optional(),
  swotNotes: z.string().optional(),
  validatedAt: z.number().optional(),
  validatedBy: z.string().optional(),
  validatedByUserId: z.string().optional(),
});
export interface CuratorAssessment {
  verifiedScore: number;
  verifiedLevel: string;
  finalRoute: string;
  curatorNotes: string;
  tags?: string[];
  customBlockNotes?: Record<string, string>;
  documentNotes?: string;
  metricsNotes?: string;
  swotNotes?: string;
  validatedAt?: number;
  validatedBy?: string;
  validatedByUserId?: string;
}

// ==========================================
// 5. ASSESSMENT INSTANCE (ENTRY DATA)
// ==========================================
export const CurationAssessmentSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  trackType: z.string(),
  curationDomain: CurationDomainEnum.default('PRODUCT_CURATION'),
  subjekName: z.string(), // Nama Usaha / Nama Alumni / Nama Produk
  applicantName: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  formData: z.record(z.string(), z.any()),
  status: AssessmentStatusEnum.optional().default('PENDING'),
  score: z.number().optional().default(0),
  readinessLevel: z.string().optional().default('Pre-Incubation'),
  aiResult: AIResultSchema.optional(),
  originalAiResult: AIResultSchema.optional(),
  curatorAssessment: CuratorAssessmentSchema.optional(),
  linkedEntityId: z.string().optional(), // ID Tenant / ID Alumni / ID Produk
  linkedEntityType: z.enum(['product', 'alumni', 'tenant', 'krenova']).optional(),
  tokenUsed: z.string().optional(),
  storageFilePaths: z.array(z.string()).optional().default([]),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
export interface CurationAssessment {
  id: string;
  templateId: string;
  trackType: string;
  curationDomain: CurationDomain;
  subjekName: string;
  applicantName?: string;
  email?: string;
  whatsapp?: string;
  formData: Record<string, any>;
  status?: AssessmentStatus;
  score?: number;
  readinessLevel?: string;
  aiResult?: AIResult;
  originalAiResult?: AIResult;
  curatorAssessment?: CuratorAssessment;
  linkedEntityId?: string;
  linkedEntityType?: 'product' | 'alumni' | 'tenant' | 'krenova';
  tokenUsed?: string;
  storageFilePaths?: string[];
  createdAt: number;
  updatedAt?: number;
}

// ==========================================
// 6. ACCESS TOKEN BATCH FOR TRAINING / COHORTS
// ==========================================
export const CurationTokenSchema = z.object({
  id: z.string(),
  code: z.string(), // e.g. "STP-WELDER26", "IKM-KULINER"
  templateId: z.string(),
  trackName: z.string(),
  curationDomain: CurationDomainEnum,
  batchName: z.string(),
  maxUses: z.number().default(50),
  usedCount: z.number().default(0),
  expiresAt: z.number().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.number(),
});
export interface CurationToken {
  id: string;
  code: string;
  templateId: string;
  trackName: string;
  curationDomain: CurationDomain;
  batchName: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: number;
  isActive?: boolean;
  notes?: string;
  createdAt: number;
}
