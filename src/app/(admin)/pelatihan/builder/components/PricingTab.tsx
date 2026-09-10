// Lokasi file: src/app/pelatihan/builder/components/PricingTab.tsx
import React from 'react';
import { Training } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
}

export default function PricingTab({ form, setForm }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Harga & Tiket</h2>
        <p className="text-sm text-slate-500 mt-1">Atur harga, diskon, dan logistik pelaksanaan kelas.</p>
      </div>
      <hr className="border-slate-100" />
      
      {/* Pengaturan Harga */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <Label className="flex items-center gap-3 cursor-pointer mb-6">
          <input 
            type="checkbox" 
            checked={form.isFree} 
            onChange={(e) => setForm({...form, isFree: e.target.checked})} 
            className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          <div>
            <p className="font-bold text-slate-800 text-base">Kelas Ini Gratis (Free)</p>
            <p className="text-xs text-slate-500">Centang jika peserta bisa mendaftar tanpa proses pembayaran tagihan.</p>
          </div>
        </Label>

        {!form.isFree && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-slate-200">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700">Harga Normal (Rp)</Label>
              <Input 
                type="number" min="0" 
                value={form.price} 
                onChange={e=>setForm({...form, price: parseInt(e.target.value) || 0})} 
                className="h-12 rounded-xl text-lg font-bold bg-white" 
                placeholder="150000" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700">Harga Coret / Diskon (Opsional)</Label>
              <Input 
                type="number" min="0" 
                value={form.discountPrice || ''} 
                onChange={e=>setForm({...form, discountPrice: parseInt(e.target.value) || undefined})} 
                className="h-12 rounded-xl text-lg text-slate-500 bg-white" 
                placeholder="250000" 
              />
              <p className="text-xs text-slate-400">Harga lama untuk memunculkan efek coret promo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pengaturan Logistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Tanggal Mulai</Label>
          <Input 
            type="date" 
            value={form.date || ''} 
            onChange={e=>setForm({...form, date: e.target.value})} 
            className="h-11 rounded-xl" 
          />
          <p className="text-[10px] text-slate-400">Biarkan kosong jika ini adalah rekaman Video (Kapan saja).</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Tanggal Selesai (Opsional)</Label>
          <Input 
            type="date" 
            value={form.endDate || ''} 
            onChange={e=>setForm({...form, endDate: e.target.value})} 
            className="h-11 rounded-xl" 
          />
        </div>

        {/* Tambahan Logistik: Durasi & Jadwal */}
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Total Durasi Pelatihan</Label>
          <Input 
            value={form.durationDisplay || ''} 
            onChange={e=>setForm({...form, durationDisplay: e.target.value})} 
            className="h-11 rounded-xl" 
            placeholder="Cth: 40 Jam / 3 Hari" 
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Jadwal Harian (Waktu)</Label>
          <Input 
            value={form.scheduleDetails || ''} 
            onChange={e=>setForm({...form, scheduleDetails: e.target.value})} 
            className="h-11 rounded-xl" 
            placeholder="Cth: Senin-Jumat, 08.00 - 16.00 WIB" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Kuota Maksimal Peserta</Label>
          <Input 
            type="number" min="0" 
            value={form.quota} 
            onChange={e=>setForm({...form, quota: parseInt(e.target.value) || 0})} 
            className="h-11 rounded-xl" 
          />
          <p className="text-[10px] text-slate-400">Isi '0' jika kuota pendaftar tidak terbatas (Unlimited).</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Lokasi / Tautan Meeting</Label>
          <Input 
            value={form.location || ''} 
            onChange={e=>setForm({...form, location: e.target.value})} 
            className="h-11 rounded-xl" 
            placeholder="Cth: Gedung A Lt.2 / Link Zoom" 
          />
        </div>
      </div>
    </div>
  );
}