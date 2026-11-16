import React, { useRef, useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Copy,
  Key,
  Loader2,
  MessageCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import type { CropProtectionCrop, CropProtectionItem, LanguageCode } from '../services/cropProtectionService';
import { pickLang } from '../services/cropProtectionService';
import { label } from '../../../shared/services/translationService';
import {
  analyzeCropImageWithGemini,
  clearGeminiApiKey,
  compressImageForDiagnosis,
  getGeminiApiKey,
  getOfflineDemoDiagnosis,
  setGeminiApiKey,
  validateGeminiApiKey,
  type GeminiCropDiagnosisResult,
} from '../services/geminiCropDoctorService';

interface CropAiDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCropKey?: string;
  crops: CropProtectionCrop[];
  language: LanguageCode;
  onSelectMatchedItem?: (cropKey: string, item: CropProtectionItem) => void;
}

export function CropAiDiagnosisModal({
  isOpen,
  onClose,
  defaultCropKey = 'cotton',
  crops,
  language,
  onSelectMatchedItem,
}: CropAiDiagnosisModalProps) {
  // State
  const [selectedCropKey, setSelectedCropKey] = useState<string>(defaultCropKey);
  const [fieldNotes, setFieldNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [imageMeta, setImageMeta] = useState<{ sizeKb: number; width: number; height: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiCropDiagnosisResult | null>(null);
  const [copied, setCopied] = useState(false);

  // API Key management state
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeApiKey, setActiveApiKey] = useState<string>('');

  // Hidden File Inputs: one with capture for direct live camera, one without for gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Sync crop selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCropKey(defaultCropKey || crops[0]?.crop_key || 'cotton');
      const existingKey = getGeminiApiKey();
      setActiveApiKey(existingKey);
      setKeyInput(existingKey);
      if (!existingKey) {
        setShowKeyConfig(true);
      }
    } else {
      // Clear state on close
      setError(null);
      setCopied(false);
    }
  }, [isOpen, defaultCropKey, crops]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Image selection handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    try {
      setLoading(true);
      setLoadingStep('Optimizing photo for agricultural analysis...');
      const compressed = await compressImageForDiagnosis(file, 1280, 1280, 0.85);
      setImagePreview(compressed.dataUrl);
      setRawBase64(compressed.base64);
      setMimeType(compressed.mimeType);
      setImageMeta({
        sizeKb: compressed.sizeKb,
        width: compressed.width,
        height: compressed.height,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process selected image.');
    } finally {
      setLoading(false);
      setLoadingStep('');
      // Reset input value so re-selecting same photo triggers onChange
      if (e.target) e.target.value = '';
    }
  };

  // Run Diagnosis with Gemini API
  const handleAnalyze = async () => {
    if (!rawBase64) {
      setError('Please take or upload a crop photo first.');
      return;
    }

    const key = getGeminiApiKey();
    if (!key) {
      setShowKeyConfig(true);
      setError('Please provide a Google Gemini API key to run AI photo diagnosis.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      setLoadingStep('Consulting Google Gemini Multimodal AI...');
      const diagnosis = await analyzeCropImageWithGemini({
        imageBase64: rawBase64,
        mimeType,
        selectedCropKey,
        fieldNotes,
        language,
        crops,
      });
      setResult(diagnosis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to diagnose crop photo with Gemini AI.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Run offline / demo diagnosis using verified PJTSAU database
  const handleRunDemoDiagnosis = () => {
    setError(null);
    setLoading(true);
    setLoadingStep(
      language === 'te'
        ? 'PJTSAU వ్యవసాయ డేటాబేస్ నుండి విశ్లేషిస్తోంది...'
        : 'Consulting Agronix PJTSAU Knowledge Base...'
    );
    setTimeout(() => {
      try {
        const demo = getOfflineDemoDiagnosis(selectedCropKey, fieldNotes, language, crops);
        setResult(demo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Demo diagnosis failed.');
      } finally {
        setLoading(false);
        setLoadingStep('');
      }
    }, 600);
  };

  // Save / Validate API key
  const handleSaveKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      clearGeminiApiKey();
      setActiveApiKey('');
      setKeyMessage({ type: 'success', text: 'Gemini API key cleared.' });
      return;
    }

    setKeyValidating(true);
    setKeyMessage(null);
    try {
      const res = await validateGeminiApiKey(trimmed);
      if (res.valid) {
        setGeminiApiKey(trimmed);
        setActiveApiKey(trimmed);
        setKeyMessage({ type: 'success', text: res.message });
        setTimeout(() => setShowKeyConfig(false), 900);
      } else {
        setKeyMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setKeyMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Validation failed. Check internet connection.',
      });
    } finally {
      setKeyValidating(false);
    }
  };

  // Copy Advisory to Clipboard
  const handleCopyAdvisory = async () => {
    if (!result) return;
    const text = formatAdvisoryForShare(result, language);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = formatAdvisoryForShare(result, language);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Reset and analyze new photo
  const handleReset = () => {
    setImagePreview(null);
    setRawBase64(null);
    setImageMeta(null);
    setResult(null);
    setError(null);
  };

  // Helper labels
  const categoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'pest':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'disease':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'weed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'nutrient':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const severityBadgeColor = (sev: string) => {
    switch (sev) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-ai-modal-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 px-4 py-3 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner ring-1 ring-white/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="crop-ai-modal-title" className="text-base font-black tracking-tight sm:text-lg">
                  {language === 'te' ? 'AI పంట రక్షణ & ఫోటో నిర్ధారణ' : 'Crop Doctor AI Diagnosis'}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-100 ring-1 ring-emerald-400/40">
                  <Sparkles className="h-3 w-3 text-emerald-200" /> Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-100/90">
                {language === 'te'
                  ? 'గూగుల్ జెమిని AI తో పురుగులు మరియు తెగుళ్లను గుర్తించి PJTSAU సిఫార్సులు పొందండి'
                  : 'Identify pests, diseases & nutrient deficiencies with PJTSAU Telangana dosage guidance'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeyConfig((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                activeApiKey
                  ? 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-900'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
              title="Configure Google Gemini API Key"
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{activeApiKey ? 'API Key Active' : 'Set API Key'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* API Key Configuration Dropdown / Banner */}
          {showKeyConfig && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 p-3 sm:p-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-200 text-sm">
                  <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Google Gemini API Configuration
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                To run crop photo diagnosis with AI, Agronix uses Google Gemini 3.8 Flash via the Interactions API.
                You can get a{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-emerald-700 dark:text-emerald-400 underline"
                >
                  free Gemini API key at Google AI Studio
                </a>
                {' '}(sign in with a personal <span className="font-mono font-bold">@gmail.com</span> account — corporate/school accounts often restrict free AI access).
              </p>
              <div className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-[11px] text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-black">No API Key or Google asks for credit card?</span>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    You can use Agronix&apos;s verified PJTSAU agricultural engine directly without needing any API key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunDemoDiagnosis}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Use Built-in PJTSAU Mode (Free)</span>
                </button>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key (AIza...)"
                  className="h-9 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  disabled={keyValidating}
                  onClick={handleSaveKey}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {keyValidating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Save Key'
                  )}
                </button>
              </div>
              {keyMessage && (
                <div
                  className={`mt-2 flex items-center gap-1.5 font-bold ${
                    keyMessage.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {keyMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{keyMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-bold text-red-900 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Main Content Area */}
          {!result ? (
            <div className="space-y-4">
              {/* Image Input Options */}
              {!imagePreview ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center transition hover:border-emerald-600 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md transition group-hover:scale-110">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {language === 'te' ? 'లైవ్ ఫోటో తీయండి' : 'Open Camera'}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {language === 'te'
                            ? 'స్మార్ట్‌ఫోన్ కెమెరాతో నేరుగా పంట లేదా ఆకును ఫోటో తీయండి'
                            : 'Capture leaf, pest or symptom directly from mobile camera'}
                        </p>
                      </div>
                    </button>

                    {/* Gallery / File Upload Button */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6 text-center transition hover:border-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-md transition group-hover:scale-110 dark:bg-slate-600">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {language === 'te' ? 'గ్యాలరీ నుండి అప్‌లోడ్ చేయండి' : 'Upload from Gallery'}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {language === 'te'
                            ? 'గ్యాలరీ లేదా ఫైల్స్ నుండి JPG, PNG, WebP చిత్రాన్ని ఎంచుకోండి'
                            : 'Choose an existing field photo from gallery or computer'}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Field Guidance Tips */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {language === 'te' ? 'ఖచ్చితమైన నిర్ధారణ కోసం చిట్కాలు:' : 'Tips for High Accuracy Diagnosis:'}
                    </p>
                    <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-[11px]">
                      <li>
                        {language === 'te'
                          ? 'బాధిత ఆకు లేదా మొక్క భాగాన్ని స్పష్టంగా, దగ్గరగా (close-up) ఫోటో తీయండి.'
                          : 'Take a clear, well-lit close-up shot of the affected leaf, stem, or insect.'}
                      </li>
                      <li>
                        {language === 'te'
                          ? 'నీడలు పడకుండా, వెలుతురు సరిగ్గా ఉండేలా చూడండి.'
                          : 'Avoid heavy shadows and ensure natural sunlight or good lighting.'}
                      </li>
                      <li>
                        {language === 'te'
                          ? 'పురుగులు ఉంటే ఆకు కింది భాగం లేదా కాండం దగ్గర ఫోటో తీయండి.'
                          : 'If insect pests are present, capture their cluster on the underside of leaves or stem.'}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* Image Preview & Analyze Controls */
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Crop symptom preview"
                      className="max-h-72 w-full object-contain mx-auto"
                    />
                    {imageMeta && (
                      <div className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-mono font-bold text-white backdrop-blur-xs">
                        {imageMeta.width}x{imageMeta.height} • {imageMeta.sizeKb} KB
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleReset}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs hover:bg-black/90"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {language === 'te' ? 'మరో ఫోటో' : 'Retake / Change'}
                    </button>
                  </div>

                  {/* Crop and Field Context Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'te' ? 'పంటను ఎంచుకోండి' : 'Crop Context (Optional)'}
                      </label>
                      <select
                        value={selectedCropKey}
                        onChange={(e) => setSelectedCropKey(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-900 dark:text-white shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="auto">
                          ✨ {language === 'te' ? 'చిత్రం నుండి ఆటో-గుర్తింపు' : 'Auto-detect crop from photo'}
                        </option>
                        {crops.map((crop) => (
                          <option key={crop.crop_key} value={crop.crop_key}>
                            {pickLang(crop.name_en, crop.name_te, language)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'te' ? 'క్షేత్ర గమనికలు (ఐచ్ఛికం)' : 'Field Observations (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={fieldNotes}
                        onChange={(e) => setFieldNotes(e.target.value)}
                        placeholder={
                          language === 'te'
                            ? 'ఉదా: ఆకులు పసుపు రంగులోకి మారాయి, కాయ దశ'
                            : 'e.g. Yellowing tips, flowering stage, hopper burn'
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-900 dark:text-white shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleAnalyze}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 px-6 font-black text-white shadow-md transition hover:from-emerald-800 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{loadingStep || (language === 'te' ? 'విశ్లేషిస్తోంది...' : 'Analyzing photo...')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 transition group-hover:scale-110" />
                          <span className="text-sm">
                            {language === 'te' ? 'జెమిని AI తో విశ్లేషించండి' : 'Analyze with Gemini AI'}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRunDemoDiagnosis}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-black text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition mt-2"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{language === 'te' ? 'PJTSAU డేటాబేస్ నిర్ధారణ (API కీ అవసరం లేదు)' : 'Diagnose with Built-in PJTSAU Engine (No API Key Needed)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result View */
            <div className="space-y-4">
              {/* Primary Identification Header */}
              <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${categoryBadgeColor(
                          result.category
                        )}`}
                      >
                        {result.category}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${severityBadgeColor(
                          result.severity
                        )}`}
                      >
                        {result.severity} severity
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-black">
                        <CheckCircle2 className="h-3 w-3" />
                        {result.confidence}% {language === 'te' ? 'ఖచ్చితత్వం' : 'confidence'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight">
                      {pickLang(result.name_en, result.name_te, language)}
                    </h3>

                    {result.scientific_name && (
                      <p className="mt-0.5 text-xs font-semibold italic text-slate-600 dark:text-slate-400">
                        {result.scientific_name}
                      </p>
                    )}

                    <p className="mt-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {language === 'te' ? 'గుర్తించిన పంట:' : 'Detected Crop:'}{' '}
                      <span className="font-black">
                        {pickLang(result.crop_detected_en, result.crop_detected_te, language)}
                      </span>
                      {result.stage_en && (
                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                          • {pickLang(result.stage_en, result.stage_te, language)}
                        </span>
                      )}
                    </p>
                  </div>

                  {imagePreview && (
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                      <img src={imagePreview} alt="Captured crop" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Local Verified Database Match Banner */}
                {result.matched_item && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-100/70 dark:bg-emerald-950/50 p-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <div className="text-xs">
                        <p className="font-black text-emerald-950 dark:text-emerald-100">
                          {language === 'te'
                            ? 'అధికారిక PJTSAU డేటాబేస్ మ్యాచ్ దొరికింది!'
                            : 'Official PJTSAU Verified Item Matched!'}
                        </p>
                        <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                          {language === 'te'
                            ? 'Agronix లో ధృవీకరించబడిన అధికారిక రికార్డు అందుబాటులో ఉంది.'
                            : 'Cross-verified against local Department Crop Doctor knowledge base.'}
                        </p>
                      </div>
                    </div>
                    {onSelectMatchedItem && result.matched_crop_key && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectMatchedItem(result.matched_crop_key!, result.matched_item!);
                          onClose();
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800 shadow-xs"
                      >
                        <span>{language === 'te' ? 'చూడండి' : 'View Card'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Symptoms & Damage Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
                  <p className="font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 text-[11px] mb-1">
                    {language === 'te' ? 'గుర్తించిన లక్షణాలు (Symptoms)' : 'Identified Symptoms'}
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {pickLang(result.symptoms_en, result.symptoms_te, language)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
                  <p className="font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 text-[11px] mb-1">
                    {language === 'te' ? 'నష్టం & దిగుబడి ప్రభావం (Damage)' : 'Crop Damage & Impact'}
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {pickLang(result.damage_en, result.damage_te, language)}
                  </p>
                </div>
              </div>

              {/* Favourable conditions and ETL */}
              {(result.favourable_conditions_en || result.etl) && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs space-y-1.5">
                  {result.etl && (
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      <span className="font-black text-red-700 dark:text-red-400">ETL (ఆర్థిక నష్ట పరిమితి):</span>{' '}
                      {result.etl}
                    </p>
                  )}
                  {result.favourable_conditions_en && (
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      <span className="font-black text-slate-900 dark:text-white">
                        {language === 'te' ? 'అనుకూల పరిస్థితులు:' : 'Favourable Conditions:'}
                      </span>{' '}
                      {pickLang(result.favourable_conditions_en, result.favourable_conditions_te, language)}
                    </p>
                  )}
                </div>
              )}

              {/* Recommendations Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {language === 'te' ? 'నియంత్రణ చర్యలు & పిచికారీ మోతాదులు' : 'Control Measures & Recommended Sprays'}
                </h4>

                <div className="space-y-2.5">
                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3.5 text-xs shadow-xs ${
                        rec.control_type === 'chemical'
                          ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              rec.control_type === 'chemical'
                                ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                            }`}
                          >
                            {rec.control_type}
                          </span>
                          <h5 className="font-black text-slate-950 dark:text-white">
                            {pickLang(rec.title_en, rec.title_te, language)}
                          </h5>
                        </div>
                      </div>

                      <p className="mt-1.5 font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                        {pickLang(rec.description_en, rec.description_te, language)}
                      </p>

                      {/* Chemical Dosage Table */}
                      {rec.control_type === 'chemical' && rec.chemical_name && (
                        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900/80 p-2.5 text-[11px]">
                          <div>
                            <span className="block font-black text-slate-500 dark:text-slate-400">Chemical</span>
                            <span className="font-bold text-slate-900 dark:text-white">{rec.chemical_name}</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-500 dark:text-slate-400">Dose / Litre</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {rec.dose_per_litre || 'Refer label'}
                            </span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-500 dark:text-slate-400">16L Tank</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {rec.dose_per_tank_16l || 'Refer label'}
                            </span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-500 dark:text-slate-400">Waiting Period</span>
                            <span className="font-bold text-amber-700 dark:text-amber-300">
                              {rec.waiting_period || 'Follow label'}
                            </span>
                          </div>
                        </div>
                      )}

                      {rec.safety_note_en && (
                        <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          ⚠️ {pickLang(rec.safety_note_en, rec.safety_note_te, language)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyAdvisory}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-black text-slate-700 dark:text-slate-200 shadow-xs hover:border-emerald-300 hover:text-emerald-700 transition"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> {label('Copy Advisory', language)}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3.5 text-xs font-black text-white shadow-xs hover:bg-green-700 transition"
                >
                  <MessageCircle className="h-4 w-4" /> {label('WhatsApp', language)}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 text-xs font-black text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition"
                >
                  <Camera className="h-4 w-4" /> {language === 'te' ? 'మరో ఫోటో తీయండి' : 'Diagnose Another'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats the AI diagnosis into a clear WhatsApp / clipboard message.
 */
function formatAdvisoryForShare(result: GeminiCropDiagnosisResult, language: LanguageCode): string {
  const crop = pickLang(result.crop_detected_en, result.crop_detected_te, language);
  const name = pickLang(result.name_en, result.name_te, language);
  const symptoms = pickLang(result.symptoms_en, result.symptoms_te, language);

  let msg = `🌿 *AGRONIX - CROP DOCTOR ADVISORY*\n`;
  msg += `🌾 *Crop / పంట:* ${crop}\n`;
  msg += `🔍 *Problem / సమస్య:* ${name} (${result.category.toUpperCase()})\n`;
  if (result.scientific_name) msg += `🔬 *Scientific Name:* ${result.scientific_name}\n`;
  msg += `⚠️ *Severity:* ${result.severity.toUpperCase()} (${result.confidence}% Match)\n\n`;

  msg += `📋 *Symptoms / లక్షణాలు:*\n${symptoms}\n\n`;

  if (result.recommendations?.length) {
    msg += `💊 *Recommended Control / నియంత్రణ చర్యలు:*\n`;
    result.recommendations.forEach((rec, i) => {
      const title = pickLang(rec.title_en, rec.title_te, language);
      const desc = pickLang(rec.description_en, rec.description_te, language);
      msg += `${i + 1}. *[${rec.control_type.toUpperCase()}]* ${title}\n   ${desc}\n`;
      if (rec.chemical_name) {
        msg += `   - Chemical: ${rec.chemical_name}\n`;
        if (rec.dose_per_litre) msg += `   - Dose/L: ${rec.dose_per_litre}\n`;
        if (rec.dose_per_tank_16l) msg += `   - 16L Tank: ${rec.dose_per_tank_16l}\n`;
        if (rec.waiting_period) msg += `   - Pre-harvest Interval: ${rec.waiting_period}\n`;
      }
    });
    msg += `\n`;
  }

  msg += `📌 *Advisory by Agronix Crop Doctor (PJTSAU Guidelines)*`;
  return msg;
}
