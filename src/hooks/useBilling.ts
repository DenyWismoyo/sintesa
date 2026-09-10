'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import { financeService } from '@/services/finance.service';
import { Invoice, PaymentHistory } from '@/types';

export function useBilling(userEmail?: string | null) {
  const queryClient = useQueryClient();

  const isMutationOnly = userEmail === 'MUTATION_ONLY'; 
  const isPublicUser = userEmail !== undefined && userEmail !== 'MUTATION_ONLY'; 
  const isAdmin = userEmail === undefined; 

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMutationOnly) { setLoading(false); return; }
    setLoading(true); setError(null);
    let unsubscribe: () => void;

    try {
      if (isAdmin) {
        unsubscribe = billingService.subscribeToInvoices((data) => { setInvoices(data); setLoading(false); });
      } else if (isPublicUser && userEmail) {
        unsubscribe = billingService.subscribeToMyInvoices(userEmail, (data) => { setInvoices(data); setLoading(false); });
      } else {
         setLoading(false);
      }
    } catch (err: any) { setError(err.message); setLoading(false); }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isAdmin, isPublicUser, userEmail, isMutationOnly]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: Omit<Invoice, 'id'>) => {
      const newId = await billingService.createInvoice(data);
      const piutangAcc = await financeService.ensureSystemAccount('PIUTANG', 'Piutang Usaha', '1-1020');
      const defIncomeAcc = await financeService.ensureSystemAccount('HUTANG', 'Pendapatan Belum Dialokasikan', '2-1010'); 

      await financeService.addAutoJournal('INVOICE', newId, `Penerbitan Tagihan #${data.invoiceNumber}`, [
        { accountId: piutangAcc.id, accountName: piutangAcc.name, type: 'DEBIT', amount: data.totalAmount },
        { accountId: defIncomeAcc.id, accountName: defIncomeAcc.name, type: 'KREDIT', amount: data.totalAmount }
      ]);
      return newId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Invoice> }) => billingService.updateInvoice(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => billingService.deleteInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ id, invoiceData, amount, accountId, accountName, file, pendingHistoryId }: { id: string, invoiceData: Invoice, amount: number, accountId: string, accountName: string, file: File | null, pendingHistoryId?: string }) => {
      
      let updatedHistory = [...(invoiceData.history || [])];
      let receiptUrl = '#';

      if (file) {
        receiptUrl = await billingService.uploadReceipt(file);
      }

      if (pendingHistoryId) {
         updatedHistory = updatedHistory.map(h => {
           if (h.id === pendingHistoryId) {
             return { ...h, status: 'SUCCESS', method: accountName, amount: amount, receiptUrl: file ? receiptUrl : h.receiptUrl };
           }
           return h;
         });
      } else {
         updatedHistory.push({
           id: Date.now().toString(),
           date: new Date().toLocaleString('id-ID'),
           amount,
           method: accountName,
           status: 'SUCCESS',
           receiptUrl
         });
      }
      
      const newPaidAmount = invoiceData.paidAmount + amount;
      const newRemaining = invoiceData.totalAmount - newPaidAmount;
      let newStatus = invoiceData.status;
      if (newRemaining <= 0) newStatus = 'PAID';
      else if (newPaidAmount > 0) newStatus = 'PARTIAL';

      const piutangAcc = await financeService.ensureSystemAccount('PIUTANG', 'Piutang Usaha', '1-1020');
      
      await billingService.addPaymentBatch(
        id, 
        updatedHistory,
        amount, 
        newPaidAmount, 
        newRemaining, 
        newStatus, 
        accountId, 
        accountName, 
        piutangAcc
      );

      if (newStatus === 'PAID') {
        await billingService.syncBackToOrigin({ ...invoiceData, status: 'PAID' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const allocateInvoiceMutation = useMutation({
    mutationFn: async ({ id, invoiceNumber, amount, coaId, coaName }: { id: string, invoiceNumber: string, amount: number, coaId: string, coaName: string }) => {
      await billingService.updateInvoice(id, { isAllocated: true, allocatedCoaId: coaId, allocatedCoaName: coaName });
      const defIncomeAcc = await financeService.ensureSystemAccount('HUTANG', 'Pendapatan Belum Dialokasikan', '2-1010'); 

      await financeService.addAutoJournal('INVOICE', id, `Alokasi BAS Pendapatan Tagihan #${invoiceNumber}`, [
        { accountId: defIncomeAcc.id, accountName: defIncomeAcc.name, type: 'DEBIT', amount: amount },
        { accountId: coaId, accountName: coaName, type: 'KREDIT', amount: amount }
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const generatePaymentLinkMutation = useMutation({
    mutationFn: ({ id, url }: { id: string, url: string }) => billingService.updatePaymentLink(id, url),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });

  const createNewInvoice = async (data: Omit<Invoice, 'id'>) => { try { const newId = await createInvoiceMutation.mutateAsync(data); return { success: true, id: newId }; } catch (err: any) { return { success: false, error: err.message }; } };
  
  const updateInvoice = async (id: string, data: Partial<Invoice>, originalInvoice?: Invoice) => { 
    try { 
      if (data.status === 'CANCELLED' && originalInvoice) {
         if (originalInvoice.paidAmount > 0) throw new Error("Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dibatalkan. Silakan gunakan prosedur Refund manual.");
         const piutangAcc = await financeService.ensureSystemAccount('PIUTANG', 'Piutang Usaha', '1-1020');
         const defIncomeAcc = await financeService.ensureSystemAccount('HUTANG', 'Pendapatan Belum Dialokasikan', '2-1010'); 
         await financeService.addAutoJournal('INVOICE', id, `[REVERSAL] Batal Tagihan #${originalInvoice.invoiceNumber}`, [
            { accountId: defIncomeAcc.id, accountName: defIncomeAcc.name, type: 'DEBIT', amount: originalInvoice.totalAmount },
            { accountId: piutangAcc.id, accountName: piutangAcc.name, type: 'KREDIT', amount: originalInvoice.totalAmount }
         ]);
      }
      await updateInvoiceMutation.mutateAsync({ id, data }); 
      return { success: true }; 
    } catch (err: any) { return { success: false, error: err.message }; } 
  };

  const deleteInvoice = async (id: string) => { 
    try { await deleteInvoiceMutation.mutateAsync(id); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; } 
  };

  const updatePaymentLink = async (id: string, url: string) => { try { await generatePaymentLinkMutation.mutateAsync({ id, url }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; } };
  
  const recordPayment = async (invoiceId: string, invoiceData: Invoice, amount: number, accountId: string, accountName: string, file: File | null, pendingHistoryId?: string) => { 
    try { await addPaymentMutation.mutateAsync({ id: invoiceId, invoiceData, amount, accountId, accountName, file, pendingHistoryId }); return { success: true }; } 
    catch (err: any) { return { success: false, error: err.message }; } 
  };
  
  const allocateInvoice = async (id: string, invoiceNumber: string, amount: number, coaId: string, coaName: string) => {
    try { await allocateInvoiceMutation.mutateAsync({ id, invoiceNumber, amount, coaId, coaName }); return { success: true }; }
    catch (err: any) { return { success: false, error: err.message }; }
  };

  return { invoices, loading, error, createNewInvoice, updateInvoice, deleteInvoice, updatePaymentLink, recordPayment, allocateInvoice };
}