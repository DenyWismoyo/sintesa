import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Helper terpusat untuk provisioning akun Firebase Auth & pengiriman kredensial
 */
async function provisionTenantAccount(tenantId: string, tenantData: any, docRef: admin.firestore.DocumentReference) {
  const email = tenantData.email;
  const tenantName = tenantData.name || 'Tenant KST';

  if (!email) {
    console.log(`[Tenant Auth] Tenant ${tenantId} tidak punya email, lewati pembuatan akun.`);
    return;
  }

  try {
    const randomPassword = `Sintesa@${Math.random().toString(36).slice(-8)}`;

    const userRecord = await admin.auth().createUser({
      email: email,
      password: randomPassword,
      displayName: tenantName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'tenant',
      tenantId: tenantId,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: tenantName,
      role: 'tenant',
      tenantId: tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await docRef.update({ authUid: userRecord.uid });

    await db.collection('mail_queue').add({
      to: email.trim().toLowerCase(),
      template: 'TENANT_WELCOME_CREDENTIALS',
      subject: `Akun Portal Tenant Solo Technopark — ${tenantName}`,
      payload: {
        tenantName,
        email,
        tempPassword: randomPassword,
        accessCode: tenantData.accessCode || '',
      },
      status: 'QUEUED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Tenant Auth SUKSES] Akun portal tenant dibuat untuk ${email} dan antrean email terkirim.`);

  } catch (error: any) {
    console.error(`[Tenant Auth GAGAL] Tidak bisa membuat akun untuk ${email}:`, error);
    if (error.code === 'auth/email-already-exists') {
      console.log('[Tenant Auth Catatan] Email ini sudah memiliki akun di sistem.');
    }
  }
}

/**
 * Trigger saat dokumen tenant baru dibuat:
 * HANYA buat akun jika statusnya langsung 'Aktif' (misal dibuat manual oleh Admin)
 * Jika berstatus 'Menunggu Review' (misal dari form Curation publik), tunda hingga disetujui.
 */
export const onTenantCreated = onDocumentCreated("tenants/{tenantId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const tenantData = snap.data();
  const tenantId = event.params.tenantId;

  if (tenantData.status !== 'Aktif') {
    console.log(`[Tenant Auth] Tenant baru ${tenantId} berstatus '${tenantData.status || 'Draft'}'. Akun ditunda sampai disetujui admin.`);
    return;
  }

  await provisionTenantAccount(tenantId, tenantData, snap.ref);
});

/**
 * Trigger saat status tenant diupdate:
 * Jika status berubah menjadi 'Aktif' dan belum punya akun authUid, buat akun resmi & kirim email kredensial.
 */
export const onTenantApproved = onDocumentUpdated("tenants/{tenantId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  if (!beforeData || !afterData) return;

  const isBecomingActive = beforeData.status !== 'Aktif' && afterData.status === 'Aktif';
  if (!isBecomingActive) return;

  if (afterData.authUid) {
    console.log(`[Tenant Auth] Tenant ${event.params.tenantId} sudah memiliki akun authUid (${afterData.authUid}).`);
    return;
  }

  const tenantId = event.params.tenantId;
  const docRef = event.data!.after.ref;

  console.log(`[Tenant Auth] Tenant ${tenantId} resmi disetujui (Status menjadi 'Aktif'). Memulai pembuatan akun portal...`);
  await provisionTenantAccount(tenantId, afterData, docRef);
});
