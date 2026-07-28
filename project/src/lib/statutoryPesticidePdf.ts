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
  insecticideCommonName: string;
  technicalName: string;
  tradeName: string;
  activeIngredient: string;
  formulationType: string;
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
};

export const initialPesticidePdfValues: PesticidePdfValues = {
  officerName: '',
  designation: '',
  officeAddress: '',
  officerEmail: '',
  district: '',
  mandal: '',
  place: '',
  date: '',
  sampleDrawnDate: '',
  sampleDrawnDay: '',
  sampleDrawnMonth: '',
  sampleDrawnYear: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  licenseNumber: '',
  licenseDate: '',
  insecticideCommonName: '',
  technicalName: '',
  tradeName: '',
  activeIngredient: '',
  formulationType: '',
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
  stockPosition: '',
  specimenSeal: '',
  distinctMark: '',
  cdaCode: '',
  qciSealParticulars: '',
  caSealParticulars: '',
  otherInformation: '',
  labAddress: 'The Insecticide Analyst,\nDeputy Director of Agriculture (IA),\nPesticide Testing Laboratory & Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad - 36.',
  qualification: '',
  manualQualification: '',
  manualDistrict: '',
  manualMandal: '',
};

export const pesticideFormTitles: Record<PesticideStatutoryFormType, string> = {
  VC: 'FORM V(C)',
  VD: 'FORM V(D)',
  VE: 'FORM V(E)',
  DOCKET: 'DOCKET SHEET',
};

const PAGE = { marginX: 18, top: 22, bottom: 276, width: 210, height: 297 };
const PDF_FONT = 'times';
const BODY_SIZE = 12.5;
const TITLE_SIZE = 16;
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
  centeredTitle(cursor, 'V(D): Form to be kept with sample in sealed packet', '[See sub-rule (1) of Rule 34]');
  address(cursor, 'To,', values.labAddress);
  cursor.y += 3;
  fieldList(cursor, [
    ['1. Name of the Insecticide', pesticideName(values), '(Common Name with active ingredient % and formulation type)'],
    ['2. Batch Number', values.batchNumber],
    ['3. Date of Manufacture', formatDate(values.manufactureDate)],
    ['4. Date of Expiry', formatDate(values.expiryDate)],
    ['5. Packing condition (original sealed/loose)', values.packingCondition],
    ['6. Quantity of the sample', values.sampleQuantity],
    ['7. Sample drawn on', formatDate(values.sampleDrawnDate)],
    ['8. Sample drawn by', inspectorLine(values)],
    ['9. Specimen seal of Insecticide Inspector/Licensee, if any', values.specimenSeal],
    ['10. Distinct mark on the sealed packet of sample', values.distinctMark],
    ['11. C & DA Code', values.cdaCode],
  ]);
}

function drawFormVE(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(E): MEMORANDUM TO INSECTICIDE ANALYST', '[See sub-rule (3) of Rule 34]');
  twoColumnAddresses(cursor, 'From,', inspectorAddress(values), 'To,', values.labAddress);
  cursor.y += 6;
  paragraph(cursor, 'The portion of sample / container described below is sent herewith for test or analysis under rule 34 of the Insecticide Rules, 1971:');
  cursor.y += 5;
  fieldList(cursor, [
    ['(a) Common name of the Insecticide', pesticideName(values), '(nominal content, type of formulation etc.)'],
    ['(b) State of packing of the sample', values.packingCondition],
    ['(c) C&DA Code', values.cdaCode],
  ], 68);
  cursor.y = Math.max(cursor.y + 12, 216);
  signatureLine(cursor, `Date: ${formatDate(values.date)}`, 'Insecticide Inspector');
}

function drawFormVC(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(C): INTIMATION TO PERSON/LICENSEE FROM WHOM SAMPLE IS TAKEN', '[See Rule 33]');
  text(cursor, 'To');
  addressBlock(cursor, buildDealerAddress(values), PAGE.marginX, 4);
  const drawDate = splitDrawnDate(values);
  paragraph(cursor, `I have this ${drawDate.day} day of month ${drawDate.month} year 20${drawDate.year} taken sample from the premises of M/s ${values.dealerName || '____________________'} (Sale/stock/distribution License number ${values.licenseNumber || '________'} dated ${formatDate(values.licenseDate) || '________'})`);
  paragraph(cursor, `Situated at ${dealerLocation(values) || '____________________'}, a sample of the insecticide specified below for the purposes of test or analysis:`);
  fieldList(cursor, [
    ['1. Common name of the insecticide', pesticideName(values), '(Mention complete details, like type of formulation)'],
    ['2. Trade name, if any', values.tradeName],
    ['3. Manufactured by', values.manufacturedBy],
    ['4. Registration number', values.registrationNumber],
    ['5. Marketed by', values.marketedBy],
    ['6. Manufacturing License No.', values.manufacturingLicenseNumber],
    ['7. Batch number', values.batchNumber],
    ['8. Date of manufacture', formatDate(values.manufactureDate)],
    ['9. Date of expiry', formatDate(values.expiryDate)],
    ['10. Stock before sampling', values.stockBeforeSampling, '(Mention units)'],
    ['11. Quantity of the sample taken', values.sampleQuantity, '(Mention units)'],
    ['12. Stock after sampling', values.stockAfterSampling, '(Mention units)'],
    ['13. Folio/page number of stock register', values.stockRegisterFolio],
    ['14. Any other relevant information', values.otherInformation],
  ], 82);
  cursor.y += 3;
  signatureLine(cursor, `Date: ${formatDate(values.date)}`, 'Insecticide Inspector Seal');
  cursor.y += 10;
  text(cursor, '1. Signature of witness:');
}

function drawDocket(cursor: PdfCursor, values: PesticidePdfValues) {
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  
  centeredTitle(cursor, 'DOCKET SHEET');
  fieldList(cursor, [
    ['1. Name of the District', resolvedDistrict],
    ['2. Sample drawn by - a) Name', values.officerName],
    ['   b) Designation', designationLine(values)],
    ['3. Name of the Chemical - a) Trade Name', values.tradeName],
    ['   b) Technical Name', values.technicalName || values.insecticideCommonName],
    ['4. Guaranteed of % ai', values.activeIngredient],
    ['5. Qty. of sample drawn for analysis', values.sampleQuantityAnalysis || values.sampleQuantity],
    ['6. Name of the dealer from whom the sample drawn', values.dealerName],
    ['7. Name of the Distributor', values.distributorName],
    ['8. Name of the Manufacturer', values.manufacturedBy],
    ['9. Batch Number', values.batchNumber],
    ['10. Date Manufacturing', formatDate(values.manufactureDate)],
    ['11. Date of Expiry', formatDate(values.expiryDate)],
    ['12. Date of Drawl of Sample', formatDate(values.sampleDrawnDate)],
    ['13. Date of receipt of stock by the dealer and from whom received', values.stockReceiptDetails],
    ['14. Particulars of Invoice', values.invoiceParticulars],
    ['15. Stock position of batch at the time of drawl of sample', values.stockPosition],
    ['16. Code No. of A.O./A.D./D.D.A.', values.cdaCode],
    ['17. Q.C.I. Seal Particulars', values.qciSealParticulars],
    ['18. C.A. Seal Particulars', values.caSealParticulars],
  ], 82);
}

function centeredTitle(cursor: PdfCursor, title: string, subtitle = '') {
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.setFontSize(TITLE_SIZE);
  cursor.doc.text(title, PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 8;
  if (subtitle) {
    cursor.doc.setFontSize(BODY_SIZE);
    cursor.doc.text(subtitle, PAGE.width / 2, cursor.y, { align: 'center' });
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
  const labelLines = split(cursor, note ? `${label}\n${note}` : label, labelWidth);
  const rows = Math.max(labelLines.length, valueLines.length, 1);
  ensure(cursor, rows * LINE_HEIGHT + 2);
  cursor.doc.text(labelLines, x, y);
  cursor.doc.text(':', x + labelWidth + 1, y);
  if (valueLines.length) {
    cursor.doc.setFont(PDF_FONT, 'bold');
    cursor.doc.text(valueLines, valueX, y);
    cursor.doc.setFont(PDF_FONT, 'normal');
  } else {
    drawBlank(cursor.doc, valueX, y, available);
  }
  cursor.y += rows * LINE_HEIGHT + 2;
}

function address(cursor: PdfCursor, label: string, value: string) {
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

function twoColumnAddresses(cursor: PdfCursor, leftLabel: string, left: string, rightLabel: string, right: string) {
  const leftX = PAGE.marginX;
  const rightX = PAGE.width / 2 + 4;
  const colWidth = PAGE.width / 2 - PAGE.marginX - 8;
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text(leftLabel, leftX, cursor.y);
  cursor.doc.text(rightLabel, rightX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT;
  const leftLines = split(cursor, left, colWidth);
  const rightLines = split(cursor, right, colWidth);
  const rows = Math.max(leftLines.length, rightLines.length, 4);
  ensure(cursor, rows * LINE_HEIGHT);
  cursor.doc.text(leftLines, leftX, cursor.y);
  cursor.doc.text(rightLines, rightX, cursor.y);
  cursor.y += rows * LINE_HEIGHT + 2;
}

function signatureLine(cursor: PdfCursor, left: string, right: string) {
  ensure(cursor, LINE_HEIGHT * 2, true);
  cursor.doc.text(left, PAGE.marginX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'bold');
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
  // Ensure new fields have default values for backward compatibility
  // (already handled by spreading initialPesticidePdfValues which includes defaults)
  return normalized;
}

function pesticideName(values: PesticidePdfValues) {
  return [
    values.insecticideCommonName,
    values.activeIngredient,
    values.formulationType,
  ].map((part) => part.trim()).filter(Boolean).join(' ');
}

function inspectorAddress(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  
  return [
    officerNameWithQualification,
    values.designation,
    resolvedMandal ? `${resolvedMandal} Mandal` : '',
    resolvedDistrict || '',
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n');
}

function inspectorLine(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  return [officerNameWithQualification, values.designation, resolvedMandal, resolvedDistrict].map((part) => part.trim()).filter(Boolean).join(', ');
}

function designationLine(values: PesticidePdfValues) {
  return [values.designation].map((part) => part.trim()).filter(Boolean).join(', ');
}

function buildDealerAddress(values: PesticidePdfValues) {
  return [values.dealerName, values.dealerAddress, values.premisesLocation].map((part) => part.trim()).filter(Boolean).join('\n');
}

function dealerLocation(values: PesticidePdfValues) {
  return [values.dealerAddress, values.premisesLocation].map((part) => part.trim()).filter(Boolean).join(', ');
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