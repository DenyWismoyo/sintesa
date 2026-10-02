// Lokasi: src/components/common/CountdownTimer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string | Date | number;
  label?: string;
  className?: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function CountdownTimer({
  targetDate,
  label = 'Batas Pendaftaran',
  className = '',
  onExpire
}: CountdownTimerProps) {
  const calculateTimeLeft = (): TimeLeft => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isExpired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold ${className}`}>
        <Clock size={13} />
        <span>Pendaftaran / Event Telah Dimulai</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Clock size={13} className="text-amber-500" />
          <span>{label}</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-900 text-white p-2.5 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="block text-lg sm:text-xl font-black font-mono leading-none">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">Hari</span>
        </div>
        <div className="bg-slate-900 text-white p-2.5 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="block text-lg sm:text-xl font-black font-mono leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">Jam</span>
        </div>
        <div className="bg-slate-900 text-white p-2.5 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="block text-lg sm:text-xl font-black font-mono leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">Mnt</span>
        </div>
        <div className="bg-slate-900 text-white p-2.5 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="block text-lg sm:text-xl font-black font-mono leading-none text-amber-400">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">Dtk</span>
        </div>
      </div>
    </div>
  );
}
