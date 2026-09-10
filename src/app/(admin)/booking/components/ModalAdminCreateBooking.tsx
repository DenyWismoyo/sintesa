import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, CalendarIcon, Building2, User, CreditCard, Send, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { doc, updateDoc } from 'firebase/firestore';
import { useBooking } from '@/hooks/useBooking';
import { useBilling } from '@/hooks/useBilling';
import { useAssets } from '@/hooks/useAssets'; // PERBAIKAN: Import Hook Sentral Aset
import { Invoice } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface ModalAdminCreateBookingProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSlot: { start: Date; end: Date } | null;
}

export default function ModalAdminCreateBooking({ isOpen, onClose, prefilledSlot }: ModalAdminCreateBookingProps) {
  const appId = getAppId();
  const queryClient = useQueryClient();
  
  const { adminCreateBooking } = useBooking('admin');
  const { createNewInvoice } = useBilling();
  
  // PERBAIKAN: Selalu gunakan publicRooms dari cache aset, jangan query ulang secara manual
  const { publicRooms: rooms } = useAssets(); 

  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [bookingType, setBookingType] = useState<'internal' | 'eksternal'>('internal');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  const [form, setForm] = useState({
    userName: 'Internal Admin', 
    userEmail: '', 
    userPhone: '', 
    agency: 'Internal Instansi', 
    startDate: '', 
    endDate: '', 
    startTime: '08:00', 
    endTime: '16:00', 
    purpose: ''
  });

  // Opsi Tambahan untuk Eksternal
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);

  // Pre-fill form
  useEffect(() => {
    if (isOpen) {
      if (prefilledSlot) {
        setForm(prev => ({
          ...prev,
          startDate: format(prefilledSlot.start, 'yyyy-MM-dd'),
          endDate: format(prefilledSlot.end, 'yyyy-MM-dd'),
          startTime: format(prefilledSlot.start, 'HH:mm'),
          endTime: prefilledSlot.start.getTime() === prefilledSlot.end.getTime() ? '16:00' : format(prefilledSlot.end, 'HH:mm')
        }));
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        setForm(prev => ({ ...prev, startDate: today, endDate: today, startTime: '08:00', endTime: '16:00' }));
      }
    }
  }, [isOpen, prefilledSlot]);

  // Toggle Type Logic
  useEffect(() => {
    if (bookingType === 'internal') {
      setForm(prev => ({ ...prev, userName: 'Internal Admin', agency: 'Internal Instansi', userEmail: '', userPhone: '' }));
      setGenerateInvoice(false);
    } else {
      setForm(prev => ({ ...prev, userName: '', agency: '', userEmail: '', userPhone: '' }));
    }
  }, [bookingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error("Pilih ruangan terlebih dahulu.");
      return;
    }

    const roomData = rooms.find(r => r.id === selectedRoomId);
    if (!roomData) return;

    setIsSubmitting(true);
    try {
      const willGenerateInvoice = bookingType === 'eksternal' && generateInvoice && invoiceAmount > 0;

      const payload = {
        ...form,
        assetId: roomData.id,
        assetName: roomData.name,
        status: willGenerateInvoice ? 'approved' : 'completed',
      };

      const resBooking = await adminCreateBooking(payload);
      
      if (!resBooking.success) throw new Error(resBooking.error);
      
      const newBookingId = resBooking.bookingId as string;
      if (!newBookingId) throw new Error("Gagal memproses ID Booking.");

      if (willGenerateInvoice) {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const invNumber = `INV/BOOK/${dateStr}/${Math.floor(1000 + Math.random() * 9000)}`;
        
        const invoicePayload: Omit<Invoice, 'id'> = {
          invoiceNumber: invNumber,
          customerName: form.userName,
          customerType: 'Umum',
          customerEmail: form.userEmail,
          customerPhone: form.userPhone,
          items: [{
            id: Date.now().toString(),
            referenceId: newBookingId,
            referenceType: 'BOOKING', 
            description: `Sewa Ruang/Fasilitas: ${roomData.name} (${form.startDate})`,
            quantity: 1, 
            unitPrice: invoiceAmount,
            total: invoiceAmount
          }],
          subTotal: invoiceAmount,
          taxAmount: 0, 
          discountAmount: 0, 
          totalAmount: invoiceAmount, 
          paidAmount: 0, 
          remainingAmount: invoiceAmount,
          term: 'FULL_PAYMENT',
          date: format(new Date(), 'yyyy-MM-dd'),
          dueDate: form.startDate, 
          status: 'PENDING',
          history: [],
          notes: `Keperluan: ${form.purpose}`,
          issuerName: 'Admin Booking',
          issuerRole: 'Admin',
          issuerNIP: '',
        };

        const resInvoice = await createNewInvoice(invoicePayload);
        
        if (resInvoice.success && resInvoice.id) {
          const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', newBookingId);
          await updateDoc(bookingRef, { invoiceId: resInvoice.id });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
      }

      toast.success("Jadwal Berhasil Ditambahkan!", {
        description: willGenerateInvoice 
          ? 'Jadwal klien terekam dan tagihan diterbitkan.' 
          : 'Jadwal langsung terekam dengan status Selesai/Gratis.'
      });
      
      setSelectedRoomId('');
      setInvoiceAmount(0);
      onClose();

    } catch (error: any) {
      toast.error("Gagal Menyimpan Jadwal", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-8 py-6 bg-slate-50 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Intervensi Kalender Manual</DialogTitle>
          <DialogDescription className="text-slate-500 mt-1">Buat jadwal tanpa harus melalui portal publik. Cocok untuk kegiatan dinas atau pesanan via WhatsApp.</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto p-8 custom-scrollbar bg-white flex-1">
          <form id="admin-booking-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* TIPE PENGGUNAAN */}
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-full">
              <button type="button" onClick={() => setBookingType('internal')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${bookingType === 'internal' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <Building2 size={18} /> Internal Instansi (Gratis)
              </button>
              <button type="button" onClick={() => setBookingType('eksternal')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${bookingType === 'eksternal' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <User size={18} /> Eksternal / Klien
              </button>
            </div>

            {/* PILIH RUANGAN */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">Fasilitas / Ruangan *</Label>
              <select required value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="" disabled>Pilih ruangan yang akan diblokir...</option>
                {rooms.map(r => {
                  const isInternal = bookingType === 'internal';
                  const priceLabel = isInternal ? '(Otomatis Gratis)' : (r.isRentable && r.priceValue ? `(Rp ${r.priceValue.toLocaleString('id-ID')} / ${r.pricingType})` : '(Gratis)');
                  
                  return (
                    <option key={r.id} value={r.id}>{r.name} {priceLabel}</option>
                  );
                })}
              </select>
            </div>

            {/* JADWAL */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><CalendarIcon size={16} className="text-blue-500"/> Pengaturan Waktu</h4>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Tgl Mulai *</Label><Input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="h-11 rounded-xl bg-white" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Jam Mulai *</Label><Input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="h-11 rounded-xl bg-white" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Tgl Selesai *</Label><Input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} min={form.startDate} className="h-11 rounded-xl bg-white" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Jam Selesai *</Label><Input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="h-11 rounded-xl bg-white" /></div>
              </div>
            </div>

            {/* DATA PEMOHON & KEPERLUAN */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-800">Tujuan / Agenda *</Label>
                <textarea required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder="Contoh: Rapat Paripurna internal..."></textarea>
              </div>

              {bookingType === 'eksternal' && (
                <div className="grid grid-cols-2 gap-5 animate-in slide-in-from-top-2">
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Nama Penanggung Jawab *</Label><Input required value={form.userName} onChange={e => setForm({...form, userName: e.target.value})} className="h-11 rounded-xl bg-slate-50" placeholder="Nama lengkap" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Instansi / Agensi</Label><Input value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} className="h-11 rounded-xl bg-slate-50" placeholder="Opsional" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">No. WhatsApp *</Label><Input type="tel" required value={form.userPhone} onChange={e => setForm({...form, userPhone: e.target.value})} className="h-11 rounded-xl bg-slate-50" placeholder="08..." /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-500">Email Pemohon</Label><Input type="email" value={form.userEmail} onChange={e => setForm({...form, userEmail: e.target.value})} className="h-11 rounded-xl bg-slate-50" placeholder="opsional@email.com" /></div>
                </div>
              )}
            </div>

            {/* OPSI INVOICE (Hanya Eksternal) */}
            {bookingType === 'eksternal' && (
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><CreditCard size={20}/></div>
                      <div>
                        <Label className="text-sm font-bold text-slate-800 block">Terbitkan Tagihan (Invoice)?</Label>
                        <p className="text-xs text-slate-500">Buat invoice secara otomatis agar klien bisa membayar.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={generateInvoice} onChange={(e) => setGenerateInvoice(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                 </div>

                 {generateInvoice && (
                   <div className="pt-4 border-t border-blue-100/50">
                     <Label className="text-xs font-bold text-slate-600 block mb-2">Total Biaya Sewa (Rp) *</Label>
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                       <Input type="number" required={generateInvoice} min="0" value={invoiceAmount || ''} onChange={e => setInvoiceAmount(Number(e.target.value))} className="pl-12 h-12 text-lg font-black bg-white rounded-xl focus:ring-blue-500" placeholder="0" />
                     </div>
                   </div>
                 )}
              </div>
            )}

            {bookingType === 'internal' && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed font-medium">Jadwal internal akan langsung terekam berstatus <strong className="font-bold">Selesai (Gratis)</strong> di kalender master dan akan menutup slot sehingga publik tidak bisa melakukan booking pada jam tersebut.</p>
              </div>
            )}

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-11 px-6 font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-100">Batal</Button>
          <Button type="submit" form="admin-booking-form" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
            Simpan Jadwal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}