import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Booking } from '@/types';

const locales = { 'id': idLocale };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CustomCalendarEvent = ({ event }: any) => {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden px-1" title={`${event.resource.assetName} (${event.resource.startTime} - ${event.resource.endTime})`}>
      <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
      <span className="truncate text-[10px] font-bold leading-tight drop-shadow-sm">
        {event.resource.startTime} - {event.resource.assetName}
      </span>
    </div>
  );
};

interface FacilityCalendarProps {
  bookings: Booking[];
  loading: boolean;
}

export default function FacilityCalendar({ bookings, loading }: FacilityCalendarProps) {
  const calendarEvents = bookings.map((b: Booking) => {
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

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 md:p-8 rounded-3xl shadow-lg border border-slate-100 h-[700px] md:h-[850px] flex flex-col relative overflow-hidden mt-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Kalender Ketersediaan Ruangan</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Cek jadwal yang sudah dibooking sebelum Anda melakukan pengajuan.</p>
        </div>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shrink-0 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm animate-pulse"></div> Blokir / Telah Dipesan
        </Badge>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
           <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
           <p className="font-bold text-slate-700 text-sm tracking-wide">Menyinkronkan Jadwal Live...</p>
        </div>
      )}

      <div className="flex-1 min-h-0 bg-slate-50 p-2 md:p-4 rounded-2xl border border-slate-100 calendar-container shadow-inner">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          culture="id"
          views={['month', 'week', 'day']}
          defaultView="month"
          popup={true} 
          components={{ event: CustomCalendarEvent }}
          messages={{
            next: "Maju", previous: "Mundur", today: "Hari Ini",
            month: "Bulan", week: "Minggu", day: "Hari", agenda: "Agenda",
            noEventsInRange: "Semua ruangan kosong di rentang waktu ini. Silakan pesan!",
            showMore: total => `+${total} pesanan` 
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: '#e11d48',
              borderRadius: '6px', opacity: 0.95, color: 'white',
              border: 'none', padding: '3px 6px', boxShadow: '0 2px 4px rgba(225,29,72,0.2)'
            }
          })}
        />
      </div>
    </motion.div>
  );
}