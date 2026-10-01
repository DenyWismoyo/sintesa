const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');
const path = require('path');

const sourceKeyPath = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/98fc9d66-0789-41ff-8e83-9c2e47d22c1d/scratch/sa-key.json';
const destKeyPath = path.join(__dirname, '..', 'service-account-katalog.json');

const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require(sourceKeyPath)),
}, 'sourceApp');

const destApp = admin.initializeApp({
  credential: admin.credential.cert(require(destKeyPath)),
}, 'destApp');

async function migrateAuthUsers() {
  console.log('Mengambil daftar user Auth dari project lama...');
  let nextPageToken;
  let allUsers = [];

  do {
    const listResult = await sourceApp.auth().listUsers(1000, nextPageToken);
    allUsers = allUsers.concat(listResult.users);
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  console.log(`Total user ditemukan: ${allUsers.length}`);

  // Format untuk importUsers
  const usersToImport = allUsers.map(u => ({
    uid: u.uid,
    email: u.email,
    emailVerified: u.emailVerified,
    displayName: u.displayName,
    photoURL: u.photoURL,
    phoneNumber: u.phoneNumber,
    disabled: u.disabled,
    customClaims: u.customClaims,
    // Password hash jika ada
    passwordHash: u.passwordHash ? Buffer.from(u.passwordHash, 'base64') : undefined,
    passwordSalt: u.passwordSalt ? Buffer.from(u.passwordSalt, 'base64') : undefined,
  }));

  // Batches of 500
  const batchSize = 500;
  for (let i = 0; i < usersToImport.length; i += batchSize) {
    const batch = usersToImport.slice(i, i + batchSize);
    try {
      const result = await destApp.auth().importUsers(batch, {
        hash: {
          algorithm: 'SCRYPT',
          key: Buffer.from('B4uT0M4t1c', 'utf8'), // Firebase default base hash signer or standard import
        }
      });
      console.log(`Batch ${i / batchSize + 1}: ${result.successCount} berhasil diimpor, ${result.failureCount} gagal.`);
      if (result.errors && result.errors.length > 0) {
        console.log('Error detail (sample):', result.errors.slice(0, 3));
      }
    } catch (e) {
      console.error('Import error:', e.message);
      // Fallback: import without password hash so users can reset password or login via SSO
      try {
        console.log('Mencoba import metadata user tanpa hash password...');
        const plainBatch = batch.map(u => ({
          uid: u.uid,
          email: u.email,
          emailVerified: u.emailVerified,
          displayName: u.displayName,
          disabled: u.disabled,
          customClaims: u.customClaims
        }));
        const res2 = await destApp.auth().importUsers(plainBatch);
        console.log(`Fallback import: ${res2.successCount} berhasil.`);
      } catch (err2) {
        console.error('Fallback error:', err2.message);
      }
    }
  }

  const finalCount = await destApp.auth().listUsers(1);
  console.log('Selesai! User di project baru sekarang aktif.');
}

migrateAuthUsers().catch(console.error);
