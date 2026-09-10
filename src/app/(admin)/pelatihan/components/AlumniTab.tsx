'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Alumni } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UploadCloud, Plus, Search, FileText, 
  Trash2, CheckCircle2, AlertCircle, X, Download, Clock, Save, FileSpreadsheet, CalendarDays, RefreshCw, Edit2,
  Loader2, Filter, SlidersHorizontal, ChevronDown, DownloadCloud, MessageCircle, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Import library pembaca Excel
import * as XLSX from 'xlsx';

// IMPORT HOOK (Single Source of Truth)
import { useAlumni } from '@/hooks/useAlumni';

// Extend type sementara untuk menampung field tambahan di form manual
type AlumniFormState = Partial<Alumni> & { trainingYear?: string };

// Helper cerdas untuk memformat nomor WhatsApp Indonesia
const formatWhatsAppNumber = (phone?: string) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, ''); // Hapus semua karakter kecuali angka
  if (cleaned.startsWith('0')) return '62' + cleaned.substring(1); // Ubah awalan 0 jadi 62
  if (cleaned.startsWith('8')) return '62' + cleaned; // Tambahkan 62 jika diawali 8
  return cleaned; // Biarkan jika sudah berawalan 62
};

// Helper untuk generate pesan WA klaim akun otomatis
const generateWaMessage = (alumni: any) => {
  const text = `Halo *${alumni.name || 'Alumni'}*,

Kami dari Admin Karier Solo Technopark.
Saat ini histori pelatihan Anda (Program: ${alumni.programTaken || '-'}) telah tercatat di sistem kami.

Untuk memudahkan penyaluran kerja dan agar portofolio keahlian Anda dapat dilihat oleh mitra industri, silakan lengkapi profil Anda dengan mengklaim status Alumni di portal SINTESA.

Berikut langkah-langkahnya:
1. Buka tautan: https://sintesa.solotechnopark.id/login
2. Login menggunakan Akun Email Anda.
3. Masuk ke menu *"Akun Saya"* (Profil).
4. Masukkan Kode Registrasi rahasia berikut pada bagian *"Klaim Status Alumni"*:
   *${alumni.registrationCode}*

Mohon segera login dan lengkapi data diri Anda.
Jika ada pertanyaan, silakan balas pesan ini. Terima kasih!`;

  return encodeURIComponent(text);
};

export default function AlumniTab() {
  // Cast ke 'any' dengan fallback agar tidak crash saat Next.js hot-reload (stale build)
  const { 
    allAlumnis = [], 
    loadingAll: loading = false, 
    refetchAll, 
    addAlumni, 
    updateAlumni, 
    deleteAlumni, 
    importAlumniExcel 
  } = useAlumni() as any; 
  
  // State Filter & Pencarian
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterEmployment, setFilterEmployment] = useState('ALL');
  
  // State Paginasi Klien
  const [displayLimit, setDisplayLimit] = useState(25);

  // State Bulk Actions (Tindakan Massal)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // State WhatsApp Popup
  const [waPopupAlumni, setWaPopupAlumni] = useState<any>(null);

  // State Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Tambah / Edit Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialManualForm: AlumniFormState = {
    name: '', email: '', phone: '', batch: '', programTaken: '', trainingYear: '',
    courseStartDate: '', courseEndDate: '', birthInfo: '', address: '', 
    certificationResult: '', employmentStatus: 'Proses Verifikasi', company: '', currentJob: ''
  };
  const [manualForm, setManualForm] = useState<AlumniFormState>(initialManualForm);

  // --- RESET TAMPILAN SAAT FILTER BERUBAH ---
  useEffect(() => {
    setDisplayLimit(25);
    setSelectedIds([]); // Reset pilihan saat pencarian/filter berubah
  }, [search, filterProgram, filterYear, filterStatus, filterEmployment]);

  // --- LOGIK EKSTRAKSI OPSI FILTER UNIK ---
  const filterOptions = useMemo(() => {
    const programs = new Set<string>();
    const years = new Set<string>();
    const employments = new Set<string>();

    if (allAlumnis) {
      allAlumnis.forEach((a: any) => {
        if (a.programTaken) programs.add(a.programTaken);
        if (a.trainingYear) years.add(a.trainingYear);
        else if ((a as any).graduationYear) years.add((a as any).graduationYear);
        
        // MAPPING: Jika kosong atau "Belum Bekerja", kita ubah jadi "Proses Verifikasi"
        const empStatus = (!a.employmentStatus || a.employmentStatus === 'Belum Bekerja') 
          ? 'Proses Verifikasi' 
          : a.employmentStatus;
        employments.add(empStatus);
      });
    }

    return {
      programs: Array.from(programs).sort(),
      years: Array.from(years).sort().reverse(),
      employments: Array.from(employments).sort()
    };
  }, [allAlumnis]);

  // --- LOGIK PENYARINGAN DATA (SEARCH & FILTER) ---
  const filteredAlumni = useMemo(() => {
    if (!allAlumnis) return [];
    
    return allAlumnis.filter((a: any) => {
      // 1. Pencarian Teks
      const matchesSearch = !search || 
        (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (a.programTaken || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.registrationCode || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.trainingYear || '').toLowerCase().includes(search.toLowerCase());

      // 2. Filter Dropdown
      const matchesProgram = filterProgram === 'ALL' || a.programTaken === filterProgram;
      const matchesYear = filterYear === 'ALL' || (a.trainingYear === filterYear || (a as any).graduationYear === filterYear);
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
      
      // MAPPING Filter Status Pekerjaan
      const mappedStatus = (!a.employmentStatus || a.employmentStatus === 'Belum Bekerja') 
        ? 'Proses Verifikasi' 
        : a.employmentStatus;
      const matchesEmployment = filterEmployment === 'ALL' || mappedStatus === filterEmployment;

      return matchesSearch && matchesProgram && matchesYear && matchesStatus && matchesEmployment;
    });
  }, [allAlumnis, search, filterProgram, filterYear, filterStatus, filterEmployment]);

  // Batasi data yang tampil menggunakan paginasi klien
  const displayedAlumni = filteredAlumni.slice(0, displayLimit);

  // --- LOGIK BULK ACTIONS (MASSAL) ---
  const handleBulkDelete = async () => {
    if (!confirm(`PERINGATAN: Anda akan menghapus ${selectedIds.length} data alumni secara permanen. Lanjutkan?`)) return;
    
    setIsBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => deleteAlumni(id)));
      toast.success(`${selectedIds.length} data alumni berhasil dihapus.`);
      setSelectedIds([]); // Kosongkan pilihan
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data massal.");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (!confirm(`Ubah status pekerjaan ${selectedIds.length} alumni menjadi "${status}"?`)) return;
    
    setIsBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => updateAlumni(id, { employmentStatus: status })));
      toast.success(`${selectedIds.length} data alumni berhasil diperbarui.`);
      setSelectedIds([]); // Kosongkan pilihan
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui data massal.");
    } finally {
      setIsBulkActionLoading(false);
    }
  };


  // --- LOGIK IMPORT EXCEL ---
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          toast.error("File Excel kosong atau format tidak sesuai.");
          return;
        }

        const parsedData = rows.map((row: any) => {
          const rowData: any = {};
          Object.keys(row).forEach(key => {
            const standardKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            rowData[standardKey] = String(row[key]).trim();
          });
          return rowData;
        }).filter((row: any) => row.name_of_participants && row.name_of_participants !== '');

        setImportData(parsedData);
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca file Excel. Pastikan formatnya .xlsx atau .xls");
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [{
      "Tahun Pelatihan": "2024",
      "Batch": "74",
      "Total of Participants": "1",
      "Program": "Mekanik Manufaktur",
      "Course Start Date": "2024-01-15",
      "Course End Date": "2024-03-15",
      "Name of Participants": "Budi Santoso",
      "Date of Birth": "Surakarta, 12 Mei 2000",
      "Home Address": "Jl. Slamet Riyadi No 1",
      "Post Code": "57144",
      "Phone Number": "081234567890",
      "Link WhatsApp": "",
      "Email Address": "budi@email.com",
      "Certification Results": "Kompetensi BNSP",
      "Working Status": "Bekerja (Full-time)",
      "Current Company": "PT Indofood",
      "Current Position / Division": "Teknisi Mesin"
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Alumni");
    XLSX.writeFile(wb, "Template_Import_Alumni_STP.xlsx");
  };

  // --- LOGIK EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (filteredAlumni.length === 0) {
      toast.error("Tidak ada data untuk diekspor berdasarkan filter saat ini.");
      return;
    }

    const exportData = filteredAlumni.map((a: any) => ({
      "Tahun Pelatihan": a.trainingYear || a.graduationYear || "",
      "Batch": a.batch || "",
      "Total of Participants": "1",
      "Program": a.programTaken || "",
      "Course Start Date": a.courseStartDate || "",
      "Course End Date": a.courseEndDate || "",
      "Name of Participants": a.name || "",
      "Date of Birth": a.birthInfo || "",
      "Home Address": a.address || "",
      "Post Code": a.postCode || "",
      "Phone Number": a.phone || "",
      "Link WhatsApp": a.phone ? `https://wa.me/${formatWhatsAppNumber(a.phone)}` : "", // Auto generate link WA
      "Email Address": a.email || "",
      "Certification Results": a.certificationResult || "",
      "Working Status": (!a.employmentStatus || a.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : a.employmentStatus,
      "Current Company": a.company || "",
      "Current Position / Division": a.currentJob || "",
      
      // Info tambahan sistem
      "Status Akun (Sistem)": a.status === 'CLAIMED' ? 'Diklaim (Aktif)' : 'Belum Diklaim (Dormant)',
      "Kode Registrasi (Sistem)": a.registrationCode || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Alumni");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Export_Database_Alumni_${dateStr}.xlsx`);
    toast.success(`${filteredAlumni.length} data berhasil diekspor!`);
  };

  // --- LOGIK IMPORT PINTAR (SMART UPSERT) ---
  const processImport = async () => {
    if (importData.length === 0) return;
    setImportLoading(true);

    try {
      const result = await importAlumniExcel(importData, allAlumnis as Alumni[]);
      if (result && result.success) {
        const newC = (result as any).newCount || 0;
        const upC = (result as any).updateCount || 0;
        
        toast.success(`Berhasil memproses ${importData.length} data!\nData Baru: ${newC} | Diperbarui: ${upC}`);
        setIsImportModalOpen(false);
        setImportData([]);
        if(fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error("Gagal import: " + (result?.error || "Kesalahan Sistem"));
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengimpor data.");
    } finally {
      setImportLoading(false);
    }
  };

  // --- LOGIK BUKA MODAL TAMBAH/EDIT ---
  const handleOpenAdd = () => {
    setEditingId(null);
    setManualForm(initialManualForm);
    setIsManualModalOpen(true);
  };

  const handleEdit = (alumni: AlumniFormState) => {
    setEditingId(alumni.id || null);
    // Ubah display jika kosong/Belum Bekerja saat edit
    const empStatus = (!alumni.employmentStatus || alumni.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : alumni.employmentStatus;
    setManualForm({ ...alumni, employmentStatus: empStatus });
    setIsManualModalOpen(true);
  };

  // --- LOGIK SIMPAN MANUAL (TAMBAH / EDIT) ---
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.programTaken) {
      toast.error("Nama dan Program Pelatihan wajib diisi.");
      return;
    }

    setIsSavingManual(true);
    try {
      if (editingId) {
        const updateData = {
          ...manualForm,
          graduationYear: manualForm.trainingYear, 
        };
        const result = await updateAlumni(editingId, updateData);
        if (result.success) {
          toast.success("Data berhasil diperbarui.");
        } else {
          toast.error("Gagal memperbarui data.");
        }
      } else {
        const newAlumni = {
          ...manualForm,
          graduationYear: manualForm.trainingYear,
        };
        const result = await addAlumni(newAlumni as any);
        if (result.success) {
          toast.success("Data berhasil ditambahkan secara manual.");
        } else {
          toast.error("Gagal menambahkan data.");
        }
      }

      setIsManualModalOpen(false);
      setManualForm(initialManualForm);
      setEditingId(null);
      
    } catch (error) {
      console.error("Gagal simpan manual:", error);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSavingManual(false);
    }
  };

  // --- LOGIK HAPUS DATA ---
  const handleDelete = async (id: string) => {
    if(!confirm("Apakah Anda yakin ingin menghapus data alumni ini?")) return;
    try {
      const res = await deleteAlumni(id);
      if (res.success) {
        toast.success("Data berhasil dihapus.");
      } else {
        toast.error("Gagal menghapus data.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus data.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Database Master Alumni</h2>
          <p className="text-sm text-slate-500">Pencarian instan pada seluruh data alumni tersinkronisasi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button onClick={() => refetchAll && refetchAll()} variant="outline" className="rounded-xl border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold" title="Refresh Data">
            <RefreshCw size={18} className="mr-2" /> Segarkan
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold" title="Export data yang tampil">
            <DownloadCloud size={18} className="mr-2" /> Export Data
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold">
            <FileSpreadsheet size={18} className="mr-2" /> Import Excel
          </Button>
          <Button onClick={handleOpenAdd} className="rounded-xl bg-slate-900 text-white font-bold shadow-md">
            <Plus size={18} className="mr-2" /> Tambah Manual
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* --- BAR PENCARIAN --- */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Cari cepat nama, program, kode, atau tahun di seluruh data..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-10 rounded-xl bg-slate-50 border-slate-200 h-10 w-full focus:bg-white transition-all"
              />
            </div>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              className={`rounded-xl px-4 h-10 transition-all ${showFilters || filterProgram !== 'ALL' || filterYear !== 'ALL' || filterStatus !== 'ALL' || filterEmployment !== 'ALL' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              <SlidersHorizontal size={16} className="mr-2" /> Filter Lengkap
            </Button>
          </div>
          <div className="flex items-center gap-2 self-end lg:self-center">
            <Badge variant="outline" className="rounded-lg px-3 py-1.5 bg-slate-50 text-slate-600 font-bold border-slate-200">
              Menampilkan {displayedAlumni.length} dari {filteredAlumni.length} Data
            </Badge>
          </div>
        </div>

        {/* --- PANEL FILTER --- */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50/50 border-b border-slate-100"
            >
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Program Pelatihan</Label>
                  <select 
                    value={filterProgram} 
                    onChange={e => setFilterProgram(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">Semua Program</option>
                    {filterOptions.programs.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tahun Lulus</Label>
                  <select 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">Semua Tahun</option>
                    {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Akun</Label>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="CLAIMED">Sudah Diklaim (Aktif)</option>
                    <option value="DORMANT">Belum Diklaim (Dormant)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Pekerjaan</Label>
                  <select 
                    value={filterEmployment} 
                    onChange={e => setFilterEmployment(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">Semua Pekerjaan</option>
                    {filterOptions.employments.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Reset Filter Button */}
              {(filterProgram !== 'ALL' || filterYear !== 'ALL' || filterStatus !== 'ALL' || filterEmployment !== 'ALL') && (
                <div className="px-5 pb-5 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilterProgram('ALL'); setFilterYear('ALL'); setFilterStatus('ALL'); setFilterEmployment('ALL');
                    }} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
                  >
                    <X size={14} className="mr-1"/> Reset Semua Filter
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PANEL BULK ACTION (MASSAL) --- */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row items-center justify-between p-3 px-5 gap-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 text-indigo-800 font-bold text-sm">
                <div className="bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-lg border border-indigo-300 shadow-sm">{selectedIds.length}</div> Data Terpilih
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 px-3 text-xs font-bold text-indigo-800 bg-white border border-indigo-200 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  onChange={(e) => {
                    if (e.target.value) handleBulkUpdateStatus(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }}
                  disabled={isBulkActionLoading}
                >
                  <option value="">-- Ubah Status Pekerjaan --</option>
                  <option value="Proses Verifikasi">Proses Verifikasi</option>
                  <option value="Bekerja (Full-time)">Bekerja (Full-time)</option>
                  <option value="Bekerja (Part-time / Freelance)">Bekerja (Part-time / Freelance)</option>
                  <option value="Wirausaha / Membangun Bisnis">Wirausaha / Membangun Bisnis</option>
                  <option value="Pendidikan Lanjut / Kuliah">Pendidikan Lanjut / Kuliah</option>
                  <option value="Mencari Kerja (Open to Work)">Mencari Kerja (Open to Work)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <Button
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-bold text-red-600 bg-white border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm"
                >
                  {isBulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 size={14} className="mr-1.5"/>}
                  Hapus Massal
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TABEL DATA --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={displayedAlumni.length > 0 && selectedIds.length === displayedAlumni.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(displayedAlumni.map((a: any) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 whitespace-nowrap">Informasi Alumni</th>
                <th className="p-4 whitespace-nowrap">Pelatihan & Pekerjaan</th>
                <th className="p-4 whitespace-nowrap">Status Akun</th>
                <th className="p-4 whitespace-nowrap">Kode Klaim (Reg. Code)</th>
                <th className="p-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-500">Mensinkronkan database alumni...</p>
                  </td>
                </tr>
              ) : displayedAlumni.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400">
                    <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-500">Tidak ada data yang sesuai dengan pencarian/filter.</p>
                  </td>
                </tr>
              ) : (
                displayedAlumni.map((alumni: any) => {
                  const empStatus = (!alumni.employmentStatus || alumni.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : alumni.employmentStatus;

                  return (
                    <tr key={alumni.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(alumni.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-4 pl-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(alumni.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, alumni.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== alumni.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-900">{alumni.name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{alumni.phone || alumni.email || 'Tidak Ada Kontak'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{alumni.programTaken || '-'}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                          Tahun: <span className="font-bold">{alumni.trainingYear || (alumni as any).graduationYear || '-'}</span> | Batch: {alumni.batch || '-'}
                        </div>
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-slate-100 text-slate-600 border-slate-200">
                            {empStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {alumni.status === 'CLAIMED' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-1">
                            <CheckCircle2 size={14} className="mr-1.5"/> Diklaim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-bold px-2.5 py-1">
                            <Clock size={14} className="mr-1.5"/> Dormant
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <code className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          {alumni.registrationCode}
                        </code>
                      </td>
                      <td className="p-4 text-right pr-6 flex justify-end gap-1.5">
                        {alumni.phone && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setWaPopupAlumni(alumni)} 
                            title="Hubungi via WhatsApp"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200 rounded-xl h-9 w-9 p-0 shadow-sm"
                          >
                            <MessageCircle size={16} />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(alumni)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200 rounded-xl h-9 w-9 p-0 shadow-sm">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(alumni.id!)} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-slate-200 rounded-xl h-9 w-9 p-0 shadow-sm">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* --- TOMBOL MUAT LEBIH BANYAK --- */}
          {!loading && displayLimit < filteredAlumni.length && (
            <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
              <Button 
                variant="outline" 
                onClick={() => setDisplayLimit(prev => prev + 25)} 
                className="rounded-full bg-white border-slate-200 text-slate-600 shadow-sm font-bold px-8 hover:border-amber-400 hover:text-amber-600 transition-all"
              >
                Muat Lebih Banyak Data <ChevronDown size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {!loading && displayLimit >= filteredAlumni.length && filteredAlumni.length > 25 && (
            <div className="p-4 border-t border-slate-100 text-center bg-slate-50 text-xs font-bold text-slate-400">
              Semua data telah ditampilkan.
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL IMPORT EXCEL --- */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Import Master Data Excel Pintar</h3>
                  <p className="text-sm text-slate-500">Unggah file .xlsx/.xls. Sistem akan otomatis update data duplikat.</p>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {!importData.length ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-4">
                      <div className="mt-1 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Download size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm">Gunakan Template Resmi</h4>
                        <p className="text-xs text-emerald-700 mt-1 mb-3">Untuk menghindari kesalahan pembacaan baris, sangat disarankan menggunakan template Excel yang telah disesuaikan dengan sistem kami.</p>
                        <Button size="sm" onClick={downloadTemplate} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold h-8">
                          Unduh Template .xlsx
                        </Button>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors">
                      <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="text-sm font-bold text-slate-700 mb-1">Pilih / Seret file Excel Anda</h4>
                      <p className="text-xs text-slate-500 mb-4">Mendukung format .xlsx dan .xls</p>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef}
                        onChange={handleExcelUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer mx-auto max-w-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={24} />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-800">Excel Berhasil Dibaca</h4>
                          <p className="text-xs text-emerald-600">Ditemukan {importData.length} baris data siap diproses.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setImportData([])} className="h-8 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                        Batal / Ganti File
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-3 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Pratinjau 3 Data Pertama</div>
                      <div className="p-0">
                        {importData.slice(0, 3).map((row, idx) => (
                          <div key={idx} className="p-3 border-b border-slate-100 last:border-0 text-sm flex flex-col gap-1">
                            <span className="font-bold text-slate-800">{row.name_of_participants || 'Tanpa Nama'}</span>
                            <span className="text-xs text-slate-500">Program: {row.program || '-'} | Tahun: {row.tahun_pelatihan || row.training_year || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <b>Mode Pintar Aktif:</b> Jika sistem mendeteksi nama dan program yang sama sudah ada, sistem akan <b>memperbarui</b> rekod tersebut agar tidak ganda.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} className="rounded-xl font-bold text-slate-600">Batal</Button>
                <Button 
                  onClick={processImport} 
                  disabled={importData.length === 0 || importLoading}
                  className="rounded-xl bg-slate-900 text-white font-bold px-8 shadow-md"
                >
                  {importLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                  {importLoading ? 'Memproses...' : 'Mulai Import Data'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL TAMBAH / EDIT MANUAL --- */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* HEADER (Fixed di atas) */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Data Alumni' : 'Tambah Data Alumni Baru'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {editingId ? 'Edit dan perbarui detail alumni yang dipilih.' : 'Isi data alumni secara manual. Sistem akan membuat kode klaim otomatis.'}
                  </p>
                </div>
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveManual} className="flex flex-col flex-1 overflow-hidden">
                {/* BODY (Area Form yang bisa di-scroll) */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                  
                  {/* Blok Identitas */}
                  <div>
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Identitas Peserta</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input required value={manualForm.name} onChange={e=>setManualForm({...manualForm, name: e.target.value})} className="h-10 rounded-xl" placeholder="Sesuai sertifikat"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Tempat, Tanggal Lahir</Label>
                        <Input value={manualForm.birthInfo} onChange={e=>setManualForm({...manualForm, birthInfo: e.target.value})} className="h-10 rounded-xl" placeholder="Contoh: Surakarta, 12 Mei 2000"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Email (Opsional)</Label>
                        <Input type="email" value={manualForm.email} onChange={e=>setManualForm({...manualForm, email: e.target.value})} className="h-10 rounded-xl" placeholder="Email aktif"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Nomor Telepon / WA</Label>
                        <Input value={manualForm.phone} onChange={e=>setManualForm({...manualForm, phone: e.target.value})} className="h-10 rounded-xl" placeholder="08..."/>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-500">Alamat Rumah Lengkap</Label>
                        <Input value={manualForm.address} onChange={e=>setManualForm({...manualForm, address: e.target.value})} className="h-10 rounded-xl" placeholder="Alamat asal/domisili"/>
                      </div>
                    </div>
                  </div>

                  {/* Blok Pelatihan */}
                  <div>
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Rekam Pelatihan STP</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Program / Kelas <span className="text-red-500">*</span></Label>
                        <Input required value={manualForm.programTaken} onChange={e=>setManualForm({...manualForm, programTaken: e.target.value})} className="h-10 rounded-xl" placeholder="Contoh: Welding Under Water"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Tahun Pelatihan <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input required type="number" value={manualForm.trainingYear} onChange={e=>setManualForm({...manualForm, trainingYear: e.target.value})} className="pl-9 h-10 rounded-xl" placeholder="Contoh: 2024"/>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Angkatan / Batch</Label>
                        <Input value={manualForm.batch} onChange={e=>setManualForm({...manualForm, batch: e.target.value})} className="h-10 rounded-xl" placeholder="Contoh: 74 / Intensif"/>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Tanggal Mulai</Label>
                        <Input type="date" value={manualForm.courseStartDate} onChange={e=>setManualForm({...manualForm, courseStartDate: e.target.value})} className="h-10 rounded-xl"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Tanggal Selesai</Label>
                        <Input type="date" value={manualForm.courseEndDate} onChange={e=>setManualForm({...manualForm, courseEndDate: e.target.value})} className="h-10 rounded-xl"/>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-500">Hasil Sertifikasi</Label>
                        <Input value={manualForm.certificationResult} onChange={e=>setManualForm({...manualForm, certificationResult: e.target.value})} className="h-10 rounded-xl" placeholder="Contoh: Kompetensi BNSP / Internal Lulus"/>
                      </div>
                    </div>
                  </div>

                  {/* Blok Tracer Study */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Tracer Study (Opsional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Status Pekerjaan</Label>
                        <select 
                          value={manualForm.employmentStatus} 
                          onChange={e=>setManualForm({...manualForm, employmentStatus: e.target.value})} 
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Proses Verifikasi">Proses Verifikasi</option>
                          <option value="Bekerja (Full-time)">Bekerja (Full-time)</option>
                          <option value="Bekerja (Part-time / Freelance)">Bekerja (Part-time / Freelance)</option>
                          <option value="Wirausaha / Membangun Bisnis">Wirausaha / Membangun Bisnis</option>
                          <option value="Pendidikan Lanjut / Kuliah">Pendidikan Lanjut / Kuliah</option>
                          <option value="Mencari Kerja (Open to Work)">Mencari Kerja (Open to Work)</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Perusahaan Saat Ini</Label>
                        <Input value={manualForm.company} onChange={e=>setManualForm({...manualForm, company: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Nama Perusahaan"/>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Posisi / Jabatan</Label>
                        <Input value={manualForm.currentJob} onChange={e=>setManualForm({...manualForm, currentJob: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Contoh: Welder / Staf"/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER (Fixed di bawah) */}
                <div className="p-5 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                  <Button type="button" variant="ghost" onClick={() => setIsManualModalOpen(false)} className="rounded-xl font-bold text-slate-600">Batal</Button>
                  <Button type="submit" disabled={isSavingManual} className="rounded-xl bg-slate-900 text-white font-bold px-8 shadow-md">
                    {isSavingManual ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Data
                  </Button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL WHATSAPP OPTIONS --- */}
      <AnimatePresence>
        {waPopupAlumni && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><MessageCircle size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Hubungi Alumni</h3>
                    <p className="text-sm text-slate-500">{waPopupAlumni.name}</p>
                  </div>
                </div>
                <button onClick={() => setWaPopupAlumni(null)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 bg-slate-50/30">
                <button 
                  onClick={() => {
                    const waNumber = formatWhatsAppNumber(waPopupAlumni.phone);
                    window.open(`https://wa.me/${waNumber}`, '_blank');
                    setWaPopupAlumni(null);
                  }}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-3 bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-xl transition-colors shrink-0">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">Kirim Pesan Biasa</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Buka WhatsApp untuk mengobrol atau bertanya seperti biasa tanpa pesan otomatis.</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    const waNumber = formatWhatsAppNumber(waPopupAlumni.phone);
                    const message = generateWaMessage(waPopupAlumni);
                    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
                    setWaPopupAlumni(null);
                  }}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-3 bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-xl transition-colors shrink-0">
                    <Key size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700">Kirim Instruksi Klaim Akun</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kirimkan langkah-langkah klaim akun dan <strong className="text-slate-700">Kode Registrasi</strong> secara otomatis agar alumni dapat melengkapi profilnya.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}