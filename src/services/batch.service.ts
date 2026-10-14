import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  increment,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { TrainingBatch, TrainingBatchSchema, TrainingRegistration, Alumni } from '@/types';
import { alumniService } from '@/services/alumni.service';

export const batchService = {
  /**
   * Mengambil seluruh daftar batch untuk program pelatihan tertentu
   */
  getBatches: async (trainingId: string): Promise<TrainingBatch[]> => {
    try {
      const q = query(
        collection(db, 'trainings', trainingId, 'batches'),
        orderBy('year', 'desc'),
        orderBy('batchNumber', 'asc')
      );
      const snap = await getDocs(q);
      const batches: TrainingBatch[] = [];
      snap.forEach((d) => {
        const parsed = TrainingBatchSchema.safeParse({ id: d.id, ...d.data() });
        if (parsed.success) {
          batches.push(parsed.data);
        }
      });
      return batches;
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  },

  /**
   * Mengambil detail batch berdasarkan ID
   */
  getBatchById: async (trainingId: string, batchId: string): Promise<TrainingBatch | null> => {
    try {
      const dSnap = await getDoc(doc(db, 'trainings', trainingId, 'batches', batchId));
      if (!dSnap.exists()) return null;
      const parsed = TrainingBatchSchema.safeParse({ id: dSnap.id, ...dSnap.data() });
      return parsed.success ? parsed.data : null;
    } catch (error) {
      console.error('Error fetching batch detail:', error);
      return null;
    }
  },

  /**
   * Inisialisasi Otomatis 4 Batch Standar Tahunan (Kuartal I, II, III, IV)
   */
  initAnnualBatches: async (trainingId: string, year: number, defaultQuota: number = 30) => {
    const quarters = [
      {
        batchNumber: 1,
        title: `Batch 1 — Kuartal I ${year}`,
        startDate: `${year}-01-15`,
        endDate: `${year}-03-31`,
        registrationDeadline: `${year}-01-10`,
        fundingScheme: 'MANDIRI_BLUD' as const,
      },
      {
        batchNumber: 2,
        title: `Batch 2 — Kuartal II ${year}`,
        startDate: `${year}-04-15`,
        endDate: `${year}-06-30`,
        registrationDeadline: `${year}-04-10`,
        fundingScheme: 'BEASISWA_PEMKOT' as const,
      },
      {
        batchNumber: 3,
        title: `Batch 3 — Kuartal III ${year}`,
        startDate: `${year}-07-15`,
        endDate: `${year}-09-30`,
        registrationDeadline: `${year}-07-10`,
        fundingScheme: 'KEMENPERIN' as const,
      },
      {
        batchNumber: 4,
        title: `Batch 4 — Kuartal IV ${year}`,
        startDate: `${year}-10-15`,
        endDate: `${year}-12-20`,
        registrationDeadline: `${year}-10-10`,
        fundingScheme: 'CSR_INDUSTRI' as const,
      },
    ];

    const batchOp = writeBatch(db);
    const createdBatches: TrainingBatch[] = [];

    for (const q of quarters) {
      const batchRef = doc(collection(db, 'trainings', trainingId, 'batches'));
      const batchData: TrainingBatch = {
        id: batchRef.id,
        trainingId,
        batchNumber: q.batchNumber,
        year,
        title: q.title,
        startDate: q.startDate,
        endDate: q.endDate,
        registrationDeadline: q.registrationDeadline,
        quota: defaultQuota,
        registeredCount: 0,
        status: q.batchNumber === 1 ? 'REGISTRATION_OPEN' : 'UPCOMING',
        fundingScheme: q.fundingScheme,
        instructorIds: [],
        location: 'Gedung Diklat Terpadu Solo Technopark',
        createdAt: Date.now(),
      };

      batchOp.set(batchRef, batchData);
      createdBatches.push(batchData);
    }

    await batchOp.commit();
    return createdBatches;
  },

  /**
   * Menambah Batch baru secara spesifik
   */
  createBatch: async (trainingId: string, data: Omit<TrainingBatch, 'id' | 'createdAt' | 'registeredCount'>) => {
    const docRef = doc(collection(db, 'trainings', trainingId, 'batches'));
    const payload: TrainingBatch = {
      ...data,
      id: docRef.id,
      registeredCount: 0,
      createdAt: Date.now(),
    };
    await setDoc(docRef, payload);
    return payload;
  },

  /**
   * Update data Batch
   */
  updateBatch: async (trainingId: string, batchId: string, data: Partial<TrainingBatch>) => {
    const docRef = doc(db, 'trainings', trainingId, 'batches', batchId);
    await updateDoc(docRef, { ...data, updatedAt: Date.now() });
    return { success: true };
  },

  /**
   * Hapus Batch
   */
  deleteBatch: async (trainingId: string, batchId: string) => {
    await deleteDoc(doc(db, 'trainings', trainingId, 'batches', batchId));
    return { success: true };
  },

  /**
   * Bulk Ingestion Peserta Batch (dari Excel/CSV atau Rekap Dinas/SMK/CSR)
   */
  bulkRegisterBatchParticipants: async (
    trainingId: string,
    batchId: string,
    batchNumber: number,
    participants: {
      name: string;
      email: string;
      phone: string;
      nik?: string;
      origin: string;
      registrationSource?: 'PARTNER_DINAS' | 'PARTNER_SMK' | 'PARTNER_CSR' | 'OFFLINE_WALKIN' | 'CATALOG_ONLINE';
      customData?: Record<string, string>;
    }[]
  ) => {
    const batchOp = writeBatch(db);
    const registrationsRef = collection(db, 'trainings', trainingId, 'registrations');
    let count = 0;

    for (const p of participants) {
      const regDoc = doc(registrationsRef);
      const regData: TrainingRegistration = {
        id: regDoc.id,
        trainingId,
        batchId,
        batchNumber,
        registrationSource: p.registrationSource || 'PARTNER_DINAS',
        name: p.name.trim(),
        email: p.email.trim().toLowerCase(),
        phone: p.phone.trim(),
        nik: p.nik?.trim() || '',
        origin: p.origin.trim() || 'Solo Technopark',
        customData: p.customData || {},
        completedLessons: [],
        paymentStatus: 'PAID', // Peserta rombongan dinas/CSR/walkin di-confirm tanpa tagihan online
        status: 'CONFIRMED',
        graduationStatus: 'IN_PROGRESS',
        createdAt: Date.now(),
      };

      batchOp.set(regDoc, regData);
      count++;
    }

    // Increment registered count pada Batch dan Training induk
    batchOp.update(doc(db, 'trainings', trainingId, 'batches', batchId), {
      registeredCount: increment(count),
    });
    batchOp.update(doc(db, 'trainings', trainingId), {
      registeredCount: increment(count),
    });

    await batchOp.commit();
    return { success: true, count };
  },

  /**
   * Proses Yudisium & Konversi Otomatis ke Master Alumni STP (1-Click Graduation)
   */
  graduateBatchParticipants: async (
    trainingId: string,
    trainingTitle: string,
    trainingCategory: string,
    batchId: string,
    batchNumber: number,
    year: number,
    participantIds: string[]
  ) => {
    const batchOp = writeBatch(db);
    const now = Date.now();
    const graduationYear = String(year);
    const categoryCode = (trainingCategory || 'VOK').substring(0, 3).toUpperCase();
    const appId = getAppId();

    const graduatedAlumnis: any[] = [];
    let counter = 1;

    for (const pId of participantIds) {
      const regRef = doc(db, 'trainings', trainingId, 'registrations', pId);
      const regSnap = await getDoc(regRef);
      if (!regSnap.exists()) continue;

      const pData = regSnap.data() as TrainingRegistration;
      const serial = String(counter).padStart(3, '0');
      const certNumber = `STP-CERT/${year}/${categoryCode}/B${batchNumber}-${serial}`;
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const registrationCode = `AL-${year}-${randomCode}`;

      // Buat dokumen di koleksi master 'alumnis'
      const alumniRef = doc(collection(db, 'alumnis'));
      const alumniData = {
        id: alumniRef.id,
        name: pData.name,
        email: pData.email,
        phone: pData.phone,
        nik: pData.nik || '',
        programTaken: trainingTitle,
        batch: `Batch ${batchNumber} (${year})`,
        trainingYear: String(year),
        graduationYear,
        certificationResult: 'Kompeten / Lulus',
        certificateNumber: certNumber,
        status: 'DORMANT',
        internalStatus: 'AVAILABLE',
        registrationCode,
        employmentStatus: 'Proses Verifikasi',
        createdAt: now,
      };

      batchOp.set(alumniRef, alumniData);

      // Update registrasi peserta di subkoleksi training
      batchOp.update(regRef, {
        graduationStatus: 'GRADUATED',
        certificateNumber: certNumber,
        alumniId: alumniRef.id,
        updatedAt: now,
      });

      graduatedAlumnis.push({
        ...alumniData,
        registrationId: pId,
      });

      counter++;
    }

    await batchOp.commit();

    // P16: Sinkronkan Master Cache Alumni secara instan (1-Read Pattern)
    try {
      await alumniService.syncAlumniMasterCache();
    } catch (cacheErr) {
      console.warn('[BATCH GRADUATION] Gagal sync cache alumni:', cacheErr);
    }

    return { success: true, count: graduatedAlumnis.length, data: graduatedAlumnis };
  },
};
