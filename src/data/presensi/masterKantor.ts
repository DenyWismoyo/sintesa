// src/data/presensi/masterKantor.ts
import { KantorUnit, GeolocationPoint } from "@/types/presensi";

/**
 * Titik-Titik Jangkar Fasilitas Resmi di Seluruh Kawasan Solo Technopark (~8 Hektar).
 * Murni di dalam batas tapak tanah Solo Technopark (Utara Jl. Ki Hajar Dewantara),
 * dan SAMA SEKALI TIDAK mencakup wilayah kampus Universitas Sebelas Maret (UNS).
 */
export const STP_CAMPUS_ANCHORS: Array<{ nama: string; lat: number; lng: number }> = [
  { nama: "Gedung Pusat & Layanan ASN STP", lat: -7.5546, lng: 110.8531 },
  { nama: "Gedung Solo Trade Center (STC) & SCC", lat: -7.5549, lng: 110.8541 },
  { nama: "Gedung Diklat & Inkubator Bisnis STP", lat: -7.5543, lng: 110.8531 },
  { nama: "Hanggar Manufaktur, FabLab & Workshop Las", lat: -7.5554, lng: 110.8538 },
  { nama: "STP Arena & Lapangan Terbuka Exhibition", lat: -7.5556, lng: 110.8532 },
  { nama: "Gerbang Utama & Halte Solo Technopark", lat: -7.5561, lng: 110.8535 },
  { nama: "Area Parkir Timur & Logistik STP", lat: -7.5552, lng: 110.8544 },
  { nama: "Akses Pintu Barat STP (Jl. Surya)", lat: -7.5553, lng: 110.8527 },
];

/**
 * Menghitung jarak terpendek dari koordinat user ke salah satu fasilitas di Kawasan Solo Technopark.
 */
export function getDistanceToStpCampus(userCoords?: GeolocationPoint | null): {
  minDistanceMeters: number;
  closestAnchorName: string;
  closestAnchorCoords: GeolocationPoint;
} {
  const fallbackCoords = KANTOR_SOLO_TECHNOPARK.koordinat;
  if (!userCoords) {
    return {
      minDistanceMeters: 999999,
      closestAnchorName: "Solo Technopark",
      closestAnchorCoords: fallbackCoords,
    };
  }

  let minDistance = 999999;
  let closestName = "Solo Technopark";
  let closestCoords = fallbackCoords;

  for (const anchor of STP_CAMPUS_ANCHORS) {
    const d = calculateHaversineDistance(userCoords, { lat: anchor.lat, lng: anchor.lng });
    if (d < minDistance) {
      minDistance = d;
      closestName = anchor.nama;
      closestCoords = { lat: anchor.lat, lng: anchor.lng };
    }
  }

  return {
    minDistanceMeters: minDistance,
    closestAnchorName: closestName,
    closestAnchorCoords: closestCoords,
  };
}

/**
 * Batas Poligon Fisik Kawasan Murni UPTD KST Solo Technopark (~8 Hektar).
 * Mengikuti perimeter pagar tapak tanah resmi Solo Technopark (Utara Jl. Ki Hajar Dewantara).
 * SAMA SEKALI TIDAK mencakup wilayah kampus UNS, Fakultas Teknik, FISIP, Danau UNS, ataupun tempat ibadah luar.
 */
export const KAWASAN_STP_POLYGON: GeolocationPoint[] = [
  { lat: -7.5541, lng: 110.8526 }, // Sudut Barat Laut (Akses Jl. Surya Utara)
  { lat: -7.5540, lng: 110.8535 }, // Sisi Utara (Batas Pagar Taman Cerdas Jebres)
  { lat: -7.5542, lng: 110.8545 }, // Sudut Timur Laut (Belakang Solo Trade Center)
  { lat: -7.5549, lng: 110.8546 }, // Sisi Timur (Batas Kantor Kecamatan Jebres)
  { lat: -7.5557, lng: 110.8545 }, // Sudut Tenggara (Area Parkir Timur STP)
  { lat: -7.5562, lng: 110.8536 }, // Gerbang Utama (Tepi Utara Jl. Ki Hajar Dewantara)
  { lat: -7.5562, lng: 110.8526 }, // Sudut Barat Daya (Pagar Depan Jl. Ki Hajar Dewantara)
  { lat: -7.5552, lng: 110.8525 }, // Sisi Barat (Pagar Pembatas AK-Tekstil)
];

/**
 * Titik Kantor Resmi UPTD KST Solo Technopark
 * Alamat: Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126
 */
export const KANTOR_SOLO_TECHNOPARK: KantorUnit = {
  id: "kantor-stp-pusat",
  kodeKantor: "STP-KST",
  namaKantor: "UPTD KST Solo Technopark (Pusat)",
  kategori: "Kawasan Khusus",
  alamat: "Jl. Ki Hajar Dewantara No. 19, Jebres, Surakarta 57126",
  koordinat: {
    lat: Number(process.env.NEXT_PUBLIC_OFFICE_LAT || -7.5550),
    lng: Number(process.env.NEXT_PUBLIC_OFFICE_LNG || 110.8535),
  },
  radiusMeter: Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS_METERS || 200),
  jamMasukMaksimal: "08:00",
  jamPulangMinimal: "16:00",
  orgId: "solotechnopark",
  isActive: true,
  geofenceType: "polygon",
  polygonCoordinates: KAWASAN_STP_POLYGON,
};

export const DEFAULT_KANTOR_LIST: KantorUnit[] = [KANTOR_SOLO_TECHNOPARK];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPointLat(p?: any): number | null {
  if (!p) return null;
  const lat =
    typeof p.lat === "number"
      ? p.lat
      : typeof p.latitude === "number"
      ? p.latitude
      : typeof p._latitude === "number"
      ? p._latitude
      : typeof p.lat === "string"
      ? parseFloat(p.lat)
      : typeof p.latitude === "string"
      ? parseFloat(p.latitude)
      : null;
  return lat !== null && !isNaN(lat) ? lat : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPointLng(p?: any): number | null {
  if (!p) return null;
  const lng =
    typeof p.lng === "number"
      ? p.lng
      : typeof p.longitude === "number"
      ? p.longitude
      : typeof p._longitude === "number"
      ? p._longitude
      : typeof p.lng === "string"
      ? parseFloat(p.lng)
      : typeof p.longitude === "string"
      ? parseFloat(p.longitude)
      : null;
  return lng !== null && !isNaN(lng) ? lng : null;
}

/**
 * Hitung jarak Haversine antara dua titik GPS (dalam meter)
 */
export function calculateHaversineDistance(
  point1?: GeolocationPoint | null,
  point2?: GeolocationPoint | null
): number {
  const lat1 = getPointLat(point1);
  const lng1 = getPointLng(point1);
  const lat2 = getPointLat(point2);
  const lng2 = getPointLng(point2);

  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) {
    return 999999;
  }

  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Menghitung jarak efektif dengan toleransi akurasi GPS (Accuracy Margin).
 * Berguna saat perangkat berada di dalam ruangan / terhubung WiFi di mana satelit GPS memiliki drift ±10-40 meter.
 */
export function calculateEffectiveDistance(
  distanceMeters: number,
  accuracyMeters?: number
): number {
  if (!accuracyMeters || accuracyMeters <= 5) return distanceMeters;
  const tolerance = Math.min(accuracyMeters, 50) * 0.6;
  return Math.max(0, Math.round(distanceMeters - tolerance));
}

/**
 * Memeriksa apakah kantor yang dimaksud berafiliasi dengan kawasan Solo Technopark.
 */
export function isSoloTechnoparkOffice(office?: KantorUnit | null): boolean {
  if (!office) return false;
  const id = (office.id || "").toLowerCase();
  const orgId = (office.orgId || "").toLowerCase();
  const name = (office.namaKantor || "").toLowerCase();
  const address = (office.alamat || "").toLowerCase();

  if (id === "kantor-stp-pusat" || id.includes("stp") || id.includes("technopark")) return true;
  if (orgId === "solotechnopark" || orgId.includes("stp")) return true;
  if (name.includes("technopark") || name.includes("stp")) return true;
  if (address.includes("ki hajar dewantara") || address.includes("technopark")) return true;

  if (office.koordinat && isPointInPolygon(office.koordinat)) {
    return true;
  }

  return false;
}

export interface NearestOfficeResult {
  nearestOffice: KantorUnit;
  distanceMeters: number;
  effectiveDistanceMeters: number;
  isWithinRadius: boolean;
  closestFacilityName?: string;
  allOfficesWithDistance: Array<{
    office: KantorUnit;
    distanceMeters: number;
    effectiveDistanceMeters: number;
    isWithinRadius: boolean;
  }>;
}

/**
 * Mendeteksi kantor terdekat secara otomatis dari daftar seluruh kantor aktif
 */
export function detectNearestOffice(
  userCoords: GeolocationPoint,
  officeList: KantorUnit[] = DEFAULT_KANTOR_LIST,
  gpsAccuracyMeters?: number
): NearestOfficeResult {
  const rawList = Array.isArray(officeList) && officeList.length > 0 ? officeList : DEFAULT_KANTOR_LIST;
  const activeOffices = rawList.filter((o) => o && o.isActive !== false);

  const validOffices = (activeOffices.length > 0 ? activeOffices : DEFAULT_KANTOR_LIST).map(
    (office) => {
      const lat =
        getPointLat(office?.koordinat) ??
        getPointLat(office) ??
        KANTOR_SOLO_TECHNOPARK.koordinat.lat;
      const lng =
        getPointLng(office?.koordinat) ??
        getPointLng(office) ??
        KANTOR_SOLO_TECHNOPARK.koordinat.lng;

      const rawRadius = typeof office?.radiusMeter === "number" ? office.radiusMeter : 150;
      // Untuk kawasan murni Solo Technopark seluas ~8 hektar, batas radius toleransi adalah 200 meter
      const radiusMeter = isSoloTechnoparkOffice(office) ? Math.max(rawRadius, 200) : rawRadius;

      return {
        ...office,
        koordinat: { lat, lng },
        radiusMeter,
      } as KantorUnit;
    }
  );

  let closestFacility = "Solo Technopark";

  const calculated = validOffices.map((office) => {
    let distanceMeters = calculateHaversineDistance(userCoords, office.koordinat);

    // Jika ini kantor Solo Technopark, hitung ke fasilitas terdekat di kawasan STP murni
    if (isSoloTechnoparkOffice(office)) {
      const stpCampus = getDistanceToStpCampus(userCoords);
      distanceMeters = stpCampus.minDistanceMeters;
      closestFacility = stpCampus.closestAnchorName;
    }

    const effectiveDistanceMeters = calculateEffectiveDistance(distanceMeters, gpsAccuracyMeters);
    let isWithinRadius = false;
    if (isSoloTechnoparkOffice(office) || office.geofenceType === "polygon") {
      const insidePoly = isPointInPolygon(userCoords, office.polygonCoordinates || KAWASAN_STP_POLYGON);
      isWithinRadius = insidePoly || effectiveDistanceMeters <= office.radiusMeter;
    } else {
      isWithinRadius = effectiveDistanceMeters <= office.radiusMeter;
    }

    return {
      office,
      distanceMeters,
      effectiveDistanceMeters,
      isWithinRadius,
    };
  });

  calculated.sort((a, b) => a.effectiveDistanceMeters - b.effectiveDistanceMeters);

  const best = calculated[0] || {
    office: KANTOR_SOLO_TECHNOPARK,
    distanceMeters: 999999,
    effectiveDistanceMeters: 999999,
    isWithinRadius: false,
  };

  return {
    nearestOffice: best.office,
    distanceMeters: best.distanceMeters,
    effectiveDistanceMeters: best.effectiveDistanceMeters,
    isWithinRadius: best.isWithinRadius,
    closestFacilityName: closestFacility,
    allOfficesWithDistance: calculated,
  };
}


/**
 * Memverifikasi apakah suatu koordinat berada di dalam kawasan poligon (Ray-Casting Algorithm).
 */
export function isPointInPolygon(
  point?: GeolocationPoint | null,
  polygon: GeolocationPoint[] = KAWASAN_STP_POLYGON
): boolean {
  const lat = getPointLat(point);
  const lng = getPointLng(point);
  if (lat === null || lng === null || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

