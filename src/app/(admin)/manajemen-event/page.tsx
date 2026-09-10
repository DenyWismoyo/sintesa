'use client';

import React, { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { eventService } from '@/services/event.service';
import { AppEvent } from '@/types';
import { 
  Plus, Edit, Trash2, Search, Calendar, 
  MapPin, Loader2, Image as ImageIcon, CheckCircle, XCircle,
  AlignLeft, Ticket, Settings, Users, Globe, ShieldAlert
} from 'lucide-react';

export default function ManajemenEventPage() {
  const { events, loading, error, addEvent, updateEvent, removeEvent } = useEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'BASIC' | 'CONTENT' | 'TICKETING' | 'SETTINGS'>('BASIC');

  const [formData, setFormData] = useState<Partial<AppEvent>>({
    title: '', date: '', time: '', location: '', type: 'Seminar',
    description: '', isOnline: false, meetingUrl: '', status: 'Draft',
    registrationType: 'INTERNAL',
    speakers: [], agendas: [], sponsors: [],
    ticketingTiers: [], customRegistrationFields: [],
    displaySettings: { showSpeakers: true, showAgenda: true, showSponsors: true },
    isPublished: true, isFree: true, price: 0
  });

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (evt?: AppEvent) => {
    if (evt) {
      setEditingId(evt.id || null);
      setFormData({
        title: evt.title, date: evt.date, time: evt.time, location: evt.location, type: evt.type,
        description: evt.description || '', isOnline: evt.isOnline || false, meetingUrl: evt.meetingUrl || '',
        status: evt.status || 'Draft', registrationType: evt.registrationType || 'INTERNAL', registrationUrl: evt.registrationUrl || '',
        speakers: evt.speakers || [], agendas: evt.agendas || [], sponsors: evt.sponsors || [],
        ticketingTiers: evt.ticketingTiers || [], customRegistrationFields: evt.customRegistrationFields || [],
        displaySettings: evt.displaySettings || { showSpeakers: true, showAgenda: true, showSponsors: true },
        isPublished: evt.isPublished, isFree: evt.isFree ?? true, price: evt.price || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', date: '', time: '', location: '', type: 'Seminar',
        description: '', isOnline: false, meetingUrl: '', status: 'Draft', registrationType: 'INTERNAL',
        speakers: [], agendas: [], sponsors: [], ticketingTiers: [], customRegistrationFields: [],
        displaySettings: { showSpeakers: true, showAgenda: true, showSponsors: true },
        isPublished: true, isFree: true, price: 0
      });
    }
    setImageFile(null);
    setActiveTab('BASIC');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await updateEvent(editingId, formData as AppEvent, imageFile);
      } else {
        await addEvent(formData as AppEvent, imageFile);
      }
      handleCloseModal();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus event "${title}"?`)) {
      await removeEvent(id);
    }
  };

  const addSpeaker = () => setFormData({ ...formData, speakers: [...(formData.speakers || []), { name: '', role: '', company: '' }] });
  const updateSpeaker = (idx: number, field: string, val: string) => {
    const newArr = [...(formData.speakers || [])];
    newArr[idx] = { ...newArr[idx], [field]: val };
    setFormData({ ...formData, speakers: newArr });
  };
  const removeSpeaker = (idx: number) => {
    const newArr = [...(formData.speakers || [])];
    newArr.splice(idx, 1);
    setFormData({ ...formData, speakers: newArr });
  };

  const addTicketTier = () => setFormData({ ...formData, ticketingTiers: [...(formData.ticketingTiers || []), { id: Date.now().toString(), name: '', price: 0, targetAudience: 'ALL' }] });
  const updateTicketTier = (idx: number, field: string, val: any) => {
    const newArr = [...(formData.ticketingTiers || [])];
    newArr[idx] = { ...newArr[idx], [field]: val };
    setFormData({ ...formData, ticketingTiers: newArr });
  };
  const removeTicketTier = (idx: number) => {
    const newArr = [...(formData.ticketingTiers || [])];
    newArr.splice(idx, 1);
    setFormData({ ...formData, ticketingTiers: newArr });
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Event & Acara</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola dan desain publikasi event secara Hyper-Dynamic.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-200 transition-colors"
          >
            <Plus size={18} /> Buat Event Baru
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2"><ShieldAlert size={18}/> {error}</div>}
      
      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama event atau lokasi..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors" 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Detail Event</th>
                <th className="px-6 py-4">Jadwal & Lokasi</th>
                <th className="px-6 py-4">Ticketing</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-16 text-center text-slate-500"><Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={28} />Memuat data event...</td></tr>
              ) : filteredEvents.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-slate-500 font-medium">Belum ada data event yang ditambahkan.</td></tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {evt.imageUrl ? (
                          <img src={evt.imageUrl} alt={evt.title} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm"><ImageIcon size={20} /></div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{evt.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">{evt.type}</span>
                            {evt.isOnline && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider">Online</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-500" /> {evt.date} • {evt.time}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-500" /> {evt.isOnline ? 'Platform Virtual' : evt.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {evt.registrationType === 'EXTERNAL' ? 'Via Platform Luar' : `${evt.ticketingTiers?.length || 0} Tier Tiket`}
                        </span>
                        {evt.registrationType === 'INTERNAL' && (evt.ticketingTiers?.length === 0) && (
                           <span className={`text-[10px] font-bold mt-1 ${evt.isFree ? 'text-emerald-600' : 'text-orange-600'}`}>
                             {evt.isFree ? 'GRATIS (Legacy)' : `Rp ${evt.price?.toLocaleString('id-ID')} (Legacy)`}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
                          evt.status === 'Completed' ? 'bg-slate-50 border-slate-200 text-slate-600' :
                          evt.status === 'Ongoing' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          evt.status === 'Upcoming' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {evt.status || 'DRAFT'}
                        </span>
                        {!evt.isPublished && <span className="text-[10px] text-red-600 font-bold flex items-center gap-1"><ShieldAlert size={12}/> Hidden</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(evt)} className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all shadow-sm" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(evt.id!, evt.title)} className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM BUILDER (WIZARD) - Redesigned */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Event Setup' : 'Event Builder Baru'}</h3>
                <p className="text-sm text-slate-500 mt-0.5">Mode Hyper-Dynamic. Konfigurasi semua aspek acara.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><XCircle size={24} /></button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-50/50">
              {/* Sidebar Navigation */}
              <div className="w-full md:w-64 bg-white border-r border-slate-100 p-6 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
                <button type="button" onClick={() => setActiveTab('BASIC')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'BASIC' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'}`}>
                  <AlignLeft size={18} /> Basic Info
                </button>
                <button type="button" onClick={() => setActiveTab('CONTENT')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'CONTENT' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'}`}>
                  <Users size={18} /> Konten & Acara
                </button>
                <button type="button" onClick={() => setActiveTab('TICKETING')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'TICKETING' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'}`}>
                  <Ticket size={18} /> Ticketing & Form
                </button>
                <button type="button" onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'}`}>
                  <Settings size={18} /> Pengaturan
                </button>
              </div>

              {/* Main Content Area */}
              <form id="eventForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {/* TAB 1: BASIC INFO */}
                {activeTab === 'BASIC' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl">
                    <h4 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-6">Informasi Dasar Acara</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Event *</label>
                        <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="Cth: AI Summit 2026" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal *</label>
                        <input required type="text" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={inputClass} placeholder="Cth: 15 Maret 2026" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Waktu *</label>
                        <input required type="text" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className={inputClass} placeholder="Cth: 09:00 - 15:00 WIB" />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi Fisik *</label>
                        <input required={!formData.isOnline} type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className={inputClass} placeholder="Cth: Auditorium STP" disabled={formData.isOnline} />
                        <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit">
                          <input type="checkbox" checked={formData.isOnline} onChange={(e) => setFormData({...formData, isOnline: e.target.checked, location: e.target.checked ? 'Online' : ''})} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition-colors" />
                          <span className="text-sm font-bold text-slate-700">Event ini 100% Online (Virtual)</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Event *</label>
                        <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className={inputClass}>
                          <option value="Seminar">Seminar</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Hackathon">Hackathon</option>
                          <option value="Networking">Networking</option>
                          <option value="Exhibition">Exhibition / Pameran</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Poster/Cover Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={`${inputClass} !p-1.5 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer`} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONTENT & SPEAKERS */}
                {activeTab === 'CONTENT' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl">
                    <h4 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-6">Deskripsi & Pembicara</h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Lengkap (HTML/Markdown Ready)</label>
                      <textarea rows={6} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`${inputClass} resize-y`} placeholder="Ceritakan detail event, objektif, dan manfaat bagi peserta..."></textarea>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-5">
                        <label className="block text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest"><Users size={16} className="text-blue-500"/> Daftar Pembicara / Mentor</label>
                        <button type="button" onClick={addSpeaker} className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-sm"><Plus size={14}/> Tambah</button>
                      </div>
                      
                      {(!formData.speakers || formData.speakers.length === 0) && <p className="text-sm text-slate-400 italic text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">Belum ada pembicara ditambahkan.</p>}
                      
                      <div className="space-y-3">
                        {formData.speakers?.map((spk, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <input type="text" placeholder="Nama Lengkap" value={spk.name} onChange={(e) => updateSpeaker(idx, 'name', e.target.value)} className="w-full sm:flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <input type="text" placeholder="Jabatan (Role)" value={spk.role} onChange={(e) => updateSpeaker(idx, 'role', e.target.value)} className="w-full sm:flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <input type="text" placeholder="Asal Instansi" value={spk.company} onChange={(e) => updateSpeaker(idx, 'company', e.target.value)} className="w-full sm:flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <button type="button" onClick={() => removeSpeaker(idx)} className="p-2.5 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TICKETING & FORM */}
                {activeTab === 'TICKETING' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl">
                    <h4 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-6">Registrasi & Tiket</h4>
                    
                    <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
                      <label className="block text-sm font-bold text-indigo-900 mb-3">Metode Registrasi Pendaftar</label>
                      <select value={formData.registrationType} onChange={(e) => setFormData({...formData, registrationType: e.target.value as any})} className="w-full md:w-1/2 px-4 py-3 border border-indigo-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 bg-white outline-none">
                        <option value="INTERNAL">Sistem Internal (Gunakan Form & Ticketing STP)</option>
                        <option value="EXTERNAL">Platform Eksternal (Loket.com, Eventbrite, GForm)</option>
                      </select>

                      {formData.registrationType === 'EXTERNAL' && (
                         <div className="mt-5 animate-in slide-in-from-top-2">
                           <label className="block text-xs font-bold text-indigo-800 mb-1.5 flex items-center gap-1.5"><Globe size={14}/> Link Registrasi Eksternal</label>
                           <input type="url" value={formData.registrationUrl || ''} onChange={(e) => setFormData({...formData, registrationUrl: e.target.value})} className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                         </div>
                      )}
                    </div>

                    {formData.registrationType === 'INTERNAL' && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <label className="block text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest"><Ticket size={16} className="text-amber-500"/> Tier Tiket (Multi-Pricing)</label>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Buat jenis tiket berbeda (Misal: VIP, Regular, Khusus Tenant)</p>
                          </div>
                          <button type="button" onClick={addTicketTier} className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-sm"><Plus size={14}/> Tambah</button>
                        </div>
                        
                        {(!formData.ticketingTiers || formData.ticketingTiers.length === 0) && (
                          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-xs font-bold border border-amber-200 mb-4 flex items-center gap-2">
                            <ShieldAlert size={16} /> Belum ada tiket. Sistem akan menganggap event ini GRATIS secara *Legacy Mode*.
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          {formData.ticketingTiers?.map((tier, idx) => (
                            <div key={tier.id} className="grid grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
                              <div className="col-span-12 md:col-span-3">
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nama Tiket</label>
                                <input type="text" placeholder="Cth: Early Bird" value={tier.name} onChange={(e) => updateTicketTier(idx, 'name', e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                              </div>
                              <div className="col-span-12 md:col-span-3">
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Harga (Rp)</label>
                                <input type="number" placeholder="0 = Gratis" value={tier.price} onChange={(e) => updateTicketTier(idx, 'price', Number(e.target.value))} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                              </div>
                              <div className="col-span-12 md:col-span-2">
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Kuota</label>
                                <input type="number" placeholder="Tak terbatas" value={tier.quota || ''} onChange={(e) => updateTicketTier(idx, 'quota', Number(e.target.value))} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center" />
                              </div>
                              <div className="col-span-12 md:col-span-3">
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Audiens</label>
                                <select value={tier.targetAudience} onChange={(e) => updateTicketTier(idx, 'targetAudience', e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                  <option value="ALL">Terbuka Umum</option>
                                  <option value="TENANT_ONLY">Khusus Tenant</option>
                                </select>
                              </div>
                              <div className="col-span-12 md:col-span-1 flex justify-end md:mt-5">
                                <button type="button" onClick={() => removeTicketTier(idx)} className="p-2.5 text-slate-400 bg-white border border-slate-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SETTINGS */}
                {activeTab === 'SETTINGS' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl">
                    <h4 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-6">Status & Pengaturan Publikasi</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-800">Status Operasional Event</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Draft">DRAFT (Persiapan)</option>
                          <option value="Upcoming">UPCOMING (Pendaftaran Dibuka)</option>
                          <option value="Ongoing">ONGOING (Sedang Berlangsung)</option>
                          <option value="Completed">COMPLETED (Selesai)</option>
                          <option value="Cancelled">CANCELLED (Dibatalkan)</option>
                        </select>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">Mengubah status ke <b>"Completed"</b> akan otomatis mematikan tombol pendaftaran di web publik dan memunculkan galeri kegiatan (jika tersedia).</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-800">Tampilan Halaman Publik</label>
                        
                        <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                          <input type="checkbox" checked={formData.displaySettings?.showSpeakers} onChange={(e) => setFormData({...formData, displaySettings: {...formData.displaySettings!, showSpeakers: e.target.checked}})} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
                          <span className="text-sm font-bold text-slate-700">Tampilkan Profil Pembicara</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                          <input type="checkbox" checked={formData.displaySettings?.showAgenda} onChange={(e) => setFormData({...formData, displaySettings: {...formData.displaySettings!, showAgenda: e.target.checked}})} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
                          <span className="text-sm font-bold text-slate-700">Tampilkan Rundown Acara</span>
                        </label>
                        
                        <label className="flex items-center justify-between gap-3 cursor-pointer bg-blue-50 p-4 rounded-xl border border-blue-200 mt-4 shadow-sm">
                          <span className="text-sm font-black text-blue-900">Publikasikan Event (Live)</span>
                          <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({...formData, isPublished: e.target.checked})} className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-6 h-6" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-[24px]">
              <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Batalkan</button>
              <button type="submit" form="eventForm" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} 
                {isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi Event'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}