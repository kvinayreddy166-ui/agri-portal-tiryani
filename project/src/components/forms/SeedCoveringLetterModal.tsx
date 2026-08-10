import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText, X, Loader2, Trash2, RotateCcw } from 'lucide-react';

const SEED_COVERING_LETTER_QUEUE_KEY = 'tiryani-seed-covering-letter-queue';

type SeedCoveringLetterQueueItem = {
  sampleCode: string;
  seedName: string;
  variety: string;
  quantity: string;
  dateOfSampling: string;
};

type SeedCoveringLetterMetadata = {
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

type SeedCoveringLetterDetails = {
  financialYear: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  officerPhone: string;
};

type SeedCoveringLetterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  officerDetails?: OfficerDetails;
  coveringLetterDetails?: SeedCoveringLetterDetails;
};

const currentYear = new Date().getFullYear();
const financialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function SeedCoveringLetterModal({ isOpen, onClose, officerDetails, coveringLetterDetails }: SeedCoveringLetterModalProps) {
  const [editedQueue, setEditedQueue] = useState<SeedCoveringLetterQueueItem[]>([]);
  const [metadata, setMetadata] = useState<SeedCoveringLetterMetadata>({
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
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
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
      const savedQueue = JSON.parse(window.localStorage.getItem(SEED_COVERING_LETTER_QUEUE_KEY) || '[]');
      setEditedQueue(savedQueue);
    } catch (error) {
      console.error('Error loading seed covering letter queue:', error);
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
    
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleSeedNameChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], seedName: value };
    setEditedQueue(updatedQueue);
  };

  const handleVarietyChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], variety: value };
    setEditedQueue(updatedQueue);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], quantity: value };
    setEditedQueue(updatedQueue);
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], dateOfSampling: value };
    setEditedQueue(updatedQueue);
  };

  const handleDeleteSample = (index: number) => {
    const updatedQueue = editedQueue.filter((_, i) => i !== index);
    setEditedQueue(updatedQueue);
    
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleClearQueue = () => {
    setEditedQueue([]);
    setValidationErrors({});
    window.localStorage.removeItem(SEED_COVERING_LETTER_QUEUE_KEY);
    setMessage('Queue cleared successfully.');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddSample = () => {
    const newSample: SeedCoveringLetterQueueItem = {
      sampleCode: '',
      seedName: '',
      variety: '',
      quantity: '',
      dateOfSampling: new Date().toISOString().slice(0, 10),
    };
    setEditedQueue([...editedQueue, newSample]);
  };

  const handleSaveQueue = () => {
    if (!validateSampleCodes()) {
      setMessage('Please fix validation errors before saving.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(editedQueue));
    setMessage('Queue saved successfully.');
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePreview = async () => {
    if (!validateSampleCodes()) {
      setMessage('Please fix validation errors before previewing.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    if (editedQueue.length === 0) {
      setMessage('Please add at least one sample to the queue.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setIsGenerating(true);
    setIsPreviewing(true);
    
    try {
      const { generateSeedCoveringLetterPdf } = await import('../../lib/seedCoveringLetterPdf');
      const doc = await generateSeedCoveringLetterPdf(editedQueue, metadata, officerDetails);
      
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
      
      setMessage('Preview generated successfully.');
    } catch (error) {
      console.error('Error generating preview:', error);
      setMessage('Error generating preview. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsPreviewing(false);
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDownload = async () => {
    if (!validateSampleCodes()) {
      setMessage('Please fix validation errors before downloading.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    if (editedQueue.length === 0) {
      setMessage('Please add at least one sample to the queue.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { generateSeedCoveringLetterPdf } = await import('../../lib/seedCoveringLetterPdf');
      const doc = await generateSeedCoveringLetterPdf(editedQueue, metadata, officerDetails);
      
      const fileName = `Seed_Covering_Letter_${metadata.letterNumber || 'Draft'}.pdf`;
      doc.save(fileName);
      
      setMessage('Covering letter downloaded successfully.');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage('Error downloading PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const closePreviewDialog = () => {
    setShowPreviewDialog(false);
    setPreviewPdfUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-green-100/50 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Seed Sampling</p>
              <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 sm:text-lg">Covering Letter</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
            {message && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                {message}
              </div>
            )}

            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
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
                    setMessage('Covering letter details reset successfully.');
                    setTimeout(() => setMessage(null), 3000);
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

            <div className="rounded-xl shadow-sm border border-emerald-200 bg-emerald-50/50 p-1 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-emerald-700">SAMPLE QUEUE DETAILS</h3>
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
                <div className="text-center py-8 text-slate-500 text-sm">
                  No samples in queue. Click "Add Sample" to begin.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Sample Code</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Seed Name</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Variety</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Quantity</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Date</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedQueue.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
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
                              type="text"
                              value={item.seedName}
                              onChange={(e) => handleSeedNameChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Seed Name"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.variety}
                              onChange={(e) => handleVarietyChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Variety"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Quantity"
                            />
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

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveQueue}
                  disabled={editedQueue.length === 0}
                  className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Queue
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isGenerating || isPreviewing || editedQueue.length === 0}
              className="inline-flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || editedQueue.length === 0}
              className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download
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
