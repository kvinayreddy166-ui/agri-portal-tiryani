import React from 'react';
import { getFileTypeIconSrc, getFileTypeLabel, resolveFileIdentity } from '../../lib/fileTypes';

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
  const iconSrc = getFileTypeIconSrc(resolvedType);
  const label = getFileTypeLabel(resolvedType);

  const boxSize =
    size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <img
      src={iconSrc}
      alt={label}
      title={label}
      className={`shrink-0 object-contain ${boxSize} ${className}`}
    />
  );
}

export function resolveFileType(fileName?: string, fileType?: string, fileUrl?: string): string {
  return resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;
}
