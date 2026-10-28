// Lokasi file: src/app/(admin)/booking/components/TabKalenderMaster.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Booking } from '@/types';
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
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  LayoutTemplate, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Briefcase,
  Search,
  Layers,
  SlidersHorizontal,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  CalendarDays,
  ListFilter,
  DollarSign
} from 'lucide-react';
import ModalAdminCreateBooking from './ModalAdminCreateBooking';
import { useAssets } from '@/hooks/useAssets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  bookings: Booking[];
}

type CalendarViewMode = 'month' | 'week' | 'agenda';
type EventFilterType = 'all' | 'b2b' | 'regular' | 'survey';
type StatusFilterType = 'all' | 'pending' | 'completed';

export default function TabKalenderMaster({ bookings }: Props) {
  const { allRooms } = useAssets();

  // State Kontrol Kalender
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  
  // State Filter
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilterType>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  // State Modal Detail & Intervensi Admin
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // 1. Ekstraksi daftar ruangan unik untuk filter
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

  // 2. Filter data bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Filter status
      if (filterStatus === 'pending' && b.status !== 'pending' && b.status !== 'approved') return false;
      if (filterStatus === 'completed' && b.status !== 'completed') return false;

      // Filter tipe kegiatan
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
  }, [bookings, filterStatus, filterType, selectedRoom]);

  // 3. Helper cek event pada tanggal tertentu
  const getEventsForDate = (date: Date): Booking[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredBookings.filter(b => isBookingActiveOnDate(b, dateStr));
  };

  // 4. Hari-hari bulan kalender (Mulai Senin)
  const monthDays = useMemo(() => {
    return getCalendarMonthDays(currentDate);
  }, [currentDate]);

  // 5. 7 Hari untuk Week View
  const weekDays = useMemo(() => {
    return getCalendarWeekDays(currentDate);
  }, [currentDate]);

  // 6. Agenda bulan aktif untuk section list di bawah
  const currentMonthEvents = useMemo(() => {
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

  // Toolbar Handlers
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

  // Menangani klik tanggal kosong oleh Admin untuk membuat booking langsung
  const handleDaySlotClick = (date: Date) => {
    setSelectedSlot({ start: date, end: date });
    setIsCreateModalOpen(true);
  };

  // Salin info kontak PIC
  const handleCopyPicContact = (ev: Booking) => {
    const text = `${ev.userName} (${ev.agency || 'Personal'})\nTelp: ${ev.userPhone}\nEmail: ${ev.userEmail}`;
    navigator.clipboard.writeText(text);
    toast.success('Kontak PIC Disalin ke Clipboard');
  };

  return (
    <div className="bg-white p-5 sm:p-7 md:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in min-h-[850px] flex flex-col relative">
      
      {/* --- 1. HEADER & CONTROLS ADMIN --- */}
      <div className="mb-6 space-y-4">
        
        {/* Baris Atas: Judul, Info dan Tombol Buat Manual */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-blue-600" />
                Kalender Master Fasilitas
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Total Terdata: {bookings.length} Agenda
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Manajemen Okupansi & Peminjaman Ruangan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Klik jadwal untuk detail, atau <strong className="text-blue-600">klik pada tanggal/area kosong</strong> untuk menjadwalkan manual secara instan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Status Legend Mini */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-xs" /> Paket B2B
              </span>
              <span className="flex items-center gap-1.5 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" /> Reguler
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Survey
              </span>
            </div>

            <Button
              onClick={() => { setSelectedSlot(null); setIsCreateModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs h-10 px-4.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Buat Jadwal Manual
            </Button>
          </div>
        </div>

        {/* Baris Bawah: Navigasi Bulan, Filter Kategori, Filter Ruangan & View Selector */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-1">
          
          {/* Navigasi Bulan */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate('TODAY')}
              className="rounded-full text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 h-9 cursor-pointer"
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

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Filter Kategori Kegiatan */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EventFilterType)}
                className="h-9 pl-7 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="all">Semua Tipe Agenda</option>
                <option value="b2b">💼 Paket B2B & Acara</option>
                <option value="regular">🏛️ Sewa Reguler</option>
                <option value="survey">🔍 Jadwal Survey Lokasi</option>
              </select>
              <ListFilter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Status Tagihan */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilterType)}
                className="h-9 pl-7 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Bayar</option>
                <option value="completed">Selesai / Lunas</option>
              </select>
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Ruangan */}
            {roomNames.length > 0 && (
              <div className="relative">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="h-9 pl-7 pr-8 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                >
                  <option value="all">Semua Ruangan ({roomNames.length})</option>
                  {roomNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <Building size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* View Selector */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/80 text-xs font-bold">
              {(['month', 'week', 'agenda'] as CalendarViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    viewMode === v 
                      ? 'bg-white text-blue-700 shadow-xs font-black' 
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

      {/* --- 2. GRID KALENDER CUSTOM ADMIN --- */}
      <div className="flex-1 flex flex-col">
        
        {/* VIEW 1: BULAN */}
        {viewMode === 'month' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-2xs">
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
                      if (!hasEvents) {
                        handleDaySlotClick(day);
                      }
                    }}
                    className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-all group relative cursor-pointer ${
                      isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/70 text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Header Sel: Tanggal & Aksi Cepat Tambah */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs sm:text-sm font-bold flex items-center justify-center rounded-full transition-colors ${
                          isTodayDate 
                            ? 'w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-200' 
                            : isCurrentMonth ? 'text-slate-700 group-hover:text-blue-700' : 'text-slate-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Tombol kecil tambah saat hover di tanggal kosong */}
                      {!hasEvents && isCurrentMonth && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDaySlotClick(day);
                          }}
                          title="Klik untuk jadwalkan manual"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      )}
                    </div>

                    {/* Event Chips List */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const isB2B = ev.bookingType === 'B2B_PACKAGE';
                        const isSurvey = Boolean(ev.isSurveyRequested && ev.preferredSurveyDate === dateKey);
                        const isCompleted = ev.status === 'completed';

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold truncate flex items-center gap-1 shadow-2xs hover:scale-[1.02] transition-all cursor-pointer ${
                              isB2B
                                ? 'bg-indigo-600 text-white'
                                : isSurvey
                                ? 'bg-amber-500 text-white'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                            title={`${ev.assetName} - ${ev.agency || ev.userName} (${ev.startTime || '08:00'} - ${ev.endTime || '17:00'})`}
                          >
                            {isB2B ? (
                              <Briefcase size={10} className="shrink-0" />
                            ) : isSurvey ? (
                              <Search size={10} className="shrink-0" />
                            ) : (
                              <Building size={10} className="shrink-0" />
                            )}
                            <span className="truncate">
                              {isB2B 
                                ? `B2B: ${ev.agency || ev.userName}` 
                                : isSurvey 
                                ? `Survey: ${ev.agency || ev.userName}` 
                                : `${ev.assetName} · ${ev.agency || ev.userName}`}
                            </span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(dayEvents[0]);
                          }}
                          className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-center cursor-pointer"
                        >
                          +{dayEvents.length - 3} agenda lagi
                        </div>
                      )}
                    </div>

                    {/* Hint saat kosong */}
                    {!hasEvents && isCurrentMonth && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-semibold text-slate-400 flex items-center gap-0.5 pt-0.5">
                        <Plus size={9} /> Slot Kosong
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: MINGGU */}
        {viewMode === 'week' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {weekDays.map((day: Date) => {
                const dayEvents = getEventsForDate(day);
                const isTodayDate = isToday(day);
                const dateKey = format(day, 'yyyy-MM-dd');

                return (
                  <div key={dateKey} className="p-3.5 min-h-[420px] flex flex-col bg-white">
                    <div className="border-b border-slate-100 pb-2.5 mb-3 text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {formatDateId(day, 'EEEE')}
                      </p>
                      <div className={`mt-1 inline-flex items-center justify-center text-sm font-black rounded-full px-2.5 py-0.5 ${
                        isTodayDate ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200' : 'text-slate-800'
                      }`}>
                        {formatDateId(day, 'd MMM')}
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayEvents.length === 0 ? (
                        <div 
                          onClick={() => handleDaySlotClick(day)}
                          className="h-full flex flex-col items-center justify-center p-3 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-slate-400 hover:bg-blue-50/50 hover:border-blue-200 hover:text-blue-600 transition-all cursor-pointer group"
                        >
                          <Plus size={20} className="mb-1 text-slate-300 group-hover:text-blue-500" />
                          <span className="text-xs font-bold">Slot Kosong</span>
                          <span className="text-[10px]">Klik untuk pesan</span>
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
                                  ? 'bg-indigo-50/90 border-indigo-200 hover:border-indigo-300'
                                  : isSurvey
                                  ? 'bg-amber-50/90 border-amber-200 hover:border-amber-300'
                                  : 'bg-blue-50/90 border-blue-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isB2B 
                                    ? 'bg-indigo-600 text-white' 
                                    : isSurvey 
                                    ? 'bg-amber-600 text-white' 
                                    : 'bg-blue-600 text-white'
                                }`}>
                                  {isB2B ? 'B2B' : isSurvey ? 'Survey' : 'Reguler'}
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

        {/* VIEW 3: DAFTAR AGENDA BULANAN */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {currentMonthEvents.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Agenda Pada Bulan Ini</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh slot dan ruangan tercatat bebas peminjaman.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {currentMonthEvents.map((ev) => {
                  const isB2B = ev.bookingType === 'B2B_PACKAGE';
                  const isCompleted = ev.status === 'completed';

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isB2B
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {isB2B ? '💼 Paket B2B' : '🏛️ Sewa Reguler'}
                          </Badge>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isCompleted ? 'Lunas / Selesai' : 'Menunggu Bayar'}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                          {ev.assetName}
                        </h4>
                        
                        <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5 truncate">
                          <User size={12} className="text-slate-400 shrink-0" />
                          {ev.userName} ({ev.agency || 'Personal'})
                        </p>

                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          {ev.startTime || '08:00'} - {ev.endTime || '17:00'} WIB
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <CalendarIcon size={12} className="text-blue-600" />
                          {ev.startDate}
                        </span>
                        <span className="font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                          Detail →
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

      {/* --- 3. LIST AGENDA DETAIL BULAN AKTIF (DI BAWAH KALENDER GRID) --- */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex-1">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-600" />
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Agenda Terdata Bulan {formatDateId(currentDate, 'MMMM yyyy')}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {currentMonthEvents.length} Acara
          </span>
        </div>

        {currentMonthEvents.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-500">Belum ada agenda yang tercatat pada bulan ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentMonthEvents.map((ev) => {
              const isB2B = ev.bookingType === 'B2B_PACKAGE';
              const isCompleted = ev.status === 'completed';

              return (
                <div 
                  key={ev.id} 
                  onClick={() => setSelectedEvent(ev)}
                  className="bg-white border border-slate-200 p-4.5 rounded-2xl hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-slate-50 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                        <CalendarIcon size={12} className="text-slate-400 group-hover:text-blue-500" />
                        {ev.startDate}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isB2B && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-black uppercase">
                            B2B
                          </Badge>
                        )}
                        {isCompleted ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" title="Selesai/Lunas" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" title="Menunggu Pembayaran" />
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                      {ev.assetName}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1 truncate">
                      <User size={12} className="shrink-0 text-slate-400"/> {ev.userName} ({ev.agency || 'Personal'})
                    </p>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 truncate">
                      <Clock size={12} className="shrink-0 text-slate-400"/> {ev.startTime || '08:00'} - {ev.endTime || '17:00'} WIB
                    </p>

                    {/* Info Paket B2B Rooms */}
                    {isB2B && ev.packageRooms && ev.packageRooms.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                        <Layers size={11} /> {ev.packageRooms.length} Ruangan Termasuk Paket
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Keperluan: <strong className="text-slate-700 font-semibold">{ev.purpose || '-'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- 4. RENDER MODAL ADMIN INTERVENSI CREATE BOOKING --- */}
      <ModalAdminCreateBooking 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        prefilledSlot={selectedSlot}
      />

      {/* --- 5. MODAL DETAIL JADWAL ADMIN --- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto">
            
            {/* Header Modal */}
            <div className={`flex justify-between items-start px-4 py-3.5 sm:px-6 sm:py-5 text-white shrink-0 ${
              selectedEvent.bookingType === 'B2B_PACKAGE' 
                ? 'bg-gradient-to-r from-indigo-700 to-violet-800' 
                : 'bg-gradient-to-r from-slate-900 to-blue-950'
            }`}>
              <div>
                <Badge className="bg-white/20 text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
                  {selectedEvent.bookingType === 'B2B_PACKAGE' ? '💼 Paket Acara Korporat & B2B' : '🏛️ Peminjaman Fasilitas Reguler'}
                </Badge>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {selectedEvent.assetName}
                </h2>
                <p className="text-[11px] sm:text-xs text-sky-100 mt-1 flex items-center gap-1.5">
                  <Building size={12} /> Kawasan Solo Technopark
                </p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="text-white/80 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
              
              {/* Box Spesifikasi Ruangan dari Master Asset jika ada */}
              {(() => {
                const r = allRooms.find(item => item.id === selectedEvent.assetId || item.name.toLowerCase() === selectedEvent.assetName.toLowerCase());
                if (!r) return null;
                return (
                  <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                    {r.capacity ? (
                      <span className="text-[11px] bg-white text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200/60 flex items-center gap-1 shadow-2xs">
                        <Users size={12} /> Kapasitas: {r.capacity} Orang
                      </span>
                    ) : null}
                    {r.layout ? (
                      <span className="text-[11px] bg-white text-amber-700 font-bold px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1 shadow-2xs">
                        <LayoutTemplate size={12} /> {r.layout}
                      </span>
                    ) : null}
                    {r.location && r.location !== '-' ? (
                      <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <MapPin size={12} className="text-slate-400" /> {r.location}
                      </span>
                    ) : null}
                  </div>
                );
              })()}

              {/* Box Rincian Waktu & Pelaksanaan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu & Periode Sewa</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {selectedEvent.startDate === selectedEvent.endDate 
                        ? selectedEvent.startDate 
                        : `${selectedEvent.startDate} s.d. ${selectedEvent.endDate}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      Pukul {selectedEvent.startTime || '08:00'} - {selectedEvent.endTime || '17:00'} WIB
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                  <User size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyewa / Penyelenggara</p>
                      <button
                        onClick={() => handleCopyPicContact(selectedEvent)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={11} /> Salin Kontak
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedEvent.userName}</p>
                    <p className="text-xs font-medium text-slate-500">{selectedEvent.agency || 'Personal'}</p>
                    
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-slate-600">
                      {selectedEvent.userPhone && (
                        <a 
                          href={`https://wa.me/${selectedEvent.userPhone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-700 hover:underline"
                        >
                          <Phone size={12} /> {selectedEvent.userPhone}
                        </a>
                      )}
                      {selectedEvent.userEmail && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail size={12} /> {selectedEvent.userEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                  <FileText size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keperluan Acara</p>
                    <p className="text-xs font-medium text-slate-800 mt-0.5 leading-relaxed">
                      {selectedEvent.purpose}
                    </p>
                    {selectedEvent.adminNotes && (
                      <p className="text-[11px] font-medium text-blue-700 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="shrink-0" /> {selectedEvent.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rincian Paket B2B Rooms (jika ada) */}
              {selectedEvent.packageRooms && selectedEvent.packageRooms.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider flex items-center gap-1.5">
                    <Layers size={13} /> Seluruh Ruangan Dalam Paket ({selectedEvent.packageRooms.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedEvent.packageRooms.map((r, i) => (
                      <span key={i} className="bg-white border border-indigo-200 text-indigo-900 font-bold text-xs px-2.5 py-1 rounded-lg shadow-2xs">
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rincian Fasilitas Teknis Add-ons (jika ada) */}
              {selectedEvent.packageAddons && selectedEvent.packageAddons.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={13} /> Fasilitas Teknis / Perlengkapan Terpilih
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedEvent.packageAddons.map((ad, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1 rounded-lg">
                        {ad.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permohonan Survey Fisik (jika ada) */}
              {selectedEvent.isSurveyRequested && selectedEvent.preferredSurveyDate && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5">
                  <Search size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">Permohonan Kunjungan & Survey Lokasi</p>
                    <p className="text-[11px] text-amber-800">
                      Dijadwalkan pada: <strong>{selectedEvent.preferredSurveyDate}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Status Penyewaan & Tagihan */}
              <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <span className="text-xs font-bold text-slate-500">Status Reservasi</span>
                {selectedEvent.status === 'completed' ? (
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                    <CheckCircle2 size={14} /> Selesai / Lunas
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">
                    <AlertTriangle size={14} /> Menunggu Verifikasi / Bayar
                  </span>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedEvent(null)}
                className="rounded-full text-xs font-bold border-slate-200 cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}