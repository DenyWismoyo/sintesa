import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, startAfter, writeBatch,
  DocumentData, QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { Alumni } from '@/types';

const COLLECTION_NAME = 'alumnis';

export const alumniService = {
  
  getAlumnis: async (lastVisible?: QueryDocumentSnapshot<DocumentData>, pageSize: number = 20) => {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(pageSize));
      if (lastVisible) {
        q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(pageSize));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumni));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      return { data, lastDoc };
    } catch (error: any) {
      console.error("Error fetching alumnis:", error);
      throw new Error("Gagal mengambil data alumni dari server.");
    }
  },

  getAllAlumnis: async () => {
    try {
      const appId = getAppId();
      // 1. Coba baca dari Dokumen Cache Tunggal terlebih dahulu (HANYA BIAYA 1 READ!)
      const cacheRef = doc(db, `artifacts/${appId}/public/data/cache_alumnis`, 'master');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        if (cacheData && Array.isArray(cacheData.data) && cacheData.data.length > 0) {
          console.log(`[OPTIMASI] Memuat ${cacheData.data.length} alumni hanya dengan 1 Read Firebase!`);
          return cacheData.data as Alumni[];
        }
      }

      // 2. FALLBACK: Jika cache belum ada/terhapus, baru terpaksa fetch semua dokumen asli (Mahal)
      console.warn("[OPTIMASI] Cache tidak ditemukan. Melakukan Fetch penuh (Mahal).");
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumni));
    } catch (error: any) {
      console.error("Error fetching all alumnis:", error);
      throw new Error("Gagal mengambil seluruh data alumni.");
    }
  },

  getAlumniById: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Alumni;
      return null;
    } catch (error: any) {
      console.error("Error fetching alumni detail:", error);
      throw new Error("Gagal mengambil detail profil alumni.");
    }
  },

  getAlumniByUserId: async (userId: string) => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('claimedByUserId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Alumni;
      return null;
    } catch (error: any) {
      console.error("Error fetching alumni by user id:", error);
      throw new Error("Gagal memuat profil alumni Anda.");
    }
  },

  // 2. FUNGSI PENULISAN & MODIFIKASI (WRITE)
  addAlumni: async (data: Omit<Alumni, 'id' | 'createdAt' | 'registrationCode'>) => {
    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const registrationCode = `AL-${data.graduationYear || new Date().getFullYear()}-${randomCode}`;
      
      const payload = {
        ...data,
        registrationCode,
        status: data.status || 'DORMANT',
        internalStatus: 'AVAILABLE',
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      return { id: docRef.id, ...payload };
    } catch (error: any) {
      console.error("Error adding alumni:", error);
      throw new Error("Gagal menambahkan data alumni.");
    }
  },

  smartImportAlumnis: async (importData: any[], existingAlumnis: Alumni[]) => {
    try {
      const existingMap = new Map<string, any>();
      existingAlumnis.forEach(alumni => {
        const name = String(alumni.name || '').toLowerCase().trim();
        const program = String(alumni.programTaken || '').toLowerCase().trim();
        const batch = String(alumni.batch || '').toLowerCase().trim();
        const key = `${name}|${program}|${batch}`; 
        existingMap.set(key, alumni);
      });

      const batchWrite = writeBatch(db);
      let updateCount = 0;
      let newCount = 0;

      importData.forEach((row) => {
        const rowName = String(row.name_of_participants || 'Tanpa Nama').toLowerCase().trim();
        const rowProgram = String(row.program || '').toLowerCase().trim();
        const rowBatch = String(row.batch || '').toLowerCase().trim();
        const key = `${rowName}|${rowProgram}|${rowBatch}`;

        const existingAlumni = existingMap.get(key);

        if (existingAlumni) {
          const docRef = doc(db, COLLECTION_NAME, existingAlumni.id as string);
          const updateData: any = {
            email: row.email_address || existingAlumni.email || '',
            phone: row.phone_number || existingAlumni.phone || '',
            trainingYear: row.tahun_pelatihan || row.training_year || existingAlumni.trainingYear || '',
            graduationYear: row.tahun_pelatihan || row.training_year || existingAlumni.graduationYear || '',
            courseStartDate: row.course_start_date || row['course_start\ndate'] || existingAlumni.courseStartDate || '',
            courseEndDate: row.course_end_date || row['course_end\ndate'] || existingAlumni.courseEndDate || '',
            birthInfo: row.date_of_birth || existingAlumni.birthInfo || '',
            address: row.home_adddress || row.home_address || existingAlumni.address || '',
            postCode: row.post_code || existingAlumni.postCode || '',
            certificationResult: row.certification_results || row.certificate || existingAlumni.certificationResult || '',
            updatedAt: Date.now()
          };

          // Memastikan jika status adalah Belum Bekerja/Kosong kita simpan sebagai Proses Verifikasi
          if (row.working_status) {
             updateData.employmentStatus = row.working_status === 'Belum Bekerja' ? 'Proses Verifikasi' : row.working_status;
          }
          if (row.current_company) updateData.company = row.current_company;
          if (row.current_position___division || row['current_position_/_division']) {
            updateData.currentJob = row.current_position___division || row['current_position_/_division'];
          }

          batchWrite.update(docRef, updateData);
          updateCount++;
          
        } else {
          const id = doc(collection(db, COLLECTION_NAME)).id;
          const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
          const yearTag = row.tahun_pelatihan || row.training_year || new Date().getFullYear().toString();
          const regCode = `AL-${yearTag}-${randomCode}`;

          const newAlumni: any = {
            id,
            name: row.name_of_participants || 'Tanpa Nama',
            email: row.email_address || '',
            phone: row.phone_number || '',
            batch: row.batch || '',
            programTaken: row.program || '',
            trainingYear: row.tahun_pelatihan || row.training_year || '',
            graduationYear: row.tahun_pelatihan || row.training_year || '',
            courseStartDate: row.course_start_date || row['course_start\ndate'] || '',
            courseEndDate: row.course_end_date || row['course_end\ndate'] || '',
            birthInfo: row.date_of_birth || '',
            address: row.home_adddress || row.home_address || '',
            postCode: row.post_code || '',
            certificationResult: row.certification_results || row.certificate || '',
            // Mapping Default
            employmentStatus: (!row.working_status || row.working_status === 'Belum Bekerja') ? 'Proses Verifikasi' : row.working_status,
            company: row.current_company || '',
            currentJob: row.current_position___division || row['current_position_/_division'] || '',
            registrationCode: regCode,
            status: 'DORMANT',
            internalStatus: 'AVAILABLE',
            createdAt: Date.now()
          };

          const docRef = doc(db, COLLECTION_NAME, id);
          batchWrite.set(docRef, newAlumni);
          newCount++;
        }
      });

      await batchWrite.commit();
      return { success: true, count: newCount + updateCount, newCount, updateCount };
    } catch (error: any) {
      console.error("Error running smart import:", error);
      throw new Error("Gagal mengimpor data alumni.");
    }
  },

  updateAlumni: async (id: string, data: Partial<Alumni>) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, data);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating alumni:", error);
      throw new Error("Gagal menyimpan perubahan profil.");
    }
  },

  deleteAlumni: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting alumni:", error);
      throw new Error("Gagal menghapus data alumni.");
    }
  },

  claimAlumni: async (registrationCode: string, userId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('registrationCode', '==', registrationCode),
        where('status', '==', 'DORMANT')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: "Kode Registrasi tidak ditemukan atau profil sudah pernah diklaim." };
      }

      const alumniDoc = snapshot.docs[0];
      const docRef = doc(db, COLLECTION_NAME, alumniDoc.id);

      await updateDoc(docRef, {
        status: 'CLAIMED',
        claimedByUserId: userId,
        claimedAt: Date.now()
      });

      return { success: true, data: { id: alumniDoc.id, ...alumniDoc.data() } };
    } catch (error: any) {
      console.error("Error claiming alumni:", error);
      throw new Error("Terjadi kesalahan sistem saat mencoba klaim profil.");
    }
  }
};