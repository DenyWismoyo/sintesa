import { z } from 'zod';

export const BookingSchema = z.object({
  id: z.string().optional(),
  assetId: z.string(),
  assetName: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userPhone: z.string(),
  agency: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  purpose: z.string(),
  startTime: z.string().optional(),     
  endTime: z.string().optional(),       
  invoiceId: z.string().optional(),     
  referralCode: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']).default('pending'),
  createdAt: z.number().optional(),
  adminNotes: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;
