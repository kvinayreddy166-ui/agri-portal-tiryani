import type { jsPDF as JsPdfInstance } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

type CoveringLetterQueueItem = {
  sampleCode: string;
  fertilizerName: string;
  quantity: string;
  dateOfSampling: string;
};

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

const PAGE = {
  marginX: 20,
  top: 20,
  bottom: 277,
  width: 210,
  height: 297,
  contentWidth: 170,
};

const PDF_FONT = 'times';
const BODY_SIZE = 10;
const TITLE_SIZE = 13;
const HEADER_SIZE = 13;
const ROW_LINE_HEIGHT = 5;
const FIRST_LINE_INDENT = 8;
const PARAGRAPH_SPACING = 2;

function addWrappedText(cursor: PdfCursor, label: string, text: string) {
  const { doc } = cursor;
  const labelWidth = 18;
  const x = PAGE.marginX;

  doc.setFont(PDF_FONT, 'bold');
  doc.text(label, x, cursor.y);

  doc.setFont(PDF_FONT, 'normal');

  const lines = doc.splitTextToSize(text, cursor.contentWidth - labelWidth);
  doc.text(lines, x + labelWidth, cursor.y);

  cursor.y += lines.length * ROW_LINE_HEIGHT;
  return cursor;
}

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateCoveringLetterPdf(
  queue: CoveringLetterQueueItem[],
  metadata: CoveringLetterMetadata,
  officerDetails?: { mandal: string; district: string; officerName: string; phone: string }
) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, 'Covering Letter - Fertilizer Samples');
  
  const cursor = {
    doc,
    y: PAGE.top,
    contentWidth: PAGE.width - PAGE.marginX * 2,
  };

  drawGovernmentHeader(cursor);
  cursor.y += 3;
  
  drawFromToSections(cursor, metadata, officerDetails);
  cursor.y += 3;
  
  drawLetterDetails(cursor, metadata);
  cursor.y += 2;
  
  drawSubject(cursor);
  cursor.y += 2;
  
  drawReference(cursor, metadata);
  cursor.y += 2;
  
  drawBody(cursor, officerDetails);
  cursor.y += 2;
  
  drawSampleTable(cursor, queue);
  cursor.y += 2;
  
  drawClosing(cursor);
  cursor.y += 2;
  
  drawEnclosures(cursor, queue.length);
  cursor.y += 2;
  
  drawSignature(cursor);
  cursor.y += 2;
  
  drawCopies(cursor, officerDetails);

  return doc;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title,
    subject: 'Covering Letter for Fertilizer Sample Submission',
    creator: 'Tiryani Agriculture Portal',
  });
  return doc;
}

function drawGovernmentHeader(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(HEADER_SIZE);
  doc.text('GOVERNMENT OF TELANGANA', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 5;
  
  doc.setFontSize(TITLE_SIZE);
  doc.text('DEPARTMENT OF AGRICULTURE', PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 5;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);
}

function drawFromToSections(cursor: PdfCursor, metadata: CoveringLetterMetadata, officerDetails?: { mandal: string; district: string; officerName: string; phone: string }) {
  const { doc } = cursor;
  
  const leftColumnX = 20;
  const rightColumnX = 110;
  const columnWidth = 80;
  const startY = cursor.y;
  
  // From section - left aligned
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(BODY_SIZE);
  doc.text('From:', leftColumnX, startY);
  
  let currentY = startY + ROW_LINE_HEIGHT;
  
  const officerName = officerDetails?.officerName || getFromLocalStorage('officerName') || '';
  const qualification = getFromLocalStorage('qualification') || '';
  const resolvedQualification = qualification === 'Others' 
    ? getFromLocalStorage('manualQualification') || ''
    : qualification;
  const officerNameWithQual = officerName && resolvedQualification 
    ? `${officerName}, ${resolvedQualification}`
    : officerName;
  
  if (officerNameWithQual) {
    doc.text(officerNameWithQual, leftColumnX, currentY);
    currentY += ROW_LINE_HEIGHT;
  }
  
  doc.text('Mandal Agriculture Officer,', leftColumnX, currentY);
  currentY += ROW_LINE_HEIGHT;
  
  const mandal = officerDetails?.mandal || getFromLocalStorage('mandal') || '{{Mandal}}';
  const district = officerDetails?.district || getFromLocalStorage('district') || '{{District}}';
  
  doc.text(`${mandal} Mandal,`, leftColumnX, currentY);
  currentY += ROW_LINE_HEIGHT;
  doc.text(`${district} District.`, leftColumnX, currentY);
  currentY += ROW_LINE_HEIGHT;
  
  const phone = officerDetails?.phone || getFromLocalStorage('phone') || metadata.officePhone || '{{Phone}}';
  doc.text(`Phone: ${phone}.`, leftColumnX, currentY);
  
  // To section - right aligned
  doc.text('To:', rightColumnX + columnWidth, startY, { align: 'right' });
  
  currentY = startY + ROW_LINE_HEIGHT;
  const toAddress = [
    'The Assistant Director of Agriculture,',
    'Fertilizer Coding Centre,',
    'SAMETI Complex,',
    'Old Malakpet,',
    'Hyderabad.',
  ];
  
  toAddress.forEach(line => {
    doc.text(line, rightColumnX + columnWidth, currentY, { align: 'right' });
    currentY += ROW_LINE_HEIGHT;
  });
  
  cursor.y = currentY + 1;
}

function drawLetterDetails(cursor: PdfCursor, metadata: CoveringLetterMetadata) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  const lrNoText = `Lr No: ${metadata.letterNumber || '_________'}`;
  doc.text(lrNoText, PAGE.width / 2, cursor.y, { align: 'center' });
  const lrNoWidth = doc.getTextWidth(lrNoText);
  doc.setDrawColor(0);
  doc.line(PAGE.width / 2 - lrNoWidth / 2, cursor.y + 0.5, PAGE.width / 2 + lrNoWidth / 2, cursor.y + 0.5);
  const formattedDate = formatDate(metadata.letterDate);
  doc.text(`Date: ${formattedDate || '_________'}`, PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += ROW_LINE_HEIGHT + 2;
}

function drawSubject(cursor: PdfCursor) {
  const subject = `Fertilizer (Inorganic, Organic or Mixed) (Control) Order, 1985 - Quality Control 2026-27 - Submission of Fertilizer Samples- Request for Quality Analysis -Reg.`;
  addWrappedText(cursor, 'Sub:', subject);
  cursor.y += PARAGRAPH_SPACING;
}

function drawReference(cursor: PdfCursor, metadata: CoveringLetterMetadata) {
  const authorityLabel = metadata.authorityType === 'ADA' ? 'ADA Memo No' : 'DAO Memo No';
  const refText = `${authorityLabel}: ${metadata.daoMemoNumber || '_________'} Date: ${formatDate(metadata.daoMemoDate) || '_________'}`;
  addWrappedText(cursor, 'Ref:', refText);
  cursor.y += PARAGRAPH_SPACING;
}

function drawBody(cursor: PdfCursor, officerDetails?: { mandal: string; district: string; officerName: string; phone: string }) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(10);
  doc.setLineHeightFactor(1.25);
  const mandal = officerDetails?.mandal || getFromLocalStorage('mandal') || '{{Mandal}}';
  const district = officerDetails?.district || getFromLocalStorage('district') || '{{District}}';
  
  // First line with mixed bold/normal text
  const startX = PAGE.marginX + FIRST_LINE_INDENT;
  let x = startX;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text('With reference to the subject cited, I submit herewith the fertilizer samples drawn from licensed fertilizer dealers in ', x, cursor.y, { align: 'justify' });
  x += doc.getTextWidth('With reference to the subject cited, I submit herewith the fertilizer samples drawn from licensed fertilizer dealers in ');
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text(mandal, x, cursor.y, { align: 'justify' });
  x += doc.getTextWidth(mandal);
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text(' Mandal, ', x, cursor.y, { align: 'justify' });
  x += doc.getTextWidth(' Mandal, ');
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text(district, x, cursor.y, { align: 'justify' });
  x += doc.getTextWidth(district);
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text(' District under the Quality Control programme.', x, cursor.y, { align: 'justify' });
  
  cursor.y += ROW_LINE_HEIGHT + PARAGRAPH_SPACING;
  
  doc.text('The particulars are furnished below.', PAGE.marginX, cursor.y, { align: 'justify' });
  cursor.y += ROW_LINE_HEIGHT + PARAGRAPH_SPACING;
}

function drawSampleTable(cursor: PdfCursor, queue: CoveringLetterQueueItem[]) {
  const { doc } = cursor;
  
  const tableData = queue.map((item, index) => [
    String(index + 1),
    item.fertilizerName || '-',
    item.sampleCode,
    item.quantity || '-',
    formatDate(item.dateOfSampling) || '-'
  ]);

  autoTable(doc, {
    startY: cursor.y,
    head: [
      [
        'Sl.No.',
        'Name of Fertilizer Sample',
        'Sample Code',
        'Quantity',
        'Date of Sampling'
      ]
    ],
    body: tableData,
    theme: 'grid',
    margin: {
      left: 20,
      right: 20
    },
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 1.5,
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      valign: 'middle',
      halign: 'center',
      overflow: 'linebreak',
      minCellHeight: 7
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 9,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
      minCellHeight: 8
    },
    bodyStyles: {
      valign: 'middle',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 70, halign: 'left' },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 27 }
    },
    pageBreak: 'avoid',
    rowPageBreak: 'avoid'
  });

  cursor.y = (doc as any).lastAutoTable.finalY + PARAGRAPH_SPACING;
}

function drawClosing(cursor: PdfCursor) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'normal');
  const closingText = 'It is requested that the above fertilizer samples may kindly be analysed and the analysis reports may be communicated to this office as on early date.';
  const closingLines = doc.splitTextToSize(closingText, cursor.contentWidth);
  doc.text(closingLines, PAGE.marginX, cursor.y);
  cursor.y += closingLines.length * ROW_LINE_HEIGHT + 3;
}

function drawEnclosures(cursor: PdfCursor, sampleCount: number) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Enclosures:', PAGE.marginX, cursor.y);
  cursor.y += ROW_LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`1. Form K – ${sampleCount} Nos.`, PAGE.marginX, cursor.y);
  cursor.y += ROW_LINE_HEIGHT + 3;
}

function drawSignature(cursor: PdfCursor) {
  const { doc } = cursor;
  
  const signatureY = cursor.y + 12;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.text('Yours faithfully,', PAGE.width - PAGE.marginX, signatureY, { align: 'right' });
  cursor.y = signatureY + ROW_LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Mandal Agriculture Officer', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += ROW_LINE_HEIGHT;
  doc.text('&', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += ROW_LINE_HEIGHT;
  doc.text('Fertilizer Inspector', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += ROW_LINE_HEIGHT + 3;
}

function drawCopies(cursor: PdfCursor, officerDetails?: { mandal: string; district: string; officerName: string; phone: string }) {
  const { doc } = cursor;
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(9);
  doc.text('Copies Submitted to:', PAGE.marginX, cursor.y);
  cursor.y += ROW_LINE_HEIGHT;
  
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(9);
  const district = officerDetails?.district || getFromLocalStorage('district') || '{{District}}';
  doc.text(`1. The DAO, ${district} District, For favour of kind information.`, PAGE.marginX + 5, cursor.y);
  cursor.y += ROW_LINE_HEIGHT;
  doc.text(`2. The ADA(R), For favour of kind information.`, PAGE.marginX + 5, cursor.y);
  cursor.y += ROW_LINE_HEIGHT;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getFromLocalStorage(key: string): string {
  try {
    // Try to get from settings array in localStorage (Supabase format)
    const settingsRaw = window.localStorage.getItem('tiryani-settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      if (Array.isArray(settings)) {
        const setting = settings.find((s: any) => s.setting_key === key);
        if (setting && setting.setting_value) return setting.setting_value;
      } else if (typeof settings === 'object' && settings[key]) {
        return settings[key];
      }
    }
    
    // Try direct localStorage key
    const directValue = window.localStorage.getItem(key);
    if (directValue) return directValue;
    
    return '';
  } catch {
    return '';
  }
}
