import { z } from 'zod';

/**
 * ============================================================================
 * 1. AI CHAT & KNOWLEDGE EXPLORER SCHEMA (/api/ask-ai)
 * ============================================================================
 */
export const AskAIRequestSchema = z.object({
  query: z.string().min(1, 'Pertanyaan tidak boleh kosong'),
  mode: z.enum(['knowledge', 'free']).default('knowledge'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai', 'assistant', 'model']),
        text: z.string(),
      })
    )
    .optional()
    .default([]),
  availableVideos: z.array(z.any()).optional().default([]),
});

export type AskAIRequest = z.infer<typeof AskAIRequestSchema>;

export const AskAIResponseSchema = z.object({
  success: z.boolean(),
  mode: z.enum(['knowledge', 'free']).optional(),
  message: z.string(),
  sources: z.array(z.string()).optional(),
  quickActions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  recommendations: z.array(z.any()).optional(),
  error: z.string().optional(),
});

export type AskAIResponse = z.infer<typeof AskAIResponseSchema>;

/**
 * ============================================================================
 * 2. SMART COA REVENUE SUGGESTION SCHEMA (/api/ai/suggest-coa)
 * ============================================================================
 */
export const CoaSuggestionRequestSchema = z.object({
  invoiceId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  description: z.string().optional().default(''),
  items: z
    .array(
      z.object({
        description: z.string().optional(),
        name: z.string().optional(),
        category: z.string().optional(),
        amount: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  paidAmount: z.number().optional().default(0),
  availableAccounts: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      type: z.string().optional(),
      accountBehavior: z.string().optional(),
    })
  ),
});

export type CoaSuggestionRequest = z.infer<typeof CoaSuggestionRequestSchema>;

export const CoaSuggestionResponseSchema = z.object({
  success: z.boolean(),
  suggestedCoaId: z.string().nullable(),
  coaCode: z.string().optional(),
  coaName: z.string().optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  isFallback: z.boolean().optional(),
  error: z.string().optional(),
});

export type CoaSuggestionResponse = z.infer<typeof CoaSuggestionResponseSchema>;

/**
 * ============================================================================
 * 3. TENANT HEALTH SCORE AI SCHEMA (/api/ai/tenant-health)
 * ============================================================================
 */
export const TenantHealthRequestSchema = z.object({
  tenantId: z.string().optional(),
  tenantName: z.string().min(1, 'Nama tenant diperlukan'),
  segment: z.string().optional().default('StartUp'),
  pipelineStage: z.string().optional().default('Pra-Inkubasi'),
  fundingStage: z.string().optional().default('Bootstrapped'),
  teamSize: z.number().optional().default(1),
  legalEntity: z.string().optional().default('Belum Ada'),
  monthlyRevenue: z.array(z.object({ month: z.string(), amount: z.number() })).optional().default([]),
  kpiHistory: z
    .array(
      z.object({
        quarter: z.string().optional(),
        revenue: z.number().optional(),
        activeUsers: z.number().optional(),
        burnRate: z.number().optional(),
        runwayMonths: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  selfAssessment: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
  valueProposition: z.string().optional(),
  businessModel: z.string().optional(),
  products: z.array(z.any()).optional().default([]),
  monevs: z.array(z.any()).optional().default([]),
  mentoringSessions: z.array(z.any()).optional().default([]),
  curriculumProgress: z
    .object({
      completedCount: z.number().optional(),
      totalCount: z.number().optional(),
      completedTitles: z.array(z.string()).optional(),
      pendingTitles: z.array(z.string()).optional(),
    })
    .optional(),
});

export type TenantHealthRequest = z.infer<typeof TenantHealthRequestSchema>;

export const TenantHealthResponseSchema = z.object({
  success: z.boolean(),
  healthStatus: z.enum(['Healthy', 'Warning', 'Critical', 'Unknown']),
  healthScore: z.number().min(0).max(100),
  financialSustainability: z.number().min(0).max(100),
  marketTraction: z.number().min(0).max(100),
  teamExecution: z.number().min(0).max(100),
  keyStrengths: z.array(z.string()),
  riskFactors: z.array(z.string()),
  actionableRecommendations: z.array(z.string()),
  analyzedAt: z.number(),
  isFallback: z.boolean().optional(),
  error: z.string().optional(),

  // Extended Advanced Assessment Fields (from ai-curation-app architecture)
  summaryNarrative: z.string().optional(),
  radarMetrics: z
    .array(
      z.object({
        label: z.string(),
        score: z.number().min(0).max(100),
        description: z.string().optional(),
      })
    )
    .optional(),
  swot: z
    .object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      opportunities: z.array(z.string()),
      threats: z.array(z.string()),
    })
    .optional(),
  tacticalRoadmap: z
    .array(
      z.object({
        timeframe: z.string(),
        title: z.string(),
        task: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']).optional(),
        focusArea: z.string().optional(),
      })
    )
    .optional(),
});

export type TenantHealthResponse = z.infer<typeof TenantHealthResponseSchema>;


/**
 * ============================================================================
 * 4. AI CURATION & SCORING SCHEMA (/api/curation-ai)
 * ============================================================================
 */
export const CurationAIRequestSchema = z.object({
  trackType: z.enum(['Startup', 'UMKM', 'Jasa']).default('Startup'),
  formData: z.record(z.string(), z.any()),
});

export type CurationAIRequest = z.infer<typeof CurationAIRequestSchema>;

export const CurationAIResponseSchema = z.object({
  success: z.boolean(),
  insights: z
    .object({
      readinessLevel: z.string(),
      totalScore: z.number().min(0).max(100),
      scoreBreakdown: z.object({
        productAndTech: z.number().min(0).max(100),
        marketAndFinancial: z.number().min(0).max(100),
        legalAndCompliance: z.number().min(0).max(100),
      }),
      recommendations: z.object({
        targetMarket: z.string(),
        pricingAndMonetization: z.string(),
        distributionAndGrowth: z.string(),
        productImprovement: z.string(),
        investmentReadiness: z.string(),
        nextActionSteps: z.array(z.string()),
        incubationRoute: z.string(),
      }),
    })
    .optional(),
  error: z.string().optional(),
});

export type CurationAIResponse = z.infer<typeof CurationAIResponseSchema>;
