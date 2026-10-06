import type { jsPDF as JsPdfInstance } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { setupPdfUnicodeFonts } from '../../../shared/lib/pdfUnicodeFonts';
import { isAssistantDirectorOfAgriculture, isAssistantDirectorOfAgricultureT, statutoryDesignationDisplay } from '../../../shared/data/assistantDirectorLocation';
import { drawJustifiedBodyText } from '../../../shared/lib/pdfText';
import {
  PAGE,
  PDF_FONT,
  FONT_SIZES,
  LINE_HEIGHTS,
  LINE_HEIGHT,
  PARAGRAPH_SPACING,
  FIRST_LINE_INDENT,
  formatDate,
  displayValue,
  createCoveringLetterDocument,
  drawWatermark,
  drawSalutation,
  drawSeparator,
  drawCoveringClosing,
  drawCoveringSignature,
  drawBranding,
} from './coveringLetterLayout';
import type { PdfCursor } from './coveringLetterLayout';

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
  manualDivision: string;
  office?: string;
  placeOfCollectionMandal: string;
  manualPlaceOfCollection: string;
  district: string;
  manualDistrict: string;
  pinCode: string;
  phone: string;
};

// Page Configuration - A4 Portrait


export async function generateCoveringLetterPdf(
  queue: CoveringLetterQueueItem[],
  metadata: CoveringLetterMetadata,
  officerDetails?: OfficerDetails,
  letterType: LetterType = 'quality-analysis',
  _watermarkEnabled: boolean = false,
  onDocCreated?: (doc: JsPdfInstance) => void
) {
  const { jsPDF } = await import('jspdf');

  // Use metadata as-is - increment is handled by the modal component
  const updatedMetadata = metadata;

  const doc = createCoveringLetterDocument(jsPDF, 'Covering Letter - Fertilizer Samples', 'Covering Letter for Fertilizer Sample Submission');
  onDocCreated?.(doc);

  await setupPdfUnicodeFonts(doc);
  await drawWatermark(doc);

  // Set bottom margin based on letter type
  const currentMarginBottom = letterType === 'safe-custody' ? 1 : 1; // 1 unit for both letters
  
  const cursor = {
    doc,
    y: 6, // 6mm top margin — emblem starts here for both letter types
    contentWidth: PAGE.contentWidth,
  };

  await drawGovernmentHeader(cursor);
  cursor.y += 8; // 8mm below header
  
  // Move entire address block upward by 4 units
  cursor.y -= 4;
  
  drawFromToSections(cursor, officerDetails, updatedMetadata, letterType);
  
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
  
  // Move sample table heading upward by 3 units for Portion 1 (Quality Analysis) and Portion III (Safe Custody)
  if (letterType === 'quality-analysis' || letterType === 'safe-custody') {
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
    await drawWatermark(doc);
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

async function drawGovernmentHeader(cursor: PdfCursor) {
  const { doc } = cursor;

  // Emblem centred above the GOVERNMENT OF TELANGANA heading
  const emblemWidth = 23.72;
  const emblemHeight = 15.81;
  const emblemX = (PAGE.width - emblemWidth) / 2;

  try {
    const response = await fetch('/images/telangana-govt_emblem.webp');
    const blob = await response.blob();
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        doc.addImage(dataUrl, 'WEBP', emblemX, cursor.y, emblemWidth, emblemHeight);
        resolve(null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading emblem image:', error);
    // Continue without emblem if image fails to load
  }

  cursor.y += emblemHeight + 6; // clear the emblem bottom before the heading baseline

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.governmentHeading);
  doc.text('GOVERNMENT OF TELANGANA', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZES.departmentHeading);
  doc.text('DEPARTMENT OF AGRICULTURE', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT + 2;

  doc.setFont(PDF_FONT, 'normal');
}

function drawFromToSections(cursor: PdfCursor, officerDetails?: OfficerDetails, metadata?: CoveringLetterMetadata, letterType: LetterType = 'quality-analysis') {
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
  
  const designation = statutoryDesignationDisplay(officerDetails?.designation || 'Mandal Agriculture Officer');
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${designation},`, leftColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  const isADA = isAssistantDirectorOfAgriculture(officerDetails?.designation || '');
  const isADAT = isAssistantDirectorOfAgricultureT(officerDetails?.designation || '');
  const resolvedMandal = officerDetails?.mandal === 'Others' ? officerDetails?.manualMandal : officerDetails?.mandal || officerDetails?.manualMandal || '';
  // For ADA, the Officer From Address uses the DIVISION value; for ADA (T) it uses the OFFICE value
  const locationValue = isADAT ? officerDetails?.office || resolvedMandal : isADA ? officerDetails?.manualDivision || resolvedMandal : resolvedMandal;
  if (locationValue) {
    doc.setFont(PDF_FONT, 'bold');
    const locationLabel = isADAT ? '' : isADA ? 'Division' : 'Mandal';
    doc.text(locationLabel ? `${locationValue} ${locationLabel},` : `${locationValue},`, leftColumnX, currentY);
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
  
  const phone = officerDetails?.phone || metadata?.officePhone || '';
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

function drawSubject(cursor: PdfCursor, metadata: CoveringLetterMetadata, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  const labelX = PAGE.marginLeft + FIRST_LINE_INDENT;
  doc.text('Sub: ', labelX, cursor.y);

  doc.setFont(PDF_FONT, 'normal');
  const subject = letterType === 'safe-custody'
    ? `FCO, 1985 – Quality Control – ${metadata.year || '2026-27'} – Submission of III Portion of Fertilizer Samples along with Form K for Safe Custody – Request – Reg.`
    : `FCO 1985 – Quality Control – ${metadata.year || '2026-27'} – Submission of Fertilizer Samples (Portion-I) drawn – Request for Quality Analysis – Reg.`;
  const subjectX = labelX + doc.getTextWidth('Sub: ');
  const availableWidth = PAGE.contentWidth - FIRST_LINE_INDENT - doc.getTextWidth('Sub: ');
  
  const splitSubject = doc.splitTextToSize(subject, availableWidth);
  doc.text(splitSubject, subjectX, cursor.y);
  
  cursor.y += (splitSubject.length * LINE_HEIGHT) + 1;
}

function drawReference(cursor: PdfCursor, metadata: CoveringLetterMetadata, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  const refLabelX = PAGE.marginLeft + FIRST_LINE_INDENT;
  doc.text('Ref:', refLabelX, cursor.y);
  const refIndent = refLabelX + doc.getTextWidth('Ref: ');

  doc.setFont(PDF_FONT, 'normal');
  const ref1 = '1) C&DA, TS, Hyd Memo No. e-937125, COMAG-FERT/FQC/3/2026-FERT, Dt. 22.06.2026.';
  doc.text(ref1, refIndent, cursor.y);
  cursor.y += LINE_HEIGHT;

  const district = officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict;
  const ref2Text = `2) DAO ${displayValue(district)} Memo No. ${displayValue(metadata.daoMemoNumber)}, Dt. ${displayValue(formatDate(metadata.daoMemoDate))}.`;

  doc.setFont(PDF_FONT, 'normal');
  doc.text(ref2Text, refIndent, cursor.y);
  
  cursor.y += LINE_HEIGHT + 1;
}

function drawBody(cursor: PdfCursor, officerDetails?: OfficerDetails, letterType: LetterType = 'quality-analysis') {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.setLineHeightFactor(LINE_HEIGHTS.body);
  
  const isADA = isAssistantDirectorOfAgriculture(officerDetails?.designation || '');
  // For ADA, use placeOfCollectionMandal (or manualPlaceOfCollection if Others), otherwise use regular mandal
  const placeOfCollection = isADA 
    ? (officerDetails?.placeOfCollectionMandal === 'Others' 
        ? officerDetails?.manualPlaceOfCollection || '' 
        : officerDetails?.placeOfCollectionMandal || '')
    : displayValue(officerDetails?.mandal === 'Others' ? officerDetails?.manualMandal : officerDetails?.mandal || officerDetails?.manualMandal);
  const district = displayValue(officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict);
  
  // Text segments with different font styles
  const segments = letterType === 'safe-custody'
    ? [
        { text: 'In continuation to the subject cited above, I submit that the following fertilizer samples were drawn from the input dealer premises in ', bold: false },
        { text: placeOfCollection, bold: true },
        { text: ' Mandal, ', bold: false },
        { text: district, bold: true },
        { text: ' District for quality analysis as per the allotment given by the District Agriculture Officer, ', bold: false },
        { text: district, bold: false },
        { text: '. The I Portion of the samples has already been forwarded for quality analysis. ', bold: false },
        { text: 'I am herewith submitting the III Portion of the fertilizer samples, along with the enclosed Form K, for safe custody.', bold: false },
      ]
    : [
        { text: 'In continuation to the subject cited above, I am herewith submitting the fertilizer samples drawn from the input dealer premises in ', bold: false },
        { text: placeOfCollection, bold: true },
        { text: ' Mandal, ', bold: false },
        { text: district, bold: true },
        { text: ' District for quality analysis as per the allotment given by the District Agriculture Officer, ', bold: false },
        { text: district, bold: false },
        { text: '.', bold: false }
      ];
  
  const endY = drawJustifiedBodyText(doc, segments, {
    x: PAGE.marginLeft,
    startY: cursor.y,
    maxWidth: PAGE.contentWidth,
    lineHeight: LINE_HEIGHT,
    firstLineIndent: FIRST_LINE_INDENT,
    fontName: PDF_FONT,
  });
  cursor.y = endY + PARAGRAPH_SPACING;
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
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak',
      fillColor: undefined, // Transparent background to show watermark
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: FONT_SIZES.body,
      fillColor: undefined, // Transparent background to show watermark
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      halign: 'center',
      textColor: [0, 0, 0],
      fillColor: undefined, // Transparent background to show watermark
    },
    columnStyles: {
      0: { cellWidth: columnWidths[0], halign: 'center' },
      1: { cellWidth: columnWidths[1], halign: 'center' },
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

  // Only show closing request text for quality-analysis letter
  drawCoveringClosing(
    cursor,
    letterType === 'quality-analysis'
      ? 'Hence, I request the kind authority to arrange for quality analysis and communicate the results to the above address at an early date.'
      : null
  );

  doc.text('Form "P" is kept with the sample.', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT + 1.5;
}

function drawEnclosures(cursor: PdfCursor, sampleCount: number) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Enclosures:', PAGE.marginLeft, cursor.y);
  const enclosuresX = PAGE.marginLeft + doc.getTextWidth('Enclosures: ');
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`Form K (${sampleCount})`, enclosuresX, cursor.y);
}

function drawSignature(cursor: PdfCursor, officerDetails?: OfficerDetails) {
  const designation = statutoryDesignationDisplay(officerDetails?.designation || 'Mandal Agricultural Officer');
  drawCoveringSignature(cursor, designation, '& Fertilizer Inspector');
}

function drawCopiesSection(cursor: PdfCursor, officerDetails?: OfficerDetails, metadata?: CoveringLetterMetadata) {
  const { doc } = cursor;
  
  const district = displayValue(officerDetails?.district === 'Others' ? officerDetails?.manualDistrict : officerDetails?.district || officerDetails?.manualDistrict);
  const division = displayValue(metadata?.division);
  const isADA = isAssistantDirectorOfAgriculture(officerDetails?.designation || '');
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Copy submitted to:', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(11);
  if (!isADA) {
    doc.text(`1. The Asst. Director of Agriculture (R), ${division} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
    cursor.y += LINE_HEIGHT;
  }
  doc.text(`${isADA ? '1' : '2'}. The District Agriculture Officer, ${district} for favour of kind information.`, PAGE.marginLeft + 5, cursor.y);
  cursor.y += LINE_HEIGHT;
}

