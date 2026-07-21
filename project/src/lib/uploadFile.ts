import { supabase } from './supabase';
import { getContentType, inferFileTypeFromName, validateUploadFile } from './fileTypes';

export function getPublicStorageUrl(filePath: string) {
  const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return data.publicUrl;
}

export function inferFileType(file: File) {
  return inferFileTypeFromName(file.name, file.type);
}

export async function uploadPortalFile(file: File, folder: string) {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;
  const contentType = getContentType(file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for uploads

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
    throw error;
  }
}

export async function uploadPortalFiles(files: File[], folder: string) {
  const results = [];
  for (const file of files) {
    results.push(await uploadPortalFile(file, folder));
  }
  return results;
}
