// Lokasi file: src/app/(public)/fasilitas/components/FacilityCalendar.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { 
  formatDateId,
  getCalendarMonthDays,
  getCalendarWeekDays,
  isBookingActiveOnDate,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  format
} from '@/utils/calendarUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Info,
  Briefcase,
  Search,
  Users,
  Layers,
  ArrowRight,
  CalendarDays,
  ListFilter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Booking } from '@/types';

interface FacilityCalendarProps {
  bookings: Booking[];
  loading: boolean;
  onSelectBookingDate?: (dateStr: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';
type EventFilterType = 'all' | 'b2b' | 'regular' | 'survey';

export default function FacilityCalendar({ bookings, loading, onSelectBookingDate }: FacilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  
  // State Dialog Rincian
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: Booking[] } | null>(null);

  // 1. Ekstraksi nama ruangan unik untuk dropdown filter
  const roomNames = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      if (b.assetName) set.add(b.assetName);
      if (b.packageRooms && Array.isArray(b.packageRooms)) {
        b.packageRooms.forEach(r => {
          if (r.name) set.add(r.name);
        });
      }
    });
    return Array.from(set).sort();
  }, [bookings]);

  // 2. Filter bookings berdasarkan ruangan dan tipe kegiatan
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Filter tipe
      if (filterType === 'b2b' && b.bookingType !== 'B2B_PACKAGE') return false;
      if (filterType === 'regular' && b.bookingType && b.bookingType !== 'REGULAR') return false;
      if (filterType === 'survey' && (!b.isSurveyRequested || !b.preferredSurveyDate)) return false;

      // Filter ruangan
      if (selectedRoom !== 'all') {
        const matchMainRoom = b.assetName === selectedRoom;
        const matchPackageRoom = b.packageRooms?.some(r => r.name === selectedRoom);
        if (!matchMainRoom && !matchPackageRoom) return false;
      }

      return true;
    });
  }, [bookings, filterType, selectedRoom]);

  // 3. Helper untuk mengecek event pada tanggal tertentu
  const getEventsForDate = (date: Date): Booking[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredBookings.filter(b => isBookingActiveOnDate(b, dateStr));
  };

  // 4. Kalkulasi hari-hari kalender bulanan (Mulai Senin)
  const monthDays = useMemo(() => {
    return getCalendarMonthDays(currentDate);
  }, [currentDate]);

  // 5. Kalkulasi 7 hari untuk Week View
  const weekDays = useMemo(() => {
    return getCalendarWeekDays(currentDate);
  }, [currentDate]);

  // 6. Agenda list untuk bulan aktif
  const monthAgenda = useMemo(() => {
    const monthStartStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    return filteredBookings
      .filter(b => {
        const inMonth = (b.startDate <= monthEndStr && b.endDate >= monthStartStr) ||
          (Boolean(b.preferredSurveyDate && b.preferredSurveyDate >= monthStartStr && b.preferredSurveyDate <= monthEndStr));
        return inMonth;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredBookings, currentDate]);

  // Navigasi Toolbar
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'TODAY') {
      setCurrentDate(new Date());
    } else if (action === 'PREV') {
      if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
      else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
      else setCurrentDate(subMonths(currentDate, 1));
    } else if (action === 'NEXT') {
      if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
      else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
      else setCurrentDate(addMonths(currentDate, 1));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-4 sm:p-7 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 min-h-[750px] flex flex-col relative overflow-hidden mt-6"
    >
      {/* --- 1. HEADER & CUSTOM TOOLBAR ELEGAN --- */}
      <div className="mb-6 space-y-4">
        
        {/* Baris Atas: Judul & Status Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-sky-600" />
                Kalender Ketersediaan Real-Time
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sinkronisasi
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Jadwal Peminjaman & Okupansi Ruangan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Pantau jadwal terkonfirmasi secara transparan untuk menentukan slot waktu dan ruangan terbaik bagi agenda Anda.
            </p>
          </div>

          {/* Status Indicator Legend */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-xs" />
              <span>Paket Acara B2B</span>
            </Badge>
            <Badge variant="outline" className="bg-sky-50/80 text-sky-700 border-sky-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs" />
              <span>Sewa Reguler</span>
            </Badge>
            <Badge variant="outline" className="bg-amber-50/80 text-amber-700 border-amber-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
              <span>Survey Lokasi</span>
            </Badge>
            <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700 border-emerald-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
              <span>Slot Bebas Pesan</span>
            </Badge>
          </div>
        </div>

        {/* Baris Bawah: Navigasi Bulan, Filter Kategori, Filter Ruangan & View Selector */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-1">
          
          {/* Navigasi Bulan / Minggu */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate('TODAY')}
              className="rounded-full text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 h-9 shadow-2xs cursor-pointer"
            >
              Hari Ini
            </Button>
            
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-full border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleNavigate('PREV')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all cursor-pointer"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('NEXT')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all cursor-pointer"
                aria-label="Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-800 ml-1.5 capitalize tracking-tight min-w-[160px]">
              {formatDateId(currentDate, 'MMMM yyyy')}
            </h4>
          </div>

          {/* Filter Ruangan, Filter Tipe & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Filter Tipe Kegiatan */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EventFilterType)}
                className="h-9 pl-7 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="b2b">💼 Paket B2B & Acara</option>
                <option value="regular">🏛️ Sewa Reguler</option>
                <option value="survey">🔍 Jadwal Survey</option>
              </select>
              <ListFilter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Ruangan */}
            {roomNames.length > 0 && (
              <div className="relative">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="h-9 pl-7 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
                >
                  <option value="all">Semua Ruangan ({roomNames.length})</option>
                  {roomNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* View Selector (Bulan / Minggu / Agenda) */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/80 text-xs font-bold">
              {(['month', 'week', 'agenda'] as CalendarViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                    viewMode === v 
                      ? 'bg-white text-sky-800 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {v === 'month' ? 'Bulan' : v === 'week' ? 'Minggu' : 'Daftar Agenda'}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl">
          <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mb-3" />
          <p className="font-bold text-slate-700 text-xs tracking-wider uppercase">
            Menyinkronkan Kalender Kawasan...
          </p>
        </div>
      )}

      {/* --- 2. KALENDER BODY CUSTOM --- */}
      <div className="flex-1 flex flex-col">
        
        {/* VIEW 1: BULAN (MONTH GRID) */}
        {viewMode === 'month' && (
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/50 shadow-2xs">
            {/* Header 7 Hari */}
            <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center font-black text-[11px] sm:text-xs text-slate-600 uppercase tracking-wider py-2.5">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, idx) => (
                <div key={dayName} className={`${idx >= 5 ? 'text-rose-500' : 'text-slate-600'}`}>
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid Sel Kalender (35-42 kotak) */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200/60 gap-[1px]">
              {monthDays.map((day: Date) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const dayEvents = getEventsForDate(day);
                const hasEvents = dayEvents.length > 0;
                const dateKey = format(day, 'yyyy-MM-dd');

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      if (hasEvents) {
                        setSelectedDayEvents({ date: day, events: dayEvents });
                      } else if (onSelectBookingDate) {
                        onSelectBookingDate(dateKey);
                      }
                    }}
                    className={`min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-all group relative cursor-pointer ${
                      isCurrentMonth ? 'bg-white hover:bg-sky-50/30' : 'bg-slate-50/70 text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Header Sel: Nomor Tanggal & Indikator */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs sm:text-sm font-bold flex items-center justify-center rounded-full transition-colors ${
                          isTodayDate 
                            ? 'w-6 h-6 sm:w-7 sm:h-7 bg-sky-600 text-white font-black shadow-xs ring-2 ring-sky-200' 
                            : isCurrentMonth ? 'text-slate-700 group-hover:text-sky-700' : 'text-slate-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Status Spot Slot Bebas */}
                      {!hasEvents && isCurrentMonth && (
                        <span 
                          title="Slot Tersedia — Bebas Pesan"
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 group-hover:scale-125 transition-transform" 
                        />
                      )}
                    </div>

                    {/* Event List Chips di Sel */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const isB2B = ev.bookingType === 'B2B_PACKAGE';
                        const isSurvey = Boolean(ev.isSurveyRequested && ev.preferredSurveyDate === dateKey);
                        
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold truncate flex items-center gap-1 shadow-2xs hover:scale-[1.02] transition-all cursor-pointer ${
                              isB2B
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                                : isSurvey
                                ? 'bg-amber-500 text-white'
                                : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white'
                            }`}
                            title={`${ev.assetName} (${ev.startTime || '08:00'} - ${ev.endTime || '17:00'})`}
                          >
                            {isB2B ? (
                              <Briefcase size={10} className="shrink-0" />
                            ) : isSurvey ? (
                              <Search size={10} className="shrink-0" />
                            ) : (
                              <Building2 size={10} className="shrink-0" />
                            )}
                            <span className="truncate">
                              {isB2B 
                                ? `B2B: ${ev.agency || ev.userName}` 
                                : isSurvey 
                                ? `Survey: ${ev.agency || ev.userName}` 
                                : ev.assetName}
                            </span>
                          </div>
                        );
                      })}

                      {/* Indikator sisa event (+N lagi) */}
                      {dayEvents.length > 2 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayEvents({ date: day, events: dayEvents });
                          }}
                          className="text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded text-center transition-colors cursor-pointer"
                        >
                          +{dayEvents.length - 2} agenda lagi
                        </div>
                      )}
                    </div>

                    {/* Tooltip subtle slot kosong saat hover */}
                    {!hasEvents && isCurrentMonth && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                        <CheckCircle2 size={10} /> Bebas Pesan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: MINGGU (WEEK VIEW) */}
        {viewMode === 'week' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {weekDays.map((day: Date) => {
                const dayEvents = getEventsForDate(day);
                const isTodayDate = isToday(day);
                const dateKey = format(day, 'yyyy-MM-dd');

                return (
                  <div key={dateKey} className="p-3.5 min-h-[400px] flex flex-col bg-white">
                    {/* Header Hari */}
                    <div className="border-b border-slate-100 pb-2.5 mb-3 text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {formatDateId(day, 'EEEE')}
                      </p>
                      <div className={`mt-1 inline-flex items-center justify-center text-sm font-black rounded-full px-2.5 py-0.5 ${
                        isTodayDate ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-200' : 'text-slate-800'
                      }`}>
                        {formatDateId(day, 'd MMM')}
                      </div>
                    </div>

                    {/* List Event Hari Tersebut */}
                    <div className="space-y-2 flex-1">
                      {dayEvents.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-3 text-center rounded-xl bg-emerald-50/40 border border-dashed border-emerald-200/60 text-emerald-700">
                          <CheckCircle2 size={18} className="text-emerald-500 mb-1" />
                          <span className="text-xs font-bold">Slot Bebas</span>
                          <span className="text-[10px] text-emerald-600">Seluruh ruangan tersedia</span>
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const isB2B = ev.bookingType === 'B2B_PACKAGE';
                          const isSurvey = Boolean(ev.isSurveyRequested && ev.preferredSurveyDate === dateKey);

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                                isB2B
                                  ? 'bg-indigo-50/80 border-indigo-200 hover:border-indigo-300'
                                  : isSurvey
                                  ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
                                  : 'bg-sky-50/80 border-sky-200 hover:border-sky-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isB2B 
                                    ? 'bg-indigo-600 text-white' 
                                    : isSurvey 
                                    ? 'bg-amber-600 text-white' 
                                    : 'bg-sky-600 text-white'
                                }`}>
                                  {isB2B ? 'Paket B2B' : isSurvey ? 'Survey' : 'Reguler'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <Clock size={10} /> {ev.startTime || '08:00'}
                                </span>
                              </div>
                              <h5 className="font-bold text-xs text-slate-800 line-clamp-1">
                                {ev.assetName}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {ev.agency || ev.userName}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: DAFTAR AGENDA (AGENDA VIEW) */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {monthAgenda.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Agenda Terkonfirmasi</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Seluruh ruangan dan fasilitas di Solo Technopark masih bebas dipesan untuk bulan ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {monthAgenda.map((ev) => {
                  const isB2B = ev.bookingType === 'B2B_PACKAGE';
                  const isSurvey = Boolean(ev.isSurveyRequested && ev.preferredSurveyDate);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isB2B
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isSurvey
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {isB2B ? '💼 Paket B2B & Acara' : isSurvey ? '🔍 Kunjungan Survey' : '🏛️ Sewa Reguler'}
                          </Badge>

                          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                            <Clock size={11} className="text-slate-400" />
                            {ev.startTime || '08:00'} - {ev.endTime || '17:00'} WIB
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-800 group-hover:text-sky-700 transition-colors">
                          {ev.assetName}
                        </h4>
                        
                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                          <Users size={12} className="text-slate-400 shrink-0" />
                          <span>Instansi: <strong>{ev.agency || ev.userName}</strong></span>
                        </p>

                        {/* Jika B2B, tampilkan multi-ruang jika ada */}
                        {isB2B && ev.packageRooms && ev.packageRooms.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Layers size={10} /> {ev.packageRooms.length} Ruangan Termasuk
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <CalendarIcon size={12} className="text-indigo-600" />
                          {ev.startDate === ev.endDate 
                            ? ev.startDate 
                            : `${ev.startDate} s.d. ${ev.endDate}`}
                        </span>
                        <span className="font-bold text-sky-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Lihat Rincian <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- 3. MODAL DETAIL HARI TERPILIH (POP-UP TANGGAL) --- */}
      <AnimatePresence>
        {selectedDayEvents && (
          <Dialog open={!!selectedDayEvents} onOpenChange={() => setSelectedDayEvents(null)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
              <DialogTitle className="sr-only">Agenda Tanggal {formatDateId(selectedDayEvents.date, 'dd MMMM yyyy')}</DialogTitle>

              <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-6 text-white relative">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                    Daftar Agenda Harian
                  </Badge>
                  <button 
                    onClick={() => setSelectedDayEvents(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">
                  {formatDateId(selectedDayEvents.date, 'EEEE, dd MMMM yyyy')}
                </h3>
                <p className="text-xs text-sky-200 mt-1">
                  Terdapat {selectedDayEvents.events.length} agenda terkonfirmasi pada tanggal ini.
                </p>
              </div>

              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedDayEvents.events.map((ev) => {
                  const isB2B = ev.bookingType === 'B2B_PACKAGE';
                  return (
                    <div 
                      key={ev.id}
                      onClick={() => {
                        setSelectedDayEvents(null);
                        setSelectedEvent(ev);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isB2B ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {isB2B ? 'Paket B2B' : 'Sewa Reguler'}
                        </span>
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Clock size={11} className="text-sky-600" />
                          {ev.startTime || '08:00'} - {ev.endTime || '17:00'} WIB
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-700">
                        {ev.assetName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {ev.agency || ev.userName}
                      </p>
                    </div>
                  );
                })}

                <Button
                  onClick={() => setSelectedDayEvents(null)}
                  className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs mt-2 cursor-pointer"
                >
                  Tutup Daftar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* --- 4. MODAL DETAIL EVENT KLIK KALENDER --- */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
              <DialogTitle className="sr-only">Rincian Jadwal {selectedEvent.assetName}</DialogTitle>

              {/* Header Modal */}
              <div className={`p-6 text-white relative ${
                selectedEvent.bookingType === 'B2B_PACKAGE'
                  ? 'bg-gradient-to-r from-indigo-700 to-violet-800'
                  : 'bg-gradient-to-r from-sky-600 to-blue-700'
              }`}>
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                    {selectedEvent.bookingType === 'B2B_PACKAGE' ? '💼 Paket Acara Korporat & B2B' : '🏛️ Sewa Fasilitas Terkonfirmasi'}
                  </Badge>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mt-3 text-white leading-tight">
                  {selectedEvent.assetName}
                </h3>
                <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-1.5">
                  <Building2 size={13} /> Kawasan Solo Technopark
                </p>
              </div>

              {/* Isi Rincian */}
              <div className="p-6 space-y-4 text-xs">
                
                {/* Waktu & Tanggal */}
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
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Instansi / Penyelenggara</span>
                    <span className="font-bold text-slate-800">
                      {selectedEvent.agency || selectedEvent.userName}
                    </span>
                  </div>
                </div>

                {/* Rincian Tambahan Khusus Paket B2B */}
                {selectedEvent.bookingType === 'B2B_PACKAGE' && selectedEvent.packageRooms && selectedEvent.packageRooms.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                    <span className="text-indigo-800 font-black uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Layers size={12} /> Ruangan Yang Termasuk Dalam Paket ({selectedEvent.packageRooms.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedEvent.packageRooms.map((r, i) => (
                        <span key={i} className="bg-white border border-indigo-200 text-indigo-900 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-2xs">
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons Fasilitas Teknis Jika Ada */}
                {selectedEvent.packageAddons && selectedEvent.packageAddons.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      Fasilitas Teknis Terpasang
                    </span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {selectedEvent.packageAddons.map((ad, i) => (
                        <span key={i} className="bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded-md">
                          {ad.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan Ketersediaan */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-[11px]">
                    <Info size={13} className="text-amber-600" /> Slot Tidak Tersedia
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                    Fasilitas ini sudah terkonfirmasi untuk agenda tersebut. Anda dapat memilih tanggal atau ruangan lain yang masih tersedia.
                  </p>
                </div>

                <Button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
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