import React from 'react';
import { getFileTypeIcon, getFileTypeLabel, getFileTypeTone, inferFileTypeFromName } from '../../lib/fileTypes';

interface FileTypeBadgeProps {
  fileName?: string;
  fileType?: string;
  iconOnly?: boolean;
}

export function FileTypeBadge({ fileName = '', fileType, iconOnly = false }: FileTypeBadgeProps) {
  const resolvedType = inferFileTypeFromName(fileName, fileType);
  const Icon = getFileTypeIcon(resolvedType);
  const tone = getFileTypeTone(resolvedType);
  const label = getFileTypeLabel(resolvedType);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold ${tone.bg} ${tone.text} ${tone.ring}`}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {!iconOnly && label}
    </span>
  );
}
