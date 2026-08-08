import type { jsPDF as JsPdfInstance } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

type CoveringLetterQueueItem = {
  sampleCode: string;
  fertilizerName: string;
  quantity: string;
  dateOfSampling: string;
};

type LetterType = 'quality-analysis' | 'safe-custody';

type CoveringLetterMetadata = {
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
  marginBottom: 1, // Set to 1 unit
  marginLeft: 20,
  marginRight: 15,
  contentWidth: 175, // 210 - 20 - 15
};

// Font Configuration - Roboto Serif (using times as fallback)
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

export async function generateCoveringLetterPdf(
  queue: CoveringLetterQueueItem[],
  metadata: CoveringLetterMetadata,
  officerDetails?: OfficerDetails,
  letterType: LetterType = 'quality-analysis'
) {
  const { jsPDF } = await import('jspdf');
  
  // Auto-increment letter number based on letter type
  const letterNumber = letterType === 'quality-analysis' 
    ? metadata.letterNumber 
    : (() => {
        // Parse the serial number at the beginning (before first slash)
        const match = metadata.letterNumber.match(/^(\d+)/);
        if (!match) return metadata.letterNumber;
        
        const serial = parseInt(match[1], 10);
        const incrementedSerial = serial + 1;
        
        // Preserve original width of serial number (e.g., 01 → 02, 09 → 10)
        const originalWidth = match[1].length;
        const paddedSerial = incrementedSerial.toString().padStart(originalWidth, '0');
        
        // Replace the serial number in the original string
        return metadata.letterNumber.replace(/^\d+/, paddedSerial);
      })();
  
  const updatedMetadata = { ...metadata, letterNumber };
  
  const doc = createDocument(jsPDF, 'Covering Letter - Fertilizer Samples');
  
  // Set bottom margin based on letter type
  const currentMarginBottom = letterType === 'safe-custody' ? 1 : 1; // 1 unit for both letters
  
  const cursor = {
    doc,
    y: letterType === 'quality-analysis' ? PAGE.marginTop - 6 : PAGE.marginTop - 3, // Reduce upper margin by 6 units for Portion 1, 3 units for Portion 3
    contentWidth: PAGE.contentWidth,
  };

  await drawGovernmentHeader(cursor);
  cursor.y += 8; // 8mm below header
  
  // Move entire address block upward by 4 units
  cursor.y -= 4;
  
  drawFromToSections(cursor, officerDetails, letterType);
  
  // Move To section and all subsequent content upward by 6 units
  cursor.y -= 6;
  
  drawLetterDetails(cursor, updatedMetadata);
  cursor.y += LINE_HEIGHT;
  
  // Move entire body content upward by 12 units
  cursor.y -= 12;
  
  drawSalutation(cursor);
  cursor.y += 8;
  
  drawSubject(cursor, updatedMetadata, letterType);
  cursor.y += PARAGRAPH_SPACING;
  
  drawReference(cursor, metadata, officerDetails);
  
  drawSeparator(cursor);
  
  // Move body text upward by 2 units for Portion 1 (Quality Analysis)
  if (letterType === 'quality-analysis') {
    cursor.y -= 2;
  }
  
  drawBody(cursor, officerDetails, letterType);
  cursor.y += PARAGRAPH_SPACING;
  
  // Move sample table heading upward by 3 units for Portion 1 (Quality Analysis)
  if (letterType === 'quality-analysis') {
    cursor.y -= 3;
  }
  
  drawSampleTableHeading(cursor, letterType);
  cursor.y += LINE_HEIGHT;
  
  drawSampleTable(cursor, queue);
  cursor.y = (doc as any).lastAutoTable.finalY + 6;
  
  // Draw closing paragraph (flows naturally with body text)
  drawClosing(cursor, letterType);
  cursor.y += 1;
  
  // Calculate footer block height (Enclosures + Signature + Copies only)
  const footerHeight = calculateFooterHeight();
  const remainingSpace = PAGE.height - currentMarginBottom - cursor.y;
  
  // If insufficient space for footer block, create new page
  if (remainingSpace < footerHeight) {
    // Add (Cont'd....) at bottom right before page break
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(10);
    doc.text('(Cont\'d....)', PAGE.width - PAGE.marginRight, PAGE.height - currentMarginBottom - 2, { align: 'right' });
    doc.addPage();
    cursor.y = 35; // 3.5 cm upper margin for second page
  }
  
  // Move signature and copies section upward by 3 units
  cursor.y -= 3;
  
  // Draw footer block (always kept together)
  drawEnclosures(cursor, queue.length);
  cursor.y += PARAGRAPH_SPACING;
  
  drawSignature(cursor, officerDetails);
  cursor.y += PARAGRAPH_SPACING;
  
  drawCopiesSection(cursor, officerDetails, updatedMetadata);

  // Add AGRONIX branding to bottom-right corner of every page
  drawBranding(doc);

  return doc;
}

function calculateFooterHeight(): number {
  // Calculate height of footer block only (Enclosures + Signature + Copies)
  // Closing paragraph is NOT included in footer pagination
  
  // Enclosures line
  let height = LINE_HEIGHT + PARAGRAPH_SPACING;
  
  // Signature section (negative space + Yours faithfully + extra space + designation + Fertilizer Inspector + spacing)
  height += -5 + LINE_HEIGHT + LINE_HEIGHT + 5 + LINE_HEIGHT + LINE_HEIGHT + PARAGRAPH_SPACING;
  
  // Copies section (heading + 2 lines)
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
    subject: 'Covering Letter for Fertilizer Sample Submission',
    creator: 'AGRONIX',
  });
  return doc;
}

async function drawGovernmentHeader(cursor: PdfCursor) {
  const { doc } = cursor;
  
  // Add Telangana Government emblem to the left of the header text
  const emblemWidth = 23.96; // Increased width by another 10% (21.78 * 1.1)
  const emblemHeight = 15.97; // Increased height by another 10% (14.52 * 1.1)
  const horizontalGap = 3; // Reduced gap to move logo closer to text
  
  // Calculate text width for centering
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.governmentHeading);
  const govTextWidth = doc.getTextWidth('GOVERNMENT OF TELANGANA');
  
  doc.setFontSize(FONT_SIZES.departmentHeading);
  const deptTextWidth = doc.getTextWidth('DEPARTMENT OF AGRICULTURE');
  
  const maxTextWidth = Math.max(govTextWidth, deptTextWidth);
  const totalGroupWidth = emblemWidth + horizontalGap + maxTextWidth;
  const groupStartX = (PAGE.width - totalGroupWidth) / 2;
  
  // Emblem position (vertically centered with the two-line heading, moved 2 units up)
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
    // Continue without emblem if image fails to load
  }
  
  // Text position (to the right of emblem)
  const textStartX = groupStartX + emblemWidth + horizontalGap;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.governmentHeading);
  doc.text('GOVERNMENT OF TELANGANA', textStartX, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFontSize(FONT_SIZES.departmentHeading);
  doc.text('DEPARTMENT OF AGRICULTURE', textStartX, cursor.y);
  cursor.y += LINE_HEIGHT + 2;
  
  doc.setFont(PDF_FONT, 'normal');
}

function drawFromToSections(cursor: PdfCursor, officerDetails?: OfficerDetails, letterType: LetterType = 'quality-analysis') {
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
  
  const designation = officerDetails?.designation || 'Mandal Agriculture Officer';
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${designation},`, leftColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  const mandal = officerDetails?.mandal || officerDetails?.manualMandal || '';
  if (mandal) {
    doc.setFont(PDF_FONT, 'bold');
    doc.text(`${mandal} Mandal,`, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  const district = officerDetails?.district || officerDetails?.manualDistrict || '';
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
  const toAddress = letterType === 'safe-custody' 
    ? [
        'The Designated Authority,',
        'JDA Soil Correlator,',
        'Fertilizer Coding Centre,',
        'SAMETI Complex, Old Malakpet,',
        'Hyderabad - 500036.',
      ]
    : [
        'The Assistant Director of Agriculture,',
        'Fertilizer Coding Centre,',
        'SAMETI Complex,',
        'Old Malakpet,',
        'Hyderabad - 500036.',
      ];
  
  doc.setFont(PDF_FONT, 'bold');
  toAddress.forEach(line => {
    doc.text(line, rightColumnX, currentY);
    currentY += LINE_HEIGHT;
  });
  
  cursor.y = currentY + LINE_HEIGHT;
}

function drawLetterDetails(cursor: PdfCursor, metadata: CoveringLetterMetadata) {
  const { doc } = cursor;
  
  // Add spacing before letter number
  cursor.y += 4;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  
  const letterNumber = metadata.letterNumber || '_________';
  const dateText = formatDate(metadata.letterDate) || '_________';
  
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

function drawSubject(cursor: PdfCursor, metadata: CoveringLetterMetadata, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sub: ', PAGE.marginLeft, cursor.y);
  
  doc.setFont(PDF_FONT, 'normal');
  const subject = letterType === 'safe-custody'
    ? `FCO, 1985 – Quality Control – ${metadata.year || '2026-27'} – Submission of III Portion of Fertilizer Samples along with Form K for Safe Custody – Request – Reg.`
    : `FCO 1985 – Quality Control – ${metadata.year || '2026-27'} – Submission of Fertilizer Samples (Portion-I) drawn – Request for Quality Analysis – Reg.`;
  const subjectX = PAGE.marginLeft + doc.getTextWidth('Sub: ');
  const availableWidth = PAGE.contentWidth - doc.getTextWidth('Sub: ');
  
  const splitSubject = doc.splitTextToSize(subject, availableWidth);
  doc.text(splitSubject, subjectX, cursor.y);
  
  cursor.y += (splitSubject.length * LINE_HEIGHT) + 1;
}

function drawReference(cursor: PdfCursor, metadata: CoveringLetterMetadata, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Ref:', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  const ref1 = '1. C&DA, TS, Hyd Memo No. e-937125, COMAG-FERT/FQC/3/2026-FERT, Dt. 26.06.2026.';
  doc.text(ref1, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  const district = officerDetails?.district || officerDetails?.manualDistrict || '';
  const ref2Text = `2. DAO ${district} Memo No. ${metadata.daoMemoNumber || '_________'}, Dt. ${formatDate(metadata.daoMemoDate) || '_________'}.`;
  
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

function drawBody(cursor: PdfCursor, officerDetails?: OfficerDetails, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);
  
  const mandal = officerDetails?.mandal || officerDetails?.manualMandal || '{{Mandal}}';
  const district = officerDetails?.district || officerDetails?.manualDistrict || '{{District}}';
  
  // Text segments with different font styles
  const segments = letterType === 'safe-custody'
    ? [
        { text: 'In continuation to the subject cited above, I submit that the following fertilizer samples were drawn from the input dealer premises in ', bold: false },
        { text: mandal, bold: true },
        { text: ' Mandal, ', bold: false },
        { text: district, bold: true },
        { text: ' District for quality analysis as per the allotment given by the District Agricultural Officer, ', bold: false },
        { text: district, bold: false },
        { text: '. The I Portion of the samples has already been forwarded for quality analysis. ', bold: false },
        { text: 'I am herewith submitting the III Portion of the fertilizer samples, along with the enclosed Form K, for safe custody.', bold: false },
      ]
    : [
        { text: 'In continuation to the subject cited above, I am herewith submitting the fertilizer samples drawn from the input dealer premises in ', bold: false },
        { text: mandal, bold: true },
        { text: ' Mandal, ', bold: false },
        { text: district, bold: true },
        { text: ' District for quality analysis as per the allotment given by the District Agricultural Officer, ', bold: false },
        { text: district, bold: false },
        { text: ' District.', bold: false }
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

function drawSampleTableHeading(cursor: PdfCursor, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  const headingText = letterType === 'safe-custody'
    ? 'The details of the fertilizer samples submitted for safe custody are as follows:'
    : 'The details of the samples drawn are as follows :';
  doc.text(headingText, PAGE.marginLeft, cursor.y);
}

function drawSampleTable(cursor: PdfCursor, queue: CoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  const tableData = queue.map((item, index) => [
    String(index + 1),
    item.fertilizerName || '-',
    item.sampleCode || '-',
    item.quantity || '-',
    formatDate(item.dateOfSampling) || '-'
  ]);

  const columnWidths = [
    PAGE.contentWidth * 0.05,  // Sl. No. - 5% (reduced narrow width)
    PAGE.contentWidth * 0.48,  // Product Name - 48% (widest for long names)
    PAGE.contentWidth * 0.19,  // Sample Code - 19% (increased width)
    PAGE.contentWidth * 0.12,  // Quantity - 12% (increased for better fit)
    PAGE.contentWidth * 0.16,  // Sampling Date - 16% (fixed width)
  ];

  autoTable(doc, {
    startY: cursor.y,
    head: [['S.No', 'Name of Fertilizer', 'Code No. of Sample', 'Quantity (gms)', 'Sampling Date']],
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
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: FONT_SIZES.body,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      halign: 'center',
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: columnWidths[0], halign: 'center' },
      1: { cellWidth: columnWidths[1], halign: 'left' },
      2: { cellWidth: columnWidths[2], halign: 'center' },
      3: { cellWidth: columnWidths[3], halign: 'center' },
      4: { cellWidth: columnWidths[4], halign: 'center' },
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    horizontalPageBreak: false,
  });
}

function drawClosing(cursor: PdfCursor, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);
  
  // Only show closing request text for quality-analysis letter
  if (letterType === 'quality-analysis') {
    const closingText = 'Hence, I request the kind authority to arrange for quality analysis and communicate the results to the above address at an early date.';
    const splitClosing = doc.splitTextToSize(closingText, PAGE.contentWidth);
    doc.text(splitClosing, PAGE.marginLeft, cursor.y);
    cursor.y += (splitClosing.length * LINE_HEIGHT) + PARAGRAPH_SPACING;
  }
  
  doc.text('Thanking you.', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
  
  doc.text('Form "P" is kept with the sample.', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT + 1.5;
}

function drawEnclosures(cursor: PdfCursor, sampleCount: number) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text(`Enclosures: Form K (${sampleCount})`, PAGE.marginLeft, cursor.y);
}

function drawSignature(cursor: PdfCursor, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  // Leave -5mm blank space for signature (reduced by 25 units total to move section upward)
  cursor.y -= 5;
  
  const signatureX = PAGE.width - PAGE.marginRight;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Yours faithfully,', signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
  
  cursor.y += LINE_HEIGHT + 5; // Extra space increased by 5 units
  
  const designation = officerDetails?.designation || 'Mandal Agricultural Officer';
  doc.setFont(PDF_FONT, 'bold');
  doc.text(designation, signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
  
  doc.text('& Fertilizer Inspector', signatureX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT + PARAGRAPH_SPACING;
}

function drawCopiesSection(cursor: PdfCursor, officerDetails?: OfficerDetails, metadata?: CoveringLetterMetadata) {
  const { doc } = cursor;
  
  const district = officerDetails?.district || officerDetails?.manualDistrict || 'Asifabad';
  const division = metadata?.division || district;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Copies submitted to:', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(11);
  doc.text(`1. The District Agricultural Officer, ${district} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.text(`2. The Asst. Director of Agriculture (R), ${division} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawBranding(doc: JsPdfInstance) {
  // Save current state
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();
  
  // Set branding styling
  doc.setFont('courier', 'bold'); // Monospaced font with semi-bold weight
  doc.setFontSize(7); // 7pt font size
  doc.setTextColor(128); // Gray color (single value for grayscale)
  
  // Position in bottom-right corner (10 units from edges)
  const brandingX = PAGE.width - 10;
  const brandingY = PAGE.height - 10;
  
  // Draw AGRONIX wordmark
  doc.text('AGRONIX', brandingX, brandingY, { align: 'right' });
  
  // Restore original state
  doc.setFont(currentFont.fontName, currentFont.fontStyle);
  doc.setFontSize(currentFontSize);
  doc.setTextColor(0); // Reset to black
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
