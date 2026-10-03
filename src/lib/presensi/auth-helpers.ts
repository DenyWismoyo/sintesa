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

  // Jika tidak ditemukan langsung via doc(uid), periksa apakah email Google ini sudah ditautkan
  if (userEmail) {
    try {
      const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("googleEmail", "==", userEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch {}

    // Jika ini adalah login menggunakan email kedinasan mock @solotechnopark.id
    if (userEmail.endsWith("@solotechnopark.id")) {
      const profile = getStpUserProfileByEmail(userEmail);
      if (profile) {
        const fullProfile = { ...profile, id: uid };
        try {
          await setDoc(doc(db, "users", uid), fullProfile, { merge: true });
        } catch (err) {
          console.warn("[Presensi] Auto-provision profil STP gagal:", err);
        }
        return fullProfile;
      }
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
 * Login dengan Google SSO (Akun Google personal, kedinasan, atau akun Google katalog)
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile | null }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  const credential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;
  const email = fbUser.email || "";

  // Periksa apakah akun Google ini sudah disinkronkan dengan data pegawai STP
  const profile = await getUserProfileFromFirestore(fbUser.uid, email);

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
