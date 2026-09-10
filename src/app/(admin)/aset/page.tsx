'use client';

import { useState, useEffect, useRef } from 'react';
import { Asset } from '@/types';
import { Download, Upload, Plus, LayoutList, Wrench, ShieldAlert, Folder, Bell, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Gunakan Custom Hook
import { useAssets } from '@/hooks/useAssets';
import { assetService } from '@/services/asset.service';

// Import Komponen UI
import StatCard from './components/StatCard';
import TabDaftarAset from './components/TabDaftarAset';
import TabLaporanPublik from './components/TabLaporanPublik';
import ModalDetailAset from './components/ModalDetailAset';
import ModalFormAset from './components/ModalFormAset';
import ModalQrCode from './components/ModalQrCode';
import FloatingPrintBar from './components/FloatingPrintBar';
import PrintLayout from './components/PrintLayout';

export default function AsetPage() {
  const { 
    assets, openReports,
    addAsset, updateAsset, saveAssetWithImage, 
    deleteAsset, resolveReport, addMaintenance 
  } = useAssets();
  
  const [mainTab, setMainTab] = useState<'Daftar Aset' | 'Laporan Publik'>('Daftar Aset');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [formAsset, setFormAsset] = useState<Asset | 'NEW' | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  const handleOpenDetail = async (assetBasicInfo: any) => {
    try {
      const fullData = await assetService.getAssetById(assetBasicInfo.id);
      setDetailAsset(fullData || assetBasicInfo);
    } catch (error) {
      setDetailAsset(assetBasicInfo);
    }
  };

  const exportToExcel = () => {
    const dataToExport = assets.map(a => ({
      'ID Sistem (JANGAN DIUBAH)': a.id || '',
      'Nama Aset': a.name, 
      'Kode Inventaris': a.inventoryNumber,
      'No. Register': a.registerNumber || '-',
      'Kategori': a.category,
      'Jenis Aset': a.assetType || '-',
      'Merek / Type': a.brandType || '-',
      'Bahan': a.material || '-',
      'Dimensi / Ukuran': a.dimensions || '-',
      'Sifat Aset': a.isRentable ? 'Komersial' : 'Inventaris Tetap', 
      'Lokasi': a.location,
      'Penanggung Jawab (PIC)': a.picName || '-',
      'Nilai Aset (Rp)': a.priceValue || 0,
      'Kondisi': a.condition, 
      'Status': a.status, 
      'Tahun Perolehan': a.acquisitionYear || '-',
      'Sumber Dana': a.fundingSource || '-',
      'Keterangan': a.description || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Aset KST");
    XLSX.writeFile(workbook, `Inventaris_STP_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        let addedCount = 0;
        let updatedCount = 0;
        
        for (const row of json as any[]) {
          if (row['Nama Aset'] && row['Kode Inventaris']) {
            
            const assetData = {
              name: row['Nama Aset'], 
              inventoryNumber: row['Kode Inventaris'], 
              registerNumber: row['No. Register'] && row['No. Register'] !== '-' ? String(row['No. Register']) : '',
              category: row['Kategori'] || 'Lainnya',
              assetType: row['Jenis Aset'] && row['Jenis Aset'] !== '-' ? row['Jenis Aset'] : '', 
              brandType: row['Merek / Type'] && row['Merek / Type'] !== '-' ? row['Merek / Type'] : '',
              material: row['Bahan'] && row['Bahan'] !== '-' ? row['Bahan'] : '',
              dimensions: row['Dimensi / Ukuran'] && row['Dimensi / Ukuran'] !== '-' ? row['Dimensi / Ukuran'] : '',
              priceValue: Number(row['Nilai Aset (Rp)']) || 0,
              isRentable: row['Sifat Aset'] === 'Komersial', 
              location: row['Lokasi'] || '', 
              condition: row['Kondisi'] || 'Baik',
              status: row['Status'] || 'Tersedia', 
              acquisitionYear: row['Tahun Perolehan'] && row['Tahun Perolehan'] !== '-' ? String(row['Tahun Perolehan']) : '', 
              fundingSource: row['Sumber Dana'] && row['Sumber Dana'] !== '-' ? row['Sumber Dana'] : '',
              picName: row['Penanggung Jawab (PIC)'] && row['Penanggung Jawab (PIC)'] !== '-' ? row['Penanggung Jawab (PIC)'] : '', 
              description: row['Keterangan'] && row['Keterangan'] !== '-' ? row['Keterangan'] : ''
            };

            const rowId = row['ID Sistem (JANGAN DIUBAH)'];

            if (rowId) {
              const res = await updateAsset(String(rowId), assetData);
              if (res.success) updatedCount++;
            } else {
              const res = await addAsset({
                ...assetData,
                createdAt: Date.now(), 
                maintenanceHistory: [], 
                unresolvedReportsCount: 0
              });
              if (res.success) addedCount++;
            }
          }
        }
        alert(`Impor selesai! Berhasil memperbarui ${updatedCount} data dan menambah ${addedCount} data baru.`);
      } catch (err) { 
        alert("Format Excel tidak sesuai atau terjadi kesalahan saat memproses."); 
      } finally { 
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <div className="space-y-6 print:hidden pb-24">
        {/* HEADER SECTION - Minimalist styling */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Aset & Pemeliharaan</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem Pendataan Terpadu secara Real-time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Upload size={16} className="text-slate-500" /> Import
            </button>
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Download size={16} className="text-emerald-500" /> Export
            </button>
            <button onClick={() => setFormAsset('NEW')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-blue-200">
              <Plus size={18} /> Tambah Aset
            </button>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<LayoutList size={24}/>} title="Total Aset Terdata" value={assets.length} suffix="Item" colorClass="bg-blue-50 text-blue-600" />
          <StatCard icon={<Wrench size={24}/>} title="Sedang Diperbaiki" value={assets.filter(a => a.status === 'Pemeliharaan').length} suffix="Aset" colorClass="bg-amber-50 text-amber-600" />
          
          <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors ${openReports.length > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className={`p-3 rounded-xl ${openReports.length > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <ShieldAlert size={24}/>
            </div>
            <div>
              <p className={`text-sm font-medium ${openReports.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>Laporan Publik Masuk</p>
              <h3 className={`text-2xl font-extrabold ${openReports.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                {openReports.length} <span className="text-sm font-normal text-slate-500">Belum Selesai</span>
              </h3>
            </div>
          </div>
        </div>

        {/* PILL TABS SECTION */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl w-fit">
          <button 
            onClick={() => setMainTab('Daftar Aset')} 
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm rounded-lg transition-all ${mainTab === 'Daftar Aset' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <Folder size={18} /> Database Aset
          </button>
          <button 
            onClick={() => setMainTab('Laporan Publik')} 
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm rounded-lg transition-all ${mainTab === 'Laporan Publik' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <Bell size={18} /> Laporan Kerusakan
            {openReports.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{openReports.length}</span>}
          </button>
        </div>

        {/* RENDER CONTENT */}
        {mainTab === 'Daftar Aset' && (
          <TabDaftarAset 
            selectedForPrint={selectedForPrint} setSelectedForPrint={setSelectedForPrint}
            onOpenDetail={handleOpenDetail} onOpenForm={setFormAsset} onOpenQr={setQrAsset}
          />
        )}
        
        {mainTab === 'Laporan Publik' && <TabLaporanPublik reports={openReports} assets={assets} onOpenDetail={handleOpenDetail} />}

        {/* MODALS */}
        {detailAsset && (
          <ModalDetailAset 
            asset={detailAsset} 
            allReports={openReports} 
            baseUrl={baseUrl} 
            onClose={() => setDetailAsset(null)} 
            onDelete={async (id) => { 
              const res = await deleteAsset(id);
              if (res.success) {
                setDetailAsset(null); 
                setSelectedForPrint(prev => prev.filter(p => p !== id)); 
              }
              return res;
            }}
            onResolveReport={resolveReport}
            onAddMaintenance={addMaintenance}
          />
        )}
        
        {formAsset && (
          <ModalFormAset 
            assetToEdit={formAsset} 
            onClose={() => setFormAsset(null)} 
            onSave={saveAssetWithImage} 
          />
        )}
        
        {qrAsset && <ModalQrCode asset={qrAsset} baseUrl={baseUrl} onClose={() => setQrAsset(null)} />}

        <FloatingPrintBar selectedCount={selectedForPrint.length} onCancel={() => setSelectedForPrint([])} />
      </div>
      
      <PrintLayout assets={assets} selectedIds={selectedForPrint} baseUrl={baseUrl} />
    </>
  );
}