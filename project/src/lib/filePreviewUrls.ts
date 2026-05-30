/** Normalize storage/public URLs for external document viewers (Office, Google). */
export function getViewerFileUrl(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return fileUrl;
  }
}

export function getOfficeViewerEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(getViewerFileUrl(fileUrl))}`;
}

export function getGoogleViewerEmbedUrl(fileUrl: string): string {
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(getViewerFileUrl(fileUrl))}`;
}

export function getGoogleViewerTabUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(getViewerFileUrl(fileUrl))}`;
}
