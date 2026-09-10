import { useState } from 'react';
import { Asset, MaintenanceRecord } from '@/types';
import { Wrench, X, Info, AlertTriangle, Activity, Trash2, CheckCircle, FileText, Image as ImageIcon, Camera, MapPin, Tag, Landmark, Ruler, Package, User, BadgeDollarSign, Clock, Check, Plus, Loader2, Folder, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  asset: Asset;
  allReports: any[];
  baseUrl: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onResolveReport: (reportId: string, assetId: string) => Promise<{ success: boolean; error?: string }>;
  onAddMaintenance: (assetId: string, record: MaintenanceRecord) => Promise<{ success: boolean; error?: string }>;
}

export default function ModalDetailAset({ asset, allReports, baseUrl, onClose, onDelete, onResolveReport, onAddMaintenance }: Props) {
  const [tab, setTab] = useState<'Info' | 'Laporan' | 'Riwayat' | 'Galeri'>('Info');
  
  const [maintenanceForm, setMaintenanceForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', cost: 0, technician: '' });
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const assetReports = allReports.filter((r: any) => r.assetId === asset.id);

  const handleDelete = async () => {
    if (window.confirm("Yakin ingin menghapus aset ini secara permanen?")) {
      const res = await onDelete(asset.id!);
      if (!res.success) alert("Gagal menghapus: " + res.error);
    }
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMaintenance(true);
    
    const newRecord: MaintenanceRecord = { 
      id: Date.now().toString(), 
      date: maintenanceForm.date, 
      description: maintenanceForm.description, 
      cost: Number(maintenanceForm.cost), 
      technician: maintenanceForm.technician 
    };
    
    const res = await onAddMaintenance(asset.id!, newRecord);
    
    setIsAddingMaintenance(false);
    
    if (res.success) {
      setMaintenanceForm({ date: new Date().toISOString().split('T')[0], description: '', cost: 0, technician: '' });
      alert("Catatan pemeliharaan berhasil ditambahkan!");
    } else {
      alert("Gagal menyimpan catatan pemeliharaan: " + res.error);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!window.confirm("Tandai laporan ini sebagai sudah diselesaikan/diperbaiki?")) return;
    setResolvingId(reportId);
    
    const res = await onResolveReport(reportId, asset.id!);
    
    setResolvingId(null);
    if (!res.success) alert("Gagal memproses tindakan: " + res.error);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
              <Package size={32}/>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{asset.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">{asset.inventoryNumber}</span>
                {asset.registerNumber && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">REG: {asset.registerNumber}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"><X size={28} /></button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-100 px-8 bg-white overflow-x-auto hide-scrollbar">
          <button onClick={() => setTab('Info')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${tab === 'Info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Informasi Aset</button>
          <button onClick={() => setTab('Galeri')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === 'Galeri' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Galeri Foto {asset.galleryUrls?.length ? `(${asset.galleryUrls.length})` : ''}</button>
          <button onClick={() => setTab('Laporan')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === 'Laporan' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Laporan Publik {assetReports.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{assetReports.length}</span>}</button>
          <button onClick={() => setTab('Riwayat')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === 'Riwayat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Riwayat Perbaikan</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
          
          {/* KONTEN TAB INFO */}
          {tab === 'Info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Foto & QR */}
              <div className="space-y-6">
                <div className="aspect-video bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                  {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={48}/><p className="text-xs mt-2 font-bold">Tanpa Foto Utama</p></div>}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm border border-slate-100 uppercase">{asset.status}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm">
                  <QRCodeSVG value={`${baseUrl}/lapor-aset/${asset.id}`} size={160} level="H" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Scan QR Untuk Lapor</p>
                </div>
                <button onClick={handleDelete} className="w-full py-3.5 flex items-center justify-center gap-2 text-red-600 bg-white hover:bg-red-50 rounded-xl text-sm font-bold transition-colors border border-red-100 shadow-sm">
                  <Trash2 size={18}/> Hapus Data Permanen
                </button>
              </div>

              {/* Data Detail */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Info size={16}/> Identitas & Legalitas</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem icon={<Folder size={16}/>} label="Kategori" value={asset.category || '-'} />
                      <DetailItem icon={<Layers size={16}/>} label="Sub Jenis" value={asset.assetType || '-'} />
                    </div>
                    <DetailItem icon={<Landmark size={16}/>} label="Asal-Usul / Dana" value={asset.fundingSource || '-'} />
                    <DetailItem icon={<Activity size={16}/>} label="Tahun Perolehan" value={asset.acquisitionYear || '-'} />
                    <DetailItem icon={<BadgeDollarSign size={16}/>} label="Nilai Aset" value={asset.priceValue ? `Rp ${asset.priceValue.toLocaleString('id-ID')}` : '-'} />
                    <DetailItem icon={<User size={16}/>} label="Penanggung Jawab" value={asset.picName || '-'} />
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Ruler size={16}/> Spesifikasi Fisik</h4>
                    <DetailItem icon={<Wrench size={16}/>} label="Merek / Type" value={asset.brandType || '-'} />
                    <DetailItem icon={<Package size={16}/>} label="Bahan" value={asset.material || '-'} />
                    <DetailItem icon={<Ruler size={16}/>} label="Dimensi / Ukuran" value={asset.dimensions || '-'} />
                    <DetailItem icon={<MapPin size={16}/>} label="Lokasi Penempatan" value={asset.location || '-'} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Keterangan / Deskripsi</h4>
                   <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                     {asset.description || <span className="italic text-slate-400">Tidak ada keterangan tambahan yang dicatat untuk aset ini.</span>}
                   </p>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN TAB GALERI */}
          {tab === 'Galeri' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {asset.galleryUrls?.map((url, idx) => (
                 <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all group">
                   <img src={url} alt="Galeri" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 </a>
               ))}
               {(!asset.galleryUrls || asset.galleryUrls.length === 0) && <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 border-dashed">Belum ada foto tambahan dalam galeri pemantauan.</div>}
            </div>
          )}

          {/* KONTEN TAB LAPORAN PUBLIK */}
          {tab === 'Laporan' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Laporan Publik Terbuka</h3>
              {assetReports.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <CheckCircle className="mx-auto h-16 w-16 text-emerald-400 mb-4 bg-emerald-50 rounded-full p-2" />
                  <p className="text-slate-600 font-bold">Luar biasa! Tidak ada kendala atau laporan terbuka.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {assetReports.map((report: any) => (
                    <div key={report.id} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                      <div className="flex-1 space-y-4 pl-2">
                         <div className="flex justify-between items-start">
                            <div>
                              <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-md border border-red-100 mb-2 uppercase tracking-wide">{report.reportedCondition}</span>
                              <p className="font-bold text-slate-800">{report.reporterName}</p>
                              <p className="text-xs text-slate-500 font-medium">{report.reporterContact}</p>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5"><Clock size={12}/> {new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 border border-slate-100">
                           <span className="font-bold text-xs text-slate-500 uppercase tracking-widest block mb-1">Catatan Pelapor:</span>
                           {report.notes || <span className="italic text-slate-400">Tidak ada catatan.</span>}
                           <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                             <MapPin size={14}/> Lokasi: {report.currentLocation}
                           </div>
                         </div>
                         
                         {report.photoUrls && report.photoUrls.length > 0 && (
                           <div className="flex gap-3 overflow-x-auto py-2">
                             {report.photoUrls.map((url: string, i: number) => (
                               <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity shadow-sm">
                                 <img src={url} alt="Bukti" className="w-full h-full object-cover" />
                               </a>
                             ))}
                           </div>
                         )}
                      </div>
                      <div className="flex items-end justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                         <button 
                           onClick={() => handleResolveReport(report.id)}
                           disabled={resolvingId === report.id}
                           className="flex items-center justify-center w-full md:w-auto gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-6 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                         >
                           {resolvingId === report.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Check size={18} />}
                           Tandai Selesai
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KONTEN TAB RIWAYAT PERBAIKAN */}
          {tab === 'Riwayat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wrench size={18} className="text-slate-400"/> Riwayat Perbaikan & Pemeliharaan</h3>
                {!asset.maintenanceHistory || asset.maintenanceHistory.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
                    <Wrench className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">Belum ada riwayat perbaikan/service.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...asset.maintenanceHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                      <div key={record.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4 hover:border-emerald-200 transition-colors">
                        <div className="h-12 w-12 shrink-0 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                          <Wrench size={20}/>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">{record.description}</h4>
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">{new Date(record.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium"><User size={14} className="text-slate-400"/> {record.technician}</span>
                            <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg"><BadgeDollarSign size={14}/> Rp {record.cost.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-0">
                  <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Plus size={18} className="text-blue-500"/> Catat Perbaikan Baru</h4>
                  <form onSubmit={handleSaveMaintenance} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Perbaikan</label>
                      <input type="date" required value={maintenanceForm.date} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Tindakan</label>
                      <textarea required value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" placeholder="Misal: Ganti komponen layar..."></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Biaya (Rp)</label>
                      <input type="number" min="0" required value={maintenanceForm.cost || ''} onChange={e => setMaintenanceForm({...maintenanceForm, cost: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Teknisi / Vendor</label>
                      <input type="text" required value={maintenanceForm.technician} onChange={e => setMaintenanceForm({...maintenanceForm, technician: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nama bengkel/orang" />
                    </div>
                    <button type="submit" disabled={isAddingMaintenance} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-blue-200 mt-4">
                      {isAddingMaintenance ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Catatan'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Komponen kecil pemanis item detail
function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <div className="truncate">
        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}