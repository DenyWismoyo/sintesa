'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Users,
  BookOpen,
  Send,
  File as FileIcon,
  ChevronRight,
  GraduationCap,
  FileSpreadsheet,
  UserPlus,
  Award,
  Layers,
  Sparkles,
  MessageCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainingRegistration, Training, Submission, TrainingBatch } from '@/types';
import { toast } from 'sonner';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { useBatch } from '@/hooks/useBatch';
import ModalImportPesertaBatch from '../../components/ModalImportPesertaBatch';
import ModalQuickWalkinParticipant from '../../components/ModalQuickWalkinParticipant';
import BatchManagementTab from '../../components/BatchManagementTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function KelolaPesertaPage() {
  const { user, role, isInstructor: isGlobalInstructor, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const trainingId = params?.id as string;
  const initialBatchQuery = searchParams?.get('batch');
  const initialViewQuery = searchParams?.get('view');

  const [training, setTraining] = useState<Training | null>(null);
  const [participants, setParticipants] = useState<TrainingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>(
    initialBatchQuery || 'ALL'
  );

  // Checkbox multi-select untuk Yudisium
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<TrainingRegistration | null>(null);

  // Hook Batch
  const {
    batches,
    bulkRegisterParticipants,
    graduateParticipants,
    isGraduating,
  } = useBatch(trainingId);

  // Modals Ingestion
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);

  // Modal Hasil Yudisium
  const [graduatedResult, setGraduatedResult] = useState<any[] | null>(null);

  const canManageLMS = canPerformAction(role, PERMISSIONS.MANAGE_LMS);
  const [isAuthorizedClass, setIsAuthorizedClass] = useState(false);

  const [pageView, setPageView] = useState<'peserta' | 'batches'>(
    initialViewQuery === 'batches' ? 'batches' : 'peserta'
  );
  const [activeTab, setActiveTab] = useState<'profil' | 'tugas'>('profil');
  const [participantSubmissions, setParticipantSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});

  const fetchParticipants = async () => {
    if (!trainingId) return;
    try {
      const q = query(collection(db, 'trainings', trainingId, 'registrations'));
      const pSnap = await getDocs(q);
      const pData = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainingRegistration));

      pData.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      setParticipants(pData);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Gagal memuat data peserta');
    }
  };

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
            toast.error('Akses Ditolak', {
              description: 'Anda tidak berhak menilai peserta di kelas ini.',
            });
            router.push(role === 'public' ? '/lms/dashboard' : '/pelatihan');
            return;
          }

          setIsAuthorizedClass(true);
          if (!canManageLMS && userIsInstructor) {
            setActiveTab('tugas');
          }
          setTraining(tData);
        } else {
          toast.error('Data Kelas Tidak Ditemukan.');
          router.push(canManageLMS ? '/pelatihan' : '/lms/dashboard');
          return;
        }

        await fetchParticipants();
      } catch (error) {
        toast.error('Gagal memuat data');
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
          const subQ = query(
            collection(
              db,
              'trainings',
              trainingId,
              'registrations',
              selectedParticipant.id!,
              'submissions'
            )
          );
          const subSnap = await getDocs(subQ);
          const subs = subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission));

          const initialScores: Record<string, number> = {};
          const initialFeedbacks: Record<string, string> = {};
          subs.forEach((s) => {
            initialScores[s.id] = s.score || 0;
            initialFeedbacks[s.id] = s.feedback || '';
          });
          setGradingScores(initialScores);
          setGradingFeedbacks(initialFeedbacks);
          setParticipantSubmissions(subs);
        } catch (error) {
          toast.error('Gagal mengambil data tugas');
        } finally {
          setLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    }
  }, [selectedParticipant, activeTab, trainingId]);

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  if (!user || (!canManageLMS && !isAuthorizedClass)) return null;

  const handleUpdateStatus = async (regId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    if (!canManageLMS) return toast.error('Hanya pengurus pusat yang bisa mengubah status.');
    try {
      await updateDoc(doc(db, 'trainings', trainingId, 'registrations', regId), {
        status: newStatus,
        updatedAt: Date.now(),
      });
      setParticipants((prev) =>
        prev.map((p) => (p.id === regId ? { ...p, status: newStatus } : p))
      );
      toast.success(`Peserta berhasil di-${newStatus.toLowerCase()}`);
      if (selectedParticipant?.id === regId)
        setSelectedParticipant({ ...selectedParticipant, status: newStatus });
    } catch (error) {
      toast.error('Gagal mengubah status peserta');
    }
  };

  const handleGradeSubmission = async (submissionId: string, newStatus: 'GRADED' | 'REJECTED') => {
    if (!selectedParticipant?.id) return;
    const score = gradingScores[submissionId] || 0;
    const feedback = gradingFeedbacks[submissionId] || '';

    try {
      const subRef = doc(
        db,
        'trainings',
        trainingId,
        'registrations',
        selectedParticipant.id,
        'submissions',
        submissionId
      );
      await updateDoc(subRef, { status: newStatus, score, feedback });

      if (newStatus === 'REJECTED') {
        const regRef = doc(db, 'trainings', trainingId, 'registrations', selectedParticipant.id);
        await updateDoc(regRef, { completedLessons: arrayRemove(submissionId) });
      }

      setParticipantSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: newStatus, score, feedback } : s))
      );
      toast.success(newStatus === 'GRADED' ? 'Tugas berhasil dinilai!' : 'Tugas dikembalikan.');
    } catch (error) {
      toast.error('Gagal menyimpan penilaian');
    }
  };

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredParticipants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParticipants.map((p) => p.id!).filter(Boolean));
    }
  };

  const toggleSelectParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Yudisium Masal
  const handleBatchGraduation = async () => {
    if (selectedIds.length === 0) return toast.error('Pilih minimal satu peserta untuk diyudisium');
    if (!confirm(`Yudisium ${selectedIds.length} peserta terpilih menjadi ALUMNI resmi Solo Technopark?`)) return;

    try {
      const activeBatch = batches.find((b) => String(b.batchNumber) === selectedBatchFilter) || batches[0];
      const batchId = activeBatch?.id || 'batch-reguler';
      const batchNumber = activeBatch?.batchNumber || (selectedBatchFilter !== 'ALL' ? parseInt(selectedBatchFilter) : 1);
      const currentYear = activeBatch?.year || new Date().getFullYear();

      const res = await graduateParticipants({
        trainingTitle: training?.title || 'Program Vokasi STP',
        trainingCategory: training?.category || 'Vokasi',
        batchId,
        batchNumber,
        year: currentYear,
        participantIds: selectedIds,
      });

      if (res.success) {
        setGraduatedResult(res.data);
        await fetchParticipants();
        setSelectedIds([]);
      }
    } catch (err: any) {
      // Error handled by hook
    }
  };

  // Filter gabungan (pencarian + batch filter)
  const filteredParticipants = participants.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.origin || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchBatch =
      selectedBatchFilter === 'ALL' ||
      String(p.batchNumber) === selectedBatchFilter;

    return matchSearch && matchBatch;
  });

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header Halaman */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(!canManageLMS ? '/lms/dashboard' : '/pelatihan')}
            className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
              Evaluasi & Manajemen Peserta
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {training?.title || 'Memuat informasi kelas...'}
            </p>
          </div>
        </div>

        {/* Quick Action Ingestion Buttons */}
        {canManageLMS && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-2xl mr-2">
              <button
                type="button"
                onClick={() => setPageView('peserta')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pageView === 'peserta'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={14} />
                <span>Peserta & Yudisium</span>
              </button>
              <button
                type="button"
                onClick={() => setPageView('batches')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pageView === 'batches'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />
                <span>Kelola 4 Batch</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="rounded-xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel Peserta</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWalkinModalOpen(true)}
              className="rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Peserta Walk-in</span>
            </Button>
          </div>
        )}
      </div>

      {/* Render Kondisional: Kelola Batch vs Daftar Peserta */}
      {pageView === 'batches' && training ? (
        <BatchManagementTab training={training} />
      ) : (
        /* Main Content Area */
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col">
            {/* Toolbar & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row justify-between items-center gap-3">
              {/* Filter Batch Selector Pill */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Filter Batch:
                </span>
                {['ALL', '1', '2', '3', '4'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBatchFilter(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedBatchFilter === b
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b === 'ALL' ? 'Semua Batch' : `Batch ${b}`}
                  </button>
                ))}
              </div>

              {/* Pencarian */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Cari nama, email, asal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Bulk Action Bar (Saat ada peserta yang dipilih) */}
            {selectedIds.length > 0 && canManageLMS && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{selectedIds.length} Peserta Dipilih</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleBatchGraduation}
                  disabled={isGraduating}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                >
                  {isGraduating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>🎓 Proses Yudisium & Terbitkan Alumni STP</span>
                </Button>
              </div>
            )}

          {/* Tabel Peserta */}
          <div className="overflow-x-auto min-h-[480px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-100 font-bold tracking-wider">
                <tr>
                  {canManageLMS && (
                    <th className="px-4 py-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-blue-600"
                        title="Pilih Semua"
                      >
                        {selectedIds.length > 0 &&
                        selectedIds.length === filteredParticipants.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3.5">Peserta</th>
                  <th className="px-4 py-3.5">Batch & Asal</th>
                  <th className="px-4 py-3.5">Progres LMS</th>
                  <th className="px-4 py-3.5">Kelulusan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500 font-bold text-xs">
                      Tidak ada data peserta ditemukan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const totalLessons =
                      training?.curriculum?.reduce(
                        (acc, curr) => acc + (curr.lessons?.length || 0),
                        0
                      ) || 0;
                    const completed = Array.isArray(p.completedLessons)
                      ? p.completedLessons.length
                      : 0;
                    const isSelected = selectedIds.includes(p.id!);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors group ${
                          selectedParticipant?.id === p.id ? 'bg-blue-50/50' : ''
                        } ${isSelected ? 'bg-emerald-50/40' : ''}`}
                        onClick={() => setSelectedParticipant(p)}
                      >
                        {canManageLMS && (
                          <td
                            className="px-4 py-3.5 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectParticipant(p.id!);
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                            )}
                          </td>
                        )}

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.email}</p>
                          {p.nik && (
                            <p className="text-[10px] text-slate-400 font-mono">NIK: {p.nik}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-bold py-0">
                              {p.batchNumber ? `Batch ${p.batchNumber}` : 'Reguler'}
                            </Badge>
                            <span className="text-[11px] text-slate-600 truncate max-w-[130px]">
                              {p.origin}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">
                            {p.registrationSource || 'CATALOG'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-max">
                            <BookOpen size={12} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700">
                              {completed} / {totalLessons}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {p.graduationStatus === 'GRADUATED' ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                              <Award className="w-3 h-3" />
                              <span>ALUMNI</span>
                            </Badge>
                          ) : (
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                                p.status === 'CONFIRMED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : p.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-end w-full transition-colors opacity-0 group-hover:opacity-100">
                            {canManageLMS ? 'Kelola' : 'Evaluasi'} <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Panel Detail Peserta */}
        {selectedParticipant && (
          <div className="w-full xl:w-[420px] shrink-0 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[680px] animate-in slide-in-from-right-4 duration-300 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-black text-lg text-white tracking-tight leading-tight mb-0.5">
                  {selectedParticipant.name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {selectedParticipant.email}
                </p>
                {selectedParticipant.certificateNumber && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">
                    No. Sertifikat: {selectedParticipant.certificateNumber}
                  </p>
                )}
              </div>
              <Badge className="bg-emerald-500 text-white text-[10px]">
                {selectedParticipant.graduationStatus === 'GRADUATED'
                  ? 'ALUMNI'
                  : selectedParticipant.status}
              </Badge>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50/80 px-4">
              {canManageLMS && (
                <button
                  onClick={() => setActiveTab('profil')}
                  className={`pb-3 pt-3.5 px-4 text-xs font-black flex items-center gap-2 transition-all relative ${
                    activeTab === 'profil'
                      ? 'text-blue-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Profil & Validasi
                  {activeTab === 'profil' && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              )}
              <button
                onClick={() => setActiveTab('tugas')}
                className={`pb-3 pt-3.5 px-4 text-xs font-black flex items-center gap-2 transition-all relative ${
                  activeTab === 'tugas'
                    ? 'text-blue-700'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Tugas & Evaluasi
                {activeTab === 'tugas' && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-t-full" />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 space-y-4">
              {activeTab === 'profil' && canManageLMS && (
                <div className="space-y-4">
                  {selectedParticipant.status === 'PENDING' && (
                    <div className="flex gap-2.5 pb-4 border-b border-slate-200">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedParticipant.id!, 'REJECTED')}
                        className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedParticipant.id!, 'CONFIRMED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                      </Button>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Nomor WhatsApp
                      </span>
                      <p className="font-bold text-slate-800 font-mono mt-0.5">
                        {selectedParticipant.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Asal Instansi / Sekolah
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedParticipant.origin}</p>
                    </div>
                    {selectedParticipant.nik && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nomor Induk Kependudukan (NIK)
                        </span>
                        <p className="font-mono text-slate-700 font-bold mt-0.5">
                          {selectedParticipant.nik}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Sumber Pendaftaran
                      </span>
                      <p className="text-slate-600 capitalize mt-0.5">
                        {selectedParticipant.registrationSource || 'Katalog Online'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tugas' && (
                <div className="space-y-4">
                  {loadingSubmissions ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                    </div>
                  ) : participantSubmissions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-xs font-bold bg-white">
                      Peserta belum mengumpulkan tugas.
                    </div>
                  ) : (
                    participantSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Tugas {sub.lessonId.substring(0, 5)}
                          </span>
                          {sub.status === 'GRADED' && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                              Nilai: {sub.score}
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-mono">
                          {sub.answerText || 'Tidak ada teks jawaban.'}
                        </div>

                        {/* Grading Form */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={gradingScores[sub.id] || 0}
                            onChange={(e) =>
                              setGradingScores((prev) => ({
                                ...prev,
                                [sub.id]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-16 h-8 text-center text-xs font-black border border-slate-200 rounded-lg outline-none"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleGradeSubmission(sub.id, 'GRADED')}
                            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-1"
                          >
                            Simpan Skor
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal Import Peserta Batch */}
      {isImportModalOpen && (
        <ModalImportPesertaBatch
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          batches={batches}
          selectedBatchId={batches[0]?.id}
          onImport={async (batchId, batchNumber, pList) => {
            const res = await bulkRegisterParticipants({ batchId, batchNumber, participants: pList });
            await fetchParticipants();
            return res;
          }}
        />
      )}

      {/* Modal Quick Walkin */}
      {isWalkinModalOpen && (
        <ModalQuickWalkinParticipant
          isOpen={isWalkinModalOpen}
          onClose={() => setIsWalkinModalOpen(false)}
          batches={batches}
          selectedBatchId={batches[0]?.id}
          onRegister={async (batchId, batchNumber, pList) => {
            const res = await bulkRegisterParticipants({ batchId, batchNumber, participants: pList });
            await fetchParticipants();
            return res;
          }}
        />
      )}

      {/* Modal Hasil Yudisium & WhatsApp Broadcast */}
      {graduatedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Yudisium Berhasil Diproses!</h3>
                <p className="text-xs text-slate-500">
                  {graduatedResult.length} peserta resmi menjadi Alumni Terdaftar Solo Technopark
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Daftar Kode Registrasi Alumni:</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {graduatedResult.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/60"
                  >
                    <span className="font-semibold text-slate-800">{a.name}</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      {a.registrationCode}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Data alumni otomatis terhubung ke <strong>Database Master Alumni</strong> dan mereka kini dapat melamar lowongan di <strong>Bursa Karir STP</strong>.
            </p>

            <div className="pt-2 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => setGraduatedResult(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Tutup & Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}