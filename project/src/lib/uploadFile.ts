import { supabase } from './supabase';

export function getPublicStorageUrl(filePath: string) {
  const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return data.publicUrl;
}

export function inferFileType(file: File) {
  if (file.type.startsWith('image/')) return 'image';
  const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
  return extension;
}

export async function uploadPortalFile(file: File, folder: string) {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  return {
    filePath,
    publicUrl: getPublicStorageUrl(filePath),
    fileType: inferFileType(file),
  };
}
