import { z } from 'zod';

export const BookingPackageRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceValue: z.number().optional(),
  pricingType: z.string().optional(),
});
export type BookingPackageRoom = z.infer<typeof BookingPackageRoomSchema>;

export const BookingPackageAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  unit: z.string().optional(),
});
export type BookingPackageAddon = z.infer<typeof BookingPackageAddonSchema>;

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

  // Field Khusus Paket Acara B2B & Korporat
  bookingType: z.enum(['REGULAR', 'B2B_PACKAGE', 'CORPORATE_EVENT']).default('REGULAR').optional(),
  packageRooms: z.array(BookingPackageRoomSchema).optional(),
  packageAddons: z.array(BookingPackageAddonSchema).optional(),
  estimatedBudget: z.number().optional(),
  estimatedAttendance: z.number().optional(),
  eventType: z.string().optional(),
  isSurveyRequested: z.boolean().default(false).optional(),
  preferredSurveyDate: z.string().optional(),
  picPosition: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

