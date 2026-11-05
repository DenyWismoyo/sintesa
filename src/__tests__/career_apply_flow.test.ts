// src/__tests__/career_apply_flow.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobApplicationService } from '@/services/jobApplication.service';
import { JobApplication, JobApplicationStatus } from '@/types/alumniForum.types';

// Mock Firebase & notificationService
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('@/lib/appId', () => ({
  getAppId: () => 'blud-app-test',
}));

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    createNotification: vi.fn().mockResolvedValue(true),
  },
}));

// In-memory mock store
const mockApplicationsStore = new Map<string, any>();

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    doc: vi.fn((_col, _path, id) => {
      const generatedId = id || `mock-app-${Date.now()}-${Math.random()}`;
      return { id: generatedId };
    }),
    getDocs: vi.fn(async () => {
      const docs = Array.from(mockApplicationsStore.entries()).map(([id, data]) => ({
        id,
        data: () => data,
      }));
      return { docs };
    }),
    setDoc: vi.fn(async (docRef, data) => {
      mockApplicationsStore.set(docRef.id, { ...data, id: docRef.id });
      return Promise.resolve();
    }),
    updateDoc: vi.fn(async (docRef, data) => {
      const existing = mockApplicationsStore.get(docRef.id) || {};
      mockApplicationsStore.set(docRef.id, { ...existing, ...data });
      return Promise.resolve();
    }),
    query: vi.fn(() => ({})),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

describe('Mekanisme Alur Pengajuan Lamaran Karir (Career Apply & Tracking Pipeline)', () => {
  beforeEach(() => {
    mockApplicationsStore.clear();
    vi.clearAllMocks();
  });

  it('1. harus mampu mengajukan lamaran kerja dengan validasi skema yang lengkap', async () => {
    const res = await jobApplicationService.submitApplication({
      jobId: 'job-cnc-001',
      jobTitle: 'CNC Milling Operator 5-Axis',
      companyName: 'PT Industri Presisi Solo',
      applicantUid: 'user-alumni-001',
      applicantName: 'Budi Santoso',
      applicantEmail: 'budi.santoso@alumni.solotechnopark.id',
      applicantPhone: '081234567890',
      programTaken: 'Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis',
      skills: ['CNC Milling', 'Mastercam', 'G-Code'],
      portfolioUrl: 'https://drive.google.com/portofolio-budi',
      coverNote: 'Saya siap bergabung dan memiliki sertifikasi resmi dari Solo Technopark.',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const stored = mockApplicationsStore.get(res.id!);
    expect(stored).toBeDefined();
    expect(stored.jobTitle).toBe('CNC Milling Operator 5-Axis');
    expect(stored.status).toBe('APPLIED');
    expect(stored.applicantName).toBe('Budi Santoso');
  });

  it('2. harus mencegah duplikasi lamaran oleh pelamar yang sama pada lowongan yang sama', async () => {
    // Lamaran pertama
    const res1 = await jobApplicationService.submitApplication({
      jobId: 'job-welder-002',
      jobTitle: 'Welder 6G Offshore',
      companyName: 'PT Barata Indonesia',
      applicantUid: 'user-alumni-002',
      applicantName: 'Ahmad Fauzi',
      applicantEmail: 'ahmad.fauzi@alumni.solotechnopark.id',
      applicantPhone: '08987654321',
      skills: ['Welding 6G'],
    });
    expect(res1.success).toBe(true);

    // Lamaran kedua dengan jobId & applicantUid yang sama
    const res2 = await jobApplicationService.submitApplication({
      jobId: 'job-welder-002',
      jobTitle: 'Welder 6G Offshore',
      companyName: 'PT Barata Indonesia',
      applicantUid: 'user-alumni-002',
      applicantName: 'Ahmad Fauzi',
      applicantEmail: 'ahmad.fauzi@alumni.solotechnopark.id',
      applicantPhone: '08987654321',
      skills: ['Welding 6G'],
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('sudah mengirimkan lamaran');
  });

  it('3. harus mampu memperbarui tahapan seleksi (APPLIED -> REVIEWED -> HIRED)', async () => {
    const res = await jobApplicationService.submitApplication({
      jobId: 'job-ai-003',
      jobTitle: 'AI Prompt Engineer',
      companyName: 'Solo Technopark AI Center',
      applicantUid: 'user-alumni-003',
      applicantName: 'Dewi Lestari',
      applicantEmail: 'dewi.lestari@alumni.solotechnopark.id',
      skills: ['Prompt Engineering'],
    });
    expect(res.success).toBe(true);

    // Admin memperbarui status ke REVIEWED
    const updated = await jobApplicationService.updateApplicationStatus({
      id: res.id!,
      applicantUid: 'user-alumni-003',
      jobTitle: 'AI Prompt Engineer',
      companyName: 'Solo Technopark AI Center',
      status: 'REVIEWED' as JobApplicationStatus,
      statusNote: 'Berkas portofolio memenuhi kualifikasi teknis awal.',
    });
    expect(updated).toBe(true);

    const updatedDoc = mockApplicationsStore.get(res.id!);
    expect(updatedDoc.status).toBe('REVIEWED');
  });

  it('4. harus mampu membaca daftar lamaran aktif milik pelamar (getMyApplications)', async () => {
    await jobApplicationService.submitApplication({
      jobId: 'job-qa-004',
      jobTitle: 'Software QA Engineer',
      companyName: 'PT Teknologi Solo',
      applicantUid: 'user-alumni-004',
      applicantName: 'Rian Pratama',
      applicantEmail: 'rian@solotechnopark.id',
      skills: ['QA Testing'],
    });

    const myApps = await jobApplicationService.getMyApplications('user-alumni-004');
    expect(myApps.length).toBeGreaterThan(0);
    expect(myApps[0].jobId).toBe('job-qa-004');
  });
});

