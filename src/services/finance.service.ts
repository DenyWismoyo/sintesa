import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, limit, onSnapshot, writeBatch, increment, Unsubscribe, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { Expense, Account, Journal, Budget } from '@/types'; 

export const financeService = {
  
  // --- MANAJEMEN PENGELUARAN ---
  getExpenseRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'expenses'),
  getExpenseDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'expenses', id),

  getExpenses: async (maxLimit: number = 500): Promise<Expense[]> => {
    const q = query(financeService.getExpenseRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  },

  subscribeToExpenses: (callback: (expenses: Expense[]) => void, maxLimit: number = 500): Unsubscribe => {
    const q = query(financeService.getExpenseRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    return onSnapshot(q, (snap) => {
      const expenses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(expenses);
    }, (error) => {
      console.warn("[FINANCE] Izin akses beban/expenses ditolak atau dibatasi:", error.message);
    });
  },

  addExpense: async (data: Omit<Expense, 'id'>) => {
    const docRef = await addDoc(financeService.getExpenseRef(), { ...data, createdAt: Date.now() });
    return docRef.id;
  },

  updateExpense: async (id: string, data: Partial<Expense>) => {
    await updateDoc(financeService.getExpenseDoc(id), { ...data, updatedAt: Date.now() });
  },

  uploadReceipt: async (file: File): Promise<string> => {
    return await storageService.uploadFile(file, `expenses/${getAppId()}`);
  },

  // --- MANAJEMEN KAS, BANK & BAGAN AKUN ---
  getAccountRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'accounts'),
  getAccountDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'accounts', id),

  getAccounts: async (): Promise<Account[]> => {
    const q = query(financeService.getAccountRef(), orderBy('code', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  },

  subscribeToAccounts: (callback: (accounts: Account[]) => void): Unsubscribe => {
    const q = query(financeService.getAccountRef(), orderBy('code', 'asc'));
    return onSnapshot(q, (snap) => {
      const accounts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      callback(accounts);
    }, (error) => {
      console.warn("[FINANCE] Izin akses akun/accounts ditolak atau dibatasi:", error.message);
    });
  },

  addAccount: async (data: Omit<Account, 'id'>) => {
    const docRef = await addDoc(financeService.getAccountRef(), { ...data, createdAt: Date.now() });
    return docRef.id;
  },

  updateAccount: async (id: string, data: Partial<Account>) => {
    await updateDoc(financeService.getAccountDoc(id), { ...data, updatedAt: Date.now() });
  },

  updateAccountBalance: async (accountId: string, amount: number) => {
    await updateDoc(financeService.getAccountDoc(accountId), { balance: increment(amount) });
  },

  // FUNGSI BARU: Penyesuaian Saldo Kas dengan Audit Trail (Jurnal)
  adjustAccountBalance: async (accountId: string, accountName: string, amount: number, note: string, date: string) => {
    const batch = writeBatch(db);
    
    // 1. Update saldo secara langsung
    batch.update(financeService.getAccountDoc(accountId), { balance: increment(amount) });
    
    // 2. Siapkan akun Ekuitas (Modal Awal) sebagai lawan transaksi
    const ekuitasAcc = await financeService.ensureSystemAccount('EKUITAS' as any, 'Modal Awal / Penyesuaian Saldo', '3-1010');

    // 3. Catat Riwayat Jurnal
    const journalRef = doc(financeService.getJournalRef());
    batch.set(journalRef, {
      date: date,
      referenceType: 'PENYESUAIAN_KAS',
      referenceId: `ADJ-${Date.now()}`,
      description: `Penyesuaian Manual: ${note}`,
      entries: [
        { accountId: accountId, accountName: accountName, type: amount >= 0 ? 'DEBIT' : 'KREDIT', amount: Math.abs(amount) }, 
        { accountId: ekuitasAcc.id, accountName: ekuitasAcc.name, type: amount >= 0 ? 'KREDIT' : 'DEBIT', amount: Math.abs(amount) } 
      ],
      isReconciled: true,
      createdAt: Date.now()
    });

    await batch.commit();
    return true;
  },

  deleteAccount: async (id: string) => {
    await deleteDoc(financeService.getAccountDoc(id));
  },

  transferFunds: async (sourceAccountId: string, sourceName: string, destAccountId: string, destName: string, amount: number, note: string, date: string) => {
    const batch = writeBatch(db);
    batch.update(financeService.getAccountDoc(sourceAccountId), { balance: increment(-amount) });
    batch.update(financeService.getAccountDoc(destAccountId), { balance: increment(amount) });
    
    const journalRef = doc(financeService.getJournalRef());
    batch.set(journalRef, {
      date: date,
      referenceType: 'TRANSFER_KAS',
      referenceId: `TRF-${Date.now()}`,
      description: `Mutasi Kas: ${note}`,
      entries: [
        { accountId: destAccountId, accountName: destName, type: 'DEBIT', amount: amount }, 
        { accountId: sourceAccountId, accountName: sourceName, type: 'KREDIT', amount: amount } 
      ],
      isReconciled: false,
      createdAt: Date.now()
    });

    await batch.commit();
    return true;
  },

  ensureSystemAccount: async (type: Account['type'], defaultName: string, defaultCode: string): Promise<{ id: string, name: string }> => {
    const q = query(financeService.getAccountRef(), where('type', '==', type), where('isSystem', '==', true), limit(1));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      return { id: snap.docs[0].id, name: snap.docs[0].data().name };
    }

    const fallbackData: Omit<Account, 'id'> = {
      code: defaultCode,
      name: defaultName,
      type: type,
      accountBehavior: 'TRANSACTION',
      level: 1,
      parentId: null,
      balance: 0,
      isSystem: true,
      createdAt: Date.now()
    };

    const docRef = await addDoc(financeService.getAccountRef(), fallbackData);
    return { id: docRef.id, name: defaultName };
  },

  // --- BUKU BESAR & JURNAL ---
  getJournalRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'journals'),
  getJournalDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'journals', id),

  subscribeToJournals: (callback: (journals: Journal[]) => void, maxLimit: number = 1000): Unsubscribe => {
    const q = query(financeService.getJournalRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
    return onSnapshot(q, (snap) => {
      const journals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
      callback(journals);
    }, (error) => {
      console.warn("[FINANCE] Izin akses jurnal/journals ditolak atau dibatasi:", error.message);
    });
  },

  reconcileTransaction: async (journalId: string) => {
    await updateDoc(financeService.getJournalDoc(journalId), { isReconciled: true, updatedAt: Date.now() });
    return true;
  },

  addAutoJournal: async (
    referenceType: 'INVOICE' | 'EXPENSE' | 'TRANSFER_KAS' | 'PENYESUAIAN_KAS', 
    referenceId: string, 
    description: string, 
    entries: {accountId: string, accountName: string, type: 'DEBIT' | 'KREDIT', amount: number}[]
  ) => {
    const totalDebit = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
    const totalKredit = entries.filter(e => e.type === 'KREDIT').reduce((sum, e) => sum + e.amount, 0);
    
    if (totalDebit !== totalKredit) {
      throw new Error("Sistem menolak jurnal karena Debit dan Kredit tidak seimbang.");
    }

    await addDoc(financeService.getJournalRef(), {
      date: new Date().toISOString().split('T')[0],
      referenceType,
      referenceId,
      description,
      entries,
      isReconciled: false,
      createdAt: Date.now()
    });
  },

  // --- MANAJEMEN ANGGARAN ---
  getBudgetRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'budgets'),
  getBudgetDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'budgets', id),

  subscribeToBudgets: (callback: (budgets: Budget[]) => void): Unsubscribe => {
    const q = query(financeService.getBudgetRef(), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const budgets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      callback(budgets);
    }, (error) => {
      console.warn("[FINANCE] Izin akses anggaran/budgets ditolak atau dibatasi:", error.message);
    });
  },
};