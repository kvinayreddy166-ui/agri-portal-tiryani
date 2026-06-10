import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText, 
  Minimize2, 
  FileEdit, 
  ScanText, 
  Sparkles, 
  Merge, 
  Scissors,
  Eye,
  Shield
} from 'lucide-react';
import { PdfCompressionTool } from '../components/pdf/PdfCompressionTool';
import { PdfToDocTool } from '../components/pdf/PdfToDocTool';
import { OcrPdfTool } from '../components/pdf/OcrPdfTool';
import { AiDocumentEnhancer } from '../components/pdf/AiDocumentEnhancer';
import { PdfMergeTool } from '../components/pdf/PdfMergeTool';
import { PdfSplitTool } from '../components/pdf/PdfSplitTool';
import { PdfPreview } from '../components/pdf/PdfPreview';
import { cleanupObjectUrl } from '../utils/fileCleanup';

type ToolType = 
  | 'preview'
  | 'compress'
  | 'toDoc'
  | 'ocr'
  | 'enhance'
  | 'merge'
  | 'split';

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
    description: 'Reduce PDF file size',
  },
  {
    id: 'toDoc',
    name: 'PDF to Word',
    icon: <FileEdit className="h-5 w-5" />,
    description: 'Convert PDF to editable DOCX',
  },
  {
    id: 'ocr',
    name: 'OCR to Text',
    icon: <ScanText className="h-5 w-5" />,
    description: 'Extract text from scanned PDFs',
  },
  {
    id: 'enhance',
    name: 'AI Enhance',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Improve low-quality documents',
  },
  {
    id: 'merge',
    name: 'Merge PDF',
    icon: <Merge className="h-5 w-5" />,
    description: 'Combine multiple PDFs',
  },
  {
    id: 'split',
    name: 'Split PDF',
    icon: <Scissors className="h-5 w-5" />,
    description: 'Split PDF into multiple files',
  },
];

export function PdfToolsPage() {
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
        return previewFile ? (
          <PdfPreview 
            file={previewFile} 
            onClose={handleBackToTools}
            className="h-[calc(100vh-200px)]"
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <FileText className="mx-auto mb-2 h-12 w-12 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">No file selected for preview</p>
          </div>
        );
      case 'compress':
        return <PdfCompressionTool />;
      case 'toDoc':
        return <PdfToDocTool />;
      case 'ocr':
        return <OcrPdfTool />;
      case 'enhance':
        return <AiDocumentEnhancer />;
      case 'merge':
        return <PdfMergeTool />;
      case 'split':
        return <PdfSplitTool />;
      default:
        return null;
    }
  };

  if (selectedTool) {
    const currentTool = tools.find(t => t.id === selectedTool);
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
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
        <div className="p-4">
          <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-4">
            {renderTool()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-slate-900">PDF Tools</h1>
            <p className="text-sm font-semibold text-slate-600">Compress, Convert, OCR & Enhance</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-emerald-700" />
            <div>
              <p className="text-xs font-black text-emerald-900">
                Files are processed temporarily only. This app does not store your documents.
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
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-500 hover:shadow-md active:scale-[0.98]"
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
