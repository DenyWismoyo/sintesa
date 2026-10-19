// src/__tests__/presensi_storage_resilience.test.ts
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyDummyKeyForVitest123456789012345";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "katalog-solo-technopark";

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { generateAsnStoragePath } from "@/lib/presensi/storage-helpers";

describe("Presensi Cloud Storage & CORS Resilience", () => {
  const rootDir = process.cwd();

  describe("1. Path Generation & Format Presensi Storage", () => {
    it("harus membentuk hierarki path swafoto presensi yang valid dan unik", () => {
      const orgId = "solotechnopark";
      const userId = "pegawai-01";
      const fileName = "presensi_test_123.jpg";
      const storagePath = generateAsnStoragePath(orgId, userId, fileName);

      expect(storagePath).toContain("swafoto-presensi/solotechnopark/pegawai-01/");
      expect(storagePath).toContain("presensi_test_123.jpg");
      
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      expect(storagePath).toContain(`/${year}/${month}/`);
    });

    it("harus membersihkan karakter spesial dari nama file", () => {
      const dirtyName = "foto selfie #1 (check-in) @kantor!.png";
      const cleanedPath = generateAsnStoragePath("stp", "usr1", dirtyName);
      expect(cleanedPath).not.toContain("#");
      expect(cleanedPath).not.toContain("@");
      expect(cleanedPath).not.toContain("!");
    });
  });

  describe("2. Konfigurasi Rules & Multi-Bucket Storage", () => {
    it("storage.rules harus mendukung recursive path /swafoto-presensi/{allPaths=**}", () => {
      const storageRules = fs.readFileSync(path.join(rootDir, "storage.rules"), "utf-8");
      expect(storageRules).toContain("match /swafoto-presensi/{allPaths=**}");
      expect(storageRules).toContain("allow read: if isAuth()");
      expect(storageRules).toContain("allow write: if isAuth()");
    });

    it("firebase.json harus meregistrasikan kedua bucket storage (default dan presensi)", () => {
      const firebaseJsonRaw = fs.readFileSync(path.join(rootDir, "firebase.json"), "utf-8");
      const firebaseJson = JSON.parse(firebaseJsonRaw);

      expect(Array.isArray(firebaseJson.storage)).toBe(true);
      const buckets = firebaseJson.storage.map((s: { bucket: string }) => s.bucket);
      expect(buckets).toContain("katalog-solo-technopark.firebasestorage.app");
      expect(buckets).toContain("presensi-solo-technopark");
    });
  });

  describe("3. Konfigurasi CORS GCP Cloud Storage", () => {
    it("cors.json harus ada di root repository dan mengizinkan preflight OPTIONS serta origin wildcard", () => {
      const corsPath = path.join(rootDir, "cors.json");
      expect(fs.existsSync(corsPath)).toBe(true);

      const corsContent = JSON.parse(fs.readFileSync(corsPath, "utf-8"));
      expect(Array.isArray(corsContent)).toBe(true);
      expect(corsContent[0].origin).toContain("*");
      expect(corsContent[0].method).toContain("PUT");
      expect(corsContent[0].method).toContain("POST");
      expect(corsContent[0].method).toContain("OPTIONS");
      expect(corsContent[0].responseHeader).toContain("Content-Type");
    });
  });

  describe("4. Presensi App Storage Binding & Fallback", () => {
    it("src/lib/firebase.ts harus mengikat presensiStorage ke presensiApp dan mengexport presensiDefaultStorage", () => {
      const fbTs = fs.readFileSync(path.join(rootDir, "src/lib/firebase.ts"), "utf-8");
      expect(fbTs).toContain("const presensiStorage = getStorage(presensiApp, presensiBucketUrl)");
      expect(fbTs).toContain("const presensiDefaultStorage = getStorage(presensiApp, bucketUrl)");
      expect(fbTs).toContain("export {");
      expect(fbTs).toContain("presensiDefaultStorage");
    });

    it("src/actions/presensi/storage.ts harus menyediakan uploadAsnFileServerAction dengan Firebase Admin", () => {
      const actionTs = fs.readFileSync(path.join(rootDir, "src/actions/presensi/storage.ts"), "utf-8");
      expect(actionTs).toContain("uploadAsnFileServerAction");
      expect(actionTs).toContain("adminPresensiStorageBucket");
      expect(actionTs).toContain("adminDefaultStorageBucket");
      expect(actionTs).toContain("firebaseStorageDownloadTokens");
    });
  });
});
