import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where, getDoc, limit, startAfter, onSnapshot, Unsubscribe, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { affiliateService } from '@/services/affiliate.service';
import { Invoice, PaymentHistory, inferInvoiceDivision, INVOICE_DIVISION_CONFIG } from '@/types';

export const billingService = {
  getInvoiceRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'invoices'),
  getInvoiceDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'invoices', id),

  // P6: Query paginasi terstruktur untuk menghemat read hingga 90%
  getPaginatedInvoices: async (maxLimit: number = 50, statusFilter?: string, lastCreatedAt?: number) => {
    try {
      let constraints: any[] = [orderBy('createdAt', 'desc')];
      if (statusFilter && statusFilter !== 'ALL') {
        constraints.unshift(where('status', '==', statusFilter));
      }
      if (lastCreatedAt) {
        constraints.push(startAfter(lastCreatedAt));
      }
      constraints.push(limit(maxLimit));

      const q = query(billingService.getInvoiceRef(), ...constraints);
      const snap = await getDocs(q);
      let invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      
      invoices = invoices.filter(inv => !inv.customerName?.toLowerCase().includes('internal'));
      const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].data().createdAt : null;
      return { invoices, lastVisible };
    } catch (err) {
      console.error("Error getPaginatedInvoices:", err);
      return { invoices: [], lastVisible: null };
    }
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
    const division = data.division || inferInvoiceDivision(data);
    const divConfig = INVOICE_DIVISION_CONFIG[division];

    const enrichedData = {
      ...data,
      division,
      suggestedCoaId: data.suggestedCoaId || divConfig.defaultCoaCode,
      allocatedCoaName: data.allocatedCoaName || (data.isAllocated ? divConfig.defaultCoaName : undefined)
    };

    const cleanData = Object.fromEntries(
      Object.entries(enrichedData).filter(([_, v]) => v !== undefined)
    );
    const docRef = await addDoc(billingService.getInvoiceRef(), { ...cleanData, createdAt: Date.now() });
    return docRef.id;
  },

  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(billingService.getInvoiceDoc(id), { ...cleanData, updatedAt: Date.now() });
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
    // Guard: Izinkan sinkronisasi jika ada pembayaran (PAID, PARTIAL) atau pembatalan (CANCELLED)
    if (invoice.status !== 'PAID' && invoice.status !== 'PARTIAL' && invoice.status !== 'CANCELLED') {
      console.warn(`[SYNC] Invoice ${invoice.id || invoice.invoiceNumber} status ${invoice.status} tidak memerlukan sync.`);
      return;
    }

    const batch = writeBatch(db);
    const appId = getAppId();
    let hasUpdates = false;

    for (const item of invoice.items) {
      try {
        if ((item.referenceType === 'BOOKING' || item.referenceType === 'TARIFF_DAY') && item.referenceId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', item.referenceId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            if (invoice.status === 'PAID') {
              batch.update(docRef, { status: 'completed', paymentStatus: 'PAID', updatedAt: Date.now() });
              hasUpdates = true;
            } else if (invoice.status === 'PARTIAL') {
              batch.update(docRef, { status: 'approved', paymentStatus: 'PARTIAL', updatedAt: Date.now() });
              hasUpdates = true;
            } else if (invoice.status === 'CANCELLED') {
              batch.update(docRef, {
                status: 'rejected',
                paymentStatus: 'CANCELLED',
                rejectionReason: 'Tagihan dibatalkan oleh bagian keuangan.',
                updatedAt: Date.now()
              });
              hasUpdates = true;
            }
          }
        } 
        else if (item.referenceType === 'CATALOG' && item.referenceId) {
          const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', item.referenceId);
          const orderSnap = await getDoc(orderRef);
          if (orderSnap.exists()) {
            batch.update(orderRef, { status: invoice.status, updatedAt: Date.now() });
            hasUpdates = true;
          }
          // Jika lunas & produk adalah milik Tenant Binaan, otomatis catat omzet ke profil Tenant
          if (invoice.status === 'PAID') {
            const catRef = doc(db, 'catalogs', item.referenceId);
            const catSnap = await getDoc(catRef);
            if (catSnap.exists()) {
              const catData = catSnap.data();
              if (catData.ownerType === 'TENANT' && catData.tenantId) {
                const revRef = doc(collection(db, 'tenants', catData.tenantId, 'revenues'));
                batch.set(revRef, {
                  month: new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                  amount: item.total,
                  productSold: item.quantity,
                  notes: `Penjualan E-Katalog Otomatis (${invoice.invoiceNumber} - ${item.description})`,
                  sourceInvoiceId: invoice.id || invoice.invoiceNumber,
                  createdAt: Date.now()
                });
                hasUpdates = true;
              }
            }
          }
        } 
        else if (item.referenceType === 'TRAINING' && item.referenceId) {
          const parts = item.referenceId.split('::');
          if (parts.length === 2) {
            const [trainingId, regId] = parts;
            const docRef = doc(db, 'trainings', trainingId, 'registrations', regId);
            const regSnap = await getDoc(docRef);
            if (regSnap.exists()) {
              if (invoice.status === 'PAID') {
                batch.update(docRef, { paymentStatus: 'PAID', status: 'CONFIRMED', updatedAt: Date.now() });
                hasUpdates = true;
              } else if (invoice.status === 'PARTIAL') {
                batch.update(docRef, { paymentStatus: 'PARTIAL', updatedAt: Date.now() });
                hasUpdates = true;
              } else if (invoice.status === 'CANCELLED') {
                batch.update(docRef, { paymentStatus: 'UNPAID', status: 'REJECTED', updatedAt: Date.now() });
                hasUpdates = true;
              }
            }
          }
        }
        else if (item.referenceType === 'PRODUCTION' && item.referenceId) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'production_orders', item.referenceId);
          const prodSnap = await getDoc(docRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            const isDp = invoice.term === 'DOWN_PAYMENT' || 
                         invoice.invoiceNumber.includes('/DP') || 
                         (invoice.notes && invoice.notes.toLowerCase().includes('uang muka'));

            if (invoice.status === 'CANCELLED') {
              batch.update(docRef, { paymentStatus: 'UNPAID', updatedAt: Date.now() });
              hasUpdates = true;
            } else if (isDp || invoice.status === 'PARTIAL') {
              const nextStatus = ['PENDING', 'ACCEPTED'].includes(prodData.status) ? 'IN_PRODUCTION' : prodData.status;
              batch.update(docRef, { 
                paymentStatus: invoice.status === 'PAID' && !isDp ? 'FULL_PAID' : 'DP_PAID', 
                status: nextStatus,
                updatedAt: Date.now() 
              });
              hasUpdates = true;
            } else if (invoice.status === 'PAID') {
              const nextStatus = prodData.status === 'DELIVERED' ? 'COMPLETED' : prodData.status;
              batch.update(docRef, { 
                paymentStatus: 'FULL_PAID', 
                status: nextStatus,
                updatedAt: Date.now() 
              });
              hasUpdates = true;
            }
          }
        }
        else if ((item.referenceType === 'TENANT' || item.referenceType === 'TARIFF_MONTH') && (item.referenceId || invoice.tenantId)) {
          const targetTenantId = item.referenceId || invoice.tenantId;
          if (targetTenantId && invoice.status === 'PAID') {
            const tenantRef = doc(db, 'tenants', targetTenantId);
            const tSnap = await getDoc(tenantRef);
            if (tSnap.exists()) {
              batch.update(tenantRef, {
                lastPaymentDate: new Date().toISOString().split('T')[0],
                lastInvoiceNumber: invoice.invoiceNumber,
                billingStatus: 'LUNAS',
                updatedAt: Date.now()
              });
              hasUpdates = true;
            }
          }
        }
        else if (item.referenceType === 'PARTNERSHIP' && item.referenceId) {
          const inqRef = doc(db, 'partnership_inquiries', item.referenceId);
          const inqSnap = await getDoc(inqRef);
          if (inqSnap.exists() && invoice.status === 'PAID') {
            batch.update(inqRef, { status: 'Disetujui', paymentStatus: 'PAID', updatedAt: Date.now() });
            hasUpdates = true;
          }
        }
      } catch (error) {
        console.error(`[Sinkronisasi Gagal] pada item ${item.referenceType}:`, error);
      }
    }

    if (hasUpdates) {
      await batch.commit();
    }

    // Auto-clear komisi afiliasi jika transaksi ini memiliki kode referral dan LUNAS
    if (invoice.id && invoice.status === 'PAID') {
      try {
        await affiliateService.clearCommissionByInvoiceId(invoice.id);
      } catch (affError) {
        console.warn(`[SYNC] Gagal auto-clear komisi afiliasi untuk invoice ${invoice.id}:`, affError);
      }
    }
  },

  uploadReceipt: async (file: File) => {
    return await storageService.uploadFile(file, `receipts/${getAppId()}`);
  }
};
