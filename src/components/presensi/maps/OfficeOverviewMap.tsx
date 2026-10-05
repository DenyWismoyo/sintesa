"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KantorUnit } from "@/types/presensi";
import { Badge } from "@/components/ui/badge";
import { Building2, Layers, MapPin, Compass } from "lucide-react";
import {
  KAWASAN_STP_POLYGON,
  STP_CAMPUS_ANCHORS,
  isSoloTechnoparkOffice,
} from "@/data/presensi/masterKantor";

export interface OfficeOverviewMapProps {
  offices: KantorUnit[];
  className?: string;
}

function createOfficePinIcon(category: string, isActive: boolean) {
  const bgClass = !isActive
    ? "bg-slate-500"
    : category === "Pusat"
    ? "bg-amber-600"
    : "bg-emerald-600";

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
      <div class="w-7 h-7 rounded-full ${bgClass} border-2 border-white shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-overview-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function createAnchorPinIcon(nama: string) {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" title="${nama}">
      <div class="w-3.5 h-3.5 rounded-full bg-teal-600 border border-white shadow-xs flex items-center justify-center transition-transform group-hover:scale-150">
        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-anchor-pin",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function OfficeOverviewMap({
  offices,
  className = "",
}: OfficeOverviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Titik pusat Kawasan Solo Technopark (Centroid Murni)
    const centerLat = -7.5550;
    const centerLng = 110.8535;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const bounds: L.LatLngTuple[] = [];
    let hasStpPolygonDrawn = false;

    // Tambahkan marker dan geofence untuk setiap kantor
    offices.forEach((office) => {
      if (!office?.koordinat?.lat || !office?.koordinat?.lng) return;
      const latlng: L.LatLngTuple = [office.koordinat.lat, office.koordinat.lng];
      bounds.push(latlng);

      const isStp = isSoloTechnoparkOffice(office) || office.geofenceType === "polygon";

      if (isStp) {
        // GAMBARKAN POLIGON KAWASAN RESMI SOLO TECHNOPARK (~8 Hektar, Murni Tanpa UNS)
        if (!hasStpPolygonDrawn) {
          hasStpPolygonDrawn = true;
          const activePoly =
            office.polygonCoordinates && office.polygonCoordinates.length >= 3
              ? office.polygonCoordinates
              : KAWASAN_STP_POLYGON;
          const polygonCoords = activePoly.map(
            (p) => [p.lat, p.lng] as L.LatLngTuple
          );

          // Daftarkan semua titik poligon ke bounds agar peta terpusat presisi
          polygonCoords.forEach((pt) => bounds.push(pt));

          const stpPolygon = L.polygon(polygonCoords, {
            color: "#059669", // Emerald border
            fillColor: "#10b981", // Emerald fill
            fillOpacity: 0.24,
            weight: 2.5,
            dashArray: "5, 5",
          }).addTo(map);

          stpPolygon.bindPopup(`
            <div class="p-1 font-sans text-xs max-w-[240px]">
              <div class="font-bold text-emerald-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🏢 Poligon Kawasan Solo Technopark</span>
              </div>
              <div class="text-[11px] text-slate-600 mb-2 leading-snug">
                Batas perimeter fisik tapak tanah resmi Solo Technopark (~8 Hektar, sisi utara Jl. Ki Hajar Dewantara). Sama sekali tidak mencakup kampus UNS.
              </div>
              <div class="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 space-y-0.5">
                <div><strong>• Gedung:</strong> Pusat, STC, SCC, Diklat, Hanggar</div>
                <div><strong>• Kawasan:</strong> STP Arena, Lapangan, Parkiran Timur</div>
              </div>
            </div>
          `);

          // Tambahkan titik-titik jangkar fasilitas utama STP
          STP_CAMPUS_ANCHORS.forEach((anchor) => {
            const anchorPt: L.LatLngTuple = [anchor.lat, anchor.lng];
            bounds.push(anchorPt);
            const anchorMarker = L.marker(anchorPt, {
              icon: createAnchorPinIcon(anchor.nama),
            }).addTo(map);

            anchorMarker.bindPopup(`
              <div class="p-1 text-xs">
                <div class="font-bold text-teal-900 mb-0.5">${anchor.nama}</div>
                <div class="text-[10px] text-slate-500">Fasilitas Resmi Kawasan Solo Technopark</div>
                <div class="text-[10px] text-emerald-600 font-semibold mt-1">Presensi di titik ini otomatis Valid</div>
              </div>
            `);
          });
        }

        // Marker pusat STP
        const marker = L.marker(latlng, {
          icon: createOfficePinIcon(office.kategori, office.isActive),
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-slate-900 text-sm mb-1">${office.namaKantor}</div>
            <div class="text-[11px] text-slate-600 mb-1.5">${office.alamat}</div>
            <div class="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold mb-1">
              <span>📐 Tipe Geofence: <strong>Poligon Kawasan STP (8 Ha)</strong></span>
            </div>
            <div class="text-[10px] text-slate-500 font-mono">
              Lat: ${office.koordinat.lat.toFixed(5)}, Lng: ${office.koordinat.lng.toFixed(5)}
            </div>
            <div class="text-[10px] text-slate-500 mt-1">
              Jam Kerja: ${office.jamMasukMaksimal || "07:30"} - ${office.jamPulangMinimal || "16:00"} WIB
            </div>
          </div>
        `);
      } else {
        // Kantor konvensional / luar kawasan: gambarkan radius lingkaran bulat
        L.circle(latlng, {
          radius: office.radiusMeter || 150,
          color: office.isActive ? "#059669" : "#64748b",
          fillColor: office.isActive ? "#10b981" : "#94a3b8",
          fillOpacity: 0.18,
          weight: 1.5,
        }).addTo(map);

        const marker = L.marker(latlng, {
          icon: createOfficePinIcon(office.kategori, office.isActive),
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-slate-900 text-sm mb-1">${office.namaKantor}</div>
            <div class="text-[11px] text-slate-600 mb-1.5">${office.alamat}</div>
            <div class="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold mb-1">
              <span>⭕ Radius Lingkaran: ${office.radiusMeter} meter</span>
            </div>
            <div class="text-[10px] text-slate-500 font-mono">
              Lat: ${office.koordinat.lat.toFixed(5)}, Lng: ${office.koordinat.lng.toFixed(5)}
            </div>
          </div>
        `);
      }
    });

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 16);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [offices]);

  return (
    <div className={`relative flex flex-col card-base overflow-hidden bg-white ${className}`}>
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm">Peta Sebaran Titik Geofence Kawasan STP & Unit Kerja</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-white inline-block"></span>
            <strong>Poligon Kawasan STP (~8 Ha)</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span> 10 Titik Fasilitas Terpadu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Balai Kota / Pusat
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-[360px] z-0" />
    </div>
  );
}
