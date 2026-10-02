// Lokasi file: src/app/(public)/fasilitas/components/FacilityCalendar.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Booking } from '@/types';

const locales = { 'id': idLocale };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Custom Event Card in Calendar Cell
const CustomCalendarEvent = ({ event }: any) => {
  const isApproved = event.resource.status === 'approved' || event.resource.status === 'completed';
  return (
    <div 
      className="flex items-center gap-1.5 overflow-hidden px-1.5 py-0.5" 
      title={`${event.resource.assetName} (${event.resource.startTime} - ${event.resource.endTime})`}
    >
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isApproved ? 'bg-rose-300' : 'bg-amber-300'} shadow-xs`} />
      <span className="truncate text-[10px] sm:text-[11px] font-bold leading-tight tracking-tight text-white drop-shadow-xs">
        {event.resource.startTime} · {event.resource.assetName}
      </span>
    </div>
  );
};

interface FacilityCalendarProps {
  bookings: Booking[];
  loading: boolean;
}

export default function FacilityCalendar({ bookings, loading }: FacilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

  // Extract unique room names for filter dropdown
  const roomNames = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      if (b.assetName) set.add(b.assetName);
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Filter events based on room selection
  const filteredBookings = useMemo(() => {
    if (selectedRoom === 'all') return bookings;
    return bookings.filter(b => b.assetName === selectedRoom);
  }, [bookings, selectedRoom]);

  const calendarEvents = useMemo(() => {
    return filteredBookings.map((b: Booking) => {
      const startStr = b.startTime ? `${b.startDate}T${b.startTime}` : `${b.startDate}T08:00:00`;
      const endStr = b.endTime ? `${b.endDate}T${b.endTime}` : `${b.endDate}T17:00:00`;
      return {
        id: b.id, 
        title: b.assetName,
        start: new Date(startStr), 
        end: new Date(endStr), 
        resource: b,
      };
    });
  }, [filteredBookings]);

  // Toolbar Handlers
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const nextDate = new Date(currentDate);
    if (action === 'TODAY') {
      setCurrentDate(new Date());
    } else if (action === 'PREV') {
      if (currentView === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
      else if (currentView === 'week') nextDate.setDate(nextDate.getDate() - 7);
      else nextDate.setDate(nextDate.getDate() - 1);
      setCurrentDate(nextDate);
    } else if (action === 'NEXT') {
      if (currentView === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (currentView === 'week') nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setDate(nextDate.getDate() + 1);
      setCurrentDate(nextDate);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-4 sm:p-7 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 min-h-[750px] md:min-h-[850px] flex flex-col relative overflow-hidden mt-6"
    >
      {/* Custom Modern CSS Override for React-Big-Calendar */}
      <style dangerouslySetInnerHTML={{__html: `
        .facility-calendar .rbc-month-view, 
        .facility-calendar .rbc-time-view, 
        .facility-calendar .rbc-agenda-view { 
          border: 1px solid #f1f5f9; 
          border-radius: 1.5rem; 
          overflow: hidden; 
          background-color: #ffffff;
        }
        .facility-calendar .rbc-header { 
          border-bottom: 1px solid #f1f5f9 !important; 
          padding: 0.75rem 0.5rem; 
          font-weight: 800; 
          color: #64748b; 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
          background-color: #f8fafc;
        }
        .facility-calendar .rbc-header + .rbc-header {
          border-left: 1px solid #f1f5f9;
        }
        .facility-calendar .rbc-day-bg + .rbc-day-bg { 
          border-left: 1px solid #f8fafc; 
        }
        .facility-calendar .rbc-month-row + .rbc-month-row { 
          border-top: 1px solid #f1f5f9; 
        }
        .facility-calendar .rbc-today { 
          background-color: #f0f9ff !important; 
        }
        .facility-calendar .rbc-today .rbc-date-cell {
          font-weight: 900;
          color: #0284c7;
        }
        .facility-calendar .rbc-date-cell { 
          padding: 0.5rem; 
          font-weight: 700; 
          font-size: 0.75rem; 
          color: #334155; 
        }
        .facility-calendar .rbc-off-range-bg { 
          background-color: #fafbfc; 
        }
        .facility-calendar .rbc-off-range .rbc-date-cell { 
          color: #cbd5e1; 
        }
        .facility-calendar .rbc-event { 
          cursor: pointer; 
          transition: all 0.2s ease;
          border-radius: 8px !important;
          border: 0 !important;
          padding: 2px 4px !important;
        }
        .facility-calendar .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
        }
        .facility-calendar .rbc-show-more {
          font-size: 0.7rem;
          font-weight: 800;
          color: #0284c7;
          background: #e0f2fe;
          padding: 2px 6px;
          border-radius: 9999px;
          margin-top: 2px;
        }
        .facility-calendar .rbc-toolbar {
          display: none; /* Kita gunakan custom toolbar elegan di bawah */
        }
      `}} />

      {/* --- 1. HEADER & CUSTOM TOOLBAR ELEGAN --- */}
      <div className="mb-6 space-y-4">
        
        {/* Baris Atas: Judul & Status Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                Kalender Ketersediaan
              </span>
              <span className="text-xs font-medium text-slate-400">
                Live Sinkronisasi
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Jadwal Peminjaman Ruangan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Pantau jadwal terkonfirmasi secara real-time untuk memilih waktu luang yang tepat.
            </p>
          </div>

          {/* Status Indicator Legend */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs animate-pulse" />
              <span>Terjadwal / Terisi</span>
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
              <span>Slot Kosong (Bebas Pesan)</span>
            </Badge>
          </div>
        </div>

        {/* Baris Bawah: Navigasi Bulan, Filter Ruangan & View Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          
          {/* Navigasi Bulan / Minggu */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate('TODAY')}
              className="rounded-full text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 h-9"
            >
              Hari Ini
            </Button>
            
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleNavigate('PREV')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('NEXT')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all"
                aria-label="Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-800 ml-1.5 capitalize tracking-tight">
              {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h4>
          </div>

          {/* Filter Ruangan & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Ruangan */}
            {roomNames.length > 0 && (
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full sm:w-auto h-9 pl-8 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
                >
                  <option value="all">Semua Ruangan ({bookings.length})</option>
                  {roomNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* View Selector (Bulan / Minggu / Hari) */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/60 text-xs font-bold">
              {(['month', 'week', 'day'] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCurrentView(v)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    currentView === v 
                      ? 'bg-white text-sky-700 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {v === 'month' ? 'Bulan' : v === 'week' ? 'Minggu' : 'Hari'}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl">
          <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mb-3" />
          <p className="font-bold text-slate-700 text-xs tracking-wider uppercase">
            Menyinkronkan Kalender Kawasan...
          </p>
        </div>
      )}

      {/* --- 2. KALENDER BODY --- */}
      <div className="flex-1 min-h-[500px] facility-calendar">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          culture="id"
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          view={currentView}
          onView={(newView) => setCurrentView(newView)}
          views={['month', 'week', 'day']}
          popup={true}
          onSelectEvent={(event) => setSelectedEvent(event.resource)}
          components={{ event: CustomCalendarEvent }}
          messages={{
            next: "Maju", previous: "Mundur", today: "Hari Ini",
            month: "Bulan", week: "Minggu", day: "Hari", agenda: "Agenda",
            noEventsInRange: "Semua ruangan tersedia pada rentang waktu ini.",
            showMore: total => `+${total} agenda`
          }}
          eventPropGetter={(event) => ({
            style: {
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }
          })}
        />
      </div>

      {/* --- 3. MODAL DETAIL EVENT KLIK KALENDER --- */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
              <DialogTitle className="sr-only">Rincian Jadwal {selectedEvent.assetName}</DialogTitle>

              {/* Header Modal */}
              <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white relative">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                    Jadwal Terkonfirmasi
                  </Badge>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h3 className="text-xl font-black mt-3 text-white leading-tight">
                  {selectedEvent.assetName}
                </h3>
                <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-1.5">
                  <Building2 size={13} /> Kawasan Solo Technopark
                </p>
              </div>

              {/* Isi Rincian */}
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Waktu Penggunaan</span>
                    <span className="font-extrabold text-slate-800 flex items-center gap-1">
                      <Clock size={12} className="text-sky-600" />
                      {selectedEvent.startTime || '08:00'} - {selectedEvent.endTime || '17:00'} WIB
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Rentang Tanggal</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <CalendarIcon size={12} className="text-indigo-600" />
                      {selectedEvent.startDate} s.d. {selectedEvent.endDate}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-[11px]">
                    <Info size={13} className="text-amber-600" /> Slot Tidak Tersedia
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                    Ruangan ini sudah dipesan untuk agenda tersebut. Anda dapat memilih tanggal atau jam lain yang masih kosong.
                  </p>
                </div>

                <Button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Tutup Rincian
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

    </motion.div>
  );
}