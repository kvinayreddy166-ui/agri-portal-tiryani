import React, { useEffect, useState } from 'react';
import { Download, Eye, Trash2, FileText, X, Printer } from 'lucide-react';

const COVERING_LETTER_QUEUE_KEY = 'tiryani-covering-letter-queue';
const LAST_GENERATED_PDF_KEY = 'tiryani-covering-letter-last-pdf';
const LAST_GENERATED_METADATA_KEY = 'tiryani-covering-letter-last-metadata';

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

const currentYear = new Date().getFullYear();
const financialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function CoveringLetterModal({ isOpen, onClose, officerDetails }: { isOpen: boolean; onClose: () => void; officerDetails?: { mandal: string; district: string; officerName: string; phone: string } }) {
  const [queue, setQueue] = useState<CoveringLetterQueueItem[]>([]);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [metadata, setMetadata] = useState<CoveringLetterMetadata>({
    year: financialYears[0],
    letterNumber: '',
    letterDate: new Date().toISOString().slice(0, 10),
    authorityType: 'DAO',
    daoMemoNumber: '',
    daoMemoDate: '',
    division: '',
    officePhone: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showPostGenerateDialog, setShowPostGenerateDialog] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      loadLastGeneratedPdf();
    }
  }, [isOpen]);

  const loadQueue = () => {
    try {
      const savedQueue = JSON.parse(window.localStorage.getItem(COVERING_LETTER_QUEUE_KEY) || '[]');
      setQueue(savedQueue);
    } catch (error) {
      console.error('Error loading covering letter queue:', error);
      setQueue([]);
    }
  };

  const loadLastGeneratedPdf = () => {
    try {
      const lastPdfData = window.localStorage.getItem(LAST_GENERATED_PDF_KEY);
      const lastMetadata = window.localStorage.getItem(LAST_GENERATED_METADATA_KEY);
      if (lastPdfData && lastMetadata) {
        setGeneratedPdf(lastPdfData);
        setMetadata(JSON.parse(lastMetadata));
      }
    } catch (error) {
      console.error('Error loading last generated PDF:', error);
    }
  };

  const removeItem = (sampleCode: string) => {
    const updatedQueue = queue.filter(item => item.sampleCode !== sampleCode);
    window.localStorage.setItem(COVERING_LETTER_QUEUE_KEY, JSON.stringify(updatedQueue));
    setQueue(updatedQueue);
    window.dispatchEvent(new Event('local-storage-update'));
    setMessage('Sample removed from Covering Letter.');
  };

  const clearAllSamples = () => {
    window.localStorage.removeItem(COVERING_LETTER_QUEUE_KEY);
    setQueue([]);
    setShowClearDialog(false);
    window.dispatchEvent(new Event('local-storage-update'));
    setMessage('All samples cleared from Covering Letter.');
  };

  const handleGenerateCoveringLetter = () => {
    if (queue.length === 0) {
      setMessage('No samples in the queue. Add samples first.');
      return;
    }
    setShowMetadataDialog(true);
  };

  const generatePdf = async () => {
    try {
      const { generateCoveringLetterPdf } = await import('../../lib/coveringLetterPdf');
      const doc = await generateCoveringLetterPdf(queue, metadata, officerDetails);
      setGeneratedPdf(doc);
      
      const pdfData = doc.output('arraybuffer');
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)));
      window.localStorage.setItem(LAST_GENERATED_PDF_KEY, pdfBase64);
      window.localStorage.setItem(LAST_GENERATED_METADATA_KEY, JSON.stringify(metadata));
      
      setShowMetadataDialog(false);
      setShowPostGenerateDialog(true);
      setMessage('Covering Letter generated successfully.');
    } catch (error) {
      console.error('Error generating covering letter PDF:', error);
      setMessage('Failed to generate Covering Letter. Please try again.');
    }
  };

  const previewPdf = async () => {
    if (!generatedPdf) return;
    
    let blobUrl: string;
    
    if (typeof generatedPdf === 'string') {
      const binaryString = atob(generatedPdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      blobUrl = URL.createObjectURL(blob);
    } else {
      blobUrl = URL.createObjectURL(generatedPdf.output('blob'));
    }
    
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const downloadPdf = async () => {
    if (!generatedPdf) return;
    
    const fileName = `Covering_Letter_${metadata.letterNumber || 'draft'}.pdf`;
    let blobUrl: string;
    
    if (typeof generatedPdf === 'string') {
      const binaryString = atob(generatedPdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      blobUrl = URL.createObjectURL(blob);
    } else {
      const blob = new File([generatedPdf.output('blob')], fileName, { type: 'application/pdf' });
      blobUrl = URL.createObjectURL(blob);
    }
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const printPdf = () => {
    if (!generatedPdf) return;
    const blobUrl = URL.createObjectURL(generatedPdf.output('blob'));
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const handlePostGenerateClear = () => {
    clearAllSamples();
    setShowPostGenerateDialog(false);
    setGeneratedPdf(null);
  };

  const handlePostGenerateKeep = () => {
    setShowPostGenerateDialog(false);
    setGeneratedPdf(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Covering Letter</h2>
              <p className="text-sm text-gray-600">Generate covering letter for fertilizer sample submission</p>
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

        <div className="flex-1 overflow-y-auto p-6">
          {message && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Sample Queue</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                  {queue.length} samples
                </span>
              </div>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearDialog(true)}
                  className="text-red-600 hover:text-red-700 text-sm font-bold"
                >
                  Clear All Samples
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <p className="text-gray-500 text-sm">No samples in the queue. Add samples from the fertilizer form.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sl.No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fertilizer Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sample Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity (g)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Sampling</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queue.map((item, index) => (
                      <tr key={item.sampleCode}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.fertilizerName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.sampleCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.quantity || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.dateOfSampling || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => removeItem(item.sampleCode)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove"
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

            {queue.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleGenerateCoveringLetter}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-bold"
                >
                  <FileText className="w-4 h-4" />
                  Generate Covering Letter
                </button>
              </div>
            )}

            {generatedPdf && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Last Generated Covering Letter:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={previewPdf}
                    className="inline-flex items-center gap-2 border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={downloadPdf}
                    className="inline-flex items-center gap-2 bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showMetadataDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Covering Letter Details</h3>
                <button
                  type="button"
                  onClick={() => setShowMetadataDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                  <select
                    value={metadata.year}
                    onChange={(e) => setMetadata({ ...metadata, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {financialYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Letter Number</label>
                  <input
                    type="text"
                    value={metadata.letterNumber}
                    onChange={(e) => setMetadata({ ...metadata, letterNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter letter number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Letter Date</label>
                  <input
                    type="date"
                    value={metadata.letterDate}
                    onChange={(e) => setMetadata({ ...metadata, letterDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authority Type</label>
                  <select
                    value={metadata.authorityType}
                    onChange={(e) => setMetadata({ ...metadata, authorityType: e.target.value as 'DAO' | 'ADA' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="DAO">DAO</option>
                    <option value="ADA">ADA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DAO Memo Number</label>
                  <input
                    type="text"
                    value={metadata.daoMemoNumber}
                    onChange={(e) => setMetadata({ ...metadata, daoMemoNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter DAO memo number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DAO Memo Date</label>
                  <input
                    type="date"
                    value={metadata.daoMemoDate}
                    onChange={(e) => setMetadata({ ...metadata, daoMemoDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={metadata.division}
                    onChange={(e) => setMetadata({ ...metadata, division: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter division"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Phone Number</label>
                  <input
                    type="text"
                    value={metadata.officePhone}
                    onChange={(e) => setMetadata({ ...metadata, officePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter office phone number"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={generatePdf}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-bold"
                >
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowMetadataDialog(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showClearDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Clear All Samples</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to clear all samples from the Covering Letter queue?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAllSamples}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearDialog(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showPostGenerateDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Covering Letter Generated Successfully</h3>
              <p className="text-gray-600 mb-4">Do you want to clear the Covering Letter queue?</p>
              
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={previewPdf}
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={downloadPdf}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={printPdf}
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePostGenerateClear}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold"
                >
                  Yes, Clear Queue
                </button>
                <button
                  type="button"
                  onClick={handlePostGenerateKeep}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold"
                >
                  No, Keep Queue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
