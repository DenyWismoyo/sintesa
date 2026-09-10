import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Menggunakan standar V2: onDocumentCreated
export const onTenantCreated = onDocumentCreated("tenants/{tenantId}", async (event) => {
  // event.data adalah snapshot dari dokumen yang baru ditambahkan
  const snap = event.data;
  
  // Keamanan tambahan: Pastikan data snapshot benar-benar ada
  if (!snap) {
    return;
  }

  const tenantData = snap.data();
  const email = tenantData.email;
  const tenantName = tenantData.name || 'Tenant KST';
  const tenantId = event.params.tenantId;

  // Jika tenant tidak memasukkan email, kita tidak perlu membuatkan akun
  if (!email) {
    console.log(`Tenant ${tenantId} tidak punya email, lewati pembuatan akun.`);
    return;
  }

  try {
    // 1. Buat password acak yang aman untuk awal login
    const randomPassword = `Sintesa@${Math.random().toString(36).slice(-8)}`;

    // 2. Buat akun di Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: randomPassword,
      displayName: tenantName,
    });

    // 3. Daftarkan user ini ke koleksi 'users' dengan role 'tenant'
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: tenantName,
      role: 'tenant',
      tenantId: tenantId, // Hubungkan akun ini dengan ID tenant-nya
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. Update data tenant dengan Auth UID-nya (Sebagai penanda sudah punya akun)
    await snap.ref.update({ authUid: userRecord.uid });

    // Catatan log (Nantinya di sesi email, kita akan kirimkan password ini ke email Tenant)
    console.log(`[SUKSES] Akun dibuat untuk ${email}. Password: ${randomPassword}`);

  } catch (error: any) {
    console.error(`[GAGAL] Tidak bisa membuat akun untuk ${email}:`, error);
    
    // Jika emailnya ternyata sudah pernah terdaftar sebelumnya di Firebase Auth
    if (error.code === 'auth/email-already-exists') {
      console.log('Catatan: Email ini sudah memiliki akun di sistem.');
    }
  }
});