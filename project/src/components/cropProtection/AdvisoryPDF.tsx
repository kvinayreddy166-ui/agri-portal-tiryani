import React from 'react';
import { Download } from 'lucide-react';
import type { CropProtectionCrop, CropProtectionItem, LanguageCode } from '../../services/cropProtectionService';
import { downloadAdvisoryPdf } from '../../services/pdfAdvisoryService';

export function AdvisoryPDF({
  crop,
  item,
  language,
}: {
  crop: CropProtectionCrop;
  item: CropProtectionItem;
  language: LanguageCode;
}) {
  return (
    <button type="button" onClick={() => downloadAdvisoryPdf(crop, item, language)} className="action-button">
      <Download className="h-4 w-4" /> Download PDF
    </button>
  );
}
