import React from 'react';
import { Download, Eye } from 'lucide-react';

interface FileActionButtonsProps {
  fileUrl: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FileActionButtons({ fileUrl, className = '', size = 'md' }: FileActionButtonsProps) {
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass =
    size === 'sm'
      ? 'rounded-lg p-2'
      : 'rounded-xl p-2.5';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} text-emerald-700 transition hover:bg-emerald-50`}
        aria-label="View file"
        title="View"
      >
        <Eye className={iconClass} />
      </a>
      <a
        href={fileUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} text-sky-700 transition hover:bg-sky-50`}
        aria-label="Download file"
        title="Download"
      >
        <Download className={iconClass} />
      </a>
    </div>
  );
}
