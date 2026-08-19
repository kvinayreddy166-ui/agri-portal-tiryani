import type { jsPDF as JsPdfInstance } from 'jspdf';
import { addGovernmentEmblemWatermark } from './pdfWatermark';

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
  fertilizerCategory: string;
  fertilizerTypeGrade: string;
  manualFertilizerTypeGrade: string;
  microNutrientTypeGrade: string;
  manualMicroNutrientTypeGrade: string;
  waterSolubleTypeGrade: string;
  manualWaterSolubleTypeGrade: string;
  dealerManufacturerImporterName: string;
  manualDealerManufacturerImporterName: string;
  batchDetails: string;
  composition: string;
  compositionN: string;
  compositionN_T: string;
  compositionN_NO3: string;
  compositionN_NH4: string;
  compositionN_Urea: string;
  compositionP: string;
  compositionP_T: string;
  compositionP_WS: string;
  compositionP_available: string;
  compositionP_available_as_P2O5: string;
  compositionP_CS: string;
  compositionP2O5: string;
  compositionP2O5_T: string;
  compositionP2O5_WS: string;
  compositionP2O5_CS: string;
  compositionK: string;
  compositionK_T: string;
  compositionK_WS: string;
  compositionK_CS: string;
  compositionK2O: string;
  compositionK2O_T: string;
  compositionS: string;
  compositionCa: string;
  compositionMg: string;
  compositionMgO: string;
  compositionZn: string;
  compositionFe: string;
  compositionMn: string;
  compositionB: string;
  compositionCu: string;
  compositionZn_EDTA: string;
  compositionFe_EDTA: string;
  compositionMo: string;
  compositionCd: string;
  microZn: string;
  microCu: string;
  microS: string;
  microMn: string;
  microMg: string;
  microB: string;
  microFe: string;
  microMo: string;
  microZn_EDTA: string;
  microFe_EDTA: string;
  microMn_EDTA: string;
  microCd: string;
  microCl: string;
  microNi: string;
  microSi: string;
  microCo: string;
  microNutrientCheckboxes: string;
  waterSolubleCheckboxes: string;
  stockReceiptDate: string;
  sampleCode: string;
  stockPosition: string;
  wholesalerSource: string;
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
  placeOfCollection: string;
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
  pinCode: string;
  // LETTER DETAILS
  financialYear: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  officerPhone: string;
};

export const FERTILIZER_K_ADDRESS_OPTIONS = {
  K_ADA: {
    label: 'Form K (ADA)',
    value: 'The Assistant Director of Agriculture,\nFertilizer Coding Centre,\nSAMETI Complex,\nOld Malakpet,\nHyderabad -500036.',
  },
  K_JDA: {
    label: 'Form K (JDA)',
    value: 'The Designated Authority,\nJDA Soil Correlator,\nFertilizer Coding Centre,\nSAMETI Complex,\nOld Malakpet,\nHyderabad -500036.',
  },
} as const;

export const initialFertilizerPdfValues: FertilizerPdfValues = {
  no: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  dealerNameAddress: '',
  authorizationNumber: '',
  samplingDate: new Date().toISOString().slice(0, 10),
  markings: '',
  fertilizerCategory: '',
  fertilizerTypeGrade: '',
  manualFertilizerTypeGrade: '',
  microNutrientTypeGrade: '',
  manualMicroNutrientTypeGrade: '',
  waterSolubleTypeGrade: '',
  manualWaterSolubleTypeGrade: '',
  dealerManufacturerImporterName: '',
  manualDealerManufacturerImporterName: '',
  batchDetails: '',
  compositionN_NO3: '',
  compositionN_NH4: '',
  compositionN_Urea: '',
  composition: '',
  compositionN: '',
  compositionN_T: '',
  compositionP: '',
  compositionP_T: '',
  compositionP_WS: '',
  compositionP_available: '',
  compositionP_available_as_P2O5: '',
  compositionP_CS: '',
  compositionP2O5: '',
  compositionP2O5_T: '',
  compositionP2O5_WS: '',
  compositionP2O5_CS: '',
  compositionK: '',
  compositionK_T: '',
  compositionK_WS: '',
  compositionK_CS: '',
  compositionK2O: '',
  compositionK2O_T: '',
  compositionS: '',
  compositionCa: '',
  compositionMg: '',
  compositionMgO: '',
  compositionZn: '',
  compositionFe: '',
  compositionMn: '',
  compositionB: '',
  compositionCu: '',
  compositionZn_EDTA: '',
  compositionFe_EDTA: '',
  compositionMo: '',
  compositionCd: '',
  microZn: '',
  microCu: '',
  microS: '',
  microMn: '',
  microMg: '',
  microB: '',
  microFe: '',
  microMo: '',
  microZn_EDTA: '',
  microFe_EDTA: '',
  microMn_EDTA: '',
  microCd: '',
  microCl: '',
  microNi: '',
  microSi: '',
  microCo: '',
  microNutrientCheckboxes: '',
  waterSolubleCheckboxes: '',
  stockReceiptDate: '',
  sampleCode: '',
  stockPosition: '',
  wholesalerSource: '',
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
  placeOfCollection: '',
  date: new Date().toISOString().slice(0, 10),
  officerName: '',
  designation: '',
  officeAddress: '',
  compositionDisplayFlags: '',
  qualification: '',
  manualQualification: '',
  district: '',
  mandal: '',
  manualDistrict: '',
  manualMandal: '',
  pinCode: '',
  // LETTER DETAILS
  financialYear: calculateFinancialYear(),
  letterNumber: '',
  letterDate: new Date().toISOString().slice(0, 10),
  authorityType: 'DAO',
  memoNumber: '',
  memoDate: '',
  division: '',
  officerPhone: '',
};

function calculateFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January)
  // Financial year starts on April 1st
  // If month is Jan-Mar (0-2), financial year is previous year - current year
  // If month is Apr-Dec (3-11), financial year is current year - next year
  if (month < 3) {
    return `${year - 1}-${String(year).slice(-2)}`;
  } else {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
}

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
  top: 17,
  bottom: 284,
  width: 210,
  height: 297,
};

const PDF_FONT = 'times';
const BODY_SIZE = 12;
const TITLE_SIZE = 14;
const ROW_LINE_HEIGHT = 5.9;
const ROW_GAP = 1.7;
const PARA_LINE_HEIGHT = 6.1;
const FORM_J_SIGNATURE_GAP = 0;
const FORM_J_INSPECTOR_SIGNATURE_GAP = 19;
const FORM_J_PRE_RECEIPT_SIGNATURE_LIFT = 14;
const FORM_J_RECEIPT_DOWN_SHIFT = 86;
const FORM_J_SIGNATURE_BOTTOM_CLEARANCE = 19;
const SIGNATURE_RIGHT_X = PAGE.width - PAGE.marginX - 8;

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateFertilizerStatutoryPdf(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues,
  watermarkEnabled: boolean = false
) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, `${fertilizerFormTitles[formType]} - Fertilizer Sampling`);

  await drawWatermark(doc);

  if (formType === 'P') {
    drawForm(doc, 'P', values);
    doc.addPage();
    await drawWatermark(doc);
    drawForm(doc, 'P', values);
  } else {
    drawForm(doc, formType, values);
  }

  return doc;
}

export async function generateAllFertilizerStatutoryPdf(values: FertilizerPdfValues, watermarkEnabled: boolean = false) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, 'FORM J K P - Fertilizer Sampling');

  await drawWatermark(doc);
  drawForm(doc, 'J', values);
  doc.addPage();
  await drawWatermark(doc);
  drawForm(doc, 'K_ADA', values);
  doc.addPage();
  await drawWatermark(doc);
  drawForm(doc, 'K_JDA', values);
  doc.addPage();
  await drawWatermark(doc);
  drawForm(doc, 'P', values);
  doc.addPage();
  await drawWatermark(doc);
  drawForm(doc, 'P', values);
  return doc;
}

export async function createFertilizerPdfBlobUrl(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues,
  watermarkEnabled: boolean = false
) {
  const doc = await generateFertilizerStatutoryPdf(formType, values, watermarkEnabled);
  return URL.createObjectURL(doc.output('blob'));
}

export async function createAllFertilizerPdfBlobUrl(values: FertilizerPdfValues, watermarkEnabled: boolean = false) {
  const doc = await generateAllFertilizerStatutoryPdf(values, watermarkEnabled);
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
    creator: 'AGRONIX',
  });
  return doc;
}

function drawForm(doc: JsPdfInstance, formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  const cursor = resetPage(doc);

  if (formType === 'J') cursor.y -= 2;

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

  doc.setFont(PDF_FONT, 'italic');
  doc.setFontSize(BODY_SIZE);
  doc.text(getClauseReference(formType), PAGE.width / 2, cursor.y, { align: 'center' });
  cursor.y += 9;

  doc.setFont(PDF_FONT, 'bold');
  const label = displayType === 'J' ? 'No: ' : 'No. ';
  doc.text(label, PAGE.marginX, cursor.y);
  const labelWidth = doc.getTextWidth(label);
  doc.setFont(PDF_FONT, 'bolditalic');
  doc.text(values.no || '', PAGE.marginX + labelWidth, cursor.y);
  doc.setFont(PDF_FONT, 'normal');
  cursor.y += 8;

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(13);
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
  doc.setFontSize(BODY_SIZE);
}

function buildFormJDealerAddress(values: FertilizerPdfValues): string {
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  
  const addressParts = [values.dealerName, values.dealerAddress]
    .map((part) => part.trim())
    .filter(Boolean);
  
  // Use placeOfCollection for Mandal value when ADA is selected (Form J specific)
  const isADA = values.designation === 'Asst. Director of Agriculture';
  const mandalValue = isADA && values.placeOfCollection ? values.placeOfCollection : resolvedMandal;
  if (mandalValue) addressParts.push(`Mandal: ${mandalValue}`);
  if (resolvedDistrict) addressParts.push(`District: ${resolvedDistrict}`);
  
  return addressParts.join('\n');
}

function drawFormJ(cursor: PdfCursor, values: FertilizerPdfValues) {
  const fieldOptions = { lineHeight: 5.25, gap: 0.85, noPageBreak: true };

  field(cursor, '(1) Name and Address of Dealer/Manufacturer/Importer', buildFormJDealerAddress(values), 91, PAGE.marginX, fieldOptions);
  field(cursor, '(1A) Letter of Authorization No.', values.authorizationNumber, 91, PAGE.marginX, fieldOptions);
  field(cursor, '(2) Date of Sampling', formatFieldValue(values.samplingDate), 91, PAGE.marginX, fieldOptions);

  paragraph(cursor, '(3) Details of markings on the bags from where sample has been taken');
  if (values.markings.trim()) paragraph(cursor, values.markings, PAGE.marginX + 6, cursor.contentWidth - 6, 5, true);
  field(cursor, 'a) Type and Grade of Fertilizer', resolveFertilizerTypeGrade(values), 85, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'b) Name of Dealer/Manufacturer/Importer', resolveDealerManufacturerImporterName(values), 85, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'c) Batch No. and Date of Manufacture/Import', values.batchDetails, 85, PAGE.marginX + 6, fieldOptions);
  field(cursor, 'd) Composition of Fertilizer', formatComposition(values), 85, PAGE.marginX + 6, fieldOptions);

  const stockReceiptDisplay = values.wholesalerSource?.trim()
    ? `${formatFieldValue(values.stockReceiptDate)}\n${values.wholesalerSource.trim()}`
    : formatFieldValue(values.stockReceiptDate);
  field(cursor, '(4) Date of Receipt of Stock by Dealer/Manufacturer/Importer/Pool Handling Agency', stockReceiptDisplay, 91, PAGE.marginX, fieldOptions);
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
  cursor.y += 87;
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

function formatAddressWithCommas(address: string): string {
  if (!address || !address.trim()) return address;
  const lines = address.split('\n').filter(line => line.trim());
  const formatted = lines.map((line, index) => {
    if (index === lines.length - 1) {
      return line.trim() + '.';
    }
    return line.trim() + ',';
  });
  return formatted.join('\n');
}

function drawFormK(cursor: PdfCursor, formType: 'K_ADA' | 'K_JDA', values: FertilizerPdfValues) {
  const { doc } = cursor;
  doc.setFont(PDF_FONT, 'normal');

  boldText(cursor, 'From:');
  const formattedFromAddress = formatAddressWithCommas(values.inspectorNameAddress);
  addressBlock(cursor, formattedFromAddress, PAGE.marginX + 10, 4, true);
  cursor.y += 3;

  boldText(cursor, 'To:');
  addressBlock(cursor, getKAddress(formType), PAGE.marginX + 10, 5, true);
  cursor.y += 5;

  paragraph(cursor, '1) The fertilizer samples as per details given below are sent for analysis: -');
  field(cursor, 'a. Name & Grade of Fertilizer', resolveFertilizerTypeGrade(values), 72, PAGE.marginX + 6);
  field(cursor, 'b. Date of Sampling', formatFieldValue(values.samplingDate), 72, PAGE.marginX + 6);
  field(cursor, 'c. Physical Condition', values.physicalCondition, 72, PAGE.marginX + 6);
  field(cursor, 'd. Code Number', values.sampleCode, 72, PAGE.marginX + 6);
  cursor.y += 2;

  paragraph(cursor, '2) The analysis report may please be forwarded to the undersigned');
  addressBlock(cursor, formattedFromAddress, PAGE.marginX + 10, 4);

  drawPlaceDateAndInspectorSignature(cursor, values, { showPlaceDate: true });
}

function drawFormP(cursor: PdfCursor, values: FertilizerPdfValues) {
  field(cursor, '1. Name and Grade of Fertilizer', resolveFertilizerTypeGrade(values), 82);
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
    // Use placeOfCollection when ADA is selected, otherwise use place
    const isADA = values.designation === 'Asst. Director of Agriculture';
    const resolvedPlace = isADA ? (values.placeOfCollection || values.place) : values.place;
    doc.text(`Place: ${resolvedPlace || '___________'}`, PAGE.marginX, cursor.y);
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
  
  // Apply hanging indent for wrapped label lines
  if (labelLines.length > 1) {
    // Draw first line at original position
    doc.text(labelLines[0], x, cursor.y);
    // Calculate indent based on first space after the number prefix (e.g., "(1) " or "6. ")
    const firstSpaceMatch = labelLines[0].match(/^\(\d+\)\s+/) || labelLines[0].match(/^\d+\.\s+/);
    const indentWidth = firstSpaceMatch ? doc.getTextWidth(firstSpaceMatch[0]) : 8;
    // Draw subsequent lines with hanging indent
    for (let i = 1; i < labelLines.length; i++) {
      doc.text(labelLines[i], x + indentWidth, cursor.y + i * lineHeight);
    }
  } else {
    doc.text(labelLines, x, cursor.y);
  }
  
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
    return 'MEMORANDUM TO ACCOMPANY FERTILIZER / ORGANIC FERTILIZER / BIO-FERTILIZER SAMPLE FOR ANALYSIS.';
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

export function resolveFertilizerTypeGrade(values: FertilizerPdfValues): string {
  if (values.fertilizerCategory === 'Micro Nutrient Fertilizers') {
    if (values.microNutrientTypeGrade === 'Other') {
      return values.manualMicroNutrientTypeGrade;
    }
    return values.microNutrientTypeGrade;
  } else if (values.fertilizerCategory === 'Water Soluble Fertilizers') {
    if (values.waterSolubleTypeGrade === 'Other') {
      return values.manualWaterSolubleTypeGrade;
    }
    return values.waterSolubleTypeGrade;
  } else {
    if (values.fertilizerTypeGrade === 'Other') {
      return values.manualFertilizerTypeGrade;
    }
    return values.fertilizerTypeGrade;
  }
}

export function resolveDealerManufacturerImporterName(values: FertilizerPdfValues): string {
  if (values.dealerManufacturerImporterName === 'Other') {
    return values.manualDealerManufacturerImporterName;
  }
  return values.dealerManufacturerImporterName;
}

function formatComposition(values: FertilizerPdfValues) {
  // Handle water soluble fertilizers
  if (values.fertilizerCategory === 'Water Soluble Fertilizers') {
    const checkedNutrients = values.waterSolubleCheckboxes.split(',').map(n => n.trim()).filter(Boolean);
    
    const waterSolubleLabelMap: Record<string, { label: string; value: string }> = {
      'N': { label: 'N', value: values.compositionN },
      'N_T': { label: 'N(T)', value: values.compositionN_T },
      'N_NO3': { label: 'N(NO3)', value: values.compositionN_NO3 },
      'N_NH4': { label: 'N(NH4)', value: values.compositionN_NH4 },
      'N_Urea': { label: 'N(Urea)', value: values.compositionN_Urea },
      'P': { label: 'P', value: values.compositionP },
      'P_T': { label: 'P(T)', value: values.compositionP_T },
      'P_WS': { label: 'P (WS)', value: values.compositionP_WS },
      'P_available': { label: 'P(available)', value: values.compositionP_available },
      'P_CS': { label: 'P(CS)', value: values.compositionP_CS },
      'P2O5_T': { label: 'P2O5(T)', value: values.compositionP2O5_T },
      'P2O5_WS': { label: 'P2O5(WS)', value: values.compositionP2O5_WS },
      'P2O5_CS': { label: 'P2O5(CS)', value: values.compositionP2O5_CS },
      'K': { label: 'K', value: values.compositionK },
      'K_T': { label: 'K(T)', value: values.compositionK_T },
      'K_WS': { label: 'K(WS)', value: values.compositionK_WS },
      'K2O': { label: 'K2O', value: values.compositionK2O },
      'K2O_T': { label: 'K2O(T)', value: values.compositionK2O_T },
      'Ca': { label: 'Ca', value: values.compositionCa },
      'Mg': { label: 'Mg', value: values.compositionMg },
      'MgO': { label: 'MgO', value: values.compositionMgO },
      'S': { label: 'S', value: values.compositionS },
      'Fe': { label: 'Fe', value: values.compositionFe },
      'Mn': { label: 'Mn', value: values.compositionMn },
      'B': { label: 'B', value: values.compositionB },
      'Cu': { label: 'Cu', value: values.compositionCu },
      'Zn': { label: 'Zn', value: values.compositionZn },
      'Zn_EDTA': { label: 'Zn-EDTA', value: values.compositionZn_EDTA },
      'Fe_EDTA': { label: 'Fe-EDTA', value: values.compositionFe_EDTA },
      'Mo': { label: 'Mo', value: values.compositionMo },
      'Cd': { label: 'Cd', value: values.compositionCd },
    };

    // Use user selection order (checkedNutrients are in the order they were selected)
    const parts: string[] = [];
    for (const nutrient of checkedNutrients) {
      const item = waterSolubleLabelMap[nutrient];
      // Skip nutrients with 0% values for water soluble fertilizers
      if (item && item.value && item.value !== '0%' && item.value !== '0') {
        parts.push(`${item.label}: ${formatPercent(item.value)}`);
      }
    }

    const structured = parts.join(', ');
    return values.composition.trim() ? `${structured}, ${values.composition}` : structured;
  }

  // Handle micro nutrient fertilizers separately
  if (values.fertilizerCategory === 'Micro Nutrient Fertilizers') {
    const checkedNutrients = values.microNutrientCheckboxes.split(',').map(n => n.trim()).filter(Boolean);
    
    const microLabelMap: Record<string, { label: string; value: string }> = {
      'Zn': { label: 'Zn', value: values.microZn },
      'Cu': { label: 'Cu', value: values.microCu },
      'S': { label: 'S', value: values.microS },
      'Mn': { label: 'Mn', value: values.microMn },
      'Mg': { label: 'Mg', value: values.microMg },
      'B': { label: 'B', value: values.microB },
      'Fe': { label: 'Fe', value: values.microFe },
      'Mo': { label: 'Mo', value: values.microMo },
      'Zn_EDTA': { label: 'Zn-EDTA', value: values.microZn_EDTA },
      'Fe_EDTA': { label: 'Fe-EDTA', value: values.microFe_EDTA },
      'Mn_EDTA': { label: 'Mn-EDTA', value: values.microMn_EDTA },
      'Cd': { label: 'Cd', value: values.microCd },
      'Cl': { label: 'Cl', value: values.microCl },
      'Ni': { label: 'Ni', value: values.microNi },
      'Si': { label: 'Si', value: values.microSi },
      'Co': { label: 'Co', value: values.microCo },
    };

    // Use user selection order (checkedNutrients are in the order they were selected)
    const parts: string[] = [];
    for (const nutrient of checkedNutrients) {
      const item = microLabelMap[nutrient];
      if (item && item.value) {
        parts.push(`${item.label}: ${formatPercent(item.value)}`);
      }
    }

    const structured = parts.join(', ');
    return values.composition.trim() ? `${structured}, ${values.composition}` : structured;
  }

  // Handle regular fertilizers
  const displayFlags = values.compositionDisplayFlags.split(',').map(f => f.trim());
  
  const labelMap: Record<string, { label: string; value: string }> = {
    'N': { label: 'N', value: values.compositionN },
    'N_T': { label: 'N(T)', value: values.compositionN_T },
    'N_NO3': { label: 'N(NO3)', value: values.compositionN_NO3 },
    'N_NH4': { label: 'N(NH4)', value: values.compositionN_NH4 },
    'N_Urea': { label: 'N(Urea)', value: values.compositionN_Urea },
    'P': { label: 'P', value: values.compositionP },
    'P_T': { label: 'P(T)', value: values.compositionP_T },
    'P_WS': { label: 'P(WS)', value: values.compositionP_WS },
    'P_available': { label: 'P(available)', value: values.compositionP_available },
    'P_available_as_P2O5': { label: 'P(Available as P2O5)', value: values.compositionP_available_as_P2O5 },
    'P_CS': { label: 'P(CS)', value: values.compositionP_CS },
    'P2O5': { label: 'P2O5', value: values.compositionP2O5 },
    'P2O5_T': { label: 'P2O5(T)', value: values.compositionP2O5_T },
    'P2O5_WS': { label: 'P2O5(WS)', value: values.compositionP2O5_WS },
    'P2O5_CS': { label: 'P2O5(CS)', value: values.compositionP2O5_CS },
    'K': { label: 'K', value: values.compositionK },
    'K_T': { label: 'K(T)', value: values.compositionK_T },
    'K_WS': { label: 'K(WS)', value: values.compositionK_WS },
    'K_CS': { label: 'K(CS)', value: values.compositionK_CS },
    'K2O': { label: 'K2O', value: values.compositionK2O },
    'K2O_T': { label: 'K2O(T)', value: values.compositionK2O_T },
    'S': { label: 'S', value: values.compositionS },
    'Ca': { label: 'Ca', value: values.compositionCa },
    'Mg': { label: 'Mg', value: values.compositionMg },
    'MgO': { label: 'MgO', value: values.compositionMgO },
    'Zn': { label: 'Zn', value: values.compositionZn },
    'Fe': { label: 'Fe', value: values.compositionFe },
    'Mn': { label: 'Mn', value: values.compositionMn },
    'B': { label: 'B', value: values.compositionB },
    'Cu': { label: 'Cu', value: values.compositionCu },
    'Zn_EDTA': { label: 'Zn-EDTA', value: values.compositionZn_EDTA },
    'Fe_EDTA': { label: 'Fe-EDTA', value: values.compositionFe_EDTA },
    'Mo': { label: 'Mo', value: values.compositionMo },
    'Cd': { label: 'Cd', value: values.compositionCd },
  };

  // Use user selection order (displayFlags are in the order they were selected)
  const parts: string[] = [];
  for (const flag of displayFlags) {
    const item = labelMap[flag];
    if (item && item.value) {
      parts.push(`${item.label}: ${formatPercent(item.value)}`);
    }
  }

  const structured = parts.join(', ');
  return values.composition.trim() ? `${structured}, ${values.composition}` : structured;
}

function formatPercent(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '___%';
  return trimmed.includes('%') ? trimmed : `${trimmed}%`;
}

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
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
        const watermarkX = (210 - watermarkWidth) / 2;
        const watermarkY = (297 - watermarkHeight) / 2;
        
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
