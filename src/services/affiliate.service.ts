// Lokasi file: src/services/affiliate.service.ts
import {
  collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, increment, writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AffiliatePartner, AffiliatePartnerSchema,
  CommissionRecord, CommissionRecordSchema,
  AffiliatePayoutRequest, AffiliatePayoutRequestSchema,
  AffiliateSettings, AffiliateSettingsSchema,
  AffiliateStatus,
} from '@/types/affiliate.types';

const affiliatesRef = () => collection(db, 'affiliates');
const affiliateDoc = (userId: string) => doc(db, 'affiliates', userId);
const commissionsRef = () => collection(db, 'commissions');
const payoutsRef = () => collection(db, 'affiliate_payouts');
const clicksRef = () => collection(db, 'affiliate_clicks');
const settingsDoc = () => doc(db, 'app_settings', 'affiliate_config');

function generateReferralCode(fullName: string): string {
  const prefix = 'STP';
  const namePart = fullName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const suffix = Math.floor(Math.random() * 900 + 100);
  return prefix + '-' + namePart + String(suffix);
}

export const affiliateService = {
  getAffiliateProfile: async (userId: string): Promise<AffiliatePartner | null> => {
    const snap = await getDoc(affiliateDoc(userId));
    if (!snap.exists()) return null;
    const parsed = AffiliatePartnerSchema.safeParse({ id: snap.id, ...snap.data() });
    return parsed.success ? parsed.data : null;
  },

  applyForAffiliate: async (
    userId: string,
    data: {
      fullName: string; email: string; phone: string;
      bankName: string; accountNumber: string; accountHolderName: string;
      promotionChannels: string[]; promotionNotes?: string;
    }
  ): Promise<void> => {
    const referralCode = generateReferralCode(data.fullName);
    const existingSnap = await getDocs(query(affiliatesRef(), where('referralCode', '==', referralCode)));
    const finalCode = existingSnap.empty ? referralCode : referralCode + String(Math.floor(Math.random() * 9 + 1));
    const payload = {
      userId, ...data, referralCode: finalCode, status: 'PENDING',
      totalClicks: 0, totalConversions: 0, totalEarnings: 0,
      availableBalance: 0, pendingBalance: 0, withdrawnAmount: 0,
      createdAt: Date.now(),
    };
    await setDoc(affiliateDoc(userId), payload);
  },

  approveAffiliate: async (userId: string, approvedBy: string, customCode?: string): Promise<void> => {
    const updateData: Record<string, unknown> = { status: 'APPROVED', approvedAt: Date.now(), approvedBy };
    if (customCode) updateData.referralCode = customCode.toUpperCase();
    await updateDoc(affiliateDoc(userId), updateData);
  },

  rejectAffiliate: async (userId: string, reason: string): Promise<void> => {
    await updateDoc(affiliateDoc(userId), { status: 'REJECTED', rejectionReason: reason });
  },

  updateAffiliateStatus: async (userId: string, status: AffiliateStatus): Promise<void> => {
    await updateDoc(affiliateDoc(userId), { status });
  },

  updateAffiliateProfile: async (
    userId: string,
    data: Partial<Pick<AffiliatePartner, 'bankName' | 'accountNumber' | 'accountHolderName' | 'promotionChannels' | 'promotionNotes' | 'phone'>>
  ): Promise<void> => {
    await updateDoc(affiliateDoc(userId), { ...data, updatedAt: Date.now() });
  },

  getAffiliates: async (statusFilter?: AffiliateStatus): Promise<AffiliatePartner[]> => {
    const q = statusFilter
      ? query(affiliatesRef(), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
      : query(affiliatesRef(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const results: AffiliatePartner[] = [];
    snap.forEach(d => {
      const p = AffiliatePartnerSchema.safeParse({ id: d.id, ...d.data() });
      if (p.success) results.push(p.data);
    });
    return results;
  },

  createCommission: async (data: Omit<CommissionRecord, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const payload = { ...data, status: 'PENDING_PAYMENT', createdAt: Date.now() };
    const ref = await addDoc(commissionsRef(), payload);
    await updateDoc(affiliateDoc(data.affiliateId), { pendingBalance: increment(data.commissionAmount) });
    return ref.id;
  },

  clearCommission: async (commissionId: string, affiliateId: string, commissionAmount: number): Promise<void> => {
    const batch = writeBatch(db);
    batch.update(doc(commissionsRef(), commissionId), { status: 'CLEARED', clearedAt: Date.now() });
    batch.update(affiliateDoc(affiliateId), {
      pendingBalance: increment(-commissionAmount),
      availableBalance: increment(commissionAmount),
      totalEarnings: increment(commissionAmount),
      totalConversions: increment(1),
    });
    await batch.commit();
  },

  clearCommissionByInvoiceId: async (invoiceId: string): Promise<boolean> => {
    const q = query(
      commissionsRef(),
      where('invoiceId', '==', invoiceId),
      where('status', '==', 'PENDING_PAYMENT'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return false;
    const docData = snap.docs[0].data();
    await affiliateService.clearCommission(
      snap.docs[0].id,
      docData.affiliateId,
      docData.commissionAmount
    );
    return true;
  },

  cancelCommission: async (commissionId: string, affiliateId: string, commissionAmount: number): Promise<void> => {
    const batch = writeBatch(db);
    batch.update(doc(commissionsRef(), commissionId), { status: 'CANCELLED' });
    batch.update(affiliateDoc(affiliateId), { pendingBalance: increment(-commissionAmount) });
    await batch.commit();
  },

  getCommissionRecords: async (affiliateId?: string, maxLimit = 100): Promise<CommissionRecord[]> => {
    const q = affiliateId
      ? query(commissionsRef(), where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc'), limit(maxLimit))
      : query(commissionsRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snap = await getDocs(q);
    const results: CommissionRecord[] = [];
    snap.forEach(d => {
      const p = CommissionRecordSchema.safeParse({ id: d.id, ...d.data() });
      if (p.success) results.push(p.data);
    });
    return results;
  },

  requestPayout: async (
    affiliateId: string,
    data: { referralCode: string; amount: number; bankName: string; accountNumber: string; accountHolderName: string; }
  ): Promise<string> => {
    const payload = { ...data, affiliateId, status: 'REQUESTED', requestedAt: Date.now() };
    const ref = await addDoc(payoutsRef(), payload);
    await updateDoc(affiliateDoc(affiliateId), { availableBalance: increment(-data.amount) });
    return ref.id;
  },

  processPayout: async (
    payoutId: string, affiliateId: string, processedBy: string,
    proofReceiptUrl: string, adminNotes?: string
  ): Promise<void> => {
    const payoutSnap = await getDoc(doc(payoutsRef(), payoutId));
    if (!payoutSnap.exists()) throw new Error('Pengajuan tidak ditemukan');
    const amount = payoutSnap.data().amount as number;
    const batch = writeBatch(db);
    batch.update(doc(payoutsRef(), payoutId), {
      status: 'TRANSFERRED', proofReceiptUrl,
      adminNotes: adminNotes || '', processedAt: Date.now(), processedBy,
    });
    batch.update(affiliateDoc(affiliateId), { withdrawnAmount: increment(amount) });
    await batch.commit();
  },

  rejectPayout: async (payoutId: string, affiliateId: string, adminNotes: string): Promise<void> => {
    const payoutSnap = await getDoc(doc(payoutsRef(), payoutId));
    if (!payoutSnap.exists()) throw new Error('Pengajuan tidak ditemukan');
    const amount = payoutSnap.data().amount as number;
    const batch = writeBatch(db);
    batch.update(doc(payoutsRef(), payoutId), { status: 'REJECTED', adminNotes, processedAt: Date.now() });
    batch.update(affiliateDoc(affiliateId), { availableBalance: increment(amount) });
    await batch.commit();
  },

  getPayoutRequests: async (affiliateId?: string): Promise<AffiliatePayoutRequest[]> => {
    const q = affiliateId
      ? query(payoutsRef(), where('affiliateId', '==', affiliateId), orderBy('requestedAt', 'desc'))
      : query(payoutsRef(), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    const results: AffiliatePayoutRequest[] = [];
    snap.forEach(d => {
      const p = AffiliatePayoutRequestSchema.safeParse({ id: d.id, ...d.data() });
      if (p.success) results.push(p.data);
    });
    return results;
  },

  recordReferralClick: async (refCode: string, landingUrl: string, userAgent?: string): Promise<void> => {
    await addDoc(clicksRef(), { referralCode: refCode, landingUrl, userAgent: userAgent || '', clickedAt: Date.now() });
    const affSnap = await getDocs(query(affiliatesRef(), where('referralCode', '==', refCode), limit(1)));
    if (!affSnap.empty) await updateDoc(affSnap.docs[0].ref, { totalClicks: increment(1) });
  },

  getAffiliateSettings: async (): Promise<AffiliateSettings> => {
    const snap = await getDoc(settingsDoc());
    if (!snap.exists()) return AffiliateSettingsSchema.parse({});
    const parsed = AffiliateSettingsSchema.safeParse(snap.data());
    return parsed.success ? parsed.data : AffiliateSettingsSchema.parse({});
  },

  updateAffiliateSettings: async (data: Partial<AffiliateSettings>): Promise<void> => {
    await setDoc(settingsDoc(), { ...data, updatedAt: Date.now() }, { merge: true });
  },

  getAffiliateByCode: async (referralCode: string): Promise<AffiliatePartner | null> => {
    const q = query(
      affiliatesRef(),
      where('referralCode', '==', referralCode),
      where('status', '==', 'APPROVED'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const parsed = AffiliatePartnerSchema.safeParse({ id: d.id, ...d.data() });
    return parsed.success ? parsed.data : null;
  },
};
