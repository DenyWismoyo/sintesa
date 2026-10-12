// src/types/facilityAddon.types.ts
import { z } from 'zod';

export const FacilityAddonCategoryEnum = z.enum([
  'VISUAL_MULTIMEDIA',      // Videotron, Projector, Screen, Kamera
  'SOUND_AUDIO',            // Sound System, Mic Wireless, Line Array
  'NETWORK_IT',             // Dedicated Fiber, High Speed Wifi, Server
  'POWER_ELECTRICITY',      // Genset Cadangan, Distribusi Daya 3-Phase
  'STAGE_EQUIPMENT',        // Rigging, Lighting, Barricade, Podium
  'MANPOWER_TECHNICAL',     // Tim Teknisi IT, Operator Audio, Soundman
  'OTHER',                  // Fasilitas Teknis Lainnya
]);
export type FacilityAddonCategory = z.infer<typeof FacilityAddonCategoryEnum>;

export const FACILITY_ADDON_CATEGORY_LABELS: Record<FacilityAddonCategory, string> = {
  VISUAL_MULTIMEDIA: 'Multimedia & Visual',
  SOUND_AUDIO: 'Tata Suara & Audio',
  NETWORK_IT: 'Jaringan & Konektivitas IT',
  POWER_ELECTRICITY: 'Kelistrikan & Genset',
  STAGE_EQUIPMENT: 'Panggung & Perlengkapan',
  MANPOWER_TECHNICAL: 'Tenaga Ahli & Teknisi',
  OTHER: 'Lainnya',
};

export const FacilityAddonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Nama perlengkapan minimal 3 karakter'),
  category: FacilityAddonCategoryEnum.default('OTHER'),
  price: z.number().min(0, 'Tarif sewa tidak boleh negatif'),
  unit: z.string().default('hari'),
  description: z.string().optional().default(''),
  stockQuantity: z.number().int().min(1).default(1),
  isAvailable: z.boolean().default(true),
  iconName: z.string().optional().default('SlidersHorizontal'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type FacilityAddon = z.infer<typeof FacilityAddonSchema>;

export const DEFAULT_FACILITY_ADDONS: Omit<FacilityAddon, 'id'>[] = [
  {
    name: 'Videotron LED P2.5 Indoor Stage',
    category: 'VISUAL_MULTIMEDIA',
    price: 3500000,
    unit: 'hari',
    description: 'Layar LED utama resolusi tinggi panggung auditorium (uk. 6x3m)',
    stockQuantity: 2,
    isAvailable: true,
    iconName: 'Monitor',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Sound System Pro Line Array & 4 Mic Wireless',
    category: 'SOUND_AUDIO',
    price: 2000000,
    unit: 'hari',
    description: 'Sistem tata suara jernih berstandar konser 20.000 Watt',
    stockQuantity: 3,
    isAvailable: true,
    iconName: 'Radio',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Live Streaming Multi-Camera Kit + Operator',
    category: 'VISUAL_MULTIMEDIA',
    price: 2500000,
    unit: 'hari',
    description: '3 kamera broadcast 4K, switcher HDMI, siaran YouTube & Zoom',
    stockQuantity: 2,
    isAvailable: true,
    iconName: 'Video',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Dedicated High-Speed Fiber Internet (100 Mbps)',
    category: 'NETWORK_IT',
    price: 1200000,
    unit: 'hari',
    description: 'Jalur internet dedicated simetris khusus panitia & live broadcast',
    stockQuantity: 5,
    isAvailable: true,
    iconName: 'Wifi',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Pendampingan Standby Tim Teknisi Lab & IT STP',
    category: 'MANPOWER_TECHNICAL',
    price: 600000,
    unit: 'hari',
    description: '2 staf teknisi bersertifikasi mendampingi kelancaran teknis acara',
    stockQuantity: 4,
    isAvailable: true,
    iconName: 'ShieldCheck',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Genset Silent 100 kVA + Operator & BBM',
    category: 'POWER_ELECTRICITY',
    price: 4000000,
    unit: 'hari',
    description: 'Catu daya listrik cadangan anti-blackout termasuk BBM operasional',
    stockQuantity: 2,
    isAvailable: true,
    iconName: 'Zap',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Stage Lighting Concert Kit (Moving Beam & Par LED)',
    category: 'STAGE_EQUIPMENT',
    price: 2800000,
    unit: 'hari',
    description: '12 Par LED RGBW, 4 Moving Head Beam, DMX Controller Lighting',
    stockQuantity: 2,
    isAvailable: true,
    iconName: 'Sparkles',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
  {
    name: 'Smart Interactive Digital Podium & Teleprompter',
    category: 'VISUAL_MULTIMEDIA',
    price: 1500000,
    unit: 'hari',
    description: 'Podium touchscreen digital pidato VIP & monitor teleprompter panggung',
    stockQuantity: 1,
    isAvailable: true,
    iconName: 'Layers',
    createdAt: 1728700000000,
    updatedAt: 1728700000000,
  },
];
