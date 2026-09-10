'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, CheckCircle, Clock, Plus, AlertCircle, QrCode, Building, Loader2, CreditCard, ChevronRight, Landmark, FileText, PieChart, Copy, XCircle, Check, Link as LinkIcon } from 'lucide-react';
import { Invoice, Account } from '@/types';

// IMPORT FUNGSI CETAK PDF ASLI
import { downloadInvoicePDF } from './PrintInvoiceLayout';

interface ModalProps {
  invoice: Invoice | null;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onAddPayment?: (invoice: Invoice) => void;
  onVerifyPending?: (invoice: Invoice, historyItem: any) => void; 
  onRejectPending?: (invoice: Invoice, historyId: string) => void; 
  onQRISPayment?: (invoiceId: string, amount: number) => Promise<void>;
  onCancelInvoice?: (invoice: Invoice, reason: string) => Promise<void>;
  onDuplicateInvoice?: (invoice: Invoice) => void;
  onOpenKwitansi?: (invoice: Invoice) => void; 
}

export default function ModalInvoiceDetail({ invoice, accounts, isOpen, onClose, onAddPayment, onVerifyPending, onRejectPending, onQRISPayment, onCancelInvoice, onDuplicateInvoice, onOpenKwitansi }: ModalProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showQRIS, setShowQRIS] = useState(false);
  const [isProcessingQRIS, setIsProcessingQRIS] = useState(false);
  
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !invoice) return null;

  // --- LOGIKA MULTI-REKENING ---
  let activePaymentAccounts: any[] = [];
  if (invoice.paymentAccounts && invoice.paymentAccounts.length > 0) {
    activePaymentAccounts = invoice.paymentAccounts;
  } else if (invoice.paymentBankName && invoice.paymentAccountNumber) {
    activePaymentAccounts = [{ bankName: invoice.paymentBankName, accountNumber: invoice.paymentAccountNumber, accountHolder: invoice.paymentAccountHolder }];
  } else {
    const receivingAccounts = accounts?.filter(a => a.type === 'KAS_BANK' && a.isReceivingAccount);
    if (receivingAccounts && receivingAccounts.length > 0) {
      activePaymentAccounts = receivingAccounts.map(a => ({ bankName: a.bankName || a.name, accountNumber: a.accountNumber, accountHolder: a.accountHolder }));
    } else {
      const defaultAcc = accounts?.find(a => a.type === 'KAS_BANK' && a.accountNumber);
      if (defaultAcc) {
        activePaymentAccounts = [{ bankName: defaultAcc.bankName || defaultAcc.name, accountNumber: defaultAcc.accountNumber, accountHolder: defaultAcc.accountHolder }];
      }
    }
  }

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // PERBAIKAN: Fungsi Export PDF sekarang memanggil script rendering aslinya (Tidak ada alert dummy lagi)
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Memanggil fungsi download dari PrintInvoiceLayout
      await downloadInvoicePDF(invoice.invoiceNumber, () => {
        setIsExporting(false);
      });
    } catch (error) {
      console.error("Error cetak PDF:", error);
      setIsExporting(false);
      alert("Terjadi kesalahan saat memproses PDF. Silakan coba lagi.");
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { alert("Harap masukkan alasan pembatalan untuk riwayat sistem."); return; }
    setIsCancelling(true);
    if (onCancelInvoice) await onCancelInvoice(invoice, cancelReason);
    setIsCancelling(false);
    setShowCancelPrompt(false);
  };

  const handleSimulateQRIS = async () => {
    if (!onQRISPayment || !invoice || !invoice.id) return;
    setIsProcessingQRIS(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await onQRISPayment(invoice.id, invoice.remainingAmount); 
      setShowQRIS(false);
    } catch (error) { alert("Gagal memproses pembayaran QRIS."); } 
    finally { setIsProcessingQRIS(false); }
  };

  const handleCopyPaymentLink = () => {
    const baseUrl = window.location.origin;
    const paymentLink = `${baseUrl}/bukti-bayar?inv=${encodeURIComponent(invoice.invoiceNumber)}`;
    
    const messageTemplate = `Halo Bapak/Ibu dari *${invoice.customerName}*,

Berikut kami informasikan rincian tagihan (Invoice) dari Solo Technopark:

No. Invoice  : *${invoice.invoiceNumber}*
Jatuh Tempo  : *${invoice.dueDate}*
Sisa Tagihan : *${formatRupiah(invoice.remainingAmount)}*

Harap melakukan pembayaran dan mengunggah bukti transfer melalui tautan berikut:
${paymentLink}

Terima kasih atas kerja sama dan kepercayaannya.

Salam hangat,
*Solo Technopark (BLUD)*`;

    const textArea = document.createElement("textarea");
    textArea.value = messageTemplate;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin teks', err);
      alert('Gagal menyalin tautan. Silakan coba lagi.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_BLUD_STP_${invoice.invoiceNumber}_AMOUNT_${invoice.remainingAmount}`;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle className="w-5 h-5"/>, label: 'Lunas' };
      case 'PARTIAL': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <PieChart className="w-5 h-5"/>, label: 'Dicicil (Sebagian)' };
      case 'PENDING': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="w-5 h-5"/>, label: 'Menunggu Pembayaran' };
      case 'OVERDUE': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="w-5 h-5"/>, label: 'Jatuh Tempo' };
      case 'CANCELLED': return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: <X className="w-5 h-5"/>, label: 'Dibatalkan' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: <Receipt className="w-5 h-5"/>, label: status };
    }
  };

  const statusStyle = getStatusStyle(invoice.status);
  const hasSuccessfulPayments = invoice.history?.some((h: any) => h.status === 'SUCCESS');

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] print:hidden" 
          />

          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[75] w-full max-w-[1300px] h-full bg-slate-50 shadow-2xl flex flex-col md:flex-row overflow-hidden border-l border-slate-200 print:hidden"
          >
            
            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar flex justify-center items-start bg-slate-100/50">
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 relative w-full max-w-3xl min-h-full overflow-hidden">
                
                {invoice.status === 'PAID' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                    <span className="text-[120px] font-black text-emerald-900 transform -rotate-45 tracking-widest">LUNAS</span>
                  </div>
                )}
                {invoice.status === 'CANCELLED' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                    <span className="text-[100px] font-black text-red-900 transform -rotate-45 tracking-widest">BATAL</span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                    <div className="flex items-center gap-5">
                      <img src="/image/LogoInvoice.png" alt="Logo" className="w-16 h-16 object-contain shrink-0" />
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SOLO TECHNOPARK</h1>
                        <p className="text-sm text-slate-500 font-bold mt-1">Badan Layanan Umum Daerah (BLUD)</p>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Jl. Ki Hajar Dewantara No.19, Surakarta</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Invoice</h2>
                      <p className="font-mono text-slate-500 text-sm font-bold mt-2 bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-100">{invoice.invoiceNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ditagihkan Kepada:</p>
                      <p className="font-black text-xl text-slate-900 leading-tight">{invoice.customerName}</p>
                      <p className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 inline-block px-2.5 py-1 rounded-md mt-2">{invoice.customerType}</p>
                      <div className="mt-3 space-y-1 text-sm font-medium text-slate-500">
                        {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
                        {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col justify-start items-end">
                      <table className="text-sm text-right">
                        <tbody>
                          <tr><td className="text-slate-400 py-1.5 pr-6 font-bold text-xs uppercase tracking-wider">Tanggal Terbit:</td><td className="font-bold text-slate-800 py-1.5">{invoice.date}</td></tr>
                          <tr><td className="text-slate-400 py-1.5 pr-6 font-bold text-xs uppercase tracking-wider">Jatuh Tempo:</td><td className="font-bold text-slate-800 py-1.5">{invoice.dueDate}</td></tr>
                          <tr><td className="text-slate-400 py-1.5 pr-6 font-bold text-xs uppercase tracking-wider">Skema Tagihan:</td><td className="font-bold text-slate-800 py-1.5 capitalize">{invoice.term.replace('_', ' ').toLowerCase()}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="px-5 py-4">Deskripsi Layanan</th>
                          <th className="px-5 py-4 text-center w-20">Qty</th>
                          <th className="px-5 py-4 text-right w-40">Harga Satuan</th>
                          <th className="px-5 py-4 text-right w-40">Total Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((item, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="px-5 py-4 font-semibold text-slate-800">{item.description}</td>
                              <td className="px-5 py-4 text-center font-medium text-slate-600">{item.quantity}</td>
                              <td className="px-5 py-4 text-right font-medium text-slate-600">{formatRupiah(item.unitPrice)}</td>
                              <td className="px-5 py-4 text-right font-bold text-slate-900">{formatRupiah(item.total)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm italic">Rincian item kosong.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                    <div className="w-full lg:w-1/2 space-y-5">
                      {invoice.notes && (
                        <div className="p-5 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">
                          <span className="font-bold text-slate-800 block mb-2">Catatan Tambahan:</span>
                          <span className="whitespace-pre-line leading-relaxed">{invoice.notes}</span>
                        </div>
                      )}
                      
                      {invoice.remainingAmount > 0 && invoice.status !== 'CANCELLED' && activePaymentAccounts.length > 0 && (
                        <div className="space-y-3">
                          <span className="font-bold text-slate-800 block mb-1">Instruksi Pembayaran:</span>
                          <div className="flex flex-col gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {activePaymentAccounts.map((acc, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-blue-600 shrink-0 border border-slate-100 shadow-sm">
                                  <Landmark className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden flex flex-col justify-center">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{acc.bankName || 'Bank'}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-slate-800 tracking-wider font-mono leading-none">{acc.accountNumber}</p>
                                    <p className="text-[11px] font-semibold text-slate-400 leading-none truncate">(a.n {acc.accountHolder || '-'})</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-5/12 text-sm border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between font-medium text-slate-500 px-2"><span>Subtotal</span><span className="font-semibold">{formatRupiah(invoice.subTotal)}</span></div>
                        {invoice.taxAmount > 0 && <div className="flex justify-between font-medium text-slate-500 px-2"><span>PPN (11%)</span><span className="font-semibold">{formatRupiah(invoice.taxAmount)}</span></div>}
                        {invoice.discountAmount > 0 && <div className="flex justify-between font-medium text-slate-500 px-2"><span>Diskon</span><span className="font-semibold">- {formatRupiah(invoice.discountAmount)}</span></div>}
                      </div>
                      
                      <div className="my-4 border-t border-slate-200"></div>

                      <div className="flex justify-between items-center text-slate-900 font-black text-xl px-2">
                        <span>Total Tagihan</span><span>{formatRupiah(invoice.totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between text-emerald-600 font-bold text-sm mt-4 px-2">
                        <span>Telah Dibayar</span><span>- {formatRupiah(invoice.paidAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl font-black mt-4 shadow-inner">
                        <span className="text-slate-600 text-sm uppercase tracking-wider">Sisa Bayar</span>
                        <span className={`text-xl ${invoice.remainingAmount > 0 ? "text-slate-900" : "text-emerald-600"}`}>{formatRupiah(invoice.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 relative z-20">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <div>
                  <h3 className="font-black text-slate-800 text-base">Pusat Kendali</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">Manajemen & Aksi Transaksi</p>
                </div>
                <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-8 border-b border-slate-100 flex flex-col items-start bg-slate-50/50">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Saat Ini</p>
                   <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} shadow-sm`}>
                  {statusStyle.icon}
                  {statusStyle.label}
               </div>
            </div>

            <div className="p-6 space-y-4 border-b border-slate-100 bg-white">
              
              {/* TOMBOL CETAK PDF YANG SUDAH DIPERBAIKI (TIDAK ADA ALERT MOCK LAGI) */}
              <button onClick={handleExportPDF} disabled={isExporting} className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group disabled:opacity-70 disabled:cursor-not-allowed">
                <div className="flex items-center gap-3">
                  {isExporting ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />}
                  {isExporting ? 'Memproses Dokumen...' : 'Cetak Invoice (PDF)'}
                </div>
                {!isExporting && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              {/* LOGIKA CETAK KWITANSI YANG SUDAH BENAR TERSAMBUNG KE onOpenKwitansi */}
              {hasSuccessfulPayments && onOpenKwitansi && (
                 <button onClick={() => onOpenKwitansi(invoice)} className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm group">
                   <div className="flex items-center gap-3">
                     <Receipt className="w-5 h-5 text-emerald-500 group-hover:text-emerald-700 transition-colors" /> Cetak Kwitansi Tanda Terima
                   </div>
                   <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
                 </button>
              )}
              
              <button onClick={() => onDuplicateInvoice && onDuplicateInvoice(invoice)} className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group">
                <div className="flex items-center gap-3"><Copy className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" /> Duplikat Tagihan</div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {invoice.remainingAmount > 0 && invoice.status !== 'CANCELLED' && (
                    <>
                      <button 
                        onClick={handleCopyPaymentLink}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          {copiedLink ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />} 
                          {copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Bayar Publik'}
                        </div>
                        {!copiedLink && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-transform" />}
                      </button>

                      {onAddPayment && (
                         <button 
                           onClick={() => { if (invoice.id) onAddPayment(invoice); }} 
                           className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 group mt-4"
                         >
                           <div className="flex items-center gap-3"><Plus className="w-5 h-5" /> Catat Pembayaran Manual</div>
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                         </button>
                      )}

                      <div className="pt-2">
                        <button onClick={() => setShowQRIS(!showQRIS)} className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3"><QrCode className="w-4 h-4 text-slate-500" /> Tampilkan Layar QRIS</div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-white rounded-md border border-slate-200">{showQRIS ? 'Tutup' : 'Buka'}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {['PENDING', 'OVERDUE'].includes(invoice.status) && invoice.paidAmount === 0 && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setShowCancelPrompt(!showCancelPrompt)} 
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors shadow-sm group"
                      >
                        <div className="flex items-center gap-3"><XCircle className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" /> Batalkan Tagihan</div>
                      </button>
                      
                      {showCancelPrompt && (
                        <div className="mt-3 p-4 bg-white border border-red-200 rounded-xl space-y-3 animate-in slide-in-from-top-2 shadow-lg">
                          <label className="text-xs font-bold text-red-700 block">Alasan Pembatalan Tagihan:</label>
                          <textarea 
                            value={cancelReason} 
                            onChange={e => setCancelReason(e.target.value)} 
                            rows={2} 
                            className="w-full text-sm p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 bg-slate-50" 
                            placeholder="Contoh: Kesalahan input nominal, Klien membatalkan..."
                          ></textarea>
                          <div className="flex gap-2">
                            <button onClick={() => setShowCancelPrompt(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleCancelSubmit} disabled={isCancelling} className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex justify-center items-center transition-colors">
                              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Konfirmasi Batal'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {showQRIS && (
                    <div className="mt-4 p-5 border border-indigo-100 bg-indigo-50/50 rounded-2xl flex flex-col items-center text-center space-y-4 animate-in slide-in-from-top-2">
                      <p className="text-[11px] font-medium text-indigo-700">Scan dari aplikasi M-Banking atau Dompet Digital pelanggan.</p>
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <img src={qrisUrl} alt="QRIS Code" className="w-40 h-40 object-contain" />
                      </div>
                      <div className="w-full">
                        <p className="text-[10px] text-indigo-400 uppercase font-black mb-0.5 tracking-wider">Tagihan Otomatis</p>
                        <p className="text-xl font-black text-indigo-900">{formatRupiah(invoice.remainingAmount)}</p>
                      </div>
                      <button onClick={handleSimulateQRIS} disabled={isProcessingQRIS} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70 mt-2">
                        {isProcessingQRIS ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {isProcessingQRIS ? 'Memproses...' : 'Simulasi Pembayaran Masuk'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 bg-white">
                  <h3 className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Aktivitas & Bukti Transfer
                  </h3>
                  
                  <div className="space-y-4">
                    {invoice.history && invoice.history.length > 0 ? (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-4">
                        {invoice.history.map((hist: any) => (
                          <div key={hist.id} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-[3px] bg-white ${hist.status === 'PENDING' ? 'border-amber-400 animate-pulse' : hist.status === 'FAILED' ? 'border-red-400' : 'border-emerald-500'}`}></div>
                            <div className="group">
                              <div className="flex justify-between items-start mb-1">
                                <p className={`font-black text-sm ${hist.status === 'FAILED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{formatRupiah(hist.amount)}</p>
                                <span className="text-[9px] px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-bold uppercase tracking-wider">{hist.method}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mt-1">
                                <Clock className="w-3 h-3"/> {hist.date}
                              </div>
                              
                              {hist.status === 'PENDING' && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                                  <p className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Menunggu Verifikasi Anda</p>
                                  {hist.receiptUrl && hist.receiptUrl !== '#' && (
                                    <a href={hist.receiptUrl} target="_blank" rel="noreferrer" className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg mb-3 hover:underline">
                                       Cek Bukti Gambar / PDF ↗
                                    </a>
                                  )}
                                  <div className="flex gap-2">
                                    <button onClick={() => onVerifyPending && onVerifyPending(invoice, hist)} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors"><Check className="w-3.5 h-3.5"/> Terima</button>
                                    <button onClick={() => onRejectPending && onRejectPending(invoice, hist.id)} className="flex-1 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-50 transition-colors"><XCircle className="w-3.5 h-3.5"/> Tolak</button>
                                  </div>
                                </div>
                              )}

                              {hist.status === 'SUCCESS' && hist.receiptUrl && hist.receiptUrl !== '#' && (
                                <a href={hist.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline mt-2">Lihat Resi Lampiran ↗</a>
                              )}
                              
                              {hist.status === 'FAILED' && (
                                <p className="text-[10px] font-bold text-red-500 mt-1">Bukti Ditolak / Tidak Valid</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <p className="text-sm font-bold text-slate-500">Belum Ada Riwayat Transaksi</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}