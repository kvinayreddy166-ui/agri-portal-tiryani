import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, Leaf, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';
import { analyzeCropImage } from '../lib/cropDiseaseModel';

export function CropDiagnosis() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ label: string; confidence: number; tip: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(
        t(
          'Camera permission denied or unavailable. Upload a photo instead.',
          'కెమెరా అనుమతి లేదు. ఫోటో అప్లోడ్ చేయండి.'
        )
      );
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    stopCamera();
    await runAnalysis(canvas);
  };

  const handleFileUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = async () => {
      await runAnalysis(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const runAnalysis = async (source: HTMLCanvasElement | HTMLImageElement) => {
    setAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeCropImage(source as HTMLImageElement);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      alert('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('AI Tools', 'ఏఐ సాధనాలు')}
        title={t('Crop Disease Detection', 'పంట వ్యాధి గుర్తింపు')}
        description={t(
          'Capture or upload a crop photo for pest/disease screening and management advice.',
          'పంట ఫోటో తీసి లేదా అప్లోడ్ చేసి వ్యాధి/పురుగు పరీక్ష మరియు సలహా పొందండి.'
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="portal-card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <Camera className="h-5 w-5 text-emerald-600" />
            {t('Camera Capture', 'కెమెరా')}
          </h2>

          {cameraError && (
            <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {cameraError}
            </p>
          )}

          {!previewUrl && (
            <div className="overflow-hidden rounded-xl bg-slate-900">
              <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
            </div>
          )}

          {previewUrl && (
            <img src={previewUrl} alt="Crop" className="w-full rounded-xl object-cover aspect-video" />
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex flex-wrap gap-2">
            {!stream && !previewUrl && (
              <button
                type="button"
                onClick={startCamera}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                {t('Enable Camera', 'కెమెరా ప్రారంభించండి')}
              </button>
            )}
            {stream && (
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                {t('Capture Photo', 'ఫోటో తీయండి')}
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-600 dark:text-white"
            >
              <Upload className="h-4 w-4" />
              {t('Upload Photo', 'ఫోటో అప్లోడ్')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setResult(null);
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                {t('Reset', 'రీసెట్')}
              </button>
            )}
          </div>
        </div>

        <div className="portal-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <Leaf className="h-5 w-5 text-emerald-600" />
            {t('Analysis Result', 'విశ్లేషణ ఫలితం')}
          </h2>

          {analyzing && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-emerald-600" />
              <p>{t('Analyzing image...', 'చిత్రం విశ్లేషిస్తోంది...')}</p>
            </div>
          )}

          {!analyzing && !result && (
            <p className="py-16 text-center text-slate-500">
              {t('Capture or upload a crop leaf photo to begin.', 'పంట ఆకు ఫోటో తీసి ప్రారంభించండి.')}
            </p>
          )}

          {result && !analyzing && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                <p className="text-sm text-slate-500">{t('Detected condition', 'గుర్తించిన స్థితి')}</p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{result.label}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t('Confidence', 'నమ్మకం')}: {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t('Recommended management', 'సిఫార్సు చేసిన నిర్వహణ')}
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{result.tip}</p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t(
                  'AI screening is advisory. Confirm with MAO/lab before major pesticide applications.',
                  'ఏఐ స్క్రీనింగ్ సలహా మాత్రమే. పెద్ద మోతాదులో మందులు వేసే ముందు MAO/ల్యాబ్ నిర్ధారించండి.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
