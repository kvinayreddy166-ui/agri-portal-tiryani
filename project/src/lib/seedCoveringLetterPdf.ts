import type { jsPDF as JsPdfInstance } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

type SeedCoveringLetterQueueItem = {
  sampleCode: string;
  seedName: string;
  variety: string;
  quantity: string;
  dateOfSampling: string;
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

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateSeedCoveringLetterPdf(
  queue: SeedCoveringLetterQueueItem[],
  metadata: SeedCoveringLetterMetadata,
  officerDetails?: OfficerDetails
) {
  const { jsPDF } = await import('jspdf');
  
  const doc = createDocument(jsPDF, 'Covering Letter - Seed Samples');
  
  const cursor = {
    doc,
    y: PAGE.marginTop - 6,
    contentWidth: PAGE.contentWidth,
  };

  await drawGovernmentHeader(cursor);
  cursor.y += 8;
  
  cursor.y -= 4;
  
  drawFromToSections(cursor, officerDetails);
  
  cursor.y -= 6;
  
  drawLetterDetails(cursor, metadata);
  cursor.y += LINE_HEIGHT;
  
  cursor.y -= 12;
  
  drawSalutation(cursor);
  cursor.y += 8;
  
  drawSubject(cursor, metadata);
  cursor.y += PARAGRAPH_SPACING;
  
  drawReference(cursor, metadata, officerDetails);
  
  drawSeparator(cursor);
  
  drawBody(cursor, officerDetails);
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
    cursor.y = 35;
  }
  
  cursor.y -= 3;
  
  drawEnclosures(cursor, queue.length);
  cursor.y += PARAGRAPH_SPACING;
  
  drawSignature(cursor, officerDetails);
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

async function drawGovernmentHeader(cursor: PdfCursor) {
  const { doc } = cursor;
  
  const emblemWidth = 23.96;
  const emblemHeight = 15.97;
  const horizontalGap = 3;
  
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
  cursor.y += LINE_HEIGHT;
  
  doc.setFontSize(FONT_SIZES.departmentHeading);
  doc.text('DEPARTMENT OF AGRICULTURE', textStartX, cursor.y);
  cursor.y += LINE_HEIGHT + 2;
  
  doc.setFont(PDF_FONT, 'normal');
}

function drawFromToSections(cursor: PdfCursor, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  const leftColumnX = PAGE.marginLeft;
  const rightColumnX = PAGE.marginLeft + (PAGE.contentWidth * 0.52) + 13;
  const startY = cursor.y;
  
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
  
  const designation = officerDetails?.designation || 'Seed Inspector';
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${designation},`, leftColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  const mandal = officerDetails?.mandal || officerDetails?.manualMandal || '';
  if (mandal) {
    doc.setFont(PDF_FONT, 'normal');
    doc.text(`${mandal} Mandal,`, leftColumnX, currentY);
    currentY += LINE_HEIGHT;
  }
  
  const district = officerDetails?.district || officerDetails?.manualDistrict || '';
  const pinCode = officerDetails?.pinCode || '';
  const districtWithPin = pinCode ? `${district} -${pinCode}.` : `${district}.`;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text(districtWithPin, leftColumnX, currentY);
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('To:', rightColumnX, startY);
  
  currentY = startY + LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text('The Asst. Director of Agriculture,', rightColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text('Seed Testing Laboratory,', rightColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  doc.text('Rajendranagar,', rightColumnX, currentY);
  currentY += LINE_HEIGHT;
  
  doc.text('Hyderabad - 500030.', rightColumnX, currentY);
  
  cursor.y = currentY + LINE_HEIGHT;
}

function drawLetterDetails(cursor: PdfCursor, metadata: SeedCoveringLetterMetadata) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  
  const leftColumnX = PAGE.marginLeft;
  const rightColumnX = PAGE.marginLeft + (PAGE.contentWidth * 0.52) + 13;
  
  doc.text(`Letter No: ${metadata.letterNumber || '_________'}`, leftColumnX, cursor.y);
  doc.text(`Date: ${formatDate(metadata.letterDate) || '_________'}`, rightColumnX, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawSalutation(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sir,', PAGE.marginLeft, cursor.y);
}

function drawSubject(cursor: PdfCursor, metadata: SeedCoveringLetterMetadata) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Sub:', PAGE.marginLeft, cursor.y);
  
  doc.setFont(PDF_FONT, 'normal');
  const subject = `FCO, 1985 – Quality Control – ${metadata.year || '2026-27'} – Submission of Seed Samples for Analysis – Request – Reg.`;
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
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, cursor.y, PAGE.width - PAGE.marginRight, cursor.y);
  cursor.y += 4;
}

function drawBody(cursor: PdfCursor, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  
  const mandal = officerDetails?.mandal || officerDetails?.manualMandal || '';
  const district = officerDetails?.district || officerDetails?.manualDistrict || '';
  
  const bodyText = `In continuation to the subject cited above, I am herewith submitting the seed samples drawn from the input dealer premises in ${mandal} Mandal, ${district} District for analysis as per the Seeds Act, 1966. The samples have been drawn in accordance with the prescribed procedure and are being sent to the Seed Testing Laboratory for quality analysis.`;
  
  const splitBody = doc.splitTextToSize(bodyText, PAGE.contentWidth);
  doc.text(splitBody, PAGE.marginLeft + FIRST_LINE_INDENT, cursor.y);
  
  cursor.y += (splitBody.length * LINE_HEIGHT) + PARAGRAPH_SPACING;
}

const FIRST_LINE_INDENT = 10;

function drawSampleTableHeading(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Particulars of Seed Samples:', PAGE.marginLeft, cursor.y);
}

function drawSampleTable(cursor: PdfCursor, queue: SeedCoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  const tableData = queue.map((item, index) => [
    (index + 1).toString(),
    item.sampleCode,
    item.seedName,
    item.variety,
    item.quantity,
    formatDate(item.dateOfSampling),
  ]);
  
  autoTable(doc, {
    startY: cursor.y,
    head: [['S.No', 'Sample Code', 'Seed Name', 'Variety', 'Quantity', 'Date of Sampling']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 12,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 11,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 },
    },
    margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    styles: {
      cellPadding: 2,
    },
  });
}

function drawClosing(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  
  const closingText = 'I request you to kindly arrange for the analysis of the above seed samples and communicate the results at the earliest.';
  const splitClosing = doc.splitTextToSize(closingText, PAGE.contentWidth);
  doc.text(splitClosing, PAGE.marginLeft + FIRST_LINE_INDENT, cursor.y);
  
  cursor.y += (splitClosing.length * LINE_HEIGHT) + PARAGRAPH_SPACING;
}

function drawEnclosures(cursor: PdfCursor, sampleCount: number) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(FONT_SIZES.body);
  doc.text(`Enclosures: Seed Samples (${sampleCount})`, PAGE.marginLeft, cursor.y);
}

function drawSignature(cursor: PdfCursor, officerDetails?: OfficerDetails) {
  const { doc } = cursor;
  
  cursor.y -= 5;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text('Yours faithfully,', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  cursor.y += 5;
  
  const designation = officerDetails?.designation || 'Seed Inspector';
  doc.setFont(PDF_FONT, 'bold');
  doc.text(designation, PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text('Seed Inspector', PAGE.marginLeft, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawCopiesSection(cursor: PdfCursor, officerDetails?: OfficerDetails, metadata?: SeedCoveringLetterMetadata) {
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
  const totalPages = (doc as any).internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('AGRONIX', PAGE.width - PAGE.marginRight, PAGE.height - 5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
