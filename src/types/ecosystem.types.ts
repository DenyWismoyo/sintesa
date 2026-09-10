import { z } from 'zod';

export const FAQSchema = z.object({
  id: z.string().optional(),
  question: z.string(),
  answer: z.string(), 
  category: z.string().optional(),
  relatedTags: z.array(z.string()).optional(),
  targetAudience: z.enum(['ALL', 'TENANT', 'PUBLIC', 'ADMIN']).optional(),
  linkedUIPath: z.string().optional(),
  validUntil: z.number().optional(), 
  videoEmbedUrl: z.string().optional(),
  attachmentUrl: z.string().optional(), 
  order: z.number().optional(),
  isPinned: z.boolean().optional(),
  helpfulCount: z.number().optional(), 
  unhelpfulCount: z.number().optional(),
  createdAt: z.number().optional()
});
export type FAQ = z.infer<typeof FAQSchema>;

export const EventCustomFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'radio', 'file', 'checkbox']),
  label: z.string(),
  required: z.boolean().default(true),
  options: z.array(z.string()).optional(), 
  helpText: z.string().optional()
});

export const EventTicketTierSchema = z.object({
  id: z.string(),
  name: z.string(), 
  price: z.number().default(0),
  quota: z.number().optional(), 
  targetAudience: z.enum(['ALL', 'TENANT_ONLY', 'PUBLIC_ONLY']).default('ALL'),
  description: z.string().optional()
});

export const EventSponsorSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  category: z.string(), 
  logoUrl: z.string(),
  websiteUrl: z.string().optional()
});

export const EventSpeakerSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  role: z.string(), 
  company: z.string(),
  photoUrl: z.string().optional(),
  linkedinUrl: z.string().optional()
});

export const EventAgendaSchema = z.object({
  id: z.string().optional(),
  timeStart: z.string(),
  timeEnd: z.string(),
  title: z.string(),
  description: z.string().optional()
});

export const EventSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  date: z.string(),
  endDate: z.string().optional(),
  time: z.string(),
  location: z.string(),
  isOnline: z.boolean().default(false),
  meetingUrl: z.string().optional(),
  type: z.string().default('Seminar'),
  tags: z.array(z.string()).default([]),
  ticketingTiers: z.array(EventTicketTierSchema).default([]),
  customRegistrationFields: z.array(EventCustomFieldSchema).default([]),
  registrationType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
  registrationUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(), 
  speakers: z.array(EventSpeakerSchema).default([]),
  agendas: z.array(EventAgendaSchema).default([]),
  sponsors: z.array(EventSponsorSchema).default([]),
  displaySettings: z.object({
    showSpeakers: z.boolean().default(true),
    showAgenda: z.boolean().default(true),
    showSponsors: z.boolean().default(true),
  }).default({ showSpeakers: true, showAgenda: true, showSponsors: true }),
  status: z.enum(['Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled']).default('Draft'),
  attendanceMethod: z.enum(['MANUAL', 'QR_CODE']).default('QR_CODE'),
  certificateTemplateUrl: z.string().optional(), 
  galleryUrls: z.array(z.string()).default([]),
  materialUrl: z.string().optional(),
  isFree: z.boolean().default(true), 
  price: z.number().optional().default(0), 
  isPublished: z.boolean().default(true),
  createdAt: z.number().optional()
});
export type AppEvent = z.infer<typeof EventSchema>;

export const AICacheSchema = z.object({
  id: z.string(),
  userQuery: z.string(),       
  aiResponse: z.string(),      
  referenceSources: z.array(z.string()), 
  hitCount: z.number().default(1),        
  helpfulScore: z.number().default(0),    
  createdAt: z.number(),
  lastHitAt: z.number()        
});
export type AICache = z.infer<typeof AICacheSchema>;

export const MapSettingsSchema = z.object({
  baseImageUrl: z.string().optional(),
  defaultZoom: z.number().default(1),
  updatedAt: z.number().optional()
});
export type MapSettings = z.infer<typeof MapSettingsSchema>;

export const MapHotspotSchema = z.object({
  id: z.string().optional(),
  linkedAssetId: z.string().optional(),
  title: z.string(),
  category: z.string(),
  description: z.string().optional(),
  x: z.number(),
  y: z.number(),
  color: z.string().default('bg-emerald-500'),
  icon: z.string().default('map-pin'),
  detailImageUrl: z.string().optional(), 
  createdAt: z.number().optional()
});
export type MapHotspot = z.infer<typeof MapHotspotSchema>;

export const ProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul proyek wajib diisi"),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  linkUrl: z.string().optional().or(z.literal('')),
});
export type Project = z.infer<typeof ProjectSchema>;

export const AlumniSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  birthInfo: z.string().optional(), 
  birthPlace: z.string().optional(), 
  birthDate: z.string().optional(),
  address: z.string().optional(),
  postCode: z.string().optional(), 
  batch: z.string().optional(), 
  programTaken: z.string().optional(), 
  courseStartDate: z.string().optional(), 
  courseEndDate: z.string().optional(),
  certificationResult: z.string().optional(), 
  trainingYear: z.string().optional(), 
  graduationYear: z.string().optional().or(z.literal('')), 
  trainingHistory: z.array(z.string()).optional(),
  alumniType: z.string().optional(),
  employmentStatus: z.string().optional(), 
  company: z.string().optional(), 
  currentJob: z.string().optional(), 
  industry: z.string().optional(),
  registrationCode: z.string().optional(),
  status: z.enum(['DORMANT', 'CLAIMED']).default('DORMANT'),
  claimedByUserId: z.string().optional(),
  claimedAt: z.number().optional(),
  createdAt: z.number().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  workSetup: z.string().optional(),
  education: z.string().optional(),
  major: z.string().optional(),
  languages: z.string().optional(),
  linkedinUrl: z.string().url("Format URL tidak valid").optional().or(z.literal('')),
  githubUrl: z.string().url("Format URL tidak valid").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Format URL tidak valid").optional().or(z.literal('')),
  resumeUrl: z.string().url("Format URL tidak valid").optional().or(z.literal('')),
  isLookingForJob: z.boolean().optional(),
  photoUrl: z.string().optional().or(z.literal('')), 
  resumeFileUrl: z.string().optional().or(z.literal('')), 
  certifications: z.array(z.string()).optional(), 
  projects: z.array(ProjectSchema).optional(), 
  internalStatus: z.enum(['AVAILABLE', 'INTERVIEWING', 'HIRED']).optional(),
  isVerified: z.boolean().optional(),
});
export type Alumni = z.infer<typeof AlumniSchema>;

export const KrenovaContentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  type: z.enum(['rundown', 'mascot', 'teaser', 'guide']).default('teaser'),
  createdAt: z.number().optional()
});
export type KrenovaContent = z.infer<typeof KrenovaContentSchema>;

export const HubThreadResponseSchema = z.object({
  id: z.string().optional(),
  threadId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  content: z.string(),
  isAccepted: z.boolean().default(false),
  createdAt: z.number()
});
export type HubThreadResponse = z.infer<typeof HubThreadResponseSchema>;

export const HubThreadSchema = z.object({
  id: z.string().optional(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.enum(['investor', 'kampus', 'industri', 'tenant', 'admin', 'super_admin']),
  authorLogoUrl: z.string().optional(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['PROBLEM_STATEMENT', 'LOOKING_FOR_FUNDING', 'RESEARCH_OFFER', 'PARTNERSHIP', 'PRODUCT_TESTING']),
  tags: z.array(z.string()).default([]),
  budgetOrTicketSize: z.string().optional(), 
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  responsesCount: z.number().default(0),
});
export type HubThread = z.infer<typeof HubThreadSchema>;
