import { describe, it, expect } from 'vitest';
import {
  renderBookingStatusUpdatedEmail,
  renderTalentInvitationEmail,
  renderJobApplicationStatusEmail,
} from '../../functions/src/templates/emailTemplates';

describe('Transactional Email Templates Suite (Sprint 1)', () => {
  it('harus merender email status reservasi (approved / rejected) dengan benar', () => {
    const htmlApproved = renderBookingStatusUpdatedEmail({
      userName: 'Ahmad Sutanto',
      assetName: 'Auditorium Gedung Solo Technopark',
      bookingId: 'BKG-2026-001',
      startDate: '2026-11-10',
      status: 'approved',
      adminNotes: 'Ruangan telah disiapkan.',
    });

    expect(htmlApproved).toContain('Auditorium Gedung Solo Technopark');
    expect(htmlApproved).toContain('DISETUJUI');
    expect(htmlApproved).toContain('Ahmad Sutanto');
    expect(htmlApproved).toContain('Ruangan telah disiapkan.');

    const htmlRejected = renderBookingStatusUpdatedEmail({
      userName: 'Budi Darmawan',
      assetName: 'Ruang Workshop Fabrikasi',
      bookingId: 'BKG-2026-002',
      startDate: '2026-11-12',
      status: 'rejected',
      adminNotes: 'Jadwal bertabrakan dengan agenda kedinasan.',
    });

    expect(htmlRejected).toContain('DITOLAK / DIBATALKAN');
    expect(htmlRejected).toContain('Jadwal bertabrakan dengan agenda kedinasan.');
  });

  it('harus merender email undangan rekrutmen talenta ke alumni', () => {
    const htmlInvitation = renderTalentInvitationEmail({
      alumniName: 'Rian Saputra',
      senderCompanyName: 'PT Solo Manufaktur Kreasi',
      roleOffered: 'Junior CNC Programmer',
      workType: 'Full-time',
      message: 'Kami tertarik dengan sertifikat keahlian Anda dari STP Vokasi.',
      senderPicName: 'Ibu Sarah (HRD)',
    });

    expect(htmlInvitation).toContain('Rian Saputra');
    expect(htmlInvitation).toContain('PT Solo Manufaktur Kreasi');
    expect(htmlInvitation).toContain('Junior CNC Programmer');
    expect(htmlInvitation).toContain('Ibu Sarah (HRD)');
    expect(htmlInvitation).toContain('Kami tertarik dengan sertifikat keahlian Anda');
  });

  it('harus merender email status tahapan lamaran kerja ke kandidat', () => {
    const htmlStatus = renderJobApplicationStatusEmail({
      applicantName: 'Dewi Lestari',
      jobTitle: 'Frontend React Developer',
      companyName: 'PT Digital Solusi Nusantara',
      status: 'INTERVIEWING',
      statusNote: 'Wawancara teknis dijadwalkan via Google Meet hari Kamis pkl 10:00 WIB.',
    });

    expect(htmlStatus).toContain('Dewi Lestari');
    expect(htmlStatus).toContain('Frontend React Developer');
    expect(htmlStatus).toContain('PT Digital Solusi Nusantara');
    expect(htmlStatus).toContain('Undangan Tahap Wawancara');
    expect(htmlStatus).toContain('Google Meet');
  });
});

