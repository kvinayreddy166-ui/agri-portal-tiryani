import React from 'react';
import { getFileTypeIcon, getFileTypeLabel, inferFileTypeFromName } from '../../lib/fileTypes';

interface FileTypeBadgeProps {
  fileName?: string;
  fileType?: string;
}

export function FileTypeBadge({ fileName = '', fileType }: FileTypeBadgeProps) {
  const resolvedType = inferFileTypeFromName(fileName, fileType);
  const Icon = getFileTypeIcon(resolvedType);

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
      {getFileTypeLabel(resolvedType)}
    </span>
  );
}
