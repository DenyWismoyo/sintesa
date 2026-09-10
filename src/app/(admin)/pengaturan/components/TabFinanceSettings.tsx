// Lokasi file: src/app/pengaturan/components/TabFinanceSettings.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Filter, Plus, Edit2, Trash2, AlertCircle, 
  X, Loader2, Folder, FileText, ListMinus, Landmark,
  Download, Upload, PlusCircle, Calendar, ChevronRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useFinance } from '@/hooks/useFinance';
import { Account } from '@/types';

export default function TabFinanceSettings() {
  const { accounts = [], loading, createAccount, updateAccount, deleteAccount } = useFinance() || {};
  
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear().toString());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // State khusus untuk fitur Quick Add
  const [quickAddParentId, setQuickAddParentId] = useState<string>('');
  const [quickAddBehavior, setQuickAddBehavior] = useState<string>('TRANSACTION');

  // STATE BARU: Menyimpan ID akun-akun (Folder/Header) yang sedang DIBUKA (Expanded)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // HANDLER EXPAND/COLLAPSE
  // =========================================================================
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id); // Collapse
      } else {
        newSet.add(id); // Expand
      }
      return newSet;
    });
  };

  // =========================================================================
  // ALGORITMA TREE MAPPING & SORTING (Dengan Logika Visibilitas)
  // =========================================================================
  type TreeNode = Account & { 
    children?: TreeNode[],
    isVisible?: boolean, // Property baru untuk menentukan apakah baris ini di-render
    hasChildren?: boolean // Untuk menampilkan icon panah (Chevron)
  };

  const hierarchicalAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
    
    // Jika pencarian aktif, otomatis expand semua dan tampilkan flat list yang cocok
    if (search.trim() !== '') {
      return accounts.filter(acc => 
        (filterType === 'ALL' || acc.type === filterType) &&
        (acc.name.toLowerCase().includes(search.toLowerCase()) || acc.code.toLowerCase().includes(search.toLowerCase()))
      ).map(acc => ({...acc, isVisible: true, hasChildren: false}))
       .sort((a, b) => a.code.localeCompare(b.code));
    }

    const filtered = accounts.filter(acc => filterType === 'ALL' || acc.type === filterType);
    
    // Fungsi membangun Tree yang menyuntikkan status isVisible
    const buildTree = (parentId: string | null | undefined, isParentExpanded: boolean): TreeNode[] => {
      const children = filtered.filter(acc => (acc.parentId || null) === parentId);
      
      return children
        .sort((a, b) => {
           if (a.code === b.code) return a.name.localeCompare(b.name);
           return a.code.localeCompare(b.code);
        })
        .map(acc => {
          // Cek apakah akun ini punya anak lagi di database secara keseluruhan
          const hasKids = filtered.some(child => child.parentId === acc.id);
          
          // Akun ini akan visible (ditampilkan) JIKA: 
          // 1. Dia adalah root (parentId null) ATAU
          // 2. Induknya sedang di-expand (isParentExpanded)
          const isVisible = (parentId === null) || isParentExpanded;

          // Apakah node (folder) ini sendiri sedang di-expand oleh user?
          const isThisNodeExpanded = expandedNodes.has(acc.id as string);

          return {
            ...acc,
            isVisible,
            hasChildren: hasKids,
            children: buildTree(acc.id, isVisible && isThisNodeExpanded)
          };
        });
    };

    // Fungsi meratakan Tree menjadi Array berurutan
    const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      nodes.forEach(node => {
        // Hanya masukkan ke result jika statusnya visible
        if (node.isVisible) {
          const { children, ...accountData } = node;
          result.push(accountData as TreeNode); 
          if (children && children.length > 0) {
            result = result.concat(flattenTree(children)); 
          }
        }
      });
      return result;
    };

    // Mulai dari Root (Level 1). Root selalu assumed "Parent is Expanded" (true) agar tampil.
    const tree = buildTree(null, true); 
    return flattenTree(tree);
  }, [accounts, search, filterType, expandedNodes]);

  // =========================================================================
  // HANDLER AKSI (CRUD)
  // =========================================================================

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setQuickAddParentId('');
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    setQuickAddParentId('');
    setQuickAddBehavior('TRANSACTION');
    setIsModalOpen(true);
  };

  const handleQuickAddSub = (parentAcc: Account) => {
    setEditingAccount(null);
    setQuickAddParentId(parentAcc.id || '');
    setQuickAddBehavior(parentAcc.accountBehavior === 'HEADER' ? 'TRANSACTION' : 'DETAIL');
    
    // Otomatis Expand folder tersebut agar user langsung melihat item yang baru ditambahkannya nanti
    if (parentAcc.id) {
       setExpandedNodes(prev => new Set(prev).add(parentAcc.id as string));
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (acc: Account) => {
    if (acc.isSystem) {
      toast.error('Akun bawaan sistem tidak dapat dihapus.');
      return;
    }
    const hasChildren = accounts.some(child => child.parentId === acc.id);
    if (hasChildren) {
      toast.error('Gagal menghapus! Akun ini memiliki sub-kegiatan di bawahnya.');
      return;
    }
    if (window.confirm(`Hapus kode rekening: \n${acc.code} - ${acc.name}?`)) {
      const toastId = toast.loading('Menghapus...');
      if (deleteAccount) {
         const res = await deleteAccount(acc.id!);
         if (res.success) toast.success('Berhasil dihapus', { id: toastId });
         else toast.error(`Gagal menghapus: ${res.error}`, { id: toastId });
      }
    }
  };

  const handleSubmit = async (data: Omit<Account, 'id'>) => {
    if (editingAccount && editingAccount.id) {
      if (updateAccount) {
         const res = await updateAccount(editingAccount.id, data);
         if (res.success) { toast.success('Disimpan.'); setIsModalOpen(false); } 
         else { toast.error(`Gagal: ${res.error}`); }
      }
    } else {
      if (createAccount) {
         const res = await createAccount(data);
         if (res.success) { toast.success('Ditambahkan.'); setIsModalOpen(false); } 
         else { toast.error(`Gagal: ${res.error}`); }
      }
    }
  };

  // =========================================================================
  // FITUR EXPORT / IMPORT CSV (SMART DETECT & LEVELING)
  // =========================================================================
  const handleExportExcel = () => {
    const headers = ['Kode Rekening', 'Nama Akun', 'Kategori', 'Sifat Akun', 'Bawaan Sistem', 'Kode Induk', 'Level'];
    
    // Untuk Export, kita ambil dari state asli (accounts) lalu dibuild Tree secara Penuh tanpa batasan isVisible
    // agar CSV ter-download secara keseluruhan, bukan hanya yang sedang di-expand.
    
    // Fungsi sementara untuk Export Full Tree
    const buildExportTree = (parentId: string | null | undefined): Account[] => {
      const children = accounts.filter(acc => (acc.parentId || null) === parentId)
        .sort((a, b) => {
           if (a.code === b.code) return a.name.localeCompare(b.name);
           return a.code.localeCompare(b.code);
        });
      let result: Account[] = [];
      children.forEach(acc => {
        result.push(acc);
        result = result.concat(buildExportTree(acc.id));
      });
      return result;
    };
    
    const fullTreeList = buildExportTree(null);

    const csvRows = fullTreeList.map(acc => {
      let parentCode = '';
      if (acc.parentId) {
        const parent = accounts.find(a => a.id === acc.parentId);
        if (parent) parentCode = parent.code;
      }
      return [
        `"${acc.code}"`, 
        `"${acc.name}"`, 
        `"${acc.type}"`, 
        `"${acc.accountBehavior}"`, 
        acc.isSystem ? 'YA' : 'TIDAK',
        `"${parentCode}"`,
        `"${acc.level}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BAS_Format_Leveling_${tahunAnggaran}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data diekspor. Gunakan format ini untuk import kembali.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading('Memproses file Excel/CSV secara berurutan...');
    
    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
      
      let importedCount = 0;
      let skippedCount = 0;
      
      const codeToIdMap = new Map<string, string>();
      accounts.forEach(acc => {
        if (acc.code && acc.id && acc.code !== '-') {
          codeToIdMap.set(acc.code, acc.id);
        }
      });

      const headerCols = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/(^"|"$)/g, '').trim().toLowerCase());
      const idxKode = headerCols.findIndex(h => h.includes('kode rekening'));
      const idxNama = headerCols.findIndex(h => h.includes('nama'));
      const idxKategori = headerCols.findIndex(h => h.includes('kategori'));
      const idxSifat = headerCols.findIndex(h => h.includes('sifat'));
      const idxInduk = headerCols.findIndex(h => h.includes('induk'));
      const idxLevel = headerCols.findIndex(h => h.includes('level'));

      if (idxKode === -1 || idxNama === -1) {
        throw new Error("Kolom 'Kode Rekening' atau 'Nama Akun' tidak ditemukan di CSV.");
      }

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/(^"|"$)/g, '').trim());
        
        if (cols.length > idxNama && createAccount) {
          const codeRaw = cols[idxKode];
          const code = codeRaw && codeRaw !== '' ? codeRaw : '-';
          const name = cols[idxNama].replace(/^\s+/, '').replace(/\s+$/, ''); 
          const type = idxKategori !== -1 && cols[idxKategori] ? cols[idxKategori] : 'PENDAPATAN';
          const behavior = idxSifat !== -1 && cols[idxSifat] ? cols[idxSifat] : 'TRANSACTION';
          const parentCodeInput = idxInduk !== -1 ? cols[idxInduk] : '';
          const levelInput = idxLevel !== -1 && cols[idxLevel] ? parseInt(cols[idxLevel]) : null;

          const isDuplicate = accounts.some(a => a.code === code && a.name === name);
          if (isDuplicate) {
            skippedCount++;
            continue; 
          }

          let parentId: string | null = null;
          if (parentCodeInput && parentCodeInput !== '' && parentCodeInput !== '-') {
             parentId = codeToIdMap.get(parentCodeInput) || null;
          }

          let level = 1;
          if (levelInput && !isNaN(levelInput)) {
             level = levelInput; 
          } else if (parentId) {
             const parentAcc = accounts.find(a => a.id === parentId);
             level = parentAcc ? parentAcc.level + 1 : 2;
          }

          const data: Omit<Account, 'id'> = {
            code: code,
            name: name,
            type: type as any,
            accountBehavior: behavior as any,
            level: level,
            parentId: parentId,
            balance: 0,
            isSystem: false
          };

          const res = await createAccount(data);
          
          if (res.success && res.id && code !== '-') {
            importedCount++;
            codeToIdMap.set(code, res.id); 
          } else if (res.success) {
            importedCount++; 
          }
        }
      }
      
      if (importedCount > 0) {
        toast.success(`Berhasil impor ${importedCount} rincian BAS. (${skippedCount} dilewati/duplikat)`, { id: toastId });
      } else if (skippedCount > 0) {
        toast.info(`Tidak ada data baru ditambahkan. ${skippedCount} duplikat dilewati.`, { id: toastId });
      }
      
    } catch (error: any) {
      console.error("Import Error:", error);
      toast.error(error.message || 'Terjadi kesalahan sistem saat membaca file CSV.', { id: toastId });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // =========================================================================
  // UI HELPERS
  // =========================================================================
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'PENDAPATAN': return <span className="text-emerald-700 font-bold">Pendapatan</span>;
      case 'BEBAN': return <span className="text-red-700 font-bold">Beban/Biaya</span>;
      case 'KAS_BANK': return <span className="text-blue-700 font-bold">Kas & Bank</span>;
      default: return <span className="text-slate-700 font-bold">{type}</span>;
    }
  };

  const renderAccountBehaviorBadge = (behavior: string) => {
    switch(behavior) {
      case 'HEADER': 
        return <span className="inline-block bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200">Induk / Grup</span>;
      case 'TRANSACTION': 
        return <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-200">Sub-Kegiatan (Transaksi)</span>;
      case 'DETAIL': 
        return <span className="inline-block bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-200">Rincian Objek</span>;
      default:
        return null;
    }
  };

  const renderAccountIcon = (behavior: string, hasChildren: boolean, isExpanded: boolean) => {
    if (behavior === 'HEADER') {
      return (
        <div className="relative">
          <Folder className="w-4 h-4 text-amber-500" />
          {hasChildren && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-200">
               {isExpanded ? <ChevronDown className="w-2.5 h-2.5 text-slate-600" /> : <ChevronRight className="w-2.5 h-2.5 text-slate-600" />}
            </div>
          )}
        </div>
      );
    }
    if (behavior === 'TRANSACTION') {
      return (
        <div className="relative">
          <FileText className="w-4 h-4 text-blue-500" />
          {hasChildren && (
             <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-200">
                {isExpanded ? <ChevronDown className="w-2.5 h-2.5 text-slate-600" /> : <ChevronRight className="w-2.5 h-2.5 text-slate-600" />}
             </div>
          )}
        </div>
      );
    }
    return <ListMinus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-8 relative">
      {/* OVERLAY LOADING IMPORT */}
      {isImporting && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[100] flex flex-col items-center justify-center rounded-3xl">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
             <p className="text-slate-800 font-black text-lg">Memproses File Excel...</p>
             <p className="text-sm text-slate-500 mt-2 font-medium">Sistem sedang merangkai struktur hierarki BAS.</p>
          </div>
        </div>
      )}

      {/* HEADER & PERIODE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bagan Akun Standar (BAS)</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola hierarki kode rekening dan rincian kegiatan anggaran.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Anggaran</span>
            <select value={tahunAnggaran} onChange={e => setTahunAnggaran(e.target.value)} className="bg-transparent text-sm font-black text-slate-800 outline-none cursor-pointer">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOOLBAR BAWAH: FILTER & EXPORT/IMPORT */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari kode rekening atau rincian..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              <option value="PENDAPATAN">Pendapatan</option>
              <option value="BEBAN">Beban / Pengeluaran</option>
              <option value="KAS_BANK">Kas & Bank</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={handleImportClick} disabled={isImporting} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-bold disabled:opacity-50">
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button onClick={handleExportExcel} disabled={isImporting} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-bold disabled:opacity-50">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download Format / Export</span>
          </button>
          
          <button onClick={handleAddNew} disabled={isImporting} className="ml-2 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
        </div>
      </div>

      {/* TREE TABLE DENGAN EXPAND/COLLAPSE */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto w-full border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4 w-[50%]">Kode & Nama Kegiatan / Rincian</th>
                <th className="px-6 py-4">Kategori Utama</th>
                <th className="px-6 py-4">Sifat / Peruntukan</th>
                <th className="px-6 py-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hierarchicalAccounts.map((acc) => {
                const indentMultiplier = search.trim() === '' ? (acc.level - 1) : 0;
                
                const paddingLeftBase = 1.5; 
                const paddingAdd = indentMultiplier * 2.5; 
                const totalPaddingLeft = `${paddingLeftBase + paddingAdd}rem`;

                const isHeader = acc.accountBehavior === 'HEADER';
                const isDetail = acc.accountBehavior === 'DETAIL';
                const isExpanded = expandedNodes.has(acc.id as string);
                
                // Baris bisa di-klik untuk di-expand HANYA jika bukan rincian, dan punya anak
                const isClickable = search.trim() === '' && acc.hasChildren;

                return (
                  <tr 
                    key={acc.id} 
                    className={`transition-colors group hover:bg-blue-50/50 ${isHeader && acc.level === 1 ? 'bg-slate-50/80 border-t-2 border-slate-200' : ''}`}
                  >
                    <td 
                      className={`px-6 py-3.5 relative ${isClickable ? 'cursor-pointer select-none' : ''}`} 
                      style={{ paddingLeft: totalPaddingLeft }}
                      onClick={() => isClickable ? toggleExpand(acc.id as string) : null}
                    >
                      {/* ELEMEN GARIS L-SHAPE */}
                      {indentMultiplier > 0 && search === '' && (
                        <div 
                          className="absolute border-l-2 border-b-2 border-slate-200 rounded-bl-lg pointer-events-none"
                          style={{ 
                            left: `${paddingLeftBase + (indentMultiplier - 1) * 2.5 + 1.2}rem`, 
                            top: '0', 
                            bottom: '50%',
                            width: '1rem'
                          }}
                        />
                      )}

                      <div className="flex items-center gap-2.5 relative z-10">
                        {/* Ikon penanda dengan Chevron indikator Expand/Collapse */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isHeader ? 'bg-amber-100 text-amber-600' : isDetail ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'} transition-transform ${isClickable ? 'group-hover:scale-105' : ''}`}>
                          {renderAccountIcon(acc.accountBehavior || 'TRANSACTION', acc.hasChildren || false, isExpanded)}
                        </div>
                        
                        <div className="flex flex-col">
                           <span className={`font-mono text-xs ${isHeader ? 'font-black text-slate-800' : isDetail ? 'text-slate-400 font-semibold' : 'font-bold text-slate-600'}`}>
                             {acc.code}
                           </span>
                           <span className={`text-[13px] ${isHeader ? 'font-black text-slate-900' : isDetail ? 'text-slate-600 italic font-medium' : 'font-bold text-slate-800'}`}>
                             {acc.name}
                           </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-3.5 align-middle">
                      <div className="flex flex-col">
                        {getTypeLabel(acc.type)}
                        {acc.isSystem && <span className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Terkunci Sistem</span>}
                      </div>
                    </td>

                    <td className="px-6 py-3.5 align-middle">
                      {renderAccountBehaviorBadge(acc.accountBehavior || 'TRANSACTION')}
                    </td>

                    <td className="px-6 py-3.5 flex justify-end gap-2 align-middle">
                      {/* TOMBOL QUICK ADD SUB-KEGIATAN */}
                      {!isDetail && !acc.isSystem && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleQuickAddSub(acc); }} 
                          className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg transition-all shadow-sm"
                          title="Tambah Sub-Kegiatan / Rincian di dalam grup ini"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(acc); }} 
                        className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(acc); }}
                        disabled={acc.isSystem} 
                        className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-400" 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {hierarchicalAccounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Search className="w-6 h-6 text-slate-300"/>
                    </div>
                    <p className="font-bold text-slate-600">Bagan Akun Kosong</p>
                    <p className="text-sm mt-1">Silakan Import file CSV Format Standar untuk memulai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <ModalFormAccount 
          initialData={editingAccount} 
          allAccounts={accounts}
          prefilledParentId={quickAddParentId}
          prefilledBehavior={quickAddBehavior}
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit} 
        />
      )}
    </div>
  );
}

// =========================================================================
// KOMPONEN: MODAL FORM AKUN 
// =========================================================================
interface ModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Account, 'id'>) => Promise<void>;
  initialData?: Account | null;
  allAccounts: Account[];
  prefilledParentId?: string;
  prefilledBehavior?: string;
}

function ModalFormAccount({ onClose, onSubmit, initialData, allAccounts, prefilledParentId, prefilledBehavior }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PENDAPATAN',
    balance: 0,
    parentId: '',
    accountBehavior: 'TRANSACTION',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        type: initialData.type || 'PENDAPATAN',
        balance: initialData.balance || 0,
        parentId: initialData.parentId || '',
        accountBehavior: initialData.accountBehavior || 'TRANSACTION',
      });
    } else {
      const parentAcc = allAccounts.find(a => a.id === prefilledParentId);
      setFormData({
        code: '',
        name: '',
        type: parentAcc ? parentAcc.type : 'PENDAPATAN',
        balance: 0,
        parentId: prefilledParentId || '',
        accountBehavior: prefilledBehavior || 'TRANSACTION',
      });
    }
  }, [initialData, prefilledParentId, prefilledBehavior, allAccounts]);

  const validParents = allAccounts.filter(acc => acc.accountBehavior !== 'DETAIL' && acc.id !== initialData?.id);
  const selectedParent = allAccounts.find(acc => acc.id === formData.parentId);
  
  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const parent = allAccounts.find(a => a.id === pId);
    setFormData(prev => ({
      ...prev,
      parentId: pId,
      type: parent ? parent.type : prev.type 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const level = selectedParent ? selectedParent.level + 1 : 1;
    const finalCode = (formData.accountBehavior === 'DETAIL' && !formData.code) ? '-' : formData.code;

    await onSubmit({
      ...formData,
      code: finalCode,
      type: formData.type as any,
      parentId: formData.parentId === '' ? null : formData.parentId, 
      level: level,
      accountBehavior: formData.accountBehavior as any,
      isSystem: initialData?.isSystem || false 
    });
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const labelClass = "text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-100 max-h-[95vh]">
        
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Landmark className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {isEditing ? 'Edit Kode Rekening' : (prefilledParentId ? 'Tambah Sub-Kegiatan Cepat' : 'Tambah Rekening Baru')}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Manajemen Hierarki BAS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          <form id="accountForm" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {initialData?.isSystem && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">Ini adalah <strong>akun bawaan sistem</strong>. Kategori Tipe dikunci agar struktur Laporan Neraca tidak rusak.</p>
              </div>
            )}

            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-5">
               <div>
                 <label className={labelClass}>Pilih Tingkatan Akun (Sifat)</label>
                 <div className="grid grid-cols-3 gap-3">
                   <label className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.accountBehavior === 'HEADER' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300'}`}>
                     <input type="radio" name="accBehavior" className="hidden" checked={formData.accountBehavior === 'HEADER'} onChange={() => setFormData({...formData, accountBehavior: 'HEADER'})} disabled={initialData?.isSystem} />
                     <Folder className={`w-5 h-5 mb-1.5 ${formData.accountBehavior === 'HEADER' ? 'text-amber-500' : 'text-slate-400'}`} />
                     <span className="text-xs font-bold text-center leading-tight">Akun Induk<br/><span className="font-normal text-[9px]">(Folder Grup)</span></span>
                   </label>
                   
                   <label className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.accountBehavior === 'TRANSACTION' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                     <input type="radio" name="accBehavior" className="hidden" checked={formData.accountBehavior === 'TRANSACTION'} onChange={() => setFormData({...formData, accountBehavior: 'TRANSACTION'})} disabled={initialData?.isSystem} />
                     <FileText className={`w-5 h-5 mb-1.5 ${formData.accountBehavior === 'TRANSACTION' ? 'text-blue-500' : 'text-slate-400'}`} />
                     <span className="text-xs font-bold text-center leading-tight">Transaksi<br/><span className="font-normal text-[9px]">(Buku Besar)</span></span>
                   </label>

                   <label className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.accountBehavior === 'DETAIL' ? 'bg-slate-200 border-slate-500 text-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                     <input type="radio" name="accBehavior" className="hidden" checked={formData.accountBehavior === 'DETAIL'} onChange={() => setFormData({...formData, accountBehavior: 'DETAIL'})} disabled={initialData?.isSystem} />
                     <ListMinus className={`w-5 h-5 mb-1.5 ${formData.accountBehavior === 'DETAIL' ? 'text-slate-600' : 'text-slate-400'}`} />
                     <span className="text-xs font-bold text-center leading-tight">Sub Kegiatan<br/><span className="font-normal text-[9px]">(Strip Rincian)</span></span>
                   </label>
                 </div>
               </div>

               <div>
                  <label className={labelClass}>Induk Rekening (Hierarki Atas)</label>
                  <select 
                    value={formData.parentId} 
                    onChange={handleParentChange} 
                    className={inputClass}
                    disabled={initialData?.isSystem}
                  >
                    <option value="">-- Kosong (Level 1 Root) --</option>
                    {validParents.map(g => (
                      <option key={g.id} value={g.id}>{g.code} - {g.name}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Kode Referensi</label>
                <input 
                  type="text" placeholder={formData.accountBehavior === 'DETAIL' ? "Otomatis diisi '-' jika kosong" : "Cth: 4.1.01"} 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  className={inputClass} 
                  required={formData.accountBehavior !== 'DETAIL'}
                />
              </div>
              
              <div>
                <label className={labelClass}>Kategori Utama Laporan</label>
                <select 
                  required 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  className={inputClass}
                  disabled={initialData?.isSystem || formData.parentId !== ''} 
                >
                  <option value="PENDAPATAN">Pendapatan</option>
                  <option value="BEBAN">Beban & Biaya</option>
                  <option value="KAS_BANK">Kas & Bank</option>
                  <option value="HUTANG">Hutang (Kewajiban)</option>
                  <option value="PIUTANG">Piutang (Tagihan)</option>
                  <option value="ASET_TETAP">Aset Tetap</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className={labelClass}>
                {formData.accountBehavior === 'DETAIL' ? 'Deskripsi Rincian Kegiatan' : 'Nama Klasifikasi Akun'}
              </label>
              <input 
                type="text" required placeholder={formData.accountBehavior === 'DETAIL' ? "Pendapatan Pendaftaran Diklat..." : "Pendapatan Jasa Layanan..."}
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className={inputClass} 
              />
            </div>
            
          </form>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <button type="submit" form="accountForm" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Simpan Data'}
          </button>
        </div>

      </div>
    </div>
  );
}