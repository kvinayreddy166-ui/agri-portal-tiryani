import type { jsPDF as JsPdfInstance } from 'jspdf';
import type { FertilizerFormEntry } from '../data/fertilizerForms';

export type FertilizerFormPdfValues = {
  officerName: string;
  designation: string;
  officeAddress: string;
  dealerName: string;
  dealerAddress: string;
  premisesLocation: string;
  authorizationNumber: string;
  fertilizerTypeGrade: string;
  manufacturerName: string;
  batchDetails: string;
  composition: string;
  sampleCode: string;
  date: string;
  place: string;
  remarks: string;
};

export const initialFertilizerFormPdfValues: FertilizerFormPdfValues = {
  officerName: '',
  designation: '',
  officeAddress: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  authorizationNumber: '',
  fertilizerTypeGrade: '',
  manufacturerName: '',
  batchDetails: '',
  composition: '',
  sampleCode: '',
  date: new Date().toISOString().slice(0, 10),
  place: '',
  remarks: '',
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
const BODY_SIZE = 12.5;
const TITLE_SIZE = 16;
const ROW_LINE_HEIGHT = 6;
const ROW_GAP = 2;

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generateFertilizerFormPdf(
  form: FertilizerFormEntry,
  values: FertilizerFormPdfValues
) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, `${form.formNo} - ${form.title}`);
  
  drawFormHeader(doc, form);
  drawFormContent(doc, form, values);
  
  return doc;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title,
    subject: 'FCO Fertilizer Form',
    creator: 'Tiryani Agriculture Portal',
  });
  return doc;
}

function drawFormHeader(doc: JsPdfInstance, form: FertilizerFormEntry) {
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(form.formNo, PAGE.width / 2, PAGE.top, { align: 'center' });
  
  doc.setFontSize(BODY_SIZE);
  doc.setFont(PDF_FONT, 'normal');
  const titleLines = doc.splitTextToSize(form.title, PAGE.contentWidth);
  doc.text(titleLines, PAGE.width / 2, PAGE.top + 8, { align: 'center' });
  
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`[See ${form.clause || 'FCO 1985'}]`, PAGE.width / 2, PAGE.top + 8 + titleLines.length * 5 + 3, { align: 'center' });
  doc.setFont(PDF_FONT, 'normal');
}

function drawFormContent(doc: JsPdfInstance, form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  const cursor = {
    doc,
    y: PAGE.top + 30,
    contentWidth: PAGE.width - PAGE.marginX * 2,
  };

  // Form-specific content based on form type
  if (form.formNo === 'Form A' || form.formNo === 'Form A1' || form.formNo === 'Form A2') {
    drawRegistrationFormContent(cursor, form, values);
  } else if (form.formNo === 'Form B' || form.formNo === 'Form C') {
    drawCertificateFormContent(cursor, form, values);
  } else if (form.formNo === 'Form D' || form.formNo === 'Form E') {
    drawManufacturingApplicationContent(cursor, form, values);
  } else if (form.formNo === 'Form F' || form.formNo === 'Form G') {
    drawManufacturingCertificateContent(cursor, form, values);
  } else if (form.formNo === 'Form H' || form.formNo === 'Form I') {
    drawNonStandardFormContent(cursor, form, values);
  } else if (form.formNo.startsWith('Form J') || form.formNo.startsWith('Form K') || form.formNo.startsWith('Form L')) {
    drawSamplingFormContent(cursor, form, values);
  } else if (form.formNo === 'Form M' || form.formNo === 'Form N' || form.formNo === 'Form O' || form.formNo === 'Form P') {
    drawBusinessRecordFormContent(cursor, form, values);
  } else {
    drawGenericFormContent(cursor, form, values);
  }
}

function drawRegistrationFormContent(cursor: PdfCursor, _form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, '1. Name of Dealer/Applicant', values.dealerName, 70);
  field(cursor, '2. Address', values.dealerAddress, 70);
  field(cursor, '3. Premises Location', values.premisesLocation, 70);
  field(cursor, '4. Authorization Number', values.authorizationNumber, 70);
  field(cursor, '5. Type and Grade of Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, '6. Name of Manufacturer', values.manufacturerName, 70);
  field(cursor, '7. Date', formatDate(values.date), 70);
  field(cursor, '8. Place', values.place, 70);
  
  drawSignatureBlock(cursor, 'Signature of Applicant', 'Signature of Officer');
}

function drawCertificateFormContent(cursor: PdfCursor, form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, 'Certificate No.', values.authorizationNumber, 70);
  field(cursor, 'Name of Dealer', values.dealerName, 70);
  field(cursor, 'Address', values.dealerAddress, 70);
  field(cursor, 'Premises Location', values.premisesLocation, 70);
  field(cursor, 'Type and Grade of Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, 'Valid Upto', form.formNo === 'Form C' ? formatDate(values.date) : '_________', 70);
  
  drawSignatureBlock(cursor, 'Signature of Authority', 'Date');
}

function drawManufacturingApplicationContent(cursor: PdfCursor, _form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, '1. Name of Manufacturer', values.manufacturerName, 70);
  field(cursor, '2. Address', values.dealerAddress, 70);
  field(cursor, '3. Premises Location', values.premisesLocation, 70);
  field(cursor, '4. Type of Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, '5. Composition', values.composition, 70);
  field(cursor, '6. Batch Details', values.batchDetails, 70);
  field(cursor, '7. Date', formatDate(values.date), 70);
  
  drawSignatureBlock(cursor, 'Signature of Applicant', 'For Officer Use');
}

function drawManufacturingCertificateContent(cursor: PdfCursor, _form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, 'Certificate No.', values.authorizationNumber, 70);
  field(cursor, 'Name of Manufacturer', values.manufacturerName, 70);
  field(cursor, 'Address', values.dealerAddress, 70);
  field(cursor, 'Type of Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, 'Composition', values.composition, 70);
  field(cursor, 'Date of Issue', formatDate(values.date), 70);
  
  drawSignatureBlock(cursor, 'Signature of Authority', 'Date');
}

function drawNonStandardFormContent(cursor: PdfCursor, _form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, '1. Name of Dealer', values.dealerName, 70);
  field(cursor, '2. Address', values.dealerAddress, 70);
  field(cursor, '3. Premises Location', values.premisesLocation, 70);
  field(cursor, '4. Type of Non-Standard Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, '5. Composition', values.composition, 70);
  field(cursor, '6. Batch No.', values.batchDetails, 70);
  field(cursor, '7. Reason for Non-Standard', values.remarks || '_________', 70);
  
  drawSignatureBlock(cursor, 'Signature of Dealer', 'Officer Recommendation');
}

function drawSamplingFormContent(cursor: PdfCursor, form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, '1. Code No. of Sample', values.sampleCode, 70);
  field(cursor, '2. Name of Inspector', values.officerName, 70);
  field(cursor, '3. Designation', values.designation, 70);
  field(cursor, '4. Type and Grade of Fertilizer', values.fertilizerTypeGrade, 70);
  field(cursor, '5. Name of Dealer/Manufacturer', values.dealerName, 70);
  field(cursor, '6. Address', values.dealerAddress, 70);
  field(cursor, '7. Batch Details', values.batchDetails, 70);
  field(cursor, '8. Date of Sampling', formatDate(values.date), 70);
  field(cursor, '9. Place', values.place, 70);
  
  if (form.formNo.startsWith('Form L')) {
    field(cursor, '10. Analysis Result', values.remarks || 'Pending', 70);
  }
  
  drawSignatureBlock(cursor, 'Signature of Inspector', 'Signature of Dealer/Lab');
}

function drawBusinessRecordFormContent(cursor: PdfCursor, form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  if (form.formNo === 'Form M') {
    field(cursor, '1. Cash/Credit Memo No.', values.sampleCode, 70);
    field(cursor, '2. Date', formatDate(values.date), 70);
    field(cursor, '3. Name of Buyer', values.dealerName, 70);
    field(cursor, '4. Type and Grade of Fertilizer', values.fertilizerTypeGrade, 70);
    field(cursor, '5. Quantity', values.batchDetails, 70);
    field(cursor, '6. Amount', values.remarks || '_________', 70);
  } else if (form.formNo === 'Form N') {
    field(cursor, '1. Stock Register Entry', values.sampleCode, 70);
    field(cursor, '2. Date', formatDate(values.date), 70);
    field(cursor, '3. Type and Grade', values.fertilizerTypeGrade, 70);
    field(cursor, '4. Quantity Received', values.batchDetails, 70);
    field(cursor, '5. Quantity Issued', values.remarks || '_________', 70);
  } else if (form.formNo === 'Form O') {
    field(cursor, '1. Certificate of Source No.', values.authorizationNumber, 70);
    field(cursor, '2. Name of Supplier', values.manufacturerName, 70);
    field(cursor, '3. Address', values.dealerAddress, 70);
    field(cursor, '4. Type of Fertilizer', values.fertilizerTypeGrade, 70);
    field(cursor, '5. Quantity', values.batchDetails, 70);
  } else if (form.formNo === 'Form P') {
    field(cursor, '1. Sample Code', values.sampleCode, 70);
    field(cursor, '2. Date of Drawing', formatDate(values.date), 70);
    field(cursor, '3. Name of Inspector', values.officerName, 70);
    field(cursor, '4. Type and Grade', values.fertilizerTypeGrade, 70);
    field(cursor, '5. Name of Dealer', values.dealerName, 70);
    field(cursor, '6. Address', values.dealerAddress, 70);
  }
  
  drawSignatureBlock(cursor, 'Signature', 'Date');
}

function drawGenericFormContent(cursor: PdfCursor, _form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  field(cursor, '1. Name', values.dealerName, 70);
  field(cursor, '2. Address', values.dealerAddress, 70);
  field(cursor, '3. Type/Grade', values.fertilizerTypeGrade, 70);
  field(cursor, '4. Details', values.remarks || '_________', 70);
  field(cursor, '5. Date', formatDate(values.date), 70);
  field(cursor, '6. Place', values.place, 70);
  
  drawSignatureBlock(cursor, 'Signature', 'Date');
}

function field(cursor: PdfCursor, label: string, value: string, labelWidth: number) {
  const { doc } = cursor;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);

  const colonX = PAGE.marginX + labelWidth;
  const valueX = colonX + 4;
  const availableValueWidth = PAGE.width - PAGE.marginX - valueX;
  const labelLines = doc.splitTextToSize(label, Math.max(labelWidth - 3, 35));
  const valueLines = doc.splitTextToSize(value || '________________', availableValueWidth);
  const rowHeight = Math.max(labelLines.length, valueLines.length) * ROW_LINE_HEIGHT + ROW_GAP;

  if (cursor.y + rowHeight > PAGE.bottom) {
    doc.addPage();
    cursor.y = PAGE.top;
  }

  doc.text(labelLines, PAGE.marginX, cursor.y);
  doc.text(':', colonX, cursor.y);
  doc.text(valueLines, valueX, cursor.y);
  cursor.y += rowHeight;
}

function drawSignatureBlock(cursor: PdfCursor, leftLabel: string, rightLabel: string) {
  const { doc } = cursor;
  cursor.y += 10;
  
  if (cursor.y + 30 > PAGE.bottom) {
    doc.addPage();
    cursor.y = PAGE.top;
  }

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(BODY_SIZE);
  doc.text(leftLabel, PAGE.marginX + 30, cursor.y + 20, { align: 'center' });
  doc.text(rightLabel, PAGE.width - PAGE.marginX - 30, cursor.y + 20, { align: 'center' });
  doc.setFont(PDF_FONT, 'normal');
  
  cursor.y += 30;
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getFertilizerFormPdfFileName(form: FertilizerFormEntry, values: FertilizerFormPdfValues) {
  const safeName = (values.dealerName || values.sampleCode || 'form').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 30);
  return `${safeName}_${form.formNo.replace(/\s+/g, '_')}.pdf`;
}
