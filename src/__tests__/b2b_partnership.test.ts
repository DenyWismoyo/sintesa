import { describe, it, expect } from 'vitest';
import { BookingSchema } from '@/types/booking.types';
import { PartnershipInquirySchema } from '@/types/partnership.types';
import { buildB2BQuotationPdf } from '@/lib/pdf/b2bQuotationPdf';

describe('Integritas Data B2B Package & Kemitraan Strategis', () => {
  it('harus memvalidasi BookingSchema dengan data paket event B2B multi-ruangan dan add-ons', () => {
    const validB2BBooking = {
      assetId: 'pkg_gedung_multiruangan',
      assetName: 'Paket Gedung Multi-Ruangan (Auditorium + Exhibition Hall)',
      userName: 'Budi Santoso',
      userEmail: 'procurement@inovasi.co.id',
      userPhone: '081234567890',
      agency: 'PT Inovasi Digital Nusantara',
      startDate: '2026-11-20T08:00:00.000Z',
      endDate: '2026-11-22T18:00:00.000Z',
      purpose: 'Indonesia Future Tech Summit & Expo 2026',
      status: 'pending' as const,
      picPosition: 'Head of Corporate Affairs',
      bookingType: 'B2B_PACKAGE' as const,
      estimatedBudget: 45000000,
      estimatedAttendance: 850,
      eventType: 'KTT Teknologi & Ekshibisi',
      isSurveyRequested: true,
      preferredSurveyDate: '2026-11-05T10:00:00.000Z',
      packageRooms: [
        {
          id: 'auditorium',
          name: 'Auditorium Utama Semeru',
          priceValue: 15000000,
          pricingType: 'per_hari',
        },
        {
          id: 'exhibition_hall',
          name: 'Exhibition Hall & Atrium',
          priceValue: 10000000,
          pricingType: 'per_hari',
        },
      ],
      packageAddons: [
        {
          id: 'videotron_p3',
          name: 'Videotron LED P3 High-Definition',
          price: 5000000,
          unit: '1 Set (Full Day)',
        },
        {
          id: 'sound_line_array',
          name: 'Audio Line Array 20.000 Watt + Operator',
          price: 3500000,
          unit: '1 Paket Event',
        },
      ],
    };

    const parsed = BookingSchema.safeParse(validB2BBooking);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.bookingType).toBe('B2B_PACKAGE');
      expect(parsed.data.packageRooms?.length).toBe(2);
      expect(parsed.data.packageAddons?.length).toBe(2);
      expect(parsed.data.estimatedBudget).toBe(45000000);
      expect(parsed.data.isSurveyRequested).toBe(true);
      expect(parsed.data.agency).toBe('PT Inovasi Digital Nusantara');
    }
  });

  it('harus memvalidasi PartnershipInquirySchema untuk permohonan kerjasama industri', () => {
    const validInquiry = {
      agencyName: 'Astra Graphia Information Technology',
      agencyType: 'Perusahaan Swasta / Multinasional' as const,
      picName: 'Budi Santoso, M.Kom',
      picPosition: 'VP of Technology & Innovation',
      picEmail: 'budi.s@agit.astra.co.id',
      picPhone: '081198765432',
      partnershipType: 'LAB_MANUFACTURING' as const,
      subject: 'Inisiasi Co-Innovation Center AI for Manufacturing',
      proposalSummary: 'Pendirian Co-Innovation Center AI for Manufacturing dan penyediaan 50 workstation GPU untuk riset terapan bersama UPT Solo Technopark.',
      estimatedTimeline: 'Q1 2027',
      targetParticipants: 150,
      estimatedBudget: 350000000,
      status: 'PENDING' as const,
      createdAt: Date.now(),
    };

    const parsed = PartnershipInquirySchema.safeParse(validInquiry);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.agencyName).toBe('Astra Graphia Information Technology');
      expect(parsed.data.partnershipType).toBe('LAB_MANUFACTURING');
      expect(parsed.data.status).toBe('PENDING');
      expect(parsed.data.picEmail).toBe('budi.s@agit.astra.co.id');
    }
  });

  it('harus menolak PartnershipInquiry jika field wajib tidak diisi', () => {
    const invalidInquiry = {
      agencyName: 'Badan Riset',
      // agencyType hilang
      picName: 'Ahmad',
      picPosition: 'Staff',
      picEmail: 'ahmad@mail.com',
      picPhone: '0812345678',
      partnershipType: 'TIDAK_VALID',
      subject: 'Tes',
      proposalSummary: 'Singkat',
    };

    const parsed = PartnershipInquirySchema.safeParse(invalidInquiry);
    expect(parsed.success).toBe(false);
  });

  it('harus membangun dokumen PDF murni (vektor A4) resmi untuk estimasi penawaran B2B tanpa error', () => {
    const pdfDoc = buildB2BQuotationPdf({
      quotationNumber: 'STP/B2B-EST/998877',
      agencyName: 'PT Telkom Indonesia (Persero) Tbk',
      picName: 'Rian Pratama',
      picPosition: 'General Manager Enterprise',
      picPhone: '081299887766',
      picEmail: 'rian@telkom.co.id',
      eventType: 'Telkom Digitech Summit 2026',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      durationDays: 3,
      estimatedAttendance: 500,
      rooms: [
        { id: 'auditorium', name: 'Auditorium Utama Semeru', pricePerDay: 15000000 },
        { id: 'exhibition', name: 'Exhibition Hall & Selasar', pricePerDay: 8000000 },
      ],
      addons: [
        { id: 'led', name: 'Videotron LED P2.5 Indoor Stage', price: 3500000, unit: 'hari' },
      ],
      discountAmount: 7950000,
      totalBudget: 71550000,
      isSurveyRequested: true,
      preferredSurveyDate: '2026-11-20',
    });

    expect(pdfDoc).toBeDefined();
    // Validasi dimensi halaman A4
    expect(pdfDoc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(pdfDoc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    // Validasi output dokumen bukan string kosong
    const pdfOutput = pdfDoc.output('datauristring');
    expect(pdfOutput).toContain('data:application/pdf');
  });
});
