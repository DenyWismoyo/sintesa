// Lokasi file: src/app/admin/tenant/components/ModalFormTenant.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Building2, User, Phone, Activity, Calendar, LayoutGrid, ShieldCheck, Handshake, Target, Key, RefreshCw, Copy, Check, Mail } from 'lucide-react';
import { Tenant } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Tenant>, logoFile: File | null, docFile: File | null) => Promise<void>;
  initialData?: Tenant | null;
}

export default function ModalFormTenant({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '', sector: 'Teknologi Informasi', segment: 'StartUp', ownerName: '', contact: '', email: '', accessCode: '',
    status: 'Aktif', pipelineStage: 'Pra-Inkubasi', joinedAt: new Date().toISOString().split('T')[0], programName: '', mentor: '', source: 'Website STP', isVerified: false,
    isRaising: false, fundingStage: 'Bootstrapped', elevatorPitch: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialData, 
        segment: initialData.segment || 'StartUp', 
        pipelineStage: initialData.pipelineStage || 'Pra-Inkubasi', 
        mentor: initialData.mentor || '', 
        source: initialData.source || 'Website STP',
        isVerified: initialData.isVerified || false,
        isRaising: initialData.isRaising || false,
        fundingStage: initialData.fundingStage || 'Bootstrapped',
        elevatorPitch: initialData.elevatorPitch || ''
      });
    } else {
      setFormData({ 
        name: '', sector: 'Teknologi Informasi', segment: 'StartUp', ownerName: '', contact: '', email: '', accessCode: '',
        status: 'Aktif', pipelineStage: 'Pra-Inkubasi', joinedAt: new Date().toISOString().split('T')[0], 
        programName: '', mentor: '', source: 'Website STP', isVerified: false,
        isRaising: false, fundingStage: 'Bootstrapped', elevatorPitch: ''
      });
    }
  }, [initialData, isOpen]);

  // FUNGSI UNTUK GENERATE KODE AKSES OTOMATIS
  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "SNT-";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, accessCode: code }));
  };

  // FUNGSI UNTUK MENYALIN KREDENSIAL KE CLIPBOARD (SIAP KIRIM VIA WA)
  const handleCopyCredentials = () => {
    const textToCopy = `Halo Tim ${formData.name || 'Startup'},\n\nBerikut adalah Kredensial Akses untuk masuk ke Portal Inkubator SINTESA:\n\n🌐 URL Portal: ${window.location.origin}/login\n\n📌 Opsi 1 (Untuk Founder/PIC):\nLogin menggunakan akun Google dengan email: ${formData.email || '(Belum disetel)'}\n\n📌 Opsi 2 (Untuk Tim/Anggota Lain):\nLogin menggunakan Kode Akses: ${formData.accessCode || '(Kode belum di-generate)'}\n\nHarap simpan informasi ini dengan baik. Terima kasih.`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData, null, null);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {initialData ? 'Edit Data Registrasi' : 'Registrasi Tenant Baru'}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Buat cangkang akun. Startup terkait akan melengkapi profilnya sendiri.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* BODY FORM */}
        <form id="tenant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
          
          {/* SECTION KREDENSIAL */}
          <div className="bg-blue-600 p-6 rounded-3xl relative overflow-hidden group shadow-lg shadow-blue-200 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 relative z-10 gap-3">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><Key className="w-4 h-4" /> Kredensial Akses Startup</h3>
              
              <div className="flex gap-2">
                <button type="button" onClick={handleGenerateCode} className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                  <RefreshCw size={12} /> Auto-Generate Kode
                </button>
                <button type="button" onClick={handleCopyCredentials} className="text-[10px] font-bold bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
                  {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} {isCopied ? 'Tersalin!' : 'Salin Data'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {/* OPSI 1: EMAIL FOUNDER */}
              <div className="bg-blue-700/50 rounded-xl p-4 border border-blue-500">
                 <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2 flex items-center gap-1"><Mail size={12} /> Email (Login Founder/Google)</p>
                 <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-blue-800/50 px-3 py-2 rounded-lg text-sm font-bold outline-none border border-transparent focus:border-blue-400 placeholder-blue-400/50" placeholder="founder@startup.com" />
              </div>

              {/* OPSI 2: KODE AKSES */}
              <div className="bg-blue-700/50 rounded-xl p-4 border border-blue-500">
                 <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2 flex items-center gap-1"><Key size={12} /> Kode Akses (Login Tim)</p>
                 <input type="text" value={formData.accessCode || ''} onChange={(e) => setFormData({...formData, accessCode: e.target.value})} className="w-full bg-blue-800/50 px-3 py-2 rounded-lg text-lg font-black tracking-widest uppercase outline-none border border-transparent focus:border-blue-400 placeholder-blue-400/50" placeholder="SNT-XXXXX" />
              </div>
            </div>
            
            <p className="text-[10px] text-blue-200 relative z-10 mt-3 flex items-start gap-1.5 bg-blue-800/30 p-2 rounded-lg">
              <span className="font-bold shrink-0">💡 TIPS:</span> Founder bisa menggunakan Email untuk login via tombol Google, sementara anggota tim lainnya cukup menggunakan Kode Akses tanpa perlu email/password.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2 border-b border-slate-100 pb-3 uppercase tracking-widest"><Building2 className="w-4 h-4 text-slate-400" /> Identitas Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Nama Startup / Brand *</label>
                <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Cth: GoTech Solutions" />
              </div>
              <div>
                <label className={labelClass}>Segmentasi Pelanggan (BMC) *</label>
                <select value={formData.segment || 'StartUp'} onChange={(e) => setFormData({...formData, segment: e.target.value as any})} className={`${inputClass} font-bold cursor-pointer`}>
                  <option value="StartUp">StartUp Teknologi</option>
                  <option value="UMKM">UMKM / IKM</option>
                  <option value="Koperasi">Koperasi</option>
                  <option value="Kampus">Perguruan Tinggi / Riset</option>
                  <option value="Industri">Mitra Industri (Korporasi)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Sektor Bisnis Utama *</label>
                <input type="text" required value={formData.sector || 'Teknologi Informasi'} onChange={(e) => setFormData({...formData, sector: e.target.value})} className={`${inputClass} font-bold`} />
              </div>
              <div>
                <label className={`${labelClass} flex items-center gap-1.5`}><User size={14} className="text-slate-400"/> Nama Founder / PIC *</label>
                <input type="text" required value={formData.ownerName || ''} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} className={inputClass} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className={`${labelClass} flex items-center gap-1.5`}><Phone size={14} className="text-slate-400"/> No. WhatsApp *</label>
                <input type="tel" required value={formData.contact || ''} onChange={(e) => setFormData({...formData, contact: e.target.value})} className={inputClass} placeholder="08123456789" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2 border-b border-slate-100 pb-3 uppercase tracking-widest"><Activity className="w-4 h-4 text-emerald-500" /> Data Pembinaan KST</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className={`${labelClass} text-indigo-800 flex items-center gap-1.5`}><LayoutGrid size={14}/> Posisi Pipeline Kanban Inkubasi *</label>
                <select value={formData.pipelineStage || 'Pra-Inkubasi'} onChange={(e) => setFormData({...formData, pipelineStage: e.target.value as any})} className={`${inputClass} font-black cursor-pointer bg-white text-indigo-700 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500`}>
                  <option value="Pra-Inkubasi">1. Pra-Inkubasi (Seleksi)</option>
                  <option value="Validasi Ide">2. Validasi Ide Bisnis</option>
                  <option value="Pengembangan Produk">3. Pengembangan Produk / MVP</option>
                  <option value="Go-To-Market">4. Go-To-Market (Komersialisasi)</option>
                  <option value="Alumni">5. Lulus / Alumni Inkubator</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Status Akun Tenant *</label>
                <select value={formData.status || 'Aktif'} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className={`${inputClass} font-bold cursor-pointer bg-slate-50`}>
                  <option value="Aktif">🚀 Tenant Aktif</option>
                  <option value="Alumni">🎓 Lulus / Alumni</option>
                  <option value="Non-aktif">⏸️ Non-Aktif / Batal</option>
                </select>
              </div>
              
              <div>
                <label className={`${labelClass} flex items-center gap-1.5`}><Calendar size={14} className="text-slate-400"/> Tanggal Bergabung *</label>
                <input type="date" required value={formData.joinedAt || ''} onChange={(e) => setFormData({...formData, joinedAt: e.target.value})} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Mentor Penanggung Jawab</label>
                <input type="text" value={formData.mentor || ''} onChange={(e) => setFormData({...formData, mentor: e.target.value})} className={inputClass} placeholder="Nama Mentor Ahli" />
              </div>
              
              <div>
                <label className={labelClass}>Sumber Akuisisi (Channel)</label>
                <select value={formData.source || 'Website STP'} onChange={(e) => setFormData({...formData, source: e.target.value})} className={`${inputClass} cursor-pointer`}>
                  <option value="Website STP">Website STP / Incubator</option>
                  <option value="Event/Roadshow">Event & Roadshow</option>
                  <option value="Kanal Pemkot">Kanal Pemerintah Kota</option>
                  <option value="Komunitas">Rekomendasi Komunitas/Asosiasi</option>
                  <option value="Pendaftaran Mandiri">Pendaftaran Mandiri</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Asal Batch / Program Pembinaan</label>
                <input type="text" value={formData.programName || ''} onChange={(e) => setFormData({...formData, programName: e.target.value})} className={inputClass} placeholder="Contoh: Batch 1 Pra-Inkubasi 2024" />
              </div>

              <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={formData.isVerified || false}
                  onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div>
                  <label htmlFor="isVerified" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-500" /> Verifikasi Startup (Verified by KST Solo)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">Tampilkan centang biru (verified badge) di profil publik ekosistem untuk startup ini.</p>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2 mb-2 border-b border-indigo-100 pb-3 uppercase tracking-widest"><Handshake className="w-4 h-4 text-indigo-500" /> Business Matching & Pendanaan</h3>
            
            <div className="bg-indigo-100/50 p-4 rounded-xl border border-indigo-200 flex items-center gap-4">
              <input
                type="checkbox"
                id="isRaising"
                checked={formData.isRaising || false}
                onChange={(e) => setFormData({...formData, isRaising: e.target.checked})}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
              <div>
                <label htmlFor="isRaising" className="block text-sm font-bold text-indigo-900 cursor-pointer flex items-center gap-2">
                  Sedang Mencari Pendanaan (Fundraising)
                </label>
                <p className="text-xs text-indigo-700/70 mt-0.5">Jika dicentang, startup ini akan muncul di halaman Business Matching Board untuk dilihat investor.</p>
              </div>
            </div>

            {formData.isRaising && (
              <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className={`${labelClass} flex items-center gap-1.5`}><Target size={14}/> Target Pendanaan (Funding Stage)</label>
                  <select value={formData.fundingStage || 'Bootstrapped'} onChange={(e) => setFormData({...formData, fundingStage: e.target.value as any})} className={`${inputClass} font-bold cursor-pointer border-indigo-200`}>
                    <option value="Bootstrapped">Bootstrapped</option>
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B+">Series B+</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Elevator Pitch (Deskripsi Singkat untuk Investor)</label>
                  <textarea 
                    rows={3}
                    value={formData.elevatorPitch || ''} 
                    onChange={(e) => setFormData({...formData, elevatorPitch: e.target.value})} 
                    className={`${inputClass} resize-none border-indigo-200`} 
                    placeholder="Tuliskan 1-2 kalimat menarik yang mendeskripsikan startup ini kepada investor..." 
                  />
                </div>
              </div>
            )}
          </div>

        </form>

        <div className="px-8 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-[24px]">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Batal</button>
          <button type="submit" form="tenant-form" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70 transition-all">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/> Memproses...</> : (initialData ? 'Simpan Perubahan' : 'Daftarkan Startup')}
          </button>
        </div>

      </div>
    </div>
  );
}