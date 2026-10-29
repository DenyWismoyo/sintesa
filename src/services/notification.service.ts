// src/services/notification.service.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  EcosystemNotification,
  EcosystemNotificationSchema,
} from '@/types/alumniForum.types';
import { isInternalStaff, APP_ROLES } from '@/config/roles';

const getNotificationsPath = () =>
  `artifacts/${getAppId()}/public/data/ecosystem_notifications`;

export const notificationService = {
  async createNotification(
    payload: Omit<EcosystemNotification, 'id' | 'readByUids' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const colRef = collection(db, getNotificationsPath());
      const newRef = doc(colRef);
      const record: EcosystemNotification = {
        ...payload,
        id: newRef.id,
        readByUids: [],
        createdAt: Date.now(),
      };
      const parsed = EcosystemNotificationSchema.safeParse(record);
      if (!parsed.success) return false;
      await setDoc(newRef, parsed.data);
      return true;
    } catch (err) {
      console.warn('[notificationService] Gagal mencatat notifikasi:', err);
      return false;
    }
  },

  async getNotificationsForUser(uid: string, role: string | null): Promise<EcosystemNotification[]> {
    if (!uid) return [];
    const results = new Map<string, EcosystemNotification>();

    try {
      // 1. Notifikasi personal langsung ke UID pengguna
      const qDirect = query(
        collection(db, getNotificationsPath()),
        where('recipientUid', '==', uid),
        limit(30)
      );
      const directSnap = await getDocs(qDirect);
      directSnap.docs.forEach((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = EcosystemNotificationSchema.safeParse(raw);
        results.set(d.id, parsed.success ? parsed.data : (raw as EcosystemNotification));
      });

      // 2. Broadcast Pengumuman Resmi Alumni (khusus Alumni & Staf Internal)
      if (role === APP_ROLES.ALUMNI || isInternalStaff(role)) {
        const qBroadcast = query(
          collection(db, getNotificationsPath()),
          where('recipientUid', '==', 'BROADCAST_ALUMNI'),
          limit(20)
        );
        const bSnap = await getDocs(qBroadcast);
        bSnap.docs.forEach((d) => {
          const raw = { id: d.id, ...d.data() };
          const parsed = EcosystemNotificationSchema.safeParse(raw);
          results.set(d.id, parsed.success ? parsed.data : (raw as EcosystemNotification));
        });
      }

      // 3. Notifikasi Meja Moderasi Admin
      if (isInternalStaff(role)) {
        const qAdmin = query(
          collection(db, getNotificationsPath()),
          where('recipientUid', '==', 'ADMIN_DESK'),
          limit(20)
        );
        const aSnap = await getDocs(qAdmin);
        aSnap.docs.forEach((d) => {
          const raw = { id: d.id, ...d.data() };
          const parsed = EcosystemNotificationSchema.safeParse(raw);
          results.set(d.id, parsed.success ? parsed.data : (raw as EcosystemNotification));
        });
      }
    } catch (err) {
      console.warn('[notificationService] Fallback getNotificationsForUser:', err);
    }

    return Array.from(results.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async markAsRead(notifId: string, uid: string): Promise<boolean> {
    if (!notifId || !uid) return false;
    try {
      await updateDoc(doc(db, getNotificationsPath(), notifId), {
        readByUids: arrayUnion(uid),
      });
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(uid: string, role: string | null): Promise<boolean> {
    if (!uid) return false;
    try {
      const items = await this.getNotificationsForUser(uid, role);
      const unreadItems = items.filter((item) => !item.readByUids?.includes(uid) && item.id);
      if (unreadItems.length === 0) return true;

      await Promise.all(
        unreadItems.map((item) =>
          updateDoc(doc(db, getNotificationsPath(), item.id!), {
            readByUids: arrayUnion(uid),
          }).catch(() => null)
        )
      );
      return true;
    } catch (err) {
      console.warn('[notificationService] Gagal markAllAsRead:', err);
      return false;
    }
  },
};

