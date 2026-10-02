import React, { useState, useMemo } from 'react';
import { Booking } from '@/types';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale'; 
import { X, MapPin, Clock, User, FileText, CheckCircle2, AlertTriangle, Building, Plus, Calendar as CalendarIcon, Users, LayoutTemplate, Sparkles } from 'lucide-react';
import ModalAdminCreateBooking from './ModalAdminCreateBooking';
import { useAssets } from '@/hooks/useAssets';

// @ts-ignore
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'id': id };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface Props {
  bookings: Booking[];
}

export default function TabKalenderMaster({ bookings }: Props) {
  const { allRooms } = useAssets();
  // State untuk melihat detail modal
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

  // --- FIX: STATE UNTUK KONTROL KALENDER (Agar Toolbar Berfungsi) ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // --- STATE UNTUK FITUR ADMIN INTERVENSI ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);

  // Menangkap interaksi klik/drag di area kalender yang kosong
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setIsCreateModalOpen(true);
  };

  // Parsing data event untuk kalender
  const calendarEvents = useMemo(() => {
    return bookings
      .filter(b => b.status === 'approved' || b.status === 'completed')
      .map((b) => {
        const startStr = b.startTime ? `${b.startDate}T${b.startTime}` : `${b.startDate}T08:00:00`;
        const endStr = b.endTime ? `${b.endDate}T${b.endTime}` : `${b.endDate}T17:00:00`;
        
        return {
          id: b.id,
          title: `${b.assetName} - ${b.agency || b.userName}`,
          start: new Date(startStr),
          end: new Date(endStr),
          resource: b, 
        };
      });
  }, [bookings]);

  // Memfilter event khusus untuk bulan yang sedang dilihat di layar
  const currentMonthEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      return event.start.getMonth() === currentDate.getMonth() &&
             event.start.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [calendarEvents, currentDate]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in min-h-[850px] flex flex-col relative">
      
      {/* INJECT CUSTOM CSS FOR REACT-BIG-CALENDAR */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { 
          border-color: #f1f5f9; 
          border-radius: 1rem; 
          overflow: hidden; 
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        .rbc-header { 
          border-bottom-color: #f1f5f9 !important; 
          padding: 0.75rem 0.5rem; 
          font-weight: 700; 
          color: #64748b; 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
        }
        .rbc-day-bg + .rbc-day-bg { border-left-color: #f1f5f9; }
        .rbc-month-row + .rbc-month-row { border-top-color: #f1f5f9; }
        
        /* HIGHLIGHT TANGGAL HARI INI */
        .rbc-today { 
          background-color: #eff6ff !important; 
          box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        }
        .rbc-today .rbc-date-cell {
           font-weight: 900;
           color: #1d4ed8;
        }

        .rbc-date-cell { padding: 0.5rem; font-weight: 600; color: #334155; }
        .rbc-off-range-bg { background-color: #fbfcfd; }
        .rbc-event { cursor: pointer; transition: transform 0.1s ease; }
        .rbc-event:hover { transform: scale(1.02); z-index: 10; }
        
        /* Tambahan styling saat cursor hover di slot kosong */
        .rbc-day-slot .rbc-time-slot { cursor: crosshair; }
        .rbc-month-row .rbc-day-bg { cursor: pointer; transition: background-color 0.2s; }
        .rbc-month-row .rbc-day-bg:hover { background-color: #eff6ff; }
      `}} />

      {/* Header & Tombol Aksi */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Jadwal Pemakaian Fasilitas</h3>
          <p className="text-sm text-slate-500 mt-1">
            Klik jadwal untuk detail, atau <strong className="text-blue-600">klik pada area kosong</strong> untuk membuat jadwal manual.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-4 text-[11px] sm:text-xs font-bold bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5 text-blue-700">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div> Menunggu Bayar
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div> Selesai/Internal
            </span>
          </div>

          <button 
            onClick={() => { setSelectedSlot(null); setIsCreateModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} /> Buat Manual
          </button>
        </div>
      </div>

      {/* Area Render Kalender (Tinggi dibatasi agar List di bawahnya terlihat) */}
      <div className="h-[550px] bg-white p-1">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          culture="id"
          
          /* KONTROL STATE AGAR TOOLBAR BERFUNGSI */
          date={currentDate}
          view={currentView}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          onView={(newView) => setCurrentView(newView)}
          
          views={['month', 'week', 'day']}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => setSelectedEvent(event.resource)}
          messages={{
            next: "Maju",
            previous: "Mundur",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            noEventsInRange: "Tidak ada jadwal penyewaan di rentang waktu ini.",
            showMore: total => `+${total} jadwal lagi`
          }}
          eventPropGetter={(event) => {
            const isCompleted = event.resource.status === 'completed';
            return {
              style: {
                backgroundColor: isCompleted ? '#10b981' : '#3b82f6', 
                borderRadius: '6px',
                opacity: 0.95,
                color: 'white',
                border: 'none',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'block'
              }
            };
          }}
        />
      </div>

      {/* LIST AGENDA DINAMIS DI BAWAH KALENDER */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex-1">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={20} className="text-blue-500" />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {/* FIX TS ERROR: Casting ke (format as any) menghindari error pengecekan argumen TS saat build */}
            Agenda Bulan {(format as any)(currentDate, 'MMMM yyyy', { locale: id })}
          </h3>
        </div>

        {currentMonthEvents.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-500">Belum ada agenda/jadwal yang tercatat pada bulan ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentMonthEvents.map((ev) => (
              <div 
                key={ev.id} 
                onClick={() => setSelectedEvent(ev.resource)}
                className="bg-white border border-slate-200 p-4 rounded-2xl hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-slate-50 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    {/* FIX TS ERROR: Sama seperti di atas */}
                    {(format as any)(ev.start, 'dd MMM yyyy', { locale: id })}
                  </div>
                  {ev.resource.status === 'completed' ? (
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" title="Selesai/Lunas"></div>
                  ) : (
                     <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" title="Menunggu Pembayaran"></div>
                  )}
                </div>
                
                <h4 className="font-bold text-slate-800 text-sm mb-1.5 line-clamp-1">{ev.resource.assetName}</h4>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1 truncate">
                  <User size={12} className="shrink-0"/> {ev.resource.userName} ({ev.resource.agency || 'Personal'})
                </p>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 truncate">
                  <Clock size={12} className="shrink-0"/> {ev.resource.startTime || '08:00'} - {ev.resource.endTime || '17:00'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RENDER MODAL ADMIN INTERVENSI */}
      <ModalAdminCreateBooking 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        prefilledSlot={selectedSlot}
      />

      {/* MODAL DETAIL JADWAL (EXISTING) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Detail Jadwal</h2>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                  <Building size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Fasilitas / Ruangan</p>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{selectedEvent.assetName}</h3>
                  {(() => {
                    const r = allRooms.find(item => item.id === selectedEvent.assetId || item.name.toLowerCase() === selectedEvent.assetName.toLowerCase());
                    if (!r) return null;
                    return (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {r.capacity ? (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200/60 flex items-center gap-1">
                            <Users size={11} /> {r.capacity} Orang
                          </span>
                        ) : null}
                        {r.layout ? (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                            <LayoutTemplate size={11} /> {r.layout}
                          </span>
                        ) : null}
                        {r.location && r.location !== '-' ? (
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <MapPin size={11} /> {r.location}
                          </span>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Waktu Pelaksanaan</p>
                    <p className="text-sm font-bold text-slate-800">{selectedEvent.startDate} <span className="text-slate-400 font-medium">({selectedEvent.startTime || '08:00'} - {selectedEvent.endTime || '17:00'})</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Penyewa / Instansi</p>
                    <p className="text-sm font-bold text-slate-800">{selectedEvent.userName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{selectedEvent.agency || 'Personal'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Keperluan</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedEvent.purpose}</p>
                    {selectedEvent.adminNotes && (
                       <p className="text-[10px] italic font-medium text-blue-600 mt-2 bg-blue-50 p-1.5 rounded border border-blue-100 flex items-center gap-1.5"><AlertTriangle size={10}/> {selectedEvent.adminNotes}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-xs font-bold text-slate-500">Status Penyewaan</span>
                {selectedEvent.status === 'completed' ? (
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                    <CheckCircle2 size={14} /> Selesai / Lunas
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200">
                    <AlertTriangle size={14} /> Menunggu Bayar
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setSelectedEvent(null)} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}