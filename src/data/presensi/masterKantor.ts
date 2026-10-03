// src/data/presensi/masterKantor.ts
import { KantorUnit, GeolocationPoint } from "@/types/presensi";

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
    lat: Number(process.env.NEXT_PUBLIC_OFFICE_LAT || -7.558778),
    lng: Number(process.env.NEXT_PUBLIC_OFFICE_LNG || 110.855913),
  },
  radiusMeter: Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS_METERS || 150),
  jamMasukMaksimal: "08:00",
  jamPulangMinimal: "16:00",
  orgId: "solotechnopark",
  isActive: true,
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

export interface NearestOfficeResult {
  nearestOffice: KantorUnit;
  distanceMeters: number;
  isWithinRadius: boolean;
  allOfficesWithDistance: Array<{
    office: KantorUnit;
    distanceMeters: number;
    isWithinRadius: boolean;
  }>;
}

/**
 * Mendeteksi kantor terdekat secara otomatis dari daftar seluruh kantor aktif
 */
export function detectNearestOffice(
  userCoords: GeolocationPoint,
  officeList: KantorUnit[] = DEFAULT_KANTOR_LIST
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

      return {
        ...office,
        koordinat: { lat, lng },
        radiusMeter: typeof office?.radiusMeter === "number" ? office.radiusMeter : 150,
      } as KantorUnit;
    }
  );

  const calculated = validOffices.map((office) => {
    const distanceMeters = calculateHaversineDistance(userCoords, office.koordinat);
    const isWithinRadius = distanceMeters <= office.radiusMeter;
    return {
      office,
      distanceMeters,
      isWithinRadius,
    };
  });

  calculated.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const best = calculated[0] || {
    office: KANTOR_SOLO_TECHNOPARK,
    distanceMeters: 999999,
    isWithinRadius: false,
  };

  return {
    nearestOffice: best.office,
    distanceMeters: best.distanceMeters,
    isWithinRadius: best.isWithinRadius,
    allOfficesWithDistance: calculated,
  };
}

/**
 * Batas Poligon Fisik Kawasan UPTD KST Solo Technopark (Luas ~8 Hektar)
 * Jl. Ki Hajar Dewantara No. 19, Jebres, Kota Surakarta
 */
export const KAWASAN_STP_POLYGON: GeolocationPoint[] = [
  { lat: -7.55745, lng: 110.8548 }, // Gerbang Barat / Jl Ki Hajar Dewantara
  { lat: -7.55735, lng: 110.8572 }, // Gerbang Timur / Jl Ki Hajar Dewantara
  { lat: -7.5592, lng: 110.8576 },  // Sudut Tenggara (Solo Trade Center / STC)
  { lat: -7.56015, lng: 110.8565 }, // Sudut Selatan (Hanggar Welding & Workshop)
  { lat: -7.55985, lng: 110.8545 }, // Sudut Barat Daya (STP Arena & Area Lab)
  { lat: -7.5582, lng: 110.8546 },  // Sisi Barat Kawasan STP
];

/**
 * Memverifikasi apakah suatu koordinat berada di dalam kawasan poligon (Ray-Casting Algorithm).
 * Memungkinkan validasi presensi di area hanggar/workshop luas tanpa terkendala drift radius tunggal.
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

