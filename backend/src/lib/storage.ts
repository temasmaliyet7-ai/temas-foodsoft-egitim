import { randomUUID } from 'node:crypto';
import { supabase, STORAGE_BUCKET } from './supabase.js';
import { badRequest, payloadTooLarge } from './errors.js';

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Gerçekten PNG mi? (istemci MIME'ına güvenme — magic byte kontrol et)
export function assertPng(buffer: Buffer): void {
  if (buffer.length > MAX_FILE_BYTES) {
    throw payloadTooLarge(`Dosya 10 MB sınırını aşıyor (${(buffer.length / 1048576).toFixed(1)} MB).`);
  }
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    throw badRequest('Yalnızca geçerli PNG dosyaları yüklenebilir.');
  }
}

export interface UploadedImage {
  storagePath: string;
  imageUrl: string;
}

export async function uploadTrainingPage(
  trainingId: string,
  buffer: Buffer,
): Promise<UploadedImage> {
  const storagePath = `trainings/${trainingId}/${randomUUID()}.png`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return { storagePath, imageUrl: data.publicUrl };
}

export async function deleteStorageObjects(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) {
    // Storage temizliği başarısız olsa bile akışı bozma — logla.
    console.warn('Storage silme uyarısı:', error.message);
  }
}
