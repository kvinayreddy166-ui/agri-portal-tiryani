import type { jsPDF as JsPdfInstance } from 'jspdf';

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
