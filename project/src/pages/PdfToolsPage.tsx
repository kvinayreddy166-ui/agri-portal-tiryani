import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText, 
  Minimize2, 
  FileEdit, 
  Sparkles, 
  Merge,
  ScanText,
  Eye,
  Shield,
  Scissors
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PdfCompressionTool } from '../components/pdf/PdfCompressionTool';
import { PdfToDocTool } from '../components/pdf/PdfToDocTool';
import { AiDocumentEnhancer } from '../components/pdf/AiDocumentEnhancer';
import { PdfMergeTool } from '../components/pdf/PdfMergeTool';
import { PdfSplitTool } from '../components/pdf/PdfSplitTool';
import { OcrPdfTool } from '../components/pdf/OcrPdfTool';
import { PdfPreview } from '../components/pdf/PdfPreview';
import { PdfUploadBox } from '../components/pdf/PdfUploadBox';
import { cleanupObjectUrl } from '../utils/fileCleanup';

type ToolType = 
  | 'preview'
  | 'compress'
  | 'toDoc'
  | 'enhance'
  | 'merge'
  | 'split'
  | 'ocr';

const tools: Array<{
  id: ToolType;
  name: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: 'preview',
    name: 'PDF Preview',
    icon: <Eye className="h-5 w-5" />,
    description: 'View PDF files in the browser',
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    icon: <Minimize2 className="h-5 w-5" />,
    description: 'Clean metadata, optimize streams, and rebuild scanned files',
  },
  {
    id: 'toDoc',
    name: 'PDF to DOCX',
    icon: <FileEdit className="h-5 w-5" />,
    description: 'Convert PDF to editable DOCX',
  },
  {
    id: 'ocr',
    name: 'OCR Text Extraction',
    icon: <ScanText className="h-5 w-5" />,
    description: 'High-accuracy text extraction from scanned PDFs',
  },
  {
    id: 'merge',
    name: 'Merge PDF',
    icon: <Merge className="h-5 w-5" />,
    description: 'Combine multiple PDF files into one document',
  },
  {
    id: 'split',
    name: 'Split PDF',
    icon: <Scissors className="h-5 w-5" />,
    description: 'Extract pages or split a PDF into smaller files',
  },
  {
    id: 'enhance',
    name: 'PDF Enhancement',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Sharpen, grayscale, black-and-white, and improve scans',
  },
];

export function PdfToolsPage() {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        cleanupObjectUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleToolSelect = (toolId: ToolType) => {
    setSelectedTool(toolId);
    setPreviewFile(null);
    if (previewUrl) {
      cleanupObjectUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
    setPreviewFile(null);
    if (previewUrl) {
      cleanupObjectUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handlePreviewFile = (file: File) => {
    setPreviewFile(file);
    setSelectedTool('preview');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const renderTool = () => {
    switch (selectedTool) {
      case 'preview':
        return (
          <div className="space-y-3">
            {!previewFile && (
              <PdfUploadBox
                onFileSelect={handlePreviewFile}
                currentFile={previewFile}
                onClear={() => setPreviewFile(null)}
                accept="application/pdf"
                maxSizeMB={80}
              />
            )}
            {previewFile ? (
              <PdfPreview 
                file={previewFile} 
                onClose={handleBackToTools}
                className="h-[calc(100vh-220px)] min-h-[520px]"
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <FileText className="mx-auto mb-2 h-12 w-12 text-slate-400" />
                <p className="text-sm font-semibold text-slate-600">Upload a PDF to preview it inline.</p>
              </div>
            )}
          </div>
        );
      case 'compress':
        return <PdfCompressionTool />;
      case 'toDoc':
        return <PdfToDocTool />;
      case 'ocr':
        return <OcrPdfTool />;
      case 'merge':
        return <PdfMergeTool />;
      case 'split':
        return <PdfSplitTool />;
      case 'enhance':
        return <AiDocumentEnhancer />;
      default:
        return null;
    }
  };

  if (selectedTool) {
    const currentTool = tools.find(t => t.id === selectedTool);
    return (
      <div className="min-h-screen bg-[#eef6f0]">
        <div className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button
              type="button"
              onClick={handleBackToTools}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black text-slate-900">{currentTool?.name || ''}</h1>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="mx-auto max-w-7xl rounded-lg border border-[#d8cfb2] bg-white p-3 sm:p-4">
            {renderTool()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef6f0]">
      <div className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/officer-toolkit')}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-slate-900">PDF Tools</h1>
            <p className="text-sm font-semibold text-slate-600">Compress, convert, preview, and optimize documents</p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-emerald-700" />
            <div>
              <p className="text-xs font-black text-emerald-900">
                Files are processed temporarily and are not stored.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleToolSelect(tool.id)}
              className="rounded-lg border border-[#d8cfb2] bg-white p-3 text-left shadow-sm transition-all hover:border-emerald-500 hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  {tool.icon}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{tool.name}</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
