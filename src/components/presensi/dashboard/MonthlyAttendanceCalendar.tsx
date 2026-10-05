// src/components/presensi/dashboard/MonthlyAttendanceCalendar.tsx
"use client";

import React, { useState, useMemo } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { useRiwayatPresensi } from "@/hooks/presensi/usePresensi";
import { isHariLiburAtauWeekend, getHariLibur } from "@/data/presensi/masterHariLibur";
import { PresensiRecord, PresensiStatus } from "@/types/presensi";
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
} from "lucide-react";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function MonthlyAttendanceCalendar() {
  const { user } = usePresensiAuth();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedRecord, setSelectedRecord] = useState<{ record: PresensiRecord | null; dateStr: string; isHoliday: boolean; holidayName?: string } | null>(null);

  // Ambil history presensi pegawai 35 hari terakhir
  const { data: history = [] } = useRiwayatPresensi(user?.id, 35);

  // Buat map pencarian presensi per tanggal YYYY-MM-DD
  const recordMap = useMemo(() => {
    const map = new Map<string, PresensiRecord>();
    history.forEach((rec: PresensiRecord) => {
      map.set(rec.tanggal, rec);
    });
    return map;
  }, [history]);

  // Hitung susunan tanggal dalam bulan terpilih
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const totalDays = lastDayOfMonth.getDate();
    const startingDayIndex = firstDayOfMonth.getDay(); // 0 = Minggu

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Padding hari dari bulan sebelumnya
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 1 ? 12 : currentMonth - 1;
      const y = currentMonth === 1 ? currentYear - 1 : currentYear;
      days.push({
        day: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // Hari dalam bulan aktif
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d,
        dateStr: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // Padding hari bulan berikutnya (melengkapi grid hingga kelipatan 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 12 ? 1 : currentMonth + 1;
      const y = currentMonth === 12 ? currentYear + 1 : currentYear;
      days.push({
        day: i,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        isCurrentMonth: false,
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-4">
      {/* Header Navigasi Kalender */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Kalender Kehadiran Bulanan</h3>
            <p className="text-[11px] text-slate-400">Pantau rekap kedisiplinan dan absensi Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold px-2 text-slate-200 min-w-28 text-center">
            {NAMA_BULAN[currentMonth - 1]} {currentYear}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend Status Kehadiran */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Hadir On-Time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Terlambat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Dinas Luar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span>Cuti / Izin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Alpa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span>Libur / Weekend</span>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {/* Nama Hari */}
        {NAMA_HARI.map((hari, idx) => (
          <div
            key={hari}
            className={cn(
              "py-1.5 text-[11px] font-bold uppercase tracking-wider",
              idx === 0 || idx === 6 ? "text-rose-400" : "text-slate-400"
            )}
          >
            {hari}
          </div>
        ))}

        {/* Kotak Tanggal */}
        {calendarDays.map((item, idx) => {
          const record = recordMap.get(item.dateStr);
          const holiday = getHariLibur(item.dateStr);
          const isWeekend = isHariLiburAtauWeekend(item.dateStr);
          const isToday = item.dateStr === todayStr;

          // Status Color Dot & Border
          let dotColor = "";
          let bgClass = "bg-slate-950/40 hover:bg-slate-800/50";
          let borderClass = "border-slate-850";

          if (record) {
            if (record.status === "hadir") {
              dotColor = "bg-emerald-500";
              borderClass = "border-emerald-500/30";
            } else if (record.status === "terlambat") {
              dotColor = "bg-amber-400";
              borderClass = "border-amber-500/30";
            } else if (record.status === "dinas") {
              dotColor = "bg-sky-400";
              borderClass = "border-sky-500/30";
            } else if (record.status === "cuti" || record.status === "izin" || record.status === "sakit") {
              dotColor = "bg-purple-400";
              borderClass = "border-purple-500/30";
            } else if (record.status === "alpa") {
              dotColor = "bg-rose-500";
              borderClass = "border-rose-500/30";
            }
          } else if (isWeekend && item.isCurrentMonth) {
            bgClass = "bg-slate-950/20";
          }

          if (isToday) {
            borderClass = "border-emerald-400 ring-1 ring-emerald-500/40";
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
                "relative flex flex-col items-center justify-between p-2 min-h-14 rounded-xl border transition-all text-left group cursor-pointer",
                bgClass,
                borderClass,
                !item.isCurrentMonth && "opacity-30"
              )}
            >
              <div className="w-full flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isToday ? "text-emerald-400 font-bold" : "text-slate-300",
                    isWeekend && "text-rose-400"
                  )}
                >
                  {item.day}
                </span>

                {dotColor && <span className={cn("w-2 h-2 rounded-full", dotColor)} />}
              </div>

              {/* Tampilan Ringkas Jam Masuk */}
              {record?.checkIn?.waktu ? (
                <span className="text-[10px] font-mono text-slate-400 mt-1">
                  {record.checkIn.waktu.split("T")[1]?.substring(0, 5) || "OK"}
                </span>
              ) : holiday ? (
                <span className="text-[9px] text-rose-400 truncate max-w-full font-medium" title={holiday.nama}>
                  Libur
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Detail Popover / Modal Saat Tanggal Dipilih */}
      {selectedRecord && (
        <div className="mt-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/90 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                Detail Presensi: {selectedRecord.dateStr}
              </span>
              {selectedRecord.isHoliday && (
                <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30">
                  {selectedRecord.holidayName || "Hari Libur / Weekend"}
                </Badge>
              )}
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-slate-400 hover:text-slate-200 text-sm p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedRecord.record ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-semibold text-emerald-400 uppercase">
                  {selectedRecord.record.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Jam Masuk:</span>
                <span className="font-mono text-slate-200">
                  {selectedRecord.record.checkIn?.waktu
                    ? selectedRecord.record.checkIn.waktu.split("T")[1].substring(0, 5) + " WIB"
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Jam Pulang:</span>
                <span className="font-mono text-slate-200">
                  {selectedRecord.record.checkOut?.waktu
                    ? selectedRecord.record.checkOut.waktu.split("T")[1].substring(0, 5) + " WIB"
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Durasi Kerja:</span>
                <span className="text-slate-200 font-medium">
                  {selectedRecord.record.durasiKerjaMenit
                    ? `${Math.floor(selectedRecord.record.durasiKerjaMenit / 60)}j ${selectedRecord.record.durasiKerjaMenit % 60}m`
                    : "-"}
                </span>
              </div>
              {selectedRecord.record.checkIn?.catatan && (
                <div className="col-span-2 sm:col-span-4 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Catatan & Audit Keaslian:</span>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {selectedRecord.record.checkIn.catatan}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 py-1">
              {selectedRecord.isHoliday
                ? "Hari libur kedinasan / akhir pekan resmi. Tidak ada kewajiban presensi kehadiran."
                : "Tidak ada riwayat presensi tercatat pada tanggal ini."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
