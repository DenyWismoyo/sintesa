// src/services/partner.service.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  PartnerProfile,
  PartnerProfileSchema,
  PartnerTier,
  TalentInvitation,
  TalentInvitationSchema,
} from '@/types/partnership.types';
import { Alumni } from '@/types/ecosystem.types';
import { JobListing } from '@/types/job.types';
import { notificationService } from '@/services/notification.service';

const getTalentPoolCachePath = () =>
  `artifacts/${getAppId()}/public/data/cache_talent_pool`;

const getTalentInvitationsPath = () =>
  `artifacts/${getAppId()}/public/data/talent_invitations`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Fallback mengandalkan cookie __session yang dikirim browser otomatis
  }
  return headers;
}

function sanitizeAlumniRecord(id: string, data: Record<string, any>): Partial<Alumni> {
  return {
    id,
    name: data.name || '',
    photoUrl: data.photoUrl || '',
    originSource: data.originSource || 'STP_VOKASI',
    originInstitution: data.originInstitution || '',
    district: data.district || '',
    programTaken: data.programTaken || '',
    batch: data.batch || '',
    trainingYear: data.trainingYear || data.graduationYear || '',
    bio: data.bio || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    tools: Array.isArray(data.tools) ? data.tools : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    projects: Array.isArray(data.projects) ? data.projects.slice(0, 4) : [],
    experienceLevel: data.experienceLevel || 'Fresh Graduate / Alumni Pelatihan',
    workSetup: data.workSetup || 'Fleksibel',
    education: data.education || '',
    major: data.major || '',
    linkedinUrl: data.linkedinUrl || '',
    githubUrl: data.githubUrl || '',
    portfolioUrl: data.portfolioUrl || '',
    internalStatus: data.internalStatus || 'AVAILABLE',
    forumReputationScore: Number(data.forumReputationScore) || 0,
    acceptedSolutionsCount: Number(data.acceptedSolutionsCount) || 0,
    isVerified: Boolean(data.isVerified),
    isLookingForJob: Boolean(data.isLookingForJob),
  };
}

export interface ConvertInquiryResult {
  success: boolean;
  alreadyConverted?: boolean;
  partnerId?: string;
  picUid?: string;
  picEmail?: string;
  companyName?: string;
  isNewAccount?: boolean;
  tempPassword?: string | null;
}

export const partnerService = {
  /**
   * Mengambil profil Mitra Resmi milik user yang sedang login (berdasarkan partnerId atau picUserId)
   */
  async getPartnerByUser(uid: string, knownPartnerId?: string | null): Promise<PartnerProfile | null> {
    if (!uid) return null;

    try {
      if (knownPartnerId) {
        const directSnap = await getDoc(doc(db, 'partners', knownPartnerId));
        if (directSnap.exists()) {
          const raw = { id: directSnap.id, ...directSnap.data() };
          const parsed = PartnerProfileSchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as PartnerProfile);
        }
      }

      const userSnap = await getDoc(doc(db, 'users', uid));
      const linkedPartnerId = userSnap.exists() ? userSnap.data()?.partnerId : undefined;
      if (linkedPartnerId) {
        const partnerSnap = await getDoc(doc(db, 'partners', linkedPartnerId));
        if (partnerSnap.exists()) {
          const raw = { id: partnerSnap.id, ...partnerSnap.data() };
          const parsed = PartnerProfileSchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as PartnerProfile);
        }
      }

      const q = query(collection(db, 'partners'), where('picUserId', '==', uid), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const raw = { id: docSnap.id, ...docSnap.data() };
        const parsed = PartnerProfileSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as PartnerProfile);
      }

      return null;
    } catch (err) {
      console.error('[partnerService] Error getPartnerByUser:', err);
      return null;
    }
  },

  /**
   * Mengambil seluruh daftar Mitra Resmi terdaftar (untuk Admin)
   */
  async getAllPartners(maxLimit: number = 200): Promise<PartnerProfile[]> {
    try {
      const q = query(collection(db, 'partners'), orderBy('createdAt', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const parsed = PartnerProfileSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as PartnerProfile);
      });
    } catch (err) {
      console.warn('[partnerService] Fallback getAllPartners:', err);
      return [];
    }
  },

  /**
   * Memperbarui profil perusahaan Mitra Resmi
   */
  async updatePartnerProfile(partnerId: string, data: Partial<PartnerProfile>): Promise<boolean> {
    if (!partnerId) return false;
    try {
      const safePayload: Record<string, any> = {
        ...data,
        updatedAt: Date.now(),
      };
      // Cegah perubahan atribut privilese oleh client
      delete safePayload.id;
      delete safePayload.tier;
      delete safePayload.isVerified;
      delete safePayload.status;
      delete safePayload.picUserId;
      delete safePayload.inquiryId;

      await updateDoc(doc(db, 'partners', partnerId), safePayload);
      return true;
    } catch (err) {
      console.error('[partnerService] Error updatePartnerProfile:', err);
      return false;
    }
  },

  /**
   * Konversi Pengajuan Kemitraan (/kemitraan) menjadi Akun Mitra Resmi via Cloud Function v2
   */
  async convertInquiryToPartner(payload: {
    inquiryId: string;
    tier?: PartnerTier;
    industrySector?: string;
    location?: string;
  }): Promise<ConvertInquiryResult> {
    const callable = httpsCallable<Record<string, any>, ConvertInquiryResult>(
      functions,
      'convertInquiryToPartner'
    );
    const response = await callable({
      ...payload,
      appId: getAppId(),
    });
    return response.data;
  },

  /**
   * Mengambil Katalog Talenta Alumni (STP Vokasi & RSKB Surakarta) yang berstatus OPEN TO WORK
   * Prioritas 1-Read dari cache_talent_pool/master (bebas PII), dengan fallback terproteksi.
   */
  async getSanitizedTalentPool(): Promise<Partial<Alumni>[]> {
    try {
      const cacheRef = doc(db, getTalentPoolCachePath(), 'master');
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        const items = cacheSnap.data()?.data;
        if (Array.isArray(items) && items.length > 0) {
          return items as Partial<Alumni>[];
        }
      }
    } catch (cacheErr) {
      console.warn('[partnerService] Info cache_talent_pool belum tersedia, menggunakan fallback query:', cacheErr);
    }

    try {
      const q = query(
        collection(db, 'alumnis'),
        where('status', '==', 'CLAIMED'),
        where('isLookingForJob', '==', true),
        limit(150)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => sanitizeAlumniRecord(d.id, d.data()));
    } catch (err) {
      console.warn('[partnerService] Fallback getSanitizedTalentPool kosong:', err);
      return [];
    }
  },

  /**
   * Mengirim Undangan Wawancara / Rekrutmen Resmi dari Mitra Industri atau Startup Tenant ke Talenta Alumni
   */
  async sendTalentInvitation(
    data: Omit<TalentInvitation, 'id' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const colRef = collection(db, getTalentInvitationsPath());
      const newRef = doc(colRef);
      const payload: TalentInvitation = {
        ...data,
        id: newRef.id,
        status: 'PENDING',
        createdAt: Date.now(),
      };

      const parsed = TalentInvitationSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newRef, parsed.data);

      try {
        let recipientUid = parsed.data.alumniId;
        const alumniSnap = await getDoc(doc(db, 'alumnis', parsed.data.alumniId));
        if (alumniSnap.exists()) {
          const alData = alumniSnap.data();
          if (alData?.claimedByUserId) {
            recipientUid = alData.claimedByUserId;
          }
        }
        await notificationService.createNotification({
          recipientUid,
          title: `Undangan Wawancara: ${parsed.data.roleOffered}`,
          message: `${parsed.data.senderCompanyName} mengundang Anda untuk sesi rekrutmen/wawancara.`,
          linkUrl: '/profil',
          category: 'INTERVIEW_INVITE',
        });
      } catch (notifErr) {
        console.warn('[partnerService] Gagal mengirim notifikasi undangan wawancara:', notifErr);
      }

      return { success: true, id: newRef.id };
    } catch (err: any) {
      console.error('[partnerService] Error sendTalentInvitation:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengirim undangan wawancara.',
      };
    }
  },

  /**
   * Mengambil daftar undangan wawancara yang dikirim oleh akun Mitra / Tenant tertentu
   */
  async getSentInvitationsByUid(uid: string): Promise<TalentInvitation[]> {
    if (!uid) return [];
    try {
      const q = query(
        collection(db, getTalentInvitationsPath()),
        where('senderUid', '==', uid),
        limit(100)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = TalentInvitationSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as TalentInvitation);
      });
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('[partnerService] Fallback getSentInvitationsByUid:', err);
      return [];
    }
  },

  /**
   * Mengambil seluruh undangan wawancara lintas ekosistem (untuk Admin Karir STP)
   */
  async getAllTalentInvitations(maxLimit: number = 150): Promise<TalentInvitation[]> {
    try {
      const q = query(
        collection(db, getTalentInvitationsPath()),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = TalentInvitationSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as TalentInvitation);
      });
    } catch (err) {
      console.warn('[partnerService] Fallback getAllTalentInvitations:', err);
      return [];
    }
  },

  /**
   * Memperbarui status mediasi undangan wawancara oleh Admin STP
   */
  async updateInvitationStatus(
    id: string,
    status: TalentInvitation['status']
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, getTalentInvitationsPath(), id), { status });
      return true;
    } catch (err) {
      console.error('[partnerService] Error updateInvitationStatus:', err);
      return false;
    }
  },

  /**
   * Mengambil undangan wawancara yang ditujukan kepada seorang Alumni (untuk halaman /profil)
   */
  async getInvitationsForAlumni(alumniId: string): Promise<TalentInvitation[]> {
    if (!alumniId) return [];
    try {
      const q = query(
        collection(db, getTalentInvitationsPath()),
        where('alumniId', '==', alumniId),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
          const raw = { id: d.id, ...d.data() };
          const parsed = TalentInvitationSchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as TalentInvitation);
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('[partnerService] Fallback getInvitationsForAlumni:', err);
      return [];
    }
  },

  /**
   * Respons Alumni terhadap undangan wawancara dari Mitra Industri / Startup Tenant
   */
  async respondToInvitation(
    id: string,
    status: 'ACCEPTED' | 'DECLINED'
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, getTalentInvitationsPath(), id), {
        status,
        respondedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[partnerService] Error respondToInvitation:', err);
      return false;
    }
  },

  /**
   * Mengajukan draft Lowongan Kerja / Magang dari Portal Mitra Resmi (/mitra) atau Startup Tenant (/tenant/talent)
   * Otomatis dipaksa berstatus PENDING_APPROVAL & isActive: false di server hingga disetujui Admin STP.
   */
  async submitJobDraft(
    payload: Partial<JobListing>
  ): Promise<{ success: boolean; job?: JobListing; message?: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal mengajukan draft lowongan kerja.');
    }
    return json;
  },

  /**
   * Mengambil daftar lowongan milik Mitra atau Tenant tertentu (termasuk yang masih PENDING_APPROVAL)
   */
  async getEntityJobs(params: { partnerId?: string; tenantId?: string }): Promise<JobListing[]> {
    if (!params.partnerId && !params.tenantId) return [];
    const qs = new URLSearchParams({
      includeInactive: 'true',
      approvalStatus: 'all',
    });
    if (params.partnerId) qs.set('partnerId', params.partnerId);
    if (params.tenantId) qs.set('tenantId', params.tenantId);

    const res = await fetch(`/api/jobs?${qs.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) return [];
    return Array.isArray(json.jobs) ? json.jobs : [];
  },

  /**
   * Menyetujui atau menolak pengajuan lowongan Mitra / Tenant oleh Admin STP
   */
  async reviewPartnerJob(params: {
    id: string;
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }): Promise<boolean> {
    const headers = await getAuthHeaders();
    const body =
      params.action === 'APPROVE'
        ? {
            id: params.id,
            approvalStatus: 'APPROVED',
            isActive: true,
            rejectionReason: '',
          }
        : {
            id: params.id,
            approvalStatus: 'REJECTED',
            isActive: false,
            rejectionReason: params.rejectionReason || 'Perlu penyesuaian kualifikasi standar Bursa Karir STP.',
          };

    const res = await fetch('/api/jobs', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memperbarui status kurasi lowongan.');
    }
    return true;
  },
};
