import { describe, it, expect } from 'vitest';
import { Booking } from '@/types';

// Helper logic yang akan dipakai di kalender custom
export function isBookingOnDate(booking: Booking, dateStr: string): boolean {
  // Booking reguler atau paket B2B aktif pada rentang tanggal
  const isDateInRange = booking.startDate <= dateStr && dateStr <= booking.endDate;
  // Atau survey lokasi fisik pada tanggal survey
  const isSurveyDate = Boolean(booking.isSurveyRequested && booking.preferredSurveyDate === dateStr);
  return isDateInRange || isSurveyDate;
}

export function filterBookingsByType(
  bookings: Booking[], 
  typeFilter: 'all' | 'b2b' | 'regular' | 'survey'
): Booking[] {
  if (typeFilter === 'all') return bookings;
  if (typeFilter === 'b2b') return bookings.filter(b => b.bookingType === 'B2B_PACKAGE');
  if (typeFilter === 'regular') return bookings.filter(b => !b.bookingType || b.bookingType === 'REGULAR');
  if (typeFilter === 'survey') return bookings.filter(b => Boolean(b.isSurveyRequested && b.preferredSurveyDate));
  return bookings;
}

describe('Custom Calendar Engine Logic', () => {
  const mockBookings: Booking[] = [
    {
      id: 'book-1',
      assetId: 'room-1',
      assetName: 'Auditorium Utama',
      userName: 'PT Solusi Bangsa',
      userEmail: 'contact@solusi.id',
      userPhone: '08123456789',
      agency: 'PT Solusi Bangsa',
      startDate: '2026-10-15',
      endDate: '2026-10-17',
      startTime: '08:00',
      endTime: '17:00',
      purpose: 'National Tech Summit 2026',
      status: 'approved',
      bookingType: 'B2B_PACKAGE',
      packageRooms: [
        { id: 'room-1', name: 'Auditorium Utama' },
        { id: 'room-2', name: 'Ruang VIP Soemaryo' },
      ],
      packageAddons: [
        { id: 'addon-1', name: 'LED Videotron P2.5 Indoor', price: 4500000 },
      ],
      isSurveyRequested: true,
      preferredSurveyDate: '2026-10-10',
    },
    {
      id: 'book-2',
      assetId: 'room-3',
      assetName: 'Smart Classroom A',
      userName: 'Komunitas Robotika',
      userEmail: 'robot@org.id',
      userPhone: '08129876543',
      agency: 'Komunitas Robotika',
      startDate: '2026-10-16',
      endDate: '2026-10-16',
      startTime: '13:00',
      endTime: '16:00',
      purpose: 'Workshop Arduino IoT',
      status: 'completed',
      bookingType: 'REGULAR',
    },
  ];

  it('harus mendeteksi rentang hari booking B2B (multi-day)', () => {
    expect(isBookingOnDate(mockBookings[0], '2026-10-14')).toBe(false);
    expect(isBookingOnDate(mockBookings[0], '2026-10-15')).toBe(true);
    expect(isBookingOnDate(mockBookings[0], '2026-10-16')).toBe(true);
    expect(isBookingOnDate(mockBookings[0], '2026-10-17')).toBe(true);
    expect(isBookingOnDate(mockBookings[0], '2026-10-18')).toBe(false);
  });

  it('harus mendeteksi jadwal survey lokasi fisik', () => {
    expect(isBookingOnDate(mockBookings[0], '2026-10-10')).toBe(true);
  });

  it('harus memfilter booking berdasarkan kategori (B2B, Reguler, Survey)', () => {
    const b2bList = filterBookingsByType(mockBookings, 'b2b');
    expect(b2bList.length).toBe(1);
    expect(b2bList[0].id).toBe('book-1');

    const regularList = filterBookingsByType(mockBookings, 'regular');
    expect(regularList.length).toBe(1);
    expect(regularList[0].id).toBe('book-2');

    const surveyList = filterBookingsByType(mockBookings, 'survey');
    expect(surveyList.length).toBe(1);
    expect(surveyList[0].id).toBe('book-1');
  });
});
