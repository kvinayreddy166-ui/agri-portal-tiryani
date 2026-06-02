import React from 'react';
import { File, FileImage, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { getFileTypeColor, getFileTypeLabel, inferFileTypeFromName } from '../../lib/fileTypes';

interface FileTypeBadgeProps {
  fileName?: string;
  fileType?: string;
  iconOnly?: boolean;
}

export function FileTypeBadge({ fileName = '', fileType, iconOnly = false }: FileTypeBadgeProps) {
  const resolvedType = inferFileTypeFromName(fileName, fileType);
  const label = getFileTypeLabel(resolvedType);
  const Icon = getStandardIcon(resolvedType);
  const color = getFileTypeColor(resolvedType);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={label}
      aria-label={label}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      {!iconOnly && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>}
    </span>
  );
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
