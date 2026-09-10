// Lokasi file: src/app/pelatihan/builder/components/CurriculumTab.tsx
import React, { useState } from 'react';
import { Training, Module, Lesson } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Lock, Unlock, LayoutList, UploadCloud, Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { trainingService } from '@/services/training.service';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
}

export default function CurriculumTab({ form, setForm }: TabProps) {
  // State untuk menampung ID materi yang sedang proses upload file
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  const handleAddModule = () => {
    const newModule: Module = { id: Date.now().toString(), title: '', description: '', lessons: [] };
    setForm({ ...form, curriculum: [...(form.curriculum || []), newModule] });
  };

  const handleUpdateModule = (moduleId: string, field: 'title' | 'description', value: string) => {
    const updated = (form.curriculum || []).map(m => m.id === moduleId ? { ...m, [field]: value } : m);
    setForm({ ...form, curriculum: updated });
  };

  const handleRemoveModule = (moduleId: string) => {
    const filtered = (form.curriculum || []).filter(m => m.id !== moduleId);
    setForm({ ...form, curriculum: filtered });
  };

  const handleAddLesson = (moduleId: string) => {
    const newLesson: Lesson = { 
      id: Date.now().toString(), 
      title: '', 
      type: 'Video', 
      content: '', 
      durationMins: 0, 
      isLocked: true 
    };
    const updated = (form.curriculum || []).map(m => {
      if (m.id === moduleId) return { ...m, lessons: [...m.lessons, newLesson] };
      return m;
    });
    setForm({ ...form, curriculum: updated });
  };

  const handleUpdateLesson = (moduleId: string, lessonId: string, field: keyof Lesson, value: any) => {
    const updated = (form.curriculum || []).map(m => {
      if (m.id === moduleId) {
        const upLessons = m.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l);
        return { ...m, lessons: upLessons };
      }
      return m;
    });
    setForm({ ...form, curriculum: updated });
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    const updated = (form.curriculum || []).map(m => {
      if (m.id === moduleId) return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
      return m;
    });
    setForm({ ...form, curriculum: updated });
  };

  // FUNGSI BARU: Menangani Upload File Materi langsung ke Firebase Storage
  const handleFileUpload = async (moduleId: string, lessonId: string, file: File | null) => {
    if (!file) return;
    setUploadingLessonId(lessonId);
    try {
      // Meminjam fungsi upload dari trainingService
      const url = await trainingService.uploadImage(file); 
      handleUpdateLesson(moduleId, lessonId, 'fileUrl', url);
      handleUpdateLesson(moduleId, lessonId, 'fileName', file.name);
      toast.success("Dokumen berhasil diunggah!");
    } catch (err) {
      toast.error("Gagal mengunggah dokumen.");
    } finally {
      setUploadingLessonId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kurikulum & Materi (LMS)</h2>
          <p className="text-sm text-slate-500 mt-1">Buat struktur bab (modul) dan isi dengan video, bacaan, atau tugas interaktif.</p>
        </div>
        <Button onClick={handleAddModule} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 px-4">
          <Plus size={16} className="mr-2" /> Tambah Modul/Bab
        </Button>
      </div>
      <hr className="border-slate-100" />

      {(!form.curriculum || form.curriculum.length === 0) ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <LayoutList size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-slate-600 font-bold text-lg mb-1">Kurikulum Kosong</h3>
          <p className="text-slate-500 text-sm mb-4">Tambahkan bab pertama untuk mulai merancang materi pembelajaran.</p>
          <Button onClick={handleAddModule} variant="outline" className="rounded-xl border-slate-300 bg-white">Buat Bab Pertama</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {form.curriculum.map((mod, mIndex) => (
            <div key={mod.id} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
              {/* Header Bab / Modul */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-start justify-between group">
                <div className="flex-1 mr-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">Bab {mIndex + 1}</span>
                    <Input 
                      value={mod.title} 
                      onChange={e => handleUpdateModule(mod.id, 'title', e.target.value)} 
                      className="h-8 text-sm font-bold bg-transparent border-transparent hover:border-slate-300 focus:bg-white px-2" 
                      placeholder="Judul Bab (Cth: Pengenalan Dasar)" 
                    />
                  </div>
                  <Input 
                    value={mod.description || ''} 
                    onChange={e => handleUpdateModule(mod.id, 'description', e.target.value)} 
                    className="h-8 text-xs text-slate-500 bg-transparent border-transparent hover:border-slate-300 focus:bg-white px-2" 
                    placeholder="Deskripsi singkat bab ini..." 
                  />
                </div>
                <Button onClick={() => handleRemoveModule(mod.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Isi Materi (Lessons) */}
              <div className="p-4 bg-white space-y-4">
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:border-slate-300 transition-colors">
                    
                    {/* Baris 1: Tipe, Judul, Durasi, Aksi */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <select 
                        value={lesson.type} 
                        onChange={e => handleUpdateLesson(mod.id, lesson.id, 'type', e.target.value)} 
                        className="h-10 px-3 rounded-xl border-slate-200 text-sm font-semibold focus:ring-amber-500 bg-white shrink-0"
                      >
                        <option value="Video">🎥 Video</option>
                        <option value="Reading">📄 Teks Bacaan</option>
                        <option value="Resource">📎 File Materi</option>
                        <option value="Assignment">📝 Tugas (Interaktif)</option>
                      </select>
                      
                      <Input 
                        value={lesson.title} 
                        onChange={e => handleUpdateLesson(mod.id, lesson.id, 'title', e.target.value)} 
                        className="h-10 text-sm bg-white flex-1 font-bold" 
                        placeholder="Judul Materi..." 
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <Input 
                            type="number" min="0" 
                            value={lesson.durationMins || ''} 
                            onChange={e => handleUpdateLesson(mod.id, lesson.id, 'durationMins', parseInt(e.target.value) || 0)} 
                            className="h-10 w-24 text-sm bg-white pr-8 text-center" 
                            placeholder="0" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Mnt</span>
                        </div>
                        
                        <button 
                          onClick={() => handleUpdateLesson(mod.id, lesson.id, 'isLocked', !lesson.isLocked)}
                          className={`h-10 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${lesson.isLocked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                          title={lesson.isLocked ? "Terkunci (Bayar)" : "Preview Gratis"}
                        >
                          {lesson.isLocked ? <><Lock size={14}/> Kunci</> : <><Unlock size={14}/> Gratis</>}
                        </button>

                        <Button onClick={() => handleRemoveLesson(mod.id, lesson.id)} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Baris 2: Konten Dinamis Berdasarkan Tipe */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-1">
                      
                      {lesson.type === 'Video' && (
                        <div className="flex items-center gap-2">
                          <Link2 size={16} className="text-slate-400 shrink-0" />
                          <Input 
                            value={lesson.content} 
                            onChange={e => handleUpdateLesson(mod.id, lesson.id, 'content', e.target.value)} 
                            className="h-10 text-sm border-none shadow-none focus-visible:ring-0 px-0" 
                            placeholder="Masukkan link Youtube atau Google Drive Video..." 
                          />
                        </div>
                      )}

                      {lesson.type === 'Reading' && (
                        <textarea 
                          value={lesson.content} 
                          onChange={e => handleUpdateLesson(mod.id, lesson.id, 'content', e.target.value)} 
                          rows={4}
                          className="w-full text-sm border-none shadow-none focus:ring-0 resize-y p-1 outline-none text-slate-700" 
                          placeholder="Tulis materi bacaan di sini..." 
                        />
                      )}

                      {lesson.type === 'Resource' && (
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampiran File Pendukung</p>
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Tombol Upload File */}
                            <div className="relative flex-1 h-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden group">
                              {uploadingLessonId === lesson.id ? (
                                <span className="text-sm font-semibold text-amber-600 flex items-center gap-2"><Loader2 size={16} className="animate-spin"/> Mengunggah...</span>
                              ) : lesson.fileName ? (
                                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-2 truncate px-4">
                                  ✅ {lesson.fileName} <span className="text-xs text-slate-400 group-hover:text-red-500 ml-2">(Klik untuk ganti)</span>
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><UploadCloud size={16}/> Unggah PDF/Dokumen</span>
                              )}
                              <input 
                                type="file" 
                                onChange={(e) => handleFileUpload(mod.id, lesson.id, e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            
                            <div className="flex items-center justify-center text-xs font-bold text-slate-400 uppercase">ATAU</div>
                            
                            {/* Input Link Eksternal */}
                            <Input 
                              value={lesson.content} 
                              onChange={e => handleUpdateLesson(mod.id, lesson.id, 'content', e.target.value)} 
                              className="flex-1 h-12 text-sm" 
                              placeholder="Gunakan Link Eksternal (Google Drive)" 
                            />
                          </div>
                        </div>
                      )}

                      {lesson.type === 'Assignment' && (
                        <div className="space-y-4">
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                            <p className="text-xs font-medium text-amber-800">
                              Materi ini mewajibkan peserta mengumpulkan tugas sebelum bisa ditandai selesai. Tugas akan masuk ke antrean penilaian Anda.
                            </p>
                          </div>
                          <textarea 
                            value={lesson.content} 
                            onChange={e => handleUpdateLesson(mod.id, lesson.id, 'content', e.target.value)} 
                            rows={3}
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-500" 
                            placeholder="Deskripsikan soal atau instruksi tugas secara detail..." 
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-500 mb-2">Metode Pengumpulan Peserta</p>
                            <select 
                              value={lesson.assignmentType || 'Both'} 
                              onChange={e => handleUpdateLesson(mod.id, lesson.id, 'assignmentType', e.target.value)} 
                              className="w-full sm:w-64 h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium focus:ring-amber-500 bg-white"
                            >
                              <option value="Both">Bisa Ketik Teks & Upload File</option>
                              <option value="Text">Hanya Mengetik Teks Saja</option>
                              <option value="FileUpload">Hanya Mengunggah File (PDF/ZIP)</option>
                            </select>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
                
                <Button onClick={() => handleAddLesson(mod.id)} variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 mt-2 text-sm font-bold w-full justify-start h-12 rounded-xl border border-dashed border-amber-200">
                  <Plus size={16} className="mr-2" /> Tambah Sub-Materi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}