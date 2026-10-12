// Lokasi file: functions/src/triggers/mailAutomation.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { emailService } from '../services/emailService';
import { 
  renderTrainingRegistrationEmail, 
  renderBookingConfirmationEmail, 
  renderInvoiceEmail, 
  renderPaymentReceiptEmail 
} from '../templates/emailTemplates';

// Inisialisasi Firebase Admin jika belum
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function Trigger: Otomatis mengirim email saat ada dokumen baru di koleksi `mail_queue`.
 * Desain non-blocking & aman dari loop.
 */
export const onMailQueued = onDocumentCreated(
  {
    document: 'mail_queue/{mailId}',
    region: 'asia-southeast2',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const mailId = event.params.mailId;

    const to = data.to;
    const template = data.template;
    const payload = data.payload || {};
    let subject = data.subject || 'Pemberitahuan dari Solo Technopark';
    let html = data.html || '';

    if (!to) {
      console.warn(`[MailAutomation] Dokumen ${mailId} tidak memiliki target penerima (to). Dilewati.`);
      await snap.ref.update({
        status: 'FAILED',
        error: 'Penerima email (to) tidak ditentukan.',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    try {
      // 1. Render Template HTML sesuai tipe
      switch (template) {
        case 'TRAINING_REGISTRATION':
          subject = subject || `Konfirmasi Registrasi: ${payload.trainingTitle || 'Pelatihan STP'}`;
          html = renderTrainingRegistrationEmail({
            userName: payload.userName || 'Peserta',
            trainingTitle: payload.trainingTitle || 'Program Pelatihan',
            scheduleDate: payload.scheduleDate,
            scheduleTime: payload.scheduleTime,
            location: payload.location,
            registrationId: payload.registrationId || mailId,
            whatsappGroupUrl: payload.whatsappGroupUrl,
          });
          break;

        case 'BOOKING_CONFIRMATION':
          subject = subject || `Konfirmasi Reservasi: ${payload.assetName || 'Fasilitas STP'}`;
          html = renderBookingConfirmationEmail({
            userName: payload.userName || 'Penyewa',
            assetName: payload.assetName || 'Fasilitas Kawasan',
            bookingId: payload.bookingId || mailId,
            startDate: payload.startDate || '-',
            endDate: payload.endDate,
            startTime: payload.startTime,
            endTime: payload.endTime,
            totalPrice: payload.totalPrice,
            status: payload.status || 'pending',
          });
          break;

        case 'INVOICE_NOTIFICATION':
          subject = subject || `Tagihan Pembayaran ${payload.invoiceNumber || ''} - Solo Technopark`;
          html = renderInvoiceEmail({
            userName: payload.userName || 'Pelanggan',
            invoiceNumber: payload.invoiceNumber || mailId,
            amount: payload.amount || 0,
            productName: payload.productName || 'Layanan / Produk STP',
            dueDate: payload.dueDate || '-',
            paymentUrl: payload.paymentUrl,
          });
          break;

        case 'PAYMENT_RECEIPT':
          subject = subject || `Kuitansi Pembayaran ${payload.receiptNumber || payload.invoiceNumber || ''} - Solo Technopark`;
          html = renderPaymentReceiptEmail({
            userName: payload.userName || 'Pelanggan',
            invoiceNumber: payload.invoiceNumber || '-',
            receiptNumber: payload.receiptNumber || `KW-${Date.now()}`,
            amount: payload.amount || 0,
            productName: payload.productName || 'Layanan / Produk STP',
            paidAt: payload.paidAt || new Date().toLocaleDateString('id-ID'),
            paymentMethod: payload.paymentMethod || 'Transfer Bank / QRIS',
          });
          break;

        case 'CUSTOM':
        default:
          if (!html) {
            html = `<p>${data.message || 'Terima kasih telah menggunakan layanan Solo Technopark.'}</p>`;
          }
          break;
      }

      // 2. Kirim Email via EmailService
      const result = await emailService.sendEmail({
        to,
        subject,
        html,
        replyTo: data.replyTo,
      });

      // 3. Update Status Antrian di Firestore
      await snap.ref.update({
        status: result.success ? 'SENT' : 'FAILED',
        messageId: result.messageId || null,
        simulated: Boolean(result.simulated),
        error: result.error || null,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    } catch (err: any) {
      console.error(`[MailAutomation] Gagal memproses antrian email ${mailId}:`, err);
      await snap.ref.update({
        status: 'FAILED',
        error: err.message || 'Gagal memproses template atau pengiriman',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);
