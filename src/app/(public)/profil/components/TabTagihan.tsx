// Lokasi file: src/app/profil/components/TabTagihan.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { billingService } from '@/services/billing.service';
import { formatRupiah } from '@/types';
import { Receipt, Calendar as CalendarIcon, AlertTriangle, ArrowRight, Loader2, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Building, Landmark, UploadCloud, ExternalLink } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function TabTagihan({ userEmail }: { userEmail: string }) {
  // Menggunakan fungsi yang dikembalikan dari useBilling
  const { invoices, loading, error, updateInvoice } = useBilling(userEmail);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [proofAmount, setProofAmount] = useState('');
  const [proofMethod, setProofMethod] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Efek untuk sinkronisasi state modal jika data invoices berubah di background
  useEffect(() => {
    if (selectedInvoice && invoices) {
      const updated = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updated) setSelectedInvoice(updated);
    }
  }, [invoices, selectedInvoice]);

  const openDetailModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setProofAmount('');
    setProofMethod('');
    setProofFile(null);
    setIsModalOpen(true);
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofAmount || !proofMethod || !proofFile) {
      toast.error("Harap lengkapi nominal, metode, dan file bukti transfer.");
      return;
    }

    if (Number(proofAmount) > selectedInvoice.remainingAmount) {
      toast.error("Nominal melebihi sisa tagihan.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Mengunggah bukti pembayaran...");

    try {
      // 1. Upload file ke Storage
      const receiptUrl = await billingService.uploadReceipt(proofFile);

      // 2. Buat object history baru dengan status PENDING
      const newHistoryItem = {
        id: `proof-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: Number(proofAmount),
        method: proofMethod,
        status: 'PENDING',
        receiptUrl: receiptUrl
      };

      // 3. Tambahkan ke history invoice yang ada
      const updatedHistory = [...(selectedInvoice.history || []), newHistoryItem];
      
      await updateInvoice(selectedInvoice.id, {
        history: updatedHistory
      });

      toast.success("Bukti berhasil dikirim! Menunggu verifikasi admin.", { id: toastId });
      setProofAmount('');
      setProofMethod('');
      setProofFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah bukti pembayaran.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500 h-8 w-8 md:h-10 md:w-10" /></div>;
  if (error) return <div className="py-12 text-center text-red-500 text-sm md:text-base font-bold bg-red-50 rounded-2xl">{error}</div>;

  const processedInvoices = invoices.map(inv => ({ ...inv, isVerifying: inv.history && inv.history.some((h: any) => h.status === 'PENDING') }));
  const pendingInvoices = processedInvoices.filter(i => (i.status === 'PENDING' || i.status === 'PARTIAL') && !i.isVerifying);
  const verifyingInvoices = processedInvoices.filter(i => i.isVerifying && i.status !== 'PAID');
  const paidInvoices = processedInvoices.filter(i => i.status === 'PAID');

  const getStatusBadge = (status: string, isVerifying?: boolean) => {
    if (status === 'PAID') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold uppercase tracking-wider text-[9px] md:text-[10px] px-2 py-0.5 md:py-1">Lunas</Badge>;
    if (status === 'CANCELLED') return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-bold uppercase tracking-wider text-[9px] md:text-[10px] px-2 py-0.5 md:py-1">Dibatalkan</Badge>;
    if (isVerifying) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold uppercase tracking-wider text-[9px] md:text-[10px] px-2 py-0.5 md:py-1">Sedang Diverifikasi</Badge>;
    if (status === 'PARTIAL') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold uppercase tracking-wider text-[9px] md:text-[10px] px-2 py-0.5 md:py-1">Dicicil (Parsial)</Badge>;
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none font-bold uppercase tracking-wider text-[9px] md:text-[10px] px-2 py-0.5 md:py-1">Belum Dibayar</Badge>;
  };

  const InvoiceList = ({ items, emptyMessage }: { items: any[], emptyMessage: string }) => {
    if (items.length === 0) return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] border border-dashed border-slate-200 p-8 md:p-12 text-center mt-3 w-full">
        <Receipt className="h-10 w-10 md:h-12 md:w-12 text-slate-300 mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-bold text-slate-700 mb-1">Tidak Ada Tagihan</h3>
        <p className="text-xs md:text-sm text-slate-500">{emptyMessage}</p>
      </motion.div>
    );

    return (
      <motion.div className="flex flex-col gap-3 mt-3" variants={staggerContainer} initial="hidden" animate="visible">
        {items.map((invoice: any) => (
          <motion.div key={invoice.id} variants={fadeUpVariants} className="bg-white border border-slate-200/80 rounded-2xl md:rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 group cursor-pointer" onClick={() => openDetailModal(invoice)}>
            <div className="flex items-start gap-3 md:gap-4 flex-grow min-w-0">
               <div className="shrink-0 mt-0.5">
                 {invoice.status === 'PAID' ? <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><CheckCircle2 size={18} className="md:w-5 md:h-5" /></div> : invoice.isVerifying ? <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><Clock size={18} className="md:w-5 md:h-5" /></div> : <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100"><AlertCircle size={18} className="md:w-5 md:h-5" /></div>}
               </div>
               <div className="flex-grow min-w-0">
                 <div className="flex flex-wrap items-center gap-2 mb-1">
                   <h3 className="text-sm md:text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{invoice.items && invoice.items.length > 0 ? invoice.items[0].description : 'Layanan KST'}</h3>
                   {getStatusBadge(invoice.status, invoice.isVerifying)}
                 </div>
                 <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-[10px] md:text-[11px] text-slate-500 font-medium">
                   <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{invoice.invoiceNumber}</span>
                   <span className="hidden sm:inline-block text-slate-300">•</span>
                   <span>Dibuat: {invoice.date}</span>
                   {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                     <>
                        <span className="hidden sm:inline-block text-slate-300">•</span>
                        <span className={(invoice.status === 'PENDING' || invoice.status === 'PARTIAL') && !invoice.isVerifying ? 'text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded' : ''}>Tempo: {invoice.dueDate}</span>
                     </>
                   )}
                 </div>
               </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:pl-4 sm:border-l sm:border-slate-100 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
               <div className="text-left sm:text-right">
                 <p className={`text-base md:text-lg font-black tracking-tight ${invoice.status === 'PAID' ? 'text-emerald-700' : 'text-slate-900'}`}>{formatRupiah(invoice.totalAmount)}</p>
                 <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Tagihan</p>
               </div>
               <Button variant="ghost" className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 h-8 md:h-10 font-bold shrink-0 text-[11px] md:text-xs">Detail <ArrowUpRight className="ml-1.5 h-3 w-3" /></Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5 md:mb-6">
        <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Tagihan & Pembayaran</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 md:mt-1.5 leading-relaxed">Kelola dan selesaikan kewajiban administrasi untuk seluruh layanan KST yang Anda gunakan.</p>
      </div>

      <div className="flex-shrink-0 w-full overflow-x-auto pb-1 custom-scrollbar mb-1">
        <Tabs defaultValue="semua" className="w-full">
          <TabsList className="bg-slate-50 border border-slate-200/80 p-1 md:p-1.5 rounded-lg md:rounded-xl flex h-auto w-max sm:w-full max-w-2xl shadow-sm">
            <TabsTrigger value="semua" className="rounded-md md:rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Semua</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-md md:rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all">Tertagih</TabsTrigger>
            <TabsTrigger value="verifying" className="rounded-md md:rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-md transition-all">Verifikasi</TabsTrigger>
            <TabsTrigger value="paid" className="rounded-md md:rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all">Lunas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="semua" className="mt-0 focus-visible:outline-none"><InvoiceList items={processedInvoices} emptyMessage="Anda belum pernah melakukan pemesanan layanan." /></TabsContent>
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none"><InvoiceList items={pendingInvoices} emptyMessage="Tidak ada tagihan yang tertunggak saat ini." /></TabsContent>
          <TabsContent value="verifying" className="mt-0 focus-visible:outline-none"><InvoiceList items={verifyingInvoices} emptyMessage="Tidak ada tagihan yang sedang menunggu verifikasi." /></TabsContent>
          <TabsContent value="paid" className="mt-0 focus-visible:outline-none"><InvoiceList items={paidInvoices} emptyMessage="Belum ada riwayat tagihan yang berstatus lunas." /></TabsContent>
        </Tabs>
      </div>

      {/* MODAL DETAIL & UPLOAD BUKTI */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] md:max-w-[700px] w-[95vw] p-0 overflow-hidden bg-[#F8FAFC] rounded-2xl md:rounded-[1.5rem] border border-slate-200/60 shadow-2xl max-h-[90vh] flex flex-col">
          
          <div className="relative p-5 md:p-8 bg-white m-1.5 md:m-2 rounded-xl md:rounded-[1.25rem] border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar">
            
            {/* Watermark Lunas */}
            {selectedInvoice?.status === 'PAID' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden">
                <span className="text-[60px] md:text-[100px] font-black text-emerald-900 transform -rotate-45 tracking-widest select-none">LUNAS</span>
              </div>
            )}

            <div className="relative z-10">
              {/* Header Mini Invoice */}
              <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-5">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0">
                     <Building className="w-4 h-4 md:w-5 md:h-5" />
                   </div>
                   <div>
                     <h2 className="text-sm md:text-lg font-black text-slate-900 tracking-tight">SOLO TECHNOPARK</h2>
                     <p className="text-slate-500 font-mono text-[10px] md:text-xs font-bold">{selectedInvoice?.invoiceNumber}</p>
                   </div>
                 </div>
                 <div className="text-right">
                    {getStatusBadge(selectedInvoice?.status, selectedInvoice?.isVerifying)}
                 </div>
              </div>

              {/* Info Detail Pelanggan & Waktu */}
              <div className="grid grid-cols-2 gap-4 md:gap-6 mb-5 text-sm">
                 <div>
                   <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Ditagihkan Kepada</p>
                   <p className="font-black text-slate-900 text-xs md:text-sm">{selectedInvoice?.customerName}</p>
                   {selectedInvoice?.customerEmail && <p className="text-slate-500 mt-0.5 text-[10px] md:text-xs truncate">{selectedInvoice.customerEmail}</p>}
                 </div>
                 <div className="text-right space-y-1.5 md:space-y-2">
                   <div>
                     <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tanggal Terbit</p>
                     <p className="font-semibold text-slate-800 text-[11px] md:text-xs">{selectedInvoice?.date}</p>
                   </div>
                   <div>
                     <p className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Jatuh Tempo</p>
                     <p className="font-semibold text-red-700 text-[11px] md:text-xs">{selectedInvoice?.dueDate}</p>
                   </div>
                 </div>
              </div>

              {/* Tabel Item Rincian */}
              <div className="mb-5 rounded-lg md:rounded-xl overflow-x-auto border border-slate-200 shadow-sm">
                <table className="w-full text-[10px] md:text-xs text-left border-collapse min-w-[400px]">
                  <thead className="bg-slate-50 text-slate-500 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Deskripsi Layanan</th>
                      <th className="px-3 py-2 text-center w-10 md:w-12">Qty</th>
                      <th className="px-3 py-2 text-right">Harga</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 font-semibold text-slate-800">{item.description}</td>
                        <td className="px-3 py-2 text-center font-medium text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-600 whitespace-nowrap">{formatRupiah(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 whitespace-nowrap">{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ringkasan Biaya */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-5 md:gap-6">
                <div className="w-full md:w-1/2">
                   {selectedInvoice?.notes && (
                     <div className="p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl text-[10px] md:text-xs text-slate-600 border border-slate-100 mb-3 md:mb-4">
                       <span className="font-bold text-slate-800 block mb-1">Catatan:</span>
                       <span className="whitespace-pre-line leading-relaxed">{selectedInvoice.notes}</span>
                     </div>
                   )}
                   {selectedInvoice?.remainingAmount > 0 && selectedInvoice?.status !== 'CANCELLED' && (
                     <div className="p-2.5 md:p-3 border border-slate-200 bg-white rounded-lg md:rounded-xl flex items-center gap-3 shadow-sm">
                       <div className="p-1.5 md:p-2 bg-slate-100 rounded-md md:rounded-lg text-slate-600">
                         <Landmark className="w-3 h-3 md:w-4 md:h-4" />
                       </div>
                       <div>
                         <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tujuan Pembayaran</p>
                         <p className="text-[11px] md:text-xs font-black text-slate-800 tracking-wider">1-034-56789-0</p>
                         <p className="text-[8px] md:text-[9px] font-semibold text-slate-500">Bank Jateng a.n BLUD KST</p>
                       </div>
                     </div>
                   )}
                </div>
                
                <div className="w-full md:w-1/2 text-[10px] md:text-xs">
                   <div className="space-y-1 md:space-y-1.5 mb-2 md:mb-3">
                     <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold">{formatRupiah(selectedInvoice?.subTotal)}</span></div>
                     {selectedInvoice?.taxAmount > 0 && <div className="flex justify-between text-slate-500"><span>PPN (11%)</span><span className="font-semibold">{formatRupiah(selectedInvoice?.taxAmount)}</span></div>}
                     {selectedInvoice?.discountAmount > 0 && <div className="flex justify-between text-slate-500"><span>Diskon</span><span className="font-semibold">- {formatRupiah(selectedInvoice?.discountAmount)}</span></div>}
                   </div>
                   <div className="flex justify-between items-center text-slate-900 font-black text-sm md:text-base border-t border-slate-100 pt-2">
                     <span>Total Keseluruhan</span><span>{formatRupiah(selectedInvoice?.totalAmount)}</span>
                   </div>
                   <div className="flex justify-between text-emerald-600 font-bold text-[10px] md:text-xs mt-1 md:mt-1.5">
                     <span>Telah Dibayar (Valid)</span><span>- {formatRupiah(selectedInvoice?.paidAmount)}</span>
                   </div>
                   
                   <div className={`flex justify-between items-center p-2.5 md:p-3 rounded-lg md:rounded-xl font-black mt-3 shadow-inner ${selectedInvoice?.remainingAmount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
                     <span className="text-slate-600 text-[9px] md:text-[10px] uppercase tracking-wider">Sisa Pembayaran</span>
                     <span className={`text-sm md:text-base ${selectedInvoice?.remainingAmount > 0 ? "text-amber-700" : "text-emerald-600"}`}>{formatRupiah(selectedInvoice?.remainingAmount)}</span>
                   </div>
                </div>
              </div>

              {/* SEKSI BARU: RIWAYAT PEMBAYARAN & UPLOAD BUKTI */}
              <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-slate-200">
                <h3 className="text-[11px] md:text-xs font-black text-slate-800 mb-2 md:mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-500" /> Riwayat Transaksi & Bukti Pembayaran
                </h3>

                {/* List Riwayat */}
                {selectedInvoice?.history && selectedInvoice.history.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {selectedInvoice.history.map((hist: any) => (
                      <div key={hist.id} className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl">
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] md:text-xs">{formatRupiah(hist.amount)}</p>
                          <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5">{hist.date} • TF: {hist.method}</p>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          {hist.status === 'PENDING' ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 text-center">Menunggu<br className="sm:hidden"/> Validasi</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 text-center">Valid /<br className="sm:hidden"/> Diterima</Badge>
                          )}
                          {hist.receiptUrl && hist.receiptUrl !== '#' && (
                            <a href={hist.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md md:rounded-lg transition-colors shrink-0" title="Lihat Bukti Upload">
                              <ExternalLink size={12} className="md:w-3.5 md:h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] md:text-[10px] text-slate-500 italic mb-3 md:mb-4">Belum ada riwayat pembayaran yang tercatat.</p>
                )}

                {/* Form Upload */}
                {selectedInvoice?.remainingAmount > 0 && selectedInvoice?.status !== 'CANCELLED' && (
                  <form onSubmit={handleUploadProof} className="bg-white border border-blue-100 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h4 className="text-[11px] md:text-xs font-bold text-slate-800 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                       <UploadCloud className="w-3 h-3 text-blue-500" /> Konfirmasi / Cicilan Pembayaran Baru
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                      <div>
                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-1 block">Nominal Ditransfer</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] md:text-xs font-bold">Rp</span>
                          <input type="number" required max={selectedInvoice.remainingAmount} value={proofAmount} onChange={e => setProofAmount(e.target.value)} className="w-full pl-7 pr-2.5 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-1 block">Bank Pengirim</label>
                        <input type="text" required value={proofMethod} onChange={e => setProofMethod(e.target.value)} className="w-full px-2.5 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: BCA a.n Budi" />
                      </div>
                    </div>
                    
                    <div className="mb-2.5 md:mb-3">
                       <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-1 block">Upload Struk (JPG, PNG, PDF)</label>
                       <input type="file" required accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} className="w-full text-[10px] md:text-xs text-slate-500 file:mr-2 file:py-1 md:file:py-1.5 file:px-2 md:file:px-3 file:rounded-md file:border-0 file:text-[9px] md:file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-md md:rounded-lg bg-slate-50" />
                    </div>

                    <Button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md md:rounded-lg h-8 md:h-9 font-bold text-[11px] md:text-xs">
                      {isUploading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : 'Kirim Bukti Pembayaran'}
                    </Button>
                  </form>
                )}
              </div>

            </div>
          </div>

          {/* Footer Info Pemantauan */}
          <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-3 mt-auto shrink-0">
            <div className="flex items-center gap-2 text-slate-300 text-[9px] md:text-[10px] font-medium leading-tight">
               <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 shrink-0" />
               <p>Pembaruan status dilakukan oleh Admin secara manual. <br className="hidden sm:block"/>Tunggu 1x24 jam kerja setelah bukti diunggah.</p>
            </div>
            <DialogClose asChild>
               <Button className="bg-white text-slate-900 hover:bg-slate-200 rounded-md md:rounded-lg font-bold shrink-0 text-[10px] md:text-xs h-7 md:h-8 px-3">Tutup Detail</Button>
            </DialogClose>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}