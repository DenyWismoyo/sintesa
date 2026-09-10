import { onObjectFinalized, onObjectDeleted } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import sharp from "sharp";

// Pastikan admin terinisialisasi
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * TRIGGER 1: MEMBUAT THUMBNAIL OTOMATIS
 * Berjalan saat ada file baru yang diunggah ke Firebase Storage.
 */
export const generateThumbnail = onObjectFinalized(
  {
    bucket: "sintesa",
    region: "asia-southeast2",
    memory: "512MiB",
    cpu: 1,
  },
  async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name; 
    const contentType = event.data.contentType;

    // Validasi: Hentikan jika bukan gambar atau sudah berupa thumbnail
    if (!contentType || !contentType.startsWith("image/")) return;
    const fileName = path.basename(filePath);
    if (fileName.startsWith("thumb_")) return;

    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    
    // Kita ubah ekstensi jadi .webp untuk kompresi maksimal
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const thumbFileName = `thumb_${fileNameWithoutExt}.webp`;
    
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

    try {
      console.log(`Membuat thumbnail untuk: ${filePath}`);
      await bucket.file(filePath).download({ destination: tempFilePath });

      await sharp(tempFilePath)
        .resize({ width: 500, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(tempThumbPath);

      await bucket.upload(tempThumbPath, {
        destination: thumbFilePath,
        metadata: {
          contentType: "image/webp",
          metadata: { isThumbnail: "true", originalFile: filePath }
        },
      });

      console.log(`Berhasil membuat thumbnail: ${thumbFilePath}`);
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(tempThumbPath);
    } catch (error) {
      console.error(`Gagal membuat thumbnail untuk ${filePath}:`, error);
    }
  }
);

/**
 * TRIGGER 2: MENGHAPUS THUMBNAIL OTOMATIS
 * Berjalan saat gambar asli dihapus (melalui aplikasi Frontend / Dashboard Firebase).
 */
export const deleteThumbnail = onObjectDeleted(
  {
    bucket: "sintesa",
    region: "asia-southeast2"
  },
  async (event) => {
    const filePath = event.data.name;
    const fileName = path.basename(filePath);

    // Jika yang dihapus adalah thumbnail itu sendiri, hentikan agar tidak infinite loop
    if (fileName.startsWith("thumb_")) {
      return;
    }

    const fileBucket = event.data.bucket;
    const bucket = admin.storage().bucket(fileBucket);

    // Rekonstruksi nama file thumbnail yang sesuai (.webp)
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const thumbFileName = `thumb_${fileNameWithoutExt}.webp`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);

    try {
      const thumbFile = bucket.file(thumbFilePath);
      
      // Cek apakah thumbnail tersebut eksis di Storage
      const [exists] = await thumbFile.exists();
      if (exists) {
        await thumbFile.delete();
        console.log(`Thumbnail yatim-piatu (${thumbFilePath}) berhasil dihapus secara otomatis.`);
      }
    } catch (error) {
      console.error(`Gagal menghapus thumbnail untuk ${filePath}:`, error);
    }
  }
);