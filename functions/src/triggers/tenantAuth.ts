import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const onTenantCreated = onDocumentCreated("tenants/{tenantId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    return;
  }

  const tenantData = snap.data();
  const email = tenantData.email;
  const tenantName = tenantData.name || 'Tenant KST';
  const tenantId = event.params.tenantId;

  if (!email) {
    console.log(`Tenant ${tenantId} tidak punya email, lewati pembuatan akun.`);
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

    await snap.ref.update({ authUid: userRecord.uid });

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

    console.log(`[SUKSES] Akun portal tenant dibuat untuk ${email} dan antrean email terkirim.`);

  } catch (error: any) {
    console.error(`[GAGAL] Tidak bisa membuat akun untuk ${email}:`, error);
    if (error.code === 'auth/email-already-exists') {
      console.log('Catatan: Email ini sudah memiliki akun di sistem.');
    }
  }
});
