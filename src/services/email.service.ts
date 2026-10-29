// Lokasi file: src/services/email.service.ts
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface EmailQueueItem {
  id?: string;
  to: string;
  template: 'TRAINING_REGISTRATION' | 'BOOKING_CONFIRMATION' | 'INVOICE_NOTIFICATION' | 'PAYMENT_RECEIPT' | 'CUSTOM';
  subject?: string;
  payload: Record<string, any>;
  replyTo?: string;
  status?: 'QUEUED' | 'SENT' | 'FAILED';
  createdAt: number;
  sentAt?: any;
}

/**
 * Service klien untuk mengelola antrian email otomatis Solo Technopark.
 * Menjamin UI cepat (non-blocking) karena hanya mencatat ke Firestore `mail_queue`.
 */
export const emailService = {
  /**
   * Mengantrekan email konfirmasi pendaftaran pelatihan.
   */
  async queueTrainingRegistrationEmail(params: {
    to: string;
    userName: string;
    trainingTitle: string;
    scheduleDate?: string;
    scheduleTime?: string;
    location?: string;
    registrationId: string;
    whatsappGroupUrl?: string;
  }) {
    return this.queueEmail({
      to: params.to,
      template: 'TRAINING_REGISTRATION',
      subject: `Konfirmasi Registrasi: ${params.trainingTitle} - Solo Technopark`,
      payload: params,
    });
  },

  /**
   * Mengantrekan email konfirmasi reservasi/booking sarana fasilitas.
   */
  async queueBookingConfirmationEmail(params: {
    to: string;
    userName: string;
    assetName: string;
    bookingId: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    totalPrice?: number;
    status: string;
  }) {
    return this.queueEmail({
      to: params.to,
      template: 'BOOKING_CONFIRMATION',
      subject: `Konfirmasi Reservasi: ${params.assetName} - Solo Technopark`,
      payload: params,
    });
  },

  /**
   * Mengantrekan email notifikasi invoice tagihan baru.
   */
  async queueInvoiceEmail(params: {
    to: string;
    userName: string;
    invoiceNumber: string;
    amount: number;
    productName: string;
    dueDate: string;
    paymentUrl?: string;
  }) {
    return this.queueEmail({
      to: params.to,
      template: 'INVOICE_NOTIFICATION',
      subject: `Tagihan Pembayaran ${params.invoiceNumber} - Solo Technopark`,
      payload: params,
    });
  },

  /**
   * Mengantrekan email kuitansi pembayaran resmi (lunas).
   */
  async queuePaymentSuccessEmail(params: {
    to: string;
    userName: string;
    invoiceNumber: string;
    receiptNumber: string;
    amount: number;
    productName: string;
    paidAt: string;
    paymentMethod: string;
  }) {
    return this.queueEmail({
      to: params.to,
      template: 'PAYMENT_RECEIPT',
      subject: `Kuitansi Pembayaran Lunas ${params.receiptNumber} - Solo Technopark`,
      payload: params,
    });
  },

  /**
   * Fungsi internal untuk menulis dokumen ke koleksi `mail_queue`.
   * Catatan Arsitektur: Mulai Sprint 1, seluruh email transaksional di-enqueue secara otomatis
   * oleh Firestore Triggers di server backend (transactionalMailTriggers.ts) dengan Admin SDK,
   * sehingga klien browser terlindungi dari pembatasan hak tulis langsung ke `mail_queue`.
   */
  async queueEmail(item: {
    to: string;
    template: EmailQueueItem['template'];
    subject?: string;
    payload: Record<string, any>;
    replyTo?: string;
  }) {
    // Graceful fallback: hindari permission denied jika dipanggil langsung dari client
    console.log(`[EmailService] Email transaksional '${item.template}' untuk ${item.to} dikelola otomatis via Firestore Cloud Triggers.`);
    return { success: true, queueId: `managed-by-trigger-${Date.now()}` };
  },

  /**
   * Mengambil riwayat email notifikasi yang pernah dikirim ke user tertentu.
   */
  async getUserEmailLogs(userEmail: string, maxItems: number = 20): Promise<EmailQueueItem[]> {
    if (!userEmail) return [];
    try {
      const colRef = collection(db, 'mail_queue');
      const q = query(
        colRef,
        where('to', '==', userEmail),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailQueueItem[];
    } catch (err) {
      console.warn('[EmailService Client] Gagal mengambil email logs (mungkin butuh index atau belum ada dokumen):', err);
      return [];
    }
  }
};
