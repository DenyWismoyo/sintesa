'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Store, CalendarRange, UserCheck, AlertCircle, ShoppingCart, Copy, Hash, Edit2, CheckCircle2, Save, Landmark } from 'lucide-react';
import { Invoice, InvoiceItem, PaymentTerm, Account } from '@/types';

// Import hooks asli milik Anda
import { useCatalog } from '@/hooks/useCatalog';
import { useTenants } from '@/hooks/useTenants';
import { useAssets } from '@/hooks/useAssets';     
import { useTraining } from '@/hooks/useTraining'; 
import { useAuth } from '@/lib/AuthContext';
// TAMBAHAN: Import hook useFinance untuk memanggil data rekening secara mandiri
import { useFinance } from '@/hooks/useFinance';

interface ModalFormInvoiceProps {
  onClose: () => void;
  onSubmit: (data: Partial<Invoice>) => Promise<void>;
  initialData?: Invoice | null;
  invoices?: Invoice[]; 
  accounts?: Account[]; 
}

const ISSUER_CACHE_KEY = 'billing_invoice_issuer_cache';

export default function ModalFormInvoice({ onClose, onSubmit, initialData, invoices = [], accounts = [] }: ModalFormInvoiceProps) {
  const { products } = useCatalog();
  const { tenants } = useTenants();
  const { assets } = useAssets();      
  const { trainings } = useTraining(); 
  const { role } = useAuth();
  
  // TAMBAHAN: Mengambil data akun/rekening secara langsung dari database
  const { accounts: fetchedAccounts } = useFinance(); 
  
  // LOGIKA: Jika halaman luar tidak mengirim data accounts, gunakan data yang kita ambil sendiri
  const activeAccounts = accounts.length > 0 ? accounts : fetchedAccounts;

  const [isVisible, setIsVisible] = useState(true);

  const rentableAssets = assets.filter(a => a.isRentable || (a.priceValue && a.priceValue > 0));

  const [loading, setLoading] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  
  const [paymentConfig, setPaymentConfig] = useState({ dpAmount: 0, installmentCount: 2, subscriptionPeriod: 'Bulanan' });
  
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [{ id: Date.now().toString(), referenceType: 'CUSTOM', description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );
  
  const [formData, setFormData] = useState<Partial<Invoice>>({
    customerType: initialData?.customerType || 'Tenant',
    customerName: initialData?.customerName || '',
    customerEmail: initialData?.customerEmail || '', 
    customerPhone: initialData?.customerPhone || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    term: initialData?.term || 'FULL_PAYMENT',
    notes: initialData?.notes || '',
    discountAmount: initialData?.discountAmount || 0,
    invoiceNumber: initialData?.invoiceNumber || '', 
    
    issuerName: initialData?.issuerName || '', 
    issuerRole: initialData?.issuerRole || (role === 'KASIR' ? 'Bendahara Penerimaan' : 'Petugas BLUD'),
    issuerNIP: initialData?.issuerNIP || '',

    paymentAccounts: initialData?.paymentAccounts || (
      initialData?.paymentBankName 
        ? [{ bankName: initialData.paymentBankName, accountNumber: initialData.paymentAccountNumber!, accountHolder: initialData.paymentAccountHolder! }] 
        : []
    ),
  });

  const [invoiceCategoryCode, setInvoiceCategoryCode] = useState('UMUM');
  const [isManualInvoiceNumber, setIsManualInvoiceNumber] = useState(!!(initialData && initialData.id));
  const [invoiceNumberError, setInvoiceNumberError] = useState('');

  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = 0; 
  const totalAmount = subTotal + taxAmount - (formData.discountAmount || 0);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  };

  useEffect(() => {
    if (!initialData || !initialData.id) {
      try {
        const cachedData = localStorage.getItem(ISSUER_CACHE_KEY);
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          setFormData(prev => ({
            ...prev,
            issuerName: parsedCache.issuerName || prev.issuerName,
            issuerRole: parsedCache.issuerRole || prev.issuerRole,
            issuerNIP: parsedCache.issuerNIP || prev.issuerNIP,
            paymentAccounts: parsedCache.paymentAccounts && parsedCache.paymentAccounts.length > 0 
                ? parsedCache.paymentAccounts 
                : prev.paymentAccounts
          }));
        }
      } catch (error) {
        console.error("Gagal membaca cache penandatangan:", error);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (items.length > 0 && !initialData?.id) {
      const type = items[0].referenceType;
      if (['BOOKING', 'TARIFF_DAY', 'TARIFF_MONTH'].includes(type)) setInvoiceCategoryCode('BOOK');
      else if (type === 'TRAINING') setInvoiceCategoryCode('TRN');
      else if (type === 'CATALOG') setInvoiceCategoryCode('PROD');
      else setInvoiceCategoryCode('UMUM');
    }
  }, [items, initialData]);

  useEffect(() => {
    if (isManualInvoiceNumber && initialData?.id) return;
    const dateObj = new Date(formData.date || Date.now());
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateString = `${yyyy}${mm}${dd}`;

    const prefix = `INV/${invoiceCategoryCode}/${dateString}/`;
    let maxSequence = 0;
    const sameCategoryInvoices = invoices.filter(inv => inv.invoiceNumber?.startsWith(`INV/${invoiceCategoryCode}/`));
    
    sameCategoryInvoices.forEach(inv => {
      const parts = inv.invoiceNumber.split('/');
      const lastPart = parts[parts.length - 1];
      const seq = parseInt(lastPart, 10);
      if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
    });

    const nextSequence = String(maxSequence + 1).padStart(4, '0');
    const newInvoiceNumber = `${prefix}${nextSequence}`;

    if (!isManualInvoiceNumber) {
      setFormData(prev => ({ ...prev, invoiceNumber: newInvoiceNumber }));
      setInvoiceNumberError('');
    }
  }, [invoiceCategoryCode, formData.date, invoices, isManualInvoiceNumber, initialData]);

  useEffect(() => {
    if (isManualInvoiceNumber && formData.invoiceNumber) {
      const isDuplicate = invoices.some(inv => inv.invoiceNumber === formData.invoiceNumber && inv.id !== initialData?.id);
      if (isDuplicate) setInvoiceNumberError('Nomor Invoice ini sudah digunakan di transaksi lain!');
      else setInvoiceNumberError('');
    }
  }, [formData.invoiceNumber, isManualInvoiceNumber, invoices, initialData]);

  useEffect(() => {
    if (formData.term === 'DOWN_PAYMENT' && paymentConfig.dpAmount === 0 && totalAmount > 0) {
      setPaymentConfig(prev => ({ ...prev, dpAmount: totalAmount * 0.3 }));
    }
  }, [formData.term, totalAmount]);

  const handleAddItem = () => setItems([...items, { id: Date.now().toString(), referenceType: 'CUSTOM', description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const handleRemoveItem = (id: string) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'description' && ['CATALOG', 'TARIFF_DAY', 'TRAINING'].includes(item.referenceType)) {
           updatedItem.referenceType = 'CUSTOM';
           updatedItem.referenceId = undefined;
        }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSmartSelect = (itemId: string, sourceType: string, sourceId: string) => {
    if (!sourceId) return;
    setItems(items.map(item => {
      if (item.id === itemId) {
        let description = ''; let unitPrice = 0; let refType: any = 'CUSTOM';
        if (sourceType === 'ASSET') {
          const asset = rentableAssets.find(a => a.id === sourceId);
          if (asset) { description = `Sewa Ruangan: ${asset.name}`; unitPrice = asset.priceValue || 0; refType = 'TARIFF_DAY'; }
        } else if (sourceType === 'CATALOG') {
          const product = products.find(p => p.id === sourceId);
          if (product) { description = product.name; unitPrice = product.price || 0; refType = 'CATALOG'; }
        } else if (sourceType === 'TRAINING') {
          const training = trainings.find(t => t.id === sourceId);
          if (training) { description = `Pelatihan: ${training.title}`; unitPrice = training.price || 0; refType = 'TRAINING'; }
        }
        return { ...item, referenceType: refType, referenceId: sourceId, description, unitPrice, total: item.quantity * unitPrice };
      }
      return item;
    }));
  };

  const getSelectValue = (item: InvoiceItem) => {
    if (!item.referenceId && item.referenceType !== 'BOOKING') return 'CUSTOM::';
    if (item.referenceType === 'TARIFF_DAY') return `ASSET::${item.referenceId}`;
    if (item.referenceType === 'CATALOG') return `CATALOG::${item.referenceId}`;
    if (item.referenceType === 'TRAINING') return `TRAINING::${item.referenceId}`;
    if (item.referenceType === 'BOOKING') return `BOOKING::${item.referenceId || 'auto'}`; 
    return 'CUSTOM::';
  };

  const getDetectedUnit = (item: InvoiceItem) => {
    if (item.referenceType === 'TARIFF_DAY' && item.referenceId) return rentableAssets.find(a => a.id === item.referenceId)?.pricingType || 'Unit';
    if (item.referenceType === 'TRAINING') return 'Peserta';
    if (item.referenceType === 'BOOKING') {
        const descLower = item.description.toLowerCase();
        if (descLower.includes('jam')) return 'Jam';
        if (descLower.includes('hari')) return 'Hari';
        return 'Durasi'; 
    }
    return 'Satuan';
  };

  const toggleBankAccount = (acc: Account) => {
    const currentAccounts = formData.paymentAccounts || [];
    const exists = currentAccounts.find(p => p.accountNumber === acc.accountNumber);
    if (exists) {
      setFormData({ ...formData, paymentAccounts: currentAccounts.filter(p => p.accountNumber !== acc.accountNumber) });
    } else {
      setFormData({ 
        ...formData, 
        paymentAccounts: [...currentAccounts, { 
          bankName: acc.bankName || acc.name, 
          accountNumber: acc.accountNumber!, 
          accountHolder: acc.accountHolder || '-' 
        }] 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber) { alert("Nomor Invoice tidak boleh kosong!"); return; }
    if (invoiceNumberError) { alert("Harap perbaiki duplikasi Nomor Invoice sebelum menyimpan."); return; }

    setLoading(true);

    try {
      const cacheData = {
        issuerName: formData.issuerName,
        issuerRole: formData.issuerRole,
        issuerNIP: formData.issuerNIP,
        paymentAccounts: formData.paymentAccounts 
      };
      localStorage.setItem(ISSUER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Gagal menyimpan cache penandatangan:", error);
    }

    let autoNotes = '';
    if (formData.term === 'DOWN_PAYMENT') autoNotes = `[SKEMA DP] Nominal uang muka (DP) yang disepakati: Rp ${paymentConfig.dpAmount.toLocaleString('id-ID')}\n`;
    else if (formData.term === 'INSTALLMENT') {
        const estimasi = Math.round(totalAmount / paymentConfig.installmentCount);
        autoNotes = `[SKEMA CICILAN] Total Termin: ${paymentConfig.installmentCount} Kali Pembayaran\nEstimasi per termin: Rp ${estimasi.toLocaleString('id-ID')}\n`;
    } else if (formData.term === 'SUBSCRIPTION') autoNotes = `[LANGGANAN] Siklus Tagihan: ${paymentConfig.subscriptionPeriod}\n`;

    const cleanNotes = (formData.notes || '').replace(/\[SKEMA.*?\].*\n/g, '').replace(/\[LANGGANAN.*?\].*\n/g, '');
    const isNewInvoice = !initialData || !initialData.id;

    const finalData: Partial<Invoice> = { 
      ...formData, notes: autoNotes + cleanNotes, items, subTotal, taxAmount, totalAmount,
      ...(isNewInvoice ? { status: 'PENDING', paidAmount: 0, remainingAmount: totalAmount } : {})
    };
    
    await onSubmit(finalData);
    setLoading(false);
    handleClose(); 
  };

  const filteredTenants = tenants.filter(t => t.status === 'Aktif' && t.name.toLowerCase().includes(tenantSearch.toLowerCase())).slice(0, 10);

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelClass = "text-xs font-bold text-slate-700 mb-1.5 block";

  // MENDAPATKAN DAFTAR BANK YANG VALID MENGGUNAKAN DATA YANG DIAMBIL MANDIRI
  const validBankAccounts = activeAccounts.filter(a => 
    a.type === 'KAS_BANK' && 
    a.accountBehavior !== 'HEADER' && 
    a.accountNumber && 
    a.accountNumber.trim() !== ''
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]" 
          />
          
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[75] w-full max-w-[1300px] h-full bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-200"
          >
            
            <div className="px-8 py-5 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                   {initialData && !initialData.id ? <Copy className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-slate-800 tracking-tight">
                     {initialData ? (initialData.id ? `Revisi Tagihan` : `Duplikat Tagihan Baru`) : 'Penerbitan Tagihan (Invoice)'}
                   </h2>
                   <p className="text-sm text-slate-500 font-medium mt-0.5">
                     {initialData ? (initialData.id ? `Ref ID: ${initialData.invoiceNumber}` : `Menyalin kerangka dari tagihan sebelumnya.`) : 'Lengkapi detail penagihan di bawah ini untuk dikirim.'}
                   </p>
                 </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-slate-50/50">
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                  
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0 hidden md:flex">
                        <Hash className="w-5 h-5"/>
                      </div>
                      
                      <div className="border-r-0 md:border-r border-slate-200 pr-0 md:pr-5 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Prefix Kategori</label>
                        <select 
                          value={invoiceCategoryCode} 
                          onChange={(e) => setInvoiceCategoryCode(e.target.value)}
                          disabled={isManualInvoiceNumber}
                          className="w-full md:w-auto text-sm font-bold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <option value="BOOK">BOOK (Fasilitas)</option>
                          <option value="TRN">TRN (Pelatihan)</option>
                          <option value="PROD">PROD (Produk)</option>
                          <option value="UMUM">UMUM (Lainnya)</option>
                        </select>
                      </div>

                      <div className="w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Nomor Invoice Generasi</label>
                        {isManualInvoiceNumber ? (
                          <input 
                            type="text" 
                            value={formData.invoiceNumber} 
                            onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value.toUpperCase()})}
                            className={`text-base font-black outline-none border-b-2 bg-transparent w-full md:w-64 ${invoiceNumberError ? 'border-red-500 text-red-600' : 'border-blue-500 text-slate-800'}`}
                            placeholder="Cth: INV/BOOK/20260304/2993"
                            autoFocus
                          />
                        ) : (
                          <span className="text-base font-black text-slate-800 tracking-wide block mt-1">{formData.invoiceNumber || 'Memuat...'}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex justify-end">
                      {!isManualInvoiceNumber ? (
                        <button type="button" onClick={() => setIsManualInvoiceNumber(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-full md:w-auto">
                          <Edit2 className="w-3.5 h-3.5"/> Edit Manual
                        </button>
                      ) : (
                        <button type="button" onClick={() => { setIsManualInvoiceNumber(false); setInvoiceNumberError(''); }} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors w-full md:w-auto">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Selesai Edit
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {invoiceNumberError && (
                     <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1 -translate-y-4"><AlertCircle className="w-3 h-3"/> {invoiceNumberError}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                       <div className="flex justify-between items-center mb-5">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><UserCheck className="w-4 h-4 text-slate-400"/> Info Pelanggan</h3>
                          <select 
                            value={formData.customerType} 
                            onChange={(e) => setFormData({...formData, customerType: e.target.value as any, customerName: ''})} 
                            className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 outline-none cursor-pointer"
                          >
                            <option value="Umum">Umum / Luar</option>
                            <option value="Tenant">Startup / Tenant</option>
                          </select>
                       </div>

                       <div className="space-y-4">
                          {formData.customerType === 'Tenant' ? (
                            <div className="relative">
                              <label className={labelClass}>Cari Database Tenant</label>
                              <input 
                                type="text" placeholder="Ketik nama startup..." value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} 
                                className={inputClass}
                              />
                              {tenantSearch && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto p-1">
                                   {filteredTenants.map(t => (
                                     <div key={t.id} onClick={() => { setFormData(prev => ({...prev, customerName: t.name, customerEmail: t.email||'', customerPhone: t.contact||''})); setTenantSearch(''); }}
                                       className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                     >
                                       <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                                       <p className="text-xs text-slate-500 font-medium">{t.contact || t.email}</p>
                                     </div>
                                   ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className={labelClass}>Nama Instansi / Perorangan *</label>
                              <input 
                                type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                                className={inputClass} placeholder="Cth: PT. Maju Bersama" required 
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Email Address</label>
                              <input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} className={inputClass} placeholder="opsional@email.com" />
                            </div>
                            <div>
                              <label className={labelClass}>No. WhatsApp</label>
                              <input type="text" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} className={inputClass} placeholder="0812..." />
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-5">
                       <div>
                        <label className={`${labelClass} flex items-center gap-1.5`}><CalendarRange className="w-4 h-4 text-blue-500"/> Tanggal Terbit Tagihan</label>
                        <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={inputClass} required />
                       </div>
                       <div>
                        <label className={`${labelClass} flex items-center gap-1.5 text-red-600`}><AlertCircle className="w-4 h-4"/> Batas Akhir Pembayaran (Tempo)</label>
                        <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" required />
                       </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Store className="w-4 h-4 text-slate-400"/> Rincian Biaya & Layanan</h3>
                      <button type="button" onClick={handleAddItem} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Tambah Baris
                      </button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const unitLabel = getDetectedUnit(item);
                        const isAutoBooking = item.referenceType === 'BOOKING';
                        
                        return (
                        <div key={item.id} className={`p-5 rounded-2xl flex flex-col gap-4 transition-colors ${isAutoBooking ? 'bg-amber-50/50 border border-amber-200' : 'bg-white border border-slate-200 shadow-sm'}`}>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">{index + 1}</div>
                            <div className="flex-1">
                               <select 
                                 value={getSelectValue(item)}
                                 onChange={(e) => {
                                   const [type, sourceId] = e.target.value.split('::');
                                   if (type === 'CUSTOM') {
                                     handleItemChange(item.id, 'referenceType', 'CUSTOM');
                                     handleItemChange(item.id, 'referenceId', undefined);
                                   } else if (type !== 'BOOKING') {
                                     handleSmartSelect(item.id, type, sourceId);
                                   }
                                 }}
                                 className={`w-full max-w-xs px-3 py-1.5 text-xs font-bold border rounded-lg outline-none cursor-pointer ${isAutoBooking ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                               >
                                 <option value="CUSTOM::">-- Input Tagihan Manual --</option>
                                 {isAutoBooking && <option value={`BOOKING::${item.referenceId || 'auto'}`}>✔ Data Otomatis dari Booking</option>}
                                 {rentableAssets.length > 0 && <optgroup label="Sewa Ruangan (Otomatis)">{rentableAssets.map(a => (<option key={`ASSET-${a.id}`} value={`ASSET::${a.id}`}>{a.name} - Rp {a.priceValue?.toLocaleString('id-ID')}</option>))}</optgroup>}
                                 {products.length > 0 && <optgroup label="E-Katalog Produk">{products.filter(p => p.isPublished).map(p => (<option key={`CATALOG-${p.id}`} value={`CATALOG::${p.id}`}>{p.name}</option>))}</optgroup>}
                                 {trainings.length > 0 && <optgroup label="Pelatihan Edukasi">{trainings.map(t => (<option key={`TRAINING-${t.id}`} value={`TRAINING::${t.id}`}>{t.title}</option>))}</optgroup>}
                               </select>
                            </div>
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-4 items-start pl-0 md:pl-9">
                            <div className="flex-1 w-full">
                              <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Deskripsi barang/layanan..." className={inputClass} required />
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                              <div className="w-28 shrink-0 relative">
                                <input type="number" min="0.1" step="0.1" value={item.quantity || ''} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClass} pr-10 text-center font-bold`} placeholder="Qty" required />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">{unitLabel.slice(0, 3)}</span>
                              </div>
                              
                              <div className="flex-1 md:w-40 shrink-0 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Rp</span>
                                <input type="number" min="0" value={item.unitPrice || ''} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)} className={`${inputClass} pl-10 text-right font-bold`} placeholder="Harga" required />
                              </div>
                            </div>
                          </div>

                          {isAutoBooking && (
                             <div className="mt-1 ml-0 md:ml-9 flex items-start gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                               <AlertCircle className="w-4 h-4 shrink-0" />
                               <p>Sesuaikan <strong>Durasi/Qty</strong> agar total harga sesuai dengan tarif per-jam/hari.</p>
                             </div>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div>
                          <label className={labelClass}>Skema / Termin Pembayaran</label>
                          <select value={formData.term} onChange={(e) => setFormData({...formData, term: e.target.value as PaymentTerm})} className={`${inputClass} font-bold text-slate-800 cursor-pointer`}>
                            <option value="FULL_PAYMENT">Bayar Penuh Sekaligus (1x)</option>
                            <option value="DOWN_PAYMENT">Gunakan Uang Muka (DP)</option>
                            <option value="INSTALLMENT">Sistem Termin Bertahap</option>
                          </select>
                        </div>

                        {formData.term === 'DOWN_PAYMENT' && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl animate-in fade-in">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target Uang Muka (Rp)</label>
                            <input type="number" min="0" max={totalAmount} value={paymentConfig.dpAmount || ''} onChange={e => setPaymentConfig({...paymentConfig, dpAmount: Number(e.target.value)})} className={`${inputClass} text-right font-black text-lg`} />
                          </div>
                        )}
                        {formData.term === 'INSTALLMENT' && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl animate-in fade-in flex items-center gap-4">
                            <div className="w-1/3">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jml Termin</label>
                              <input type="number" min="2" max={12} value={paymentConfig.installmentCount || ''} onChange={e => setPaymentConfig({...paymentConfig, installmentCount: Number(e.target.value)})} className={`${inputClass} text-center font-black text-lg`} />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Per Termin (Estimasi)</label>
                              <div className="h-11 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-end text-sm font-black text-slate-700 shadow-sm">Rp {Math.round(totalAmount / paymentConfig.installmentCount).toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <label className={labelClass}>Catatan Tambahan di Invoice</label>
                        <textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={5} placeholder="Tambahkan instruksi transfer spesifik atau ketentuan layanan..." className={`${inputClass} resize-none`} />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-2">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                           <Edit2 className="w-4 h-4 text-slate-400"/> Pengaturan Lanjutan (Cetak PDF)
                         </h3>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                           <Save className="w-3 h-3" /> Info Penandatangan Disimpan Otomatis
                         </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className={labelClass}>Rekening Pembayaran (Pilih Satu atau Lebih)</label>
                        
                        {/* PENYESUAIAN KONDISIONAL TAMPILAN REKENING BANK */}
                        {validBankAccounts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {validBankAccounts.map(acc => {
                              const isChecked = formData.paymentAccounts?.some(p => p.accountNumber === acc.accountNumber);
                              return (
                                <label key={acc.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                                    checked={isChecked} 
                                    onChange={() => toggleBankAccount(acc)} 
                                  />
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-bold text-slate-800">{acc.bankName || acc.name}</p>
                                    <p className="text-sm font-mono font-black text-slate-700 mt-0.5 tracking-wider">{acc.accountNumber}</p>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">a.n {acc.accountHolder || '-'}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 mt-2 border border-dashed border-amber-300 bg-amber-50 rounded-xl text-center">
                            <Landmark className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-amber-700">Belum ada Rekening Bank yang valid.</p>
                            <p className="text-[10px] text-amber-600 mt-1">Harap pastikan rekening di menu <strong>Kas & Bank</strong> memiliki <strong>Nomor Rekening</strong> yang terisi agar dapat dipilih.</p>
                          </div>
                        )}
                        
                        <p className="text-[10px] text-slate-500 mt-3 italic">* Jika tidak ada yang dipilih, sistem akan melampirkan rekening yang diatur sebagai "Rekening Utama" di menu BAS.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                        <div>
                          <label className={labelClass}>Nama Pembuat / Pejabat</label>
                          <input type="text" value={formData.issuerName} onChange={(e) => setFormData({...formData, issuerName: e.target.value})} className={inputClass} placeholder="Kosongkan jika tdk butuh ttd" />
                        </div>
                        <div>
                          <label className={labelClass}>Jabatan</label>
                          <input type="text" value={formData.issuerRole} onChange={(e) => setFormData({...formData, issuerRole: e.target.value})} className={inputClass} placeholder="Contoh: Bendahara Penerimaan" />
                        </div>
                        <div>
                          <label className={labelClass}>NIP / NIK</label>
                          <input type="text" value={formData.issuerNIP} onChange={(e) => setFormData({...formData, issuerNIP: e.target.value})} className={inputClass} placeholder="Opsional" />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 relative z-10 shadow-xl">
                
                <div className="p-8 flex-1 flex flex-col bg-slate-50/30">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight border-b border-slate-200 pb-4 mb-6">Ringkasan Kalkulasi</h3>
                  
                  <div className="space-y-5">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>Subtotal Biaya</span>
                      <span className="font-black text-slate-800 text-base">Rp {subTotal.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                      <label className="text-xs font-bold text-slate-700">Potongan Harga (Diskon)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                        <input type="number" min="0" value={formData.discountAmount || ''} onChange={(e) => setFormData({...formData, discountAmount: parseInt(e.target.value) || 0})} className="w-full pl-10 pr-4 py-3 text-base font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 text-right transition-all shadow-sm" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grand Total Tagihan</p>
                    <p className="text-4xl font-black text-blue-700 tracking-tighter truncate" title={`Rp ${totalAmount.toLocaleString('id-ID')}`}>
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </p>
                    
                    {formData.term === 'DOWN_PAYMENT' && (
                      <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Tagihan DP Pertama</span>
                        <span className="text-lg font-black text-indigo-900">Rp {paymentConfig.dpAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-200 shrink-0 space-y-3">
                  <button 
                    type="submit" 
                    form="invoice-form" 
                    disabled={loading || !!invoiceNumberError} 
                    className="w-full py-4 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {loading ? <><Loader2 className="animate-spin w-5 h-5"/> Memproses Data...</> : (initialData && initialData.id ? 'Simpan Perubahan' : 'Terbitkan Dokumen Resmi')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleClose} 
                    disabled={loading}
                    className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batalkan
                  </button>
                </div>

              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}