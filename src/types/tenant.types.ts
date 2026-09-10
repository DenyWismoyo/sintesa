import { z } from 'zod';

export const CapTableEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['Founder', 'Investor', 'Employee/ESOP', 'Advisor', 'Lainnya']),
  ownershipPercentage: z.number(),
});
export type CapTableEntry = z.infer<typeof CapTableEntrySchema>;

export const FundingRoundSchema = z.object({
  id: z.string(),
  roundName: z.enum(['Bootstrapped', 'Pre-Seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B+', 'Bridge/Convertible']),
  date: z.string(),
  amount: z.number(),
  valuation: z.number().optional(),
  investors: z.string().optional(), 
});
export type FundingRound = z.infer<typeof FundingRoundSchema>;

export const VDRSchema = z.object({
  aktaPendirianUrl: z.string().optional(),
  skKemenkumhamUrl: z.string().optional(),
  hkiSertifikatUrl: z.string().optional(),
  financialModelUrl: z.string().optional(),
});
export type VDR = z.infer<typeof VDRSchema>;

export const TenantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  sector: z.string(),
  ownerName: z.string(),
  contact: z.string(),
  email: z.string().email().optional().or(z.literal('')), 
  accessCode: z.string().optional(),
  
  status: z.enum(['Aktif', 'Alumni', 'Non-aktif', 'Menunggu Review']),
  
  joinedAt: z.string(),
  createdAt: z.number(),
  logoUrl: z.string().optional(),
  legalEntity: z.enum(['PT', 'CV', 'Perorangan', 'Yayasan', 'Belum Ada']).default('Belum Ada').optional(),
  nib: z.string().optional(),
  npwp: z.string().optional(),
  programName: z.string().optional(),
  legalDocUrl: z.string().optional(),
  pitchDeckUrl: z.string().optional(),
  elevatorPitch: z.string().optional(),
  problemStatement: z.string().optional(),
  solutionStatement: z.string().optional(),
  companyDescription: z.string().optional(),
  coverImageUrl: z.string().optional(),
  brandColor: z.string().optional(), 
  website: z.string().optional(),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  teamSize: z.number().optional(),
  
  fundingStage: z.enum(['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B+']).default('Bootstrapped').optional(),
  isRaising: z.boolean().default(false),
  currentNeeds: z.array(z.string()).optional(),
  
  capTable: z.array(CapTableEntrySchema).optional().default([]),
  fundingRounds: z.array(FundingRoundSchema).optional().default([]),
  vdr: VDRSchema.optional(),

  primaryCta: z.object({ text: z.string().default('Kunjungi Website'), url: z.string() }).optional(),
  keyMetrics: z.array(z.object({ label: z.string(), value: z.string() })).optional().default([]),
  promoVideoUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).optional().default([]),
  clientLogos: z.array(z.string()).optional().default([]),
  testimonials: z.array(z.object({ name: z.string(), role: z.string(), quote: z.string() })).optional().default([]),
  customSections: z.array(z.object({ id: z.string(), title: z.string(), content: z.string(), mediaUrl: z.string().optional(), mediaPosition: z.enum(['left', 'right', 'top']).default('top') })).optional().default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional().default([]),
  techStack: z.array(z.string()).optional().default([]),
  pressCoverage: z.array(z.object({ mediaName: z.string(), title: z.string(), url: z.string() })).optional().default([]),
  jobOpenings: z.array(z.object({ id: z.string(), title: z.string(), type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']), location: z.string().optional(), url: z.string() })).optional().default([]),
  publicAssets: z.object({ companyProfileUrl: z.string().optional(), mediaKitUrl: z.string().optional() }).optional(),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional() }).optional(),
  
  segment: z.enum(['StartUp', 'UMKM', 'Koperasi', 'Kampus', 'Industri', 'Umum']).default('StartUp').optional(),
  mentor: z.string().optional(),
  source: z.string().optional(),
  pipelineStage: z.enum(['Pra-Inkubasi', 'Validasi Ide', 'Pengembangan Produk', 'Go-To-Market', 'Alumni']).default('Pra-Inkubasi').optional(),
  currentHealthScore: z.enum(['Healthy', 'Warning', 'Critical', 'Unknown']).default('Unknown').optional(),
  curriculumChecklist: z.array(z.object({
    id: z.string(), title: z.string(), isCompleted: z.boolean().default(false), completedAt: z.number().optional()
  })).optional().default([]),

  exitStatus: z.enum(['Belum Lulus', 'Berkembang Mandiri', 'Diakuisisi', 'IPO', 'Gagal/Tutup']).default('Belum Lulus').optional(),
  exitValuation: z.number().optional(),
  isVerified: z.boolean().default(false).optional(), 

  selfAssessment: z.object({
    namaUsaha: z.string().optional(),
    namaPemilik: z.string().optional(),
    tahunBerdiri: z.string().optional(),
    alamat: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    instagram: z.string().optional(),
    jenisUsaha: z.string().optional(),
    deskripsi: z.string().optional(),
    keunggulan: z.array(z.string()).optional(),
    jumlahProduk: z.string().optional(),
    kapasitas: z.string().optional(),
    tenagaKerja: z.string().optional(),
    sistemProduksi: z.string().optional(),
    konsistensi: z.string().optional(),
    legalitas: z.array(z.string()).optional(),
    statusMerek: z.string().optional(),
    omset: z.string().optional(),
    wilayah: z.string().optional(),
    channels: z.array(z.string()).optional(),
    retail: z.string().optional(),
    adaLogo: z.string().optional(),
    kualitasKemasan: z.string().optional(),
    kualitasFoto: z.string().optional(),
    adaKatalog: z.string().optional(),
    kendala: z.array(z.string()).optional(),
    targetPasar: z.array(z.string()).optional(),
    siapInkubasi: z.string().optional(),
    pernahEkspor: z.string().optional(),
    negaraTujuan: z.string().optional(),
    dokumenEkspor: z.string().optional(),
    sistemDigital: z.array(z.string()).optional(),
    tertarikAI: z.string().optional(),
    modelBisnis: z.string().optional(),
    kategoriSpesifik: z.string().optional(),
    idleCapacity: z.string().optional(),
    sumberBahanBaku: z.string().optional(),
    stabilitasPasokan: z.string().optional(),
    defectRate: z.string().optional(),
    qualityControl: z.string().optional(),
    pajakUsaha: z.string().optional(),
    esgKemasan: z.string().optional(),
    esgLimbah: z.string().optional(),
    esgPemberdayaan: z.string().optional(),
    averageOrderValue: z.string().optional(),
    customerRetention: z.string().optional(),
    terminPembayaran: z.string().optional(),
    laporanKeuangan: z.string().optional(),
    dokumenEksporKhusus: z.array(z.string()).optional(),
    adopsiTeknologi: z.string().optional(),
    budgetMarketing: z.string().optional(),
    unfairAdvantage: z.array(z.string()).optional(),
    kompetitor: z.string().optional(),
    marketSizing: z.string().optional(),
    infrastrukturServer: z.string().optional(),
    privasiData: z.string().optional(),
    devTeknologi: z.string().optional(),
    grossMargin: z.string().optional(),
    ltvCacRatio: z.string().optional(),
    burnRate: z.string().optional(),
    churnRate: z.string().optional(),
    b2bSalesCycle: z.string().optional(),
    capTableFounder: z.string().optional(),
    pengalamanFounder: z.string().optional(),
    ketersediaanEsop: z.string().optional(),
    bentukPendanaan: z.string().optional(),
    valuasiTerakhir: z.string().optional()
  }).optional(),

  aiCurationData: z.object({
    totalScore: z.number().optional(),
    readinessLevel: z.string().optional(),
    breakdown: z.object({
      kualitas: z.number().optional(),
      branding: z.number().optional(),
      legalitas: z.number().optional(),
      pasar: z.number().optional()
    }).optional(),
    scoreBreakdown: z.object({
      productAndTech: z.number().optional(),
      marketAndFinancial: z.number().optional(),
      legalAndCompliance: z.number().optional()
    }).optional(),
    recommendations: z.object({
      packagingImprovement: z.string().optional(),
      idealPrice: z.string().optional(),
      targetMarket: z.string().optional(),
      distributionChannel: z.string().optional(),
      brandingStrategy: z.string().optional(),
      pricingAndMonetization: z.string().optional(),
      distributionAndGrowth: z.string().optional(),
      productImprovement: z.string().optional(),
      investmentReadiness: z.string().optional(),
      nextActionSteps: z.array(z.string()).optional(),
      incubationRoute: z.string().optional()
    }).optional(),
    curatedAt: z.number().optional()
  }).optional(),

  aiHealthData: z.object({
    healthStatus: z.enum(['Healthy', 'Warning', 'Critical', 'Unknown']).optional(),
    healthScore: z.number().optional(),
    financialSustainability: z.number().optional(),
    marketTraction: z.number().optional(),
    teamExecution: z.number().optional(),
    keyStrengths: z.array(z.string()).optional(),
    riskFactors: z.array(z.string()).optional(),
    actionableRecommendations: z.array(z.string()).optional(),
    analyzedAt: z.number().optional(),
    summaryNarrative: z.string().optional(),
    radarMetrics: z.array(z.object({
      label: z.string(),
      score: z.number(),
      description: z.string().optional(),
    })).optional(),
    swot: z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      opportunities: z.array(z.string()),
      threats: z.array(z.string()),
    }).optional(),
    tacticalRoadmap: z.array(z.object({
      timeframe: z.string(),
      title: z.string(),
      task: z.string(),
      priority: z.enum(['High', 'Medium', 'Low']).optional(),
      focusArea: z.string().optional(),
    })).optional(),
  }).passthrough().optional(),

  smeReadinessLevel: z.enum([
    'Pre-Incubation',    
    'Development Needed',
    'Market Ready',      
    'Retail Ready',      
    'Premium Export Ready'
  ]).optional(),
  exportReadinessIndex: z.number().min(0).max(100).optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const TenantRevenueSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  amount: z.number(),
  type: z.enum(['Profit Sharing', 'Success Fee', 'Sponsorship', 'CSR', 'Lainnya']),
  description: z.string().optional(),
  createdAt: z.number().optional()
});
export type TenantRevenue = z.infer<typeof TenantRevenueSchema>;

export const TenantMonevSchema = z.object({ id: z.string().optional(), date: z.string(), title: z.string(), description: z.string(), evaluator: z.string().optional(), createdAt: z.number().optional() });
export type TenantMonev = z.infer<typeof TenantMonevSchema>;

export const DynamicMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Traction', 'Financial', 'Product', 'Engagement', 'Custom']),
  unit: z.enum(['Rp', 'USD', 'Users', 'Persen', 'Item', 'Lainnya', '%']),
  targetValue: z.number(),
  actualValue: z.number(),
});
export type DynamicMetric = z.infer<typeof DynamicMetricSchema>;

export const TenantKPISchema = z.object({ 
  id: z.string().optional(), 
  period: z.string(), 
  burnRate: z.number().default(0),
  runwayMonths: z.number().default(0),
  fundingAcquired: z.number().default(0),
  metrics: z.array(DynamicMetricSchema).default([]),
  topAchievements: z.string().optional(),
  currentBottlenecks: z.string().optional(),
  healthStatus: z.enum(['Healthy', 'Warning', 'Critical']), 
  notes: z.string().optional(), 
  createdAt: z.number().optional(),
  revenue: z.number().optional(), 
  activeUsers: z.number().optional(), 
  teamSize: z.number().optional(), 
});
export type TenantKPI = z.infer<typeof TenantKPISchema>;

export const MentoringSessionSchema = z.object({ id: z.string().optional(), date: z.string(), time: z.string(), mentorName: z.string(), topic: z.string(), status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'), notes: z.string().optional(), createdAt: z.number().optional() });
export type MentoringSession = z.infer<typeof MentoringSessionSchema>;

export const TeamMemberSchema = z.object({ id: z.string().optional(), name: z.string(), role: z.string(), bio: z.string().optional(), photoUrl: z.string().optional(), linkedinUrl: z.string().optional(), isFounder: z.boolean().default(false), createdAt: z.number().optional() });
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const StartupMilestoneSchema = z.object({ id: z.string().optional(), date: z.string(), category: z.enum(['Product', 'Funding', 'Award', 'Partnership', 'Metric']), title: z.string(), description: z.string(), articleUrl: z.string().optional(), createdAt: z.number().optional() });
export type StartupMilestone = z.infer<typeof StartupMilestoneSchema>;

export const CurationScoreSchema = z.object({
  productQuality: z.number().min(0).max(100).default(0),    
  brandingPackaging: z.number().min(0).max(100).default(0), 
  productPhoto: z.number().min(0).max(100).default(0),      
  legality: z.number().min(0).max(100).default(0),          
  productionConsistency: z.number().min(0).max(100).default(0), 
  marketPotential: z.number().min(0).max(100).default(0),   
  innovation: z.number().min(0).max(100).default(0),        
  
  totalScore: z.number().default(0), 
  readinessLevel: z.enum([
    'Pre-Incubation',    
    'Development Needed',
    'Market Ready',      
    'Retail Ready',      
    'Premium Export Ready' 
  ]).default('Pre-Incubation'),
  
  curatedBy: z.string().optional(),
  curatedAt: z.number().optional(),
  notes: z.string().optional()
});
export type CurationScore = z.infer<typeof CurationScoreSchema>;

export const AIProductInsightsSchema = z.object({
  packagingImprovement: z.string().optional(),
  idealPrice: z.string().optional(),
  targetMarket: z.string().optional(),
  distributionChannel: z.string().optional(),
  brandingStrategy: z.string().optional(),
  generatedAt: z.number().optional()
});
export type AIProductInsights = z.infer<typeof AIProductInsightsSchema>;

export const StartupProductSchema = z.object({ 
  id: z.string().optional(), 
  name: z.string(), 
  description: z.string(), 
  images: z.array(z.string()).optional(), 
  productUrl: z.string().optional(), 
  callToActionText: z.string().optional(), 
  category: z.string().optional(), 
  businessModel: z.string().optional(), 
  status: z.string().optional(), 
  features: z.array(z.string()).optional(), 
  createdAt: z.number().optional(),

  isCurated: z.boolean().default(false),
  curation: CurationScoreSchema.optional(),
  aiInsights: AIProductInsightsSchema.optional(),
  exportReadinessIndex: z.number().min(0).max(100).optional()
});
export type StartupProduct = z.infer<typeof StartupProductSchema>;
