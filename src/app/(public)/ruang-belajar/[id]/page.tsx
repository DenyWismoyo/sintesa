'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Training, Lesson, Submission } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trainingService } from '@/services/training.service';

import { 
  Loader2, ArrowLeft, PlayCircle, FileText, Download, Menu, X, ChevronDown, 
  ChevronUp, Lock, CheckCircle2, MonitorPlay, Maximize2, Minimize2, CheckCircle,
  Play, UploadCloud, File as FileIcon, Send, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const getEmbedUrl = (url?: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) return url.replace(/\/view(.*)/, '/preview');
  if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
  return url;
};

export default function RuangBelajarPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const trainingId = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [training, setTraining] = useState<Training | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({});

  // Form State untuk Pengumpulan Tugas
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const tSnap = await getDoc(doc(db, 'trainings', trainingId));
        if (!tSnap.exists()) {
          setLoading(false); return;
        }
        const tData = { id: tSnap.id, ...tSnap.data() } as Training;
        setTraining(tData);

        const q = query(collection(db, 'trainings', trainingId, 'registrations'), where('email', '==', user.email));
        const pSnap = await getDocs(q);
        
        let hasAccess = false;
        let regId = null;
        let initialCompleted: string[] = [];
        
        pSnap.forEach(d => {
          const reg = d.data() as any; 
          if (reg.status === 'CONFIRMED') {
            hasAccess = true;
            regId = d.id;
            if (reg.completedLessons && Array.isArray(reg.completedLessons)) {
              initialCompleted = reg.completedLessons;
            }
          }
        });

        setIsConfirmed(hasAccess);
        setRegistrationId(regId);
        setCompletedLessons(initialCompleted);

        // Ambil riwayat tugas yang sudah dikumpulkan peserta ini
        if (regId) {
          const subQ = query(collection(db, 'trainings', trainingId, 'registrations', regId, 'submissions'));
          const subSnap = await getDocs(subQ);
          const subs: Record<string, Submission> = {};
          subSnap.forEach(d => {
            subs[d.id] = { id: d.id, ...d.data() } as Submission;
          });
          setMySubmissions(subs);
        }

        // Auto-select materi pertama yang belum selesai
        if (tData.curriculum && tData.curriculum.length > 0) {
           let targetLesson = null;
           for (const mod of tData.curriculum) {
             for (const lesson of (mod.lessons || [])) {
               if (!initialCompleted.includes(lesson.id)) {
                 targetLesson = lesson; break;
               }
             }
             if (targetLesson) break;
           }
           if (!targetLesson && tData.curriculum[0]?.lessons) {
             targetLesson = tData.curriculum[0].lessons[0];
           }
           if (targetLesson) setActiveLesson(targetLesson);
        }
      } catch (error) {
        console.error("Gagal memuat ruang belajar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainingId, user, authLoading, router]);

  // Handler Tombol Tandai Selesai (Untuk Video/Teks/Resource)
  const handleMarkAsComplete = async () => {
    if (!activeLesson || !registrationId) return;
    
    if (!completedLessons.includes(activeLesson.id)) {
      const updatedLessons = [...completedLessons, activeLesson.id];
      setCompletedLessons(updatedLessons);

      try {
        const regRef = doc(db, 'trainings', trainingId, 'registrations', registrationId);
        await updateDoc(regRef, {
          completedLessons: arrayUnion(activeLesson.id),
          lastAccessedAt: Date.now()
        });
        toast.success("Materi berhasil diselesaikan!", { icon: '🎉', style: { background: '#10B981', color: 'white', border: 'none' } });
      } catch (error) {
        toast.error("Gagal menyimpan progres jaringan");
      }
    }

    // Auto Next
    let foundCurrent = false;
    let nextLesson: Lesson | null = null;
    for (const module of (training?.curriculum || [])) {
      for (const lesson of (module.lessons || [])) {
        if (foundCurrent) { nextLesson = lesson; break; }
        if (lesson.id === activeLesson.id) foundCurrent = true;
      }
      if (nextLesson) break;
    }

    if (nextLesson && !(nextLesson.isLocked && !isConfirmed)) {
      setTimeout(() => setActiveLesson(nextLesson), 1000);
    }
  };

  // Handler Pengumpulan Tugas Khusus
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson || !registrationId || !user) return;
    
    // Validasi sesuai tipe tugas yang diminta
    if (activeLesson.assignmentType === 'Text' && !assignmentText.trim()) return toast.error("Jawaban teks wajib diisi!");
    if (activeLesson.assignmentType === 'FileUpload' && !assignmentFile) return toast.error("File lampiran wajib diunggah!");
    if (activeLesson.assignmentType === 'Both' && (!assignmentText.trim() && !assignmentFile)) return toast.error("Harap isi teks atau unggah file!");

    setIsSubmittingTask(true);
    try {
      let attachmentUrl = '';
      if (assignmentFile) {
        toast.info("Mengunggah file tugas...");
        const uploadUrl = await trainingService.uploadImage(assignmentFile);
        attachmentUrl = uploadUrl;
      }

      const submissionData: Omit<Submission, 'id'> = {
        lessonId: activeLesson.id,
        participantEmail: user.email || '',
        participantName: user.displayName || 'Peserta',
        submittedAt: Date.now(),
        answerText: assignmentText,
        attachmentUrl: attachmentUrl,
        status: 'PENDING_REVIEW'
      };

      // Simpan ke sub-collection submissions dengan ID = lessonId (1 tugas per materi)
      const subRef = doc(db, 'trainings', trainingId, 'registrations', registrationId, 'submissions', activeLesson.id);
      await setDoc(subRef, submissionData);

      // Tandai materi ini sebagai "Selesai" di progres utama
      const regRef = doc(db, 'trainings', trainingId, 'registrations', registrationId);
      await updateDoc(regRef, {
        completedLessons: arrayUnion(activeLesson.id),
        lastAccessedAt: Date.now()
      });

      // Update State Lokal
      setMySubmissions(prev => ({ ...prev, [activeLesson.id]: { id: activeLesson.id, ...submissionData } as Submission }));
      setCompletedLessons(prev => [...prev, activeLesson.id]);
      setAssignmentText('');
      setAssignmentFile(null);

      toast.success("Tugas berhasil dikumpulkan!", { description: "Menunggu penilaian instruktur." });
    } catch (error) {
      toast.error("Gagal mengirim tugas. Silakan coba lagi.");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  if (!training) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">Data Kelas Tidak Ditemukan.</div>;

  const currentSubmission = activeLesson ? mySubmissions[activeLesson.id] : null;

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* HEADER ELEGAN */}
      <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/ruang-belajar" className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft size={18} />
          </Link>
          <div className="hidden sm:block">
            <h1 className="font-bold text-slate-900 text-sm leading-tight truncate max-w-xl">{training.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 border-amber-200 py-0 px-2 rounded-sm">LMS Player</Badge>
              {isConfirmed && <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> Akses Premium</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setIsTheaterMode(!isTheaterMode)} className="hidden lg:flex text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-10 px-4 rounded-full text-xs font-bold">
            {isTheaterMode ? <Minimize2 size={16} className="mr-2"/> : <Maximize2 size={16} className="mr-2"/>}
            {isTheaterMode ? 'Exit Theater' : 'Theater Mode'}
          </Button>
          <Button variant="ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-600 hover:text-slate-900 bg-slate-50 h-10 w-10 p-0 rounded-full flex items-center justify-center">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20}/>}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* AREA PLAYER UTAMA */}
        <main className={`flex-1 overflow-y-auto bg-[#F8FAFC] relative transition-all duration-500 ease-in-out ${isTheaterMode ? 'lg:px-20 lg:pt-8' : ''}`}>
          <div className={`mx-auto w-full transition-all duration-500 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
            
            {!activeLesson ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <MonitorPlay size={64} className="mb-4 opacity-20"/>
                <p className="font-bold text-slate-600">Pilih materi dari kurikulum untuk memulai.</p>
              </div>
            ) : (activeLesson.isLocked && !isConfirmed) ? (
              <div className="w-full aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center rounded-none lg:rounded-b-[24px]">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-30 blur-xl scale-110"></div>
                 <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-2xl max-w-md mx-4">
                   <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-6 border border-amber-400/30"><Lock size={28} /></div>
                   <h2 className="text-2xl font-black text-white mb-2">Materi Eksklusif</h2>
                   <p className="text-slate-300 text-sm mb-8 leading-relaxed">Materi "{activeLesson.title}" terkunci. Selesaikan pendaftaran dan tunggu validasi Admin untuk membuka akses.</p>
                 </div>
              </div>
            ) : (
              <div className="bg-white lg:rounded-b-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
                
                {/* RENDER MEDIA BERDASARKAN TIPE */}
                {activeLesson.type === 'Video' && (
                  <div className="w-full bg-black aspect-video relative group">
                    {activeLesson.content ? (
                      <iframe src={getEmbedUrl(activeLesson.content)} className="absolute inset-0 w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media"></iframe>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600"><PlayCircle size={48} className="mb-3 opacity-30"/><span className="text-sm font-medium">Video sedang dipersiapkan.</span></div>
                    )}
                  </div>
                )}

                {activeLesson.type === 'Resource' && (
                  <div className="w-full aspect-video bg-slate-100 flex flex-col relative border-b border-slate-200">
                    {/* IN-APP PDF VIEWER */}
                    {activeLesson.fileUrl && activeLesson.fileUrl.toLowerCase().includes('.pdf') ? (
                       <iframe src={`${activeLesson.fileUrl}#view=FitH`} className="w-full h-full border-none" title="PDF Viewer"></iframe>
                    ) : (
                      <div className="m-auto flex flex-col items-center text-center p-6">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-slate-200 text-indigo-500">
                          <FileText size={36} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">{activeLesson.fileName || 'File Materi Tambahan'}</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-md">Dokumen tidak dapat ditampilkan langsung. Silakan unduh untuk membaca.</p>
                        <a href={activeLesson.fileUrl || activeLesson.content} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2">
                          <Download size={18} /> Unduh Sekarang
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* AREA KONTEN TEXT & TUGAS */}
                <div className="p-6 md:p-10">
                  <div className="mb-8 pb-8 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                      <div className="flex gap-3 mt-1 mb-3 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">{activeLesson.type}</span>
                        <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded">{activeLesson.durationMins} Menit</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{activeLesson.title}</h2>
                    </div>
                    
                    {/* TOMBOL TANDAI SELESAI (Hanya untuk tipe non-Assignment) */}
                    {activeLesson.type !== 'Assignment' && (
                      <div className="shrink-0">
                        {completedLessons.includes(activeLesson.id) ? (
                          <Button disabled variant="outline" className="h-12 px-6 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 font-bold opacity-100 w-full md:w-auto">
                            <CheckCircle2 size={18} className="mr-2" /> Selesai Dipelajari
                          </Button>
                        ) : (
                          <Button onClick={handleMarkAsComplete} className="h-12 px-6 rounded-full bg-slate-900 hover:bg-amber-500 text-white font-bold shadow-lg transition-colors w-full md:w-auto">
                            <CheckCircle size={18} className="mr-2" /> Tandai Selesai & Lanjut
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* INTRUKSI MATERI UMUM */}
                  {activeLesson.type !== 'Resource' && (
                    <div className="prose max-w-none text-slate-600 leading-loose text-[15px] font-medium whitespace-pre-wrap px-2">
                      {activeLesson.content || <span className="italic text-slate-400">Tidak ada deskripsi tambahan.</span>}
                    </div>
                  )}

                  {/* =========================================
                      FORM PENGUMPULAN TUGAS (ASSIGNMENT) 
                      ========================================= */}
                  {activeLesson.type === 'Assignment' && (
                    <div className="mt-10 bg-slate-50 border border-slate-200 rounded-[24px] p-6 md:p-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Send size={18} className="text-amber-500"/> Area Pengumpulan Tugas</h3>
                      
                      {currentSubmission ? (
                        // JIKA SUDAH DIKUMPULKAN
                        <div className="space-y-6">
                          <div className={`p-4 rounded-xl border flex items-start gap-4 ${
                            currentSubmission.status === 'GRADED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            currentSubmission.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}>
                            {currentSubmission.status === 'GRADED' ? <CheckCircle2 size={24} className="text-emerald-500 shrink-0"/> :
                             currentSubmission.status === 'REJECTED' ? <AlertCircle size={24} className="text-red-500 shrink-0"/> : <Clock size={24} className="text-blue-500 shrink-0"/>}
                            
                            <div>
                              <h4 className="font-bold text-base mb-1">
                                {currentSubmission.status === 'GRADED' ? `Dinilai: ${currentSubmission.score}/100` :
                                 currentSubmission.status === 'REJECTED' ? 'Tugas Ditolak (Harap Revisi)' : 'Menunggu Penilaian Instruktur'}
                              </h4>
                              {currentSubmission.feedback && (
                                <p className="text-sm mt-2 p-3 bg-white/50 rounded-lg"><strong>Catatan Instruktur:</strong> {currentSubmission.feedback}</p>
                              )}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 opacity-75">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jawaban Anda:</p>
                            {currentSubmission.answerText && <div className="text-sm text-slate-700 whitespace-pre-wrap">{currentSubmission.answerText}</div>}
                            {currentSubmission.attachmentUrl && (
                              <a href={currentSubmission.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-semibold rounded-lg text-slate-700 transition-colors">
                                <FileIcon size={16}/> Lihat Lampiran
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        // JIKA BELUM DIKUMPULKAN
                        <form onSubmit={handleSubmitAssignment} className="space-y-6">
                          {(activeLesson.assignmentType === 'Text' || activeLesson.assignmentType === 'Both') && (
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Jawaban Teks</label>
                              <textarea 
                                value={assignmentText}
                                onChange={e => setAssignmentText(e.target.value)}
                                rows={5}
                                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white"
                                placeholder="Ketik jawaban Anda di sini..."
                                required={activeLesson.assignmentType === 'Text'}
                              ></textarea>
                            </div>
                          )}

                          {(activeLesson.assignmentType === 'FileUpload' || activeLesson.assignmentType === 'Both') && (
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Lampiran File (PDF/ZIP)</label>
                              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 transition-colors group">
                                <input 
                                  type="file" 
                                  onChange={e => setAssignmentFile(e.target.files?.[0] || null)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  required={activeLesson.assignmentType === 'FileUpload'}
                                />
                                {assignmentFile ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-2"><FileIcon size={20}/> {assignmentFile.name}</span>
                                ) : (
                                  <>
                                    <UploadCloud size={32} className="text-slate-400 mb-2 group-hover:text-amber-500 transition-colors"/>
                                    <p className="text-sm font-semibold text-slate-600">Seret file ke sini atau klik untuk mencari</p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-2">
                            <Button type="submit" disabled={isSubmittingTask} className="w-full sm:w-auto h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-200">
                              {isSubmittingTask ? <Loader2 size={18} className="animate-spin mr-2"/> : <Send size={18} className="mr-2"/>}
                              Kirim Tugas
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
            <div className="h-24"></div>
          </div>
        </main>

        {/* SIDEBAR KURIKULUM */}
        <aside className={`absolute lg:static inset-y-0 right-0 z-30 w-[85%] sm:w-80 bg-white border-l border-slate-100 transform transition-all duration-300 ease-in-out shadow-[-10px_0_30px_rgba(0,0,0,0.02)] overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${isTheaterMode ? 'lg:translate-x-full lg:w-0 lg:border-none lg:shadow-none hidden lg:block' : 'lg:translate-x-0 lg:w-96 lg:block'}`}>
          <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Kurikulum</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{completedLessons.length} dari {training.curriculum?.reduce((acc, curr) => acc + (curr.lessons?.length || 0), 0) || 0} Selesai</p>
            </div>
          </div>

          <div className="p-4 space-y-3 pb-24">
            {training.curriculum?.map((module: any, mIndex: number) => {
              const isActiveModule = module.lessons?.some((l:any) => l.id === activeLesson?.id);
              
              return (
              <details key={module.id} className="group" open={isActiveModule || mIndex === 0}>
                <summary className="font-bold text-sm text-slate-800 cursor-pointer p-3 hover:bg-slate-50 rounded-xl transition-colors list-none flex justify-between items-center select-none mb-1 border border-transparent group-open:border-slate-100 group-open:bg-slate-50/50">
                  <span className="truncate pr-4 flex items-center gap-2"><span className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">{mIndex + 1}</span> {module.title}</span>
                  <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0"/>
                </summary>
                <div className="pl-3 pr-1 py-2 space-y-1.5 border-l-2 border-slate-100 ml-5">
                  {module.lessons?.map((lesson: any) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isLocked = lesson.isLocked && !isConfirmed;
                    const isCompleted = completedLessons.includes(lesson.id);
                    const subInfo = mySubmissions[lesson.id]; // Status jika ini adalah tugas
                    
                    return (
                      <button 
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); setIsSidebarOpen(false); }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-all group ${
                          isActive ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 size={16} className={subInfo?.status === 'REJECTED' ? 'text-red-500' : 'text-emerald-500'} />
                          ) : isLocked ? (
                            <Lock size={14} className="text-slate-300 ml-0.5 mt-0.5" />
                          ) : isActive ? (
                            <div className="w-4 h-4 rounded-full border-4 border-indigo-500 bg-white ml-0.5 shadow-sm"></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 ml-0.5 group-hover:border-slate-400 transition-colors"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-bold truncate leading-relaxed ${isActive ? 'text-indigo-900' : isCompleted ? 'text-slate-500' : 'text-slate-700'}`}>{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              {lesson.type === 'Assignment' ? <FileIcon size={10} className="text-amber-500"/> :
                               lesson.type === 'Video' ? <Play size={10}/> : 
                               lesson.type === 'Reading' ? <FileText size={10}/> : <Download size={10}/>}
                              {lesson.type === 'Assignment' ? (subInfo ? subInfo.status : 'Tugas') : `${lesson.durationMins} mnt`}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </details>
            )})}
          </div>
        </aside>

        <AnimatePresence>
          {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}