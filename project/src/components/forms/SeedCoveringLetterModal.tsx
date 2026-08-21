import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SEED_COVERING_LETTER_QUEUE_KEY = 'tiryani-seed-covering-letter-queue';
const SEED_COVERING_LETTER_DETAILS_KEY = 'tiryani-seed-covering-letter-details';

function incrementSerialNumber(letterNumber: string): string {
  if (!letterNumber) return letterNumber;
  
  // Pattern 0: Alphanumeric serial at the beginning (e.g., "C1/MAO/TRN/FRT-QC/2026-27/01" to "C2/...")
  const alphaStartMatch = letterNumber.match(/^([A-Za-z])(\d+)(\/.*)$/);
  if (alphaStartMatch) {
    const letter = alphaStartMatch[1];
    const serial = alphaStartMatch[2];
    const rest = alphaStartMatch[3];
    const serialNum = parseInt(serial, 10);
    const incremented = (serialNum + 1).toString().padStart(serial.length, '0');
    return `${letter}${incremented}${rest}`;
  }
  
  // Pattern 1: Serial at the beginning (e.g., "001/MAO/TRN/FRT-QC/2026-27")
  // Must be checked after alphanumeric pattern to avoid conflict
  const startMatch = letterNumber.match(/^(\d+)(\/.*)$/);
  if (startMatch) {
    const serial = startMatch[1];
    const rest = startMatch[2];
    const serialNum = parseInt(serial, 10);
    const incremented = (serialNum + 1).toString().padStart(serial.length, '0');
    return `${incremented}${rest}`;
  }
  
  // Pattern 2: Serial at the end (e.g., "MAO/TRN/FRT-QC/2026-27/01")
  const endMatch = letterNumber.match(/^(.*)\/(\d+)$/);
  if (endMatch) {
    const prefix = endMatch[1];
    const serial = endMatch[2];
    const serialNum = parseInt(serial, 10);
    const incremented = (serialNum + 1).toString().padStart(serial.length, '0');
    return `${prefix}/${incremented}`;
  }
  
  // Pattern 3: Serial in middle (e.g., "MAO/TRN/FRT-QC/01/2026-27")
  // Only match if prefix doesn't start with digits (to avoid conflict with Pattern 1)
  const middleMatch = letterNumber.match(/^([^\d]+)\/(\d+)\/(.*)$/);
  if (middleMatch) {
    const prefix = middleMatch[1];
    const serial = middleMatch[2];
    const suffix = middleMatch[3];
    const serialNum = parseInt(serial, 10);
    const incremented = (serialNum + 1).toString().padStart(serial.length, '0');
    return `${prefix}/${incremented}/${suffix}`;
  }
  
  return letterNumber;
}

type SeedCoveringLetterQueueItem = {
  sampleCode: string;
  seedName: string;
  variety: string;
  quantity: string;
  dateOfSampling: string;
  isCotton?: boolean;
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
  onMetadataChange?: (metadata: SeedCoveringLetterMetadata) => void;
  laboratoryAddress?: string;
};

const currentYear = new Date().getFullYear();
const financialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function SeedCoveringLetterModal({ isOpen, onClose, officerDetails, coveringLetterDetails, onMetadataChange, laboratoryAddress }: SeedCoveringLetterModalProps) {
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
  const [cottonPdfData, setCottonPdfData] = useState<string | null>(null);
  const [letterType, setLetterType] = useState<'PMG' | 'BT Protein'>('PMG');
  const [isMobile, setIsMobile] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Auto-save Covering Letter Details to localStorage and sync with parent
  useEffect(() => {
    window.localStorage.setItem(SEED_COVERING_LETTER_DETAILS_KEY, JSON.stringify(metadata));
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
        const savedDetails = window.localStorage.getItem(SEED_COVERING_LETTER_DETAILS_KEY);
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
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const handleSeedNameChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], seedName: value, isCotton: value.toLowerCase().includes('cotton') };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleVarietyChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], variety: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], quantity: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedQueue = [...editedQueue];
    updatedQueue[index] = { ...updatedQueue[index], dateOfSampling: value };
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
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
      isCotton: false,
    };
    const updatedQueue = [...editedQueue, newSample];
    setEditedQueue(updatedQueue);
    window.localStorage.setItem(SEED_COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
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
      
      // Filter queue based on letter type
      const filteredQueue = letterType === 'BT Protein' 
        ? editedQueue.filter(item => item.isCotton)
        : editedQueue;
      
      if (filteredQueue.length === 0) {
        setMessage('No cotton samples found for BT Protein letter type.');
        setIsGenerating(false);
        setIsPreviewing(false);
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      
      // For BT Protein, use incremented serial number
      const metadataForPdf = letterType === 'BT Protein' 
        ? { ...metadata, letterNumber: incrementSerialNumber(metadata.letterNumber) }
        : metadata;
      
      // Update officerDetails with phone from metadata
      const officerDetailsWithPhone = officerDetails ? { ...officerDetails, phone: metadata.officePhone } : officerDetails;
      
      // Use selected letter type to determine isCotton flag
      const queueWithLetterType = filteredQueue.map(item => ({
        ...item,
        isCotton: letterType === 'BT Protein'
      }));
      
      const doc = await generateSeedCoveringLetterPdf(queueWithLetterType, metadataForPdf, officerDetailsWithPhone, watermarkEnabled, laboratoryAddress);
      
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
      
      setMessage(`Preview generated successfully for ${letterType}.`);
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
      
      // Filter queue based on letter type
      const filteredQueue = letterType === 'BT Protein' 
        ? editedQueue.filter(item => item.isCotton)
        : editedQueue;
      
      if (filteredQueue.length === 0) {
        setMessage('No cotton samples found for BT Protein letter type.');
        setIsGenerating(false);
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      
      // For BT Protein, use incremented serial number
      const metadataForPdf = letterType === 'BT Protein' 
        ? { ...metadata, letterNumber: incrementSerialNumber(metadata.letterNumber) }
        : metadata;
      
      // Update officerDetails with phone from metadata
      const officerDetailsWithPhone = officerDetails ? { ...officerDetails, phone: metadata.officePhone } : officerDetails;
      
      // Use selected letter type to determine isCotton flag
      const queueWithLetterType = filteredQueue.map(item => ({
        ...item,
        isCotton: letterType === 'BT Protein'
      }));
      
      const doc = await generateSeedCoveringLetterPdf(queueWithLetterType, metadataForPdf, officerDetailsWithPhone, watermarkEnabled, laboratoryAddress);
      
      const fileName = letterType === 'BT Protein' 
        ? `Seed_Covering_Letter_BT_${metadataForPdf.letterNumber || 'Draft'}.pdf`
        : `Seed_Covering_Letter_PMG_${metadata.letterNumber || 'Draft'}.pdf`;
      doc.save(fileName);
      
      setMessage(`Covering letter downloaded successfully for ${letterType}.`);
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
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 sm:px-4 sm:py-2 text-sm font-bold text-green-800">
                {message}
              </div>
            )}

            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-purple-700">LETTER DETAILS</h3>
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
                  {letterType === 'BT Protein' && metadata.letterNumber && (
                    <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                      BT Protein will use: {incrementSerialNumber(metadata.letterNumber)}
                    </p>
                  )}
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

            <div className="rounded-xl shadow-sm border border-emerald-200 bg-emerald-50/50 p-2 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-emerald-700">SAMPLE QUEUE</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddSample}
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
                  <table className="w-full text-xs table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-12">S.No</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-20">Crop</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-20">Variety</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-28">Code No. of Sample</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-20">Quantity(gms)</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-24">Sampling Date</th>
                        <th className="px-2 py-2 text-left font-bold text-slate-700 w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedQueue.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="px-2 py-2 text-center font-bold text-slate-700">{index + 1}</td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.seedName}
                              onChange={(e) => handleSeedNameChange(index, e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              placeholder="Crop"
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
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {editedQueue.some(item => item.isCotton) && (
                <>
                  <label className="text-sm font-bold text-gray-700 shrink-0">Letter Type:</label>
                  <select
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value as 'PMG' | 'BT Protein')}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-w-0"
                  >
                    <option value="PMG">Purity, Moisture & Germination (PMG)</option>
                    <option value="BT Protein">BT Protein</option>
                  </select>
                </>
              )}
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
