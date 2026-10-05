"use client";

import React, { useState } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { useKantorList, useSaveKantorMutation, useDeleteKantorMutation } from "@/hooks/presensi/useKantor";
import { DEFAULT_KANTOR_LIST, KAWASAN_STP_POLYGON, isSoloTechnoparkOffice } from "@/data/presensi/masterKantor";
import { KantorUnit, KategoriKantor, GeolocationPoint } from "@/types/presensi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Compass,
  Clock,
  RotateCcw,
  Pencil,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

import { seedDatabaseAction } from "@/actions/presensi/seed";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import dynamic from "next/dynamic";
import type { OfficeLocationPickerProps } from "@/components/presensi/maps/OfficeLocationPicker";
import type { OfficeOverviewMapProps } from "@/components/presensi/maps/OfficeOverviewMap";

// Dynamic import dengan SSR: false untuk memastikan Leaflet hanya dimuat di client-side (Zero SSR Crash)
const OfficeLocationPicker = dynamic<OfficeLocationPickerProps>(
  () => import("@/components/presensi/maps/OfficeLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] rounded-xl bg-slate-900/5 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Memuat peta interaktif Leaflet OpenStreetMap...
      </div>
    ),
  }
);

const OfficeOverviewMap = dynamic<OfficeOverviewMapProps>(
  () => import("@/components/presensi/maps/OfficeOverviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-xl bg-slate-900/5 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Memuat peta sebaran kantor Surakarta...
      </div>
    ),
  }
);

export default function PengaturanKantorPage() {
  const { user } = usePresensiAuth();
  const { data: kantorListFromDb, isLoading, refetch } = useKantorList(user?.orgId);
  const saveKantorMutation = useSaveKantorMutation();
  const deleteKantorMutation = useDeleteKantorMutation();
  const [isSeeding, setIsSeeding] = useState(false);

  const offices: KantorUnit[] = kantorListFromDb || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    kodeKantor: string;
    namaKantor: string;
    kategori: KategoriKantor;
    geofenceType: "radius" | "polygon";
    alamat: string;
    lat: string;
    lng: string;
    radiusMeter: number;
    jamMasukMaksimal: string;
    jamPulangMinimal: string;
    polygonCoordinates?: GeolocationPoint[];
  }>({
    kodeKantor: "",
    namaKantor: "",
    kategori: "Kawasan Khusus",
    geofenceType: "polygon",
    alamat: "",
    lat: "-7.555000",
    lng: "110.853500",
    radiusMeter: 200,
    jamMasukMaksimal: "08:00",
    jamPulangMinimal: "16:00",
    polygonCoordinates: [...KAWASAN_STP_POLYGON],
  });

  const handleUpdatePolygonVertex = (index: number, field: "lat" | "lng", val: number) => {
    setFormData((prev) => {
      const current = [...(prev.polygonCoordinates || KAWASAN_STP_POLYGON)];
      current[index] = {
        ...current[index],
        [field]: val,
      };
      return {
        ...prev,
        polygonCoordinates: current,
      };
    });
  };

  const handleDeletePolygonVertex = (index: number) => {
    setFormData((prev) => {
      const current = [...(prev.polygonCoordinates || KAWASAN_STP_POLYGON)];
      if (current.length <= 3) {
        alert("Minimal 3 titik koordinat untuk membentuk bidang tapak poligon tertutup.");
        return prev;
      }
      const updated = current.filter((_, i) => i !== index);
      return {
        ...prev,
        polygonCoordinates: updated,
      };
    });
  };

  const handleAddPolygonVertex = () => {
    setFormData((prev) => {
      const current = [...(prev.polygonCoordinates || KAWASAN_STP_POLYGON)];
      const last = current[current.length - 1] || { lat: -7.5550, lng: 110.8535 };
      const newPt = {
        lat: parseFloat((last.lat + 0.00015).toFixed(6)),
        lng: parseFloat((last.lng + 0.00015).toFixed(6)),
      };
      return {
        ...prev,
        polygonCoordinates: [...current, newPt],
      };
    });
  };

  const handleResetPolygonToDefault = () => {
    if (confirm("Kembalikan koordinat batas tapak ke template 8 titik standar Solo Technopark murni?")) {
      setFormData((prev) => ({
        ...prev,
        polygonCoordinates: [...KAWASAN_STP_POLYGON],
      }));
    }
  };

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDatabaseAction();
      setStatusMessage(res.message);
      await refetch();
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "radiusMeter" ? Number(value) : value,
    }));
  };

  const handleSubmitNewKantor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeKantor || !formData.namaKantor || !formData.alamat) {
      alert("Harap lengkapi kode kantor, nama, dan alamat!");
      return;
    }

    const isPolygon =
      formData.geofenceType === "polygon" ||
      formData.namaKantor.toLowerCase().includes("technopark") ||
      formData.namaKantor.toLowerCase().includes("stp");

    const newKantor: KantorUnit = {
      id: editingId || `kantor-${Date.now()}`,
      kodeKantor: formData.kodeKantor.toUpperCase(),
      namaKantor: formData.namaKantor,
      kategori: formData.kategori,
      alamat: formData.alamat,
      koordinat: {
        lat: parseFloat(formData.lat) || -7.555000,
        lng: parseFloat(formData.lng) || 110.853500,
      },
      radiusMeter: Number(formData.radiusMeter) || (isPolygon ? 200 : 150),
      jamMasukMaksimal: formData.jamMasukMaksimal || "08:00",
      jamPulangMinimal: formData.jamPulangMinimal || "16:00",
      orgId: user?.orgId || "solotechnopark",
      isActive: true,
      geofenceType: isPolygon ? "polygon" : "radius",
      polygonCoordinates: isPolygon
        ? (formData.polygonCoordinates && formData.polygonCoordinates.length >= 3
            ? formData.polygonCoordinates
            : KAWASAN_STP_POLYGON)
        : undefined,
    };

    await saveKantorMutation.mutateAsync(newKantor);
    setStatusMessage(editingId ? `Titik kantor "${newKantor.namaKantor}" berhasil diperbarui!` : `Titik kantor "${newKantor.namaKantor}" berhasil ditambahkan!`);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      kodeKantor: "",
      namaKantor: "",
      kategori: "Kawasan Khusus",
      geofenceType: "polygon",
      alamat: "",
      lat: "-7.555000",
      lng: "110.853500",
      radiusMeter: 200,
      jamMasukMaksimal: "08:00",
      jamPulangMinimal: "16:00",
      polygonCoordinates: [...KAWASAN_STP_POLYGON],
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleEditClick = (kantor: KantorUnit) => {
    setEditingId(kantor.id);
    const isStp = isSoloTechnoparkOffice(kantor) || kantor.geofenceType === "polygon";
    setFormData({
      kodeKantor: kantor.kodeKantor,
      namaKantor: kantor.namaKantor,
      kategori: kantor.kategori,
      geofenceType: isStp ? "polygon" : (kantor.geofenceType || "radius"),
      alamat: kantor.alamat,
      lat: (kantor.koordinat?.lat ?? -7.555000).toString(),
      lng: (kantor.koordinat?.lng ?? 110.853500).toString(),
      radiusMeter: kantor.radiusMeter || (isStp ? 200 : 150),
      jamMasukMaksimal: kantor.jamMasukMaksimal || "07:30",
      jamPulangMinimal: kantor.jamPulangMinimal || "16:00",
      polygonCoordinates:
        kantor.polygonCoordinates && kantor.polygonCoordinates.length >= 3
          ? [...kantor.polygonCoordinates]
          : [...KAWASAN_STP_POLYGON],
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus atau menonaktifkan kantor "${nama}"?`)) {
      await deleteKantorMutation.mutateAsync(id);
      setStatusMessage(`Titik kantor "${nama}" telah dihapus.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleToggleStatus = async (kantor: KantorUnit) => {
    const updated = { ...kantor, isActive: !kantor.isActive };
    await saveKantorMutation.mutateAsync(updated);
  };

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Pengaturan Kantor & Geofence"
        subtitle="Manajemen titik koordinat GPS & radius kantor dinas"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Manajemen Titik Multi-Kantor Geofencing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koordinat GPS satelit, batas radius geofence, dan jam kerja unit kerja Solo Technopark
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {process.env.NODE_ENV !== "production" && (
            <Button
              variant="outline"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="btn-outline btn-sm text-xs font-medium border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/60"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isSeeding ? "animate-spin" : ""}`} />
              {isSeeding ? "Menyuntikkan Seed..." : "Reset Seed Demo (Dev Only)"}
            </Button>
          )}

          <Button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({
                  kodeKantor: "",
                  namaKantor: "",
                  kategori: "Kawasan Khusus",
                  geofenceType: "polygon",
                  alamat: "",
                  lat: "-7.555000",
                  lng: "110.853500",
                  radiusMeter: 200,
                  jamMasukMaksimal: "08:00",
                  jamPulangMinimal: "16:00",
                  polygonCoordinates: [...KAWASAN_STP_POLYGON],
                });
              } else {
                setShowAddForm(true);
              }
            }}
            className="btn-primary btn-sm text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? "Tutup Form" : "Tambah Titik Kantor Baru"}
          </Button>
        </div>
      </div>

      {/* Alert Status */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Statistik Ringkas (Satu Panel Borderless di Mobile) */}
      <div className="card-base overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 bg-white">
          <div className="p-4 sm:p-5">
            <div className="text-[11px] text-slate-500 font-medium">Total Titik Kantor</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{offices.length}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Tersebar di wilayah kerja</div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-[11px] text-slate-500 font-medium">Kantor Aktif</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {offices.filter((k) => k.isActive).length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Menerima presensi online</div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-[11px] text-slate-500 font-medium">Model Geofence Kawasan</div>
            <div className="text-lg font-black text-emerald-700 mt-1 flex items-center gap-1.5">
              <span>📐 Poligon (8 Ha)</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Batas tapak resmi Solo Technopark</div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-[11px] text-slate-500 font-medium">Auto-Detection</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">Haversine</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Kalkulasi presisi koordinat</div>
          </div>
        </div>
      </div>

      {/* Form Tambah Kantor Baru */}
      {showAddForm && (
        <div className="card-base overflow-hidden bg-white">
          <div className="p-4 sm:p-5 pb-3 border-b border-emerald-100 bg-emerald-50/40">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              {editingId ? "Edit Titik Lokasi Kantor" : "Pendaftaran Titik Lokasi Kantor Baru"}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pastikan koordinat Latitude dan Longitude bersumber dari titik resmi Google Maps / Satelit GPS
            </p>
          </div>
          <div className="p-4 sm:p-5 bg-white">
            <form onSubmit={handleSubmitNewKantor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kodeKantor" className="text-xs text-slate-700">Kode Kantor (Singkatan)</Label>
                  <Input
                    id="kodeKantor"
                    name="kodeKantor"
                    placeholder="misal: DISDIK-01"
                    value={formData.kodeKantor}
                    onChange={handleInputChange}
                    className="bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="namaKantor" className="text-xs text-slate-700">Nama Lengkap Kantor / Instansi OPD</Label>
                  <Input
                    id="namaKantor"
                    name="namaKantor"
                    placeholder="misal: Dinas Pendidikan Kota Surakarta"
                    value={formData.namaKantor}
                    onChange={handleInputChange}
                    className="bg-white"
                    required
                  />
                </div>
              </div>

              {/* Model Geofence Selector */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Model Geofence Presensi Kepegawaian
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        geofenceType: "polygon",
                        kategori: "Kawasan Khusus",
                        radiusMeter: Math.max(prev.radiusMeter, 200),
                      }))
                    }
                    className={cn(
                      "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      formData.geofenceType === "polygon"
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <ShieldCheck
                      className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        formData.geofenceType === "polygon"
                          ? "text-emerald-600"
                          : "text-slate-400"
                      )}
                    />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Batas Poligon Kawasan STP (~8 Ha)</span>
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                          REKOMENDASI STP
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Verifikasi presisi mengikuti batas perimeter tapak tanah resmi UPTD Solo Technopark (Gedung Pusat, STC, SCC, Diklat, Hanggar, Arena).
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        geofenceType: "radius",
                        radiusMeter: prev.radiusMeter > 500 ? 150 : prev.radiusMeter,
                      }))
                    }
                    className={cn(
                      "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      formData.geofenceType === "radius"
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        formData.geofenceType === "radius"
                          ? "text-emerald-600"
                          : "text-slate-400"
                      )}
                    />
                    <div>
                      <div className="font-bold text-xs">
                        Radius Lingkaran Konvensional (Meter)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Batas radius lingkaran melingkar standar. Cocok untuk titik kantor tunggal, OPD, kecamatan, kelurahan, atau pos dinas luar.
                      </div>
                    </div>
                  </button>
                </div>

                {formData.geofenceType === "polygon" && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mode Poligon Terpadu Aktif:</strong> Peta di bawah otomatis menampilkan batas poligon perimeter fisik tapak kawasan Solo Technopark. Seluruh pegawai di dalam area garis hijau putus-putus akan terdeteksi presisi tanpa terkendala batas radius bulat tunggal.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kategori" className="text-xs text-slate-700">Kategori Kantor</Label>
                  <select
                    id="kategori"
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="Kawasan Khusus">Kawasan Khusus (Solo Technopark)</option>
                    <option value="Pusat">Pusat / Balai Kota</option>
                    <option value="OPD / Dinas">OPD / Dinas</option>
                    <option value="Kecamatan">Kecamatan</option>
                    <option value="Kelurahan">Kelurahan</option>
                    <option value="UPTD / Sekolah">UPTD / Sekolah</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radiusMeter" className="text-xs text-slate-700 font-semibold">
                      {formData.geofenceType === "polygon" ? "Buffer GPS Toleransi:" : "Radius Geofence:"}{" "}
                      <span className="text-emerald-700 font-bold">{formData.radiusMeter} Meter</span>
                    </Label>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max={formData.geofenceType === "polygon" ? "400" : "500"}
                    step="10"
                    value={formData.radiusMeter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        radiusMeter: Number(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>30m</span>
                    <span>{formData.geofenceType === "polygon" ? "200m (Kawasan STP Murni)" : "150m (Standar)"}</span>
                    <span>{formData.geofenceType === "polygon" ? "400m (Maksimal)" : "500m (Luas)"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Batas Jam Masuk & Pulang</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      name="jamMasukMaksimal"
                      value={formData.jamMasukMaksimal}
                      onChange={handleInputChange}
                      placeholder="07:30"
                      className="bg-white text-center"
                    />
                    <Input
                      name="jamPulangMinimal"
                      value={formData.jamPulangMinimal}
                      onChange={handleInputChange}
                      placeholder="16:00"
                      className="bg-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Peta Interaktif Leaflet Penentu Titik Koordinat & Poligon */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Peta Interaktif Penentu Titik & Batas Geofence
                  </Label>
                  <span className="text-[10px] text-slate-500">
                    {formData.geofenceType === "polygon"
                      ? "Batas hijau putus-putus menunjukkan tapak Kawasan STP"
                      : "Geser pin hijau atau klik peta untuk menaruh titik kantor"}
                  </span>
                </div>
                <OfficeLocationPicker
                  initialLat={parseFloat(formData.lat) || -7.555000}
                  initialLng={parseFloat(formData.lng) || 110.853500}
                  radiusMeter={formData.radiusMeter}
                  namaKantor={formData.namaKantor || "Solo Technopark"}
                  geofenceType={formData.geofenceType}
                  polygonCoordinates={formData.polygonCoordinates || KAWASAN_STP_POLYGON}
                  onChange={(newLat: number, newLng: number) => {
                    setFormData((prev) => ({
                      ...prev,
                      lat: newLat.toString(),
                      lng: newLng.toString(),
                    }));
                  }}
                  onPolygonChange={(newCoords) => {
                    setFormData((prev) => ({
                      ...prev,
                      polygonCoordinates: newCoords,
                    }));
                  }}
                />

                {/* Panel Editor Presisi Titik Koordinat Poligon Tapak Kawasan */}
                {formData.geofenceType === "polygon" && (
                  <div className="mt-3 p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/60">
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>Pengaturan Presisi Titik Sudut Tapak Kawasan (Manual & Interaktif)</span>
                          <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2">
                            {(formData.polygonCoordinates || KAWASAN_STP_POLYGON).length} Titik Sudut
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Geser titik oranye langsung di peta atau sesuaikan nilai Latitude / Longitude pada tabel di bawah untuk akurasi tapak tanah.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleResetPolygonToDefault}
                          className="text-[11px] h-7 px-2.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer shadow-xs"
                          title="Kembalikan ke 8 titik tapak resmi Solo Technopark"
                        >
                          <RotateCcw className="w-3 h-3 mr-1 text-slate-500" />
                          Reset Default STP
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddPolygonVertex}
                          className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          + Tambah Titik Sudut
                        </Button>
                      </div>
                    </div>

                    {/* Tabel Input Titik Koordinat Manual */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-[260px] overflow-y-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                          <tr>
                            <th className="py-2 px-3 w-16 text-center">No</th>
                            <th className="py-2 px-3">Latitude GPS (Satelit)</th>
                            <th className="py-2 px-3">Longitude GPS (Satelit)</th>
                            <th className="py-2 px-3 w-20 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(formData.polygonCoordinates || KAWASAN_STP_POLYGON).map((pt, index) => (
                            <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-1.5 px-3 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <Input
                                  type="number"
                                  step="any"
                                  value={pt.lat}
                                  onChange={(e) =>
                                    handleUpdatePolygonVertex(index, "lat", parseFloat(e.target.value) || 0)
                                  }
                                  className="h-8 text-xs font-mono font-semibold bg-white border-slate-200"
                                  placeholder="-7.555000"
                                />
                              </td>
                              <td className="py-1.5 px-3">
                                <Input
                                  type="number"
                                  step="any"
                                  value={pt.lng}
                                  onChange={(e) =>
                                    handleUpdatePolygonVertex(index, "lng", parseFloat(e.target.value) || 0)
                                  }
                                  className="h-8 text-xs font-mono font-semibold bg-white border-slate-200"
                                  placeholder="110.853500"
                                />
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={(formData.polygonCoordinates || KAWASAN_STP_POLYGON).length <= 3}
                                  onClick={() => handleDeletePolygonVertex(index)}
                                  className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                                  title="Hapus titik sudut ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 px-0.5">
                      <span>💡 <strong>Tips Presisi:</strong> Minimal 3 titik sudut. Koordinat yang Anda ubah di tabel langsung terhubung dan memutakhirkan bentuk garis di peta secara instan.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lat" className="text-xs text-slate-700">Latitude GPS (Terisi Otomatis)</Label>
                  <Input
                    id="lat"
                    name="lat"
                    placeholder="-7.568500"
                    value={formData.lat}
                    onChange={handleInputChange}
                    className="bg-white font-mono font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng" className="text-xs text-slate-700">Longitude GPS (Terisi Otomatis)</Label>
                  <Input
                    id="lng"
                    name="lng"
                    placeholder="110.828000"
                    value={formData.lng}
                    onChange={handleInputChange}
                    className="bg-white font-mono font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alamat" className="text-xs text-slate-700">Alamat Lengkap</Label>
                <Input
                  id="alamat"
                  name="alamat"
                  placeholder="Jl. ..., Kelurahan ..., Kecamatan ..., Kota ..."
                  value={formData.alamat}
                  onChange={handleInputChange}
                  className="bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({
                      kodeKantor: "",
                      namaKantor: "",
                      kategori: "Kawasan Khusus",
                      geofenceType: "polygon",
                      alamat: "",
                      lat: "-7.555000",
                      lng: "110.853500",
                      radiusMeter: 200,
                      jamMasukMaksimal: "08:00",
                      jamPulangMinimal: "16:00",
                      polygonCoordinates: [...KAWASAN_STP_POLYGON],
                    });
                  }}
                  className="btn-outline btn-sm text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saveKantorMutation.isPending}
                  className="btn-primary btn-sm text-xs font-semibold"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Titik Kantor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Peta Sebaran Makro Geofence Kawasan Solo Technopark */}
      <OfficeOverviewMap offices={offices} />

      {/* Tabel Daftar Seluruh Titik Kantor */}
      <div className="card-base overflow-hidden bg-white">
        <div className="bg-slate-50 border-b border-slate-200/80 py-4 px-4 sm:px-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            Daftar Seluruh Titik Geofence Unit Kerja ({offices.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap pegawai yang berada di dalam radius masing-masing kantor/zona ini dapat melakukan presensi terverifikasi
          </p>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Kode & Nama Kantor</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Koordinat GPS Satelit</th>
                  <th className="py-3 px-4">Radius</th>
                  <th className="py-3 px-4">Jam Kerja</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offices.map((kantor) => (
                  <tr key={kantor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 font-mono">
                          {kantor.kodeKantor}
                        </Badge>
                        <span>{kantor.namaKantor}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {kantor.alamat}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {kantor.kategori}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>
                          {kantor.koordinat?.lat != null ? kantor.koordinat.lat.toFixed(6) : "-"},{" "}
                          {kantor.koordinat?.lng != null ? kantor.koordinat.lng.toFixed(6) : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSoloTechnoparkOffice(kantor) || kantor.geofenceType === "polygon" ? (
                        <div className="space-y-1">
                          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold inline-flex items-center gap-1 shadow-xs whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Poligon Kawasan STP (8 Ha)</span>
                          </Badge>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Buffer Toleransi: {kantor.radiusMeter}m
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-700 font-mono">⭕ {kantor.radiusMeter}m</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{kantor.jamMasukMaksimal || "07:30"} - {kantor.jamPulangMinimal || "16:00"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(kantor)}
                        className="cursor-pointer"
                        title="Klik untuk mengubah status"
                      >
                        <Badge
                          variant={kantor.isActive ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {kantor.isActive ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(kantor)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit Kantor"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(kantor.id, kantor.namaKantor)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Hapus Kantor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
