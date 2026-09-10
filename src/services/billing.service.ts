import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where, getDoc, limit, onSnapshot, Unsubscribe, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { Invoice, PaymentHistory } from '@/types';

export const billingService = {
  getInvoiceRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'invoices'),
  getInvoiceDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'invoices', id),

  subscribeToInvoices: (callback: (invoices: Invoice[]) => void, maxLimit: number = 500): Unsubscribe => {
    const q = query(billingService.getInvoiceRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    return onSnapshot(q, (snap) => {
      let invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      
      // --- PERBAIKAN: FILTER TAGIHAN INVALID / INTERNAL ---
      // Menyembunyikan tagihan sisa uji coba lama atau tagihan internal 
      // agar tidak mengotori daftar tagihan di menu Billing.
      invoices = invoices.filter(inv => {
        const isInternalName = inv.customerName?.toLowerCase().includes('internal');
        return !isInternalName; // Jangan tampilkan jika mengandung kata "internal"
      });

      callback(invoices);
    }, (error) => {
      console.error("Error mendengarkan pembaruan invoice:", error);
    });
  },

  subscribeToMyInvoices: (email: string, callback: (invoices: Invoice[]) => void): Unsubscribe => {
    const q = query(billingService.getInvoiceRef(), where('customerEmail', '==', email));
    return onSnapshot(q, (snap) => {
      let invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      invoices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(invoices);
    }, (error) => {
      console.error("Error mendengarkan pembaruan invoice user:", error);
    });
  },

  getInvoices: async (maxLimit: number = 500) => {
    const q = query(billingService.getInvoiceRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snap = await getDocs(q);
    let invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    
    // Terapkan filter yang sama untuk fetch manual
    return invoices.filter(inv => !inv.customerName?.toLowerCase().includes('internal'));
  },

  getMyInvoices: async (email: string) => {
    const q = query(
      billingService.getInvoiceRef(),
      where('customerEmail', '==', email)
    );
    const snap = await getDocs(q);
    const invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    return invoices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  getInvoiceByNumber: async (invoiceNumber: string): Promise<Invoice | null> => {
    const q = query(
      billingService.getInvoiceRef(),
      where('invoiceNumber', '==', invoiceNumber.trim()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Invoice;
    }
    return null;
  },

  createInvoice: async (data: Omit<Invoice, 'id'>) => {
    const docRef = await addDoc(billingService.getInvoiceRef(), { ...data, createdAt: Date.now() });
    return docRef.id;
  },

  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    await updateDoc(billingService.getInvoiceDoc(id), { ...data, updatedAt: Date.now() });
  },

  // Fitur Hapus Invoice (Jika sewaktu-waktu admin butuh menghapus data sampah)
  deleteInvoice: async (id: string) => {
    await deleteDoc(billingService.getInvoiceDoc(id));
  },

  updatePaymentLink: async (id: string, paymentUrl: string) => {
    await updateDoc(billingService.getInvoiceDoc(id), { paymentUrl });
  },

  addPaymentBatch: async (
    id: string, 
    updatedHistory: PaymentHistory[], 
    paymentAmount: number,
    newPaidAmount: number, 
    newRemaining: number, 
    newStatus: string,
    accountId: string,
    accountName: string,
    piutangAcc: { id: string, name: string }
  ) => {
    const batch = writeBatch(db);
    const appId = getAppId();

    const invoiceRef = billingService.getInvoiceDoc(id);
    const docSnap = await getDoc(invoiceRef);

    if (!docSnap.exists()) throw new Error("Invoice tidak ditemukan");
    const invoice = docSnap.data() as Invoice;

    batch.update(invoiceRef, {
      paidAmount: newPaidAmount,
      remainingAmount: newRemaining,
      status: newStatus,
      history: updatedHistory,
      updatedAt: Date.now()
    });

    const entries = [
      { accountId: accountId, accountName: accountName, type: 'DEBIT', amount: paymentAmount }, 
      { accountId: piutangAcc.id, accountName: piutangAcc.name, type: 'KREDIT', amount: paymentAmount } 
    ];

    // Validasi double-entry: Total Debit harus sama dengan Total Kredit dan bernilai positif
    const totalDebit = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
    const totalKredit = entries.filter(e => e.type === 'KREDIT').reduce((sum, e) => sum + e.amount, 0);
    if (totalDebit !== totalKredit || totalDebit <= 0) {
      throw new Error(`Integritas Jurnal Gagal: Debit (${totalDebit}) !== Kredit (${totalKredit}) atau nominal <= 0`);
    }

    const journalRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'journals'));
    batch.set(journalRef, {
      date: new Date().toISOString().split('T')[0],
      referenceType: 'INVOICE',
      referenceId: id,
      description: `Penerimaan Pembayaran Tagihan #${invoice.invoiceNumber}`,
      entries,
      isReconciled: false,
      createdAt: Date.now()
    });

    const bankAccountRef = doc(db, 'artifacts', appId, 'public', 'data', 'accounts', accountId);
    batch.update(bankAccountRef, { balance: increment(paymentAmount) });

    await batch.commit();
  },

  syncBackToOrigin: async (invoice: Invoice) => {
    // Guard: Pastikan invoice berstatus PAID sebelum menyinkronkan status ke entitas asal
    if (invoice.status !== 'PAID') {
      console.warn(`[SYNC] Invoice ${invoice.id || invoice.invoiceNumber} belum PAID (status: ${invoice.status}), sync diabaikan.`);
      return;
    }

    const batch = writeBatch(db);
    const appId = getAppId();

    for (const item of invoice.items) {
      try {
        if (item.referenceType === 'BOOKING' && item.referenceId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', item.referenceId);
          batch.update(docRef, { status: 'completed' }); 
        } 
        else if (item.referenceType === 'CATALOG' && item.referenceId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', item.referenceId);
          batch.update(docRef, { status: 'PAID' });
        } 
        else if (item.referenceType === 'TRAINING' && item.referenceId) {
          const parts = item.referenceId.split('::');
          if (parts.length === 2) {
            const [trainingId, regId] = parts;
            const docRef = doc(db, 'trainings', trainingId, 'registrations', regId);
            batch.update(docRef, { paymentStatus: 'PAID', status: 'CONFIRMED' });
          }
        }
      } catch (error) {
        console.error(`[Sinkronisasi Gagal] pada item ${item.referenceType}:`, error);
      }
    }
    await batch.commit();
  },

  uploadReceipt: async (file: File) => {
    return await storageService.uploadFile(file, `receipts/${getAppId()}`);
  }
};