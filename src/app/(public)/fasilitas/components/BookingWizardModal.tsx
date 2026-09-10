import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CalendarIcon, DollarSign, User, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function BookingWizardModal({ isOpen, onClose, asset, onSubmit, isSubmitting }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  
  const [form, setForm] = useState({
    userName: '', userEmail: '', userPhone: '', agency: '', 
    startDate: '', endDate: '', startTime: '08:00', endTime: '16:00', purpose: ''
  });

  useEffect(() => {
    if (isOpen) { setStep(1); if (user) setForm(p => ({ ...p, userName: user.displayName || p.userName, userEmail: user.email || p.userEmail })); }
  }, [isOpen, user]);

  useEffect(() => {
    if (asset?.isRentable && asset?.priceValue && form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 3600000));
        const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        const pType = (asset.pricingType || '').toLowerCase();
        setEstimatedPrice(pType.includes('jam') ? asset.priceValue * diffHours : pType.includes('hari') ? asset.priceValue * diffDays : asset.priceValue);
      } else setEstimatedPrice(0);
    } else setEstimatedPrice(0);
  }, [form, asset]);

  const handleNext = (e: React.FormEvent) => { e.preventDefault(); if (step === 1) setStep(2); else onSubmit(form); };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col focus:outline-none">
        <DialogTitle className="sr-only">Form Booking {asset?.name}</DialogTitle>
        
        {/* Dynamic Header */}
        <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">Form Peminjaman</h2>
            <p className="text-sm text-blue-200 font-medium flex items-center gap-1.5"><MapPin size={14}/> {asset?.name}</p>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-4 mt-6">
              <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`}>1</div> Jadwal
              </div>
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
              <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`}>2</div> Pemohon
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 flex-1 custom-scrollbar bg-slate-50">
          <form id="wizard-form" onSubmit={handleNext}>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4"><CalendarIcon size={16} className="text-blue-500"/> Atur Waktu & Agenda</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Tgl Mulai *</Label><Input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="h-12 rounded-xl bg-slate-50" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Jam Mulai *</Label><Input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="h-12 rounded-xl bg-slate-50" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Tgl Selesai *</Label><Input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} min={form.startDate} className="h-12 rounded-xl bg-slate-50" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Jam Selesai *</Label><Input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="h-12 rounded-xl bg-slate-50" /></div>
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-slate-500">Deskripsi / Tujuan *</Label>
                      <textarea required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder="Contoh: Seminar dan Pelatihan internal..."></textarea>
                    </div>
                  </div>

                  {asset?.isRentable && (
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-[1.5rem] flex items-center justify-between">
                      <div><p className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1 mb-1"><DollarSign size={14}/> Estimasi Biaya</p></div>
                      <div className="text-right"><p className="text-2xl font-black text-blue-600">Rp {estimatedPrice.toLocaleString('id-ID')}</p></div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4"><User size={16} className="text-blue-500"/> Kontak Penanggung Jawab</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Nama Lengkap *</Label><Input required value={form.userName} onChange={e => setForm({...form, userName: e.target.value})} className="h-12 rounded-xl bg-slate-50 text-sm font-medium" placeholder="Nama Anda" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Instansi / Perusahaan *</Label><Input required value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} className="h-12 rounded-xl bg-slate-50 text-sm font-medium" placeholder="Nama instansi" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Email *</Label><Input type="email" required value={form.userEmail} onChange={e => setForm({...form, userEmail: e.target.value})} className="h-12 rounded-xl bg-slate-50 text-sm font-medium" placeholder="email@contoh.com" /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">WhatsApp *</Label><Input type="tel" required value={form.userPhone} onChange={e => setForm({...form, userPhone: e.target.value})} className="h-12 rounded-xl bg-slate-50 text-sm font-medium" placeholder="08..." /></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          {step === 1 ? <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100">Batal</Button>
            : <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl h-12 px-6 font-bold text-slate-700 border-slate-200 hover:bg-slate-50"><ArrowLeft className="w-4 h-4 mr-2"/> Kembali</Button>}
          <Button type="submit" form="wizard-form" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {step === 1 ? <><span className="mr-2">Lanjut</span> <ArrowRight className="w-4 h-4"/></> : 'Kirim Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}