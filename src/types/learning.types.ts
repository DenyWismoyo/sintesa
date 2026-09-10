import { z } from 'zod';
import { FAQSchema } from './ecosystem.types';

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['Video', 'Reading', 'Resource', 'Assignment']), 
  content: z.string(), 
  durationMins: z.number().optional().default(0),
  isLocked: z.boolean().default(true), 
  fileUrl: z.string().optional(),     
  fileName: z.string().optional(),    
  assignmentType: z.enum(['Text', 'FileUpload', 'Both']).optional(), 
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  lessons: z.array(LessonSchema).default([]),
});
export type Module = z.infer<typeof ModuleSchema>;

export const SubmissionSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  participantEmail: z.string(),
  participantName: z.string(),
  submittedAt: z.number(),
  answerText: z.string().optional(),
  attachmentUrl: z.string().optional(),
  status: z.enum(['PENDING_REVIEW', 'GRADED', 'REJECTED']).default('PENDING_REVIEW'),
  score: z.number().optional(),
  feedback: z.string().optional() 
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const InstructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(), 
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
});
export type Instructor = z.infer<typeof InstructorSchema>;

export const CustomFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'file', 'link']),
  isRequired: z.boolean().default(true),
});
export type CustomFormField = z.infer<typeof CustomFormFieldSchema>;

export const TrainingSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  description: z.string(), 
  type: z.enum(['Offline', 'Online Live', 'Video Course']).default('Offline'),
  level: z.enum(['Pemula', 'Menengah', 'Mahir']).default('Pemula'),
  category: z.string().default('Umum'),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().default(true),
  price: z.number().default(0),
  discountPrice: z.number().optional(),
  date: z.string().optional(), 
  endDate: z.string().optional(),
  location: z.string().optional(), 
  quota: z.number().min(0).default(0), 
  durationDisplay: z.string().optional(),
  scheduleDetails: z.string().optional(),
  certificationType: z.string().optional(),
  methodology: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  registeredCount: z.number().optional().default(0),
  imageUrl: z.string().optional(),
  promoVideoUrl: z.string().optional(),
  targetAudience: z.array(z.string()).optional().default([]), 
  prerequisites: z.array(z.string()).optional().default([]), 
  skillsGained: z.array(z.string()).optional().default([]), 
  benefits: z.array(z.string()).optional().default([]), 
  instructors: z.array(InstructorSchema).optional().default([]),
  curriculum: z.array(ModuleSchema).default([]),
  registrationFields: z.array(CustomFormFieldSchema).optional().default([]),
  faqs: z.array(FAQSchema).optional().default([]),
  status: z.enum(['Draft', 'Published', 'Aktif', 'Selesai', 'Dibatalkan']).default('Draft'),
  instructorAccessCode: z.string().optional(), 
  authorizedInstructorIds: z.array(z.string()).optional().default([]),
  createdAt: z.number().optional()
});
export type Training = z.infer<typeof TrainingSchema>;

export const TrainingRegistrationSchema = z.object({
  id: z.string().optional(),
  trainingId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  origin: z.string(), 
  customData: z.record(z.string(), z.string()).optional(), 
  completedLessons: z.array(z.string()).optional().default([]),
  lastAccessedAt: z.number().optional(),
  invoiceId: z.string().optional(),
  paymentStatus: z.enum(['FREE', 'PENDING', 'PAID']).default('FREE'),
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']).default('PENDING'),
  createdAt: z.number().optional()
});
export type TrainingRegistration = z.infer<typeof TrainingRegistrationSchema>;
