import type { jsPDF as JsPdfInstance } from 'jspdf';

export type FertilizerStatutoryFormType = 'J' | 'K_ADA' | 'K_JDA' | 'P';

export type FertilizerPdfValues = {
  no: string;
  dealerName: string;
  dealerAddress: string;
  premisesLocation: string;
  dealerNameAddress: string;
  authorizationNumber: string;
  samplingDate: string;
  markings: string;
  fertilizerTypeGrade: string;
  dealerManufacturerImporterName: string;
  batchDetails: string;
  composition: string;
  compositionN: string;
  compositionN_T: string;
  compositionP_T: string;
  compositionP_WS: string;
  compositionP_available: string;
  compositionZn: string;
  compositionP_CS: string;
  compositionP2O5_T: string;
  compositionP2O5_WS: string;
  compositionP2O5_CS: string;
  compositionK: string;
  compositionK_T: string;
  compositionK2O: string;
  compositionK2O_T: string;
  compositionS: string;
  compositionCa: string;
  stockReceiptDate: string;
  sampleCode: string;
  stockPosition: string;
  physicalCondition: string;
  bagSource: string;
  inspectorNameAddress: string;
  dealerReceipt: string;
  fromAddress: string;
  toAddress: string;
  forwardReportAddress: string;
  nameGrade: string;
  codeNumber: string;
  place: string;
  date: string;
  officerName: string;
  designation: string;
  officeAddress: string;
  compositionDisplayFlags: string;
  qualification: string;
  manualQualification: string;
  district: string;
  mandal: string;
  manualDistrict: string;
  manualMandal: string;
};

export const FERTILIZER_K_ADDRESS_OPTIONS = {
  K_ADA: {
    label: 'Form K (ADA)',
    value: 'Assistant Director of Agriculture\nFertilizer Coding Centre\nSAMETI Complex\nOld Malakpet\nHyderabad',
  },
  K_JDA: {
    label: 'Form K (JDA)',
    value: 'The Designated Authority\nJDA Soil Correlator\nFertilizer Coding Centre\nSAMETI Complex\nOld Malakpet\nHyderabad',
  },
} as const;

export const initialFertilizerPdfValues: FertilizerPdfValues = {
  no: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  dealerNameAddress: '',
  authorizationNumber: '',
  samplingDate: '',
  markings: '',
  fertilizerTypeGrade: '',
  dealerManufacturerImporterName: '',
  batchDetails: '',
  composition: '',
  compositionN: '',
  compositionN_T: '',
  compositionP_T: '',
  compositionP_WS: '',
  compositionP_available: '',
  compositionZn: '',
  compositionP_CS: '',
  compositionP2O5_T: '',
  compositionP2O5_WS: '',
  compositionP2O5_CS: '',
  compositionK: '',
  compositionK_T: '',
  compositionK2O: '',
  compositionK2O_T: '',
  compositionS: '',
  compositionCa: '',
  stockReceiptDate: '',
  sampleCode: '',
  stockPosition: '',
  physicalCondition: '',
  bagSource: '',
  inspectorNameAddress: '',
  dealerReceipt: '',
  fromAddress: '',
  toAddress: FERTILIZER_K_ADDRESS_OPTIONS.K_ADA.value,
  forwardReportAddress: '',
  nameGrade: '',
  codeNumber: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  officerName: '',
  designation: '',
  officeAddress: '',
  compositionDisplayFlags: 'N,P_T,P_WS,P_CS,K',
  qualification: '',
  manualQualification: '',
  district: '',
  mandal: '',
  manualDistrict: '',
  manualMandal: '',
};

export const fertilizerFormTitles: Record<FertilizerStatutoryFormType, string> = {
  J: 'FORM J',
  K_ADA: 'FORM K (ADA)',
  K_JDA: 'FORM K (JDA)',
  P: 'FORM P',
};

const CERTIFICATION_TEXT =
  'Certified that the sample of fertilizer has been drawn in accordance with the procedure laid down in the Fertilizer (Control) Order, 1985 from the stock in my possession, and I have signed the test samples at the time of wax sealing. I have also received one test sample out of the three test samples prepared.';

const PAGE = {
  marginX: 20,
  top: 20,
  bottom: 277,
  width: 210,
  height: 297,
};

const PDF_FONT = 'times';
const BODY_SIZE = 12.5;
const TITLE_SIZE = 16;
const ROW_LINE_HEIGHT = 5.9;
const ROW_GAP = 1.7;
const PARA_LINE_HEIGHT = 6.1;
const FORM_J_SIGNATURE_GAP = 10;
const FORM_J_INSPECTOR_SIGNATURE_GAP = 22;
const FORM_J_PRE_RECEIPT_SIGNATURE_LIFT = 14;
const FORM_J_RECEIPT_DOWN_SHIFT = 11;
const FORM_J_SIGNATURE_BOTTOM_CLEARANCE = 16;
const SIGNATURE_RIGHT_X = PAGE.width - PAGE.marginX - 8;

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateFertilizerStatutoryPdf(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues
) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, `${fertilizerFormTitles[formType]} - Fertilizer Sampling`);
  drawForm(doc, formType, values);
  return doc;
}

export async function generateAllFertilizerStatutoryPdf(values: FertilizerPdfValues) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, 'FORM J K P - Fertilizer Sampling');

  drawForm(doc, 'J', values);
  doc.addPage();
  drawForm(doc, 'K_ADA', values);
  doc.addPage();
  drawForm(doc, 'K_JDA', values);
  doc.addPage();
  drawForm(doc, 'P', values);
  return doc;
}

export async function createFertilizerPdfBlobUrl(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues
) {
  const doc = await generateFertilizerStatutoryPdf(formType, values);
  return URL.createObjectURL(doc.output('blob'));
}

export async function createAllFertilizerPdfBlobUrl(values: FertilizerPdfValues) {
  const doc = await generateAllFertilizerStatutoryPdf(values);
  return URL.createObjectURL(doc.output('blob'));
}

export function getFertilizerPdfFileName(formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  return `${getSampleCodeFilePart(values)}_${getFormFilePart(formType)}.pdf`;
}

export function getAllFertilizerPdfFileName(values: FertilizerPdfValues) {
  return `${getSampleCodeFilePart(values)}_FormJ_FormK_ADA_FormK_JDA_FormP.pdf`;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title,
    subject: 'Statutory fertilizer sampling form',
    creator: 'Tiryani Agriculture Portal',
  });
  return doc;
}

function drawForm(doc: JsPdfInstance, formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  const cursor = resetPage(doc);

  drawHeader(cursor, formType, values);

  if (formType === 'J') drawFormJ(cursor, values);
  if (formType === 'K_ADA' || formType === 'K_JDA') drawFormK(cursor, formType, values);
  if (formType === 'P') drawFormP(cursor, values);
}

function resetPage(doc: JsPdfInstance): PdfCursor {
  doc.setLineHeightFactor(1.25);
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);
  return {
    doc,
    y: PAGE.top,
    contentWidth: PAGE.width - PAGE.marginX * 2,
  };
}

function drawHeader(cursor: PdfCursor, formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  const { doc } = cursor;
  const displayType = formType === 'K_ADA' || formType === 'K_JDA' ? 'K' : formType;

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(`FORM '${displayType}'`, PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 6.5;

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.text(getClauseReference(formType), PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 9;

  doc.text(displayType === 'J' ? `No: ${values.no || ''}` : `No. ${values.no || ''}`, PAGE.marginX, cursor.y);
  cursor.y += 8;

  doc.setFont(PDF_FONT, 'bold');
  const headingLines = split(cursor, getHeading(formType), cursor.contentWidth);
  doc.text(headingLines, PAGE.width / 2, cursor.y, { align: 'center' });
  if (headingLines.length === 1) {
    const headingWidth = doc.getTextWidth(headingLines[0]);
    doc.line(PAGE.width / 2 - headingWidth / 2, cursor.y + 1.5, PAGE.width / 2 + headingWidth / 2, cursor.y + 1.5);
  } else {
    for (let i = 0; i < headingLines.length; i++) {
      const lineWidth = doc.getTextWidth(headingLines[i]);
      const lineY = cursor.y + i * PARA_LINE_HEIGHT + 1.5;
      doc.line(PAGE.width / 2 - lineWidth / 2, lineY, PAGE.width / 2 + lineWidth / 2, lineY);
    }
  }
  cursor.y += headingLines.length * PARA_LINE_HEIGHT + 7;
  doc.setFont(PDF_FONT, 'normal');
}

function drawFormJ(cursor: PdfCursor, values: FertilizerPdfValues) {
  const fieldOptions = { lineHeight: 5.25, gap: 0.85, noPageBreak: true };

  field(cursor, '(1) Name and Address of Dealer/Manufacturer/Importer', values.dealerNameAddress, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(1A) Letter of Authorization No.', values.authorizationNumber, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(2) Date of Sampling', formatFieldValue(values.samplingDate), 91, PAGE.marginX, fieldOptions);

  heading(cursor, '(3) Details of markings on the bags from where sample has been taken', true);
  if (values.markings.trim()) paragraph(cursor, values.markings, PAGE.marginX + 6, cursor.contentWidth - 6, 5, true);
  field(cursor, 'a) Type and Grade of Fertilizer', values.fertilizerTypeGrade, 84, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'b) Name of Dealer/Manufacturer/Importer', values.dealerManufacturerImporterName, 84, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'c) Batch No. and Date of Manufacture/Import', values.batchDetails, 84, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'd) Composition of Fertilizer', formatComposition(values), 84, PAGE.marginX + 6, fieldOptions);

  field(cursor, '(4) Date of Receipt of Stock by Dealer/Manufacturer/Importer/Pool Handling Agency', formatFieldValue(values.stockReceiptDate), 91, PAGE.marginX, fieldOptions);
  field(cursor, '(5) Code No. of Sample', values.sampleCode, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(6) Stock Position of the Lot', values.stockPosition, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(7) Physical Condition of Fertilizer', values.physicalCondition, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(8) Samples Drawn From Open Bags/Stitched Bags/Bulk', values.bagSource, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(9) Name and Address of Fertilizer Inspector Drawing Sample', values.inspectorNameAddress, 82, PAGE.marginX, {
    ...fieldOptions,
    gap: 1.2,
  });

  drawPreReceiptInspectorSignature(cursor);
  drawDealerReceipt(cursor);
}

function drawPreReceiptInspectorSignature(cursor: PdfCursor) {
  const { doc } = cursor;
  cursor.y += FORM_J_INSPECTOR_SIGNATURE_GAP;
  doc.setFont(PDF_FONT, 'bold');
  doc.text(['Signature and Metallic Seal', 'Impression of Fertilizer Inspector'], SIGNATURE_RIGHT_X, cursor.y - FORM_J_PRE_RECEIPT_SIGNATURE_LIFT, {
    align: 'right',
  });
  doc.setFont(PDF_FONT, 'normal');
  cursor.y += 16;
}

function drawDealerReceipt(cursor: PdfCursor) {
  const { doc } = cursor;
  const receiptLines = split(cursor, CERTIFICATION_TEXT, cursor.contentWidth);
  const compactParaLineHeight = 5.5;
  const receiptTextHeight = receiptLines.length * compactParaLineHeight;
  const receiptHeight = 8 + receiptTextHeight;
  const signatureY = Math.min(
    cursor.y + FORM_J_RECEIPT_DOWN_SHIFT + receiptHeight + FORM_J_SIGNATURE_GAP,
    PAGE.bottom - FORM_J_SIGNATURE_BOTTOM_CLEARANCE
  );
  const latestY = signatureY - FORM_J_SIGNATURE_GAP - receiptTextHeight - 8;

  cursor.y = Math.min(cursor.y + FORM_J_RECEIPT_DOWN_SHIFT, latestY);

  doc.setFont(PDF_FONT, 'bold');
  doc.text('Receipt of the Dealer', PAGE.width / 2, cursor.y, { align: 'center' });
  doc.line(PAGE.width / 2 - 25, cursor.y + 1.5, PAGE.width / 2 + 25, cursor.y + 1.5);
  cursor.y += 8;

  doc.setFont(PDF_FONT, 'normal');
  doc.text(receiptLines, PAGE.marginX, cursor.y);
  cursor.y += receiptHeight;

  doc.setFont(PDF_FONT, 'bold');
  doc.text('Signature of Dealer', PAGE.marginX + 33, signatureY, { align: 'center' });
  doc.text(['Signature and Metallic Seal', 'Impression of Fertilizer Inspector'], SIGNATURE_RIGHT_X, signatureY, {
    align: 'right',
  });
  doc.setFont(PDF_FONT, 'normal');
}

function drawFormK(cursor: PdfCursor, formType: 'K_ADA' | 'K_JDA', values: FertilizerPdfValues) {
  const { doc } = cursor;
  doc.setFont(PDF_FONT, 'normal');

  boldText(cursor, 'From');
  addressBlock(cursor, values.inspectorNameAddress, PAGE.marginX + 10, 4, true);
  cursor.y += 3;

  boldText(cursor, 'To');
  addressBlock(cursor, getKAddress(formType), PAGE.marginX + 10, 5, true);
  cursor.y += 5;

  paragraph(cursor, '1) The fertilizer samples as per details given below are sent for analysis: -');
  field(cursor, 'a. Type & Grade of Fertilizer', values.fertilizerTypeGrade, 72, PAGE.marginX + 6);
  field(cursor, 'b. Date of Sampling', formatFieldValue(values.samplingDate), 72, PAGE.marginX + 6);
  field(cursor, 'c. Physical Condition', values.physicalCondition, 72, PAGE.marginX + 6);
  field(cursor, 'd. Code Number', values.sampleCode, 72, PAGE.marginX + 6);
  cursor.y += 2;

  paragraph(cursor, '2) The analysis report may please be forwarded to the undersigned');
  addressBlock(cursor, values.inspectorNameAddress, PAGE.marginX + 10, 4);

  drawPlaceDateAndInspectorSignature(cursor, values, { showPlaceDate: true });
}

function drawFormP(cursor: PdfCursor, values: FertilizerPdfValues) {
  field(cursor, '1. Name and Grade of Fertilizer', values.nameGrade, 82);
  cursor.y += 2;
  field(cursor, '2. Composition', formatComposition(values), 82);
  cursor.y += 2;
  field(cursor, '3. Physical Condition of Fertilizer', values.physicalCondition, 82);
  cursor.y += 2;
  field(cursor, '4. Code Number', values.codeNumber, 82);
  cursor.y += 2;
  field(cursor, '5. Date of Sampling', formatFieldValue(values.samplingDate), 82);
  cursor.y += 2;
  field(cursor, '6. Name & Address of Fertilizer\nInspector Drawing Sample', values.inspectorNameAddress, 82);

  drawInspectorSignatureOnly(cursor);
}

function drawPlaceDateAndInspectorSignature(
  cursor: PdfCursor,
  values: FertilizerPdfValues,
  options: { showPlaceDate: boolean }
) {
  const blockHeight = 36;
  const minY = cursor.y + 4;
  const preferredY = cursor.y + 4;
  const footerY = Math.min(Math.max(minY, preferredY), PAGE.bottom - blockHeight);

  cursor.y = footerY;
  ensure(cursor, blockHeight);

  const { doc } = cursor;
  if (options.showPlaceDate) {
    doc.setFont(PDF_FONT, 'normal');
    doc.text(`Place: ${values.place || '___________'}`, PAGE.marginX, cursor.y);
    doc.text(`Date: ${formatFieldValue(values.date) || '____________'}`, PAGE.marginX, cursor.y + 8);
  }
  doc.setFont(PDF_FONT, 'bold');
  doc.text(
    ['Signature and Metallic Seal', 'Impression of Fertilizer Inspector'],
    SIGNATURE_RIGHT_X,
    cursor.y + 22,
    { align: 'right' }
  );
  doc.setFont(PDF_FONT, 'normal');
}

function drawInspectorSignatureOnly(cursor: PdfCursor) {
  const blockHeight = 18;
  cursor.y = Math.min(cursor.y + 8, PAGE.bottom - blockHeight);
  ensure(cursor, blockHeight);
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text(['Signature and Metallic Seal', 'Impression of Fertilizer Inspector'], SIGNATURE_RIGHT_X, cursor.y, {
    align: 'right',
  });
  cursor.doc.setFont(PDF_FONT, 'normal');
}

function field(
  cursor: PdfCursor,
  label: string,
  value: string,
  labelWidth: number,
  x = PAGE.marginX,
  options: { lineHeight?: number; gap?: number; noPageBreak?: boolean } = {}
) {
  const { doc } = cursor;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);

  const lineHeight = options.lineHeight ?? ROW_LINE_HEIGHT;
  const gap = options.gap ?? ROW_GAP;
  const colonX = x + labelWidth;
  const valueX = colonX + 4;
  const availableValueWidth = PAGE.width - PAGE.marginX - valueX;
  const labelLines = split(cursor, label, Math.max(labelWidth - 3, 35));
  const valueLines = split(cursor, formatFieldValue(value) || '________________', availableValueWidth);
  const rowHeight = Math.max(labelLines.length, valueLines.length) * lineHeight + gap;

  ensure(cursor, rowHeight, options.noPageBreak);
  doc.text(labelLines, x, cursor.y);
  doc.text(':', colonX, cursor.y);
  doc.text(valueLines, valueX, cursor.y);
  cursor.y += rowHeight;
}

function heading(cursor: PdfCursor, value: string, noPageBreak = false) {
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, value, ROW_LINE_HEIGHT + 1, noPageBreak);
  cursor.doc.setFont(PDF_FONT, 'normal');
}

function paragraph(
  cursor: PdfCursor,
  value: string,
  x = PAGE.marginX,
  width = cursor.contentWidth,
  lineHeight = PARA_LINE_HEIGHT,
  noPageBreak = false
) {
  const lines = split(cursor, value, width);
  const height = Math.max(lines.length, 1) * lineHeight + 1;
  ensure(cursor, height, noPageBreak);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.text(lines, x, cursor.y);
  cursor.y += height;
}

function text(cursor: PdfCursor, value: string, lineHeight = PARA_LINE_HEIGHT, noPageBreak = false) {
  const lines = split(cursor, value, cursor.contentWidth);
  ensure(cursor, lines.length * lineHeight, noPageBreak);
  cursor.doc.text(lines, PAGE.marginX, cursor.y);
  cursor.y += lines.length * lineHeight;
}

function boldText(cursor: PdfCursor, value: string, lineHeight = PARA_LINE_HEIGHT) {
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, value, lineHeight);
  cursor.doc.setFont(PDF_FONT, 'normal');
}

function addressBlock(cursor: PdfCursor, value: string, x: number, minRows: number, bold = false) {
  if (value.trim()) {
    const lines = split(cursor, value, PAGE.width - PAGE.marginX - x);
    const height = Math.max(lines.length, 1) * PARA_LINE_HEIGHT + 1;
    ensure(cursor, height);
    cursor.doc.setFont(PDF_FONT, bold ? 'bold' : 'normal');
    cursor.doc.text(lines, x, cursor.y);
    cursor.y += height;
    cursor.doc.setFont(PDF_FONT, 'normal');
    return;
  }

  ensure(cursor, minRows * ROW_LINE_HEIGHT);
  cursor.doc.setFont(PDF_FONT, bold ? 'bold' : 'normal');
  for (let i = 0; i < minRows; i += 1) {
    cursor.doc.text('______________________', x, cursor.y + i * ROW_LINE_HEIGHT);
  }
  cursor.y += minRows * ROW_LINE_HEIGHT + 1;
  cursor.doc.setFont(PDF_FONT, 'normal');
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

function getClauseReference(formType: FertilizerStatutoryFormType) {
  if (formType === 'J') return '[ See clause 28 (1) (b) and 28 (1) (bb)]';
  if (formType === 'K_ADA' || formType === 'K_JDA') return '[ See clause 30 (1)]';
  return '[See Clause 28 (1) (b)]';
}

function getHeading(formType: FertilizerStatutoryFormType) {
  if (formType === 'J') {
    return 'FORM INDICATING PARTICULARS OF FERTILIZERS / ORGANIC FERTILIZERS / BIO-FERTILIZERS SAMPLED';
  }
  if (formType === 'K_ADA' || formType === 'K_JDA') {
    return 'MEMORANDUM TO ACCOMPANY FERTILISER / ORGANIC FERTILISER / BIO-FERTILISER SAMPLE FOR ANALYSIS.';
  }
  return 'PARTICULARS OF SAMPLES DRAWN';
}

function getKAddress(formType: 'K_ADA' | 'K_JDA') {
  return FERTILIZER_K_ADDRESS_OPTIONS[formType].value;
}

function getSampleCode(values: FertilizerPdfValues) {
  return values.sampleCode.trim() || values.codeNumber.trim() || values.no.trim();
}

function getSampleCodeFilePart(values: FertilizerPdfValues) {
  return sanitizeFilePart(getSampleCode(values)) || 'SampleCode';
}

function getFormFilePart(formType: FertilizerStatutoryFormType) {
  if (formType === 'J') return 'FormJ';
  if (formType === 'K_ADA') return 'FormK_ADA';
  if (formType === 'K_JDA') return 'FormK_JDA';
  return 'FormP';
}

function formatFieldValue(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value);
  return value;
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatComposition(values: FertilizerPdfValues) {
  const displayFlags = values.compositionDisplayFlags.split(',').map(f => f.trim());
  
  const labelMap: Record<string, { label: string; value: string }> = {
    'N': { label: 'N', value: values.compositionN },
    'N_T': { label: 'N(T)', value: values.compositionN_T },
    'P_T': { label: 'P(T)', value: values.compositionP_T },
    'P_WS': { label: 'P(WS)', value: values.compositionP_WS },
    'P_available': { label: 'P(available)', value: values.compositionP_available },
    'Zn': { label: 'Zn', value: values.compositionZn },
    'P_CS': { label: 'P(CS)', value: values.compositionP_CS },
    'P2O5_T': { label: 'P2O5(T)', value: values.compositionP2O5_T },
    'P2O5_WS': { label: 'P2O5(WS)', value: values.compositionP2O5_WS },
    'P2O5_CS': { label: 'P2O5(CS)', value: values.compositionP2O5_CS },
    'K': { label: 'K', value: values.compositionK },
    'K_T': { label: 'K(T)', value: values.compositionK_T },
    'K2O': { label: 'K2O', value: values.compositionK2O },
    'K2O_T': { label: 'K2O(T)', value: values.compositionK2O_T },
    'S': { label: 'S', value: values.compositionS },
    'Ca': { label: 'Ca', value: values.compositionCa },
  };

  const parts: string[] = [];
  for (const flag of displayFlags) {
    const item = labelMap[flag];
    if (item && item.value.trim()) {
      parts.push(`${item.label}: ${formatPercent(item.value)}`);
    }
  }

  const structured = parts.join('    ');
  return values.composition.trim() ? `${structured}\n${values.composition}` : structured;
}

function formatPercent(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '___%';
  return trimmed.includes('%') ? trimmed : `${trimmed}%`;
}

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
}
