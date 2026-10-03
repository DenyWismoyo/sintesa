// src/lib/presensi/auth-helpers.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, presensiDb as db } from "@/lib/firebase";
import { UserProfile } from "@/types/presensi";
import { getStpUserProfileByEmail } from "@/data/presensi/stpUsers";

/**
 * Mengambil profil pegawai dari Firestore named database `presensi-pegawai` koleksi `users/{uid}`
 */
export async function getUserProfileFromFirestore(
  uid: string,
  userEmail?: string | null
): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    console.warn("[Presensi] Gagal mengambil profil dari Firestore:", error);
  }

  // Jika tidak ditemukan dan ada email, periksa kredensial STP
  if (userEmail) {
    const profile = getStpUserProfileByEmail(userEmail);
    if (profile) {
      const fullProfile = { ...profile, id: uid };
      // Simpan ke database presensi-pegawai
      try {
        await setDoc(doc(db, "users", uid), fullProfile, { merge: true });
      } catch (err) {
        console.warn("[Presensi] Auto-provision profil STP gagal:", err);
      }
      return fullProfile;
    }
  }

  return null;
}

/**
 * Menyimpan / memperbarui profil pegawai di database `presensi-pegawai`
 */
export async function upsertUserProfileToFirestore(
  profile: UserProfile
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", profile.id);
    await setDoc(
      userDocRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[Presensi] Gagal menyimpan profil ke Firestore presensi-pegawai:", error);
  }
}

/**
 * Login dengan Google SSO (Akun @solotechnopark.id)
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: "solotechnopark.id",
    prompt: "select_account",
  });

  const credential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;
  const email = fbUser.email || "";

  let profile = await getUserProfileFromFirestore(fbUser.uid, email);

  // Jika profil belum terdaftar di STP, buatkan profil awal
  if (!profile) {
    const isStpDomain = email.endsWith("@solotechnopark.id");
    profile = {
      id: fbUser.uid,
      nip: email.split("@")[0].toUpperCase(),
      accessCode: `STP-${Math.floor(10000 + Math.random() * 90000)}`,
      nama: fbUser.displayName || email.split("@")[0],
      email: email,
      role: isStpDomain ? "pegawai" : "pegawai",
      jabatan: "Pegawai Solo Technopark",
      golongan: "Staf BLUD",
      instansi: "UPTD KST Solo Technopark",
      departmentId: "dept-umum",
      departmentName: "Divisi Operasional & Layanan",
      fotoUrl: fbUser.photoURL || undefined,
      kantorId: "kantor-stp-pusat",
      namaKantor: "UPTD KST Solo Technopark (Pusat)",
      orgId: "solotechnopark",
      storageUsedBytes: 0,
      storageLimitBytes: 1073741824, // 1 GB
    };

    await upsertUserProfileToFirestore(profile);
  }

  return { user: fbUser, profile };
}

/**
 * Normalisasi format email atau AccessCode (e.g. STP-22757)
 */
export function normalizeNipOrCodeToEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  // Jika berupa access code e.g. STP-22757 atau STP22757
  const cleanCode = trimmed.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  // Cari di stpUsers
  const found = getStpUserProfileByEmail(cleanCode);
  if (found) return found.email;

  // Fallback pattern
  return `${cleanCode.toLowerCase()}@solotechnopark.id`;
}

/**
 * Login dengan NIP, Access Code, atau Email kedinasan
 */
export async function loginWithNipOrEmail(
  nipOrEmail: string,
  password: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  let email = nipOrEmail.trim();

  if (!email.includes("@")) {
    // Cari di data master kredensial STP
    const { STP_CREDENTIALS_LIST } = await import("@/data/presensi/stpUsers");
    const found = STP_CREDENTIALS_LIST.find(
      (u) => u.accessCode.toLowerCase() === email.toLowerCase() || u.accessCode.replace("-", "").toLowerCase() === email.replace("-", "").toLowerCase()
    );
    if (found) {
      email = found.email;
    } else {
      email = `${email.toLowerCase()}@solotechnopark.id`;
    }
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = credential.user;

  let profile = await getUserProfileFromFirestore(fbUser.uid, email);
  if (!profile) {
    const stpData = getStpUserProfileByEmail(email);
    if (stpData) {
      profile = { ...stpData, id: fbUser.uid };
      await upsertUserProfileToFirestore(profile);
    } else {
      throw new Error("Akun Anda belum terdaftar di database pegawai Solo Technopark.");
    }
  }

  return { user: fbUser, profile };
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
