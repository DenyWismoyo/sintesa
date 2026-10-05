"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  MapPin,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  KAWASAN_STP_POLYGON,
  STP_CAMPUS_ANCHORS,
  isPointInPolygon,
} from "@/data/presensi/masterKantor";
import { GeolocationPoint } from "@/types/presensi";

export interface OfficeLocationPickerProps {
  initialLat: number;
  initialLng: number;
  radiusMeter: number;
  namaKantor?: string;
  geofenceType?: "radius" | "polygon";
  polygonCoordinates?: GeolocationPoint[];
  onChange: (lat: number, lng: number) => void;
  onPolygonChange?: (coords: GeolocationPoint[]) => void;
  className?: string;
}

/**
 * Custom SVG DivIcon Marker Pin modern ASN (Emerald Theme) untuk Centroid Kantor
 */
function createCustomPinIcon(label: string = "Titik Kantor") {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
      <div class="absolute -bottom-1 w-3 h-3 bg-emerald-950/40 rounded-full blur-[2px]"></div>
      <div class="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold shadow opacity-90 pointer-events-none">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-office-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

/**
 * Simpul / Vertex Titik Sudut Tapak Kawasan (Draggable Vertex Pin)
 */
function createVertexMarkerIcon(index: number) {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group">
      <div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-black transition-transform group-hover:scale-125 group-hover:bg-amber-600">
        ${index + 1}
      </div>
      <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.2 rounded bg-slate-900/90 text-white text-[9px] font-medium shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        Sudut #${index + 1} (Geser)
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "custom-vertex-pin",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createFacilityAnchorPin(nama: string) {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" title="${nama}">
      <div class="w-3 h-3 rounded-full bg-teal-500 border border-white shadow-xs"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "custom-facility-pin",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export default function OfficeLocationPicker({
  initialLat,
  initialLng,
  radiusMeter,
  namaKantor = "Titik Kantor",
  geofenceType = "polygon",
  polygonCoordinates,
  onChange,
  onPolygonChange,
  className = "",
}: OfficeLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);

  const isStpMode =
    geofenceType === "polygon" ||
    namaKantor.toLowerCase().includes("technopark") ||
    namaKantor.toLowerCase().includes("stp");

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || -7.5550,
    lng: initialLng || 110.8535,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isAddVertexMode, setIsAddVertexMode] = useState(false);

  // Simpan koordinat poligon aktif di ref agar sinkron dengan interaksi drag Leaflet
  const activePolyRef = useRef<GeolocationPoint[]>(
    polygonCoordinates && polygonCoordinates.length >= 3
      ? polygonCoordinates
      : KAWASAN_STP_POLYGON
  );

  // Render dan ikat marker draggable simpul poligon
  const renderVertexMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !isStpMode) return;

    // Hapus vertex markers lama
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    const pts = activePolyRef.current;
    const newMarkers = pts.map((pt, idx) => {
      const vMarker = L.marker([pt.lat, pt.lng], {
        icon: createVertexMarkerIcon(idx),
        draggable: true,
        zIndexOffset: 500,
      }).addTo(map);

      // Event: real-time drag (garis poligon langsung bergerak dinamis)
      vMarker.on("drag", () => {
        const latlng = vMarker.getLatLng();
        const updated = [...activePolyRef.current];
        updated[idx] = {
          lat: parseFloat(latlng.lat.toFixed(6)),
          lng: parseFloat(latlng.lng.toFixed(6)),
        };
        activePolyRef.current = updated;
        if (polygonRef.current) {
          polygonRef.current.setLatLngs(
            updated.map((p) => [p.lat, p.lng] as L.LatLngTuple)
          );
        }
      });

      // Event: selesai drag simpul
      vMarker.on("dragend", () => {
        const latlng = vMarker.getLatLng();
        const updated = [...activePolyRef.current];
        updated[idx] = {
          lat: parseFloat(latlng.lat.toFixed(6)),
          lng: parseFloat(latlng.lng.toFixed(6)),
        };
        activePolyRef.current = updated;
        onPolygonChange?.(updated);
      });

      // Popup untuk info dan opsi hapus simpul
      const popupDiv = document.createElement("div");
      popupDiv.className = "p-1 text-xs space-y-1.5";
      popupDiv.innerHTML = `
        <div class="font-bold text-amber-900">Titik Sudut #${idx + 1}</div>
        <div class="font-mono text-[10px] text-slate-600">${pt.lat.toFixed(6)}, ${pt.lng.toFixed(6)}</div>
      `;

      if (pts.length > 3) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "w-full px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[10px] border border-rose-200 cursor-pointer flex items-center justify-center gap-1";
        delBtn.innerHTML = `Hapus Sudut Ini`;
        delBtn.onclick = (e) => {
          e.stopPropagation();
          map.closePopup();
          const filtered = activePolyRef.current.filter((_, i) => i !== idx);
          activePolyRef.current = filtered;
          if (polygonRef.current) {
            polygonRef.current.setLatLngs(
              filtered.map((p) => [p.lat, p.lng] as L.LatLngTuple)
            );
          }
          renderVertexMarkers();
          onPolygonChange?.(filtered);
        };
        popupDiv.appendChild(delBtn);
      }

      vMarker.bindPopup(popupDiv);
      return vMarker;
    });

    vertexMarkersRef.current = newMarkers;
  }, [isStpMode, onPolygonChange]);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 17,
      zoomControl: false,
    });

    // Tile Layer: OpenStreetMap Standard
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Circle Geofence radius
    const circle = L.circle([currentCoords.lat, currentCoords.lng], {
      radius: radiusMeter || 200,
      color: isStpMode ? "#059669" : "#0284c7",
      fillColor: isStpMode ? "#10b981" : "#38bdf8",
      fillOpacity: isStpMode ? 0.12 : 0.22,
      weight: 1.5,
      dashArray: "4, 6",
    }).addTo(map);
    circleRef.current = circle;

    // Poligon Batas Tapak Kawasan
    if (isStpMode) {
      const polyCoords = activePolyRef.current.map(
        (p) => [p.lat, p.lng] as L.LatLngTuple
      );

      const polygon = L.polygon(polyCoords, {
        color: "#059669",
        fillColor: "#10b981",
        fillOpacity: 0.24,
        weight: 3,
        dashArray: "6, 6",
      }).addTo(map);
      polygonRef.current = polygon;

      polygon.bindPopup(`
        <div class="p-1 text-xs">
          <div class="font-bold text-emerald-900 mb-0.5">Batas Tapak Kawasan Solo Technopark</div>
          <div class="text-[10px] text-slate-600 mb-1">Presisi fisik area murni di utara Jl. Ki Hajar Dewantara (tidak mencakup UNS).</div>
          <div class="text-[10px] text-amber-700 font-semibold">💡 Geser titik-titik oranye untuk menyesuaikan garis batas tapak.</div>
        </div>
      `);

      // Titik fasilitas terpadu STP
      STP_CAMPUS_ANCHORS.forEach((anchor) => {
        const markerF = L.marker([anchor.lat, anchor.lng], {
          icon: createFacilityAnchorPin(anchor.nama),
        }).addTo(map);
        markerF.bindPopup(`
          <div class="p-1 text-xs">
            <div class="font-bold text-teal-900">${anchor.nama}</div>
            <div class="text-[10px] text-slate-500">Fasilitas Resmi STP</div>
          </div>
        `);
      });
    }

    // Marker Pin Draggable untuk Pusat Kantor
    const marker = L.marker([currentCoords.lat, currentCoords.lng], {
      icon: createCustomPinIcon(namaKantor),
      draggable: true,
      autoPan: true,
      zIndexOffset: 1000,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const newLat = parseFloat(pos.lat.toFixed(6));
      const newLng = parseFloat(pos.lng.toFixed(6));
      setCurrentCoords({ lat: newLat, lng: newLng });
      circle.setLatLng(pos);
      onChange(newLat, newLng);
    });

    // Event: klik pada peta
    map.on("click", (e: L.LeafletMouseEvent) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));

      if (isAddVertexMode) {
        // Mode Tambah Sudut Poligon: sisipkan simpul baru
        const updated = [...activePolyRef.current, { lat: newLat, lng: newLng }];
        activePolyRef.current = updated;
        if (polygonRef.current) {
          polygonRef.current.setLatLngs(
            updated.map((p) => [p.lat, p.lng] as L.LatLngTuple)
          );
        }
        renderVertexMarkers();
        onPolygonChange?.(updated);
        setIsAddVertexMode(false);
      } else {
        // Mode Biasa: pindahkan titik centroid kantor
        marker.setLatLng(e.latlng);
        circle.setLatLng(e.latlng);
        setCurrentCoords({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
      }
    });

    mapInstanceRef.current = map;

    // Render simpul pertama kali
    renderVertexMarkers();

    return () => {
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      polygonRef.current = null;
    };
  }, [isStpMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sinkronisasi jika prop polygonCoordinates berubah dari luar (misal diedit lewat tabel input angka)
  useEffect(() => {
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      activePolyRef.current = polygonCoordinates;
      if (polygonRef.current) {
        polygonRef.current.setLatLngs(
          polygonCoordinates.map((p) => [p.lat, p.lng] as L.LatLngTuple)
        );
      }
      renderVertexMarkers();
    }
  }, [polygonCoordinates, renderVertexMarkers]);

  // Sinkronisasi radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeter || 200);
    }
  }, [radiusMeter]);

  // Sinkronisasi posisi koordinat
  useEffect(() => {
    if (
      initialLat &&
      initialLng &&
      (initialLat !== currentCoords.lat || initialLng !== currentCoords.lng)
    ) {
      setCurrentCoords({ lat: initialLat, lng: initialLng });
      if (markerRef.current && circleRef.current && mapInstanceRef.current) {
        const newPos = L.latLng(initialLat, initialLng);
        markerRef.current.setLatLng(newPos);
        circleRef.current.setLatLng(newPos);
        mapInstanceRef.current.panTo(newPos, { animate: true, duration: 0.5 });
      }
    }
  }, [initialLat, initialLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // GPS geolocation device
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        setCurrentCoords({ lat: newLat, lng: newLng });

        if (markerRef.current && circleRef.current && mapInstanceRef.current) {
          const latlng = L.latLng(newLat, newLng);
          markerRef.current.setLatLng(latlng);
          circleRef.current.setLatLng(latlng);
          mapInstanceRef.current.setView(latlng, 17, { animate: true });
        }
        onChange(newLat, newLng);
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal membaca GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onChange]);

  const isInsideStpPolygon = isPointInPolygon(currentCoords, activePolyRef.current);

  return (
    <div className={`relative flex flex-col rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-900 ${className}`}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <Badge className="bg-slate-900/90 text-white hover:bg-slate-900 border border-slate-700 text-[11px] font-mono shadow-md backdrop-blur-sm px-2.5 py-1">
            <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
            {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
          </Badge>

          {isStpMode ? (
            <>
              <Badge
                className={`text-[11px] font-semibold shadow-md backdrop-blur-sm px-2.5 py-1 ${
                  isInsideStpPolygon
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-amber-600 text-white border-amber-500"
                }`}
              >
                {isInsideStpPolygon ? (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Di Dalam Batas Tapak STP</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Di Luar Tapak STP</span>
                  </span>
                )}
              </Badge>

              <Badge className="bg-amber-600/95 text-white border border-amber-400 text-[11px] font-semibold shadow-md backdrop-blur-sm px-2.5 py-1">
                {activePolyRef.current.length} Titik Sudut Tapak
              </Badge>
            </>
          ) : (
            <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 border border-emerald-500 text-[11px] font-semibold shadow-md backdrop-blur-sm px-2.5 py-1">
              Radius: {radiusMeter}m
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isStpMode && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddVertexMode(!isAddVertexMode)}
              className={`text-[11px] h-8 px-2.5 shadow-md font-semibold border cursor-pointer ${
                isAddVertexMode
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-400 ring-2 ring-amber-300"
                  : "bg-white/95 hover:bg-white text-slate-800 border-slate-200"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              {isAddVertexMode ? "Klik Peta untuk Sudut Baru" : "+ Tambah Sudut"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="bg-white/95 hover:bg-white text-slate-800 text-[11px] h-8 px-2.5 shadow-md font-semibold border border-slate-200 cursor-pointer"
          >
            <Navigation className={`w-3.5 h-3.5 mr-1 text-emerald-600 ${isLocating ? "animate-spin" : ""}`} />
            {isLocating ? "Mencari GPS..." : "Lokasi Saya"}
          </Button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kontainer Kanvas Peta Leaflet */}
      <div ref={mapContainerRef} className="w-full h-[380px] z-0" />

      {/* Bottom Hint */}
      <div className="bg-slate-900 text-slate-300 px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-1 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          {isStpMode ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white"></span>
              <span className="text-amber-300 font-semibold">
                Geser (drag) titik bulat nomor 1-{activePolyRef.current.length} pada peta untuk mengubah batas perimeter tapak, atau atur angka presisi di tabel bawah.
              </span>
            </>
          ) : (
            <span>💡 Geser pin hijau atau klik peta untuk memindahkan titik pusat kantor.</span>
          )}
        </span>
        <span className="font-mono text-emerald-400 font-medium">OpenStreetMap</span>
      </div>
    </div>
  );
}
