import { FileSpreadsheet, FileText, FileImage, File, FileType } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function inferFileTypeFromName(name: string, mimeType?: string): string {
  if (mimeType?.startsWith('image/')) return 'image';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  return ext || 'file';
}

export function isPreviewable(fileUrl: string, fileType?: string): boolean {
  const type = fileType || inferFileTypeFromName(fileUrl);
  if (type === 'image') return true;
  if (type === 'pdf' || /\.pdf(\?|$)/i.test(fileUrl)) return true;
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(fileUrl);
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
