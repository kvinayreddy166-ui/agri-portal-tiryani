import React from 'react';
import { getFileTypeIconSrc, getFileTypeLabel, inferFileTypeFromName } from '../../lib/fileTypes';

interface FileTypeBadgeProps {
  fileName?: string;
  fileType?: string;
  iconOnly?: boolean;
}

export function FileTypeBadge({ fileName = '', fileType, iconOnly = false }: FileTypeBadgeProps) {
  const resolvedType = inferFileTypeFromName(fileName, fileType);
  const iconSrc = getFileTypeIconSrc(resolvedType);
  const label = getFileTypeLabel(resolvedType);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={label}
      aria-label={label}
    >
      <img src={iconSrc} alt={label} className="h-7 w-7 object-contain" />
      {!iconOnly && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>}
    </span>
  );
}
