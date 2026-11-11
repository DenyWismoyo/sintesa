// Lokasi file: src/app/(admin)/manajemen-kurasi/components/TabBatchTokens.tsx
// Manajemen Token Batch Asesmen & Kode Akses Kelas

'use client';

import React, { useState } from 'react';
import {
  CurationToken,
  CurationDomain,
  CURATION_DOMAIN_LABELS,
} from '@/types/curation.types';
import { useCurationTokens, useCurationTemplates, useCurationMutations } from '@/hooks/useCurationSystem';
import {
  Key,
  Plus,
  Copy,
  Share2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TabBatchTokens() {
  const { data: tokens = [], isLoading } = useCurationTokens();
  const { data: templates = [] } = useCurationTemplates();
  const { createToken } = useCurationMutations();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    templateId: '',
    batchName: '',
    maxUses: 50,
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode token wajib diisi.');
      return;
    }
    const tpl = templates.find((t) => t.id === formData.templateId);
    if (!tpl) {
      toast.error('Pilih template asesmen terlebih dahulu.');
      return;
    }

    await createToken.mutateAsync({
      code: formData.code.trim().toUpperCase(),
      templateId: tpl.id,
      trackName: tpl.trackName,
      curationDomain: tpl.curationDomain,
      batchName: formData.batchName.trim() || 'Batch Umum',
      maxUses: Number(formData.maxUses) || 50,
      isActive: true,
      notes: formData.notes,
    });

    setIsCreateOpen(false);
    setFormData({ code: '', templateId: '', batchName: '', maxUses: 50, notes: '' });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode token ${code} berhasil disalin!`);
  };

  const handleShareWa = (token: CurationToken) => {
    const link = `https://katalog.solotechnopark.id/curation?token=${token.code}`;
    const text = `Halo Rekan-rekan Peserta *${token.batchName}*,\n\nSilakan ikuti Asesmen Kompetensi / Kurasi resmi Solo Technopark melalui tautan berikut:\n${link}\n\nKode Token Akses: *${token.code}*\n\nMohon selesaikan pengisian form asesmen Anda. Terima kasih!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Key size={16} className="text-indigo-600" /> Distribusi Token Batch Asesmen & Kelas Pelatihan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Terbitkan kode akses khusus untuk peserta kelas pelatihan vokasi, batch kurasi UMKM, atau penjurian inovasi.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 rounded-xl shadow-xs"
        >
          <Plus size={14} /> Terbitkan Token Baru
        </Button>
      </div>

      {/* MODAL TERBITKAN TOKEN */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Key size={18} className="text-indigo-600" /> Terbitkan Token Batch Baru
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kode Akses Token *</label>
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: WELDER-SMK-2026 atau IKM-BATIK-01"
                  className="text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Template Asesmen Terikat *</label>
                <select
                  required
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="">-- Pilih Template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{CURATION_DOMAIN_LABELS[t.curationDomain]}] {t.trackName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Batch / Kelas</label>
                  <Input
                    value={formData.batchName}
                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                    placeholder="Contoh: Batch II Welder"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Maksimal Kuota Penggunaan</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Catatan Internal (Opsional)</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Diberikan untuk 30 siswa binaan BP3MI"
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs font-bold">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createToken.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {createToken.isPending ? 'Menerbitkan...' : 'Terbitkan Token'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAFTAR TOKEN */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-200">
          Memuat token...
        </div>
      ) : tokens.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-2">
          <Key size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">Belum ada token batch yang dibuat.</p>
          <p className="text-xs text-slate-400">Klik "Terbitkan Token Baru" untuk membagikan akses asesmen ke peserta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-black text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100">
                    {token.code}
                  </span>
                  <Badge variant={token.isActive ? 'default' : 'secondary'} className="text-[10px]">
                    {token.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>

                <h4 className="font-bold text-slate-800 text-sm mb-1">{token.batchName}</h4>
                <p className="text-xs text-slate-500 line-clamp-1 mb-3">{token.trackName}</p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Domain:</span>
                    <span className="font-bold text-slate-800">{CURATION_DOMAIN_LABELS[token.curationDomain]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Kuota Pemakaian:</span>
                    <span className="font-bold text-indigo-700">
                      {token.usedCount} / {token.maxUses || '∞'} Peserta
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(token.code)}
                  className="flex-1 text-xs font-bold h-8 gap-1 rounded-xl"
                >
                  <Copy size={12} /> Salin Kode
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleShareWa(token)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3 rounded-xl gap-1"
                >
                  <Share2 size={12} /> WhatsApp
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

