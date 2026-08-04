import type { jsPDF as JsPdfInstance } from 'jspdf';

export type PesticideStatutoryFormType = 'VC' | 'VD' | 'VE' | 'DOCKET';

export type PesticidePdfValues = {
  officerName: string;
  designation: string;
  officeAddress: string;
  officerEmail: string;
  district: string;
  mandal: string;
  place: string;
  date: string;
  sampleDrawnDate: string;
  sampleDrawnDay: string;
  sampleDrawnMonth: string;
  sampleDrawnYear: string;
  dealerName: string;
  dealerAddress: string;
  premisesLocation: string;
  licenseNumber: string;
  licenseDate: string;
  authorizationLicenseNumber: string;
  insecticideCommonName: string;
  technicalName: string;
  tradeName: string;
  activeIngredient: string;
  formulationType: string;
  manualFormulationType: string;
  manufacturedBy: string;
  marketedBy: string;
  distributorName: string;
  registrationNumber: string;
  manufacturingLicenseNumber: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  packingCondition: string;
  sampleQuantity: string;
  sampleQuantityAnalysis: string;
  stockBeforeSampling: string;
  stockAfterSampling: string;
  stockRegisterFolio: string;
  stockReceiptDetails: string;
  invoiceParticulars: string;
  invoiceNumber: string;
  invoiceDate: string;
  stockPosition: string;
  specimenSeal: string;
  distinctMark: string;
  cdaCode: string;
  qciSealParticulars: string;
  caSealParticulars: string;
  otherInformation: string;
  labAddress: string;
  qualification: string;
  manualQualification: string;
  manualDistrict: string;
  manualMandal: string;
  ptlName: string;
  dispatchDate: string;
  pincode: string;
  email: string;
  sampleSerialNumber: string;
};

export const initialPesticidePdfValues: PesticidePdfValues = {
  officerName: '',
  designation: '',
  officeAddress: '',
  officerEmail: '',
  district: '',
  mandal: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  sampleDrawnDate: new Date().toISOString().slice(0, 10),
  sampleDrawnDay: '',
  sampleDrawnMonth: '',
  sampleDrawnYear: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  licenseNumber: '',
  licenseDate: '',
  authorizationLicenseNumber: '',
  insecticideCommonName: '',
  technicalName: '',
  tradeName: '',
  activeIngredient: '',
  formulationType: '',
  manualFormulationType: '',
  manufacturedBy: '',
  marketedBy: '',
  distributorName: '',
  registrationNumber: '',
  manufacturingLicenseNumber: '',
  batchNumber: '',
  manufactureDate: '',
  expiryDate: '',
  packingCondition: '',
  sampleQuantity: '',
  sampleQuantityAnalysis: '',
  stockBeforeSampling: '',
  stockAfterSampling: '',
  stockRegisterFolio: '',
  stockReceiptDetails: '',
  invoiceParticulars: '',
  invoiceNumber: '',
  invoiceDate: '',
  stockPosition: '',
  specimenSeal: '',
  distinctMark: '',
  cdaCode: '',
  qciSealParticulars: '',
  caSealParticulars: '',
  otherInformation: '',
  labAddress: 'The Insecticide Analyst,\nDeputy Director of Agriculture (IA),\nPesticide Testing Laboratory & Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad - 500036.',
  qualification: '',
  manualQualification: '',
  manualDistrict: '',
  manualMandal: '',
  ptlName: '',
  dispatchDate: '',
  pincode: '',
  email: '',
  sampleSerialNumber: '',
};

export const pesticideFormTitles: Record<PesticideStatutoryFormType, string> = {
  VC: 'FORM V(C)',
  VD: 'FORM V(D)',
  VE: 'FORM V(E)',
  DOCKET: 'DOCKET SHEET',
};

const PAGE = { marginX: 18, top: 22, bottom: 276, width: 210, height: 297 };
const PDF_FONT = 'times';
const BODY_SIZE = 12.2;
const TITLE_SIZE = 15;
const LINE_HEIGHT = 6.2;

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generatePesticideStatutoryPdf(formType: PesticideStatutoryFormType, values: PesticidePdfValues) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, `${pesticideFormTitles[formType]} - Pesticide Sampling`);
  drawPesticideForm(doc, formType, normalizePesticideValues(values));
  return doc;
}

export async function generateAllPesticideStatutoryPdf(values: PesticidePdfValues) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, 'Form VC VD VE Docket - Pesticide Sampling');
  const normalized = normalizePesticideValues(values);
  drawPesticideForm(doc, 'VD', normalized);
  doc.addPage();
  drawPesticideForm(doc, 'VE', normalized);
  doc.addPage();
  drawPesticideForm(doc, 'VC', normalized);
  doc.addPage();
  drawPesticideForm(doc, 'DOCKET', normalized);
  return doc;
}

export function getPesticidePdfFileName(formType: PesticideStatutoryFormType, values: PesticidePdfValues) {
  return `${getSampleFilePart(values)}_${getPesticideFormFilePart(formType)}.pdf`;
}

export function getAllPesticidePdfFileName(values: PesticidePdfValues) {
  return `${getSampleFilePart(values)}_FormVC_FormVD_FormVE_Docket.pdf`;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title, subject: 'Pesticide statutory sampling form', creator: 'Tiryani Agriculture Portal' });
  return doc;
}

function drawPesticideForm(doc: JsPdfInstance, formType: PesticideStatutoryFormType, values: PesticidePdfValues) {
  const cursor = resetPage(doc);
  if (formType === 'VD') drawFormVD(cursor, values);
  if (formType === 'VE') drawFormVE(cursor, values);
  if (formType === 'VC') drawFormVC(cursor, values);
  if (formType === 'DOCKET') drawDocket(cursor, values);
}

function resetPage(doc: JsPdfInstance): PdfCursor {
  doc.setLineHeightFactor(1.25);
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);
  return { doc, y: PAGE.top, contentWidth: PAGE.width - PAGE.marginX * 2 };
}

function drawFormVD(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(D): FORM TO BE KEPT WITH SAMPLE IN SEALED PACKET', '[See sub-rule (1) of Rule 34]');
  address(cursor, 'To:', values.labAddress);
  cursor.y += 3;
  fieldList(cursor, [
    ['1. Name of the Insecticide', pesticideNameWithoutTrade(values), '(Common Name with active ingredient % and formulation type)'],
    ['2. Batch Number', values.batchNumber],
    ['3. Date of Manufacture', formatDate(values.manufactureDate)],
    ['4. Date of Expiry', formatDate(values.expiryDate)],
    ['5. Packing condition (original sealed/loose)', values.packingCondition],
    ['6. Quantity of the sample', values.sampleQuantity],
    ['7. Sample drawn on', formatDate(values.sampleDrawnDate)],
    ['8. Sample drawn by', inspectorLine(values)],
    ['9. Specimen seal of Insecticide Inspector/Licensee, if any', values.specimenSeal],
    ['10. Distinct mark on the sealed packet of sample', values.cdaCode],
  ]);
  cursor.y += 8;
  cursor.y += 18;
  signatureLine(cursor, `Date: ${formatDate(values.sampleDrawnDate)}`, 'Insecticide Inspector');
  cursor.y += 1;
  cursor.doc.text('(Signature & seal)', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
}

function drawFormVE(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(E): MEMORANDUM TO INSECTICIDE ANALYST', '[See sub-rule (3) of Rule 34]');
  address(cursor, 'From:', inspectorAddress(values));
  cursor.y += 3;
  address(cursor, 'To:', values.labAddress);
  cursor.y += 6;
  paragraph(cursor, '1. The portion of sample / container described below is sent herewith for test or analysis under rule 34 of the Insecticide Rules, 1971:');
  cursor.y += 5;
  fieldList(cursor, [
    ['(a) Common name of the Insecticide', pesticideNameWithoutTrade(values), '(nominal content, type of formulation etc.)'],
    ['(b) State of packing of the sample', values.packingCondition],
    ['(c) Specimen Impression of the seal of the Inspector:', ''],
  ], 68);
  cursor.y += 5;
  cursor.doc.setFont(PDF_FONT, 'normal');
  const labelText = '2. The portion of sample/container has been assigned the distinct number or marked by me with the following mark:';
  const labelLines = split(cursor, labelText, cursor.contentWidth);
  
  // Render label lines
  ensure(cursor, labelLines.length * LINE_HEIGHT + 2);
  cursor.doc.text(labelLines, PAGE.marginX, cursor.y);
  cursor.y += labelLines.length * LINE_HEIGHT;
  
  // Render code on next line with bold formatting
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text(values.cdaCode || '', PAGE.marginX + 5, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT + 2;
  cursor.doc.setFont(PDF_FONT, 'normal');
  const point3Text = '3. A copy of this Memorandum along with a Form V (D) has been sent separately with the sample by Registered Post or by hand.';
  const point3Lines = split(cursor, point3Text, cursor.contentWidth);
  ensure(cursor, point3Lines.length * LINE_HEIGHT + 2);
  cursor.doc.text(point3Lines, PAGE.marginX, cursor.y);
  cursor.y += point3Lines.length * LINE_HEIGHT + 2;
  cursor.y += 5;
  cursor.y = Math.max(cursor.y + 12, 216);
  signatureLine(cursor, `Date: ${formatDate(values.sampleDrawnDate)}`, 'Insecticide Inspector');
}

function drawFormVC(cursor: PdfCursor, values: PesticidePdfValues) {
  cursor.y -= 6;
  cursor.doc.setLineHeightFactor(0.9);
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.setFontSize(12);
  const vcTitle = 'V(C): INTIMATION TO PERSON/LICENSEE FROM WHOM SAMPLE IS TAKEN';
  cursor.doc.text(vcTitle, PAGE.width / 2, cursor.y, { align: 'center' });
  const titleWidth = cursor.doc.getTextWidth(vcTitle);
  cursor.doc.line(PAGE.width / 2 - titleWidth / 2, cursor.y + 1.5, PAGE.width / 2 + titleWidth / 2, cursor.y + 1.5);
  cursor.y += 5;
  cursor.doc.setFontSize(BODY_SIZE);
  cursor.doc.setFont(PDF_FONT, 'normal');
  const ruleText = 'See Rule 33';
  const bracketWidth = cursor.doc.getTextWidth('[');
  const textWidth = cursor.doc.getTextWidth(ruleText);
  const totalWidth = bracketWidth * 2 + textWidth;
  const startX = PAGE.width / 2 - totalWidth / 2;
  cursor.doc.text('[', startX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'italic');
  cursor.doc.text(ruleText, startX + bracketWidth, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.text(']', startX + bracketWidth + textWidth, cursor.y);
  cursor.y += 6;
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, 'To:');
  cursor.doc.setFont(PDF_FONT, 'normal');
  addressBlock(cursor, buildDealerAddress(values), PAGE.marginX, 2, true);
  const drawDate = splitDrawnDate(values);
  
  // Build one continuous paragraph with bold values
  const paraText = `I have this ${drawDate.day} day of month ${drawDate.month} year 20${drawDate.year} taken sample from the premises of M/s ${values.dealerName || '____________________'} (Sale/stock/distribution License number ${values.licenseNumber || '________'} dated ${formatDate(values.sampleDrawnDate) || '________'}) situated at ${dealerLocation(values) || '...........................................................'}, a sample of the insecticide specified below for the purposes of test or analysis:`;
  
  // Bold values: day, month, year, dealer name, license number, sample drawn date, dealer address
  const boldValues = [
    drawDate.day,
    drawDate.month,
    `20${drawDate.year}`,
    values.dealerName,
    values.licenseNumber,
    formatDate(values.sampleDrawnDate),
    dealerLocation(values)
  ].filter(Boolean);
  
  // Render as one continuous justified paragraph with first-line indent
  cursor.y -= 6;
  renderJustifiedParagraph(cursor, paraText, boldValues);
  
  // Add consistent spacing after paragraph before numbered items
  cursor.y += LINE_HEIGHT;
  
  // Calculate stock after sampling: Stock Position - 3
  // Parse the stock position to extract quantity and preserve pack size/units
  const calculateStockAfter = (stockPosition: string): string => {
    if (!stockPosition || stockPosition.trim() === '') return '';
    
    const trimmed = stockPosition.trim();
    // Match pattern: number * rest (e.g., "50 * 120 gms") or just number (e.g., "50")
    const match = trimmed.match(/^(\d+)\s*(?:\*\s*(.*))?$/);
    
    if (match) {
      const quantity = parseInt(match[1], 10);
      const rest = match[2] || '';
      const newQuantity = Math.max(0, quantity - 3);
      
      if (rest) {
        return `${newQuantity} * ${rest}`;
      }
      return String(newQuantity);
    }
    
    // If no match, return empty (invalid format)
    return '';
  };
  
  const stockAfter = calculateStockAfter(values.stockPosition);
  // Display stock position value without appending "Units"
  const stockPositionDisplay = values.stockPosition || '';
  
  // Move point 1 up by 3 units
  cursor.y -= 3;
  
  fieldList(cursor, [
    ['1. Common name of the insecticide', pesticideNameWithoutTrade(values), '(Mention complete details, like type of formulation)'],
    ['2. Trade name, if any', values.tradeName],
    ['3. Manufactured by', values.manufacturedBy],
    ['4. Registration number', values.registrationNumber],
    ['5. Marketed by', values.marketedBy],
    ['6. Manufacturing License No.', values.manufacturingLicenseNumber],
    ['7. Batch number', values.batchNumber],
    ['8. Date of manufacture', formatDate(values.manufactureDate)],
    ['9. Date of expiry', formatDate(values.expiryDate)],
    ['10. Stock before sampling', stockPositionDisplay, '(Mention units)'],
    ['11. Quantity of the sample taken', values.sampleQuantity, '(Mention units)'],
    ['12. Stock after sampling', stockAfter, '(Mention units)'],
    ['13. Folio/page number of stock register', values.stockRegisterFolio],
    ['14. Any other relevant information', values.otherInformation],
  ], 82);
  cursor.y += 3;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  signatureLine(cursor, `Place: ${resolvedMandal || '________________'}`, 'Insecticide Inspector Seal');
  cursor.y += 2;
  cursor.y += 6;
  const witness1Label = '1. Signature of witness:';
  cursor.doc.text(witness1Label, PAGE.marginX, cursor.y);
  const witness1Width = cursor.doc.getTextWidth(witness1Label);
  drawBlank(cursor.doc, PAGE.marginX + witness1Width + 3, cursor.y, 80);
  cursor.y += LINE_HEIGHT + 2;
  cursor.y += 7;
  const witness2Label = '2. Signature of witness:';
  cursor.doc.text(witness2Label, PAGE.marginX, cursor.y);
  const witness2Width = cursor.doc.getTextWidth(witness2Label);
  drawBlank(cursor.doc, PAGE.marginX + witness2Width + 3, cursor.y, 80);
  cursor.y += 8;
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text('(Received one sealed portion of sample along with a copy of this Form.)', PAGE.marginX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT + 2;
  cursor.y += 6;
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text('Signature of the person from whom the sample is taken', PAGE.width / 2 + 23, cursor.y, { align: 'center' });
  cursor.y += LINE_HEIGHT;
  cursor.doc.text('With date and seal', PAGE.width / 2 + 23, cursor.y, { align: 'center' });
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.setLineHeightFactor(1.25);
}

function subItemField(cursor: PdfCursor, mainLabel: string, subItems: Array<[string, string]>, labelWidth = 74) {
  const x = PAGE.marginX;
  const indent = 8;
  const colonX = x + labelWidth + 1;
  const valueX = colonX + 4;
  
  // Render main label
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.text(mainLabel, x, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  // Render each sub-item with colon aligned to main fields
  subItems.forEach(([subLabel, subValue]) => {
    const subLabelX = x + indent;
    const availableValueWidth = PAGE.width - valueX - PAGE.marginX;
    
    ensure(cursor, LINE_HEIGHT + 2);
    cursor.doc.text(subLabel, subLabelX, cursor.y);
    cursor.doc.text(':', colonX, cursor.y);
    
    const valueLines = split(cursor, subValue || '', availableValueWidth);
    cursor.doc.text(valueLines, valueX, cursor.y);
    
    cursor.y += Math.max(valueLines.length, 1) * LINE_HEIGHT + 2;
  });
  
  cursor.y += 2;
}

function drawDocket(cursor: PdfCursor, values: PesticidePdfValues) {
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  
  // Use Q.C.I. SEAL PARTICULARS value directly
  const qciSealValue = values.qciSealParticulars;
  // Map Quantity Drawn for Analysis to Quantity of Sample Drawn
  const sampleQuantityAnalysis = values.sampleQuantity || values.sampleQuantityAnalysis;
  // Format invoice particulars as "No: [invoiceNumber], Dt: [invoiceDate]"
  const invoiceParticularsFormatted = [
    values.invoiceNumber ? `No: ${values.invoiceNumber}` : '',
    values.invoiceDate ? `Dt: ${formatDate(values.invoiceDate)}` : ''
  ].filter(Boolean).join(', ');
  // Format stock receipt details as "[invoiceDate] from [distributorName]"
  const stockReceiptDetailsFormatted = [
    values.invoiceDate ? formatDate(values.invoiceDate) : '',
    values.distributorName ? `from ${values.distributorName}` : ''
  ].filter(Boolean).join(' ');
  
  centeredTitle(cursor, 'DOCKET SHEET');
  fieldList(cursor, [
    ['1. Name of the District', resolvedDistrict],
  ], 82);
  
  // Sample drawn by with sub-items
  subItemField(cursor, '2. Sample drawn by', [
    ['a) Name', values.officerName],
    ['b) Designation', designationLine(values)],
  ], 82);
  
  // Name of the Chemical with sub-items
  subItemField(cursor, '3. Name of the Chemical', [
    ['a) Trade Name', values.tradeName],
    ['b) Technical Name', values.technicalName || values.insecticideCommonName],
  ], 82);
  
  fieldList(cursor, [
    ['4. Guaranteed of % ai', values.activeIngredient],
    ['5. Qty. of sample drawn for analysis', sampleQuantityAnalysis],
    ['6. Name of the dealer from whom the sample drawn', values.dealerName],
    ['7. Name of the Distributor', values.distributorName],
    ['8. Name of the Manufacturer', values.manufacturedBy],
    ['9. Batch Number', values.batchNumber],
    ['10. Date Manufacturing', formatDate(values.manufactureDate)],
    ['11. Date of Expiry', formatDate(values.expiryDate)],
    ['12. Date of Drawl of Sample', formatDate(values.sampleDrawnDate)],
    ['13. Date of receipt of stock by the dealer and from whom received', stockReceiptDetailsFormatted],
    ['14. Particulars of Invoice', invoiceParticularsFormatted],
    ['15. Stock position of batch at the time of drawl of sample', values.stockPosition],
    ['16. Code No. of A.O./A.D.A./D.D.A.', values.sampleSerialNumber],
    ['17. Q.C.I. Seal Particulars', qciSealValue],
    ['18. C.A. Seal Particulars', values.cdaCode],
    ['19. Name of the P.T.L.to which sent For analysis', 'Pesticide Testing Laboratory & Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad - 500036'],
    ['20. Date of Dispatch', formatDate(values.dispatchDate)],
  ], 82);
  cursor.y += 10;
  signatureLine(cursor, '', 'Signature of Insecticide Inspector');
}

function centeredTitle(cursor: PdfCursor, title: string, subtitle = '') {
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.setFontSize(TITLE_SIZE);
  cursor.doc.text(title, PAGE.width / 2, cursor.y, { align: 'center' });
  const titleWidth = cursor.doc.getTextWidth(title);
  cursor.doc.line(PAGE.width / 2 - titleWidth / 2, cursor.y + 1.5, PAGE.width / 2 + titleWidth / 2, cursor.y + 1.5);
  cursor.y += 8;
  if (subtitle) {
    cursor.doc.setFontSize(BODY_SIZE);
    cursor.doc.setFont(PDF_FONT, 'normal');
    // Format subtitle with normal brackets and italic text
    if (subtitle.startsWith('[') && subtitle.endsWith(']')) {
      const innerText = subtitle.slice(1, -1);
      const bracketWidth = cursor.doc.getTextWidth('[');
      const textWidth = cursor.doc.getTextWidth(innerText);
      const totalWidth = bracketWidth * 2 + textWidth;
      const startX = PAGE.width / 2 - totalWidth / 2;
      cursor.doc.text('[', startX, cursor.y);
      cursor.doc.setFont(PDF_FONT, 'italic');
      cursor.doc.text(innerText, startX + bracketWidth, cursor.y);
      cursor.doc.setFont(PDF_FONT, 'normal');
      cursor.doc.text(']', startX + bracketWidth + textWidth, cursor.y);
    } else {
      cursor.doc.text(subtitle, PAGE.width / 2, cursor.y, { align: 'center' });
    }
    cursor.y += 12;
  } else {
    cursor.y += 8;
  }
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.setFontSize(BODY_SIZE);
}

function fieldList(cursor: PdfCursor, rows: Array<[string, string, string?]>, labelWidth = 74) {
  rows.forEach(([label, value, note]) => fieldRow(cursor, label, value, note, labelWidth));
}

function fieldRow(cursor: PdfCursor, label: string, value: string, note = '', labelWidth = 74) {
  const x = PAGE.marginX;
  const y = cursor.y;
  const valueX = x + labelWidth + 5;
  const available = PAGE.width - valueX - PAGE.marginX;
  const valueLines = split(cursor, value || '', available);
  
  // Handle hanging indent for multi-line labels
  const labelMatch = label.match(/^(\d+\.\s*)(.*)$/);
  let serialNumber = '';
  let labelText = label;
  let serialWidth = 0;
  
  if (labelMatch) {
    serialNumber = labelMatch[1];
    labelText = labelMatch[2];
    serialWidth = cursor.doc.getTextWidth(serialNumber);
  }
  
  const availableLabelWidth = labelWidth - serialWidth;
  const labelLines = split(cursor, note ? `${labelText}\n${note}` : labelText, availableLabelWidth);
  const rows = Math.max(labelLines.length, valueLines.length, 1);
  ensure(cursor, rows * LINE_HEIGHT + 0.5);
  
  // Render serial number separately if exists
  if (serialNumber) {
    cursor.doc.text(serialNumber, x, y);
  }
  
  // Render label lines with hanging indent
  const labelStartX = x + serialWidth;
  cursor.doc.text(labelLines, labelStartX, y);
  cursor.doc.text(':', x + labelWidth + 1, y);
  
  if (valueLines.length) {
    cursor.doc.text(valueLines, valueX, y);
  } else {
    drawBlank(cursor.doc, valueX, y, available);
  }
  cursor.y += rows * LINE_HEIGHT + 0.5;
}

function address(cursor: PdfCursor, label: string, value: string) {
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, label);
  addressBlock(cursor, value, PAGE.marginX + 8, 4, true);
}

function addressBlock(cursor: PdfCursor, value: string, x: number, minRows: number, bold = false) {
  const lines = split(cursor, value || '', PAGE.width - PAGE.marginX - x);
  cursor.doc.setFont(PDF_FONT, bold ? 'bold' : 'normal');
  if (lines.length && lines.join('').trim()) {
    ensure(cursor, Math.max(lines.length, minRows) * LINE_HEIGHT);
    cursor.doc.text(lines, x, cursor.y);
  } else {
    ensure(cursor, minRows * LINE_HEIGHT);
    for (let i = 0; i < minRows; i += 1) drawBlank(cursor.doc, x, cursor.y + i * LINE_HEIGHT, 72);
  }
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += Math.max(lines.length || 0, minRows) * LINE_HEIGHT + 2;
}

function signatureLine(cursor: PdfCursor, left: string, right: string) {
  ensure(cursor, LINE_HEIGHT * 2, true);
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text(left, PAGE.marginX, cursor.y);
  cursor.doc.text(right, PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT;
}

function paragraph(cursor: PdfCursor, value: string) {
  const lines = split(cursor, value, cursor.contentWidth);
  ensure(cursor, lines.length * LINE_HEIGHT + 2);
  cursor.doc.text(lines, PAGE.marginX, cursor.y);
  cursor.y += lines.length * LINE_HEIGHT + 2;
}

function renderJustifiedParagraph(cursor: PdfCursor, text: string, boldValues: string[], firstLineIndent = 12) {
  const indentWidth = firstLineIndent;
  const availableWidth = cursor.contentWidth - indentWidth;
  
  // Split text into segments and identify which should be bold
  const segments: { text: string; bold: boolean }[] = [];
  let remaining = text;
  
  boldValues.forEach(boldValue => {
    if (!boldValue) return;
    const parts = remaining.split(boldValue);
    if (parts.length > 1) {
      segments.push({ text: parts[0], bold: false });
      segments.push({ text: boldValue, bold: true });
      remaining = parts.slice(1).join(boldValue);
    }
  });
  
  if (remaining) {
    segments.push({ text: remaining, bold: false });
  }
  
  // Build lines with proper wrapping
  let lines: { text: string; bold: boolean }[][] = [];
  let currentLine: { text: string; bold: boolean }[] = [];
  let currentLineWidth = 0;
  let isFirstLine = true;
  
  segments.forEach(segment => {
    const words = segment.text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordWithSpace = wordIndex === 0 ? word : ` ${word}`;
      const wordWidth = cursor.doc.getTextWidth(wordWithSpace);
      const maxWidth = isFirstLine ? availableWidth : cursor.contentWidth;
      
      if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [{ text: word, bold: segment.bold }];
        currentLineWidth = cursor.doc.getTextWidth(word);
        isFirstLine = false;
      } else {
        currentLine.push({ text: wordWithSpace, bold: segment.bold });
        currentLineWidth += wordWidth;
      }
    });
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Render lines with first-line indent and single line spacing
  ensure(cursor, lines.length * LINE_HEIGHT);
  
  lines.forEach((line, index) => {
    const x = index === 0 ? PAGE.marginX + indentWidth : PAGE.marginX;
    let currentX = x;
    
    line.forEach(segment => {
      cursor.doc.setFont(PDF_FONT, segment.bold ? 'bold' : 'normal');
      cursor.doc.text(segment.text, currentX, cursor.y);
      currentX += cursor.doc.getTextWidth(segment.text);
    });
    
    cursor.y += LINE_HEIGHT;
  });
  
  cursor.doc.setFont(PDF_FONT, 'normal');
}

function text(cursor: PdfCursor, value: string) {
  ensure(cursor, LINE_HEIGHT);
  cursor.doc.text(value, PAGE.marginX, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawBlank(doc: JsPdfInstance, x: number, y: number, width: number) {
  doc.line(x, y + 1.4, Math.min(PAGE.width - PAGE.marginX, x + width), y + 1.4);
}

function ensure(cursor: PdfCursor, neededHeight: number, noPageBreak = false) {
  if (cursor.y + neededHeight <= PAGE.bottom) return;
  if (noPageBreak) return;
  cursor.doc.addPage();
  cursor.y = PAGE.top;
}

function split(cursor: PdfCursor, value: string, width: number) {
  return cursor.doc.splitTextToSize(value || '', width) as string[];
}

function normalizePesticideValues(values: PesticidePdfValues): PesticidePdfValues {
  const normalized = { ...initialPesticidePdfValues, ...values };
  if (!normalized.sampleDrawnDay || !normalized.sampleDrawnMonth || !normalized.sampleDrawnYear) {
    const date = new Date(`${normalized.sampleDrawnDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      normalized.sampleDrawnDay = normalized.sampleDrawnDay || String(date.getDate()).padStart(2, '0');
      normalized.sampleDrawnMonth = normalized.sampleDrawnMonth || date.toLocaleString('en-IN', { month: 'long' });
      normalized.sampleDrawnYear = normalized.sampleDrawnYear || String(date.getFullYear()).slice(-2);
    }
  }
  // Ensure activeIngredient has % symbol if missing
  if (normalized.activeIngredient && !normalized.activeIngredient.includes('%')) {
    normalized.activeIngredient = normalized.activeIngredient + '%';
  }
  // Ensure new fields have default values for backward compatibility
  // (already handled by spreading initialPesticidePdfValues which includes defaults)
  return normalized;
}

function pesticideNameWithoutTrade(values: PesticidePdfValues) {
  const technicalName = values.technicalName?.trim() || '';
  const activeIngredient = values.activeIngredient?.trim() || '';
  const formulationType = values.formulationType === 'Others' 
    ? values.manualFormulationType?.trim() || ''
    : values.formulationType?.trim() || '';
  
  return [
    technicalName,
    activeIngredient,
    formulationType,
  ].filter((part) => part && part.trim() !== '').join(' ');
}

function inspectorAddress(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  
  // Format district with PIN Code (e.g., "Kumrambheem Asifabad -504297")
  const districtWithPincode = values.pincode && resolvedDistrict 
    ? `${resolvedDistrict} -${values.pincode}`
    : resolvedDistrict || '';
  
  const addressParts = [
    officerNameWithQualification,
    values.designation,
    resolvedMandal ? `${resolvedMandal} Mandal` : '',
    districtWithPincode,
  ]
    .map((part) => part.trim())
    .filter(Boolean);
  
  // Add email in brackets below if present
  if (values.email) {
    addressParts.push(`(${values.email})`);
  }
  
  return addressParts.join('\n');
}

function inspectorLine(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  return [officerNameWithQualification, values.designation, resolvedMandal, resolvedDistrict].map((part) => part.trim()).filter(Boolean).join('\n');
}

function designationLine(values: PesticidePdfValues) {
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const parts = [values.designation];
  if (resolvedMandal) {
    parts.push(resolvedMandal);
  }
  return parts.map((part) => part.trim()).filter(Boolean).join(', ');
}

function buildDealerAddress(values: PesticidePdfValues) {
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  const districtWithPincode = values.pincode && resolvedDistrict ? `${resolvedDistrict} - ${values.pincode}.` : resolvedDistrict;
  return [values.dealerName, values.dealerAddress, values.premisesLocation, resolvedMandal, districtWithPincode].map((part) => part.trim()).filter(Boolean).join('\n');
}

function dealerLocation(values: PesticidePdfValues) {
  const addressWithoutNewlines = values.dealerAddress.replace(/\n/g, ', ');
  return [addressWithoutNewlines, values.premisesLocation].map((part) => part.trim()).filter(Boolean).join(', ');
}

function splitDrawnDate(values: PesticidePdfValues) {
  return {
    day: values.sampleDrawnDay || '__',
    month: values.sampleDrawnMonth || '________',
    year: values.sampleDrawnYear || '__',
  };
}

function getSampleFilePart(values: PesticidePdfValues) {
  return sanitizeFilePart(values.cdaCode || values.batchNumber || values.insecticideCommonName || values.dealerName) || 'PesticideSample';
}

function getPesticideFormFilePart(formType: PesticideStatutoryFormType) {
  if (formType === 'VC') return 'FormVC';
  if (formType === 'VD') return 'FormVD';
  if (formType === 'VE') return 'FormVE';
  return 'DocketSheet';
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
}