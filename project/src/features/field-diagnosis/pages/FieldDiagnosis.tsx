import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Columns3,
  Download,
  Eye,
  FileText,
  ImagePlus,
  Leaf,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';

import {
  FD_CROPS,
  FD_PLANT_PARTS,
  FD_TRAIT_QUESTIONS,
  UNKNOWN_STAGE,
  FdDisease,
  FdDiseaseScore,
  FdSymptomDef,
  FdTraitKey,
  getDiseasesForCrop,
  getGrowthStages,
  getSymptoms,
  matchTier,
  plantPartLabel,
  scoreDisease,
} from '../data/fieldDiagnosisData';

const SAVED_KEY = 'agronix-fd-diagnoses';

interface SavedDiagnosis {
  id: string;
  savedAt: string;
  cropId: string;
  stage: string;
  parts: string[];
  symptomIds: string[];
  traitAnswers: Partial<Record<FdTraitKey, string>>;
  photoCount: number;
  topResults: { diseaseId: string; name: string; score: number }[];
}

interface PhotoEntry {
  id: string;
  name: string;
  dataUrl: string;
}

type View = 'wizard' | 'results' | 'details' | 'compare';

const FEATURE_CHIPS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Accurate Diagnosis' },
  { icon: BookOpen, label: 'Scientific Information' },
  { icon: Sprout, label: 'Crop-wise Guidance' },
  { icon: Users, label: 'Farmer Friendly' },
  { icon: CheckCircle2, label: 'Expert Verified' },
];

function loadSaved(): SavedDiagnosis[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cropById(id: string) {
  return FD_CROPS.find((c) => c.id === id);
}

export function FieldDiagnosis() {
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showInfo, showDeleted, showWarning } = useToast();

  const [view, setView] = useState<View>('wizard');
  const [cropId, setCropId] = useState('');
  const [stage, setStage] = useState('');
  const [parts, setParts] = useState<string[]>([]);
  const [symptomIds, setSymptomIds] = useState<string[]>([]);
  const [traitAnswers, setTraitAnswers] = useState<Partial<Record<FdTraitKey, string>>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [results, setResults] = useState<FdDiseaseScore[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'symptoms' | 'management'>('overview');
  const [saved, setSaved] = useState<SavedDiagnosis[]>(() => loadSaved());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const crop = cropById(cropId);
  const stages = useMemo(() => (cropId ? getGrowthStages(cropId) : []), [cropId]);
  const cropSymptoms = useMemo(() => getSymptoms(cropId), [cropId]);
  const cropDiseases = useMemo(() => getDiseasesForCrop(cropId), [cropId]);

  const visibleSymptoms = useMemo(() => {
    if (parts.length === 0) return cropSymptoms;
    const selected = new Set(parts);
    return cropSymptoms.filter((s) => s.parts.some((p) => selected.has(p)));
  }, [cropSymptoms, parts]);

  const categories = useMemo(() => Array.from(new Set(FD_CROPS.map((c) => c.category))), []);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const runDiagnosis = () => {
    const scored = cropDiseases
      .map((d) => scoreDisease(d, cropSymptoms, { selectedSymptomIds: symptomIds, traitAnswers }))
      .filter((s) => s.hasData)
      .sort((a, b) => b.score - a.score || a.disease.name.localeCompare(b.disease.name));
    setResults(scored);
    setCompareIds(scored.slice(0, 3).map((s) => s.disease.id));
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveDiagnosis = () => {
    if (results.length === 0) return;
    const record: SavedDiagnosis = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      cropId,
      stage,
      parts,
      symptomIds,
      traitAnswers,
      photoCount: photos.length,
      topResults: results.slice(0, 3).map((r) => ({ diseaseId: r.disease.id, name: r.disease.name, score: r.score })),
    };
    const next = [record, ...saved];
    setSaved(next);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    showSuccess('Report saved', 'Diagnosis saved to this device.');
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    showDeleted('Diagnosis deleted');
  };

  const loadSavedRecord = (record: SavedDiagnosis) => {
    setCropId(record.cropId);
    setStage(record.stage);
    setParts(record.parts);
    setSymptomIds(record.symptomIds);
    setTraitAnswers(record.traitAnswers);
    setPhotos([]);
    const defs = getSymptoms(record.cropId);
    const scored = getDiseasesForCrop(record.cropId)
      .map((d) => scoreDisease(d, defs, { selectedSymptomIds: record.symptomIds, traitAnswers: record.traitAnswers }))
      .filter((s) => s.hasData)
      .sort((a, b) => b.score - a.score || a.disease.name.localeCompare(b.disease.name));
    setResults(scored);
    setCompareIds(scored.slice(0, 3).map((s) => s.disease.id));
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showInfo('Report loaded', 'Saved diagnosis restored.');
  };

  const resetAll = () => {
    setCropId('');
    setStage('');
    setParts([]);
    setSymptomIds([]);
    setTraitAnswers({});
    setPhotos([]);
    setResults([]);
    setDetailId(null);
    setCompareIds([]);
    setView('wizard');
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - photos.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPhotos((prev) =>
            prev.length >= 6 ? prev : [...prev, { id: `${Date.now()}-${file.name}`, name: file.name, dataUrl: String(reader.result) }]
          );
        };
        reader.readAsDataURL(file);
      });
  };

  const detailDisease: FdDisease | undefined = cropDiseases.find((d) => d.id === detailId);
  const detailScore = results.find((r) => r.disease.id === detailId);
  const compareDiseases = compareIds
    .map((id) => results.find((r) => r.disease.id === id)?.disease)
    .filter((d): d is FdDisease => Boolean(d));

  const generateReport = async () => {
    if (results.length === 0 || isGeneratingReport) return;
    setIsGeneratingReport(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let y = 18;
      doc.setFontSize(16);
      doc.text('AGRONIX — Field Diagnosis Report', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, y);
      y += 8;
      doc.setTextColor(20);
      doc.setFontSize(11);
      doc.text(`Crop: ${crop?.name || '—'}`, 14, y);
      y += 6;
      doc.text(`Growth Stage: ${stage || 'Not specified'}`, 14, y);
      y += 6;
      doc.text(`Affected Parts: ${parts.map(plantPartLabel).join(', ') || '—'}`, 14, y);
      y += 6;
      doc.text(`Photos attached: ${photos.length}`, 14, y);
      y += 10;
      doc.setFontSize(12);
      doc.text('Possible Diseases (ranked by symptom match)', 14, y);
      y += 7;
      doc.setFontSize(10);
      results.slice(0, 6).forEach((r, i) => {
        if (y > 275) {
          doc.addPage();
          y = 18;
        }
        doc.text(`${i + 1}. ${r.disease.name} (${r.disease.scientificName}) — Match score: ${r.score}/100`, 16, y);
        y += 6;
        if (r.matchedSymptoms.length) {
          const line = `    Matched: ${r.matchedSymptoms.join('; ')}`;
          doc.splitTextToSize(line, 175).forEach((l: string) => {
            doc.text(l, 16, y);
            y += 5;
          });
        }
      });
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(110);
      doc.splitTextToSize(
        'Match scores indicate symptom agreement only and are not validated disease probabilities. Confirm with a local agriculture officer before treatment.',
        182
      ).forEach((l: string) => {
        doc.text(l, 14, y);
        y += 4;
      });
      doc.save(`Field_Diagnosis_${crop?.name?.replace(/[^a-z0-9]+/gi, '_') || 'report'}.pdf`);
      showSuccess('Report downloaded');
    } catch (error) {
      console.error('Report generation failed:', error);
      showWarning('Report failed', 'Could not generate the PDF report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const stepCard =
    'rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900 sm:p-5';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40';
  const ghostBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

  const stepBadge = (n: number) => (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">{n}</span>
  );

  const renderStepContent = (s: number) => {
    switch (s) {
      case 1:
        return (
          <div className={stepCard}>
            <div className="mb-3 flex items-center gap-2">
              {stepBadge(1)}
              <Leaf className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Crop</h2>
            </div>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              aria-label="Select crop"
            >
              <option value="">Select crop…</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {FD_CROPS.filter((c) => c.category === cat).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {getDiseasesForCrop(c.id).length === 0 ? ' (data in progress)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {saved.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Saved Diagnoses</h3>
                <div className="grid gap-2">
                  {saved.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          {cropById(s.cropId)?.name || s.cropId} — {s.topResults[0]?.name || 'No result'}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {new Date(s.savedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => loadSavedRecord(s)}
                          className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          aria-label="Open saved diagnosis"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(s.id)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          aria-label="Delete saved diagnosis"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(2)}
              <Sprout className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Growth Stage</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{crop?.name} growth stage</p>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              aria-label="Select growth stage"
            >
              <option value="">Select growth stage…</option>
              {stages.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                  {s.hint ? ` (${s.hint})` : ''}
                </option>
              ))}
            </select>
          </div>
        );
      case 3:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(3)}
              <Leaf className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Affected Plant Part</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {crop?.name} — Select affected plant part (you can select multiple)
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700" role="group" aria-label="Select affected plant parts">
              {FD_PLANT_PARTS.map((p) => {
                const checked = parts.includes(p.code);
                return (
                  <label
                    key={p.code}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-b-0 dark:border-slate-800 ${
                      checked ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(parts, p.code, setParts)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.label}</span>
                  </label>
                );
              })}
            </div>
            {parts.length > 0 && (
              <p className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                Selected: {parts.map(plantPartLabel).join(', ')}
              </p>
            )}
          </div>
        );
      case 4:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(4)}
              <Stethoscope className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Observed Symptoms</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {crop?.name} — {parts.map(plantPartLabel).join(', ') || 'All parts'} — select the symptoms you observe (you can select multiple)
            </p>
            {visibleSymptoms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Symptom records for this crop are being compiled from TNAU references. You can continue — the ranked list will show diseases once data is available.
              </p>
            ) : (
              <div className="grid gap-2">
                {visibleSymptoms.map((s: FdSymptomDef) => {
                  const checked = symptomIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${
                        checked
                          ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                          : 'border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(symptomIds, s.id, setSymptomIds)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(5)}
              <ClipboardList className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Additional Details</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Select symptom characteristics</p>
            <div className="grid gap-4">
              {FD_TRAIT_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{q.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          traitAnswers[q.key] === opt
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`fd-${q.key}`}
                          checked={traitAnswers[q.key] === opt}
                          onChange={() => setTraitAnswers((prev) => ({ ...prev, [q.key]: opt }))}
                          className="h-3.5 w-3.5 accent-emerald-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(6)}
              <ImagePlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Upload Photos (Optional)</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Clear and close-up photos help in better diagnosis. Up to 6 photos.
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={p.dataUrl} alt={p.name} className="h-24 w-full object-cover sm:h-28" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 sm:h-28"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px] font-bold">{photos.length === 0 ? 'Add photos' : 'Add more'}</span>
                </button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderResults = () => (
    <div className="grid gap-4">
      <div className={stepCard}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Field Diagnosis Results</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <div className="mt-2 space-y-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <p>Crop: {crop?.name || '—'}</p>
              <p>Growth Stage: {stages.find((s) => s.code === stage)?.label || stage || '—'}</p>
              <p>Affected Part: {parts.map(plantPartLabel).join(', ') || '—'}</p>
            </div>
          </div>
          <button type="button" onClick={saveDiagnosis} className={`${primaryBtn} !px-4 !py-2 text-xs`}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Save Report
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className={stepCard}>
          <p className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            No disease records available for this crop yet. The TNAU symptom database for this crop is being compiled.
          </p>
        </div>
      ) : (
        results.map((r) => {
          const tier = matchTier(r.score);
          return (
            <div key={r.disease.id} className={stepCard}>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{r.disease.name}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${tier.badge}`}>{tier.label}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Score: {r.score} / 100 · {r.disease.type}: {r.disease.scientificName}
                  </p>
                  {r.matchedSymptoms.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Matched symptoms</p>
                      <ul className="mt-0.5 list-inside list-disc text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {r.matchedSymptoms.slice(0, 4).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.contradictoryTraits.length > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">Contradictory: {r.contradictoryTraits.join('; ')}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailId(r.disease.id);
                        setDetailTab('overview');
                        setView('details');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('compare')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Columns3 className="h-3.5 w-3.5" />
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={() => setView('wizard')} className={ghostBtn}>
          <ChevronLeft className="h-4 w-4" />
          Back to Form
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={generateReport} disabled={isGeneratingReport || results.length === 0} className={primaryBtn}>
            <FileText className="h-4 w-4" />
            {isGeneratingReport ? 'Generating...' : 'PDF Report'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (!detailDisease) return null;
    const tabs = [
      { id: 'overview' as const, label: 'Overview' },
      { id: 'symptoms' as const, label: 'Symptoms' },
      { id: 'management' as const, label: 'Management' },
    ];
    const stageLabels = detailDisease.stages.includes(UNKNOWN_STAGE)
      ? 'Not specified'
      : detailDisease.stages.map((s) => stages.find((x) => x.code === s)?.label || s).join(', ');
    const similar = results.filter((r) => r.disease.id !== detailDisease.id).slice(0, 4);
    return (
      <div className="grid gap-4">
        <div className={stepCard}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">{detailDisease.name}</h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {detailDisease.type}: {detailDisease.scientificName}
              </p>
            </div>
            {detailScore && (
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${matchTier(detailScore.score).badge}`}>
                {matchTier(detailScore.score).label}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-1 border-b border-slate-100 dark:border-slate-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDetailTab(t.id)}
                className={`px-3 py-2 text-xs font-bold transition ${
                  detailTab === t.id
                    ? 'border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-4 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
            {detailTab === 'overview' && <p>{detailDisease.overview}</p>}
            {detailTab === 'symptoms' && (
              <div className="grid gap-3">
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Symptoms on affected parts</p>
                  <ul className="list-inside list-disc space-y-1">
                    {Object.keys(detailDisease.symptomWeights).map((sid) => (
                      <li key={sid}>{cropSymptoms.find((s) => s.id === sid)?.label || sid}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs"><span className="font-black">Plant parts:</span> {detailDisease.parts.map(plantPartLabel).join(', ')}</p>
                <p className="text-xs"><span className="font-black">Stage of occurrence:</span> {stageLabels}</p>
              </div>
            )}
            {detailTab === 'management' && (
              <div className="grid gap-2">
                <p>Confirm diagnosis with your local Mandal Agriculture Officer before applying any treatment. Management recommendations should follow the latest official advisory for your district.</p>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Reference sources</p>
                  <ul className="grid gap-1">
                    {detailDisease.references.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-700 underline dark:text-emerald-400">
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          {similar.length > 0 && (
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Similar diseases</p>
              <div className="flex flex-wrap gap-1.5">
                {similar.map((r) => (
                  <button
                    key={r.disease.id}
                    type="button"
                    onClick={() => {
                      setDetailId(r.disease.id);
                      setDetailTab('overview');
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    {r.disease.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => setView('results')} className={ghostBtn}>
            <ChevronLeft className="h-4 w-4" />
            Back to Results
          </button>
          <button type="button" onClick={() => setView('compare')} className={primaryBtn}>
            <Columns3 className="h-4 w-4" />
            Compare Diseases
          </button>
        </div>
      </div>
    );
  };

  const renderCompare = () => {
    const rows: { label: string; render: (d: FdDisease) => string }[] = [
      { label: 'Type', render: (d) => d.type },
      { label: 'Scientific name', render: (d) => d.scientificName },
      {
        label: 'Lesion shape',
        render: (d) => d.traits.lesionShape?.join(', ') || '—',
      },
      {
        label: 'Lesion centre',
        render: (d) => d.traits.lesionCentre?.join(', ') || '—',
      },
      {
        label: 'Distribution',
        render: (d) => d.traits.distribution?.join(', ') || '—',
      },
      {
        label: 'Plant parts',
        render: (d) => d.parts.map(plantPartLabel).join(', '),
      },
      {
        label: 'Stage of occurrence',
        render: (d) =>
          d.stages.includes(UNKNOWN_STAGE) ? 'Not specified' : d.stages.map((s) => stages.find((x) => x.code === s)?.label || s).join(', '),
      },
      {
        label: 'Field appearance',
        render: (d) => d.overview,
      },
    ];
    return (
      <div className="grid gap-4">
        <div className={stepCard}>
          <h2 className="mb-1 text-base font-black text-slate-900 dark:text-white">Compare Diseases</h2>
          <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Compare key symptoms to differentiate</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {results.map((r) => {
              const active = compareIds.includes(r.disease.id);
              return (
                <button
                  key={r.disease.id}
                  type="button"
                  onClick={() => setCompareIds((prev) => (active ? prev.filter((id) => id !== r.disease.id) : [...prev, r.disease.id]))}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {r.disease.name}
                </button>
              );
            })}
          </div>
          {compareDiseases.length === 0 ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-400">Select diseases above to compare.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 font-black text-slate-500 dark:border-slate-700 dark:text-slate-400">Feature</th>
                    {compareDiseases.map((d) => (
                      <th key={d.id} className="border-b border-slate-200 px-3 py-2 font-black text-emerald-700 dark:border-slate-700 dark:text-emerald-300">
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-bold text-slate-600 dark:text-slate-300">{row.label}</td>
                      {compareDiseases.map((d) => (
                        <td key={d.id} className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">
                          {row.render(d)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          <button type="button" onClick={() => setView('results')} className={ghostBtn}>
            <ChevronLeft className="h-4 w-4" />
            Back to Results
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete saved diagnosis?"
        message="This record will be removed permanently."
        onConfirm={() => {
          if (deleteConfirm) deleteSaved(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4">
        {/* Header */}
        <ToolkitPageHeader
          icon={Stethoscope}
          tone="emerald"
          variant="solid"
          eyebrow="Officer Toolkit"
          title="Field Diagnosis"
          subtitle="Identify Crop Diseases by Symptoms – For Better Decisions"
          fallbackPath="/officer-toolkit"
          onBack={() => navigate('/officer-toolkit')}
        />
        {/* Feature chips */}
        <div className="mb-4 flex flex-wrap justify-center gap-1.5">
          {FEATURE_CHIPS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800"
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        {view === 'wizard' && (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <React.Fragment key={s}>{renderStepContent(s)}</React.Fragment>
            ))}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={resetAll} className={ghostBtn}>
                Reset
              </button>
              <button type="button" onClick={runDiagnosis} disabled={!cropId} className={primaryBtn}>
                Get Diagnosis
              </button>
            </div>
          </div>
        )}
        {view === 'results' && renderResults()}
        {view === 'details' && renderDetails()}
        {view === 'compare' && renderCompare()}

        <p className="mt-6 text-center text-[10px] font-semibold leading-relaxed text-slate-400 dark:text-slate-500">
          Symptom records sourced from the TNAU Agritech Crop Protection Portal. Match scores show symptom agreement only —
          not a validated disease probability. Verify with a local agriculture officer before treatment.
        </p>
      </div>
    </div>
  );
}

export default FieldDiagnosis;
