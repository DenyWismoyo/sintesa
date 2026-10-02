// Lokasi file: src/app/(public)/fasilitas/components/BookingWizardModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Info,
  Maximize2,
  FileText,
  User,
  Mail,
  Phone,
  Building,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { Asset } from '@/types';

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function BookingWizardModal({ 
  isOpen, 
  onClose, 
  asset, 
  onSubmit, 
  isSubmitting 
}: BookingWizardModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [durationInfo, setDurationInfo] = useState<{ count: number; unit: string }>({ count: 1, unit: 'Hari' });

  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    agency: '',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '16:00',
    purpose: '',
  });

  // Pre-fill user data jika sedang login
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (user) {
        setForm(p => ({
          ...p,
          userName: user.displayName || p.userName,
          userEmail: user.email || p.userEmail,
        }));
      }
    }
  }, [isOpen, user]);

  // Kalkulasi estimasi tarif otomatis berdasarkan durasi
  useEffect(() => {
    const isRentable = asset?.isRentable === true || String(asset?.isRentable) === 'true';
    const priceValue = Number(asset?.priceValue) || 0;

    if (isRentable && priceValue > 0 && form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 3600000));
        const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        const pType = (asset?.pricingType || '').toLowerCase();

        if (pType.includes('jam')) {
          setEstimatedPrice(priceValue * diffHours);
          setDurationInfo({ count: diffHours, unit: 'Jam' });
        } else {
          setEstimatedPrice(priceValue * diffDays);
          setDurationInfo({ count: diffDays, unit: 'Hari' });
        }
      } else {
        setEstimatedPrice(0);
      }
    } else {
      setEstimatedPrice(0);
    }
  }, [form, asset]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      onSubmit(form);
    }
  };

  if (!asset) return null;

  const isRentable = asset.isRentable === true || String(asset.isRentable) === 'true';
  const basePrice = Number(asset.priceValue) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[720px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl max-h-[92vh] flex flex-col focus:outline-none fixed bottom-0 sm:bottom-auto">
        <DialogTitle className="sr-only">Formulir Booking {asset.name}</DialogTitle>

        {/* --- 1. HEADER RUANGAN TERPADU (16:9 PREVIEW & STEPPER) --- */}
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-5 sm:p-7 text-white relative shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Snapshot Ruangan */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 shadow-sm relative">
                {asset.imageUrl ? (
                  <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Building2 size={20} />
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                  Pengajuan Sewa Ruangan
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight line-clamp-1">
                  {asset.name}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={12} className="text-sky-400" /> {asset.capacity ? `${asset.capacity} Orang` : 'Fleksibel'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sky-400" /> {asset.location || 'Solo Technopark'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Pill Indicator */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 px-3 rounded-full border border-white/10 text-xs font-bold shrink-0 self-start sm:self-auto">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step === 1 ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {step === 1 ? '1' : <Check size={12} strokeWidth={3} />}
              </span>
              <span className="text-white text-[11px]">
                {step === 1 ? 'Jadwal Peminjaman' : 'Data Pemohon'}
              </span>
              <span className="text-white/40">/</span>
              <span className="text-white/60 text-[11px]">2</span>
            </div>

          </div>
        </div>

        {/* --- 2. FORM BODY BERTAHAP (ANIMATED STEPPER) --- */}
        <div className="overflow-y-auto p-5 sm:p-8 flex-1 bg-slate-50/60 custom-scrollbar">
          <form id="booking-wizard-form" onSubmit={handleNext}>
            <AnimatePresence mode="wait">
              
              {/* STEP 1: JADWAL & AGENDA */}
              {step === 1 && (
                <motion.div 
                  key="step1" 
                  initial={{ opacity: 0, x: -15 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 15 }} 
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <CalendarIcon size={15} className="text-sky-600" />
                        Pilih Rentang Waktu
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold">* Wajib diisi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Tanggal Mulai</Label>
                        <Input 
                          type="date" 
                          required 
                          value={form.startDate} 
                          onChange={e => setForm({...form, startDate: e.target.value})} 
                          className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Jam Mulai</Label>
                        <Input 
                          type="time" 
                          required 
                          value={form.startTime} 
                          onChange={e => setForm({...form, startTime: e.target.value})} 
                          className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Tanggal Selesai</Label>
                        <Input 
                          type="date" 
                          required 
                          min={form.startDate}
                          value={form.endDate} 
                          onChange={e => setForm({...form, endDate: e.target.value})} 
                          className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Jam Selesai</Label>
                        <Input 
                          type="time" 
                          required 
                          value={form.endTime} 
                          onChange={e => setForm({...form, endTime: e.target.value})} 
                          className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-slate-600">Nama Agenda / Tujuan Peminjaman</Label>
                      <textarea 
                        required 
                        rows={3}
                        value={form.purpose} 
                        onChange={e => setForm({...form, purpose: e.target.value})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none text-xs font-medium text-slate-800 transition-all placeholder:text-slate-400" 
                        placeholder="Contoh: Rapat Kerja Tahunan, Workshop Desain Grafis, atau Seminar Nasional..."
                      />
                    </div>
                  </div>

                  {/* Live Cost Estimation Card */}
                  {isRentable && basePrice > 0 && (
                    <div className="bg-sky-50/70 border border-sky-100 p-5 rounded-3xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 block mb-0.5">
                          Estimasi Biaya Retribusi
                        </span>
                        <p className="text-xs text-sky-700 font-semibold">
                          {durationInfo.count} {durationInfo.unit} × Rp {basePrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          Rp {estimatedPrice > 0 ? estimatedPrice.toLocaleString('id-ID') : basePrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: DATA PEMOHON & VERIFIKASI */}
              {step === 2 && (
                <motion.div 
                  key="step2" 
                  initial={{ opacity: 0, x: 15 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -15 }} 
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <User size={15} className="text-sky-600" />
                        Kontak Penanggung Jawab
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold">* Wajib diisi</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Nama Lengkap</Label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input 
                            required 
                            value={form.userName} 
                            onChange={e => setForm({...form, userName: e.target.value})} 
                            className="h-11 pl-10 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                            placeholder="Nama PIC Peminjam"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Instansi / Organisasi / Komunitas</Label>
                        <div className="relative">
                          <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input 
                            required 
                            value={form.agency} 
                            onChange={e => setForm({...form, agency: e.target.value})} 
                            className="h-11 pl-10 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                            placeholder="Contoh: PT Inovasi Maju / BEM Universitas"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Email Resmi</Label>
                          <div className="relative">
                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              type="email" 
                              required 
                              value={form.userEmail} 
                              onChange={e => setForm({...form, userEmail: e.target.value})} 
                              className="h-11 pl-10 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                              placeholder="email@instansi.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Nomor WhatsApp Aktif</Label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              type="tel" 
                              required 
                              value={form.userPhone} 
                              onChange={e => setForm({...form, userPhone: e.target.value})} 
                              className="h-11 pl-10 rounded-2xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white" 
                              placeholder="08123456789"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Konfirmasi Sebelum Submit */}
                  <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Ringkasan Pengajuan
                    </span>
                    <div className="flex justify-between text-slate-700">
                      <span>Jadwal:</span>
                      <span className="font-bold">{form.startDate} ({form.startTime} - {form.endTime} WIB)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Agenda:</span>
                      <span className="font-bold truncate max-w-[240px]">{form.purpose || '-'}</span>
                    </div>
                    {isRentable && estimatedPrice > 0 && (
                      <div className="flex justify-between text-sky-800 font-extrabold pt-1 border-t border-slate-200">
                        <span>Total Biaya:</span>
                        <span>Rp {estimatedPrice.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>

        {/* --- 3. FOOTER ACTIONS --- */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          {step === 1 ? (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="rounded-full h-11 px-5 font-bold text-xs text-slate-500 hover:bg-slate-100"
            >
              Batalkan
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(1)} 
              className="rounded-full h-11 px-5 font-bold text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali
            </Button>
          )}

          <Button 
            type="submit" 
            form="booking-wizard-form" 
            disabled={isSubmitting} 
            className="rounded-full h-11 px-7 font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/25 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : step === 1 ? (
              <>
                <span>Lanjut Isi Data</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 ml-0 mr-1.5" />
                <span>Kirim Permohonan</span>
              </>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}