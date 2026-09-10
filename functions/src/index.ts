import { setGlobalOptions } from "firebase-functions/v2";

// Konfigurasi Global Cloud Functions v2:
// - Region: asia-southeast2 (Jakarta)
// - Max Instances: 10 (pencegahan lonjakan biaya & over-scaling)
setGlobalOptions({
  region: "asia-southeast2",
  maxInstances: 10,
});

// --- MENG-EKSPOR SELURUH TRIGGER & CALLABLES KE FIREBASE ---

export * from './callables/dashboardStats';
export * from './callables/bookingManager';
export * from './callables/publicStats'; 
export * from './callables/alumniCache';
export * from './callables/tenantCache'; 
export * from './callables/catalogCache';
export * from './callables/assetCache';

export * from './triggers/tenantAuth';
export * from './triggers/purchaseAutomation';
export * from './triggers/customClaims';
export * from './triggers/storageAutomation';
export * from './triggers/tenantAggregation';
export * from './triggers/cacheInvalidation';