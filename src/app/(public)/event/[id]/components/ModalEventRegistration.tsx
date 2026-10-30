'use client';

import React, { useState, useEffect } from 'react';
import { AppEvent, EventRegistration, EventTicketTier } from '@/types';
import { eventService } from '@/services/event.service';
import { billingService } from '@/services/billing.service';
import { useAuth } from '@/lib/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  CheckCircle2, 
  Printer, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  QrCode, 
  Loader2, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: AppEvent;
  defaultTierId?: string | null;
}

export default function ModalEventRegistration({ isOpen, onClose, event, defaultTierId }: Props) {
  const { user } = useAuth();
  
  const [selectedTier, setSelectedTier] = useState<EventTicketTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agency: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<EventRegistration | null>(null);

  // Inisialisasi tier awal & data profil user
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || ''
      }));
    }

    if (event.ticketingTiers && event.ticketingTiers.length > 0) {
      if (defaultTierId) {
        const found = event.ticketingTiers.find(t => t.id === defaultTierId);
        if (found) setSelectedTier(found);
        else setSelectedTier(event.ticketingTiers[0]);
      } else {
        setSelectedTier(event.ticketingTiers[0]);
      }
    } else {
      setSelectedTier(null);
    }
  }, [user, event, defaultTierId, isOpen]);

  const price = selectedTier ? (selectedTier.price || 0) : (event.price || 0);
  const isFree = event.isFree || price === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Mohon lengkapi seluruh kolom bertanda bintang (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdInvoiceId: string | undefined = undefined;

      // Jika berbayar, terbitkan Invoice resmi di sistem Billing BLUD
      if (!isFree && price > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const dueDateStr = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const invNum = `INV-EVT-${Date.now().toString().slice(-6)}`;

        const invPayload = {
          invoiceNumber: invNum,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerType: 'Umum' as const,
          items: [{
            id: Date.now().toString(),
            referenceType: 'EVENT' as const,
            referenceId: event.id || '',
            description: `Tiket Acara: ${event.title} (${selectedTier?.name || 'Reguler'})`,
            quantity: 1,
            unitPrice: price,
            total: price
          }],
          subTotal: price,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: price,
          paidAmount: 0,
          remainingAmount: price,
          term: 'FULL_PAYMENT' as const,
          date: todayStr,
          dueDate: dueDateStr,
          status: 'PENDING' as const,
          division: 'MANAJEMEN_EVENT' as any,
          divisionPic: 'Divisi Acara & Kemitraan STP',
          divisionRefNumber: event.id,
          issuerName: '',
          issuerRole: 'Kasir' as const,
          issuerNIP: '',
          notes: `Tiket Event: ${event.title}`,
          history: []
        };

        const resInvId = await billingService.createInvoice(invPayload);
        if (resInvId) createdInvoiceId = resInvId;
      }

      const res = await eventService.registerEvent(event.id as string, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        agency: formData.agency || '-',
        ticketTierId: selectedTier?.id,
        ticketTierName: selectedTier?.name || (isFree ? 'Tiket Masuk Gratis' : 'Reguler'),
        price,
        status: isFree ? 'CONFIRMED' : 'PENDING',
        invoiceId: createdInvoiceId
      });

      if (res.success && res.record) {
        setTicketResult(res.record);
        toast.success(isFree ? 'Pendaftaran berhasil! E-Tiket Anda siap.' : 'Pendaftaran berhasil! Tagihan telah diterbitkan.');
      } else {
        throw new Error(res.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err: any) {
      console.error('Gagal registrasi event:', err);
      toast.error('Gagal mendaftar tiket: ' + (err.message || 'Silakan coba beberapa saat lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setTicketResult(null); onClose(); } }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        
        {/* TAMPILAN SUKSES: E-TIKET DIGITAL */}
        {ticketResult ? (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {ticketResult.status === 'CONFIRMED' ? 'E-Tiket Resmi Berhasil Diterbitkan!' : 'Registrasi Berhasil Disimpan'}
              </h3>
              <p className="text-xs text-slate-500">
                {ticketResult.status === 'CONFIRMED' 
                  ? 'Simpan kartu tiket ini atau tunjukkan saat memasuki area Solo Technopark.'
                  : 'Selesaikan pembayaran tiket untuk mengonfirmasi kehadiran Anda.'}
              </p>
            </div>

            {/* KARTU E-TIKET */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Ticket size={140} />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">Solo Technopark Pass</span>
                  </div>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[10px] font-bold">
                    {ticketResult.ticketTierName || 'TIKET REGULER'}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Nama Peserta</p>
                  <p className="text-lg font-black text-white">{ticketResult.name}</p>
                  <p className="text-xs text-indigo-200">{ticketResult.agency || '-'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Acara</p>
                  <p className="text-sm font-bold text-white line-clamp-2">{event.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2 text-indigo-200">
                    <Calendar size={14} className="text-indigo-400 shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-200">
                    <Clock size={14} className="text-indigo-400 shrink-0" />
                    <span>{event.time} WIB</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-200 col-span-2">
                    <MapPin size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{event.location || 'Solo Technopark'}</span>
                  </div>
                </div>

                {/* KODE TIKET & BARCODE */}
                <div className="mt-4 pt-4 border-t border-dashed border-white/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block">Kode Masuk / Tiket</span>
                    <span className="text-base sm:text-lg font-black tracking-wider text-emerald-400 font-mono">
                      {ticketResult.ticketCode}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow">
                    <QrCode size={36} className="text-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="w-full sm:flex-1 rounded-xl gap-2 font-bold text-xs"
              >
                <Printer size={14} /> Cetak E-Tiket
              </Button>
              <Button
                type="button"
                onClick={() => { setTicketResult(null); onClose(); }}
                className="w-full sm:flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Tutup & Selesai
              </Button>
            </div>
          </div>
        ) : (
          /* FORMULIR PENDAFTARAN */
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100 w-fit mb-1">
                <Ticket size={13} />
                <span>Pendaftaran Tiket Acara</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Lengkapi identitas diri Anda untuk penerbitan e-tiket resmi Solo Technopark.
              </DialogDescription>
            </DialogHeader>

            {/* PILIHAN TIER TIKET (JIKA ADA LEBIH DARI 1) */}
            {event.ticketingTiers && event.ticketingTiers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Pilih Kategori Tiket</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {event.ticketingTiers.map(tier => {
                    const isSelected = selectedTier?.id === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? 'border-violet-600 bg-violet-50/60 ring-2 ring-violet-500/20' 
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                          <span className="text-xs font-black text-violet-700">
                            {tier.price && tier.price > 0 ? formatRupiah(tier.price) : 'Gratis'}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{tier.description}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RINGKASAN BIAYA TIKET */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Total Biaya Registrasi:</span>
              <span className="text-base font-black text-slate-900">
                {isFree ? 'Gratis (Rp 0)' : formatRupiah(price)}
              </span>
            </div>

            {/* FIELD IDENTITAS */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-xs font-bold text-slate-700">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="reg-name"
                  placeholder="Contoh: Rian Anggoro, S.Kom"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-bold text-slate-700">
                    Alamat Email Aktif <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-xs font-bold text-slate-700">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="reg-phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-agency" className="text-xs font-bold text-slate-700">
                  Asal Instansi / Universitas / Perusahaan (Opsional)
                </Label>
                <Input
                  id="reg-agency"
                  placeholder="Contoh: Universitas Sebelas Maret / Startup Sintesa"
                  value={formData.agency}
                  onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-2 px-6 shadow-md shadow-violet-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menerbitkan Tiket...</span>
                  </>
                ) : (
                  <>
                    <Ticket size={14} />
                    <span>{isFree ? 'Konfirmasi & Terbitkan Tiket' : 'Lanjut ke Pembayaran'}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}

