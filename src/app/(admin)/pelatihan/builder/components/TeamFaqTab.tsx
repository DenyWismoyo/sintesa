// Lokasi file: src/app/pelatihan/builder/components/TeamFaqTab.tsx
import React, { useState } from 'react';
import { Training, Instructor, FAQ } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, User, MessageCircleQuestion, Key, RefreshCw, Copy, Info, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trainingService } from '@/services/training.service';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
  editId?: string | null;
  isInstructor?: boolean;
}

export default function TeamFaqTab({ form, setForm, editId, isInstructor }: TabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddInstructor = () => {
    const newInst: Instructor = { id: Date.now().toString(), name: '', title: '', bio: '', photoUrl: '' };
    setForm({ ...form, instructors: [...(form.instructors || []), newInst] });
  };

  const handleUpdateInstructor = (id: string, field: keyof Instructor, value: string) => {
    const updated = (form.instructors || []).map(i => i.id === id ? { ...i, [field]: value } : i);
    setForm({ ...form, instructors: updated });
  };

  const handleRemoveInstructor = (id: string) => {
    setForm({ ...form, instructors: (form.instructors || []).filter(i => i.id !== id) });
  };

  const handleAddFaq = () => {
    const newFaq: FAQ = { id: Date.now().toString(), question: '', answer: '' };
    setForm({ ...form, faqs: [...(form.faqs || []), newFaq] });
  };

  const handleUpdateFaq = (id: string, field: keyof FAQ, value: string) => {
    const updated = (form.faqs || []).map(f => f.id === id ? { ...f, [field]: value } : f);
    setForm({ ...form, faqs: updated });
  };

  const handleRemoveFaq = (id: string) => {
    setForm({ ...form, faqs: (form.faqs || []).filter(f => f.id !== id) });
  };

  // LOGIKA BARU: MENGUNCI KODE KE DATABASE MENGGUNAKAN SERVICE
  const generateAccessCode = async () => {
    if (!editId) {
       toast.error("Simpan Kelas Dulu", { description: "Anda harus menyimpan draf kelas ini terlebih dahulu sebelum bisa membuat kode." });
       return;
    }

    setIsGenerating(true);
    try {
      // Memanggil Service untuk langsung mengupdate database Firebase
      const newCode = await trainingService.generateInstructorCode(editId);
      
      // Update antarmuka (UI) dengan kode baru
      setForm({ ...form, instructorAccessCode: newCode });
      toast.success("Terkunci!", { description: "Kode akses berhasil dibuat dan disimpan permanen." });
    } catch (error) {
      toast.error("Network Error", { description: "Gagal mengunci kode ke database." });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAccessCode = () => {
    if (form.instructorAccessCode) {
      navigator.clipboard.writeText(form.instructorAccessCode);
      toast.success("Tersalin!", { description: "Kode berhasil disalin ke Clipboard." });
    } else {
      toast.error("Tidak ada kode untuk disalin.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {!isInstructor && (
        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2 mb-2">
                <Key className="text-indigo-600" /> Akses Portal Instruktur Luar
              </h2>
              <p className="text-sm text-indigo-700 leading-relaxed max-w-2xl mb-4">
                Ingin mengundang pengajar luar untuk menyusun materi dan mengoreksi tugas di kelas ini tanpa memberikan akses Admin? Buatkan kode undangan rahasia untuk mereka.
              </p>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 bg-indigo-100/50 p-3 rounded-xl border border-indigo-200">
                <Info size={16} className="shrink-0 text-indigo-500" />
                Mereka dapat mendaftar dan login menggunakan kode ini melalui rute: <strong className="bg-white px-1.5 py-0.5 rounded text-indigo-900 border border-indigo-200">/lms</strong>
              </div>
            </div>

            <div className="w-full md:w-72 shrink-0 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center justify-center text-center">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kode Akses Kelas</Label>
              
              {/* PENJAGAAN: Wajib klik Simpan dulu jika ID kelas belum ada */}
              {!editId ? (
                <div className="flex flex-col items-center justify-center text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 w-full">
                  <AlertCircle size={20} className="mb-2 text-amber-500" />
                  <p className="text-[11px] font-bold leading-relaxed">Simpan draf kelas ini terlebih dahulu (tombol Simpan di kanan atas) untuk mengaktifkan Kode Akses.</p>
                </div>
              ) : form.instructorAccessCode ? (
                <div className="w-full">
                  <div className="bg-slate-50 border border-slate-200 text-xl font-black text-slate-800 py-3 rounded-lg tracking-widest mb-3 select-all">
                    {form.instructorAccessCode}
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button type="button" onClick={copyAccessCode} className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                      <Copy size={14} className="mr-1.5" /> Salin
                    </Button>
                    <Button type="button" onClick={generateAccessCode} disabled={isGenerating} variant="outline" className="flex-1 h-9 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs">
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />} Reset
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" onClick={generateAccessCode} disabled={isGenerating} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key size={16} className="mr-2" />} Generate Kode Akses
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><User className="text-amber-500"/> Profil Instruktur (Publik)</h2>
            <p className="text-sm text-slate-500 mt-1">Siapa yang akan memandu kelas ini? Data ini akan ditampilkan di halaman depan.</p>
          </div>
          <Button type="button" onClick={handleAddInstructor} size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Plus size={16} className="mr-1" /> Tambah Pengajar
          </Button>
        </div>
        <hr className="border-slate-100 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(form.instructors || []).map((inst) => (
            <div key={inst.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
              <button onClick={() => handleRemoveInstructor(inst.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              <div className="space-y-3 w-[90%]">
                <div>
                  <Label className="text-xs font-bold text-slate-500">Nama Lengkap</Label>
                  <Input value={inst.name} onChange={e => handleUpdateInstructor(inst.id, 'name', e.target.value)} className="h-9 bg-white mt-1" placeholder="Cth: Budi Santoso" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500">Jabatan / Profesi</Label>
                  <Input value={inst.title} onChange={e => handleUpdateInstructor(inst.id, 'title', e.target.value)} className="h-9 bg-white mt-1" placeholder="Cth: Senior Developer" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500">URL Foto (Opsional)</Label>
                  <Input value={inst.photoUrl || ''} onChange={e => handleUpdateInstructor(inst.id, 'photoUrl', e.target.value)} className="h-9 bg-white mt-1" placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500">Bio Singkat</Label>
                  <textarea value={inst.bio || ''} onChange={e => handleUpdateInstructor(inst.id, 'bio', e.target.value)} className="w-full h-16 p-2 rounded-lg bg-white border border-slate-200 mt-1 text-sm outline-none" placeholder="Ceritakan pengalaman singkat pengajar..." />
                </div>
              </div>
            </div>
          ))}
          {(!form.instructors || form.instructors.length === 0) && (
            <div className="col-span-1 md:col-span-2 text-center py-6 text-slate-400 text-sm border border-dashed rounded-xl">Belum ada profil instruktur publik.</div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MessageCircleQuestion className="text-amber-500"/> FAQ (Tanya Jawab)</h2>
            <p className="text-sm text-slate-500 mt-1">Sediakan jawaban untuk pertanyaan yang paling sering ditanyakan calon peserta.</p>
          </div>
          <Button type="button" onClick={handleAddFaq} size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Plus size={16} className="mr-1" /> Tambah FAQ
          </Button>
        </div>
        <hr className="border-slate-100 mb-6" />

        <div className="space-y-3">
          {(form.faqs || []).map((faq) => (
            <div key={faq.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex-1 space-y-3">
                <Input value={faq.question} onChange={e => handleUpdateFaq(faq.id as string, 'question', e.target.value)} className="h-10 font-bold bg-white" placeholder="Pertanyaan (Cth: Apakah dapat sertifikat?)" />
                <textarea value={faq.answer} onChange={e => handleUpdateFaq(faq.id as string, 'answer', e.target.value)} className="w-full h-20 p-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-amber-500" placeholder="Jawaban lengkap..." />
              </div>
              <Button onClick={() => handleRemoveFaq(faq.id as string)} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          {(!form.faqs || form.faqs.length === 0) && (
            <div className="text-center py-6 text-slate-400 text-sm border border-dashed rounded-xl">Belum ada FAQ.</div>
          )}
        </div>
      </section>

    </div>
  );
}