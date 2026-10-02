import React, { useState, useEffect } from 'react';
import { Booking, Invoice } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useBilling } from '@/hooks/useBilling';
import { useCatalog } from '@/hooks/useCatalog';
import { useAssets } from '@/hooks/useAssets'; 
import { affiliateService } from '@/services/affiliate.service'; 

import { CheckCircle2, XCircle, Clock, MapPin, Loader2, FileText, AlertTriangle, Receipt, ListTodo, History, Calculator, RefreshCw, FilePlus2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import ModalFormInvoice from '../../billing/component/ModalFormInvoice';

interface Props {
  bookings: Booking[];
  appId: string;
}

export default function TabOverviewBooking({ bookings, appId }: Props) {
  const { createNewInvoice, invoices } = useBilling();
  const { products } = useCatalog();
  const { publicRooms } = useAssets(); 
  
  const [subTab, setSubTab] = useState<'Antrean' | 'Riwayat' | 'Tagihan Mandiri'>('Antrean');
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  
  const [isAdvancedInvoiceModalOpen, setIsAdvancedInvoiceModalOpen] = useState(false);
  const [isIndependentInvoiceModalOpen, setIsIndependentInvoiceModalOpen] = useState(false);

  const [billingAmount, setBillingAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [recommendedPrice, setRecommendedPrice] = useState<number>(0);
  const [durationInfo, setDurationInfo] = useState<string>('');
  
  const [calculatedQty, setCalculatedQty] = useState<number>(1);
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number>(0);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  
  const historyBookings = bookings
    .filter(b => b.status !== 'pending')
    .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
    .reverse();

  const independentInvoices = invoices
    .filter(inv => {
      const isBookingRelated = inv.invoiceNumber?.includes('/BOOK/') || inv.items.some(i => ['BOOKING', 'TARIFF_DAY'].includes(i.referenceType));
      const isLinkedToBooking = bookings.some(b => b.invoiceId === inv.id);
      return isBookingRelated && !isLinkedToBooking;
    })
    .map(inv => ({
      id: `indep-${inv.id}`,
      userName: inv.customerName,
      agency: inv.customerType === 'Tenant' ? 'Startup / Tenant' : 'Umum / Luar',
      assetName: inv.items[0]?.description || 'Tagihan Fasilitas Mandiri',
      startDate: inv.date,
      invoiceId: inv.id,
      totalAmount: inv.totalAmount
    }));

  useEffect(() => {
    if (isApproveModalOpen && selectedBooking) {
      const assetMatch = publicRooms.find(a => a.id === selectedBooking.assetId);
      const catalogMatch = products.find(p => p.name.toLowerCase() === selectedBooking.assetName.toLowerCase());
      
      const isInternal = selectedBooking.agency?.toLowerCase().includes('internal') || 
                         selectedBooking.userName?.toLowerCase().includes('internal') ||
                         selectedBooking.userName?.toLowerCase().includes('admin');

      const start = new Date(`${selectedBooking.startDate}T${selectedBooking.startTime || '08:00:00'}`);
      const endDateStr = selectedBooking.endDate || selectedBooking.startDate;
      const end = new Date(`${endDateStr}T${selectedBooking.endTime || '17:00:00'}`);
      
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      let calcPrice = 0;
      let dText = '';
      let qty = 1;
      let unitPrice = 0;

      if (isInternal) {
        calcPrice = 0;
        qty = 1;
        unitPrice = 0;
        dText = `${diffDays > 1 ? diffDays + ' Hari' : diffHours + ' Jam'} (Gratis - Terdeteksi Kegiatan Internal)`;
      } 
      else if (assetMatch && assetMatch.isRentable && assetMatch.priceValue) {
        const type = (assetMatch.pricingType || '').toLowerCase();
        unitPrice = assetMatch.priceValue;
        
        if (type.includes('jam')) {
          qty = diffHours;
          calcPrice = assetMatch.priceValue * qty;
          dText = `${qty} Jam @ Rp ${assetMatch.priceValue.toLocaleString('id-ID')} / ${assetMatch.pricingType}`;
        } else if (type.includes('hari')) {
          qty = diffDays;
          calcPrice = assetMatch.priceValue * qty;
          dText = `${qty} Hari @ Rp ${assetMatch.priceValue.toLocaleString('id-ID')} / ${assetMatch.pricingType}`;
        } else {
          calcPrice = assetMatch.priceValue;
          dText = `Tarif Tetap @ Rp ${assetMatch.priceValue.toLocaleString('id-ID')} / ${assetMatch.pricingType || 'Acara'}`;
        }
      } 
      else if (catalogMatch) {
        const isHourly = catalogMatch.pricingType.toLowerCase().includes('jam');
        unitPrice = catalogMatch.price;
        if (isHourly) {
          qty = diffHours;
          calcPrice = catalogMatch.price * qty;
          dText = `${qty} Jam @ Rp ${catalogMatch.price.toLocaleString('id-ID')} / ${catalogMatch.pricingType}`;
        } else {
          qty = diffDays;
          calcPrice = catalogMatch.price * qty;
          dText = `${qty} Hari @ Rp ${catalogMatch.price.toLocaleString('id-ID')} / ${catalogMatch.pricingType}`;
        }
      } 
      else {
        dText = `${diffDays > 1 ? diffDays + ' Hari' : diffHours + ' Jam'} (Tidak ada acuan Harga di Sistem)`;
      }

      setRecommendedPrice(calcPrice);
      setDurationInfo(dText);
      setCalculatedQty(qty);
      setCalculatedUnitPrice(unitPrice);
      setBillingAmount(calcPrice);
    }
  }, [isApproveModalOpen, selectedBooking, publicRooms, products]);

  useEffect(() => {
    let syncCount = 0;
    const syncBookingsWithInvoices = async () => {
      for (const booking of historyBookings) {
        if (booking.status === 'approved' && booking.invoiceId) {
          const inv = invoices.find(i => i.id === booking.invoiceId);
          if (inv) {
            if (inv.status === 'PAID') {
              const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', booking.id!);
              await updateDoc(bookingRef, { status: 'completed' });
              syncCount++;
            } else if (inv.status === 'OVERDUE' || inv.status === 'CANCELLED') {
              const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', booking.id!);
              await updateDoc(bookingRef, { status: 'rejected' });
              syncCount++;
            }
          }
        }
      }
      if (syncCount > 0) {
        toast.success(`Sinkronisasi Otomatis Berhasil`, {
          description: `${syncCount} data peminjaman telah diperbarui sesuai status tagihan terbaru.`
        });
      }
    };

    if (invoices.length > 0 && historyBookings.length > 0) {
      syncBookingsWithInvoices();
    }
  }, [invoices, historyBookings, appId]);

  const handleApproveWithBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !selectedBooking.id) return;
    
    setIsProcessing(true);
    try {
      let invoiceId = '';

      if (billingAmount > 0) {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const invNumber = `INV/BOOK/${dateStr}/${Math.floor(1000 + Math.random() * 9000)}`;
        const today = new Date().toISOString().split('T')[0];
        
        const invoicePayload: Omit<Invoice, 'id'> = {
          invoiceNumber: invNumber,
          customerName: selectedBooking.userName,
          customerType: 'Umum',
          customerEmail: selectedBooking.userEmail,
          customerPhone: selectedBooking.userPhone,
          items: [{
            id: Date.now().toString(),
            referenceId: selectedBooking.id, 
            referenceType: 'BOOKING', 
            description: `Sewa Ruang/Fasilitas: ${selectedBooking.assetName} (${selectedBooking.startDate})`,
            quantity: 1, 
            unitPrice: billingAmount,
            total: billingAmount
          }],
          subTotal: billingAmount, taxAmount: 0, discountAmount: 0, totalAmount: billingAmount, paidAmount: 0, remainingAmount: billingAmount,
          term: 'FULL_PAYMENT', date: today, dueDate: selectedBooking.startDate, status: 'PENDING',
          issuerName: 'Sistem', issuerRole: 'Admin', issuerNIP: '', history: [],
          notes: `Keperluan: ${selectedBooking.purpose}`,
          referralCode: selectedBooking.referralCode || undefined
        };

        const res = await createNewInvoice(invoicePayload);
        if (res.success && res.id) {
          invoiceId = res.id;
          // Catat komisi afiliasi pending jika booking menggunakan referralCode
          if (selectedBooking.referralCode && billingAmount > 0) {
            try {
              const partner = await affiliateService.getAffiliateByCode(selectedBooking.referralCode);
              if (partner) {
                const settings = await affiliateService.getAffiliateSettings();
                const rate = settings.facilityCommissionRate || 0.05;
                const commissionAmount = Math.round(billingAmount * rate);

                await affiliateService.createCommission({
                  affiliateId: partner.userId,
                  referralCode: selectedBooking.referralCode,
                  domain: 'FASILITAS',
                  itemId: selectedBooking.assetId,
                  itemTitle: selectedBooking.assetName,
                  customerName: selectedBooking.userName,
                  customerEmail: selectedBooking.userEmail || '',
                  transactionAmount: billingAmount,
                  commissionRate: rate,
                  commissionAmount: commissionAmount,
                  invoiceId: res.id
                });
              }
            } catch (affErr) {
              console.warn("Gagal mencatat komisi afiliasi sewa fasilitas:", affErr);
            }
          }
        }
        else throw new Error("Gagal membuat Invoice tagihan.");
      }

      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', selectedBooking.id);
      const finalStatus = billingAmount > 0 ? 'approved' : 'completed';
      
      await updateDoc(bookingRef, { status: finalStatus, invoiceId: invoiceId || null });

      toast.success("Pengajuan Disetujui!", {
        description: billingAmount > 0 ? "Tagihan otomatis dikirim ke Penyewa." : "Disetujui secara gratis tanpa tagihan."
      });
      
      setIsApproveModalOpen(false);
      setSelectedBooking(null);
      setBillingAmount(0);
    } catch (error: any) {
      toast.error("Terjadi Kesalahan", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitialInvoiceData = (): Partial<Invoice> | null => {
    if (!selectedBooking) return null;
    const finalUnitPrice = billingAmount > 0 && billingAmount !== recommendedPrice ? (billingAmount / calculatedQty) : calculatedUnitPrice;
    const finalTotal = billingAmount > 0 ? billingAmount : recommendedPrice;

    return {
      customerName: selectedBooking.userName, customerEmail: selectedBooking.userEmail || '', customerPhone: selectedBooking.userPhone || '',
      customerType: selectedBooking.agency ? 'Umum' : 'Tenant',
      date: new Date().toISOString().split('T')[0], dueDate: selectedBooking.startDate,
      notes: `Keperluan: ${selectedBooking.purpose}\nLokasi: ${selectedBooking.assetName}\nJadwal: ${selectedBooking.startDate} (${selectedBooking.startTime || '08:00'} - ${selectedBooking.endTime || '17:00'})`,
      items: [{
          id: Date.now().toString(),
          referenceType: 'BOOKING', referenceId: selectedBooking.id, 
          description: `Sewa ${selectedBooking.assetName}`,
          quantity: calculatedQty, unitPrice: finalUnitPrice, total: finalTotal
      }]
    };
  };

  const getIndependentInitialData = (): Partial<Invoice> => {
    return {
      customerType: 'Umum',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      items: [{
          id: Date.now().toString(),
          referenceType: 'TARIFF_DAY', 
          description: 'Sewa Fasilitas / Ruangan (Mandiri)',
          quantity: 1, unitPrice: 0, total: 0
      }]
    };
  };

  const handleAdvancedInvoiceSubmit = async (customInvoiceData: Partial<Invoice>) => {
    if (!selectedBooking || !selectedBooking.id) return;
    setIsProcessing(true);
    try {
      const totalAmt = customInvoiceData.totalAmount || 0;
      const isFree = totalAmt <= 0;

      const invoicePayload: Omit<Invoice, 'id'> = {
        ...customInvoiceData, 
        status: isFree ? 'PAID' : 'PENDING', 
        paidAmount: isFree ? totalAmt : 0, 
        remainingAmount: isFree ? 0 : totalAmt, 
        history: customInvoiceData.history || []
      } as Omit<Invoice, 'id'>;

      const res = await createNewInvoice(invoicePayload);
      if (!res.success) throw new Error(res.error || "Gagal menerbitkan Invoice di sistem.");
      
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', selectedBooking.id);
      const finalStatus = isFree ? 'completed' : 'approved';
      
      await updateDoc(bookingRef, { status: finalStatus, invoiceId: res.id || null });

      toast.success(isFree ? "Disetujui Gratis (Kuitansi Tercetak)" : "Tagihan Komprehensif Diterbitkan!");
      setIsAdvancedInvoiceModalOpen(false); setIsApproveModalOpen(false); setSelectedBooking(null); setBillingAmount(0);
    } catch (error: any) {
      toast.error("Gagal Menerbitkan Tagihan", { description: error.message });
    } finally { setIsProcessing(false); }
  };

  const handleIndependentInvoiceSubmit = async (customInvoiceData: Partial<Invoice>) => {
    setIsProcessing(true);
    try {
      const totalAmt = customInvoiceData.totalAmount || 0;
      const isFree = totalAmt <= 0;

      const invoicePayload: Omit<Invoice, 'id'> = {
        ...customInvoiceData, 
        status: isFree ? 'PAID' : 'PENDING', 
        paidAmount: isFree ? totalAmt : 0, 
        remainingAmount: isFree ? 0 : totalAmt, 
        history: customInvoiceData.history || []
      } as Omit<Invoice, 'id'>;

      const res = await createNewInvoice(invoicePayload);
      if (!res.success) throw new Error(res.error || "Gagal menerbitkan Invoice.");

      toast.success(isFree ? "Kuitansi Gratis Diterbitkan!" : "Tagihan Mandiri Diterbitkan!");
      setIsIndependentInvoiceModalOpen(false);
    } catch (error: any) {
      toast.error("Gagal Menerbitkan Tagihan Mandiri", { description: error.message });
    } finally { setIsProcessing(false); }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Yakin ingin menolak pengajuan sewa ini?")) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id);
      await updateDoc(bookingRef, { status: 'rejected' });
      toast.success("Pengajuan Ditolak.");
    } catch (error) { toast.error("Gagal menolak pengajuan."); }
  };

  const renderInvoiceStatus = (invoiceId?: string) => {
    if (!invoiceId) return <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-slate-200">Tanpa Tagihan (Gratis)</span>;
    const inv = invoices.find(i => i.id === invoiceId);
    
    // PERBAIKAN: Jika invoice tidak ditemukan (misal disembunyikan oleh filter karena internal), 
    // jangan tampilkan "Memuat..." selamanya.
    if (!inv) return <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-slate-200"><CheckCircle2 className="w-3.5 h-3.5"/> Disembunyikan / Gratis</span>;

    switch(inv.status) {
      case 'PAID': return <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> LUNAS</span>;
      case 'PENDING': return <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-amber-200"><Clock className="w-3.5 h-3.5"/> Menunggu Pembayaran</span>;
      case 'PARTIAL': return <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-blue-200"><Receipt className="w-3.5 h-3.5"/> DP / Cicilan</span>;
      case 'OVERDUE': return <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-red-200"><AlertTriangle className="w-3.5 h-3.5"/> Telat Bayar</span>;
      default: return <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-slate-200">{inv.status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden animate-in fade-in">
      <div className="flex border-b border-slate-150 bg-white justify-between items-center pr-4 sm:pr-6">
        <div className="flex overflow-x-auto hide-scrollbar">
          <button onClick={() => setSubTab('Antrean')} className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${subTab === 'Antrean' ? 'text-blue-600 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'}`}>
            <ListTodo size={16}/> Antrean Persetujuan {pendingBookings.length > 0 && <span className="bg-blue-600 text-white rounded-full px-2 text-[10px]">{pendingBookings.length}</span>}
          </button>
          <button onClick={() => setSubTab('Riwayat')} className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${subTab === 'Riwayat' ? 'text-blue-600 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'}`}>
            <History size={16}/> Riwayat Peminjaman
          </button>
          <button onClick={() => setSubTab('Tagihan Mandiri')} className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${subTab === 'Tagihan Mandiri' ? 'text-blue-600 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'}`}>
            <Receipt size={16}/> Tagihan Mandiri
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <RefreshCw size={11} className="animate-spin-slow" /> Auto-Sync
          </div>
          <Button size="sm" onClick={() => setIsIndependentInvoiceModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 rounded-xl shadow-2xs text-xs flex items-center px-3">
            <FilePlus2 className="w-3.5 h-3.5 mr-1.5" /> Tagihan Mandiri Baru
          </Button>
        </div>
      </div>
      
      {subTab === 'Antrean' && (
        pendingBookings.length === 0 ? (
           <div className="text-center py-20 text-slate-500 bg-slate-50/30">
             <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 bg-emerald-50 rounded-full p-2 border border-emerald-100" />
             <h3 className="text-lg font-bold text-slate-800 tracking-tight">Antrean Bersih!</h3>
             <p className="text-xs sm:text-sm text-slate-400 mt-1">Tidak ada pengajuan peminjaman baru saat ini.</p>
           </div>
        ) : (
          <div>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80 border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3.5 w-[30%]">Pemohon</th>
                    <th className="px-5 py-3.5 w-[32%]">Fasilitas & Jadwal</th>
                    <th className="px-5 py-3.5 w-[24%]">Keperluan</th>
                    <th className="px-5 py-3.5 w-[14%] text-right pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800 text-sm">{booking.userName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{booking.agency || 'Individu'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{booking.userEmail}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-blue-700 text-sm flex items-center gap-1.5 mb-1">
                          <MapPin size={13}/> {booking.assetName}
                        </div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400"/> {booking.startDate} ({booking.startTime || '08:00'} - {booking.endTime || '17:00'})
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-600 line-clamp-2 text-xs max-w-xs">{booking.purpose}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300 rounded-lg px-3 h-8 text-xs font-bold" onClick={() => handleReject(booking.id!)}>
                            <XCircle className="mr-1 h-3.5 w-3.5"/> Tolak
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3.5 h-8 text-xs font-bold shadow-2xs" onClick={() => { setSelectedBooking(booking); setIsApproveModalOpen(true); }}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Validasi
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="lg:hidden p-4 space-y-3">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {booking.agency || 'Individu'}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{booking.userName}</h4>
                      <p className="text-[11px] text-slate-400">{booking.userEmail}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Menunggu
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="font-bold text-blue-700 flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0 text-blue-600" />
                      <span className="truncate">{booking.assetName}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                      <Clock size={13} className="shrink-0 text-slate-400" />
                      <span>{booking.startDate} ({booking.startTime || '08:00'} - {booking.endTime || '17:00'})</span>
                    </div>
                    {booking.purpose && (
                      <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/60 line-clamp-2">
                        <span className="font-semibold text-slate-700">Keperluan:</span> {booking.purpose}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold text-xs py-2.5 h-auto" 
                      onClick={() => handleReject(booking.id!)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Tolak
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs py-2.5 h-auto shadow-xs" 
                      onClick={() => { setSelectedBooking(booking); setIsApproveModalOpen(true); }}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Validasi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {subTab === 'Riwayat' && (
        historyBookings.length === 0 ? (
           <div className="text-center py-24 text-slate-500 bg-slate-50/30">
             <History className="h-16 w-16 text-slate-300 mx-auto mb-4 bg-white rounded-full p-2 border border-slate-200 shadow-xs" />
             <h3 className="text-xl font-bold text-slate-800 tracking-tight">Belum Ada Riwayat Peminjaman</h3>
             <p className="text-sm mt-1">Jadwal yang telah disetujui, ditolak, atau selesai akan tampil di sini.</p>
           </div>
        ) : (
          <div>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80 border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3.5 w-[28%]">Pemohon</th>
                    <th className="px-5 py-3.5 w-[32%]">Fasilitas & Jadwal</th>
                    <th className="px-5 py-3.5 w-[20%]">Status Kalender</th>
                    <th className="px-5 py-3.5 w-[20%] text-right pr-6">Status Tagihan / Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {historyBookings.map((booking) => {
                    const inv = invoices.find(i => i.id === booking.invoiceId);
                    const isAutoCancelled = booking.status === 'rejected' && (inv?.status === 'OVERDUE' || inv?.status === 'CANCELLED');

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 text-sm">{booking.userName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{booking.agency || 'Individu'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-1">{booking.assetName}</div>
                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <Clock size={12}/> {booking.startDate} ({booking.startTime || '08:00'} - {booking.endTime || '17:00'})
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {booking.status === 'completed' && !booking.invoiceId && <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-[10px] border border-emerald-200 flex items-center gap-1.5 w-fit uppercase tracking-wide"><CheckCircle2 size={12}/> Gratis / Internal</span>}
                          {booking.status === 'completed' && booking.invoiceId && <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-[10px] border border-emerald-200 flex items-center gap-1.5 w-fit uppercase tracking-wide"><CheckCircle2 size={12}/> Terkonfirmasi (Lunas)</span>}
                          {booking.status === 'approved' && <span className="text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded text-[10px] border border-blue-200 flex items-center gap-1.5 w-fit uppercase tracking-wide"><Clock size={12}/> Menunggu Bayar</span>}
                          {booking.status === 'rejected' && <span className="text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded text-[10px] border border-red-200 flex items-center gap-1.5 w-fit uppercase tracking-wide"><XCircle size={12}/> {isAutoCancelled ? 'Batal (Telat Bayar)' : 'Ditolak'}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right pr-6">
                          {booking.status === 'rejected' && !isAutoCancelled ? <span className="text-slate-400 italic text-xs font-medium">- Tidak Berlaku -</span> : renderInvoiceStatus(booking.invoiceId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="lg:hidden p-4 space-y-3">
              {historyBookings.map((booking) => {
                const inv = invoices.find(i => i.id === booking.invoiceId);
                const isAutoCancelled = booking.status === 'rejected' && (inv?.status === 'OVERDUE' || inv?.status === 'CANCELLED');
                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{booking.userName}</h4>
                        <span className="text-[11px] text-slate-500">{booking.agency || 'Individu'}</span>
                      </div>
                      <div>
                        {booking.status === 'completed' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selesai</span>}
                        {booking.status === 'approved' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Disetujui</span>}
                        {booking.status === 'rejected' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Ditolak</span>}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-600 shrink-0" />
                        <span className="truncate">{booking.assetName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock size={12} className="shrink-0 text-slate-400" />
                        <span>{booking.startDate} ({booking.startTime || '08:00'} - {booking.endTime || '17:00'})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] font-medium text-slate-500">Status Tagihan:</span>
                      <div>
                        {booking.status === 'rejected' && !isAutoCancelled ? (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        ) : (
                          renderInvoiceStatus(booking.invoiceId)
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {subTab === 'Tagihan Mandiri' && (
        independentInvoices.length === 0 ? (
           <div className="text-center py-24 text-slate-500 bg-slate-50/30">
             <Receipt className="h-16 w-16 text-slate-300 mx-auto mb-4 bg-white rounded-full p-2 border border-slate-200 shadow-sm" />
             <h3 className="text-xl font-bold text-slate-800 tracking-tight">Tidak Ada Tagihan Mandiri</h3>
             <p className="text-sm mt-1">Tagihan yang dibuat manual dari luar kalender akan tampil di sini.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Deskripsi Layanan</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-8 py-4">Status Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {independentInvoices.map((invData) => (
                    <tr key={invData.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{invData.userName}</div>
                        <div className="text-xs text-slate-500 mt-1">{invData.agency}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                          <FilePlus2 size={14} className="text-indigo-500"/> {invData.assetName}
                        </div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <CalendarIcon size={12}/> Tgl. Tagihan: {invData.startDate}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-800">Rp {invData.totalAmount?.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-8 py-5">
                        {renderInvoiceStatus(invData.invoiceId)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[24px] p-0 border border-slate-100 shadow-2xl overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Validasi Peminjaman</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">Konfirmasi nominal untuk menerbitkan tagihan secara instan.</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <form onSubmit={handleApproveWithBilling} className="flex flex-col">
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Fasilitas:</span><span className="font-bold text-slate-800">{selectedBooking.assetName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Penyewa:</span><span className="font-bold text-slate-800">{selectedBooking.userName}</span></div>
                </div>

                {recommendedPrice > 0 ? (
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider"><Calculator size={14}/> Kalkulasi Cerdas</p>
                      <p className="text-xs text-indigo-600/80 mt-1.5 font-medium">{durationInfo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-indigo-700">Rp {recommendedPrice.toLocaleString('id-ID')}</p>
                      <button type="button" onClick={() => setBillingAmount(recommendedPrice)} className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg mt-2 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm">
                        Terapkan Tarif
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-500 flex items-start gap-2.5">
                    <Calculator size={16} className="shrink-0 mt-0.5 text-slate-400" />
                    <p className="leading-relaxed">
                      {durationInfo.includes('Gratis') 
                        ? <span className="text-emerald-600 font-bold">Sistem mendeteksi ini adalah Peminjaman Internal. Harga otomatis diset menjadi Rp 0 dan akan langsung disetujui tanpa tagihan.</span>
                        : <span>Sistem tidak menemukan tarif otomatis untuk <b>{selectedBooking?.assetName}</b>. Silakan atur harga di menu Manajemen Ruangan atau isi manual di bawah ini (Biarkan Rp 0 jika gratis).</span>
                      }
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-800">Nominal Tagihan Ruangan (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <Input type="number" min="0" required className="pl-12 text-lg font-black h-12 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:bg-white transition-colors" value={billingAmount || ''} onChange={(e) => setBillingAmount(Number(e.target.value))} placeholder="0" />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium"><AlertTriangle size={14} className="text-amber-500"/> Biarkan Rp 0 jika peminjaman ini bersifat gratis.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-blue-50/50 border-t border-blue-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-blue-800/80 font-medium leading-relaxed">
                  Perlu tambah layanan ekstra, cicilan, <br className="hidden sm:block"/>atau pilih rekening bank tujuan?
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAdvancedInvoiceModalOpen(true)}
                  className="w-full sm:w-auto bg-white border-blue-200 text-blue-700 hover:bg-blue-100 font-bold rounded-lg shadow-sm"
                >
                  <FilePlus2 className="w-4 h-4 mr-2" /> Buka Pembuat Tagihan Lanjut
                </Button>
              </div>

              <DialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsApproveModalOpen(false)} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600">Batal</Button>
                <Button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold shadow-sm shadow-blue-200 px-6">
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4"/>}
                  {billingAmount > 0 ? 'Setujui & Terbitkan Cepat' : 'Setujui Gratis'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {isAdvancedInvoiceModalOpen && selectedBooking && (
        <ModalFormInvoice 
          onClose={() => setIsAdvancedInvoiceModalOpen(false)}
          onSubmit={handleAdvancedInvoiceSubmit}
          initialData={getInitialInvoiceData() as Invoice}
          invoices={invoices} 
        />
      )}

      {isIndependentInvoiceModalOpen && (
        <ModalFormInvoice 
          onClose={() => setIsIndependentInvoiceModalOpen(false)}
          onSubmit={handleIndependentInvoiceSubmit}
          initialData={getIndependentInitialData() as Invoice}
          invoices={invoices} 
        />
      )}

    </div>
  );
}