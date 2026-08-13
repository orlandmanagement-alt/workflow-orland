import { AwsClient } from 'aws4fetch';
import { Bindings } from '../index'; // Sesuaikan path ini dengan lokasi file type Bindings Anda

/**
 * Menghapus file dari Cloudflare R2 secara aman menggunakan AWS V4 Signature
 */
export async function deleteFromR2(env: Bindings, key: string): Promise<boolean> {
  if (!key) return false;

  // Cek apakah kredensial R2 sudah terpasang
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.CF_ACCOUNT_ID) {
    console.error("R2 Credentials missing in environment");
    return false;
  }

  const aws = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const bucketName = env.R2_BUCKET_NAME || 'orland-media';
  const url = `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  try {
    const response = await aws.fetch(url, { method: 'DELETE' });
    if (!response.ok) {
        console.error(`Gagal menghapus dari R2: ${response.status} - ${await response.text()}`);
    }
    return response.ok;
  } catch (error) {
    console.error("Kesalahan jaringan saat menghapus dari R2:", error);
    return false;
  }
}

/**
 * Ekstrak 'Key' (Path S3) dari URL Publik
 * Contoh: "https://cdn.orlandmanagement.com/media/profiles/foto.jpg" -> "profiles/foto.jpg"
 */
export function extractR2Key(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  // Memotong URL berdasarkan path '/media/' (sesuaikan dengan format CDN Anda)
  const parts = url.split('/media/');
  if (parts.length > 1) {
    return parts[1]; // Mengembalikan string setelah '/media/'
  }
  return null;
}