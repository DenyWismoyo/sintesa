// src/services/openProject.service.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  OpenProject,
  OpenProjectInput,
  OpenProjectSchema,
  OpenProjectStatus,
  ProjectApplication,
  ProjectApplicationSchema,
  ProjectApplicationStatus,
} from '@/types/partnership.types';

const getProjectsPath = () =>
  `artifacts/${getAppId()}/public/data/open_projects`;

const getApplicationsPath = () =>
  `artifacts/${getAppId()}/public/data/project_applications`;

// Mock initial data untuk inspirasi ekosistem industri Solo Technopark
export const INITIAL_OPEN_PROJECTS: OpenProject[] = [
  {
    id: 'proj-precision-cad-fixture',
    partnerId: 'pt-rekayasa-presisi-solo',
    partnerName: 'PT Rekayasa Presisi Nusantara',
    partnerLogo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80',
    partnerSector: 'Manufaktur Alat Berat & Mesin Industri',
    title: 'Desain 3D Fixture Jig untuk Komponen Turbin PLTMH',
    category: 'INDUSTRIAL_DESIGN',
    description: 'Dibutuhkan alumni diklat CNC Presisi / CAD-CAM STP untuk menyusun gambar kerja 3D Solidworks dan simulasi toleransi presisi geometri (GD&T) jig holding turbin mikrohidro.',
    deliverables: [
      'File 3D CAD (.step & .sldprt)',
      'Gambar kerja 2D detail toleransi presisi standar ISO',
      'Laporan simulasi Finite Element Analysis (FEA) beban statis',
    ],
    requiredSkills: ['SolidWorks', 'CAD/CAM', 'GD&T', 'Metrologi Industri'],
    preferredPrograms: ['Manufaktur CNC Presisi', 'Mekatronika Terapan'],
    projectType: 'FREELANCE',
    budgetType: 'FIXED',
    budgetAmount: 14500000,
    durationEstimate: '3 Minggu',
    workSetup: 'HYBRID',
    maxApplicants: 8,
    status: 'ACTIVE',
    isFeatured: true,
    submissionDeadline: '2026-12-15',
  },
  {
    id: 'proj-smart-monitoring-iot',
    partnerId: 'pt-agrotech-solusi-mandiri',
    partnerName: 'PT Agri Inovasi Lestari',
    partnerLogo: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=120&auto=format&fit=crop&q=80',
    partnerSector: 'Smart Farming & Agroteknologi',
    title: 'Prototype Dashboard IoT Pemantauan Kelembaban Greenhouse',
    category: 'AUTOMATION_IOT',
    description: 'Pembuatan gateway mikrokontroler ESP32 komunikasi LoRa dan integrasi visualisasi data sensor realtime berbasis Next.js & Grafana untuk instalasi greenhouse melon premium.',
    deliverables: [
      'Firmware ESP32 + skematik wiring sensor sensorik',
      'Dashboard realtime web responsive telemetri IoT',
      'Dokumentasi manual pengoperasian & API webhook',
    ],
    requiredSkills: ['ESP32 C++', 'MQTT/LoRaWAN', 'Next.js', 'PostgreSQL / InfluxDB'],
    preferredPrograms: ['Otomasi Industri Mechatronics', 'Fullstack Web & Cloud Engineering'],
    projectType: 'FREELANCE',
    budgetType: 'FIXED',
    budgetAmount: 18000000,
    durationEstimate: '1 Bulan',
    workSetup: 'REMOTE',
    maxApplicants: 10,
    status: 'ACTIVE',
    isFeatured: true,
    submissionDeadline: '2026-11-30',
  },
  {
    id: 'proj-cyber-audit-portal',
    partnerId: 'bpr-soloraya-sejahtera',
    partnerName: 'Konsorsium Lembaga Keuangan Mikro Solo',
    partnerLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
    partnerSector: 'Finansial & Perbankan Daerah',
    title: 'Penetration Testing & Vulnerability Assessment Aplikasi Mobile BPR',
    category: 'CYBERSECURITY',
    description: 'Pengujian kerentanan keamanan siber (OWASP Mobile Top 10) pada aplikasi tabungan digital mitra sebelum peluncuran resmi ke publik oleh alumni akademi cyber security STP.',
    deliverables: [
      'Executive Summary & Risk Severity Matrix (CVSS v3)',
      'Technical Proof of Concept (PoC) temuan eksploitasi',
      'Panduan remediasi penambalan celah keamanan kode',
    ],
    requiredSkills: ['OWASP Top 10', 'BurpSuite', 'Static/Dynamic Mobile Analysis', 'Security Reporting'],
    preferredPrograms: ['Cyber Security Defense Specialist'],
    projectType: 'FREELANCE',
    budgetType: 'FIXED',
    budgetAmount: 22000000,
    durationEstimate: '2 Minggu',
    workSetup: 'REMOTE',
    maxApplicants: 5,
    status: 'ACTIVE',
    isFeatured: true,
    submissionDeadline: '2026-12-05',
  },
  {
    id: 'proj-video-profile-ekraf',
    partnerId: 'cv-surakarta-kreatif-hub',
    partnerName: 'Surakarta Heritage Media Group',
    partnerLogo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=120&auto=format&fit=crop&q=80',
    partnerSector: 'Industri Kreatif & Pariwisata',
    title: 'Produksi Video Promosi Wisata Budaya Interaktif & 3D Motion',
    category: 'CONTENT_DIGITAL',
    description: 'Proyek pembuatan bumper 3D animasi logo dan serial video pendek cinematic dokumenter sentra kriya batik Laweyan & Pasar Gede untuk kampanye promosi digital.',
    deliverables: [
      '3 Episode Video Reels/TikTok Cinematic 4K',
      'Asset motion 3D grafis pengantar durasi 10 detik',
      'Master audio editing & color grading profesional',
    ],
    requiredSkills: ['Premiere Pro / DaVinci', 'After Effects / Blender', 'Color Grading', 'Videografi'],
    preferredPrograms: ['Digital Marketing & Content Creator', 'Desain Grafis & Motion Media'],
    projectType: 'FREELANCE',
    budgetType: 'FIXED',
    budgetAmount: 11000000,
    durationEstimate: '3 Minggu',
    workSetup: 'ONSITE_STP',
    maxApplicants: 12,
    status: 'ACTIVE',
    isFeatured: false,
    submissionDeadline: '2026-12-20',
  },
];

export const openProjectService = {
  /**
   * Mengambil proyek aktif yang tayang di halaman publik / portal alumni
   */
  async getPublicProjects(): Promise<OpenProject[]> {
    try {
      const q = query(
        collection(db, getProjectsPath()),
        where('status', '==', 'ACTIVE'),
        limit(50)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return INITIAL_OPEN_PROJECTS;
      }

      const list: OpenProject[] = [];
      snap.docs.forEach((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = OpenProjectSchema.safeParse(raw);
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push(raw as OpenProject);
        }
      });

      return list.length > 0 ? list : INITIAL_OPEN_PROJECTS;
    } catch (err) {
      console.warn('[openProjectService] Fallback getPublicProjects:', err);
      return INITIAL_OPEN_PROJECTS;
    }
  },

  /**
   * Mengambil proyek yang diajukan oleh Mitra tertentu (Portal Mitra)
   */
  async getPartnerProjects(partnerId: string): Promise<OpenProject[]> {
    if (!partnerId) return [];
    try {
      const q = query(
        collection(db, getProjectsPath()),
        where('partnerId', '==', partnerId),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = OpenProjectSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as OpenProject);
      });
    } catch (err) {
      console.warn('[openProjectService] Fallback getPartnerProjects:', err);
      return [];
    }
  },

  /**
   * Mengambil seluruh proyek untuk kurasi Admin STP
   */
  async getAllProjects(): Promise<OpenProject[]> {
    try {
      const q = query(
        collection(db, getProjectsPath()),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return INITIAL_OPEN_PROJECTS;
      }

      return snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = OpenProjectSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as OpenProject);
      });
    } catch (err) {
      console.warn('[openProjectService] Fallback getAllProjects:', err);
      return INITIAL_OPEN_PROJECTS;
    }
  },

  /**
   * Mengajukan draf proyek baru dari Portal Mitra
   */
  async submitProjectDraft(
    data: Omit<OpenProjectInput, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getProjectsPath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload = {
        ...data,
        id: newDocRef.id,
        status: 'PENDING_REVIEW' as OpenProjectStatus, // Wajib review kurator STP
        createdAt: now,
        updatedAt: now,
      };

      const parsed = OpenProjectSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Validasi proyek gagal: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[openProjectService] Error submitProjectDraft:', err);
      return { success: false, error: err.message || 'Gagal mengajukan draf proyek.' };
    }
  },

  /**
   * Kurasi & persetujuan proyek oleh Admin STP (APPROVE -> ACTIVE, REVISE, CANCEL)
   */
  async reviewProject(
    id: string,
    status: OpenProjectStatus,
    notes?: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, getProjectsPath(), id);
      await updateDoc(docRef, {
        status,
        ...(notes ? { stpCurationNotes: notes } : {}),
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[openProjectService] Error reviewProject:', err);
      return false;
    }
  },

  /**
   * Update detail proyek oleh pemilik mitra
   */
  async updateProject(id: string, data: Partial<OpenProject>): Promise<boolean> {
    try {
      const docRef = doc(db, getProjectsPath(), id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[openProjectService] Error updateProject:', err);
      return false;
    }
  },

  /**
   * Hapus proyek
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, getProjectsPath(), id));
      return true;
    } catch (err) {
      console.error('[openProjectService] Error deleteProject:', err);
      return false;
    }
  },

  /**
   * Alumni mengajukan lamaran pengerjaan Open Project
   */
  async submitApplication(
    data: Omit<ProjectApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getApplicationsPath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload: ProjectApplication = {
        ...data,
        id: newDocRef.id,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      const parsed = ProjectApplicationSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format lamaran tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[openProjectService] Error submitApplication:', err);
      return { success: false, error: err.message || 'Gagal mengirimkan lamaran proyek.' };
    }
  },

  /**
   * Mengambil pelamar untuk proyek tertentu (Mitra / Admin)
   */
  async getProjectApplications(projectId?: string, partnerId?: string): Promise<ProjectApplication[]> {
    try {
      let q = query(
        collection(db, getApplicationsPath()),
        orderBy('createdAt', 'desc'),
        limit(150)
      );

      if (projectId) {
        q = query(
          collection(db, getApplicationsPath()),
          where('projectId', '==', projectId),
          limit(100)
        );
      } else if (partnerId) {
        q = query(
          collection(db, getApplicationsPath()),
          where('partnerId', '==', partnerId),
          limit(100)
        );
      }

      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = ProjectApplicationSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as ProjectApplication);
      });
    } catch (err) {
      console.warn('[openProjectService] Fallback getProjectApplications:', err);
      return [];
    }
  },

  /**
   * Memperbarui status pelamar oleh Mitra (SHORTLISTED, ACCEPTED, REJECTED)
   */
  async updateApplicationStatus(
    id: string,
    status: ProjectApplicationStatus,
    feedback?: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, getApplicationsPath(), id);
      await updateDoc(docRef, {
        status,
        ...(feedback ? { partnerFeedback: feedback } : {}),
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[openProjectService] Error updateApplicationStatus:', err);
      return false;
    }
  },
};

