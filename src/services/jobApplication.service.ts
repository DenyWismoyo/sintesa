// src/services/jobApplication.service.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  JobApplication,
  JobApplicationSchema,
  JobApplicationStatus,
  JOB_APPLICATION_STATUS_LABELS,
} from '@/types/alumniForum.types';
import { notificationService } from './notification.service';

const getApplicationsPath = () =>
  `artifacts/${getAppId()}/public/data/job_applications`;

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) clean[k] = obj[k];
  });
  return clean as T;
}

export const jobApplicationService = {
  /**
   * 1-Click Verified Apply oleh Alumni STP / RSKB menggunakan data portofolio & CV terverifikasi
   */
  async submitApplication(
    data: Omit<JobApplication, 'id' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Cegah duplikasi lamaran pada lowongan yang sama oleh pelamar yang sama
      const existingQ = query(
        collection(db, getApplicationsPath()),
        where('applicantUid', '==', data.applicantUid),
        limit(50)
      );
      const existingSnap = await getDocs(existingQ);
      const duplicate = existingSnap.docs.find((d) => d.data()?.jobId === data.jobId);
      if (duplicate) {
        return {
          success: false,
          error: 'Anda sudah mengirimkan lamaran terverifikasi pada lowongan ini.',
        };
      }

      const colRef = collection(db, getApplicationsPath());
      const newRef = doc(colRef);
      const payload: JobApplication = {
        ...data,
        id: newRef.id,
        status: 'APPLIED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const parsed = JobApplicationSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newRef, stripUndefined(parsed.data));

      // Kirim notifikasi ke meja Admin Karir STP
      await notificationService.createNotification({
        recipientUid: 'ADMIN_DESK',
        title: `Lamaran Baru: ${data.jobTitle}`,
        message: `${data.applicantName} melamar ke ${data.companyName}.`,
        linkUrl: '/manajemen-karir',
        category: 'JOB_APPLICATION',
      });

      return { success: true, id: newRef.id };
    } catch (err: any) {
      console.error('[jobApplicationService] Error submitApplication:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengirimkan berkas lamaran.',
      };
    }
  },

  /**
   * Daftar lamaran kerja milik Alumni yang sedang login (ditampilkan di /profil & /alumni-portal)
   */
  async getMyApplications(applicantUid: string): Promise<JobApplication[]> {
    if (!applicantUid) return [];
    try {
      const q = query(
        collection(db, getApplicationsPath()),
        where('applicantUid', '==', applicantUid),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
          const raw = { id: d.id, ...d.data() };
          const parsed = JobApplicationSchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as JobApplication);
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('[jobApplicationService] Fallback getMyApplications:', err);
      return [];
    }
  },

  /**
   * Daftar pelamar masuk untuk Mitra Resmi (/mitra) atau Startup Tenant (/tenant/talent)
   */
  async getEntityApplications(params: {
    partnerId?: string;
    tenantId?: string;
  }): Promise<JobApplication[]> {
    if (!params.partnerId && !params.tenantId) return [];
    try {
      const field = params.partnerId ? 'partnerId' : 'tenantId';
      const val = params.partnerId || params.tenantId || '';
      const q = query(collection(db, getApplicationsPath()), where(field, '==', val), limit(150));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
          const raw = { id: d.id, ...d.data() };
          const parsed = JobApplicationSchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as JobApplication);
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('[jobApplicationService] Fallback getEntityApplications:', err);
      return [];
    }
  },

  /**
   * Seluruh lamaran lintas ekosistem (untuk Analitik Eksekutif Admin STP & RSKB)
   */
  async getAllApplications(maxLimit: number = 250): Promise<JobApplication[]> {
    try {
      const q = query(
        collection(db, getApplicationsPath()),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = JobApplicationSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as JobApplication);
      });
    } catch (err) {
      console.warn('[jobApplicationService] Fallback getAllApplications:', err);
      return [];
    }
  },

  /**
   * Memperbarui tahapan seleksi pelamar (APPLIED -> REVIEWED -> INTERVIEWING -> HIRED / REJECTED)
   * Otomatis mengirim notifikasi pintar ke pelamar.
   */
  async updateApplicationStatus(params: {
    id: string;
    applicantUid: string;
    jobTitle: string;
    companyName: string;
    status: JobApplicationStatus;
    statusNote?: string;
  }): Promise<boolean> {
    try {
      await updateDoc(doc(db, getApplicationsPath(), params.id), {
        status: params.status,
        ...(params.statusNote !== undefined ? { statusNote: params.statusNote } : {}),
        updatedAt: Date.now(),
      });

      await notificationService.createNotification({
        recipientUid: params.applicantUid,
        title: `Update Lamaran: ${JOB_APPLICATION_STATUS_LABELS[params.status]}`,
        message: `Status lamaran Anda untuk posisi ${params.jobTitle} di ${params.companyName} diperbarui menjadi ${JOB_APPLICATION_STATUS_LABELS[params.status]}.`,
        linkUrl: '/profil',
        category: 'JOB_APPLICATION',
      });

      return true;
    } catch (err) {
      console.error('[jobApplicationService] Error updateApplicationStatus:', err);
      return false;
    }
  },
};

