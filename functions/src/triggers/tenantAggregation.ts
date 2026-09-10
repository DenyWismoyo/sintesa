import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Trigger ini otomatis berjalan jika ada perubahan di sub-koleksi products, team, atau milestones.
// Ini mewujudkan arsitektur 1-Read untuk Profil Detail.
export const aggregateTenantSubcollections = onDocumentWritten("tenants/{tenantId}/{collectionId}/{docId}", async (event) => {
  const { tenantId, collectionId } = event.params;
  
  // Hanya proses sub-koleksi yang relevan untuk publik
  if (!['products', 'team', 'milestones'].includes(collectionId)) {
    return null;
  }

  try {
    const subCollectionRef = db.collection(`tenants/${tenantId}/${collectionId}`);
    const snapshot = await subCollectionRef.get();
    
    const aggregatedData: any[] = [];
    snapshot.forEach(doc => {
      aggregatedData.push({ id: doc.id, ...doc.data() });
    });

    // Simpan hasil agregasi ke dokumen induk (Tenant)
    const updatePayload: any = {};
    if (collectionId === 'products') updatePayload.aggregatedProducts = aggregatedData;
    if (collectionId === 'team') updatePayload.aggregatedTeam = aggregatedData;
    if (collectionId === 'milestones') updatePayload.aggregatedMilestones = aggregatedData;

    await db.collection('tenants').doc(tenantId).update(updatePayload);
    console.log(`[AGREGASI] Berhasil menyatukan ${aggregatedData.length} data ${collectionId} ke tenant ${tenantId}`);

    return true;
  } catch (error) {
    console.error(`[AGREGASI ERROR] Gagal melakukan agregasi untuk ${tenantId}:`, error);
    return false;
  }
});