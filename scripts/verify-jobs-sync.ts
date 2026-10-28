import fs from 'fs';
import path from 'path';
import { jobDbService } from '../src/services/jobDb.service';
import { filterAndSortJobs } from '../src/services/job.service';

async function verifySyncPipeline() {
  console.log('🔄 Menjalankan Uji Alur Sinkronisasi Penuh (Sync + Cache + Read)...\n');

  // 1. Eksekusi syncWeeklyJobs
  console.log('1. Memanggil jobDbService.syncWeeklyJobs({ force: true })...');
  const syncResult = await jobDbService.syncWeeklyJobs({ force: true });
  console.log('   Hasil syncResult:');
  console.log('   - Success:', syncResult.success);
  console.log('   - SyncedCount (di toast):', syncResult.syncedCount);
  console.log('   - Message:', syncResult.message);
  console.log('   - Metadata totalJobsInDb:', syncResult.metadata.totalJobsInDb);

  // 2. Baca kembali dari getJobsFromFirestore
  console.log('\n2. Membaca kembali dari jobDbService.getJobsFromFirestore()...');
  const jobsFromDb = await jobDbService.getJobsFromFirestore();
  console.log('   Total lowongan dibaca dari database/cache:', jobsFromDb.length);

  // 3. Uji filter untuk Admin (includeInactive: true)
  const adminView = filterAndSortJobs(jobsFromDb, { includeInactive: true });
  console.log('\n3. Tampilan Admin (includeInactive: true):');
  console.log('   Total lowongan muncul di Admin:', adminView.total);

  // 4. Uji filter untuk Publik (hanya aktif)
  const publicView = filterAndSortJobs(jobsFromDb, {});
  console.log('\n4. Tampilan Publik (hanya aktif):');
  console.log('   Total lowongan muncul di Publik:', publicView.total);

  // 5. Cek apakah SyncedCount == AdminView.total
  const isMatch = syncResult.syncedCount === adminView.total;
  console.log('\n========================================');
  if (isMatch) {
    console.log(`✅ VERIFIKASI SUKSES: Jumlah pada notifikasi toast (${syncResult.syncedCount}) PERSIS SAMA dengan daftar di admin (${adminView.total})!`);
  } else {
    console.warn(`⚠️ SELISIH TERDETEKSI: Toast=${syncResult.syncedCount}, Admin=${adminView.total}`);
  }
  console.log('========================================');

  process.exit(0);
}

verifySyncPipeline().catch(err => {
  console.error('❌ Error saat verifikasi:', err);
  process.exit(1);
});
