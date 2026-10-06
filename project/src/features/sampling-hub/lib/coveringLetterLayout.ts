import type { jsPDF as JsPdfInstance } from 'jspdf';

export const PAGE = {
  width: 210,
  height: 297,
  marginTop: 20,
  marginBottom: 1,
  marginLeft: 15,
  marginRight: 15,
  contentWidth: 180, // 210 - 15 - 15
};

export const PDF_FONT = 'times';

export const FONT_SIZES = {
  governmentHeading: 15,
  departmentHeading: 13,
  body: 12,
  tableData: 11,
};

export const LINE_HEIGHT = 4.5;
export const PARAGRAPH_SPACING = 3;
export const FIRST_LINE_INDENT = 10;

export const LINE_HEIGHTS = {
  body: 1.15,
};

export type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function displayValue(value?: string | null): string {
  return value?.trim() ? value : '.............................';
}

export function createCoveringLetterDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string,
  subject: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title,
    subject,
    creator: 'AGRONIX',
  });
  return doc;
}

export async function drawWatermark(doc: JsPdfInstance) {
  try {
    const response = await fetch('/images/telangana-govt_emblem.webp');
    const blob = await response.blob();
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;

        // Large watermark size to show complete emblem (increased by 50% total)
        const watermarkWidth = 156;
        const watermarkHeight = 104; // Maintain aspect ratio (3:2)

        // Center the watermark on the page with proper margins
        const watermarkX = (PAGE.width - watermarkWidth) / 2;
        const watermarkY = (PAGE.height - watermarkHeight) / 2;

        // Try to set opacity using GState if available
        try {
          const gState = (doc as any).GState({ opacity: 0.14 });
          doc.setGState(gState);
        } catch (e) {
          // GState not supported, continue without opacity
        }

        // Draw watermark
        doc.addImage(dataUrl, 'WEBP', watermarkX, watermarkY, watermarkWidth, watermarkHeight);

        // Reset opacity if GState was used
        try {
          doc.setGState((doc as any).GState({ opacity: 1.0 }));
        } catch (e) {
          // GState not supported, ignore
        }

        resolve(null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading watermark image:', error);
  }
}

export function drawSalutation(cursor: PdfCursor) {
  const { doc } = cursor;

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sir/Madam,', PAGE.marginLeft, cursor.y);
}

export function drawSeparator(cursor: PdfCursor) {
  const { doc } = cursor;

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('******', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + 2;
}

/**
 * Shared closing block: indented request paragraph (optional) + "Thanking you."
 * Callers print their own trailing slip line (Form "P" / Information Slip / Form "V(D)").
 */
export function drawCoveringClosing(cursor: PdfCursor, closingText: string | null) {
  const { doc } = cursor;

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);

  if (closingText) {
    const firstLineIndent = 12;
    const firstLine = doc.splitTextToSize(closingText, PAGE.contentWidth - firstLineIndent)[0];
    const restText = closingText.slice(firstLine.length).trim();
    const restLines = restText ? doc.splitTextToSize(restText, PAGE.contentWidth) : [];
    doc.text(firstLine, PAGE.marginLeft + firstLineIndent, cursor.y);
    if (restLines.length) {
      doc.text(restLines, PAGE.marginLeft, cursor.y + LINE_HEIGHT);
    }
    cursor.y += ((1 + restLines.length) * LINE_HEIGHT) + PARAGRAPH_SPACING;
  }

  doc.text('Thanking you.', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
}

/**
 * Right-side signature block: "Yours faithfully," + designation + inspector line,
 * all centered on the designation's midpoint (right edge unchanged).
 */
export function drawCoveringSignature(cursor: PdfCursor, designationText: string, inspectorLabel: string) {
  const { doc } = cursor;

  // Leave -5mm blank space for signature
  cursor.y -= 5;

  const signatureX = PAGE.width - PAGE.marginRight;

  doc.setFont(PDF_FONT, 'bold');
  const signatureCenterX = signatureX - doc.getTextWidth(designationText) / 2;

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Yours faithfully,', signatureCenterX, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT;

  cursor.y += LINE_HEIGHT + 5; // Extra space

  doc.setFont(PDF_FONT, 'bold');
  doc.text(designationText, signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;

  doc.text(inspectorLabel, signatureCenterX, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
}

export function drawBranding(doc: JsPdfInstance) {
  // Save current state
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();

  // Set branding styling
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(128);

  // Position in bottom-right corner (10 units from edges)
  const brandingX = PAGE.width - 10;
  const brandingY = PAGE.height - 10;

  doc.text('AGRONIX', brandingX, brandingY, { align: 'right' });

  // Restore previous state
  doc.setFont(currentFont.fontName, currentFont.fontStyle);
  doc.setFontSize(currentFontSize);
  doc.setTextColor(0);
}
