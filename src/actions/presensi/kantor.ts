"use server";

import { adminPresensiDb, isFirebaseAdminConfigured } from "@/lib/presensi/firebase-admin";
import { requireAuth } from "@/lib/presensi/session";
import { KantorUnit } from "@/types/presensi";
import { DEFAULT_KANTOR_LIST, KAWASAN_STP_POLYGON } from "@/data/presensi/masterKantor";

const globalAny = global as any;
const devKantorStore: Map<string, KantorUnit> = globalAny.devKantorStore || new Map(DEFAULT_KANTOR_LIST.map((k: KantorUnit) => [k.id, k]));
if (process.env.NODE_ENV !== "production") {
  globalAny.devKantorStore = devKantorStore;
}

/**
 * Mengambil daftar seluruh kantor terdaftar dari Firestore.
 * Jika Firestore kosong (bukan error), fallback ke DEFAULT_KANTOR_LIST.
 */
export async function getKantorList(orgId?: string): Promise<KantorUnit[]> {
  const sessionUser = await requireAuth();
  const targetOrgId = orgId || sessionUser.orgId;

  try {
    let query = adminPresensiDb.collection("kantor").where("isActive", "==", true);
    query = query.where("orgId", "==", targetOrgId);
    const snap = await query.get();

    if (!snap.empty) {
      return snap.docs.map((doc) => {
        const d = doc.data() as any;
        let lat =
          d.koordinat?.lat ??
          d.koordinat?.latitude ??
          d.koordinat?._latitude ??
          d.lat ??
          d.latitude ??
          -7.5558;
        let lng =
          d.koordinat?.lng ??
          d.koordinat?.longitude ??
          d.koordinat?._longitude ??
          d.lng ??
          d.longitude ??
          110.8548;

        const nama = d.namaKantor || "Kantor ASN";
        const isStp =
          doc.id === "kantor-stp-pusat" ||
          doc.id.toLowerCase().includes("stp") ||
          nama.toLowerCase().includes("technopark") ||
          nama.toLowerCase().includes("stp");

        // Jika koordinat masih mengarah ke titik UNS (< -7.5562 atau > 110.8550), sinkronkan ke centroid STP murni
        if (isStp && typeof lat === "number" && (lat < -7.5562 || lat > -7.5535 || lng > 110.8550 || lng < 110.8520)) {
          lat = -7.5550;
          lng = 110.8535;
        }

        const rawRadius = typeof d.radiusMeter === "number" ? d.radiusMeter : 150;
        const radiusMeter = isStp ? Math.max(rawRadius, 200) : rawRadius;

        const geofenceType = isStp || d.geofenceType === "polygon" ? "polygon" : (d.geofenceType || "radius");
        const polygonCoordinates = isStp || d.geofenceType === "polygon"
          ? (Array.isArray(d.polygonCoordinates) && d.polygonCoordinates.length >= 3 ? d.polygonCoordinates : KAWASAN_STP_POLYGON)
          : undefined;

        return {
          id: doc.id,
          kodeKantor: d.kodeKantor || "KTR",
          namaKantor: nama,
          kategori: d.kategori || "OPD / Dinas",
          alamat: d.alamat || "",
          koordinat: {
            lat: typeof lat === "number" ? lat : parseFloat(lat) || -7.5550,
            lng: typeof lng === "number" ? lng : parseFloat(lng) || 110.8535,
          },
          radiusMeter,
          jamMasukMaksimal: d.jamMasukMaksimal || "07:30",
          jamPulangMinimal: d.jamPulangMinimal || "16:00",
          orgId: d.orgId || "solotechnopark",
          isActive: d.isActive !== false,
          geofenceType,
          polygonCoordinates,
        } as KantorUnit;
      });
    }

    // Jika Firestore kosong, inisialisasi default Solo Technopark agar presensi tetap presisi
    console.info("[Server Action Kantor] Koleksi kantor kosong, menggunakan master Solo Technopark.");
    return DEFAULT_KANTOR_LIST;
  } catch (error) {
    console.warn("[Server Action Kantor] Gagal mengambil kantor dari Firestore:", error);
    if (process.env.NODE_ENV === "development") {
      const devList = Array.from(devKantorStore.values()).filter((k) => k.orgId === targetOrgId);
      return devList.length > 0 ? devList : DEFAULT_KANTOR_LIST;
    }
    return DEFAULT_KANTOR_LIST;
  }
}

/**
 * Menyimpan atau memperbarui data titik kantor.
 * Hanya dapat diakses oleh role admin.
 */
export async function saveKantor(
  kantor: KantorUnit
): Promise<{ success: boolean; data?: KantorUnit; message?: string }> {
  // Validasi sesi — hanya admin
  await requireAuth(["admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb.collection("kantor").doc(kantor.id).set(kantor, { merge: true });
    } catch (err) {
      console.warn("[Kantor] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devKantorStore.set(kantor.id, kantor);
  }

  return { success: true, data: kantor, message: "Data kantor berhasil disimpan." };
}

/**
 * Menghapus atau menonaktifkan kantor.
 * Hanya dapat diakses oleh role admin.
 */
export async function deleteKantor(
  kantorId: string
): Promise<{ success: boolean; message?: string }> {
  // Validasi sesi — hanya admin
  await requireAuth(["admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb.collection("kantor").doc(kantorId).delete();
    } catch (err) {
      console.warn("[Kantor] Gagal menghapus dari Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devKantorStore.delete(kantorId);
  }

  return { success: true, message: "Kantor berhasil dihapus." };
}
