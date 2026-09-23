import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { CropProtectionCrop, CropProtectionItem, LanguageCode } from '../../services/cropProtectionService';
import { downloadAdvisoryPdf } from '../../services/pdfAdvisoryService';
import { useDocumentAction } from '../../hooks/useDocumentAction';

export function AdvisoryPDF({
  crop,
  item,
  language,
}: {
  crop: CropProtectionCrop;
  item: CropProtectionItem;
  language: LanguageCode;
}) {
  const { busy, run } = useDocumentAction();
  return (
    <button type="button" disabled={busy} onClick={() => run(() => downloadAdvisoryPdf(crop, item, language))} className="action-button">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} {busy ? 'Generating…' : 'Download PDF'}
    </button>
  );
}
