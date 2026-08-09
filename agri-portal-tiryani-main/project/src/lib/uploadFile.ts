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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          upsert: true,
          contentType,
          duplex: 'half',
        });
      
      clearTimeout(timeoutId);

      if (uploadError) throw uploadError;

      return {
        filePath,
        publicUrl: getPublicStorageUrl(filePath),
        fileType: inferFileType(file),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait 2^attempt seconds before retry
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.warn(`Upload attempt ${attempt} failed, retrying in ${backoffMs}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  throw new Error('Upload failed after maximum retries');
}

export async function uploadPortalFiles(files: File[], folder: string) {
  const results = [];
  for (const file of files) {
    results.push(await uploadPortalFile(file, folder));
  }
  return results;
}
