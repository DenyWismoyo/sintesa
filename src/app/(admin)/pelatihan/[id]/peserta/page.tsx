'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Download, Search, Users, BookOpen, Send, File as FileIcon, ChevronRight } from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc, getDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainingRegistration, Training, Submission } from '@/types';
import { toast } from 'sonner';
import { canPerformAction, PERMISSIONS } from '@/config/roles';

export default function KelolaPesertaPage() {
  const { user, role, isInstructor: isGlobalInstructor, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const trainingId = params?.id as string;

  const [training, setTraining] = useState<Training | null>(null);
  const [participants, setParticipants] = useState<TrainingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedParticipant, setSelectedParticipant] = useState<TrainingRegistration | null>(null);
  
  // FIX GARIS MERAH: Menggunakan MANAGE_LMS
  const canManageLMS = canPerformAction(role, PERMISSIONS.MANAGE_LMS);
  const [isAuthorizedClass, setIsAuthorizedClass] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'profil' | 'tugas'>('profil');
  const [participantSubmissions, setParticipantSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!trainingId || authLoading || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const tSnap = await getDoc(doc(db, 'trainings', trainingId));
        if (tSnap.exists()) {
          const tData = { id: tSnap.id, ...tSnap.data() } as Training;
          
          const userIsInstructor = tData.authorizedInstructorIds?.includes(user.uid);
          
          if (!canManageLMS && !userIsInstructor) {
             toast.error("Akses Ditolak", { description: "Anda tidak berhak menilai peserta di kelas ini." });
             router.push(role === 'public' ? '/lms/dashboard' : '/pelatihan');
             return; 
          }

          setIsAuthorizedClass(true);
          if (!canManageLMS && userIsInstructor) {
            setActiveTab('tugas'); 
          }
          setTraining(tData);
        } else {
          toast.error("Data Kelas Tidak Ditemukan.");
          router.push(canManageLMS ? '/pelatihan' : '/lms/dashboard');
          return;
        }

        const q = query(collection(db, 'trainings', trainingId, 'registrations'));
        const pSnap = await getDocs(q);
        const pData = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingRegistration));
        
        pData.sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });

        setParticipants(pData);
      } catch (error) {
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainingId, authLoading, user, canManageLMS, role, router]);

  useEffect(() => {
    if (selectedParticipant?.id && activeTab === 'tugas') {
      const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
          const subQ = query(collection(db, 'trainings', trainingId, 'registrations', selectedParticipant.id!, 'submissions'));
          const subSnap = await getDocs(subQ);
          const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
          
          const initialScores: Record<string, number> = {};
          const initialFeedbacks: Record<string, string> = {};
          subs.forEach(s => {
            initialScores[s.id] = s.score || 0;
            initialFeedbacks[s.id] = s.feedback || '';
          });
          setGradingScores(initialScores);
          setGradingFeedbacks(initialFeedbacks);
          setParticipantSubmissions(subs);
        } catch (error) {
          toast.error("Gagal mengambil data tugas");
        } finally {
          setLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    }
  }, [selectedParticipant, activeTab, trainingId]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!user || (!canManageLMS && !isAuthorizedClass)) return null;

  const handleUpdateStatus = async (regId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    if (!canManageLMS) return toast.error("Hanya pengurus pusat yang bisa mengubah status.");
    try {
      await updateDoc(doc(db, 'trainings', trainingId, 'registrations', regId), { status: newStatus, updatedAt: Date.now() });
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, status: newStatus } : p));
      toast.success(`Peserta berhasil di-${newStatus.toLowerCase()}`);
      if (selectedParticipant?.id === regId) setSelectedParticipant({ ...selectedParticipant, status: newStatus });
    } catch (error) {
      toast.error("Gagal mengubah status peserta");
    }
  };

  const handleGradeSubmission = async (submissionId: string, newStatus: 'GRADED' | 'REJECTED') => {
    if (!selectedParticipant?.id) return;
    const score = gradingScores[submissionId] || 0;
    const feedback = gradingFeedbacks[submissionId] || '';

    try {
      const subRef = doc(db, 'trainings', trainingId, 'registrations', selectedParticipant.id, 'submissions', submissionId);
      await updateDoc(subRef, { status: newStatus, score, feedback });

      if (newStatus === 'REJECTED') {
        const regRef = doc(db, 'trainings', trainingId, 'registrations', selectedParticipant.id);
        await updateDoc(regRef, { completedLessons: arrayRemove(submissionId) });
      }

      setParticipantSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: newStatus, score, feedback } : s));
      toast.success(newStatus === 'GRADED' ? 'Tugas berhasil dinilai!' : 'Tugas dikembalikan.');
    } catch (error) {
      toast.error("Gagal menyimpan penilaian");
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <button onClick={() => router.push(!canManageLMS ? '/lms/dashboard' : '/pelatihan')} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Evaluasi & Peserta</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{training?.title || 'Memuat informasi kelas...'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Users size={18} className="text-blue-600"/> Data Peserta</h3>
            <div className="relative w-full md:max-w-xs"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input placeholder="Cari nama atau email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
          </div>
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100 font-semibold tracking-wider">
                <tr><th className="px-6 py-4">Info Peserta</th><th className="px-6 py-4">Progres Belajar</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-500 font-bold">Tidak ada data peserta ditemukan.</td></tr>
                ) : (
                  filteredParticipants.map(p => {
                    const totalLessons = training?.curriculum?.reduce((acc, curr) => acc + (curr.lessons?.length || 0), 0) || 0;
                    const completed = Array.isArray(p.completedLessons) ? p.completedLessons.length : 0;
                    return (
                    <tr key={p.id} className={`hover:bg-slate-50 cursor-pointer transition-colors group ${selectedParticipant?.id === p.id ? 'bg-blue-50/50' : ''}`} onClick={() => setSelectedParticipant(p)}>
                      <td className="px-6 py-4"><p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{p.name}</p><p className="text-xs font-medium text-slate-500 mt-0.5">{p.email}</p></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-max"><BookOpen size={14} className="text-slate-400"/><span className="text-xs font-black text-slate-700">{completed} / {totalLessons} Materi</span></div></td>
                      <td className="px-6 py-4"><span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest shadow-sm ${p.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{p.status}</span></td>
                      <td className="px-6 py-4 text-right"><button className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-end w-full transition-colors opacity-0 group-hover:opacity-100">{canManageLMS ? 'Periksa' : 'Evaluasi'} <ChevronRight size={14} /></button></td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedParticipant && (
          <div className="w-full xl:w-[450px] shrink-0 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[700px] animate-in slide-in-from-right-4 duration-300 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10"><h3 className="font-black text-xl text-white tracking-tight leading-tight mb-1">{selectedParticipant.name}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedParticipant.email}</p></div>
              <span className={`relative z-10 text-[10px] font-black px-3 py-1 rounded-md border uppercase tracking-widest shadow-sm ${selectedParticipant.status === 'CONFIRMED' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500 text-white border-amber-400'}`}>{selectedParticipant.status}</span>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50/80 px-4">
              {canManageLMS && (
                <button onClick={() => setActiveTab('profil')} className={`pb-3 pt-4 px-4 text-xs font-black flex items-center gap-2 transition-all relative ${activeTab === 'profil' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-700'}`}>Profil & Validasi{activeTab === 'profil' && <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-t-full" />}</button>
              )}
              <button onClick={() => setActiveTab('tugas')} className={`pb-3 pt-4 px-4 text-xs font-black flex items-center gap-2 transition-all relative ${activeTab === 'tugas' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-700'}`}>Tugas & Evaluasi{activeTab === 'tugas' && <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-t-full" />}</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
              {activeTab === 'profil' && canManageLMS && (
                <div className="space-y-6 animate-in fade-in">
                  {selectedParticipant.status === 'PENDING' && (
                    <div className="flex gap-3 pb-6 border-b border-slate-100">
                      <button onClick={() => handleUpdateStatus(selectedParticipant.id!, 'REJECTED')} className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors shadow-sm"><XCircle size={16} /> Tolak</button>
                      <button onClick={() => handleUpdateStatus(selectedParticipant.id!, 'CONFIRMED')} className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-md"><CheckCircle size={16} /> Setujui Pendaftaran</button>
                    </div>
                  )}
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Telepon & Instansi</p><p className="text-sm font-black text-slate-800 mb-1">{selectedParticipant.phone}</p><p className="text-sm font-medium text-slate-600">{selectedParticipant.origin}</p></div>

                  {selectedParticipant.customData && Object.keys(selectedParticipant.customData).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Dokumen Persyaratan</p>
                      {Object.entries(selectedParticipant.customData).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{key}</p>
                          {typeof value === 'string' && value.startsWith('http') ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-black transition-colors"><Download size={14} /> Buka Lampiran File</a>
                          ) : (<p className="text-sm font-semibold text-slate-700">{String(value)}</p>)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tugas' && (
                <div className="space-y-5 animate-in fade-in">
                  {canManageLMS && selectedParticipant.status !== 'CONFIRMED' ? (
                     <div className="text-center p-6 bg-amber-50 rounded-2xl text-amber-700 text-sm font-bold border border-amber-200">Evaluasi tugas hanya bisa dilakukan jika peserta sudah berstatus "Disetujui" (CONFIRMED).</div>
                  ) : loadingSubmissions ? (
                    <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                  ) : participantSubmissions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-300 rounded-3xl text-slate-400 text-sm font-bold bg-white">Peserta belum mengumpulkan tugas.</div>
                  ) : (
                    participantSubmissions.map(sub => {
                      let lessonTitle = "Tugas " + sub.lessonId.substring(0,4);
                      training?.curriculum?.forEach(m => { m.lessons.forEach(l => { if (l.id === sub.lessonId) lessonTitle = l.title; }); });

                      return (
                      <div key={sub.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className={`p-4 border-b flex justify-between items-center ${sub.status === 'PENDING_REVIEW' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                          <h4 className="font-black text-sm text-slate-800 flex items-center gap-2"><Send size={14} className="text-slate-400"/> {lessonTitle}</h4>
                          {sub.status === 'GRADED' && <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md uppercase">Nilai: {sub.score}</span>}
                          {sub.status === 'REJECTED' && <span className="text-[10px] font-black bg-red-100 text-red-700 px-2.5 py-1 rounded-md uppercase">Ditolak</span>}
                          {sub.status === 'PENDING_REVIEW' && <span className="text-[10px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-md uppercase shadow-sm">Perlu Dinilai</span>}
                        </div>

                        <div className="p-5 space-y-5">
                          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jawaban Teks</p><div className="p-4 bg-slate-50 rounded-2xl text-slate-700 text-sm font-medium border border-slate-100 whitespace-pre-wrap leading-relaxed">{sub.answerText || <span className="italic text-slate-400">Tidak ada teks jawaban.</span>}</div></div>
                          {sub.attachmentUrl && (<div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">File Lampiran</p><a href={sub.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-black transition-colors"><FileIcon size={14}/> Unduh Dokumen Tugas</a></div>)}
                          <hr className="border-slate-100" />
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formulir Evaluasi</p>
                            <div className="flex items-center gap-4"><label className="text-xs font-bold text-slate-700">Skor (0-100)</label><input type="number" min="0" max="100" value={gradingScores[sub.id]} onChange={e => setGradingScores(prev => ({...prev, [sub.id]: parseInt(e.target.value)||0}))} className="w-24 h-11 font-black text-lg text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                            <textarea value={gradingFeedbacks[sub.id]} onChange={e => setGradingFeedbacks(prev => ({...prev, [sub.id]: e.target.value}))} placeholder="Ketik catatan evaluasi (opsional)..." className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" rows={3} />
                            <div className="flex gap-3 pt-2">
                              <button onClick={() => handleGradeSubmission(sub.id, 'REJECTED')} className="flex-1 h-11 rounded-xl text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors shadow-sm">Tolak (Revisi)</button>
                              <button onClick={() => handleGradeSubmission(sub.id, 'GRADED')} className="flex-1 h-11 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">Simpan Penilaian</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}