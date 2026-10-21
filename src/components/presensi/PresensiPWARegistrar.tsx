"use client";
// src/components/presensi/PresensiPWARegistrar.tsx
// Komponen ini mendaftarkan Service Worker khusus Techno Sign (/sw-presensi.js)
// dengan scope /presensi/ — terpisah dari SW katalog utama (/sw.js, scope /)

import { useEffect } from "react";

export default function PresensiPWARegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerPresensiSW = async () => {
      try {
        // Cek apakah SW presensi sudah terdaftar
        const registrations = await navigator.serviceWorker.getRegistrations();
        const alreadyRegistered = registrations.some((reg) =>
          reg.scope.includes("/presensi/")
        );

        if (!alreadyRegistered) {
          const registration = await navigator.serviceWorker.register(
            "/sw-presensi.js",
            {
              scope: "/presensi/",
              updateViaCache: "none", // Selalu cek versi terbaru
            }
          );
          console.log(
            "[Techno Sign SW] Terdaftar dengan scope:",
            registration.scope
          );

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    "[Techno Sign SW] Versi baru tersedia. Refresh untuk update."
                  );
                }
              });
            }
          });
        }
      } catch (error) {
        console.error("[Techno Sign SW] Gagal mendaftar:", error);
      }
    };

    // Daftarkan setelah halaman load penuh agar tidak blokir rendering
    if (document.readyState === "complete") {
      registerPresensiSW();
    } else {
      window.addEventListener("load", registerPresensiSW);
      return () => window.removeEventListener("load", registerPresensiSW);
    }
  }, []);

  // Komponen ini tidak me-render apapun — hanya side effect
  return null;
}
