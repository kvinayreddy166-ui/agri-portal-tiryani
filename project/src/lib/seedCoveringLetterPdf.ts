import type { jsPDF as JsPdfInstance } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { addGovernmentEmblemWatermark } from './pdfWatermark';

type SeedCoveringLetterQueueItem = {
  sampleCode: string;
  seedName: string;
  variety: string;
  quantity: string;
  dateOfSampling: string;
  isCotton?: boolean;
};

type SeedCoveringLetterMetadata = {
  year: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  daoMemoNumber: string;
  daoMemoDate: string;
  division: string;
  officePhone: string;
};

type OfficerDetails = {
  officerName: string;
  qualification: string;
  manualQualification: string;
  designation: string;
  mandal: string;
  manualMandal: string;
  district: string;
  manualDistrict: string;
  pinCode: string;
  phone: string;
};

// Page Configuration - A4 Portrait
const PAGE = {
  width: 210,
  height: 297,
  marginTop: 20,
  marginBottom: 1,
  marginLeft: 20,
  marginRight: 15,
  contentWidth: 175, // 210 - 20 - 15
};

// Font Configuration
const PDF_FONT = 'times';

const FONT_SIZES = {
  governmentHeading: 15,
  departmentHeading: 13,
  body: 12,
  tableData: 11,
};

const LINE_HEIGHT = 4.5;
const PARAGRAPH_SPACING = 3;
const FIRST_LINE_INDENT = 10;
const LINE_HEIGHTS = {
  body: 1.15,
};

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateSeedCoveringLetterPdf(
  queue: SeedCoveringLetterQueueItem[],
  metadata: SeedCoveringLetterMetadata,
  officerDetails?: OfficerDetails,
  watermarkEnabled: boolean = false,
  laboratoryAddress?: string
) {
  const { jsPDF } = await import('jspdf');

  const doc = createDocument(jsPDF, 'Covering Letter - Seed Samples');

  await drawWatermark(doc);

  const cursor = {
    doc,
    y: PAGE.marginTop - 6,
    contentWidth: PAGE.contentWidth,
  };

  await drawGovernmentHeader(cursor);
  cursor.y += 8;
  
  cursor.y -= 4;
  
  drawFromToSections(cursor, officerDetails, laboratoryAddress);
  
  cursor.y -= 6;
  
  drawLetterDetails(cursor, metadata);
  cursor.y += LINE_HEIGHT;
  
  cursor.y -= 12;
  
  drawSalutation(cursor);
  cursor.y += 8;
  
  drawSubject(cursor, metadata, queue);
  cursor.y += PARAGRAPH_SPACING;
  
  drawReference(cursor, metadata, officerDetails);
  
  drawSeparator(cursor);
  
  drawBody(cursor, officerDetails, queue);
  cursor.y += PARAGRAPH_SPACING;
  
  cursor.y -= 3;
  
  drawSampleTableHeading(cursor);
  cursor.y += LINE_HEIGHT;
  
  drawSampleTable(cursor, queue);
  cursor.y = (doc as any).lastAutoTable.finalY + 6;
  
  drawClosing(cursor);
  cursor.y += 1;
  
  const footerHeight = calculateFooterHeight();
  const remainingSpace = PAGE.height - PAGE.marginBottom - cursor.y;
  
  if (remainingSpace < footerHeight) {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(10);
    doc.text('(Cont\'d....)', PAGE.width - PAGE.marginRight, PAGE.height - PAGE.marginBottom - 2, { align: 'right' });
    doc.addPage();
    await drawWatermark(doc);
    cursor.y = 35;
  }
  
  cursor.y -= 3;
  
  drawEnclosures(cursor, queue.length, queue);
  cursor.y += PARAGRAPH_SPACING;
  
  drawSignature(cursor);
  cursor.y += PARAGRAPH_SPACING;
  
  drawCopiesSection(cursor, officerDetails, metadata);

  drawBranding(doc);

  return doc;
}

function calculateFooterHeight(): number {
  let height = LINE_HEIGHT + PARAGRAPH_SPACING;
  height += -5 + LINE_HEIGHT + LINE_HEIGHT + 5 + LINE_HEIGHT + LINE_HEIGHT + PARAGRAPH_SPACING;
  height += LINE_HEIGHT + LINE_HEIGHT + LINE_HEIGHT;
  return height;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title,
    subject: 'Covering Letter for Seed Sample Submission',
    creator: 'AGRONIX',
  });
  return doc;
}

async function drawWatermark(doc: JsPdfInstance) {
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

async function drawGovernmentHeader(cursor: PdfCursor) {
  const { doc } = cursor;
  
  const emblemWidth = 26.36;
  const emblemHeight = 17.57;
  const horizontalGap = 1;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.governmentHeading);
  const govTextWidth = doc.getTextWidth('GOVERNMENT OF TELANGANA');
  
  doc.setFontSize(FONT_SIZES.departmentHeading);
  const deptTextWidth = doc.getTextWidth('DEPARTMENT OF AGRICULTURE');
  
  const maxTextWidth = Math.max(govTextWidth, deptTextWidth);
  const totalGroupWidth = emblemWidth + horizontalGap + maxTextWidth;
  const groupStartX = (PAGE.width - totalGroupWidth) / 2;
  
  const emblemY = cursor.y + LINE_HEIGHT / 2 - emblemHeight / 2 - 2;
  
  try {
    const response = await fetch('/images/telangana-govt_emblem.webp');
    const blob = await response.blob();
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        doc.addImage(dataUrl, 'WEBP', groupStartX, emblemY, emblemWidth, emblemHeight);
        resolve(null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading emblem image:', error);
  }
  
  const textStartX = groupStartX + emblemWidth + horizontalGap;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.governmentHeading);
  doc.text('GOVERNMENT OF TELANGANA', textStartX, cursor.y);
  
  // Calculate offset to align "D" of "DEPARTMENT" with "O" of "GOVERNMENT"
  const alignmentOffset = govTextWidth - deptTextWidth - 3; // Move left by one letter gap
  
  cursor.y += LINE_HEIGHT;
  
  doc.setFontSize(FONT_SIZES.departmentHeading);
  doc.text('DEPARTMENT OF AGRICULTURE', textStartX + alignmentOffset, cursor.y);
  cursor.y += LINE_HEIGHT + 2;
  
  doc.setFont(PDF_FONT, 'normal');
}

function drawFromToSections(cursor: PdfCursor, officerDetails?: OfficerDetails, laboratoryAddress?: string) {
  const { doc } = cursor;
  
  const leftColumnX = PAGE.marginLeft;
  const rightColumnX = PAGE.marginLeft + (PAGE.contentWidth * 0.52) + 13;
  const startY = cursor.y;
  
  // From section - left column
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('From:', leftColumnX, startY);
  
  let currentY = startY + LINE_HEIGHT;
  
  const officerName = officerDetails?.officerName || '';
  const qualification = officerDetails?.qualification || '';
  const manualQualification = officerDetails?.manualQualification || '';
  const resolvedQualification = qualification === 'Other' ? manualQualification : qualification;
  const officerNameWithQual = officerName && resolvedQualification ? `${officerName}, ${resolvedQualification},` : officerName;
  
  if (officerNameWithQual) {
    doc.setFont(PDF_FONT, 'bold');
    doc.text(officerNameWithQual, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  const designation = officerDetails?.designation || 'Mandal Agricultural Officer';
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${designation},`, leftColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  const mandal = officerDetails?.mandal === 'Others' ? officerDetails?.manualMandal : officerDetails?.mandal || officerDetails?.manualMandal || '';
  if (mandal) {
    doc.setFont(PDF_FONT, 'bold');
    doc.text(`${mandal} Mandal,`, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  const district = officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict || '';
  const pinCode = officerDetails?.pinCode || '';
  if (district) {
    doc.setFont(PDF_FONT, 'bold');
    const districtPin = pinCode ? `${district} -${pinCode},` : `${district},`;
    doc.text(districtPin, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  const phone = officerDetails?.phone || '';
  if (phone) {
    doc.setFont(PDF_FONT, 'bold');
    doc.text(`Cell : ${phone}.`, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  // To section - right column (left-aligned)
  doc.setFont(PDF_FONT, 'bold');
  doc.text('To:', rightColumnX, startY);
  
  currentY = startY + LINE_HEIGHT;
  const toAddress = laboratoryAddress ? laboratoryAddress.split('\n') : [
    '...................................................',
    '...................................................',
    '...................................................',
    '...................................................',
  ];
  
  doc.setFont(PDF_FONT, 'bold');
  toAddress.forEach(line => {
    doc.text(line, rightColumnX, currentY);
    currentY += LINE_HEIGHT;
  });
  
  cursor.y = currentY + LINE_HEIGHT;
}

function drawLetterDetails(cursor: PdfCursor, metadata: SeedCoveringLetterMetadata) {
  const { doc } = cursor;
  
  // Add spacing before letter number
  cursor.y += 4;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  
  const letterNumber = displayValue(metadata.letterNumber);
  const dateText = displayValue(formatDate(metadata.letterDate));
  
  const letterText = `Lr. No. ${letterNumber}    Dt. ${dateText}`;
  doc.text(letterText, PAGE.width / 2, cursor.y, { align: 'center' });
  
  // Add underline
  const textWidth = doc.getTextWidth(letterText);
  const textX = (PAGE.width - textWidth) / 2;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line(textX, cursor.y + 1, textX + textWidth, cursor.y + 1);
  
  cursor.y += LINE_HEIGHT + 8;
}

function drawSalutation(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sir/Madam,', PAGE.marginLeft, cursor.y);
}

function drawSubject(cursor: PdfCursor, metadata: SeedCoveringLetterMetadata, queue?: SeedCoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sub:', PAGE.marginLeft, cursor.y);
  
  doc.setFont(PDF_FONT, 'normal');
  
  // Check if this is a BT Protein covering letter (all samples are cotton)
  const isBtProteinLetter = queue && queue.length > 0 && queue.every(item => item.isCotton);
  
  // Use different subject based on letter type
  const subject = isBtProteinLetter
    ? `Seed Act 1966 – Seed (Control) Order 1983 – EP Act – 1986 –Quality Control – 2026-27– Submission of Seed samples drawn - Request for Quality analysis – Reg.`
    : `Seed Act 1966 – Seed (Control) Order 1983 – Quality Control – 2026-27– Submission of Seed samples drawn - Request for Quality analysis – Reg.`;
  
  const subjectX = PAGE.marginLeft + doc.getTextWidth('Sub: ');
  const availableWidth = PAGE.contentWidth - doc.getTextWidth('Sub: ');
  
  const splitSubject = doc.splitTextToSize(subject, availableWidth);
  doc.text(splitSubject, subjectX, cursor.y);
  
  cursor.y += (splitSubject.length * LINE_HEIGHT) + 1;
}

function drawReference(cursor: PdfCursor, metadata: SeedCoveringLetterMetadata, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Ref:', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  const ref1 = '1. C&DA, TS, Hyd Memo No. COMAG-SRC/SAMP/1/2026-SRC, Dt: 22.04.2026.';
  doc.text(ref1, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  const district = officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict;
  const ref2Text = `2. DAO ${displayValue(district)} Memo No. ${displayValue(metadata.daoMemoNumber)}, Dt. ${displayValue(formatDate(metadata.daoMemoDate))}.`;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text(ref2Text, PAGE.marginLeft + 5, cursor.y);
  
  cursor.y += LINE_HEIGHT + 1;
}

function drawSeparator(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('******', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + 2;
}

function drawBody(cursor: PdfCursor, officerDetails?: OfficerDetails, queue?: SeedCoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);
  
  const mandal = displayValue(officerDetails?.mandal === 'Others' ? officerDetails?.manualMandal : officerDetails?.mandal || officerDetails?.manualMandal);
  const district = displayValue(officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict);
  
  // Check if this is a cotton covering letter (all samples are cotton)
  const isCottonLetter = queue && queue.length > 0 && queue.every(item => item.isCotton);
  
  // Text segments with different font styles
  const testParameter = isCottonLetter ? 'BT Protein Quantification' : 'Purity, Moisture & Germination';
  
  const segments = [
    { text: 'In continuation to the subject cited above, I am herewith submitting the seed samples drawn from the input dealer premises in ', bold: false },
    { text: mandal, bold: true },
    { text: ' Mandal, ', bold: false },
    { text: district, bold: true },
    { text: ' District for Quality analysis (', bold: false },
    { text: testParameter, bold: true },
    { text: ') as per the allotment given by the District Agriculture Officer, ', bold: false },
    { text: district, bold: false },
    { text: '.', bold: false }
  ];
  
  let xPos = PAGE.marginLeft + FIRST_LINE_INDENT;
  let yPos = cursor.y;
  const maxWidth = PAGE.contentWidth;
  
  segments.forEach(segment => {
    doc.setFont(PDF_FONT, segment.bold ? 'bold' : 'normal');
    const words = segment.text.split(' ');
    
    words.forEach((word, wordIndex) => {
      const textToDraw = wordIndex === words.length - 1 ? word : word + ' ';
      const textWidth = doc.getTextWidth(textToDraw);
      
      if (xPos + textWidth > PAGE.marginLeft + maxWidth) {
        xPos = PAGE.marginLeft;
        yPos += LINE_HEIGHT;
      }
      
      doc.text(textToDraw, xPos, yPos);
      xPos += textWidth;
    });
  });
  
  cursor.y = yPos + LINE_HEIGHT + PARAGRAPH_SPACING;
}

function drawSampleTableHeading(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('The details of the samples drawn are as follows :', PAGE.marginLeft, cursor.y);
}

function drawSampleTable(cursor: PdfCursor, queue: SeedCoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  // Check if this is a cotton covering letter
  const isCottonLetter = queue.length > 0 && queue.every(item => item.isCotton);
  
  const tableData = queue.map((item, index) => [
    String(index + 1),
    item.seedName || '-',
    item.variety || '-',
    item.sampleCode || '-',
    isCottonLetter ? '25' : (item.quantity?.match(/\d+/)?.[0] || item.quantity || '-'),
    formatDate(item.dateOfSampling) || '-'
  ]);

  const columnWidths = [
    PAGE.contentWidth * 0.05,  // Sl. No. - 5%
    PAGE.contentWidth * 0.20,  // Crop - 20%
    PAGE.contentWidth * 0.28,  // Variety - 28%
    PAGE.contentWidth * 0.21,  // Sample Code - 21%
    PAGE.contentWidth * 0.12,  // Quantity - 12%
    PAGE.contentWidth * 0.14,  // Sampling Date - 14%
  ];

  autoTable(doc, {
    startY: cursor.y,
    head: [['S.No', 'Crop', 'Variety', 'Code No. of Sample', 'Quantity (gms)', 'Sampling Date']],
    body: tableData,
    theme: 'grid',
    margin: {
      left: PAGE.marginLeft,
      right: PAGE.marginRight,
    },
    styles: {
      font: PDF_FONT,
      fontSize: FONT_SIZES.tableData,
      cellPadding: 1.5,
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak',
      fillColor: false, // Transparent background to show watermark
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: FONT_SIZES.body,
      fillColor: false, // Transparent background to show watermark
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      halign: 'center',
      textColor: [0, 0, 0],
      fillColor: false, // Transparent background to show watermark
    },
    columnStyles: {
      0: { cellWidth: columnWidths[0], halign: 'center' },
      1: { cellWidth: columnWidths[1], halign: 'center' },
      2: { cellWidth: columnWidths[2], halign: 'center' },
      3: { cellWidth: columnWidths[3], halign: 'center' },
      4: { cellWidth: columnWidths[4], halign: 'center' },
      5: { cellWidth: columnWidths[5], halign: 'center' },
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    horizontalPageBreak: false,
  });
}

function drawClosing(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);
  
  const closingText = 'Hence, I request the kind authority to arrange for quality analysis and communicate the results to the above address at an early date.';
  const splitClosing = doc.splitTextToSize(closingText, PAGE.contentWidth);
  doc.text(splitClosing, PAGE.marginLeft, cursor.y);
  cursor.y += (splitClosing.length * LINE_HEIGHT) + PARAGRAPH_SPACING;
  
  doc.text('Thanking you.', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
  
  doc.text('Information Slip is kept with the sample.', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT + 1.5;
}

function drawEnclosures(cursor: PdfCursor, sampleCount: number, queue?: SeedCoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  // Check if this is a cotton covering letter
  const isCottonLetter = queue && queue.length > 0 && queue.every(item => item.isCotton);
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  
  if (isCottonLetter) {
    // For cotton, use Form II with sample count
    doc.text(`Enclosures: Form II (${sampleCount})`, PAGE.marginLeft, cursor.y);
  } else {
    doc.text(`Enclosures: Form V (${sampleCount})`, PAGE.marginLeft, cursor.y);
  }
}

function drawSignature(cursor: PdfCursor) {
  const { doc } = cursor;
  
  // Leave -5mm blank space for signature
  cursor.y -= 5;
  
  const signatureX = PAGE.width - PAGE.marginRight;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Yours faithfully,', signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
  
  cursor.y += LINE_HEIGHT + 5; // Extra space
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Mandal Agricultural Officer', signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
  
  doc.text('& Seed Inspector', signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
}

function drawCopiesSection(cursor: PdfCursor, officerDetails?: OfficerDetails, metadata?: SeedCoveringLetterMetadata) {
  const { doc } = cursor;
  
  const district = displayValue(officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict);
  const division = displayValue(metadata?.division);
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Copies submitted to:', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(11);
  doc.text(`1. The District Agriculture Officer, ${district} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.text(`2. The Asst. Director of Agriculture (R), ${division} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawBranding(doc: JsPdfInstance) {
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
  
  // Draw AGRONIX wordmark
  doc.text('AGRONIX', brandingX, brandingY, { align: 'right' });
  
  // Restore original state
  doc.setFont(currentFont.fontName, currentFont.fontStyle);
  doc.setFontSize(currentFontSize);
  doc.setTextColor(0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function displayValue(value?: string | null): string {
  return value?.trim() ? value : '.............................';
}

