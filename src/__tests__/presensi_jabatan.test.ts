import { describe, it, expect } from "vitest";
import { DEFAULT_JABATAN_LIST } from "@/data/presensi/masterJabatan";
import { MasterJabatan, UserProfile } from "@/types/presensi";

describe("Mekanisme Master Jabatan & Level Dinamis", () => {
  it("harus memiliki data master jabatan awal dengan hierarki level terurut", () => {
    expect(DEFAULT_JABATAN_LIST.length).toBeGreaterThan(0);

    const rootJabatan = DEFAULT_JABATAN_LIST.find((j) => j.parentJabatanId === null);
    expect(rootJabatan).toBeDefined();
    expect(rootJabatan?.level).toBe(1);
    expect(rootJabatan?.namaJabatan).toContain("Pemimpin BLUD");
  });

  it("jabatan bawahan harus memiliki level numerik lebih besar dari atasannya", () => {
    const jabatanMap = new Map<string, MasterJabatan>(
      DEFAULT_JABATAN_LIST.map((j) => [j.id, j])
    );

    DEFAULT_JABATAN_LIST.forEach((jbt) => {
      if (jbt.parentJabatanId) {
        const parent = jabatanMap.get(jbt.parentJabatanId);
        expect(parent).toBeDefined();
        if (parent) {
          expect(jbt.level).toBeGreaterThan(parent.level);
        }
      }
    });
  });

  it("organogram pohon hierarki dapat dibentuk secara rekursif tanpa circular loop", () => {
    const hierarchyMap: Record<string, MasterJabatan[]> = {};
    DEFAULT_JABATAN_LIST.forEach((j) => {
      const parentKey = j.parentJabatanId || "root";
      if (!hierarchyMap[parentKey]) hierarchyMap[parentKey] = [];
      hierarchyMap[parentKey].push(j);
    });

    const roots = hierarchyMap["root"];
    expect(roots).toBeDefined();
    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe("jbt-01");

    // Level 2 adalah anak dari root (jbt-01)
    const level2Children = hierarchyMap["jbt-01"];
    expect(level2Children).toBeDefined();
    expect(level2Children.some((c) => c.level === 2)).toBe(true);
  });

  it("pemilihan jabatan otomatis menyinkronkan rankLevel dan divisi default ke profil pegawai", () => {
    const selectedJabatan: MasterJabatan = DEFAULT_JABATAN_LIST.find(
      (j) => j.id === "jbt-04-it"
    )!;

    expect(selectedJabatan).toBeDefined();

    const pegawaiProfile: Partial<UserProfile> = {
      jabatanId: selectedJabatan.id,
      jabatan: selectedJabatan.namaJabatan,
      rankLevel: selectedJabatan.level,
      departmentName: selectedJabatan.departemen,
    };

    expect(pegawaiProfile.jabatanId).toBe("jbt-04-it");
    expect(pegawaiProfile.jabatan).toBe("Kepala Divisi Information Technology");
    expect(pegawaiProfile.rankLevel).toBe(4);
    expect(pegawaiProfile.departmentName).toBe("Information Technology");
  });

  it("filtering supervisor hanya menampilkan pejabat dengan rankLevel lebih tinggi", () => {
    const mockUsers: Partial<UserProfile>[] = [
      { id: "u-direktur", nama: "Direktur", rankLevel: 1 },
      { id: "u-manager", nama: "Manager", rankLevel: 3 },
      { id: "u-kepdiv", nama: "Kepala Divisi", rankLevel: 4 },
      { id: "u-staf", nama: "Staf IT", rankLevel: 9 },
    ];

    const currentRankLevel = 4; // Kepala Divisi
    const eligibleSupervisors = mockUsers.filter(
      (u) => (u.rankLevel ?? 99) < currentRankLevel
    );

    expect(eligibleSupervisors.length).toBe(2);
    expect(eligibleSupervisors.map((s) => s.id)).toEqual(["u-direktur", "u-manager"]);
    expect(eligibleSupervisors.some((s) => s.id === "u-staf")).toBe(false);
  });
});
