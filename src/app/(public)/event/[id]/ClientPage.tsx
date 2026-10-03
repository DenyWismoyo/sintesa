// Lokasi: src/app/(public)/event/[id]/ClientPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppEvent } from '@/types/ecosystem.types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Monitor, 
  Users, 
  Ticket, 
  CalendarPlus, 
  Download, 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Building2,
  Linkedin,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionContainer from '@/components/ui/SectionContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { SocialShareBar } from '@/components/common/SocialShareBar';
import { StickyActionBar } from '@/components/common/StickyActionBar';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { toast } from 'sonner';

interface EventDetailClientProps {
  eventId: string;
  initialEvent: AppEvent | null;
}

export default function EventDetailClient({ eventId, initialEvent }: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<AppEvent | null>(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEvent) {
      const fetchEvent = async () => {
        try {
          const docRef = doc(db, 'events', eventId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setEvent({ id: snap.id, ...snap.data() } as AppEvent);
          }
        } catch (err) {
          console.error('Gagal mengambil detail event:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [eventId, initialEvent]);

  if (loading) {
    return (
      <SectionContainer accent="violet">
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Memuat detail agenda event...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!event) {
    return (
      <SectionContainer accent="violet">
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <Calendar size={48} className="text-slate-300 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-slate-900">Event Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Agenda acara yang Anda cari mungkin telah berakhir atau tautan tidak valid.</p>
          <Link
            href="/event"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft size={14} /> Kembali ke Daftar Event
          </Link>
        </div>
      </SectionContainer>
    );
  }

  // --- HELPER GOOGLE CALENDAR & .ICS EXPORT ---
  const formatCalendarDate = (dateStr: string, timeStr?: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
      return d.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "Z";
    } catch {
      return new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
    }
  };

  const handleAddToGoogleCalendar = () => {
    const startTime = formatCalendarDate(event.date, event.time);
    const endTime = formatCalendarDate(event.endDate || event.date, event.time);
    const details = encodeURIComponent(`${event.description || ''}\n\nDiselenggarakan oleh: Solo Technopark\nInfo lengkap: ${typeof window !== 'undefined' ? window.location.href : ''}`);
    const location = encodeURIComponent(event.isOnline ? 'Platform Virtual (Online)' : event.location || 'Solo Technopark');
    const title = encodeURIComponent(event.title);

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(gcalUrl, '_blank');
  };

  const handleDownloadIcs = () => {
    const startTime = formatCalendarDate(event.date, event.time);
    const endTime = formatCalendarDate(event.endDate || event.date, event.time);
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Solo Technopark//SINTESA Event//ID',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.isOnline ? 'Virtual' : (event.location || 'Solo Technopark')}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.slug || 'event-solotechnopark'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File kalender (.ics) berhasil diunduh');
  };

  const isOngoing = event.status === 'Ongoing';
  const isCompleted = event.status === 'Completed';

    return (
      <SectionContainer accent="violet" width="default" className="pb-24 sm:pb-12">
        <div className="py-4 sm:py-8 space-y-6 sm:space-y-8">

          {/* --- 1. BREADCRUMB & BACK BUTTON --- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <Breadcrumbs 
              items={[
                { label: 'Agenda Event', href: '/event' },
                { label: event.type || 'Event', href: `/event?tipe=${encodeURIComponent(event.type || '')}` },
                { label: event.title, active: true }
              ]} 
            />

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/event"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft size={13} /> Semua Event
              </Link>
              <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                {event.type}
              </Badge>
            </div>
          </div>

        {/* --- 2. HERO COVER & EVENT HEADER --- */}
        <div className="bg-white -mx-4 sm:mx-0 rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/80 shadow-none sm:shadow-xs overflow-hidden">
          {/* Cover Image / Gradient - YouTube 16:9 Ratio */}
          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 flex items-center justify-center">
                <Sparkles size={64} className="text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            
            <div className="absolute top-4 left-4 flex gap-2">
              {isOngoing && <StatusBadge status="SEDANG BERLANGSUNG" variant="danger" pulse={true} size="sm" />}
              {event.status === 'Upcoming' && <StatusBadge status="SEGERA HADIR" variant="warning" size="sm" />}
              {isCompleted && <StatusBadge status="TELAH SELESAI" variant="default" size="sm" />}
            </div>
          </div>

          {/* Main Title & Action Bar */}
          <div className="p-4 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {event.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {event.description || 'Pusat agenda inovasi, seminar, dan networking teknologi di ekosistem Solo Technopark.'}
                </p>
              </div>

              {/* Countdown Timer Widget */}
              {!isCompleted && event.date && (
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
                  <CountdownTimer targetDate={event.date} label="Acara Dimulai Dalam" />
                </div>
              )}
            </div>

            {/* Meta Key Facts Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal & Waktu</span>
                  <span className="text-xs font-bold text-slate-800">{event.date} · {event.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${event.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {event.isOnline ? <Monitor size={18} /> : <MapPin size={18} />}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tempat Pelaksanaan</span>
                  <span className="text-xs font-bold text-slate-800 truncate block max-w-[200px]">
                    {event.isOnline ? 'Platform Virtual (Online)' : (event.location || 'Solo Technopark')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Ticket size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tiket Masuk</span>
                  <span className="text-xs font-bold text-slate-800">
                    {event.isFree ? 'Gratis (Registrasi Terbuka)' : (event.price ? `Rp ${event.price.toLocaleString('id-ID')}` : 'Tier Tiket')}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Share & Calendar Sync Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <SocialShareBar title={event.title} description={event.description} />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToGoogleCalendar}
                  className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                  title="Simpan ke Google Calendar"
                >
                  <CalendarPlus size={14} className="text-blue-600" />
                  <span>Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                  title="Unduh file kalender .ics"
                >
                  <Download size={14} className="text-slate-600" />
                  <span>Unduh .ics</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* --- 3. TWO-COLUMN LAYOUT: CONTENT & REGISTRATION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Speakers & Rundown Agenda */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SPEAKERS SECTION */}
            {event.speakers && event.speakers.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Narasumber</span>
                    <h3 className="text-xl font-black text-slate-900">Pembicara & Praktisi Terkemuka</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {event.speakers.length} Tokoh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((sp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-xs">
                        {sp.photoUrl ? (
                          <img src={sp.photoUrl} alt={sp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-violet-100 text-violet-700">
                            {sp.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{sp.name}</h4>
                        <p className="text-xs text-slate-600 truncate">{sp.role}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate">{sp.company}</p>
                      </div>
                      {sp.linkedinUrl && (
                        <a 
                          href={sp.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="LinkedIn Profil"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AGENDA / RUNDOWN TIMELINE */}
            {event.agendas && event.agendas.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Rundown</span>
                  <h3 className="text-xl font-black text-slate-900">Agenda Sesi Acara</h3>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                  {event.agendas.map((ag, idx) => (
                    <div key={idx} className="relative pl-6">
                      <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-violet-600 border-2 border-white shadow-xs" />
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-violet-700 mb-1">
                          <Clock size={13} />
                          <span>{ag.timeStart} - {ag.timeEnd}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{ag.title}</h4>
                        {ag.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ag.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Kolom Kanan: Pendaftaran & Tiket */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Pendaftaran</span>
                <h3 className="text-lg font-black text-slate-900">Dapatkan Tiket Masuk</h3>
              </div>

              {/* TIER TIKET (JIKA ADA) */}
              {event.ticketingTiers && event.ticketingTiers.length > 0 ? (
                <div className="space-y-2.5">
                  {event.ticketingTiers.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTier === tier.id 
                          ? 'border-violet-600 bg-violet-50/50 shadow-2xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                        <span className="text-xs font-black text-violet-700">
                          {tier.price === 0 ? 'GRATIS' : `Rp ${tier.price.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-[11px] text-slate-500 mt-1">{tier.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-2xl font-black text-slate-900 block">
                    {event.isFree ? 'Gratis' : `Rp ${(event.price || 0).toLocaleString('id-ID')}`}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 block">Akses penuh seluruh sesi seminar</span>
                </div>
              )}

              {/* ACTION REGISTER */}
              {event.registrationType === 'EXTERNAL' && event.registrationUrl ? (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Daftar di Platform Eksternal</span>
                  <ExternalLink size={14} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Pendaftaran event berhasil dibuka! Menghubungkan ke verifikasi kehadiran.');
                  }}
                  disabled={isCompleted}
                  className={`w-full h-12 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    isCompleted
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25'
                  }`}
                >
                  <Ticket size={16} />
                  <span>{isCompleted ? 'Pendaftaran Ditutup' : 'Daftar Tiket Sekarang'}</span>
                </button>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Sertifikat digital kehadiran resmi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Materi presentasi dari pembicara</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* --- STICKY ACTION BAR SAAT SCROLL --- */}
      <StickyActionBar threshold={400}>
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">{event.title}</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{event.date} · {event.time}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {event.registrationType === 'EXTERNAL' && event.registrationUrl ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
            >
              <span>Daftar Luar</span> <ExternalLink size={13} />
            </a>
          ) : (
            <Button
              onClick={() => toast.success('Membuka dialog registrasi tiket...')}
              disabled={isCompleted}
              className={`h-10 px-5 rounded-full text-xs font-bold shadow-sm shrink-0 active:scale-95 ${
                isCompleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {isCompleted ? 'Selesai' : 'Daftar Tiket'}
            </Button>
          )}
        </div>
      </StickyActionBar>
    </SectionContainer>
  );
}
