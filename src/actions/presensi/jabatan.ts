"use server";

import { adminPresensiDb, isFirebaseAdminConfigured } from "@/lib/presensi/firebase-admin";
import { requireAuth } from "@/lib/presensi/session";
import { MasterJabatan } from "@/types/presensi";
import { DEFAULT_JABATAN_LIST } from "@/data/presensi/masterJabatan";
import {
  getDevJabatanStore,
  addDevJabatan,
  updateDevJabatan,
  deleteDevJabatan,
  resetDevJabatan,
} from "@/data/presensi/seedData";

/**
 * Mengambil daftar seluruh master jabatan terdaftar.
 * Akses: Semua pengguna terautentikasi (admin & pegawai untuk referensi form).
 * Diurutkan berdasarkan level hierarki (Level 1 teratas).
 */
export async function getJabatanList(orgId?: string): Promise<MasterJabatan[]> {
  const sessionUser = await requireAuth(["admin", "pegawai"]);
  const targetOrgId = orgId || sessionUser.orgId || "solotechnopark";

  let list: MasterJabatan[] = [];

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminPresensiDb
        .collection("jabatan")
        .where("orgId", "==", targetOrgId)
        .get();

      if (!snap.empty) {
        list = snap.docs.map((doc) => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            namaJabatan: d.namaJabatan || "",
            level: Number(d.level) || 9,
            parentJabatanId: d.parentJabatanId || null,
            parentJabatanNama: d.parentJabatanNama || null,
            departemen: d.departemen || "",
            tipeJabatan: d.tipeJabatan || "pelaksana",
            status: d.status || "aktif",
            keterangan: d.keterangan || "",
            orgId: d.orgId || targetOrgId,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          } as MasterJabatan;
        });
      }
    } catch (err) {
      console.warn("[Jabatan Action] Gagal membaca koleksi Firestore:", err);
    }
  }

  // Fallback Dev Store & Default Seed jika Firestore kosong atau mode development
  if (list.length === 0) {
    const devStore = getDevJabatanStore();
    list = Array.from(devStore.values()).filter(
      (j) => !j.orgId || j.orgId === targetOrgId
    );
    if (list.length === 0) {
      list = [...DEFAULT_JABATAN_LIST];
    }
  }

  // Urutkan berdasarkan level ASC (1 paling tinggi), lalu nama ASC
  return list.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.namaJabatan.localeCompare(b.namaJabatan);
  });
}

/**
 * Menyimpan master jabatan baru atau mengupdate jabatan yang sudah ada.
 * Akses: Khusus Administrator.
 */
export async function saveJabatan(
  payload: Partial<MasterJabatan> & { namaJabatan: string; level: number }
): Promise<{ success: boolean; message: string; data?: MasterJabatan }> {
  const sessionUser = await requireAuth(["admin"]);
  const targetOrgId = sessionUser.orgId || "solotechnopark";

  if (!payload.namaJabatan || !payload.namaJabatan.trim()) {
    return { success: false, message: "Nama jabatan wajib diisi." };
  }

  const levelNum = Math.max(1, Math.floor(Number(payload.level) || 9));

  // Resolusi nama parent jabatan jika ada parentJabatanId
  let resolvedParentNama = payload.parentJabatanNama || null;
  if (payload.parentJabatanId) {
    const allJabatan = await getJabatanList(targetOrgId);
    const parentObj = allJabatan.find((j) => j.id === payload.parentJabatanId);
    if (parentObj) {
      resolvedParentNama = parentObj.namaJabatan;
      // Validasi: Atasan tidak boleh memiliki level yang lebih rendah atau sama
      if (parentObj.level >= levelNum && payload.id !== parentObj.id) {
        return {
          success: false,
          message: `Atasan (${parentObj.namaJabatan} - Level ${parentObj.level}) harus memiliki level angka lebih kecil dari jabatan ini (Level ${levelNum}).`,
        };
      }
    }
  }

  const now = new Date().toISOString();
  const id =
    payload.id ||
    `jbt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const cleanData: MasterJabatan = {
    id,
    namaJabatan: payload.namaJabatan.trim(),
    level: levelNum,
    parentJabatanId: payload.parentJabatanId || null,
    parentJabatanNama: resolvedParentNama,
    departemen: payload.departemen?.trim() || "",
    tipeJabatan: payload.tipeJabatan || "pelaksana",
    status: payload.status || "aktif",
    keterangan: payload.keterangan?.trim() || "",
    orgId: targetOrgId,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb
        .collection("jabatan")
        .doc(id)
        .set(cleanData, { merge: true });
    } catch (err) {
      console.warn("[Jabatan Action] Gagal menyimpan ke Firestore:", err);
    }
  }

  // Update in-memory dev store
  addDevJabatan(cleanData);

  return {
    success: true,
    message: payload.id
      ? `Jabatan "${cleanData.namaJabatan}" berhasil diperbarui.`
      : `Jabatan baru "${cleanData.namaJabatan}" berhasil ditambahkan.`,
    data: cleanData,
  };
}

/**
 * Menghapus jabatan dari master data.
 * Akses: Khusus Administrator.
 */
export async function deleteJabatan(
  id: string
): Promise<{ success: boolean; message: string }> {
  await requireAuth(["admin"]);

  if (!id) {
    return { success: false, message: "ID jabatan tidak valid." };
  }

  if (isFirebaseAdminConfigured()) {
    try {
      await adminPresensiDb.collection("jabatan").doc(id).delete();
    } catch (err) {
      console.warn("[Jabatan Action] Gagal menghapus dari Firestore:", err);
    }
  }

  deleteDevJabatan(id);

  return {
    success: true,
    message: "Jabatan berhasil dihapus dari sistem.",
  };
}

/**
 * Mereset atau menginisialisasi master jabatan ke setelan bawaan Solo Technopark.
 * Akses: Khusus Administrator.
 */
export async function seedDefaultJabatan(): Promise<{
  success: boolean;
  message: string;
}> {
  const sessionUser = await requireAuth(["admin"]);
  const targetOrgId = sessionUser.orgId || "solotechnopark";

  resetDevJabatan();

  if (isFirebaseAdminConfigured()) {
    try {
      const batch = adminPresensiDb.batch();
      for (const jbt of DEFAULT_JABATAN_LIST) {
        const ref = adminPresensiDb.collection("jabatan").doc(jbt.id);
        batch.set(ref, { ...jbt, orgId: targetOrgId }, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn("[Jabatan Action] Gagal seeding ke Firestore:", err);
    }
  }

  return {
    success: true,
    message: `Berhasil menginisialisasi ${DEFAULT_JABATAN_LIST.length} jabatan master Solo Technopark.`,
  };
}
