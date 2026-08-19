import React, { useEffect, useState, useRef } from 'react';
import { Download, Eye, FileText, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isCombinationProductFromActiveIngredient } from '../../lib/statutoryPesticidePdf';

const PESTICIDE_COVERING_LETTER_QUEUE_KEY = 'tiryani-pesticide-covering-letter-queue';
const PESTICIDE_COVERING_LETTER_DETAILS_KEY = 'tiryani-pesticide-covering-letter-details';

type PesticideCoveringLetterQueueItem = {
  sampleCode: string;
  tradeName: string;
  technicalName: string;
  activeIngredient: string;
  formulationType: string;
  dateOfSampling: string;
};

type PesticideCoveringLetterMetadata = {
  year: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  daoMemoNumber: string;
  daoMemoDate: string;
  division: string;
  officePhone: string;
};

type OfficerDetails = {
  officerName: string;
  qualification: string;
  manualQualification: string;
  designation: string;
  mandal: string;
  manualMandal: string;
  district: string;
  manualDistrict: string;
  pinCode: string;
  phone: string;
};

type PesticideCoveringLetterDetails = {
  financialYear: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  officerPhone: string;
};

type PesticideCoveringLetterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  officerDetails?: OfficerDetails;
  coveringLetterDetails?: PesticideCoveringLetterDetails;
  onMetadataChange?: (metadata: PesticideCoveringLetterMetadata) => void;
};

const currentYear = new Date().getFullYear();
const financialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function PesticideCoveringLetterModal({ isOpen, onClose, officerDetails, coveringLetterDetails, onMetadataChange }: PesticideCoveringLetterModalProps) {
  const [watermarkEnabled, setWatermarkEnabled] = useState(() => {
    try {
      const stored = window.localStorage.getItem('tiryani-watermark-enabled');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tiryani-watermark-enabled') {
        setWatermarkEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [editedQueue, setEditedQueue] = useState<PesticideCoveringLetterQueueItem[]>([]);
  const [editingTechnicalNames, setEditingTechnicalNames] = useState<Record<number, string>>({});
  const [metadata, setMetadata] = useState<PesticideCoveringLetterMetadata>({
    year: coveringLetterDetails?.financialYear || financialYears[0],
    letterNumber: coveringLetterDetails?.letterNumber || '',
    letterDate: coveringLetterDetails?.letterDate || new Date().toISOString().slice(0, 10),
    authorityType: coveringLetterDetails?.authorityType || 'DAO',
    daoMemoNumber: coveringLetterDetails?.memoNumber || '',
    daoMemoDate: coveringLetterDetails?.memoDate || '',
    division: coveringLetterDetails?.division || '',
    officePhone: coveringLetterDetails?.officerPhone || '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMessage = (msg: string, duration: number = 3000) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessage(msg);
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, duration);
  };

  // Auto-save Covering Letter Details to localStorage and sync with parent
  useEffect(() => {
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_DETAILS_KEY, JSON.stringify(metadata));
    if (onMetadataChange) {
      onMetadataChange(metadata);
    }
  }, [metadata]);

  // Load Covering Letter Details from localStorage when modal opens (if not provided via props)
  useEffect(() => {
    if (isOpen) {
      loadQueue();
      // Only load from localStorage if parent didn't provide coveringLetterDetails
      if (!coveringLetterDetails) {
        const savedDetails = window.localStorage.getItem(PESTICIDE_COVERING_LETTER_DETAILS_KEY);
        if (savedDetails) {
          try {
            const parsedDetails = JSON.parse(savedDetails);
            setMetadata(parsedDetails);
          } catch (error) {
            console.error('Error loading saved Covering Letter Details:', error);
          }
        }
      }
    }
  }, [isOpen, coveringLetterDetails]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadQueue = () => {
    try {
      const savedQueue = JSON.parse(window.localStorage.getItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY) || '[]');
      setEditedQueue(savedQueue);
    } catch (error) {
      console.error('Error loading pesticide covering letter queue:', error);
      setEditedQueue([]);
    }
  };

  const validateSampleCodes = () => {
    const errors: Record<number, string> = {};
    const sampleCodes: string[] = [];
    
    editedQueue.forEach((item, index) => {
      if (!item.sampleCode || item.sampleCode.trim() === '') {
        errors[index] = 'Sample Code is required';
      } else {
        if (sampleCodes.includes(item.sampleCode.trim())) {
          errors[index] = 'Duplicate Sample Code';
        }
        sampleCodes.push(item.sampleCode.trim());
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSampleCodeChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], sampleCode: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleTradeNameChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], tradeName: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleTechnicalNameChange = (index: number, value: string) => {
    setEditingTechnicalNames(prev => ({ ...prev, [index]: value }));
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = parseTechnicalNameInput(value, updatedQueue[index]);
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleTechnicalNameFocus = (index: number, item: PesticideCoveringLetterQueueItem) => {
    setEditingTechnicalNames(prev => ({ ...prev, [index]: getTechnicalNameDisplay(item) }));
  };

  const handleTechnicalNameBlur = (index: number) => {
    setEditingTechnicalNames(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const isCombinationProduct = (technicalName: string): boolean => {
    return technicalName.includes('+');
  };

  const getTechnicalNameDisplay = (item: PesticideCoveringLetterQueueItem): string => {
    if (isCombinationProduct(item.technicalName)) {
      // For combination products: display "Active Ingredient + Formulation Type"
      const parts = item.activeIngredient.split('+').map(p => p.trim()).filter(Boolean);
      const activeIngredientDisplay = parts.join(' + ');
      return `${activeIngredientDisplay}${item.formulationType ? ` ${item.formulationType}` : ''}`;
    }
    if (isCombinationProductFromActiveIngredient(item.activeIngredient)) {
      return item.technicalName;
    }
    // For single products: display existing combined format
    return `${item.technicalName}${item.activeIngredient ? ` ${item.activeIngredient}` : ''}${item.formulationType ? ` ${item.formulationType}` : ''}`;
  };

  const parseTechnicalNameInput = (value: string, currentItem: PesticideCoveringLetterQueueItem): PesticideCoveringLetterQueueItem => {
    if (isCombinationProduct(currentItem.technicalName)) {
      // For combination products, parse the input back to activeIngredient and formulationType
      // Format: "Ingredient1 % + Ingredient2 % Formulation"
      const match = value.match(/^(.+?)\s+([A-Z]+)$/);
      if (match) {
        return {
          ...currentItem,
          activeIngredient: match[1],
          formulationType: match[2]
        };
      }
      return {
        ...currentItem,
        activeIngredient: value,
        formulationType: ''
      };
    }
    // For single products, keep existing behavior - update technicalName field
    return {
      ...currentItem,
      technicalName: value
    };
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], dateOfSampling: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleDeleteSample = (index: number) => {
    setEditingTechnicalNames({});
    const updatedQueue = editedQueue.filter((_, i) => i !== index);
    setEditedQueue(updatedQueue);
    
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleAddManually = () => {
    const newItem: PesticideCoveringLetterQueueItem = {
      sampleCode: '',
      tradeName: '',
      technicalName: '',
      activeIngredient: '',
      formulationType: '',
      dateOfSampling: new Date().toISOString().slice(0, 10),
    };
    const updatedQueue = [...editedQueue, newItem];
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleClearQueue = () => {
    setEditedQueue([]);
    setEditingTechnicalNames({});
    setValidationErrors({});
    window.localStorage.removeItem(PESTICIDE_COVERING_LETTER_QUEUE_KEY);
    showMessage('Queue cleared successfully.');
  };

  const handlePreview = async () => {
    if (!validateSampleCodes()) {
      showMessage('Please fix validation errors before previewing.');
      return;
    }
    
    if (editedQueue.length === 0) {
      showMessage('Please add at least one sample to the queue.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { generatePesticideCoveringLetterPdf } = await import('../../lib/pesticideCoveringLetterPdf');
      const doc = await generatePesticideCoveringLetterPdf(editedQueue, metadata, officerDetails, watermarkEnabled);
      
      if (isMobile) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        URL.revokeObjectURL(pdfUrl);
      } else {
        const pdfData = doc.output('datauristring');
        setPreviewPdfUrl(pdfData);
        setShowPreviewDialog(true);
      }
      
      showMessage('Preview generated successfully.');
    } catch (error) {
      console.error('Error generating preview:', error);
      showMessage('Error generating preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!validateSampleCodes()) {
      showMessage('Please fix validation errors before downloading.');
      return;
    }
    
    if (editedQueue.length === 0) {
      showMessage('Please add at least one sample to the queue.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { generatePesticideCoveringLetterPdf } = await import('../../lib/pesticideCoveringLetterPdf');
      const doc = await generatePesticideCoveringLetterPdf(editedQueue, metadata, officerDetails, watermarkEnabled);
      
      const fileName = `Pesticide_Covering_Letter_${metadata.letterNumber || 'Draft'}.pdf`;
      doc.save(fileName);
      
      showMessage('Covering letter downloaded successfully.');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showMessage('Error downloading PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const closePreviewDialog = () => {
    setShowPreviewDialog(false);
    setPreviewPdfUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Covering Letter Generation</h2>
              <p className="text-sm text-gray-600">Review and edit sample details before generating</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-6">
            {message && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:px-4 sm:py-2 text-sm font-bold text-amber-800">
                {message}
              </div>
            )}

            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-purple-700">COVERING LETTER DETAILS</h3>
                <button
                  type="button"
                  onClick={() => {
                    setMetadata({
                      year: financialYears[0],
                      letterNumber: '',
                      letterDate: new Date().toISOString().slice(0, 10),
                      authorityType: 'DAO',
                      daoMemoNumber: '',
                      daoMemoDate: '',
                      division: '',
                      officePhone: '',
                    });
                    showMessage('Covering letter details reset successfully.');
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-purple-200 text-purple-400 hover:bg-purple-50 hover:text-purple-600"
                  title="Reset Covering Letter Details"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">FINANCIAL YEAR</label>
                  <input
                    type="text"
                    value={metadata.year}
                    readOnly
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">LETTER NUMBER</label>
                  <input
                    type="text"
                    value={metadata.letterNumber}
                    onChange={(e) => setMetadata({ ...metadata, letterNumber: e.target.value })}
                    placeholder="Enter Letter Number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">LETTER DATE</label>
                  <input
                    type="date"
                    value={metadata.letterDate}
                    onChange={(e) => setMetadata({ ...metadata, letterDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">AUTHORITY TYPE</label>
                  <select
                    value={metadata.authorityType}
                    onChange={(e) => setMetadata({ ...metadata, authorityType: e.target.value as 'DAO' | 'ADA' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    <option value="DAO">DAO</option>
                    <option value="ADA">ADA</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    {metadata.authorityType === 'DAO' ? 'DAO MEMO NO.' : 'ADA MEMO NO.'}
                  </label>
                  <input
                    type="text"
                    value={metadata.daoMemoNumber}
                    onChange={(e) => setMetadata({ ...metadata, daoMemoNumber: e.target.value })}
                    placeholder="Enter Memo Number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">MEMO DATE</label>
                  <input
                    type="date"
                    value={metadata.daoMemoDate}
                    onChange={(e) => setMetadata({ ...metadata, daoMemoDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">DIVISION</label>
                  <input
                    type="text"
                    value={metadata.division}
                    onChange={(e) => setMetadata({ ...metadata, division: e.target.value })}
                    placeholder="Enter Division Name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">OFFICER PHONE NO.</label>
                  <input
                    type="text"
                    value={metadata.officePhone}
                    onChange={(e) => setMetadata({ ...metadata, officePhone: e.target.value })}
                    placeholder="Enter Mobile Number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-sm border border-amber-200 bg-amber-50/50 p-2 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-amber-700">SAMPLE QUEUE</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddManually}
                    className="inline-flex items-center gap-2 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 rounded-lg"
                  >
                    <span className="text-xs">+</span> Add
                  </button>
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    disabled={editedQueue.length === 0}
                    className="inline-flex items-center gap-2 bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Queue
                  </button>
                </div>
              </div>

              {editedQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No samples in queue. Click "Add Sample" to begin.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2 text-left font-bold text-slate-700">S.No</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Trade Name</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Technical Name</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Code No. of Sample</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Date of Sampling</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedQueue.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="px-2 py-2 text-center font-bold text-slate-700">{index + 1}</td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.tradeName}
                              onChange={(e) => handleTradeNameChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Trade Name"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={editingTechnicalNames[index] ?? getTechnicalNameDisplay(item)}
                              onFocus={() => handleTechnicalNameFocus(index, item)}
                              onBlur={() => handleTechnicalNameBlur(index)}
                              onChange={(e) => handleTechnicalNameChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Technical Name"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.sampleCode}
                              onChange={(e) => handleSampleCodeChange(index, e.target.value)}
                              className={`w-full rounded border px-2 py-1 text-xs ${validationErrors[index] ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                              placeholder="Sample Code"
                            />
                            {validationErrors[index] && (
                              <p className="mt-1 text-[10px] text-red-600">{validationErrors[index]}</p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={item.dateOfSampling}
                              onChange={(e) => handleDateChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteSample(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePreview}
                disabled={editedQueue.length === 0 || isGenerating}
                className="inline-flex items-center justify-center gap-2 border border-emerald-200 bg-white px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex-1 sm:w-auto min-w-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={editedQueue.length === 0 || isGenerating}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 flex-1 sm:w-auto min-w-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
            </div>
        </footer>
      </div>

      {showPreviewDialog && previewPdfUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-black text-slate-900">Covering Letter Preview</h3>
              <button
                type="button"
                onClick={closePreviewDialog}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="h-full w-full"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

