// Lokasi file: src/app/pelatihan/builder/components/MarketingTab.tsx
import React from 'react';
import { Training } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
}

export default function MarketingTab({ form, setForm }: TabProps) {
  
  // Fungsi Generic untuk menambah/mengubah/menghapus item pada array string
  const handleAddString = (field: 'targetAudience' | 'prerequisites' | 'skillsGained' | 'benefits') => {
    setForm({ ...form, [field]: [...(form[field] || []), ''] });
  };

  const handleUpdateString = (field: 'targetAudience' | 'prerequisites' | 'skillsGained' | 'benefits', index: number, value: string) => {
    const arr = [...(form[field] || [])];
    arr[index] = value;
    setForm({ ...form, [field]: arr });
  };

  const handleRemoveString = (field: 'targetAudience' | 'prerequisites' | 'skillsGained' | 'benefits', index: number) => {
    const arr = [...(form[field] || [])];
    arr.splice(index, 1);
    setForm({ ...form, [field]: arr });
  };

  // Komponen Helper Internal untuk merender List Input Dinamis
  const DynamicList = ({ title, desc, field, placeholder }: { title: string, desc: string, field: 'targetAudience' | 'prerequisites' | 'skillsGained' | 'benefits', placeholder: string }) => (
    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Label className="text-sm font-bold text-slate-800">{title}</Label>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
        <Button type="button" onClick={() => handleAddString(field)} size="sm" variant="outline" className="h-8 text-xs bg-white text-amber-600 border-amber-200 hover:bg-amber-50">
          <Plus size={14} className="mr-1" /> Tambah
        </Button>
      </div>
      
      {(!form[field] || form[field]?.length === 0) ? (
        <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
          Belum ada item ditambahkan.
        </div>
      ) : (
        <div className="space-y-2">
          {form[field]?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input 
                value={item} 
                onChange={e => handleUpdateString(field, idx, e.target.value)} 
                placeholder={placeholder}
                className="h-10 bg-white"
              />
              <Button type="button" onClick={() => handleRemoveString(field, idx)} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pemasaran & Landing Page</h2>
        <p className="text-sm text-slate-500 mt-1">Data ini akan ditampilkan di Landing Page untuk meyakinkan calon peserta.</p>
      </div>
      <hr className="border-slate-100" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DynamicList 
          title="Keahlian yang Didapat (Skills)" 
          desc="Skill spesifik yang akan dikuasai setelah lulus." 
          field="skillsGained" 
          placeholder="Cth: React JS, UI Design, Problem Solving" 
        />
        
        <DynamicList 
          title="Fasilitas & Keuntungan (Benefits)" 
          desc="Apa saja fasilitas tambahan di kelas ini?" 
          field="benefits" 
          placeholder="Cth: Sertifikat Kelulusan, Akses Grup Discord" 
        />
        
        <DynamicList 
          title="Target Peserta (Audience)" 
          desc="Siapa yang sangat cocok mengikuti kelas ini?" 
          field="targetAudience" 
          placeholder="Cth: Mahasiswa IT tingkat akhir" 
        />
        
        <DynamicList 
          title="Persyaratan Kelas (Prerequisites)" 
          desc="Apa yang perlu disiapkan peserta sebelum mulai?" 
          field="prerequisites" 
          placeholder="Cth: Memiliki laptop RAM min 4GB" 
        />
      </div>
    </div>
  );
}