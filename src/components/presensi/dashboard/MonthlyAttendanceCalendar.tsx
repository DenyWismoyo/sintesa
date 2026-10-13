// src/components/presensi/dashboard/MonthlyAttendanceCalendar.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { useRiwayatPresensi } from "@/hooks/presensi/usePresensi";
import { isHariLiburAtauWeekend, getHariLibur } from "@/data/presensi/masterHariLibur";
import { PresensiRecord } from "@/types/presensi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Standar Kalender Kerja Indonesia (Mulai Senin s/d Minggu)
const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function MonthlyAttendanceCalendar() {
  const { user } = usePresensiAuth();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedRecord, setSelectedRecord] = useState<{
    record: PresensiRecord | null;
    dateStr: string;
    isHoliday: boolean;
    holidayName?: string;
  } | null>(null);

  // Ambil riwayat presensi pegawai
  const { data: history = [] } = useRiwayatPresensi(user?.id, 60);

  // Map pencarian presensi per tanggal YYYY-MM-DD
  const recordMap = useMemo(() => {
    const map = new Map<string, PresensiRecord>();
    history.forEach((rec: PresensiRecord) => {
      map.set(rec.tanggal, rec);
    });
    return map;
  }, [history]);

  // Hitung susunan tanggal dalam bulan terpilih (Standar Senin = Kolom 0)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const totalDays = lastDayOfMonth.getDate();
    
    // Konversi Minggu (0) -> Index 6, Senin (1) -> Index 0
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const days: { day: number; dateStr: string; isCurrentMonth: boolean; dayOfWeekIndex: number }[] = [];

    // Padding hari dari bulan sebelumnya
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 1 ? 12 : currentMonth - 1;
      const y = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        dayOfWeekIndex: dow,
      });
    }

    // Hari dalam bulan aktif
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = (new Date(currentYear, currentMonth - 1, d).getDay() + 6) % 7;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        dayOfWeekIndex: dow,
      });
    }

    // Padding hari bulan berikutnya (melengkapi grid hingga kelipatan 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 12 ? 1 : currentMonth + 1;
      const y = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dow = (new Date(y, m - 1, i).getDay() + 6) % 7;
      days.push({
        day: i,
        dateStr,
        isCurrentMonth: false,
        dayOfWeekIndex: dow,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const todayStr = useMemo(() => today.toISOString().split("T")[0], []);

  return (
    <div className="card-base overflow-hidden bg-white p-4 sm:p-6 space-y-4 shadow-none sm:shadow-xs">
      {/* Header Navigasi Kalender (Tema Cerah Sesuai Kalender Kerja) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Kalender Kehadiran Bulanan
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Pantau rekap kedisiplinan dan lembar absensi kerja Anda
            </p>
          </div>
        </div>

        {/* Kontrol Navigasi Bulan */}
        <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold px-2 text-slate-800 min-w-28 text-center">
            {NAMA_BULAN[currentMonth - 1]} {currentYear}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legenda Status Kehadiran (Format Kalender Kerja) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span className="font-medium">Hadir On-Time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200" />
          <span className="font-medium">Terlambat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-200" />
          <span className="font-medium">Dinas Luar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 ring-2 ring-purple-200" />
          <span className="font-medium">Cuti / Izin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
          <span className="font-medium">Alpa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="font-medium">Libur / Weekend</span>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="space-y-1.5">
        {/* Header Nama Hari (Senin s/d Minggu) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {NAMA_HARI.map((hari, idx) => (
            <div
              key={hari}
              className={cn(
                "py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide",
                idx === 5 || idx === 6 ? "text-rose-500" : "text-slate-600"
              )}
            >
              {hari}
            </div>
          ))}
        </div>

        {/* Kotak Tanggal (Anatomi Kalender Kerja Bersih) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item, idx) => {
            const record = recordMap.get(item.dateStr);
            const holiday = getHariLibur(item.dateStr);
            const isWeekend = isHariLiburAtauWeekend(item.dateStr);
            const isToday = item.dateStr === todayStr;

            // Status Color Dot & Border Style
            let dotColor = "";
            let bgClass = "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs";
            let statusLabel = "";

            if (record) {
              if (record.status === "hadir") {
                dotColor = "bg-emerald-500";
                bgClass = "bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:shadow-xs";
                statusLabel = record.checkIn?.waktu ? record.checkIn.waktu.split("T")[1]?.substring(0, 5) : "Hadir";
              } else if (record.status === "terlambat") {
                dotColor = "bg-amber-400";
                bgClass = "bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:shadow-xs";
                statusLabel = record.checkIn?.waktu ? record.checkIn.waktu.split("T")[1]?.substring(0, 5) : "Telat";
              } else if (record.status === "dinas") {
                dotColor = "bg-sky-400";
                bgClass = "bg-sky-50/60 border-sky-200 hover:border-sky-300 hover:shadow-xs";
                statusLabel = "Dinas";
              } else if (record.status === "cuti" || record.status === "izin" || record.status === "sakit") {
                dotColor = "bg-purple-400";
                bgClass = "bg-purple-50/60 border-purple-200 hover:border-purple-300 hover:shadow-xs";
                statusLabel = "Izin";
              } else if (record.status === "alpa") {
                dotColor = "bg-rose-500";
                bgClass = "bg-rose-50/50 border-rose-200 hover:border-rose-300 hover:shadow-xs";
                statusLabel = "Alpa";
              }
            } else if (isWeekend && item.isCurrentMonth) {
              bgClass = "bg-slate-50/80 border-slate-200/60 text-slate-400";
              statusLabel = "Libur";
            }

            if (isToday) {
              bgClass = cn(bgClass, "border-emerald-500 ring-2 ring-emerald-500/30 font-bold");
            }

            return (
              <button
                key={`${item.dateStr}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedRecord({
                    record: record || null,
                    dateStr: item.dateStr,
                    isHoliday: isWeekend,
                    holidayName: holiday?.nama,
                  });
                }}
                className={cn(
                  "relative flex flex-col justify-between p-1.5 sm:p-2 min-h-[58px] sm:min-h-[72px] rounded-xl sm:rounded-2xl border transition-all text-left cursor-pointer",
                  bgClass,
                  !item.isCurrentMonth && "bg-slate-50/40 border-slate-100 text-slate-300 opacity-30 cursor-default"
                )}
              >
                {/* Baris Atas: Angka Hari & Dot Status */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-semibold",
                      isToday ? "text-emerald-700 font-extrabold" : "text-slate-800",
                      (item.dayOfWeekIndex === 5 || item.dayOfWeekIndex === 6) && item.isCurrentMonth && "text-rose-500",
                      !item.isCurrentMonth && "text-slate-400"
                    )}
                  >
                    {item.day}
                  </span>

                  {dotColor && <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />}
                </div>

                {/* Baris Bawah: Jam Masuk / Label Kehadiran */}
                <div className="w-full overflow-hidden text-right sm:text-left">
                  {statusLabel ? (
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-medium leading-none block truncate",
                        record?.status === "hadir" ? "text-emerald-700 font-semibold" :
                        record?.status === "terlambat" ? "text-amber-700 font-semibold" :
                        record?.status === "dinas" ? "text-sky-700 font-semibold" :
                        record?.status === "cuti" || record?.status === "izin" ? "text-purple-700 font-semibold" :
                        record?.status === "alpa" ? "text-rose-600 font-semibold" :
                        "text-slate-400 italic"
                      )}
                      title={holiday?.nama || statusLabel}
                    >
                      {statusLabel}
                    </span>
                  ) : item.isCurrentMonth ? (
                    <span className="text-[9px] text-slate-300 hidden sm:block">-</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Popover / Modal Saat Tanggal Dipilih */}
      {selectedRecord && (
        <div className="mt-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/90 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">
                Detail Presensi: {selectedRecord.dateStr}
              </span>
              {selectedRecord.isHoliday && (
                <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-50 border-rose-200 font-medium">
                  {selectedRecord.holidayName || "Hari Libur / Weekend"}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Tutup detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedRecord.record ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block font-medium">Status Kehadiran:</span>
                <span className="font-bold text-emerald-700 uppercase mt-0.5 block">
                  {selectedRecord.record.status}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block font-medium">Jam Masuk:</span>
                <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                  {selectedRecord.record.checkIn?.waktu
                    ? selectedRecord.record.checkIn.waktu.split("T")[1].substring(0, 5) + " WIB"
                    : "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block font-medium">Jam Pulang:</span>
                <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                  {selectedRecord.record.checkOut?.waktu
                    ? selectedRecord.record.checkOut.waktu.split("T")[1].substring(0, 5) + " WIB"
                    : "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block font-medium">Durasi Jam Kerja:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedRecord.record.durasiKerjaMenit
                    ? `${Math.floor(selectedRecord.record.durasiKerjaMenit / 60)} Jam ${selectedRecord.record.durasiKerjaMenit % 60} Menit`
                    : "-"}
                </span>
              </div>
              {selectedRecord.record.checkIn?.catatan && (
                <div className="col-span-2 sm:col-span-4 bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-[11px] block font-medium">Catatan / Keterangan:</span>
                  <span className="text-slate-700 text-xs leading-relaxed mt-0.5 block">
                    {selectedRecord.record.checkIn.catatan}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 py-1 leading-relaxed">
              {selectedRecord.isHoliday
                ? "Hari libur kedinasan resmi atau akhir pekan. Tidak ada kewajiban presensi kehadiran."
                : "Belum ada rekaman data kehadiran presensi yang tercatat pada tanggal ini."}
            </p>
          )}
        </div>
      )}

      {/* Footer Navigasi ke Halaman Kalender Kerja Lengkap */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Jadwal kerja resmi: Senin s/d Jumat (07:30 - 16:00 WIB)
        </span>
        <Link href="/presensi/kalender" className="w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-semibold gap-1.5 px-3 py-1.5 h-auto rounded-xl"
          >
            <span>Buka Kalender Kerja & Rekap Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
