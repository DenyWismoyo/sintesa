import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where, limit, startAfter, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { TenantSchema, Tenant, TeamMember, StartupProduct, StartupMilestone, TenantMonev, TenantKPI, MentoringSession, TenantRevenue } from '@/types';

const COLLECTION_NAME = 'tenants';

export const tenantService = {
  // MENGAMBIL DARI CACHE + MERGE DENGAN DATA FRESH "Menunggu Review"
  getAllTenants: async (): Promise<Tenant[]> => {
    try {
      const appId = getAppId();
      const cacheRef = doc(db, `artifacts/${appId}/public/data/cache_tenants`, 'master');
      const cacheSnap = await getDoc(cacheRef);

      let cachedTenants: Tenant[] = [];
      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        if (cacheData && Array.isArray(cacheData.data) && cacheData.data.length > 0) {
          cachedTenants = cacheData.data as Tenant[];
        }
      }

      // Bypass cache HANYA untuk pendaftar baru agar langsung muncul di tab admin
      const qPending = query(collection(db, COLLECTION_NAME), where('status', '==', 'Menunggu Review'));
      const pendingSnap = await getDocs(qPending);
      const pendingTenants: Tenant[] = [];
      pendingSnap.forEach(docSnap => {
        pendingTenants.push({ id: docSnap.id, ...docSnap.data() } as Tenant);
      });

      // Menggabungkan data (Data pending fresh akan menimpa data cache jika id sama, dan menambah yang baru)
      const mergedMap = new Map<string, Tenant>();
      cachedTenants.forEach(t => mergedMap.set(t.id!, t));
      pendingTenants.forEach(t => mergedMap.set(t.id!, t)); 

      // Fallback jika cache gagal dan kosong total
      if (cachedTenants.length === 0 && pendingTenants.length === 0) {
         const qAll = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
         const allSnap = await getDocs(qAll);
         const allFresh: Tenant[] = [];
         allSnap.forEach(d => allFresh.push({ id: d.id, ...d.data() } as Tenant));
         return allFresh;
      }

      // Kembalikan data yang sudah digabung & diurutkan berdasarkan waktu dibuat
      return Array.from(mergedMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
      console.error("Gagal mengambil data dari Cache Tenant:", error);
      throw error;
    }
  },

  getTenants: async (maxLimit: number = 100): Promise<Tenant[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const tenants: Tenant[] = [];
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = TenantSchema.safeParse(data);
      if (parsed.success) tenants.push(parsed.data);
      else tenants.push(data as Tenant);
    });
    return tenants;
  },

  getPaginatedTenants: async (maxLimit: number = 20, lastCreatedAt?: number) => {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    if (lastCreatedAt) q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), startAfter(lastCreatedAt), limit(maxLimit));
    const snapshot = await getDocs(q);
    const tenants: Tenant[] = [];
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = TenantSchema.safeParse(data);
      if (parsed.success) tenants.push(parsed.data);
    });
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].data().createdAt : null;
    return { tenants, lastVisible };
  },

  createTenant: async (data: Omit<Tenant, 'id' | 'createdAt'>) => await addDoc(collection(db, COLLECTION_NAME), { ...data, createdAt: Date.now() }),

  // FASE 3: BATCH WRITE UNTUK INTEGRASI KURASI
  submitCurationApplication: async (tenantData: any, productData: any) => {
    const batch = writeBatch(db);
    
    // 1. Buat referensi dokumen Tenant baru (Induk)
    const tenantRef = doc(collection(db, COLLECTION_NAME));
    batch.set(tenantRef, { ...tenantData, createdAt: Date.now() });

    // 2. Buat referensi dokumen Produk di sub-koleksi (Anak)
    const productRef = doc(collection(db, `${COLLECTION_NAME}/${tenantRef.id}/products`));
    batch.set(productRef, { ...productData, createdAt: Date.now() });

    // 3. Eksekusi transaksi secara atomic
    await batch.commit();
    return { id: tenantRef.id };
  },

  updateTenant: async (id: string, data: Partial<Tenant>) => {
    // Sanitasi rekursif: bersihkan seluruh field bernilai undefined agar Firestore updateDoc tidak pernah melempar error
    const sanitized = JSON.parse(JSON.stringify(data));
    return await updateDoc(doc(db, COLLECTION_NAME, id), sanitized);
  },
  deleteTenant: async (id: string) => await deleteDoc(doc(db, COLLECTION_NAME, id)),

  getTenantByEmail: async (email: string): Promise<Tenant | null> => {
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    const parsed = TenantSchema.safeParse(data);
    return parsed.success ? parsed.data : (data as Tenant);
  },

  uploadFile: async (tenantId: string, file: File, folder: 'logos' | 'documents' | 'covers' | 'team' | 'products'): Promise<string> => {
    const folderPath = `tenants/${tenantId}/${folder}`;
    if (folder === 'documents') {
      return await storageService.uploadFile(file, folderPath);
    }
    return await storageService.uploadImage(file, folderPath);
  },

  getTeamMembers: async (tenantId: string): Promise<TeamMember[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'team'), orderBy('createdAt', 'asc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TeamMember)); 
  },
  
  addTeamMember: async (tenantId: string, data: Omit<TeamMember, 'id'>) => await addDoc(collection(db, COLLECTION_NAME, tenantId, 'team'), { ...data, createdAt: Date.now() }),
  updateTeamMember: async (tenantId: string, memberId: string, data: Partial<TeamMember>) => await updateDoc(doc(db, COLLECTION_NAME, tenantId, 'team', memberId), data),
  deleteTeamMember: async (tenantId: string, memberId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'team', memberId)),

  getStartupProducts: async (tenantId: string): Promise<StartupProduct[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'products'), orderBy('createdAt', 'desc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as StartupProduct)); 
  },
  
  addStartupProduct: async (tenantId: string, data: Omit<StartupProduct, 'id'>) => await addDoc(collection(db, COLLECTION_NAME, tenantId, 'products'), { ...data, createdAt: Date.now() }),
  updateStartupProduct: async (tenantId: string, productId: string, data: Partial<StartupProduct>) => await updateDoc(doc(db, COLLECTION_NAME, tenantId, 'products', productId), data),
  deleteStartupProduct: async (tenantId: string, productId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'products', productId)),

  getMilestones: async (tenantId: string): Promise<StartupMilestone[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'milestones'), orderBy('date', 'desc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as StartupMilestone)); 
  },
  
  addMilestone: async (tenantId: string, data: Omit<StartupMilestone, 'id'>) => await addDoc(collection(db, COLLECTION_NAME, tenantId, 'milestones'), { ...data, createdAt: Date.now() }),
  updateMilestone: async (tenantId: string, milestoneId: string, data: Partial<StartupMilestone>) => await updateDoc(doc(db, COLLECTION_NAME, tenantId, 'milestones', milestoneId), data),
  deleteMilestone: async (tenantId: string, milestoneId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'milestones', milestoneId)),

  getMonevs: async (tenantId: string): Promise<TenantMonev[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'monevs'), orderBy('date', 'desc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TenantMonev)); 
  },
  
  addMonev: async (tenantId: string, data: Omit<TenantMonev, 'id'>) => await addDoc(collection(db, COLLECTION_NAME, tenantId, 'monevs'), { ...data, createdAt: Date.now() }),
  deleteMonev: async (tenantId: string, monevId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'monevs', monevId)),

  getKPIs: async (tenantId: string): Promise<TenantKPI[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'kpis'), orderBy('createdAt', 'desc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TenantKPI)); 
  },
  
  addKPI: async (tenantId: string, data: Omit<TenantKPI, 'id'>) => { 
    const kpiRef = await addDoc(collection(db, COLLECTION_NAME, tenantId, 'kpis'), { ...data, createdAt: Date.now() }); 
    await updateDoc(doc(db, COLLECTION_NAME, tenantId), { currentHealthScore: data.healthStatus }); 
    return kpiRef; 
  },
  deleteKPI: async (tenantId: string, kpiId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'kpis', kpiId)),

  getMentoringSessions: async (tenantId: string): Promise<MentoringSession[]> => { 
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'mentoring_sessions'), orderBy('date', 'desc')); 
    const snapshot = await getDocs(q); 
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MentoringSession)); 
  },
  
  addMentoringSession: async (tenantId: string, data: Omit<MentoringSession, 'id'>) => await addDoc(collection(db, COLLECTION_NAME, tenantId, 'mentoring_sessions'), { ...data, createdAt: Date.now() }),
  updateMentoringSession: async (tenantId: string, sessionId: string, data: Partial<MentoringSession>) => await updateDoc(doc(db, COLLECTION_NAME, tenantId, 'mentoring_sessions', sessionId), data),
  deleteMentoringSession: async (tenantId: string, sessionId: string) => await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'mentoring_sessions', sessionId)),

  getTenantRevenues: async (tenantId: string): Promise<TenantRevenue[]> => {
    const q = query(collection(db, COLLECTION_NAME, tenantId, 'revenues'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TenantRevenue));
  },
  
  addTenantRevenue: async (tenantId: string, data: Omit<TenantRevenue, 'id'>) => {
    return await addDoc(collection(db, COLLECTION_NAME, tenantId, 'revenues'), { ...data, createdAt: Date.now() });
  },
  
  deleteTenantRevenue: async (tenantId: string, revenueId: string) => {
    return await deleteDoc(doc(db, COLLECTION_NAME, tenantId, 'revenues', revenueId));
  }
};