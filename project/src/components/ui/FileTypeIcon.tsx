import React from 'react';
import { File, FileImage, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { getFileTypeLabel, resolveFileIdentity } from '../../lib/fileTypes';

interface FileTypeIconProps {
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FileTypeIcon({
  fileName = '',
  fileType,
  fileUrl,
  size = 'md',
  className = '',
}: FileTypeIconProps) {
  const { resolvedType } = resolveFileIdentity(fileName, fileType, fileUrl);
  const label = getFileTypeLabel(resolvedType);
  const Icon = getStandardIcon(resolvedType);

  const boxSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <span title={label} className="inline-flex shrink-0 items-center justify-center">
      <Icon
        aria-label={label}
        className={`text-slate-500 dark:text-slate-300 ${boxSize} ${className}`}
      />
    </span>
  );
}

export function resolveFileType(fileName?: string, fileType?: string, fileUrl?: string): string {
  return resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;
}

function getStandardIcon(fileType: string) {
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
