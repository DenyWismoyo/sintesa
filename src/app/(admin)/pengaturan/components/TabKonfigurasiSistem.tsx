'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Clock, Calendar, Mail, Phone, 
  Instagram, Linkedin, Youtube, Save, Loader2, CheckCircle2, Sliders, Globe
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { settingService, SystemConfigSetting, DEFAULT_SYSTEM_CONFIG } from '@/services/setting.service';

export default function TabKonfigurasiSistem() {
  const [config, setConfig] = useState<SystemConfigSetting>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const data = await settingService.getSystemConfig();
        setConfig(data);
      } catch (err) {
        console.error('Gagal memuat konfigurasi sistem:', err);
        toast.error('Gagal memuat konfigurasi sistem.');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingService.updateSystemConfig(config);
      toast.success('Konfigurasi sistem berhasil disimpan!');
    } catch (err) {
      console.error('Gagal menyimpan konfigurasi sistem:', err);
      toast.error('Gagal menyimpan konfigurasi sistem.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Memuat konfigurasi sistem...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Global Announcement Banner */}
      <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Announcement Bar Global</h3>
              <p className="text-xs text-slate-500">Tampilkan pita pengumuman resmi di bagian atas seluruh halaman publik.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              {config.isAnnouncementActive ? 'Aktif' : 'Nonaktif'}
            </span>
            <Switch
              checked={config.isAnnouncementActive}
              onCheckedChange={(checked) => setConfig({ ...config, isAnnouncementActive: checked })}
            />
          </div>
        </div>

        {config.isAnnouncementActive && (
          <div className="space-y-4 pt-2 border-t border-slate-200/60">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Teks Pengumuman</Label>
              <Input
                value={config.announcementText}
                onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                placeholder="Contoh: Pendaftaran Batch Baru Pelatihan Vokasi telah dibuka!"
                className="mt-1 text-sm bg-white"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Label Tautan / Tombol</Label>
                <Input
                  value={config.announcementLinkText || ''}
                  onChange={(e) => setConfig({ ...config, announcementLinkText: e.target.value })}
                  placeholder="Contoh: Lihat Program"
                  className="mt-1 text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">URL / Rute Tujuan</Label>
                <Input
                  value={config.announcementLinkUrl || ''}
                  onChange={(e) => setConfig({ ...config, announcementLinkUrl: e.target.value })}
                  placeholder="Contoh: /program-pelatihan"
                  className="mt-1 text-sm bg-white"
                />
              </div>
            </div>

            {/* Preview Banner */}
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-xl text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Preview</span>
                <span className="truncate">{config.announcementText || 'Teks pengumuman...'}</span>
              </div>
              {config.announcementLinkText && (
                <span className="underline font-bold whitespace-nowrap ml-3">{config.announcementLinkText} &rarr;</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Operasional Fasilitas & Reservasi */}
      <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Operasional Fasilitas & Batas Booking</h3>
            <p className="text-xs text-slate-500">Atur jam operasional layanan dan batas rentang hari pemesanan fasilitas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <Label className="text-xs font-semibold text-slate-700">Jam Operasional Layanan</Label>
            <Input
              value={config.operatingHours}
              onChange={(e) => setConfig({ ...config, operatingHours: e.target.value })}
              placeholder="08:00 - 17:00 WIB (Senin - Jumat)"
              className="mt-1 text-sm bg-white"
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Min. Pemesanan Dimuka (Hari)
            </Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={config.minBookingDaysInAdvance}
              onChange={(e) => setConfig({ ...config, minBookingDaysInAdvance: Number(e.target.value) || 0 })}
              className="mt-1 text-sm bg-white"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">H- berapa paling lambat booking</span>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Maks. Reservasi Dimuka (Hari)
            </Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={config.maxBookingDaysInAdvance}
              onChange={(e) => setConfig({ ...config, maxBookingDaysInAdvance: Number(e.target.value) || 30 })}
              className="mt-1 text-sm bg-white"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Maksimal hari kalender ke depan</span>
          </div>
        </div>
      </div>

      {/* 3. Helpdesk & Tautan Media Sosial */}
      <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Helpdesk Pusat & Media Sosial</h3>
            <p className="text-xs text-slate-500">Tautan kontak pusat dan kanal sosial media resmi yang tampil di footer & email.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              WhatsApp Helpdesk
            </Label>
            <Input
              value={config.helpdeskWhatsApp}
              onChange={(e) => setConfig({ ...config, helpdeskWhatsApp: e.target.value })}
              placeholder="08112634567"
              className="mt-1 text-sm bg-white"
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email Helpdesk / Pemasaran
            </Label>
            <Input
              type="email"
              value={config.helpdeskEmail}
              onChange={(e) => setConfig({ ...config, helpdeskEmail: e.target.value })}
              placeholder="marketing@solotechnopark.id"
              className="mt-1 text-sm bg-white"
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              URL Instagram Resmi
            </Label>
            <Input
              value={config.instagramUrl || ''}
              onChange={(e) => setConfig({ ...config, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/solotechnopark_official"
              className="mt-1 text-sm bg-white"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-blue-600" />
              URL LinkedIn Resmi
            </Label>
            <Input
              value={config.linkedinUrl || ''}
              onChange={(e) => setConfig({ ...config, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/company/solo-technopark"
              className="mt-1 text-sm bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              URL Saluran YouTube Resmi
            </Label>
            <Input
              value={config.youtubeUrl || ''}
              onChange={(e) => setConfig({ ...config, youtubeUrl: e.target.value })}
              placeholder="https://youtube.com/@solotechnopark"
              className="mt-1 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Simpan Konfigurasi Sistem
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
