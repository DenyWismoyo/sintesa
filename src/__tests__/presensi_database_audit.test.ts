import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PRESENSI_COOKIE_NAME } from "@/lib/presensi/constants";

describe("Audit Komprehensif Arsitektur Multi-Database Presensi", () => {
  const rootDir = process.cwd();

  it("1. Konfigurasi Environment & Database ID Terpisah", () => {
    // Memeriksa definisi databaseId presensi terisolasi
    const envLocalContent = fs.readFileSync(path.join(rootDir, ".env.local"), "utf-8");
    expect(envLocalContent).toContain("NEXT_PUBLIC_PRESENSI_DATABASE_ID=presensi-pegawai");
    expect(envLocalContent).toContain("NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET=presensi-solo-technopark");
  });

  it("2. Client & Admin SDK Menggunakan Named Database 'presensi-pegawai'", () => {
    const firebaseTs = fs.readFileSync(path.join(rootDir, "src/lib/firebase.ts"), "utf-8");
    // Client SDK
    expect(firebaseTs).toContain("const presensiDb = getFirestore(app, presensiDatabaseId);");
    expect(firebaseTs).toContain("const presensiStorage = getStorage(presensiApp, presensiBucketUrl);");

    // Admin SDK
    const adminTs = fs.readFileSync(path.join(rootDir, "src/lib/presensi/firebase-admin.ts"), "utf-8");
    expect(adminTs).toContain("getFirestore(app, presensiDatabaseId)");
    expect(adminTs).toContain("adminPresensiDb");
  });

  it("3. Seluruh 9 Koleksi Presensi Konsisten & Tidak Ada Duplikasi Koleksi", () => {
    // 9 koleksi resmi presensi
    const expectedCollections = [
      "users",
      "presensi",
      "lkh",
      "izin",
      "revisi_presensi",
      "lemburRecords",
      "kantor",
      "organizations",
      "auditLogs",
    ];

    const presensiRules = fs.readFileSync(path.join(rootDir, "firestore-presensi.rules"), "utf-8");
    for (const col of expectedCollections) {
      expect(presensiRules).toContain(`match /${col}/`);
    }

    // Memastikan tidak ada koleksi dobel alias yang membingungkan
    expect(presensiRules).not.toContain("match /pegawai/");
    expect(presensiRules).not.toContain("match /attendance/");
    expect(presensiRules).not.toContain("match /logbook/");
  });

  it("4. Composite Indexes untuk Presensi Lengkap & Terdaftar di firebase.json", () => {
    const firebaseJson = JSON.parse(fs.readFileSync(path.join(rootDir, "firebase.json"), "utf-8"));
    const presensiDbConfig = firebaseJson.firestore.find(
      (f: { database: string }) => f.database === "presensi-pegawai"
    );
    expect(presensiDbConfig).toBeDefined();
    expect(presensiDbConfig.rules).toBe("firestore-presensi.rules");
    expect(presensiDbConfig.indexes).toBe("firestore.indexes.presensi.json");

    const indexesJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "firestore.indexes.presensi.json"), "utf-8")
    );
    const groups = indexesJson.indexes.map((idx: { collectionGroup: string }) => idx.collectionGroup);
    
    expect(groups).toContain("presensi");
    expect(groups).toContain("lkh");
    expect(groups).toContain("izin");
    expect(groups).toContain("lemburRecords");
    expect(groups).toContain("kantor");
    expect(groups).toContain("revisi_presensi");
  });

  it("5. Isolasi Sesi Cookie & Custom Claims", () => {
    // Cookie presensi tidak menimpa cookie katalog (__session)
    expect(PRESENSI_COOKIE_NAME).toBe("techno_sign_session");
  });

  it("6. Dokumen Panduan Presensi & Direktori Akun PDF Tersedia Secara Publik", () => {
    const pdfPath = path.join(rootDir, "public/docs/panduan-presensi-techno-sign.pdf");
    expect(fs.existsSync(pdfPath)).toBe(true);

    const stat = fs.statSync(pdfPath);
    expect(stat.size).toBeGreaterThan(100000); // Minimal 100 KB
  });
});
