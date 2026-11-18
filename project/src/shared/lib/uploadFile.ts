import { supabase } from './supabase';
import { getContentType, inferFileTypeFromName, validateUploadFile } from './fileTypes';

export function getPublicStorageUrl(filePath: string) {
  const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return data.publicUrl;
}

export function inferFileType(file: File) {
  return inferFileTypeFromName(file.name, file.type);
}

export async function uploadPortalFile(file: File, folder: string, maxRetries = 3) {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;
  const contentType = getContentType(file);

  // Dynamic timeout based on file size: minimum 5 minutes, plus 1 minute per MB
  const fileSizeMB = file.size / (1024 * 1024);
  const timeoutMs = Math.max(300000, 60000 * fileSizeMB + 300000); // 5 min base + 1 min per MB

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Upload timed out')), timeoutMs);
      });

      const { error: uploadError } = await Promise.race([
        supabase.storage
          .from('uploads')
          .upload(filePath, file, {
            upsert: true,
            contentType,
            duplex: 'half',
          }),
        timeoutPromise,
      ]);

      if (uploadError) throw uploadError;

      return {
        filePath,
        publicUrl: getPublicStorageUrl(filePath),
        fileType: inferFileType(file),
      };
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: wait 2^attempt seconds before retry
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.warn(`Upload attempt ${attempt} failed, retrying in ${backoffMs}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
  
  throw new Error('Upload failed after maximum retries');
}

const PUBLIC_UPLOADS_MARKER = '/storage/v1/object/public/uploads/';

/** Extract the storage object path from a public uploads-bucket URL. */
export function storagePathFromPublicUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  const idx = fileUrl.indexOf(PUBLIC_UPLOADS_MARKER);
  if (idx < 0) return null;
  const path = decodeURIComponent(fileUrl.slice(idx + PUBLIC_UPLOADS_MARKER.length).split('?')[0] || '');
  return path || null;
}

/**
 * Permanently delete a file from the public `uploads` bucket.
 * Best-effort: returns false instead of throwing so record deletion can proceed.
 */
export async function deletePortalFile(fileUrl: string | null | undefined): Promise<boolean> {
  const path = storagePathFromPublicUrl(fileUrl);
  if (!path) return false;
  const { error } = await supabase.storage.from('uploads').remove([path]);
  if (error) {
    console.warn('Failed to delete storage object:', path, error.message);
    return false;
  }
  return true;
}

export async function uploadPortalFiles(files: File[], folder: string) {
  const results = [];
  for (const file of files) {
    results.push(await uploadPortalFile(file, folder));
  }
  return results;
}
