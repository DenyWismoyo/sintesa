// Lokasi file: src/utils/calendarUtils.ts

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Booking } from '@/types';

/**
 * Format tanggal dengan locale Indonesia secara aman
 */
export const formatDateId = (date: Date, fmt: string): string => {
  try {
    return (format as any)(date, fmt, { locale: idLocale });
  } catch {
    return format(date, 'yyyy-MM-dd');
  }
};

/**
 * Menghasilkan array tanggal antara startDate dan endDate (inklusif)
 */
export const getDaysInInterval = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (curr <= end) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
};

/**
 * Menghasilkan grid 35-42 tanggal untuk bulan kalender (Mulai Senin)
 */
export const getCalendarMonthDays = (baseDate: Date): Date[] => {
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(monthStart);
  // Mulai hari Senin (weekStartsOn: 1)
  const gridStart = (startOfWeek as any)(monthStart, { weekStartsOn: 1 });
  const gridEnd = (endOfWeek as any)(monthEnd, { weekStartsOn: 1 });
  return getDaysInInterval(gridStart, gridEnd);
};

/**
 * Menghasilkan 7 hari untuk minggu berjalan (Mulai Senin)
 */
export const getCalendarWeekDays = (baseDate: Date): Date[] => {
  const weekStart = (startOfWeek as any)(baseDate, { weekStartsOn: 1 });
  const weekEnd = (endOfWeek as any)(baseDate, { weekStartsOn: 1 });
  return getDaysInInterval(weekStart, weekEnd);
};

/**
 * Memeriksa apakah booking tertentu aktif pada tanggal tertentu (format YYYY-MM-DD)
 */
export const isBookingActiveOnDate = (booking: Booking, dateStr: string): boolean => {
  const inRange = Boolean(booking.startDate && booking.endDate && booking.startDate <= dateStr && dateStr <= booking.endDate);
  const isSurvey = Boolean(booking.isSurveyRequested && booking.preferredSurveyDate === dateStr);
  return inRange || isSurvey;
};

export {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  idLocale
};
