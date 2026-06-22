import type { CropProtectionCrop, CropProtectionItem, LanguageCode } from './cropProtectionService';
import { advisoryText } from './cropProtectionService';

export async function downloadAdvisoryPdf(
  crop: CropProtectionCrop,
  item: CropProtectionItem,
  language: LanguageCode
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = 'Crop Protection Advisory';
  const body = advisoryText(crop, item, language);
  doc.setProperties({ title, creator: 'Tiryani Agriculture Portal' });
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(title, 105, 18, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(body, 170);
  doc.text(lines, 20, 32);
  doc.setFont('times', 'bold');
  doc.text('Credit: Agriculture Department', 20, 282);
  doc.save(`${crop.crop_key}_${item.category}_advisory.pdf`);
}
