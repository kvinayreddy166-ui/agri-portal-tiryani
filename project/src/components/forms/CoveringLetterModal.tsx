import React, { useEffect, useState, useRef } from 'react';
import { Download, Eye, FileText, X, Loader2, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const COVERING_LETTER_QUEUE_KEY = 'tiryani-covering-letter-queue';

type CoveringLetterQueueItem = {
  sampleCode: string;
  fertilizerName: string;
  quantity: string;
  dateOfSampling: string;
};

type CoveringLetterMetadata = {
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

type DealerDetails = {
  dealerName: string;
  dealerAddress: string;
  authorizationNumber: string;
};

type CoveringLetterDetails = {
  financialYear: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  officerPhone: string;
};

type CoveringLetterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  officerDetails?: OfficerDetails;
  coveringLetterDetails?: CoveringLetterDetails;
  dealerDetails?: DealerDetails;
  onMetadataChange?: (metadata: CoveringLetterMetadata) => void;
};

const currentYear = new Date().getFullYear();
const financialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function CoveringLetterModal({ isOpen, onClose, officerDetails, coveringLetterDetails, dealerDetails, onMetadataChange }: CoveringLetterModalProps) {
  const [queue, setQueue] = useState<CoveringLetterQueueItem[]>([]);
  const [editedQueue, setEditedQueue] = useState<CoveringLetterQueueItem[]>([]);
  const [metadata, setMetadata] = useState<CoveringLetterMetadata>({
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
  const [letterType, setLetterType] = useState<'quality-analysis' | 'safe-custody'>('quality-analysis');
  const [isMobile, setIsMobile] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCoveringLetterDetailsCollapsed, setIsCoveringLetterDetailsCollapsed] = useState(true);
  const lastPropagatedMetadata = useRef<CoveringLetterMetadata | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      // Update metadata from covering letter details when modal opens
      if (coveringLetterDetails) {
        setMetadata({
          year: coveringLetterDetails.financialYear,
          letterNumber: coveringLetterDetails.letterNumber,
          letterDate: coveringLetterDetails.letterDate,
          authorityType: coveringLetterDetails.authorityType,
          daoMemoNumber: coveringLetterDetails.memoNumber,
          daoMemoDate: coveringLetterDetails.memoDate,
          division: coveringLetterDetails.division,
          officePhone: coveringLetterDetails.officerPhone,
        });
      }
    }
  }, [isOpen, coveringLetterDetails]);

  // Propagate metadata changes to parent component (only when values actually change)
  useEffect(() => {
    if (onMetadataChange && isOpen) {
      const hasChanged = !lastPropagatedMetadata.current ||
        lastPropagatedMetadata.current.year !== metadata.year ||
        lastPropagatedMetadata.current.letterNumber !== metadata.letterNumber ||
        lastPropagatedMetadata.current.letterDate !== metadata.letterDate ||
        lastPropagatedMetadata.current.authorityType !== metadata.authorityType ||
        lastPropagatedMetadata.current.daoMemoNumber !== metadata.daoMemoNumber ||
        lastPropagatedMetadata.current.daoMemoDate !== metadata.daoMemoDate ||
        lastPropagatedMetadata.current.division !== metadata.division ||
        lastPropagatedMetadata.current.officePhone !== metadata.officePhone;
      
      if (hasChanged) {
        lastPropagatedMetadata.current = metadata;
        onMetadataChange(metadata);
      }
    }
  }, [metadata, onMetadataChange, isOpen]);

  // Detect mobile viewport
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
      const savedQueue = JSON.parse(window.localStorage.getItem(COVERING_LETTER_QUEUE_KEY) || '[]');
      setQueue(savedQueue);
      setEditedQueue(savedQueue);
    } catch (error) {
      console.error('Error loading covering letter queue:', error);
      setQueue([]);
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
    
    // Clear validation error for this field
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleFertilizerNameChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], fertilizerName: value };
    setEditedQueue(updatedQueue);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], quantity: value };
    setEditedQueue(updatedQueue);
  };

  const handleDeleteSample = (index: number) => {
    const updatedQueue = editedQueue.filter((_, i) => i !== index);
    setEditedQueue(updatedQueue);
    setQueue(updatedQueue);
    
    // Update localStorage to maintain single source of truth
    window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    // Clear validation error for this index if it exists
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleClearQueue = () => {
    setEditedQueue([]);
    setQueue([]);
    setValidationErrors({});
    window.localStorage.removeItem(COVERING_LETTER_QUEUE_KEY);
    setMessage('Queue cleared successfully.');
  };

  const handlePreview = async () => {
    if (editedQueue.length === 0) {
      setMessage('Please add samples to the queue before previewing.');
      return;
    }

    if (!validateSampleCodes()) {
      setMessage('Please fix validation errors before previewing.');
      return;
    }

    // Prevent multiple preview instances
    if (isPreviewing) {
      return;
    }

    setIsPreviewing(true);
    setIsGenerating(true);
    try {
      const { generateCoveringLetterPdf } = await import('../../lib/coveringLetterPdf');
      console.log('Generating covering letter with:', { editedQueue, metadata, officerDetails, letterType });
      const doc = await generateCoveringLetterPdf(editedQueue, metadata, officerDetails, letterType);
      
      if (!doc) {
        setMessage('Failed to generate Covering Letter. Please try again.');
        return;
      }
      
      const blob = doc.output('blob');
      
      // On mobile, open in new tab instead of preview dialog
      if (isMobile) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setMessage('Covering Letter opened in new tab.');
      } else {
        const blobUrl = URL.createObjectURL(blob);
        setPreviewPdfUrl(blobUrl);
        setShowPreviewDialog(true);
      }
      setMessage('');
    } catch (error) {
      console.error('Error generating covering letter PDF:', error);
      setMessage('Failed to generate Covering Letter. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (editedQueue.length === 0) {
      setMessage('Please add samples to the queue before downloading.');
      return;
    }

    if (!validateSampleCodes()) {
      setMessage('Please fix validation errors before downloading.');
      return;
    }

    setIsGenerating(true);
    try {
      const { generateCoveringLetterPdf } = await import('../../lib/coveringLetterPdf');
      console.log('Generating covering letter with:', { editedQueue, metadata, officerDetails, letterType });
      const doc = await generateCoveringLetterPdf(editedQueue, metadata, officerDetails, letterType);
      
      if (!doc) {
        setMessage('Failed to generate Covering Letter. Please try again.');
        return;
      }
      
      // Calculate letter number for filename using same logic as PDF generation
      const letterNumber = letterType === 'quality-analysis' 
        ? metadata.letterNumber 
        : (() => {
            const match = metadata.letterNumber.match(/^(\d+)/);
            if (!match) return metadata.letterNumber;
            
            const serial = parseInt(match[1], 10);
            const incrementedSerial = serial + 1;
            const originalWidth = match[1].length;
            const paddedSerial = incrementedSerial.toString().padStart(originalWidth, '0');
            
            return metadata.letterNumber.replace(/^\d+/, paddedSerial);
          })();
      
      const fileName = letterType === 'safe-custody'
        ? `Covering_Letter_Safe_Custody_${letterNumber || 'draft'}.pdf`
        : `Covering_Letter_Quality_Analysis_${letterNumber || 'draft'}.pdf`;
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      
      setMessage('Covering Letter downloaded successfully.');
    } catch (error) {
      console.error('Error downloading covering letter PDF:', error);
      setMessage('Failed to download Covering Letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const closePreviewDialog = () => {
    setShowPreviewDialog(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  if (!isOpen) return null;

  // Check if validation passes without setting state
  const checkValidation = () => {
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
    
    return Object.keys(errors).length === 0;
  };

  const isValid = checkValidation();

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
        <div className="flex max-h-[94vh] w-full max-w-[95vw] sm:max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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

          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {message && (
              <div className={`mb-4 rounded-lg border px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold ${
                message.includes('success') || message.includes('downloaded')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCoveringLetterDetailsCollapsed(!isCoveringLetterDetailsCollapsed)}
                    className="flex items-center justify-center rounded-lg text-purple-600 hover:bg-purple-100 transition-colors"
                  >
                    {isCoveringLetterDetailsCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                  <h3 className="text-sm font-black text-purple-700">COVERING LETTER DETAILS</h3>
                </div>
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
                    setMessage('Covering letter details reset successfully.');
                    setTimeout(() => setMessage(null), 3000);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-purple-200 text-purple-400 hover:bg-purple-50 hover:text-purple-600"
                  title="Reset Covering Letter Details"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              {!isCoveringLetterDetailsCollapsed && (
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
              )}
            </div>

            <div className="rounded-xl shadow-sm border border-red-200 bg-red-50/50 p-2 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-red-700">SAMPLE QUEUE DETAILS</h3>
                <div className="flex gap-2">
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
                <p className="text-gray-500 text-sm">No samples in the queue. Add samples from the fertilizer form.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fertilizer Name</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sample Code</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sampling Date</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editedQueue.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{index + 1}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <input
                              type="text"
                              value={item.fertilizerName}
                              onChange={(e) => handleFertilizerNameChange(index, e.target.value)}
                              className="w-full px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Enter Fertilizer Name"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <input
                              type="text"
                              value={item.sampleCode}
                              onChange={(e) => handleSampleCodeChange(index, e.target.value)}
                              className={`w-full px-1.5 py-1 border rounded-md text-xs focus:outline-none focus:ring-2 ${
                                validationErrors[index]
                                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                  : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                              }`}
                              placeholder="Enter Sample Code"
                            />
                            {validationErrors[index] && (
                              <p className="text-red-600 text-[10px] mt-0.5">{validationErrors[index]}</p>
                            )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-full px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Enter Quantity"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{item.dateOfSampling || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <button
                              type="button"
                              onClick={() => handleDeleteSample(index)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete sample"
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

          <footer className="flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <label className="text-sm font-bold text-gray-700 shrink-0">Letter Type:</label>
              <select
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as 'quality-analysis' | 'safe-custody')}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-w-0"
              >
                <option value="quality-analysis">Quality Analysis (Portion-I)</option>
                <option value="safe-custody">Safe Custody (III Portion)</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePreview}
                disabled={editedQueue.length === 0 || isGenerating}
                className="inline-flex items-center justify-center gap-2 border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white w-full sm:w-auto min-w-0"
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
                disabled={!isValid || editedQueue.length === 0 || isGenerating}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 w-full sm:w-auto min-w-0"
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
      </div>

      {showPreviewDialog && previewPdfUrl && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950 h-screen w-screen">
          <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Covering Letter Preview</h2>
                <p className="text-xs sm:text-sm text-gray-600">Review the document before downloading</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closePreviewDialog}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-hidden bg-gray-100">
            <iframe
              src={previewPdfUrl}
              className="w-full h-full"
              title="Covering Letter Preview"
              style={{ border: 'none' }}
            />
          </div>

          <footer className="flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={closePreviewDialog}
              className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg w-full sm:w-auto min-w-0"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-0"
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
          </footer>
        </div>
      )}
    </>
  );
}
