// src/lib/presensi/notifications.ts
"use client";

/**
 * Utilitas Web Notifications dan Pengingat Presensi Otomatis
 * untuk Pegawai Solo Technopark.
 */

export interface PresensiNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Meminta izin Web Notifications dari browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("[Notification] Browser tidak mendukung Web Notifications.");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return "denied";
}

/**
 * Menampilkan notifikasi browser resmi Techno Sign
 */
export function showPresensiNotification({
  title,
  body,
  icon = "/icons/icon-192x192.png",
  tag = "techno-sign",
}: PresensiNotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        tag,
        badge: "/icons/icon-192x192.png",
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn("[Notification] Gagal menampilkan:", e);
      return false;
    }
  }

  return false;
}

/**
 * Memeriksa status presensi hari ini dan memicu pengingat jika belum presensi
 */
export function checkAndTriggerPresensiReminder(params: {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  jamMasukMaksimal?: string;
  jamPulangMinimal?: string;
}) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 1. Pengingat Pagi: Pukul 07.00 - 07.45 WIB jika belum check-in
  if (!params.hasCheckedIn && currentHour === 7 && currentMinute <= 45) {
    showPresensiNotification({
      title: "⏰ Waktunya Presensi Masuk (Techno Sign)",
      body: "Selamat pagi! Jangan lupa lakukan swafoto presensi masuk sebelum pukul 07.30 WIB di Kawasan Solo Technopark.",
      tag: "reminder-checkin",
    });
  }

  // 2. Pengingat Sore: Pukul 16.00 - 17.00 WIB jika sudah check-in tapi belum check-out
  if (params.hasCheckedIn && !params.hasCheckedOut && currentHour >= 16 && currentHour < 18) {
    showPresensiNotification({
      title: "🏁 Waktunya Presensi Pulang (Techno Sign)",
      body: "Jam kerja hari ini telah selesai. Harap lakukan presensi pulang dan pastikan logbook LKH harian sudah terkirim.",
      tag: "reminder-checkout",
    });
  }
}
