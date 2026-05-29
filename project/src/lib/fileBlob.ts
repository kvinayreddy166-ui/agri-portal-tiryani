/** Fetch remote file as blob URL for inline preview (avoids cross-origin download behavior). */
export async function fetchBlobUrl(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl, { mode: 'cors' });
  if (!res.ok) throw new Error('Failed to load file for preview');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Programmatic download that works for cross-origin Supabase public URLs. */
export async function downloadFileFromUrl(fileUrl: string, fileName?: string) {
  const res = await fetch(fileUrl, { mode: 'cors' });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
