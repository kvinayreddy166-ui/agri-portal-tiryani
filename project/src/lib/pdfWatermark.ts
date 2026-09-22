import type { jsPDF as JsPdfInstance } from 'jspdf';

let emblemDataUrlPromise: Promise<string | null> | null = null;

function loadEmblemDataUrl(): Promise<string | null> {
  if (!emblemDataUrlPromise) {
    emblemDataUrlPromise = fetch('/images/telangana-govt_emblem.webp')
      .then((response) => {
        if (!response.ok) throw new Error('emblem fetch failed');
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      )
      .catch((error) => {
        console.error('Error loading emblem watermark image:', error);
        return null;
      });
  }
  return emblemDataUrlPromise;
}

/**
 * Stamps the Telangana government emblem image as a faint centered watermark
 * on every page of the document (same style as the statutory forms).
 */
export async function addEmblemImageWatermark(doc: JsPdfInstance, enabled = true): Promise<void> {
  if (!enabled) return;
  const dataUrl = await loadEmblemDataUrl();
  if (!dataUrl) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.pages.length - 1;

  const watermarkWidth = 156;
  const watermarkHeight = 104;
  const watermarkX = (pageWidth - watermarkWidth) / 2;
  const watermarkY = (pageHeight - watermarkHeight) / 2;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    try {
      doc.setGState(new doc.GState({ opacity: 0.14 }));
    } catch {
      // GState not supported; draw without opacity
    }
    doc.addImage(dataUrl, 'WEBP', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
    doc.restoreGraphicsState();
  }
  doc.setPage(1);
}

/**
 * Adds a government emblem watermark to a PDF document
 * @param doc - The jsPDF instance
 * @param enabled - Whether the watermark should be enabled
 */
export function addGovernmentEmblemWatermark(doc: JsPdfInstance, enabled: boolean): void {
  if (!enabled) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.pages.length - 1; // Exclude the first page which is the page info

  // Telangana Government emblem text (using text representation)
  const emblemText = 'GOVERNMENT OF TELANGANA';
  const emblemSubtext = 'AGRICULTURE DEPARTMENT';

  // Add watermark to each page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Save current state
    doc.saveGraphicsState();

    // Set watermark properties
    doc.setTextColor(200, 200, 200); // Very light gray
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');

    // Calculate center position
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Rotate text for better watermark effect
    doc.setGState(new doc.GState({ opacity: 0.15 }));

    // Draw main emblem text centered
    doc.text(emblemText, centerX, centerY - 15, {
      align: 'center',
      angle: 45,
    });

    // Draw subtext
    doc.setFontSize(32);
    doc.setFont('helvetica', 'normal');
    doc.text(emblemSubtext, centerX, centerY + 15, {
      align: 'center',
      angle: 45,
    });

    // Restore graphics state
    doc.restoreGraphicsState();
  }
}
