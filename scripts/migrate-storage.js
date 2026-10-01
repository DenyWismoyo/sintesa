const admin = require('d:/Project/teknopark/functions/node_modules/firebase-admin');
const path = require('path');

const sourceKeyPath = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/98fc9d66-0789-41ff-8e83-9c2e47d22c1d/scratch/sa-key.json';
const destKeyPath = path.join(__dirname, '..', 'service-account-katalog.json');

const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require(sourceKeyPath)),
  storageBucket: 'teknopark-surakarta.firebasestorage.app'
}, 'sourceApp');

const destApp = admin.initializeApp({
  credential: admin.credential.cert(require(destKeyPath)),
  storageBucket: 'katalog-solo-technopark.firebasestorage.app'
}, 'destApp');

async function migrateStorage() {
  console.log('Memeriksa file di bucket sumber (sintesa)...');
  const sourceBucket = sourceApp.storage().bucket();
  const destBucket = destApp.storage().bucket();

  const [files] = await sourceBucket.getFiles({ maxResults: 1000 });
  console.log(`Ditemukan ${files.length} file di bucket sintesa.`);

  let copied = 0;
  for (const file of files) {
    try {
      const destFile = destBucket.file(file.name);
      const [exists] = await destFile.exists();
      if (!exists) {
        const stream = file.createReadStream();
        const writeStream = destFile.createWriteStream({
          metadata: {
            contentType: file.metadata?.contentType,
            metadata: file.metadata?.metadata
          }
        });
        await new Promise((resolve, reject) => {
          stream.pipe(writeStream).on('finish', resolve).on('error', reject);
        });
        copied++;
        if (copied % 25 === 0) {
          console.log(`  -> Berhasil menyalin ${copied} file...`);
        }
      }
    } catch (e) {
      console.error(`Gagal menyalin file ${file.name}:`, e.message);
    }
  }

  console.log(`Selesai migrasi Storage! Total ${copied} file baru disalin.`);
}

migrateStorage().catch(console.error);
