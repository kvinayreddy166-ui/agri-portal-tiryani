import type { jsPDF as JsPdfInstance } from 'jspdf';

export type FertilizerStatutoryFormType = 'J' | 'K' | 'P';

export type FertilizerPdfValues = {
  no: string;
  dealerNameAddress: string;
  authorizationNumber: string;
  samplingDate: string;
  markings: string;
  fertilizerTypeGrade: string;
  dealerManufacturerImporterName: string;
  batchDetails: string;
  composition: string;
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
};

export const FERTILIZER_TO_ADDRESS_OPTIONS = [
  {
    id: 'ada-coding-centre',
    label: 'Assistant Director of Agriculture, Fertilizer Coding Centre',
    value: 'Assistant Director of Agriculture,\nFertilizer Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad.',
  },
  {
    id: 'designated-authority-jda',
    label: 'The Designated Authority, JDA Soil Correlator',
    value:
      'The Designated Authority,\nJDA Soil Correlator,\nFertilizer Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad.',
  },
] as const;

export const initialFertilizerPdfValues: FertilizerPdfValues = {
  no: '',
  dealerNameAddress: '',
  authorizationNumber: '',
  samplingDate: '',
  markings: '',
  fertilizerTypeGrade: '',
  dealerManufacturerImporterName: '',
  batchDetails: '',
  composition: '',
  stockReceiptDate: '',
  sampleCode: '',
  stockPosition: '',
  physicalCondition: '',
  bagSource: '',
  inspectorNameAddress: '',
  dealerReceipt: '',
  fromAddress: '',
  toAddress: FERTILIZER_TO_ADDRESS_OPTIONS[0].value,
  forwardReportAddress: '',
  nameGrade: '',
  codeNumber: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
};

export const fertilizerFormTitles: Record<FertilizerStatutoryFormType, string> = {
  J: 'FORM J',
  K: 'FORM K',
  P: 'FORM P',
};

const CERTIFICATION_TEXT =
  'Certified that the sample of fertilizer has been drawn in accordance with the procedure laid down in the Fertilizer (Control) Order, 1985 from the stock in my possession, and I have signed the test samples at the time of wax sealing. I have also received one test sample out of the three test samples prepared.';

export async function generateFertilizerStatutoryPdf(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setProperties({
    title: `${fertilizerFormTitles[formType]} - Fertilizer Sampling`,
    subject: 'Statutory fertilizer sampling form',
    creator: 'Tiryani Agriculture Portal',
  });

  drawForm(doc, formType, values);
  return doc;
}

export async function createFertilizerPdfBlobUrl(
  formType: FertilizerStatutoryFormType,
  values: FertilizerPdfValues
) {
  const doc = await generateFertilizerStatutoryPdf(formType, values);
  return URL.createObjectURL(doc.output('blob'));
}

export function getFertilizerPdfFileName(formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  const no = values.no.trim() ? `-${sanitizeFilePart(values.no)}` : '';
  return `${fertilizerFormTitles[formType].replace(/\s+/g, '-')}${no}.pdf`;
}

function drawForm(doc: JsPdfInstance, formType: FertilizerStatutoryFormType, values: FertilizerPdfValues) {
  const marginX = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setLineHeightFactor(1.15);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(`FORM \u2018${formType}\u2019`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text(getClauseReference(formType), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(11);
  doc.text(formType === 'J' ? `No: ${values.no || ''}` : `No. ${values.no || ''}`, marginX, y);
  y += 8;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  const headingLines = doc.splitTextToSize(getHeading(formType), pageWidth - marginX * 2);
  doc.text(headingLines, pageWidth / 2, y, { align: 'center' });
  y += headingLines.length * 5.2 + 6;

  if (formType === 'J') drawFormJ(doc, values, marginX, y, pageWidth);
  if (formType === 'K') drawFormK(doc, values, marginX, y, pageWidth);
  if (formType === 'P') drawFormP(doc, values, marginX, y, pageWidth);
}

function drawFormK(doc: JsPdfInstance, values: FertilizerPdfValues, marginX: number, startY: number, pageWidth: number) {
  let y = startY;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);

  doc.text('From', marginX, y);
  y += 6;
  y = drawAddressOrBlanks(doc, values.fromAddress, marginX + 8, y, 4);
  y += 4;

  doc.text('To', marginX, y);
  y += 6;
  y = drawMultiline(doc, values.toAddress, marginX + 8, y, pageWidth - marginX * 2 - 8, 5);
  y += 6;

  doc.text('1) The fertilizer samples as per details given below are sent for analysis: -', marginX, y);
  y += 6;
  y = drawColonField(doc, 'a. Type of the fertilizer &Grade', values.fertilizerTypeGrade, marginX + 6, y, 63);
  y = drawColonField(doc, 'b. Date of sampling', formatFieldValue(values.samplingDate), marginX + 6, y, 63);
  y = drawColonField(doc, 'c. Physical condition of fertilizer', values.physicalCondition, marginX + 6, y, 63);
  y = drawColonField(doc, 'd. Code number of Sample', values.sampleCode, marginX + 6, y, 63);
  y += 4;

  doc.text('2) The analysis report may please be forwarded to the undersigned', marginX, y);
  y += 7;
  drawAddressOrBlanks(doc, values.forwardReportAddress, marginX + 8, y, 4);

  doc.text(`Place: ${values.place || ''}`, marginX, 246);
  doc.text(`Date: ${formatDate(values.date) || ''}`, marginX, 254);
  doc.setFont('times', 'bold');
  doc.text(['Signature and metallic seal', 'Impression of Fertilizer Inspector'], pageWidth - marginX, 260, {
    align: 'right',
  });
}

function drawFormP(doc: JsPdfInstance, values: FertilizerPdfValues, marginX: number, startY: number, pageWidth: number) {
  let y = startY + 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(11.5);

  y = drawColonField(doc, '1. Name and Grade of Fertilizer', values.nameGrade, marginX, y, 68);
  y = drawColonField(doc, '2. Composition', values.composition, marginX, y, 68);
  y = drawColonField(doc, '3. Physical Condition of Fertilizer', values.physicalCondition, marginX, y, 68);
  y = drawColonField(doc, '4. Code Number', values.codeNumber, marginX, y, 68);
  y = drawColonField(doc, '5. Date of sampling', formatFieldValue(values.samplingDate), marginX, y, 68);
  doc.text('6. Name& Address of Fertilizer :', marginX, y);
  y += 6;
  doc.text('Inspector drawing sample', marginX + 6, y);
  y += 6;
  drawMultiline(doc, values.inspectorNameAddress, marginX + 8, y, pageWidth - marginX * 2 - 8, 5);

  doc.setFont('times', 'bold');
  doc.text(['Signature and Metallic Seal', 'Impression of Fertilizer Inspector'], pageWidth - marginX, 246, {
    align: 'right',
  });
}

function drawFormJ(doc: JsPdfInstance, values: FertilizerPdfValues, marginX: number, startY: number, pageWidth: number) {
  let y = startY;
  doc.setFont('times', 'normal');
  doc.setFontSize(9.8);

  y = drawColonField(doc, '(1) Name and address of dealer/manufacturer/importer', values.dealerNameAddress, marginX, y, 84, 4.5);
  y = drawColonField(doc, '(1A) Letter of authorization Number', values.authorizationNumber, marginX, y, 84, 4.5);
  y = drawColonField(doc, '(2) Date of sampling', formatFieldValue(values.samplingDate), marginX, y, 84, 4.5);

  doc.text('(3) Details of markings on the bags from where sample has been taken', marginX, y);
  y += 4.8;
  if (values.markings.trim()) {
    y = drawMultiline(doc, values.markings, marginX + 6, y, pageWidth - marginX * 2 - 6, 4.5);
  }

  y = drawColonField(doc, 'a) Type and grade of fertilizer', values.fertilizerTypeGrade, marginX + 6, y, 78, 4.5);
  y = drawColonField(doc, 'b) Name of dealer/manufacturer/importer', values.dealerManufacturerImporterName, marginX + 6, y, 78, 4.5);
  y = drawColonField(
    doc,
    'c) Batch No. (if applicable) and date of manufacture/import',
    values.batchDetails,
    marginX + 6,
    y,
    78,
    4.5
  );
  y = drawColonField(doc, 'd) Composition of Fertilizer', values.composition, marginX + 6, y, 78, 4.5);
  y = drawColonField(
    doc,
    '(4) Date of receipt of the stock by the dealer/manufacturer /importer/pool handling Agency',
    formatFieldValue(values.stockReceiptDate),
    marginX,
    y,
    108,
    4.5
  );
  y = drawColonField(doc, '(5) Code no. of sample', values.sampleCode, marginX, y, 84, 4.5);
  y = drawColonField(doc, '(6) Stock position of the lot', values.stockPosition, marginX, y, 84, 4.5);
  y = drawColonField(doc, '(7) Physical condition of fertilizer', values.physicalCondition, marginX, y, 84, 4.5);
  y = drawColonField(doc, '(8) Whether samples drawn from open bags/stitched bags/bulk', values.bagSource, marginX, y, 94, 4.5);
  y = drawColonField(
    doc,
    '(9) Name and Address of Fertilizer Inspector drawing sample',
    values.inspectorNameAddress,
    marginX,
    y,
    94,
    4.5
  );

  doc.setFont('times', 'bold');
  doc.text(['Signature &Metallic Seal', 'Impression of Fertilizer inspector'], pageWidth - marginX, 174, {
    align: 'right',
  });

  doc.setFont('times', 'normal');
  doc.text('Receipt of the dealer', marginX, 190);
  doc.text(doc.splitTextToSize(CERTIFICATION_TEXT, pageWidth - marginX * 2), marginX, 198);
  doc.setFont('times', 'bold');
  doc.text(['Signature and Seal', 'of Fertilizer Inspector'], marginX + 46, 258, { align: 'center' });
  doc.text('Signature of dealer', pageWidth - marginX - 22, 258, { align: 'center' });
}

function getClauseReference(formType: FertilizerStatutoryFormType) {
  if (formType === 'J') return '[ See clause 28 (1) (b) and 28 (1) (bb)]';
  if (formType === 'K') return '[ See clause 30 (1)]';
  return '[See Clause 28 (1) (b)]';
}

function getHeading(formType: FertilizerStatutoryFormType) {
  if (formType === 'J') {
    return 'FORM INDICATING PARTICULARS OF FERTILIZERS /ORGANIC FERTILIZERS/\nBIO-FERTILIZERS SAMPLED';
  }
  if (formType === 'K') {
    return 'MEMORANDUM TO ACCOMPANY FERTILISER /ORGANIC\nFERTILISER/BIO-FERTILISER SAMPLE FOR ANALYSIS.';
  }
  return 'PARTICULARS OF SAMPLES DRAWN';
}

function drawColonField(
  doc: JsPdfInstance,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth: number,
  lineHeight = 5
) {
  const valueX = x + labelWidth;
  const usableWidth = doc.internal.pageSize.getWidth() - valueX - 18;
  const lines = doc.splitTextToSize(formatFieldValue(value) || '', usableWidth);
  doc.text(`${label} :`, x, y);
  if (lines.length) {
    doc.text(lines, valueX, y);
    return y + Math.max(lines.length * lineHeight, lineHeight + 1);
  }
  doc.text('____________________________', valueX, y);
  return y + lineHeight + 1;
}

function drawAddressOrBlanks(doc: JsPdfInstance, value: string, x: number, y: number, rows: number) {
  if (value.trim()) return drawMultiline(doc, value, x, y, 85, 5);
  for (let i = 0; i < rows; i += 1) {
    doc.text('______________________', x, y + i * 6);
  }
  return y + rows * 6;
}

function drawMultiline(doc: JsPdfInstance, value: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(formatFieldValue(value), maxWidth);
  doc.text(lines.length ? lines : [''], x, y);
  return y + Math.max(lines.length, 1) * lineHeight;
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

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
}
