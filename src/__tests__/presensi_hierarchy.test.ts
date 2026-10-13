import { describe, it, expect } from "vitest";
import { STP_CREDENTIALS_LIST } from "@/data/presensi/stpUsers";
import { DAFTAR_LEVEL_HIERARKI } from "@/types/presensi";

describe("Mekanisme Hierarki Pegawai Techno Sign (Rank Level 1-10 & Supervisor)", () => {
  it("semua 46 pegawai memiliki role 'admin' atau 'pegawai' (role 'atasan' telah sepenuhnya dieliminasi)", () => {
    expect(STP_CREDENTIALS_LIST.length).toBe(46);
    for (const user of STP_CREDENTIALS_LIST) {
      expect(["admin", "pegawai"]).toContain(user.role);
      expect((user as any).role).not.toBe("atasan");
    }
  });

  it("semua pegawai memiliki rankLevel valid antara 1 s/d 10", () => {
    for (const user of STP_CREDENTIALS_LIST) {
      expect(user.rankLevel).toBeGreaterThanOrEqual(1);
      expect(user.rankLevel).toBeLessThanOrEqual(10);
    }
  });

  it("DAFTAR_LEVEL_HIERARKI mendefinisikan 10 jenjang kepangkatan struktural yang berurutan", () => {
    expect(DAFTAR_LEVEL_HIERARKI.length).toBe(10);
    expect(DAFTAR_LEVEL_HIERARKI[0].level).toBe(1);
    expect(DAFTAR_LEVEL_HIERARKI[0].label).toContain("Pemimpin BLUD");
    expect(DAFTAR_LEVEL_HIERARKI[1].level).toBe(2);
    expect(DAFTAR_LEVEL_HIERARKI[1].label).toContain("Pejabat Keuangan & Teknis");
    expect(DAFTAR_LEVEL_HIERARKI[2].level).toBe(3);
    expect(DAFTAR_LEVEL_HIERARKI[2].label).toContain("Manager");
    expect(DAFTAR_LEVEL_HIERARKI[3].level).toBe(4);
    expect(DAFTAR_LEVEL_HIERARKI[3].label).toContain("Kepala Divisi");
    expect(DAFTAR_LEVEL_HIERARKI[9].level).toBe(10);
    expect(DAFTAR_LEVEL_HIERARKI[9].label).toContain("Magang");
  });

  it("Pejabat Penilai/Supervisor (rankLevel <= 4 atau admin) memenuhi kriteria kewenangan approval", () => {
    const isSupervisorOrAdmin = (role: string, rankLevel?: number) => {
      return role === "admin" || (rankLevel !== undefined && rankLevel <= 4);
    };

    // Admin
    expect(isSupervisorOrAdmin("admin", 1)).toBe(true);

    // Pemimpin BLUD (Level 1)
    expect(isSupervisorOrAdmin("pegawai", 1)).toBe(true);

    // Pejabat Teknis (Level 2)
    expect(isSupervisorOrAdmin("pegawai", 2)).toBe(true);

    // Manager (Level 3)
    expect(isSupervisorOrAdmin("pegawai", 3)).toBe(true);

    // Kepala Divisi (Level 4)
    expect(isSupervisorOrAdmin("pegawai", 4)).toBe(true);

    // Instruktur / Staf Senior (Level 5-8)
    expect(isSupervisorOrAdmin("pegawai", 5)).toBe(false);
    expect(isSupervisorOrAdmin("pegawai", 8)).toBe(false);

    // Staf Pelaksana (Level 9)
    expect(isSupervisorOrAdmin("pegawai", 9)).toBe(false);

    // Magang (Level 10)
    expect(isSupervisorOrAdmin("pegawai", 10)).toBe(false);
  });
});
