export function inferFileTypeFromName(name: string, mimeType?: string): string {
  const cleanName = name.split('?')[0].split('#')[0];
  const ext = cleanName.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['ppt', 'pptx'].includes(ext)) return 'doc';

  const normalizedType = mimeType?.toLowerCase();
  if (normalizedType && ['image', 'pdf', 'excel', 'doc'].includes(normalizedType)) {
    return normalizedType;
  }
  if (normalizedType === 'document' || normalizedType === 'word') return 'doc';
  if (normalizedType === 'spreadsheet') return 'excel';
  if (normalizedType?.includes('pdf')) return 'pdf';
  if (normalizedType?.includes('spreadsheet') || normalizedType?.includes('excel') || normalizedType?.includes('csv')) {
    return 'excel';
  }
  if (normalizedType?.includes('wordprocessing') || normalizedType?.includes('msword')) return 'doc';
  if (mimeType?.startsWith('image/')) return 'image';

  return ext || normalizedType || 'file';
}

export function resolveFileIdentity(
  fileName?: string,
  fileType?: string,
  fileUrl?: string
): { displayName: string; resolvedType: string } {
  const url = fileUrl || '';
  const urlBase = url.split('?')[0].split('#')[0].split('/').pop() || '';
  const cleanTitle = (fileName || '').split('?')[0].split('#')[0];
  const hasExtension = (value: string) => /\.[a-z0-9]{2,5}$/i.test(value);

  const displayName = hasExtension(cleanTitle)
    ? cleanTitle
    : hasExtension(urlBase)
      ? urlBase
      : cleanTitle || urlBase || 'file';

  let resolvedType = inferFileTypeFromName(displayName, fileType);
  if (resolvedType === 'file' && url) {
    resolvedType = inferFileTypeFromName(url, fileType);
  }
  if (resolvedType === 'file' && urlBase) {
    resolvedType = inferFileTypeFromName(urlBase, fileType);
  }

  return { displayName, resolvedType };
}

export function resolveFileType(fileName?: string, fileType?: string, fileUrl?: string): string {
  return resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;
}

export function getFileTypeLabel(fileType: string): string {
  const labels: Record<string, string> = {
    image: 'Image',
    pdf: 'PDF',
    excel: 'Excel',
    doc: 'Word',
    file: 'File',
  };
  return labels[fileType] || fileType.toUpperCase();
}

export function getFileTypeColor(fileType: string) {
  switch (fileType) {
    case 'doc':
      return 'text-blue-600 dark:text-blue-400';
    case 'excel':
      return 'text-green-600 dark:text-green-400';
    case 'pdf':
      return 'text-red-600 dark:text-red-400';
    case 'image':
      return 'text-rose-900 dark:text-rose-300';
    default:
      return 'text-slate-500 dark:text-slate-300';
  }
}

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_UPLOAD_EXT = [
  ...ALLOWED_IMAGE_EXT,
  'pdf',
  'xlsx',
  'xls',
  'csv',
  'doc',
  'docx',
];

export function getContentType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  if (ext && map[ext]) return map[ext];
  return 'application/octet-stream';
}

export function validateUploadFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['heic', 'heif', 'bmp', 'svg'].includes(ext)) {
    return 'HEIC/BMP/SVG are not supported. Please save the image as JPG or PNG and try again.';
  }
  if (!ALLOWED_UPLOAD_EXT.includes(ext)) {
    return `File type ".${ext}" is not allowed. Use PDF, Word, Excel, or JPG/PNG/WebP/GIF images.`;
  }
  if (file.size > 50 * 1024 * 1024) {
    return 'File exceeds 50 MB limit.';
  }
  const ct = getContentType(file);
  if (ct === 'application/octet-stream') {
    return 'Could not determine file type. Rename the file with a proper extension.';
  }
  return null;
}

export function validateImageUploadFile(file: File, maxSizeMb = 10): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_IMAGE_EXT.includes(ext)) {
    return `Image type ".${ext || 'unknown'}" is not allowed. Use JPG, PNG, WebP, or GIF.`;
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `Image exceeds ${maxSizeMb} MB limit.`;
  }
  const contentType = getContentType(file);
  if (!contentType.startsWith('image/')) {
    return 'Selected file is not a valid image.';
  }
  return null;
}
