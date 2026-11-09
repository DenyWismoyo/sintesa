'use client';

import { useState, useEffect, useRef } from 'react';
import { Asset } from '@/types';
import { Download, Upload, Plus, LayoutList, Wrench, ShieldAlert, Folder, Bell, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Gunakan Custom Hook
import { useAssets } from '@/hooks/useAssets';
import { useAdminTab } from '@/hooks/useAdminTab';
import { assetService } from '@/services/asset.service';

// Import Komponen UI
import TabDaftarAset from './components/TabDaftarAset';
import TabLaporanPublik from './components/TabLaporanPublik';
import { AdminPageHeader, AdminStatGrid } from '@/components/admin';
import ModalDetailAset from './components/ModalDetailAset';
import ModalFormAset from './components/ModalFormAset';
import ModalQrCode from './components/ModalQrCode';
import FloatingPrintBar from './components/FloatingPrintBar';
import PrintLayout from './components/PrintLayout';

const ASET_TABS = ['Daftar Aset', 'Laporan Publik'] as const;
type AsetTab = (typeof ASET_TABS)[number];

export default function AsetPage() {
  const { 
    assets, openReports,
    addAsset, updateAsset, saveAssetWithImage, 
    deleteAsset, resolveReport, addMaintenance 
  } = useAssets();
  
  const [mainTab, setMainTab] = useAdminTab<AsetTab>('Daftar Aset', ASET_TABS);
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
      <div className="space-y-6 print:hidden pb-24"><div className={(detailAsset || formAsset) ? 'hidden' : 'space-y-6'}>
        {/* 1. ADMIN PAGE HEADER */}
        <AdminPageHeader
          title="Manajemen Aset & Fasilitas"
          subtitle="Sistem pendataan inventaris fisik, utilisasi ruangan, dan pelaporan pemeliharaan real-time."
          badge={`${assets.length} Item Terdaftar`}
          breadcrumbs={[{ label: 'Manajemen Aset' }]}
          tabs={[
            { id: 'Daftar Aset', label: 'Database Aset', icon: <Folder size={14} />, badge: assets.length },
            { id: 'Laporan Publik', label: 'Laporan Kerusakan', icon: <Bell size={14} />, badge: openReports.length || undefined },
          ]}
          activeTab={mainTab}
          onTabChange={(id) => setMainTab(id as AsetTab)}
          actions={
            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Upload size={15} className="text-slate-500" />
                <span>Import Excel</span>
              </button>
              <button 
                onClick={exportToExcel} 
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Download size={15} className="text-emerald-600" />
                <span>Export Excel</span>
              </button>
              <button 
                onClick={() => setFormAsset('NEW')} 
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs shadow-blue-200"
              >
                <Plus size={15} />
                <span>Tambah Aset</span>
              </button>
            </div>
          }
        />

        {/* STATS SECTION */}
        <AdminStatGrid
          columns={3}
          items={[
            {
              label: 'Total Aset Terdata',
              value: `${assets.length} Item`,
              icon: <LayoutList size={18} />,
              color: 'blue',
              subtext: 'Inventaris fisik & ruangan terdaftar',
              onClick: () => setMainTab('Daftar Aset'),
              active: mainTab === 'Daftar Aset',
            },
            {
              label: 'Sedang Diperbaiki',
              value: `${assets.filter(a => a.status === 'Pemeliharaan').length} Aset`,
              icon: <Wrench size={18} />,
              color: 'amber',
              subtext: 'Status dalam pemeliharaan teknis',
            },
            {
              label: 'Laporan Publik Masuk',
              value: `${openReports.length} Belum Selesai`,
              icon: <ShieldAlert size={18} />,
              color: openReports.length > 0 ? 'rose' : 'slate',
              subtext: openReports.length > 0 ? 'Perlu tindak lanjut segera' : 'Semua laporan telah tertangani',
              onClick: () => setMainTab('Laporan Publik'),
              active: mainTab === 'Laporan Publik',
            },
          ]}
        />

        {/* RENDER CONTENT */}
        {mainTab === 'Daftar Aset' && (
          <TabDaftarAset 
            selectedForPrint={selectedForPrint} setSelectedForPrint={setSelectedForPrint}
            onOpenDetail={handleOpenDetail} onOpenForm={setFormAsset} onOpenQr={setQrAsset}
          />
        )}
        
        {mainTab === 'Laporan Publik' && <TabLaporanPublik reports={openReports} assets={assets} onOpenDetail={handleOpenDetail} />}

        {/* WORKSPACES & MODALS */}</div>
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