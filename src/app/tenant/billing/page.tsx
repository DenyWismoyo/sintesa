'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Invoice, formatRupiah } from '@/types';
import { Receipt, CheckCircle, Clock, QrCode, X, Loader2, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TenantBillingPage() {
  const { user } = useAuth();
  const appId = getAppId();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showQRIS, setShowQRIS] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) return;
    const invoicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invoices');
    const unsubscribe = onSnapshot(invoicesRef, (snapshot) => {
      const fetchedInvoices: Invoice[] = [];
      snapshot.forEach(doc => {
        const inv = { id: doc.id, ...doc.data() } as Invoice;
        if (inv.customerEmail === user.email || (!inv.customerEmail && inv.customerType === 'Tenant')) {
          fetchedInvoices.push(inv);
        }
      });
      fetchedInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInvoices(fetchedInvoices);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, appId]);

  const handleSimulatePayment = async () => {
    if (!selectedInvoice || !selectedInvoice.id) return;
    setIsProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const paymentAmount = selectedInvoice.remainingAmount;
      const newHistory = { id: Date.now().toString(), date: new Date().toLocaleString('id-ID'), amount: paymentAmount, method: 'QRIS', status: 'SUCCESS' as const };
      const updatedData = { paidAmount: selectedInvoice.paidAmount + paymentAmount, remainingAmount: 0, status: 'PAID', history: [...(selectedInvoice.history || []), newHistory] };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', selectedInvoice.id), updatedData);
      setSelectedInvoice({ ...selectedInvoice, ...updatedData } as Invoice);
      setShowQRIS(false);
    } catch (error) {
      alert("Gagal memproses pembayaran.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const activeBills = invoices.filter(i => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(i.status)).length;

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* Header Widget */}
      <div className="bg-slate-900 rounded-[2rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4 border border-white/10">
            <CreditCard size={14} /> Finance Center
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Tagihan Operasional</h1>
          <p className="text-slate-300 text-base max-w-lg">Cek rincian invoice fasilitas dan lunasi kewajiban bulanan Anda dengan cepat melalui QRIS terintegrasi.</p>
        </div>
        <div className="relative z-10 bg-white/10 p-6 rounded-[1.5rem] border border-white/20 backdrop-blur-md text-center min-w-[180px] shadow-inner">
          <p className="text-xs text-slate-300 uppercase tracking-widest font-black mb-1">Tagihan Aktif</p>
          <p className="text-5xl font-black text-white">{activeBills}</p>
        </div>
      </div>

      {/* Grid Invoices */}
      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-emerald-500" /></div>
      ) : invoices.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 py-24 flex flex-col items-center justify-center text-center px-4 w-full">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6"><Receipt size={40} /></div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Belum Ada Tagihan</h3>
          <p className="text-slate-500 text-base max-w-md">Anda tidak memiliki riwayat tagihan saat ini. Pekerjaan yang bagus!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((inv) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col relative overflow-hidden group">
              {inv.status === 'PAID' && <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center"><CheckCircle size={40} className="text-emerald-500/20 translate-x-2 translate-y-2"/></div>}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{inv.term}</p>
                  <h3 className="font-bold text-slate-900 text-lg">{inv.invoiceNumber}</h3>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                  ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                    inv.status === 'PARTIAL' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                    inv.status === 'OVERDUE' ? 'bg-red-50 text-red-600 border-red-200' : 
                    'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  {inv.status}
                </span>
              </div>
              
              <div className="flex-1 mb-6">
                <p className="text-sm font-semibold text-slate-600 line-clamp-1 mb-1">{inv.items && inv.items.length > 0 ? inv.items[0].description : 'Layanan Operasional'}</p>
                <p className="text-xs text-slate-400">Jatuh Tempo: <span className="font-bold text-slate-600">{inv.dueDate}</span></p>
              </div>

              <div className="border-t border-slate-100 pt-5 flex items-end justify-between mt-auto">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-xl font-black text-slate-800">{formatRupiah(inv.totalAmount)}</p>
                </div>
                <button 
                  onClick={() => { setSelectedInvoice(inv); setShowQRIS(false); }}
                  className="bg-slate-900 hover:bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md group-hover:scale-110"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal / Slide-over Receipt Style */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pt-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedInvoice(null)} />
            
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#FDFDFD] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            >
              {/* Header Receipt */}
              <div className="px-8 py-6 bg-white border-b-2 border-dashed border-slate-200 flex items-center justify-between shrink-0 relative">
                <div className="absolute left-0 bottom-[-10px] w-5 h-5 bg-slate-900/60 sm:bg-transparent rounded-full -ml-2.5"></div>
                <div className="absolute right-0 bottom-[-10px] w-5 h-5 bg-slate-900/60 sm:bg-transparent rounded-full -mr-2.5"></div>
                
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Receipt Invoice</h2>
                  <p className="text-lg font-black text-slate-900 font-mono">{selectedInvoice.invoiceNumber}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={18} /></button>
              </div>

              {/* Body Receipt (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                
                {/* Items List */}
                <div className="space-y-4 mb-8">
                  {selectedInvoice.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm font-mono">
                      <div className="pr-4">
                        <p className="font-bold text-slate-800">{item.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.quantity} x {formatRupiah(item.unitPrice)}</p>
                      </div>
                      <p className="font-bold text-slate-800 shrink-0">{formatRupiah(item.total)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-slate-200 pt-6 space-y-3 text-sm font-mono">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatRupiah(selectedInvoice.subTotal)}</span></div>
                  {selectedInvoice.taxAmount > 0 && <div className="flex justify-between text-slate-500"><span>PPN (11%)</span><span>{formatRupiah(selectedInvoice.taxAmount)}</span></div>}
                  {selectedInvoice.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>Diskon</span><span>- {formatRupiah(selectedInvoice.discountAmount)}</span></div>}
                  <div className="flex justify-between items-center text-slate-900 pt-4 border-t border-slate-200 font-black text-xl mt-4">
                    <span>TOTAL</span><span>{formatRupiah(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>

                {/* Info & Status Area */}
                <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Status Pembayaran</span>
                    <span className={`px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-widest ${selectedInvoice.remainingAmount > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                      {selectedInvoice.remainingAmount > 0 ? 'Belum Lunas' : 'LUNAS'}
                    </span>
                  </div>
                  {selectedInvoice.history && selectedInvoice.history.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Riwayat Transaksi</p>
                      {selectedInvoice.history.map(h => (
                        <div key={h.id} className="flex justify-between text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                          <span className="flex items-center gap-1.5"><CheckCircle size={12}/> {h.date}</span>
                          <span className="font-bold">{formatRupiah(h.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* QRIS Area */}
                <AnimatePresence>
                  {showQRIS && selectedInvoice.remainingAmount > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 flex flex-col items-center overflow-hidden">
                      <div className="p-4 bg-white border-2 border-dashed border-blue-300 rounded-2xl flex flex-col items-center w-full">
                        <p className="text-xs font-bold text-blue-600 mb-4 uppercase tracking-widest">Scan QRIS Berikut</p>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_${selectedInvoice.invoiceNumber}_${selectedInvoice.remainingAmount}`} alt="QRIS" className="w-48 h-48 object-contain mb-5" />
                        <button onClick={handleSimulatePayment} disabled={isProcessingPayment} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 shadow-lg disabled:opacity-70">
                          {isProcessingPayment ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck size={18} />}
                          {isProcessingPayment ? 'Memverifikasi...' : 'Simulasi: Saya Sudah Bayar'}
                        </button>
                        <button onClick={() => setShowQRIS(false)} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600">Batal Scan</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Spacing for sticky footer */}
                <div className="h-6"></div>
              </div>

              {/* Sticky Payment Bar (Footer) */}
              {selectedInvoice.remainingAmount > 0 && !showQRIS && (
                <div className="bg-white border-t border-slate-100 p-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500">Sisa Tagihan</span>
                    <span className="text-2xl font-black text-blue-600">{formatRupiah(selectedInvoice.remainingAmount)}</span>
                  </div>
                  <button onClick={() => setShowQRIS(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 text-base">
                    <QrCode size={20} /> Bayar via QRIS
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}