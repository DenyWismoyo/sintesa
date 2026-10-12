import { describe, it, expect } from 'vitest';
import {
  FacilityAddonSchema,
  FacilityAddonCategoryEnum,
  FACILITY_ADDON_CATEGORY_LABELS,
  DEFAULT_FACILITY_ADDONS,
} from '@/types/facilityAddon.types';

describe('Manajemen Fasilitas Teknis & Perlengkapan Operasional Kawasan', () => {
  it('harus memvalidasi FacilityAddonSchema dengan data perlengkapan yang lengkap', () => {
    const validAddon = {
      name: 'Videotron LED P2.5 Indoor Stage',
      category: 'VISUAL_MULTIMEDIA' as const,
      price: 3500000,
      unit: 'hari',
      description: 'Layar LED utama resolusi tinggi untuk panggung utama (6x3 meter)',
      stockQuantity: 2,
      isAvailable: true,
      iconName: 'Monitor',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = FacilityAddonSchema.safeParse(validAddon);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Videotron LED P2.5 Indoor Stage');
      expect(parsed.data.category).toBe('VISUAL_MULTIMEDIA');
      expect(parsed.data.price).toBe(3500000);
      expect(parsed.data.stockQuantity).toBe(2);
      expect(parsed.data.isAvailable).toBe(true);
    }
  });

  it('harus menolak FacilityAddon jika nama kurang dari 3 karakter atau harga negatif', () => {
    const invalidAddon = {
      name: 'Vi',
      category: 'VISUAL_MULTIMEDIA',
      price: -5000,
      unit: 'hari',
    };

    const parsed = FacilityAddonSchema.safeParse(invalidAddon);
    expect(parsed.success).toBe(false);
  });

  it('harus memastikan seluruh katalog DEFAULT_FACILITY_ADDONS valid sesuai skema', () => {
    expect(DEFAULT_FACILITY_ADDONS.length).toBeGreaterThan(0);
    DEFAULT_FACILITY_ADDONS.forEach((addon) => {
      const parsed = FacilityAddonSchema.safeParse(addon);
      expect(parsed.success).toBe(true);
    });
  });

  it('harus memiliki label yang lengkap untuk setiap kategori dalam FacilityAddonCategoryEnum', () => {
    FacilityAddonCategoryEnum.options.forEach((catKey) => {
      expect(FACILITY_ADDON_CATEGORY_LABELS[catKey]).toBeDefined();
      expect(typeof FACILITY_ADDON_CATEGORY_LABELS[catKey]).toBe('string');
    });
  });
});
