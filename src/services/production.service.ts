// Lokasi file: src/services/production.service.ts
import { collection, doc, addDoc, updateDoc, setDoc, deleteDoc, getDocs, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { ProductionOrder, WorkProgressLog, DeliveryOrderInfo } from '@/types/production.types';
import { MOCK_PRODUCTION_ORDERS } from '@/data/mock/productionMockData';

export const productionService = {
  getProductionRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'production_orders'),
  getProductionDoc: (id: string) => doc(db, 'artifacts', getAppId(), 'public', 'data', 'production_orders', id),

  /**
   * Mengambil semua pesanan jasa produksi diurutkan dari yang terbaru
   */
  getProductionOrders: async (maxLimit: number = 200): Promise<ProductionOrder[]> => {
    try {
      let docs: ProductionOrder[] = [];
      try {
        const q = query(productionService.getProductionRef(), orderBy('createdAt', 'desc'), limit(maxLimit));
        const snap = await getDocs(q);
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
      } catch (orderErr) {
        // Fallback jika single-field index belum propagate
        const qSimple = query(productionService.getProductionRef(), limit(maxLimit));
        const snap = await getDocs(qSimple);
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
        docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      // Jika database di Firestore masih kosong, berikan fallback mock orders agar UI langsung responsif
      if (docs.length === 0) {
        return MOCK_PRODUCTION_ORDERS;
      }
      return docs;
    } catch (err) {
      console.warn("[PRODUCTION SERVICE] Memakai mock data produksi sebagai fallback:", err);
      return MOCK_PRODUCTION_ORDERS;
    }
  },

  /**
   * Mengambil 1 pesanan produksi berdasarkan ID
   */
  getProductionOrderById: async (id: string): Promise<ProductionOrder | null> => {
    try {
      const snap = await getDoc(productionService.getProductionDoc(id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ProductionOrder;
    } catch (err) {
      console.error(`[PRODUCTION SERVICE] Gagal mengambil pesanan ${id}:`, err);
      return null;
    }
  },

  /**
   * Generate Nomor SPK / Work Order otomatis: SPK/PROD/YYYYMMDD/XXXX
   */
  generateOrderNumber: (): string => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SPK/PROD/${dateStr}/${randomSuffix}`;
  },

  /**
   * Generate Nomor Surat Jalan otomatis: SJ/PROD/YYYYMMDD/XXXX
   */
  generateDeliveryOrderNumber: (): string => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SJ/PROD/${dateStr}/${randomSuffix}`;
  },

  /**
   * Membuat pesanan produksi baru
   */
  createProductionOrder: async (data: Omit<ProductionOrder, 'id'>): Promise<string> => {
    const now = Date.now();
    const orderNumber = data.orderNumber || productionService.generateOrderNumber();
    
    // Hitung totalCost otomatis jika belum diisi
    const totalCost = data.items.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice), 0);
    const dpAmount = data.dpRequired ? Math.round((totalCost * (data.dpPercentage || 30)) / 100) : 0;

    const payload = {
      ...data,
      orderNumber,
      totalCost: data.totalCost > 0 ? data.totalCost : totalCost,
      dpAmount: data.dpAmount > 0 ? data.dpAmount : dpAmount,
      createdAt: now,
      updatedAt: now
    };

    // Bersihkan properti undefined
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(productionService.getProductionRef(), cleanPayload);
    return docRef.id;
  },

  /**
   * Memperbarui pesanan produksi
   */
  updateProductionOrder: async (id: string, data: Partial<ProductionOrder>): Promise<void> => {
    const cleanData = Object.fromEntries(
      Object.entries({ ...data, updatedAt: Date.now() }).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(productionService.getProductionDoc(id), cleanData);
  },

  /**
   * Menghapus pesanan produksi
   */
  deleteProductionOrder: async (id: string): Promise<void> => {
    await deleteDoc(productionService.getProductionDoc(id));
  },

  /**
   * Menambahkan entri catatan progres lapangan oleh teknisi bengkel
   */
  addProgressLog: async (id: string, log: Omit<WorkProgressLog, 'id'>, newProgress?: number): Promise<void> => {
    const order = await productionService.getProductionOrderById(id);
    if (!order) throw new Error("Pesanan produksi tidak ditemukan.");

    const newLogItem: WorkProgressLog = {
      id: Date.now().toString(),
      ...log,
      createdAt: Date.now()
    };

    const updatedNotes = [...(order.workNotes || []), newLogItem];
    const finalProgress = typeof newProgress === 'number' ? newProgress : log.percentage;

    let finalStatus = order.status;
    if (finalProgress >= 100 && order.status === 'IN_PRODUCTION') {
      finalStatus = 'QUALITY_CONTROL';
    } else if (finalProgress > 0 && order.status === 'APPROVED_WAITING_DP') {
      finalStatus = 'IN_PRODUCTION';
    }

    await updateDoc(productionService.getProductionDoc(id), {
      workNotes: updatedNotes,
      productionProgress: finalProgress,
      status: finalStatus,
      updatedAt: Date.now()
    });
  },

  /**
   * Menerbitkan Surat Jalan resmi dan memperbarui status menjadi DELIVERED
   */
  issueDeliveryOrder: async (id: string, deliveryInfo: DeliveryOrderInfo): Promise<string> => {
    const doNumber = deliveryInfo.deliveryOrderNumber || productionService.generateDeliveryOrderNumber();
    
    const finalDeliveryInfo: DeliveryOrderInfo = {
      ...deliveryInfo,
      deliveryOrderNumber: doNumber,
      createdAt: Date.now()
    };

    await updateDoc(productionService.getProductionDoc(id), {
      deliveryOrder: finalDeliveryInfo,
      status: 'DELIVERED',
      actualDeliveryDate: deliveryInfo.deliveryDate,
      updatedAt: Date.now()
    });

    return doNumber;
  },

  /**
   * Mengunggah berkas gambar teknik / CAD / drawing
   */
  uploadBlueprintFile: async (file: File): Promise<string> => {
    return await storageService.uploadFile(file, `blueprints/${getAppId()}`);
  },

  /**
   * Menyuntikkan paket mock data pesanan produksi ke Firestore untuk demo
   */
  seedMockOrders: async (): Promise<number> => {
    let count = 0;
    for (const order of MOCK_PRODUCTION_ORDERS) {
      const orderRef = productionService.getProductionDoc(order.id!);
      await setDoc(orderRef, { ...order, updatedAt: Date.now() }, { merge: true });
      count++;
    }
    return count;
  }
};
