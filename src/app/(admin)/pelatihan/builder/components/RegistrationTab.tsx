// Lokasi file: src/app/pelatihan/builder/components/RegistrationTab.tsx
import React, { useState, useEffect } from 'react';
import { Training, CustomFormField, TrainingRegistration } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileText, Download, Loader2 } from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
  editId?: string | null;
}

export default function RegistrationTab({ form, setForm, editId }: TabProps) {
  const [participants, setParticipants] = useState<TrainingRegistration[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (editId) {
      const fetchParticipants = async () => {
        setLoadingParticipants(true);
        try {
          const q = query(collection(db, 'trainings', editId, 'registrations'));
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingRegistration));
          data.sort((a, b) => (a.status === 'PENDING' ? -1 : 1));
          setParticipants(data);
        } catch (error) {
          console.error("Gagal memuat peserta", error);
        }
        setLoadingParticipants(false);
      };
      fetchParticipants();
    }
  }, [editId]);

  const handleAddField = () => {
    const newField: CustomFormField = { 
      id: Date.now().toString(), 
      label: '', 
      type: 'file', 
      isRequired: true 
    };
    setForm({ ...form, registrationFields: [...(form.registrationFields || []), newField] });
  };

  const handleUpdateField = (id: string, fieldKey: keyof CustomFormField, value: any) => {
    const updated = (form.registrationFields || []).map(f => f.id === id ? { ...f, [fieldKey]: value } : f);
    setForm({ ...form, registrationFields: updated });
  };

  const handleRemoveField = (id: string) => {
    setForm({ ...form, registrationFields: (form.registrationFields || []).filter(f => f.id !== id) });
  };

  const handleUpdateStatus = async (regId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    if (!editId) return;
    try {
      await updateDoc(doc(db, 'trainings', editId, 'registrations', regId), { status: newStatus });
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, status: newStatus } : p));
      toast.success(`Peserta berhasil di-${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error("Gagal mengubah status peserta");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* BAGIAN 1: PENGATURAN PERSYARATAN */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-amber-500"/> Persyaratan Pendaftaran
            </h2>
            <p className="text-sm text-slate-500 mt-1">Atur dokumen atau data tambahan apa yang wajib dilampirkan peserta saat mendaftar.</p>
          </div>
          <Button type="button" onClick={handleAddField} size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Plus size={16} className="mr-1" /> Tambah Syarat
          </Button>
        </div>
        <hr className="border-slate-100 mb-6" />

        <div className="space-y-4">
          {(form.registrationFields || []).map((field) => (
            <div key={field.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold text-slate-500">Nama Dokumen / Pertanyaan</Label>
                <Input 
                  value={field.label} 
                  onChange={e => handleUpdateField(field.id, 'label', e.target.value)} 
                  className="h-10 bg-white" 
                  placeholder="Cth: Upload KTP / Link Portofolio / Alasan Bergabung" 
                />
              </div>
              <div className="w-full sm:w-48 space-y-2">
                <Label className="text-xs font-bold text-slate-500">Jenis Input</Label>
                <select 
                  value={field.type} 
                  onChange={e => handleUpdateField(field.id, 'type', e.target.value)} 
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="file">File Dokumen (PDF/Gambar)</option>
                  <option value="link">URL / Tautan Link</option>
                  <option value="text">Teks Pendek</option>
                </select>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <Label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={field.isRequired} 
                    onChange={e => handleUpdateField(field.id, 'isRequired', e.target.checked)} 
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4" 
                  />
                  Wajib
                </Label>
                <Button onClick={() => handleRemoveField(field.id)} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          ))}
          {(!form.registrationFields || form.registrationFields.length === 0) && (
            <div className="text-center py-6 text-slate-400 text-sm border border-dashed rounded-xl">
              Belum ada persyaratan tambahan. Peserta hanya perlu mengisi Nama & Email dasar.
            </div>
          )}
        </div>
      </section>

      {/* BAGIAN 2: VALIDASI PESERTA (Hanya muncul jika mode edit kelas yang sudah ada) */}
      {editId && (
        <section className="pt-6 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Daftar & Validasi Peserta</h2>
            <p className="text-sm text-slate-500 mt-1">Tinjau dokumen yang diunggah peserta dan setujui atau tolak pendaftaran mereka.</p>
          </div>

          {loadingParticipants ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-amber-500" /></div>
          ) : participants.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm border border-dashed rounded-xl bg-slate-50/50">
              Belum ada peserta yang mendaftar di kelas ini.
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{p.name}</h4>
                    <p className="text-xs text-slate-500">{p.email} • {p.phone}</p>
                    
                    {/* Render Custom Data / Uploaded Docs jika peserta mengisi syarat */}
                    {p.customData && Object.keys(p.customData).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(p.customData).map(([key, value]) => (
                          <div key={key} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{key}:</span>
                            {/* PERBAIKAN REACT NODE ERROR: Memaksa value dirender sebagai string dengan String() */}
                            {String(value).startsWith('http') ? (
                              <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                <Download size={12} /> Buka File/Link
                              </a>
                            ) : (
                              <span className="text-xs text-slate-700">{String(value)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      p.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 
                      p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                    
                    {p.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <Button onClick={() => handleUpdateStatus(p.id!, 'REJECTED')} variant="outline" size="sm" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50">Tolak</Button>
                        <Button onClick={() => handleUpdateStatus(p.id!, 'CONFIRMED')} size="sm" className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600">Setujui</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}