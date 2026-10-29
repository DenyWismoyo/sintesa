// src/services/alumniForum.service.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  DEFAULT_FORUM_CHANNELS,
  ForumChannelDefinition,
  ForumThread,
  ForumThreadSchema,
  ForumReply,
  ForumReplySchema,
  ForumZone,
} from '@/types/alumniForum.types';
import { canAccessForumZoneA } from '@/config/roles';
import { notificationService } from './notification.service';

const getThreadsPath = () =>
  `artifacts/${getAppId()}/public/data/alumni_forum_threads`;

const getRepliesPath = () =>
  `artifacts/${getAppId()}/public/data/alumni_forum_replies`;

function stripUndefinedDeep(value: any): any {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.keys(value).forEach((k) => {
      if (value[k] !== undefined) {
        out[k] = stripUndefinedDeep(value[k]);
      }
    });
    return out;
  }
  return value;
}

async function runSafetyCheck(title: string, content: string): Promise<{
  moderationStatus: 'PUBLISHED' | 'FLAGGED';
  aiSafetyScore: number;
  aiFlagReason?: string;
}> {
  try {
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    const res = await fetch('/api/forum/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ title, content }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return {
        moderationStatus: json.moderationStatus === 'FLAGGED' ? 'FLAGGED' : 'PUBLISHED',
        aiSafetyScore: Number(json.safetyScore ?? 95),
        aiFlagReason: json.reason || undefined,
      };
    }
  } catch (err) {
    console.warn('[alumniForumService] Safety check fallback:', err);
  }
  return { moderationStatus: 'PUBLISHED', aiSafetyScore: 95 };
}

export const alumniForumService = {
  /**
   * Mengembalikan daftar kanal forum sesuai zona hak akses role pengguna
   */
  getVisibleChannels(role: string | null): ForumChannelDefinition[] {
    const allowZoneA = canAccessForumZoneA(role);
    return DEFAULT_FORUM_CHANNELS.filter((ch) =>
      allowZoneA ? true : ch.zone === 'ZONE_B_INDUSTRY_BRIDGE'
    );
  },

  /**
   * Mengambil daftar topik diskusi dengan isolasi ketat Zona A vs Zona B pada query Firestore
   */
  async getThreads(params: {
    role: string | null;
    channelId?: string;
    vocationalTrack?: string;
    includeFlagged?: boolean;
  }): Promise<ForumThread[]> {
    const allowZoneA = canAccessForumZoneA(params.role);

    try {
      // PENTING: Jika Mitra Industri / Startup Tenant login, query HANYA ke ZONE_B_INDUSTRY_BRIDGE
      // agar tidak pernah melanggar aturan keamanan Firestore Zona A.
      const q = allowZoneA
        ? query(collection(db, getThreadsPath()), orderBy('createdAt', 'desc'), limit(150))
        : query(
            collection(db, getThreadsPath()),
            where('zone', '==', 'ZONE_B_INDUSTRY_BRIDGE'),
            limit(150)
          );

      const snap = await getDocs(q);
      const list: ForumThread[] = snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = ForumThreadSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as ForumThread);
      });

      const filtered = list.filter((t) => {
        if (!allowZoneA && t.zone === 'ZONE_A_ALUMNI_ONLY') return false;
        if (!params.includeFlagged && t.moderationStatus && t.moderationStatus !== 'PUBLISHED') {
          return false;
        }
        if (params.channelId && params.channelId !== 'ALL' && t.channelId !== params.channelId) {
          return false;
        }
        if (
          params.vocationalTrack &&
          params.vocationalTrack !== 'Semua Kejuruan' &&
          t.vocationalTrack !== params.vocationalTrack
        ) {
          return false;
        }
        return true;
      });

      return filtered.sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } catch (err) {
      console.warn('[alumniForumService] Fallback getThreads:', err);
      return [];
    }
  },

  /**
   * Mencari topik diskusi pendamping sebuah lowongan kerja (Sinkronisasi 2 Arah Bursa Karir <-> Forum)
   */
  async getThreadByLinkedJobId(jobId: string): Promise<ForumThread | null> {
    if (!jobId) return null;
    try {
      const q = query(
        collection(db, getThreadsPath()),
        where('linkedJobId', '==', jobId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as ForumThread;
    } catch {
      return null;
    }
  },

  /**
   * Membuat topik diskusi baru dengan validasi Clario AI Safety Filter
   */
  async createThread(
    input: Omit<
      ForumThread,
      | 'id'
      | 'upvotedByUids'
      | 'upvoteCount'
      | 'replyCount'
      | 'moderationStatus'
      | 'reportedCount'
      | 'createdAt'
    >
  ): Promise<{
    success: boolean;
    thread?: ForumThread;
    flagged?: boolean;
    reason?: string;
    error?: string;
  }> {
    try {
      const safety = await runSafetyCheck(input.title, input.content);
      const colRef = collection(db, getThreadsPath());
      const newRef = doc(colRef);
      const now = Date.now();

      const payload: ForumThread = {
        ...input,
        id: newRef.id,
        upvotedByUids: [],
        upvoteCount: 0,
        replyCount: 0,
        moderationStatus: safety.moderationStatus,
        aiSafetyScore: safety.aiSafetyScore,
        aiFlagReason: safety.aiFlagReason,
        reportedCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const parsed = ForumThreadSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newRef, stripUndefinedDeep(parsed.data));

      if (safety.moderationStatus === 'FLAGGED') {
        await notificationService.createNotification({
          recipientUid: 'ADMIN_DESK',
          title: 'Moderasi AI Menahan Topik Forum',
          message: `Topik "${input.title}" ditahan untuk tinjauan: ${safety.aiFlagReason || 'Indikasi pelanggaran'}`,
          linkUrl: '/manajemen-karir',
          category: 'MODERATION_ALERT',
        });
      }

      return {
        success: true,
        thread: parsed.data,
        flagged: safety.moderationStatus === 'FLAGGED',
        reason: safety.aiFlagReason,
      };
    } catch (err: any) {
      console.error('[alumniForumService] Error createThread:', err);
      return {
        success: false,
        error: err.message || 'Gagal menerbitkan topik forum.',
      };
    }
  },

  /**
   * Mengambil seluruh balasan pada sebuah topik diskusi
   */
  async getReplies(threadId: string, zone: ForumZone): Promise<ForumReply[]> {
    if (!threadId) return [];
    try {
      const q = query(
        collection(db, getRepliesPath()),
        where('threadId', '==', threadId),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
          const raw = { id: d.id, zone, ...d.data() };
          const parsed = ForumReplySchema.safeParse(raw);
          return parsed.success ? parsed.data : (raw as ForumReply);
        })
        .filter((r) => r.moderationStatus !== 'FLAGGED')
        .sort((a, b) => {
          if (Boolean(a.isAcceptedSolution) !== Boolean(b.isAcceptedSolution)) {
            return a.isAcceptedSolution ? -1 : 1;
          }
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
    } catch (err) {
      console.warn('[alumniForumService] Fallback getReplies:', err);
      return [];
    }
  },

  /**
   * Mengirim balasan diskusi + notifikasi ke pembuat topik
   */
  async createReply(params: {
    thread: ForumThread;
    reply: Omit<
      ForumReply,
      | 'id'
      | 'threadId'
      | 'zone'
      | 'isAcceptedSolution'
      | 'endorsedByMentor'
      | 'upvotedByUids'
      | 'upvoteCount'
      | 'moderationStatus'
      | 'createdAt'
    >;
  }): Promise<{ success: boolean; flagged?: boolean; error?: string }> {
    try {
      const safety = await runSafetyCheck('', params.reply.content);
      const colRef = collection(db, getRepliesPath());
      const newRef = doc(colRef);

      const payload: ForumReply = {
        ...params.reply,
        id: newRef.id,
        threadId: params.thread.id!,
        zone: params.thread.zone,
        isAcceptedSolution: false,
        endorsedByMentor: false,
        upvotedByUids: [],
        upvoteCount: 0,
        moderationStatus: safety.moderationStatus,
        aiFlagReason: safety.aiFlagReason,
        createdAt: Date.now(),
      };

      const parsed = ForumReplySchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newRef, stripUndefinedDeep(parsed.data));

      if (safety.moderationStatus === 'PUBLISHED') {
        await updateDoc(doc(db, getThreadsPath(), params.thread.id!), {
          replyCount: increment(1),
          updatedAt: Date.now(),
        });

        if (params.thread.authorUid !== params.reply.authorUid) {
          await notificationService.createNotification({
            recipientUid: params.thread.authorUid,
            title: 'Balasan Baru di Topik Anda',
            message: `${params.reply.authorName} menanggapi "${params.thread.title}".`,
            linkUrl: '/alumni-portal',
            category: 'FORUM_REPLY',
          });
        }
      }

      return { success: true, flagged: safety.moderationStatus === 'FLAGGED' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengirim balasan.' };
    }
  },

  /**
   * Toggle Upvote pada topik diskusi
   */
  async toggleUpvoteThread(thread: ForumThread, uid: string): Promise<boolean> {
    if (!thread.id || !uid) return false;
    try {
      const hasUpvoted = (thread.upvotedByUids || []).includes(uid);
      await updateDoc(doc(db, getThreadsPath(), thread.id), {
        upvotedByUids: hasUpvoted ? arrayRemove(uid) : arrayUnion(uid),
        upvoteCount: increment(hasUpvoted ? -1 : 1),
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Menandai balasan sebagai Solusi Teknis Terbaik (memicu kenaikan poin reputasi kejuruan alumni!)
   */
  async markAcceptedSolution(params: {
    threadId: string;
    replyId: string;
    replyAuthorUid: string;
    threadTitle: string;
  }): Promise<boolean> {
    try {
      await updateDoc(doc(db, getRepliesPath(), params.replyId), {
        isAcceptedSolution: true,
      });
      await updateDoc(doc(db, getThreadsPath(), params.threadId), {
        acceptedReplyId: params.replyId,
        updatedAt: Date.now(),
      });

      await notificationService.createNotification({
        recipientUid: params.replyAuthorUid,
        title: 'Jawaban Anda Terpilih Sebagai Solusi Terbaik! (+15 Reputasi)',
        message: `Kontribusi teknis Anda pada topik "${params.threadTitle}" meningkatkan skor reputasi Talent Pool Anda.`,
        linkUrl: '/alumni-portal',
        category: 'SOLUTION_ACCEPTED',
      });
      return true;
    } catch (err) {
      console.error('[alumniForumService] Error markAcceptedSolution:', err);
      return false;
    }
  },

  /**
   * Endorse jawaban teknis oleh Admin / Mentor / Instruktur STP (+10 Reputasi)
   */
  async endorseReplyByMentor(replyId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, getRepliesPath(), replyId), {
        endorsedByMentor: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Alumni mengajukan diri / bergabung ke Order Proyek Mikro di Zona B
   */
  async applyToMicroProject(thread: ForumThread, uid: string): Promise<boolean> {
    if (!thread.id || !thread.microProjectBrief || !uid) return false;
    try {
      const current = thread.microProjectBrief.applicantUids || [];
      if (current.includes(uid)) return true;
      const nextApplicants = [...current, uid];
      await updateDoc(doc(db, getThreadsPath(), thread.id), {
        microProjectBrief: {
          ...thread.microProjectBrief,
          applicantUids: nextApplicants,
        },
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * RSVP 1-Klik pada kartu Walk-In Interview / Sesi AMA HRD Mitra
   */
  async toggleAmaRsvp(thread: ForumThread, uid: string): Promise<boolean> {
    if (!thread.id || !thread.eventAmaEmbed || !uid) return false;
    try {
      const current = thread.eventAmaEmbed.rsvpUids || [];
      const next = current.includes(uid)
        ? current.filter((x) => x !== uid)
        : [...current, uid];
      await updateDoc(doc(db, getThreadsPath(), thread.id), {
        eventAmaEmbed: {
          ...thread.eventAmaEmbed,
          rsvpUids: next,
        },
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Laporkan topik ke Moderator STP
   */
  async reportThread(threadId: string): Promise<boolean> {
    try {
      const ref = doc(db, getThreadsPath(), threadId);
      const snap = await getDoc(ref);
      const prevCount = Number(snap.data()?.reportedCount || 0) + 1;
      await updateDoc(ref, {
        reportedCount: prevCount,
        ...(prevCount >= 2 ? { moderationStatus: 'FLAGGED' } : {}),
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Keputusan Moderator Admin STP (Setujui Tayang / Hapus Topik)
   */
  async moderateThread(
    threadId: string,
    action: 'APPROVE' | 'DELETE' | 'PIN_TOGGLE',
    currentPin?: boolean
  ): Promise<boolean> {
    try {
      const ref = doc(db, getThreadsPath(), threadId);
      if (action === 'DELETE') {
        await deleteDoc(ref);
        return true;
      }
      if (action === 'PIN_TOGGLE') {
        await updateDoc(ref, { isPinned: !currentPin, updatedAt: Date.now() });
        return true;
      }
      await updateDoc(ref, {
        moderationStatus: 'PUBLISHED',
        reportedCount: 0,
        aiFlagReason: '',
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sprint 4: 1-Klik Angkat Loker Referral Alumni (#loker-referral-alumni) menjadi Lowongan Resmi di Bursa Karir (/karir)
   */
  async promoteReferralThreadToJob(thread: ForumThread): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          title: thread.title.replace(/^\[?loker\s*referral\]?\s*:?\s*/i, '').trim(),
          company: `Referral ${thread.authorName} (Jejaring Alumni)`,
          companyType: 'Perusahaan Teknologi',
          category: 'IT & Rekayasa Perangkat Lunak',
          location: 'Indonesia (Referral Alumni)',
          city: 'Surakarta',
          workType: 'Full-time',
          workSetup: 'Hybrid',
          experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
          description: `${thread.content}\n\n---\nDibagikan melalui kanal #loker-referral-alumni oleh ${thread.authorName} (${thread.authorBadgeLabel}).`,
          skills: [thread.vocationalTrack],
          isStpPartner: true,
          isActive: true,
          approvalStatus: 'APPROVED',
          linkedForumThreadId: thread.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.message || 'Gagal mengangkat loker ke Bursa Karir.' };
      }

      const createdJobId = json.job?.id;
      if (createdJobId && thread.id) {
        await updateDoc(doc(db, getThreadsPath(), thread.id), {
          promotedToJobId: createdJobId,
          linkedJobId: createdJobId,
          updatedAt: Date.now(),
        });
      }

      return { success: true, jobId: createdJobId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mempromosikan topik referral.' };
    }
  },
};

