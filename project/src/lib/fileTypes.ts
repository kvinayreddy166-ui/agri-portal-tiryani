import { FileSpreadsheet, FileText, FileImage, File, FileType } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

export function isPreviewable(fileUrl: string, fileType?: string): boolean {
  const type = fileType || inferFileTypeFromName(fileUrl);
  if (/drive\.google\.com|docs\.google\.com/i.test(fileUrl)) return true;
  if (type === 'image') return true;
  if (type === 'pdf' || /\.pdf(\?|$)/i.test(fileUrl)) return true;
  if (type === 'doc' || type === 'excel') return true;
  if (/\.(docx?|xlsx?|csv)(\?|$)/i.test(fileUrl)) return true;
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(fileUrl);
}

export function usesGoogleViewer(fileType?: string, fileUrl?: string): boolean {
  const type = fileType || inferFileTypeFromName(fileUrl || '');
  if (type === 'pdf' || /\.pdf(\?|$)/i.test(fileUrl || '')) return true;
  if (type === 'doc' || type === 'excel') return true;
  return /\.(docx?|xlsx?|csv)(\?|$)/i.test(fileUrl || '');
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

export function getFileTypeIconSrc(fileType: string): string {
  switch (fileType) {
    case 'image':
      return '/images/file-icons/image.png';
    case 'pdf':
      return '/images/file-icons/pdf.png';
    case 'excel':
      return '/images/file-icons/excel.png';
    case 'doc':
      return '/images/file-icons/doc.png';
    default:
      return '/images/file-icons/doc.png';
  }
}

export function getFileTypeIcon(fileType: string): LucideIcon {
  switch (fileType) {
    case 'image':
      return FileImage;
    case 'pdf':
      return FileText;
    case 'excel':
      return FileSpreadsheet;
    case 'doc':
      return FileType;
    default:
      return File;
  }
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

export function getFileTypeTone(fileType: string): { bg: string; text: string; ring: string } {
  const tones: Record<string, { bg: string; text: string; ring: string }> = {
    pdf: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      ring: 'border-red-100 dark:border-red-900/70',
    },
    doc: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      ring: 'border-sky-100 dark:border-sky-900/70',
    },
    excel: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      ring: 'border-emerald-100 dark:border-emerald-900/70',
    },
    image: {
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      text: 'text-violet-700 dark:text-violet-300',
      ring: 'border-violet-100 dark:border-violet-900/70',
    },
    file: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      ring: 'border-slate-200 dark:border-slate-700',
    },
  };
  return tones[fileType] || tones.file;
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
