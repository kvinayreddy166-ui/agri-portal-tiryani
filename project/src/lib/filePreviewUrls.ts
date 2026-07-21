/** Normalize storage/public URLs for external document viewers (Office, Google). */
export function getViewerFileUrl(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    // Remove any transformation parameters that might cause 415 errors
    url.searchParams.delete('thumb');
    url.searchParams.delete('width');
    url.searchParams.delete('height');
    url.searchParams.delete('resize');
    url.searchParams.delete('transform');
    return url.toString();
  } catch {
    return fileUrl;
  }
}

export function isGoogleDriveUrl(fileUrl: string): boolean {
  return /drive\.google\.com|docs\.google\.com/i.test(fileUrl);
}

export function extractGoogleDriveFileId(fileUrl: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = fileUrl.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** URL passed to Office / Google viewers (Drive links resolved to public preview or export). */
export function resolveViewerSourceUrl(fileUrl: string): string {
  const trimmed = fileUrl.trim();
  if (!isGoogleDriveUrl(trimmed)) {
    return getViewerFileUrl(trimmed);
  }

  const id = extractGoogleDriveFileId(trimmed);
  if (!id) return getViewerFileUrl(trimmed);

  if (/docs\.google\.com\/document/i.test(trimmed)) {
    return `https://docs.google.com/document/d/${id}/preview`;
  }
  if (/docs\.google\.com\/spreadsheets/i.test(trimmed)) {
    return `https://docs.google.com/spreadsheets/d/${id}/preview`;
  }
  if (/docs\.google\.com\/presentation/i.test(trimmed)) {
    return `https://docs.google.com/presentation/d/${id}/preview`;
  }

  return `https://drive.google.com/file/d/${id}/preview`;
}

/** Direct embed URL (Google native preview or Office Online). */
export function getOfficeViewerEmbedUrl(fileUrl: string): string {
  const src = resolveViewerSourceUrl(fileUrl);
  if (/docs\.google\.com\/.*\/preview|drive\.google\.com\/file\/d\/.*\/preview/i.test(src)) {
    return src;
  }
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
}

export function getGoogleViewerEmbedUrl(fileUrl: string): string {
  const src = resolveViewerSourceUrl(fileUrl);
  if (/docs\.google\.com\/.*\/preview/i.test(src)) {
    return src;
  }
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(src)}`;
}

export function getGoogleViewerTabUrl(fileUrl: string): string {
  const src = resolveViewerSourceUrl(fileUrl);
  if (isGoogleDriveUrl(fileUrl.trim())) {
    return getViewerFileUrl(fileUrl.trim());
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(src)}`;
}

export function getOfficeViewerTabUrl(fileUrl: string): string {
  const src = resolveViewerSourceUrl(fileUrl);
  if (/docs\.google\.com\/.*\/preview|drive\.google\.com\/file\/d\/.*\/preview/i.test(src)) {
    return src;
  }
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(src)}`;
}
