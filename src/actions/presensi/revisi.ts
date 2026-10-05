"use server";

import { adminPresensiDb, isFirebaseAdminConfigured } from "@/lib/presensi/firebase-admin";
import { requireAuth } from "@/lib/presensi/session";
import {
  PermohonanRevisiPresensi,
  JenisRevisiPresensi,
  StatusRevisiPresensi,
  PresensiStatus,
  PresensiRecord,
} from "@/types/presensi";
import { getDevRevisiStore, getDevPresensiStore } from "@/data/presensi/seedData";
import { recordAuditLog } from "@/actions/presensi/audit";
import { AjukanRevisiPresensiSchema } from "@/lib/presensi/validations";
import { getWIBDateString } from "@/lib/presensi/utils";
import { sendPushNotification } from "@/lib/presensi/fcm";

/**
 * Mengambil daftar permohonan revisi presensi.
 * - Pegawai: hanya melihat permohonannya sendiri.
 * - Atasan / Admin: dapat melihat seluruh permohonan dalam organisasinya.
 */
export async function getDaftarRevisiPresensiAction(params?: {
  status?: StatusRevisiPresensi;
  userId?: string;
}): Promise<PermohonanRevisiPresensi[]> {
  const sessionUser = await requireAuth();

  const filterUserId =
    sessionUser.role === "pegawai" ? sessionUser.id : params?.userId;

  if (isFirebaseAdminConfigured()) {
    try {
      let query: FirebaseFirestore.Query = adminPresensiDb
        .collection("revisi_presensi")
        .where("orgId", "==", sessionUser.orgId)
        .orderBy("createdAt", "desc");

      if (params?.status) {
        query = query.where("status", "==", params.status);
      }
      if (filterUserId) {
        query = query.where("userId", "==", filterUserId);
      }

      const snap = await query.get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as PermohonanRevisiPresensi);
      }
      return [];
    } catch (err) {
      console.warn("[Revisi Presensi] Gagal mengambil dari Firestore:", err);
    }
  }

  // Fallback dev store
  if (process.env.NODE_ENV === "development") {
    let list = Array.from(getDevRevisiStore().values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    if (sessionUser.orgId) {
      list = list.filter((r) => r.orgId === sessionUser.orgId);
    }
    if (params?.status) {
      list = list.filter((r) => r.status === params.status);
    }
    if (filterUserId) {
      list = list.filter((r) => r.userId === filterUserId);
    }

    return list;
  }

  return [];
}

/**
 * Pegawai mengajukan permohonan revisi presensi
 */
export async function ajukanRevisiPresensiAction(payload: {
  tanggal: string; // YYYY-MM-DD
  jenisRevisi: JenisRevisiPresensi;
  statusSemula: PresensiStatus | "belum_absen";
  statusDiajukan: PresensiStatus;
  jamMasukSemula?: string;
  jamMasukDiajukan?: string;
  jamPulangSemula?: string;
  jamPulangDiajukan?: string;
  alasan: string;
  lampiranUrl?: string;
}): Promise<{ success: boolean; data?: PermohonanRevisiPresensi; message?: string }> {
  const sessionUser = await requireAuth();

  // 1. Validasi Zod Skema (BUG-09)
  const validationResult = AjukanRevisiPresensiSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Validasi gagal: " + validationResult.error.issues.map((e) => e.message).join(", "),
    };
  }

  // 2. Validasi Batas Tanggal (H-14 hari kalender dan dilarang tanggal masa depan)
  const todayWibStr = getWIBDateString();
  if (payload.tanggal > todayWibStr) {
    return {
      success: false,
      message: "Tidak dapat mengajukan revisi untuk tanggal di masa depan.",
    };
  }

  const todayDate = new Date(`${todayWibStr}T00:00:00.000Z`);
  const targetDate = new Date(`${payload.tanggal}T00:00:00.000Z`);
  const diffDays = Math.floor((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 14) {
    return {
      success: false,
      message: `Batas pengajuan revisi presensi maksimal 14 hari kalender. Tanggal ${payload.tanggal} telah melewati batas waktu (${diffDays} hari yang lalu).`,
    };
  }

  const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const presensiId = `${sessionUser.id}_${payload.tanggal}`;

  const newRecord: PermohonanRevisiPresensi = {
    id,
    presensiId,
    userId: sessionUser.id,
    nip: sessionUser.nip,
    nama: sessionUser.nama,
    orgId: sessionUser.orgId,
    kantorId: sessionUser.kantorId,
    namaKantor: sessionUser.namaKantor,
    tanggal: payload.tanggal,
    jenisRevisi: payload.jenisRevisi,
    statusSemula: payload.statusSemula,
    statusDiajukan: payload.statusDiajukan,
    jamMasukSemula: payload.jamMasukSemula,
    jamMasukDiajukan: payload.jamMasukDiajukan,
    jamPulangSemula: payload.jamPulangSemula,
    jamPulangDiajukan: payload.jamPulangDiajukan,
    alasan: payload.alasan.trim(),
    lampiranUrl: payload.lampiranUrl,
    status: "menunggu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb.collection("revisi_presensi").doc(id).set(newRecord);
    } catch (err) {
      console.warn("[Revisi Presensi] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevRevisiStore().set(id, newRecord);
  }

  // Audit log
  await recordAuditLog({
    action: "CREATE",
    entityType: "PRESENSI",
    entityId: id,
    details: `Pengajuan revisi presensi tanggal ${payload.tanggal} (${payload.jenisRevisi})`,
  });

  return {
    success: true,
    data: newRecord,
    message: "Permohonan revisi presensi berhasil diajukan dan menunggu persetujuan atasan/admin.",
  };
}

/**
 * Atasan atau Admin menyetujui permohonan revisi presensi.
 * Saat disetujui, PresensiRecord di database otomatis diperbarui sehingga
 * hasil evaluasi, perhitungan statistik, dan dokumen Berita Acara langsung terkoreksi resmi!
 */
export async function approveRevisiPresensiAction(params: {
  revisiId: string;
  catatanReview?: string;
}): Promise<{ success: boolean; data?: PermohonanRevisiPresensi; message?: string }> {
  const sessionUser = await requireAuth(["admin", "atasan"]);

  let revisi: PermohonanRevisiPresensi | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminPresensiDb.collection("revisi_presensi").doc(params.revisiId).get();
      if (snap.exists) {
        revisi = snap.data() as PermohonanRevisiPresensi;
      }
    } catch (err) {
      console.warn("[Revisi Approve] Gagal membaca Firestore:", err);
    }
  }

  if (!revisi && process.env.NODE_ENV === "development") {
    revisi = getDevRevisiStore().get(params.revisiId) || null;
  }

  if (!revisi) {
    return { success: false, message: "Permohonan revisi tidak ditemukan." };
  }

  const nowIso = new Date().toISOString();
  const updatedRevisi: PermohonanRevisiPresensi = {
    ...revisi,
    status: "disetujui",
    catatanReview: params.catatanReview || "Disetujui oleh Administrator / Pejabat Penilai BLUD.",
    reviewedBy: sessionUser.id,
    reviewedByName: sessionUser.nama,
    reviewedAt: nowIso,
    updatedAt: nowIso,
  };

  // ────────────────────────────────────────────────────────────────
  // OTOMATIS REVISI RECORD PRESENSI DI DATABASE
  // ────────────────────────────────────────────────────────────────
  const presensiDocId = revisi.presensiId || `${revisi.userId}_${revisi.tanggal}`;
  let existingPresensi: PresensiRecord | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const pSnap = await adminPresensiDb.collection("presensi").doc(presensiDocId).get();
      if (pSnap.exists) {
        existingPresensi = pSnap.data() as PresensiRecord;
      }
    } catch (err) {
      console.warn("[Revisi Presensi] Gagal mengambil presensi eksisting:", err);
    }
  }

  if (!existingPresensi && process.env.NODE_ENV === "development") {
    existingPresensi = getDevPresensiStore().get(presensiDocId) || null;
  }

  // Waktu ISO untuk checkIn / checkOut yang dikoreksi
  const baseTanggal = revisi.tanggal;
  const jamMasukIso = revisi.jamMasukDiajukan
    ? `${baseTanggal}T${revisi.jamMasukDiajukan}:00.000+07:00`
    : existingPresensi?.checkIn?.waktu;

  const jamPulangIso = revisi.jamPulangDiajukan
    ? `${baseTanggal}T${revisi.jamPulangDiajukan}:00.000+07:00`
    : existingPresensi?.checkOut?.waktu;

  // Hitung durasi kerja jika jam masuk dan pulang tersedia
  let durasiKerjaMenit = existingPresensi?.durasiKerjaMenit || 480;
  if (jamMasukIso && jamPulangIso) {
    try {
      const diffMs = new Date(jamPulangIso).getTime() - new Date(jamMasukIso).getTime();
      durasiKerjaMenit = Math.max(0, Math.round(diffMs / (1000 * 60)));
    } catch {}
  }

  const updatedPresensiRecord: PresensiRecord = {
    id: presensiDocId,
    userId: revisi.userId,
    nip: revisi.nip,
    nama: revisi.nama,
    orgId: revisi.orgId,
    tanggal: revisi.tanggal,
    kantorId: revisi.kantorId || existingPresensi?.kantorId,
    namaKantor: revisi.namaKantor || existingPresensi?.namaKantor || "Solo Technopark",
    status: revisi.statusDiajukan,
    durasiKerjaMenit,
    keterangan: `Revisi Resmi: ${revisi.alasan} (Disetujui oleh: ${sessionUser.nama})`,
    isRevisi: true,
    revisiId: revisi.id,
    revisiNote: params.catatanReview || revisi.alasan,
    revisiBy: sessionUser.nama,
    revisiAt: nowIso,
    checkIn: existingPresensi?.checkIn
      ? {
          ...existingPresensi.checkIn,
          waktu: jamMasukIso || existingPresensi.checkIn.waktu,
          catatan: `${existingPresensi.checkIn.catatan || ""} [Terkoreksi Revisi]`.trim(),
        }
      : {
          waktu: jamMasukIso || `${baseTanggal}T07:30:00.000+07:00`,
          koordinat: { lat: -7.5586, lng: 110.8569 },
          fotoUrl: "",
          isValidLocation: true,
          alamat: "Kawasan Solo Technopark (Revisi Resmi)",
          catatan: "Presensi disahkan melalui mekanisme revisi resmi BLUD.",
        },
    checkOut: jamPulangIso
      ? {
          waktu: jamPulangIso,
          koordinat: existingPresensi?.checkOut?.koordinat || { lat: -7.5586, lng: 110.8569 },
          fotoUrl: existingPresensi?.checkOut?.fotoUrl || "",
          isValidLocation: true,
          alamat: "Kawasan Solo Technopark (Revisi Resmi)",
          catatan: "Check-out disahkan melalui mekanisme revisi resmi BLUD.",
        }
      : existingPresensi?.checkOut,
  };

  // Simpan ke Firestore
  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb
        .collection("revisi_presensi")
        .doc(params.revisiId)
        .set(updatedRevisi, { merge: true });

      await adminPresensiDb
        .collection("presensi")
        .doc(presensiDocId)
        .set(updatedPresensiRecord, { merge: true });
    } catch (err) {
      console.warn("[Revisi Approve] Gagal update data di Firestore:", err);
    }
  }

  // Simpan ke Dev Stores
  if (process.env.NODE_ENV === "development") {
    getDevRevisiStore().set(params.revisiId, updatedRevisi);
    getDevPresensiStore().set(presensiDocId, updatedPresensiRecord);
  }

  // Rekam Jejak Audit
  await recordAuditLog({
    action: "UPDATE",
    entityType: "PRESENSI",
    entityId: presensiDocId,
    details: `Revisi presensi disetujui untuk ${revisi.nama} (${revisi.tanggal}): Status ${revisi.statusSemula} -> ${revisi.statusDiajukan}`,
  });

  // UX-01: Kirim Notifikasi Push ke Pegawai Pemohon
  try {
    await sendPushNotification({
      userId: revisi.userId,
      title: "Permohonan Revisi Presensi Disetujui",
      body: `Permohonan revisi presensi tanggal ${revisi.tanggal} telah disetujui oleh ${sessionUser.nama}.`,
      data: { revisiId: revisi.id, type: "REVISI_APPROVED" },
    });
  } catch (notifErr) {
    console.warn("[Revisi Approve] Gagal kirim notifikasi push:", notifErr);
  }

  return {
    success: true,
    data: updatedRevisi,
    message: `Permohonan revisi ${revisi.nama} berhasil disetujui. Data presensi dan rekapitulasi Berita Acara telah diperbarui.`,
  };
}

/**
 * Atasan atau Admin menolak permohonan revisi presensi
 */
export async function rejectRevisiPresensiAction(params: {
  revisiId: string;
  alasanPenolakan: string;
}): Promise<{ success: boolean; data?: PermohonanRevisiPresensi; message?: string }> {
  const sessionUser = await requireAuth(["admin", "atasan"]);

  if (!params.alasanPenolakan?.trim()) {
    return { success: false, message: "Alasan penolakan permohonan revisi wajib diisi." };
  }

  let revisi: PermohonanRevisiPresensi | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminPresensiDb.collection("revisi_presensi").doc(params.revisiId).get();
      if (snap.exists) {
        revisi = snap.data() as PermohonanRevisiPresensi;
      }
    } catch (err) {
      console.warn("[Revisi Reject] Gagal membaca Firestore:", err);
    }
  }

  if (!revisi && process.env.NODE_ENV === "development") {
    revisi = getDevRevisiStore().get(params.revisiId) || null;
  }

  if (!revisi) {
    return { success: false, message: "Permohonan revisi tidak ditemukan." };
  }

  const nowIso = new Date().toISOString();
  const updatedRevisi: PermohonanRevisiPresensi = {
    ...revisi,
    status: "ditolak",
    catatanReview: params.alasanPenolakan.trim(),
    reviewedBy: sessionUser.id,
    reviewedByName: sessionUser.nama,
    reviewedAt: nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb
        .collection("revisi_presensi")
        .doc(params.revisiId)
        .set(updatedRevisi, { merge: true });
    } catch (err) {
      console.warn("[Revisi Reject] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevRevisiStore().set(params.revisiId, updatedRevisi);
  }

  await recordAuditLog({
    action: "UPDATE",
    entityType: "PRESENSI",
    entityId: params.revisiId,
    details: `Permohonan revisi ${revisi.nama} ditolak: ${params.alasanPenolakan}`,
  });

  // UX-01: Kirim Notifikasi Push ke Pegawai Pemohon
  try {
    await sendPushNotification({
      userId: revisi.userId,
      title: "Permohonan Revisi Presensi Ditolak",
      body: `Permohonan revisi tanggal ${revisi.tanggal} ditolak: ${params.alasanPenolakan}`,
      data: { revisiId: revisi.id, type: "REVISI_REJECTED" },
    });
  } catch (notifErr) {
    console.warn("[Revisi Reject] Gagal kirim notifikasi push:", notifErr);
  }

  return {
    success: true,
    data: updatedRevisi,
    message: "Permohonan revisi presensi telah ditolak.",
  };
}

/**
 * Koreksi Presensi Langsung oleh Administrator (Quick Administrative Override)
 * Digunakan oleh Admin BLUD untuk mengoreksi data presensi pegawai secara langsung
 * sebelum mencetak Berita Acara.
 */
export async function koreksiPresensiLangsungAction(params: {
  userId: string;
  nip: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  statusBaru: PresensiStatus;
  jamMasuk?: string; // misal "07:30"
  jamPulang?: string; // misal "16:30"
  alasanKoreksi: string;
}): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  const sessionUser = await requireAuth(["admin"]);

  if (!params.tanggal || !params.alasanKoreksi?.trim()) {
    return { success: false, message: "Tanggal dan alasan koreksi wajib diisi." };
  }

  const docId = `${params.userId}_${params.tanggal}`;
  const nowIso = new Date().toISOString();

  let existing: PresensiRecord | null = null;
  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminPresensiDb.collection("presensi").doc(docId).get();
      if (snap.exists) existing = snap.data() as PresensiRecord;
    } catch {}
  }
  if (!existing && process.env.NODE_ENV === "development") {
    existing = getDevPresensiStore().get(docId) || null;
  }

  const jamMasukIso = params.jamMasuk
    ? `${params.tanggal}T${params.jamMasuk}:00.000+07:00`
    : existing?.checkIn?.waktu || `${params.tanggal}T07:30:00.000+07:00`;

  const jamPulangIso = params.jamPulang
    ? `${params.tanggal}T${params.jamPulang}:00.000+07:00`
    : existing?.checkOut?.waktu;

  let durasiKerjaMenit = existing?.durasiKerjaMenit || 480;
  if (jamMasukIso && jamPulangIso) {
    try {
      const diffMs = new Date(jamPulangIso).getTime() - new Date(jamMasukIso).getTime();
      durasiKerjaMenit = Math.max(0, Math.round(diffMs / (1000 * 60)));
    } catch {}
  }

  const correctedRecord: PresensiRecord = {
    id: docId,
    userId: params.userId,
    nip: params.nip,
    nama: params.nama,
    orgId: sessionUser.orgId,
    tanggal: params.tanggal,
    status: params.statusBaru,
    durasiKerjaMenit,
    keterangan: `Koreksi Admin: ${params.alasanKoreksi.trim()} (Oleh: ${sessionUser.nama})`,
    isRevisi: true,
    revisiNote: params.alasanKoreksi.trim(),
    revisiBy: sessionUser.nama,
    revisiAt: nowIso,
    checkIn: {
      waktu: jamMasukIso,
      koordinat: existing?.checkIn?.koordinat || { lat: -7.5586, lng: 110.8569 },
      fotoUrl: existing?.checkIn?.fotoUrl || "",
      isValidLocation: true,
      alamat: "Kawasan Solo Technopark (Koreksi Admin)",
      catatan: "Disahkan melalui Koreksi Administratif BLUD.",
    },
    checkOut: jamPulangIso
      ? {
          waktu: jamPulangIso,
          koordinat: existing?.checkOut?.koordinat || { lat: -7.5586, lng: 110.8569 },
          fotoUrl: existing?.checkOut?.fotoUrl || "",
          isValidLocation: true,
          alamat: "Kawasan Solo Technopark (Koreksi Admin)",
          catatan: "Disahkan melalui Koreksi Administratif BLUD.",
        }
      : undefined,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb.collection("presensi").doc(docId).set(correctedRecord, { merge: true });
    } catch (err) {
      console.warn("[Koreksi Admin] Gagal set di Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevPresensiStore().set(docId, correctedRecord);
  }

  await recordAuditLog({
    action: "UPDATE",
    entityType: "PRESENSI",
    entityId: docId,
    details: `Koreksi presensi langsung oleh admin ${sessionUser.nama} untuk ${params.nama} (${params.tanggal}): Status -> ${params.statusBaru}`,
  });

  return {
    success: true,
    data: correctedRecord,
    message: `Data presensi ${params.nama} tanggal ${params.tanggal} berhasil dikoreksi menjadi "${params.statusBaru.toUpperCase()}".`,
  };
}
