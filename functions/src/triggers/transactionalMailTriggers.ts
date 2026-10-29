// Lokasi file: functions/src/triggers/transactionalMailTriggers.ts
import { onDocumentWritten, onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

function ensureAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

function getDb() {
  ensureAdmin();
  return admin.firestore();
}

/**
 * 1. Otomasi Email Siklus Booking / Peminjaman Fasilitas
 * - Saat booking baru dibuat -> Kirim email konfirmasi pengajuan (BOOKING_CONFIRMATION)
 * - Saat status booking diubah menjadi 'approved' atau 'rejected' -> Kirim email status update
 */
export const onBookingWrittenMail = onDocumentWritten(
  {
    document: 'artifacts/{appId}/public/data/bookings/{bookingId}',
    region: 'asia-southeast2',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeSnap = change.before;
    const afterSnap = change.after;
    const bookingId = event.params.bookingId;
    const db = getDb();

    // Kasus 1: Dokumen baru dibuat
    if (!beforeSnap.exists && afterSnap.exists) {
      const data = afterSnap.data() || {};
      const targetEmail = (data.userEmail || data.email || '').trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes('@')) return;

      try {
        await db.collection('mail_queue').add({
          to: targetEmail,
          template: 'BOOKING_CONFIRMATION',
          subject: `Konfirmasi Reservasi: ${data.assetName || 'Fasilitas STP'} - Solo Technopark`,
          payload: {
            userName: data.userName || data.name || 'Pemohon',
            assetName: data.assetName || 'Fasilitas Kawasan',
            bookingId: bookingId,
            startDate: data.startDate || '-',
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
            totalPrice: data.totalPrice || data.estimatedBudget || 0,
            status: data.status || 'pending',
          },
          status: 'QUEUED',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[TransactionalMail] Enqueued BOOKING_CONFIRMATION for booking ${bookingId}`);
      } catch (err) {
        console.warn(`[TransactionalMail] Gagal enqueue BOOKING_CONFIRMATION untuk ${bookingId}:`, err);
      }
      return;
    }

    // Kasus 2: Dokumen diperbarui (Cek perubahan status)
    if (beforeSnap.exists && afterSnap.exists) {
      const beforeData = beforeSnap.data() || {};
      const afterData = afterSnap.data() || {};

      const prevStatus = String(beforeData.status || '').toLowerCase();
      const nextStatus = String(afterData.status || '').toLowerCase();

      if (prevStatus !== nextStatus && (nextStatus === 'approved' || nextStatus === 'rejected')) {
        const targetEmail = (afterData.userEmail || afterData.email || '').trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) return;

        try {
          await db.collection('mail_queue').add({
            to: targetEmail,
            template: 'BOOKING_STATUS_UPDATE',
            subject: `Update Reservasi: ${afterData.assetName || 'Fasilitas'} (${nextStatus.toUpperCase()}) - Solo Technopark`,
            payload: {
              userName: afterData.userName || afterData.name || 'Pemohon',
              assetName: afterData.assetName || 'Fasilitas Kawasan',
              bookingId: bookingId,
              startDate: afterData.startDate || '-',
              endDate: afterData.endDate,
              startTime: afterData.startTime,
              endTime: afterData.endTime,
              status: nextStatus,
              adminNotes: afterData.adminNotes || '',
            },
            status: 'QUEUED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[TransactionalMail] Enqueued BOOKING_STATUS_UPDATE (${nextStatus}) for booking ${bookingId}`);
        } catch (err) {
          console.warn(`[TransactionalMail] Gagal enqueue BOOKING_STATUS_UPDATE untuk ${bookingId}:`, err);
        }
      }
    }
  }
);

/**
 * 2. Otomasi Email Siklus Invoice & Kuitansi Pembayaran
 * - Saat invoice PENDING baru dibuat -> Kirim email rincian tagihan (INVOICE_NOTIFICATION)
 * - Saat invoice lunas (status menjadi PAID) -> Otomatis kirim kuitansi pembayaran resmi (PAYMENT_RECEIPT)
 */
export const onInvoiceLifecycleMail = onDocumentWritten(
  {
    document: 'artifacts/{appId}/public/data/invoices/{invoiceId}',
    region: 'asia-southeast2',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeSnap = change.before;
    const afterSnap = change.after;
    const invoiceId = event.params.invoiceId;
    const db = getDb();

    // Kasus 1: Dokumen baru dibuat dengan status PENDING
    if (!beforeSnap.exists && afterSnap.exists) {
      const data = afterSnap.data() || {};
      const status = String(data.status || 'PENDING').toUpperCase();

      if (status === 'PENDING' && !data.invoiceMailQueued) {
        const targetEmail = (data.customerEmail || data.email || '').trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) return;

        const firstItem = Array.isArray(data.items) && data.items.length > 0 ? data.items[0] : null;
        const productName = firstItem?.description || data.productName || 'Layanan / Produk Solo Technopark';
        const amount = Number(data.subTotal || data.totalAmount || data.amount || 0);

        try {
          await db.collection('mail_queue').add({
            to: targetEmail,
            template: 'INVOICE_NOTIFICATION',
            subject: `Tagihan Pembayaran ${data.invoiceNumber || invoiceId} - Solo Technopark`,
            payload: {
              userName: data.customerName || 'Pelanggan',
              invoiceNumber: data.invoiceNumber || invoiceId,
              amount: amount,
              productName: productName,
              dueDate: data.dueDate || '-',
              paymentUrl: data.paymentUrl || undefined,
            },
            status: 'QUEUED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Tandai invoice agar tidak memicu pengiriman ganda
          await afterSnap.ref.update({
            invoiceMailQueued: true,
          });
          console.log(`[TransactionalMail] Enqueued INVOICE_NOTIFICATION for ${invoiceId}`);
        } catch (err) {
          console.warn(`[TransactionalMail] Gagal enqueue INVOICE_NOTIFICATION untuk ${invoiceId}:`, err);
        }
      }
      return;
    }

    // Kasus 2: Invoice dilunasi (Status berubah menjadi PAID)
    if (beforeSnap.exists && afterSnap.exists) {
      const beforeData = beforeSnap.data() || {};
      const afterData = afterSnap.data() || {};

      const prevStatus = String(beforeData.status || '').toUpperCase();
      const nextStatus = String(afterData.status || '').toUpperCase();

      if (prevStatus !== 'PAID' && nextStatus === 'PAID' && !afterData.receiptMailQueued) {
        const targetEmail = (afterData.customerEmail || afterData.email || '').trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) return;

        const firstItem = Array.isArray(afterData.items) && afterData.items.length > 0 ? afterData.items[0] : null;
        const productName = firstItem?.description || afterData.productName || 'Layanan / Produk Solo Technopark';
        const amount = Number(afterData.subTotal || afterData.totalAmount || afterData.amount || 0);
        const receiptNumber = afterData.receiptNumber || `KW-${Date.now().toString().slice(-8)}`;

        try {
          await db.collection('mail_queue').add({
            to: targetEmail,
            template: 'PAYMENT_RECEIPT',
            subject: `Kuitansi Pembayaran Lunas ${receiptNumber} - Solo Technopark`,
            payload: {
              userName: afterData.customerName || 'Pelanggan',
              invoiceNumber: afterData.invoiceNumber || invoiceId,
              receiptNumber: receiptNumber,
              amount: amount,
              productName: productName,
              paidAt: afterData.paidAt || new Date().toLocaleDateString('id-ID'),
              paymentMethod: afterData.paymentMethod || 'Transfer Bank / QRIS',
            },
            status: 'QUEUED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Tandai bahwa kuitansi sudah diantrekan
          await afterSnap.ref.update({
            receiptMailQueued: true,
            receiptNumber: receiptNumber,
          });
          console.log(`[TransactionalMail] Enqueued PAYMENT_RECEIPT for paid invoice ${invoiceId}`);
        } catch (err) {
          console.warn(`[TransactionalMail] Gagal enqueue PAYMENT_RECEIPT untuk ${invoiceId}:`, err);
        }
      }
    }
  }
);

/**
 * 3. Otomasi Undangan Rekrutmen dari Mitra Industri ke Alumni
 * Saat Mitra mengirimkan dokumen di talent_invitations, notifikasikan alumni via email
 */
export const onTalentInvitationCreatedMail = onDocumentCreated(
  {
    document: 'artifacts/{appId}/public/data/talent_invitations/{invId}',
    region: 'asia-southeast2',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data() || {};
    const invId = event.params.invId;
    const alumniId = data.alumniId;
    const db = getDb();

    try {
      let recipientEmail = '';
      let recipientName = data.alumniName || 'Alumni';

      // 1. Cek email dari dokumen alumni
      if (alumniId) {
        const alumniDoc = await db.collection('alumnis').doc(alumniId).get();
        if (alumniDoc.exists) {
          const aData = alumniDoc.data() || {};
          recipientEmail = (aData.email || '').trim().toLowerCase();
          recipientName = aData.name || recipientName;

          // Jika email tidak ada di alumnis, cari dari user yang mengklaim
          if (!recipientEmail && aData.claimedByUserId) {
            const userDoc = await db.collection('users').doc(aData.claimedByUserId).get();
            if (userDoc.exists) {
              recipientEmail = (userDoc.data()?.email || '').trim().toLowerCase();
            }
          }
        }
      }

      if (!recipientEmail || !recipientEmail.includes('@')) {
        console.warn(`[TransactionalMail] Talent invitation ${invId} tidak menemukan email alumni untuk id ${alumniId}`);
        return;
      }

      await db.collection('mail_queue').add({
        to: recipientEmail,
        template: 'TALENT_INVITATION',
        subject: `Undangan Karir: ${data.roleOffered || 'Peluang Karir'} di ${data.senderCompanyName || 'Mitra Industri'} - Solo Technopark`,
        payload: {
          alumniName: recipientName,
          senderCompanyName: data.senderCompanyName || 'Mitra Industri STP',
          roleOffered: data.roleOffered || 'Posisi Terbuka',
          workType: data.workType || 'Full-time',
          message: data.message || 'Perusahaan tertarik dengan profil talenta Anda di Solo Technopark.',
          senderPicName: data.senderPicName || '',
        },
        status: 'QUEUED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[TransactionalMail] Enqueued TALENT_INVITATION for alumni ${alumniId} (${recipientEmail})`);
    } catch (err) {
      console.warn(`[TransactionalMail] Gagal memproses TALENT_INVITATION untuk ${invId}:`, err);
    }
  }
);

/**
 * 4. Otomasi Pemberitahuan Status Lamaran Kerja ke Pelamar Alumni
 * Saat status pada job_applications berubah (SHORTLISTED, INTERVIEW, HIRED, REJECTED)
 */
export const onJobApplicationStatusMail = onDocumentUpdated(
  {
    document: 'artifacts/{appId}/public/data/job_applications/{appId}',
    region: 'asia-southeast2',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data() || {};
    const afterData = change.after.data() || {};
    const appId = event.params.appId;
    const db = getDb();

    const prevStatus = String(beforeData.status || '').toUpperCase();
    const nextStatus = String(afterData.status || '').toUpperCase();

    if (prevStatus !== nextStatus) {
      const targetEmail = (afterData.applicantEmail || '').trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes('@')) return;

      try {
        await db.collection('mail_queue').add({
          to: targetEmail,
          template: 'JOB_APPLICATION_STATUS',
          subject: `Update Lamaran: ${afterData.jobTitle || 'Pekerjaan'} di ${afterData.companyName || 'Mitra Industri'} - Solo Technopark`,
          payload: {
            applicantName: afterData.applicantName || 'Pelamar',
            jobTitle: afterData.jobTitle || 'Lowongan Kerja',
            companyName: afterData.companyName || 'Mitra Industri',
            status: nextStatus,
            statusNote: afterData.statusNote || '',
          },
          status: 'QUEUED',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[TransactionalMail] Enqueued JOB_APPLICATION_STATUS (${nextStatus}) for applicant ${targetEmail}`);
      } catch (err) {
        console.warn(`[TransactionalMail] Gagal enqueue JOB_APPLICATION_STATUS untuk ${appId}:`, err);
      }
    }
  }
);

