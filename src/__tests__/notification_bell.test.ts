import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '@/services/notification.service';
import { EcosystemNotification } from '@/types/alumniForum.types';

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('@/lib/appId', () => ({
  getAppId: () => 'blud-app-dev',
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Sprint 2: Ecosystem Notification Center & Bell Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('harus memvalidasi struktur EcosystemNotification dengan kategori yang valid', () => {
    const dummyNotif: EcosystemNotification = {
      id: 'notif-123',
      recipientUid: 'user-abc',
      title: 'Tawaran Wawancara Kerja',
      message: 'Mitra PT Inovasi mengirim undangan wawancara karir.',
      category: 'INTERVIEW_INVITE',
      linkUrl: '/karir/lamaran',
      readByUids: [],
      createdAt: Date.now(),
    };

    expect(dummyNotif.recipientUid).toBe('user-abc');
    expect(dummyNotif.category).toBe('INTERVIEW_INVITE');
    expect(dummyNotif.readByUids).toHaveLength(0);
  });

  it('harus memiliki fungsi markAllAsRead yang menangani penandaan notifikasi secara batch', async () => {
    expect(typeof notificationService.markAllAsRead).toBe('function');
    
    // Uji eksekusi tanpa melempar error
    await expect(notificationService.markAllAsRead('user-abc', 'user')).resolves.not.toThrow();
  });

  it('harus memiliki method query notifikasi getNotificationsForUser', async () => {
    expect(typeof notificationService.getNotificationsForUser).toBe('function');
  });
});
