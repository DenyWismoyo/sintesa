import { useState, useEffect } from 'react';
import { Expense, Account, Journal } from '@/types';
import { financeService } from '@/services/finance.service';

export function useFinance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribeExpenses = financeService.subscribeToExpenses((data) => setExpenses(data));
    const unsubscribeAccounts = financeService.subscribeToAccounts((data) => setAccounts(data));
    const unsubscribeJournals = financeService.subscribeToJournals((data) => {
      setJournals(data); setLoading(false);
    });
    return () => { unsubscribeExpenses(); unsubscribeAccounts(); unsubscribeJournals(); };
  }, []);

  const createNewExpense = async (data: Omit<Expense, 'id'>, file: File | null) => {
    try {
      let receiptUrl = '';
      if (file) receiptUrl = await financeService.uploadReceipt(file);
      const newId = await financeService.addExpense({ ...data, receiptUrl });
      return { success: true, id: newId };
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const updateExpenseStatus = async (expense: Expense, newStatus: Expense['status']) => {
    try {
      await financeService.updateExpense(expense.id!, { status: newStatus });
      const sourceAccountName = accounts.find(a => a.id === expense.sourceAccountId)?.name || 'Kas/Bank';
      const hutangAcc = await financeService.ensureSystemAccount('HUTANG', 'Hutang Usaha (YMH Dibayar)', '2-1020');

      if (newStatus === 'APPROVED') {
          await financeService.addAutoJournal('EXPENSE', expense.id!, `Persetujuan Beban #${expense.expenseNumber}`, [
            { accountId: expense.categoryId, accountName: expense.categoryName, type: 'DEBIT', amount: expense.amount },
            { accountId: hutangAcc.id, accountName: hutangAcc.name, type: 'KREDIT', amount: expense.amount }
          ]);
      } else if (newStatus === 'PAID') {
          await financeService.addAutoJournal('EXPENSE', expense.id!, `Pencairan Dana Beban #${expense.expenseNumber}`, [
            { accountId: hutangAcc.id, accountName: hutangAcc.name, type: 'DEBIT', amount: expense.amount },
            { accountId: expense.sourceAccountId, accountName: sourceAccountName, type: 'KREDIT', amount: expense.amount }
          ]);
          await financeService.updateAccountBalance(expense.sourceAccountId, -expense.amount);
      } else if (newStatus === 'CANCELLED' && expense.status === 'APPROVED') {
          await financeService.addAutoJournal('EXPENSE', expense.id!, `[REVERSAL] Batal Persetujuan #${expense.expenseNumber}`, [
            { accountId: hutangAcc.id, accountName: hutangAcc.name, type: 'DEBIT', amount: expense.amount },
            { accountId: expense.categoryId, accountName: expense.categoryName, type: 'KREDIT', amount: expense.amount }
          ]);
      }
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const createAccount = async (data: Omit<Account, 'id'>) => {
    try { const newId = await financeService.addAccount(data); return { success: true, id: newId }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    try { await financeService.updateAccount(id, data); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const deleteAccount = async (id: string) => {
    try { await financeService.deleteAccount(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  const transferKas = async (sourceId: string, sourceName: string, destId: string, destName: string, amount: number, note: string, date: string) => {
    try { await financeService.transferFunds(sourceId, sourceName, destId, destName, amount, note, date); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  // FUNGSI BARU: Penyesuaian Saldo Kas
  const adjustBalance = async (accountId: string, accountName: string, amount: number, note: string, date: string) => {
    try { 
      await financeService.adjustAccountBalance(accountId, accountName, amount, note, date); 
      return { success: true }; 
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const reconcile = async (journalId: string) => {
    try { await financeService.reconcileTransaction(journalId); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; }
  };

  return { 
    expenses, accounts, journals, loading, error, 
    createNewExpense, updateExpenseStatus, 
    createAccount, updateAccount, deleteAccount, 
    transferKas, adjustBalance, reconcile 
  };
}