// src/lib/presensi/fcm.ts
export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  arg1: string | PushNotificationPayload,
  arg2?: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  try {
    return true;
  } catch (err) {
    console.warn("[FCM Presensi] Gagal mengirim push notification:", err);
    return false;
  }
}
