// src/lib/presensi/auth-helpers.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
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
import { presensiAuth as auth, presensiDb as db } from "@/lib/firebase";
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

  // Jika tidak ditemukan langsung via doc(uid), periksa apakah email ini sudah terdaftar
  if (userEmail) {
    try {
      const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
      // 1. Cek berdasarkan googleEmail yang ditautkan
      const qGoogle = query(collection(db, "users"), where("googleEmail", "==", userEmail), limit(1));
      const snapGoogle = await getDocs(qGoogle);
      if (!snapGoogle.empty) {
        return snapGoogle.docs[0].data() as UserProfile;
      }

      // 2. Cek berdasarkan field email kedinasan
      const qEmail = query(collection(db, "users"), where("email", "==", userEmail), limit(1));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        return snapEmail.docs[0].data() as UserProfile;
      }
    } catch (err) {
      console.warn("[Presensi] Query pencocokan email gagal:", err);
    }

    // 3. Pencocokan dengan master data STP
    const profile = getStpUserProfileByEmail(userEmail);
    if (profile) {
      const fullProfile = { ...profile, id: uid, googleEmail: userEmail };
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
  // 1. Prioritaskan Server Action terverifikasi untuk auto-provisioning & isolasi claims
  try {
    const { loginPresensiWithCredentials } = await import("@/actions/presensi/auth");
    const result = await loginPresensiWithCredentials(nipOrEmail, password);

    if (result.success && result.customToken && result.profile) {
      const credential = await signInWithCustomToken(auth, result.customToken);
      return { user: credential.user, profile: result.profile };
    }

    if (!result.success) {
      throw new Error(result.message || "Gagal melakukan autentikasi presensi.");
    }
  } catch (actionErr: any) {
    const errMsg = actionErr?.message || "";
    // Jika error adalah penolakan password atau akun tidak ditemukan, teruskan error
    if (errMsg.includes("Kata sandi") || errMsg.includes("tidak terdaftar") || errMsg.includes("wajib diisi")) {
      throw actionErr;
    }
    console.warn("[Login Presensi] Server Action fallback ke client Auth SDK:", actionErr);
  }

  // 2. Fallback: Autentikasi langsung via client SDK (presensiAuth)
  let email = nipOrEmail.trim();
  if (!email.includes("@")) {
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
