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
  FD_NONINFECTIOUS,
  FD_TRAIT_QUESTIONS,
  UNKNOWN_STAGE,
  FdDisease,
  FdDiseaseScore,
  FdSymptomDef,
  FdTraitKey,
  expandPartSelection,
  getDiseasesForCrop,
  getGrowthStages,
  getPlantParts,
  getSymptoms,
  matchTier,
  plantPartLabel,
  scoreDisease,
} from '../data/fieldDiagnosisData';

import { safeStorage } from '../../../shared/lib/safeStorage';
const SAVED_KEY = 'agronix-fd-diagnoses';

interface SavedDiagnosis {
  id: string;
  savedAt: string;
  cropId: string;
  stage: string; // legacy single-stage records
  stages?: string[];
  parts: string[];
  symptomIds: string[];
  partialIds?: string[];
  ruledOutIds?: string[];
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
    const parsed = JSON.parse(safeStorage.getItem(SAVED_KEY) || '[]');
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
  const [stagesSel, setStagesSel] = useState<string[]>([]);
  const [parts, setParts] = useState<string[]>([]);
  const [symptomIds, setSymptomIds] = useState<string[]>([]);
  const [partialIds, setPartialIds] = useState<string[]>([]);
  const [ruledOutIds, setRuledOutIds] = useState<string[]>([]);
  const [symptomQuery, setSymptomQuery] = useState('');
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
  const plantParts = useMemo(() => getPlantParts(cropId), [cropId]);
  const cropSymptoms = useMemo(() => getSymptoms(cropId), [cropId]);
  const cropDiseases = useMemo(() => getDiseasesForCrop(cropId), [cropId]);

  const stageLabel = (code: string) => stages.find((s) => s.code === code)?.label || code;
  const stagesLabel = (codes: string[]) => codes.map(stageLabel).join(', ');

  const visibleSymptoms = useMemo(() => {
    if (parts.length === 0) return [];
    const expanded = expandPartSelection(parts);
    return cropSymptoms.filter((s) => s.parts.some((p) => expanded.has(p)));
  }, [cropSymptoms, parts]);

  // Lesion questions only make sense when a lesion-bearing part is selected.
  const LESION_PARTS = useMemo(
    () =>
      expandPartSelection([
        'LEAF', 'LEAF_SHEATH', 'STEM', 'PETIOLE', 'BOLL', 'POD', 'FRUIT', 'PANICLE', 'GRAIN', 'SQUARE', 'BUD', 'FLOWER', 'BRANCH',
      ]),
    []
  );
  const visibleTraitQuestions = useMemo(() => {
    if (parts.length === 0) return [];
    const lesionSelected = parts.some((p) => LESION_PARTS.has(p));
    return FD_TRAIT_QUESTIONS.filter((q) =>
      lesionSelected ? true : q.key === 'distribution' || q.key === 'severity'
    );
  }, [parts, LESION_PARTS]);

  // Symptoms grouped under each selected part (first-match wins so a symptom
  // never appears twice), then filtered by the search box.
  const symptomGroups = useMemo(() => {
    const query = symptomQuery.trim().toLowerCase();
    const seen = new Set<string>();
    return parts
      .map((code) => {
        const family = expandPartSelection([code]);
        const items = visibleSymptoms.filter((s) => {
          if (seen.has(s.id) || !s.parts.some((p) => family.has(p))) return false;
          if (query && !s.label.toLowerCase().includes(query)) return false;
          seen.add(s.id);
          return true;
        });
        return { code, items };
      })
      .filter((g) => g.items.length > 0);
  }, [parts, visibleSymptoms, symptomQuery]);

  const categories = useMemo(() => Array.from(new Set(FD_CROPS.map((c) => c.category))), []);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const rescore = (symIds: string[], partIds: string[], ruledIds: string[]) => {
    return cropDiseases
      .map((d) =>
        scoreDisease(d, cropSymptoms, {
          selectedSymptomIds: symIds,
          partialSymptomIds: partIds,
          contradictedSymptomIds: ruledIds,
          traitAnswers,
          selectedParts: parts,
          selectedStages: stagesSel,
        })
      )
      .filter((s) => s.hasData && s.score > 0)
      .sort((a, b) => b.score - a.score || a.disease.name.localeCompare(b.disease.name));
  };

  const runDiagnosis = () => {
    const scored = rescore(symptomIds, partialIds, ruledOutIds);
    setResults(scored);
    setCompareIds(scored.slice(0, 3).map((s) => s.disease.id));
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Results-screen refinement: mark a suggested symptom as observed or ruled
  // out and immediately re-rank without leaving the results view.
  const markSymptom = (symId: string, mode: 'present' | 'ruledOut') => {
    const nextSym = mode === 'present' ? Array.from(new Set([...symptomIds, symId])) : symptomIds.filter((id) => id !== symId);
    const nextRuled = mode === 'ruledOut' ? Array.from(new Set([...ruledOutIds, symId])) : ruledOutIds.filter((id) => id !== symId);
    const nextPartial = partialIds.filter((id) => id !== symId);
    setSymptomIds(nextSym);
    setRuledOutIds(nextRuled);
    setPartialIds(nextPartial);
    setResults(rescore(nextSym, nextPartial, nextRuled));
  };

  const saveDiagnosis = () => {
    if (results.length === 0) return;
    const record: SavedDiagnosis = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      cropId,
      stage: stagesSel.join(','),
      stages: stagesSel,
      parts,
      symptomIds,
      partialIds,
      ruledOutIds,
      traitAnswers,
      photoCount: photos.length,
      topResults: results.slice(0, 3).map((r) => ({ diseaseId: r.disease.id, name: r.disease.name, score: r.score })),
    };
    const next = [record, ...saved];
    setSaved(next);
    safeStorage.setItem(SAVED_KEY, JSON.stringify(next));
    showSuccess('Report saved', 'Diagnosis saved to this device.');
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    safeStorage.setItem(SAVED_KEY, JSON.stringify(next));
    showDeleted('Diagnosis deleted');
  };

  const loadSavedRecord = (record: SavedDiagnosis) => {
    setCropId(record.cropId);
    const restoredStages = record.stages || (record.stage ? [record.stage] : []);
    const restoredPartial = record.partialIds || [];
    const restoredRuled = record.ruledOutIds || [];
    setStagesSel(restoredStages);
    setParts(record.parts);
    setSymptomIds(record.symptomIds);
    setPartialIds(restoredPartial);
    setRuledOutIds(restoredRuled);
    setTraitAnswers(record.traitAnswers);
    setPhotos([]);
    const defs = getSymptoms(record.cropId);
    const scored = getDiseasesForCrop(record.cropId)
      .map((d) =>
        scoreDisease(d, defs, {
          selectedSymptomIds: record.symptomIds,
          partialSymptomIds: restoredPartial,
          contradictedSymptomIds: restoredRuled,
          traitAnswers: record.traitAnswers,
          selectedParts: record.parts,
          selectedStages: restoredStages,
        })
      )
      .filter((s) => s.hasData && s.score > 0)
      .sort((a, b) => b.score - a.score || a.disease.name.localeCompare(b.disease.name));
    setResults(scored);
    setCompareIds(scored.slice(0, 3).map((s) => s.disease.id));
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showInfo('Report loaded', 'Saved diagnosis restored.');
  };

  const resetAll = () => {
    setCropId('');
    setStagesSel([]);
    setParts([]);
    setSymptomIds([]);
    setPartialIds([]);
    setRuledOutIds([]);
    setSymptomQuery('');
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
      doc.text(`Growth Stage: ${stagesLabel(stagesSel) || 'Not specified'}`, 14, y);
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
        const sci = r.disease.scientificName ? ` (${r.disease.scientificName})` : '';
        doc.text(`${i + 1}. ${r.disease.name}${sci} — Match score: ${r.score}/100`, 16, y);
        y += 6;
        if (r.matchedSymptoms.length) {
          const line = `    Matched: ${r.matchedSymptoms.join('; ')}`;
          doc.splitTextToSize(line, 175).forEach((l: string) => {
            doc.text(l, 16, y);
            y += 5;
          });
        }
        if (r.ruledOutSymptoms.length) {
          doc.splitTextToSize(`    Ruled out: ${r.ruledOutSymptoms.join('; ')}`, 175).forEach((l: string) => {
            doc.text(l, 16, y);
            y += 5;
          });
        }
        if (r.disease.differentials.length) {
          doc.splitTextToSize(`    Differentials: ${r.disease.differentials.join(', ')}`, 175).forEach((l: string) => {
            doc.text(l, 16, y);
            y += 5;
          });
        }
      });
      if (photos.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 18;
        }
        y += 4;
        doc.setFontSize(11);
        doc.text('Field photographs', 14, y);
        y += 4;
        const imgW = 55;
        const imgH = 42;
        const gridRows = Math.ceil(photos.length / 3);
        if (y + gridRows * (imgH + 6) > 285) {
          doc.addPage();
          y = 18;
        }
        photos.forEach((p, i) => {
          const x = 14 + (i % 3) * (imgW + 6);
          const yy = y + Math.floor(i / 3) * (imgH + 6);
          try {
            doc.addImage(p.dataUrl, 'JPEG', x, yy, imgW, imgH);
          } catch {
            try {
              doc.addImage(p.dataUrl, 'PNG', x, yy, imgW, imgH);
            } catch {
              /* unsupported format — skip */
            }
          }
        });
        y += gridRows * (imgH + 6);
      }
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
    'rounded-2xl border border-teal-200/60 bg-gradient-to-br from-white to-teal-50/50 p-4 shadow-sm dark:border-teal-900/50 dark:bg-none dark:bg-slate-900 sm:p-5';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40';
  const ghostBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

  const stepBadge = (n: number) => (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[11px] font-black text-white">{n}</span>
  );

  const renderStepContent = (s: number) => {
    switch (s) {
      case 1:
        return (
          <div className={stepCard}>
            <div className="mb-3 flex items-center gap-2">
              {stepBadge(1)}
              <Leaf className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Crop</h2>
            </div>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                          className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
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
              <Sprout className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Growth Stage</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {crop?.name} growth stage (you can select multiple)
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700" role="group" aria-label="Select growth stages">
              {stages.map((s) => {
                const checked = stagesSel.includes(s.code);
                return (
                  <label
                    key={s.code}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-b-0 dark:border-slate-800 ${
                      checked ? 'bg-teal-50 dark:bg-teal-950/40' : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(stagesSel, s.code, setStagesSel)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-teal-600"
                    />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {s.label}
                      {s.hint ? <span className="ml-1 text-[11px] font-bold text-slate-400">({s.hint})</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {stagesSel.length > 0 && (
              <p className="mt-2 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                Selected: {stagesLabel(stagesSel)}
              </p>
            )}
          </div>
        );
      case 3:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(3)}
              <Leaf className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Affected Plant Part</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {crop?.name} — Select affected plant part (you can select multiple)
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700" role="group" aria-label="Select affected plant parts">
              {plantParts.map((p) => {
                const checked = parts.includes(p.code);
                return (
                  <label
                    key={p.code}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-b-0 dark:border-slate-800 ${
                      checked ? 'bg-teal-50 dark:bg-teal-950/40' : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(parts, p.code, setParts)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-teal-600"
                    />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.label}</span>
                  </label>
                );
              })}
            </div>
            {parts.length > 0 && (
              <p className="mt-2 text-[11px] font-bold text-teal-700 dark:text-teal-300">
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
              <Stethoscope className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Select Observed Symptoms</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {crop?.name} — {parts.map(plantPartLabel).join(', ') || 'Select plant parts first'} — select the symptoms you observe (you can select multiple)
            </p>
            {visibleSymptoms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {parts.length === 0
                  ? 'Select at least one affected plant part above to see its symptoms.'
                  : 'No symptom records for the selected plant part(s). Try selecting a different part.'}
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="search"
                    value={symptomQuery}
                    onChange={(e) => setSymptomQuery(e.target.value)}
                    placeholder="Search symptoms…"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    aria-label="Search symptoms"
                  />
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                    {symptomGroups.reduce((n, g) => n + g.items.length, 0)} shown · {symptomIds.length} selected
                  </span>
                </div>
                <div className="grid gap-4">
                  {symptomGroups.map((group) => (
                    <div key={group.code}>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-400">
                        {plantPartLabel(group.code)}
                      </p>
                      <div className="grid gap-2">
                        {group.items.map((s: FdSymptomDef) => {
                          const checked = symptomIds.includes(s.id);
                          const isPartial = partialIds.includes(s.id);
                          const isRuledOut = ruledOutIds.includes(s.id);
                          return (
                            <div
                              key={s.id}
                              className={`rounded-xl border-2 transition ${
                                isRuledOut
                                  ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                                  : checked
                                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-950/40'
                                    : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900'
                              }`}
                            >
                              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    toggle(symptomIds, s.id, setSymptomIds);
                                    if (checked) {
                                      setPartialIds((prev) => prev.filter((id) => id !== s.id));
                                    } else {
                                      setRuledOutIds((prev) => prev.filter((id) => id !== s.id));
                                    }
                                  }}
                                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-teal-600"
                                />
                                <span className={`flex-1 text-sm font-semibold ${isRuledOut ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                  {s.label}
                                </span>
                                <button
                                  type="button"
                                  title="Definitely absent — count against diseases that expect it"
                                  aria-pressed={isRuledOut}
                                  onClick={() => {
                                    toggle(ruledOutIds, s.id, setRuledOutIds);
                                    if (!isRuledOut) {
                                      setSymptomIds((prev) => prev.filter((id) => id !== s.id));
                                      setPartialIds((prev) => prev.filter((id) => id !== s.id));
                                    }
                                  }}
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase transition ${
                                    isRuledOut
                                      ? 'border-red-500 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                      : 'border-slate-300 text-slate-400 hover:border-red-400 hover:text-red-600 dark:border-slate-600'
                                  }`}
                                >
                                  Ruled out
                                </button>
                              </label>
                              {checked && (
                                <div className="flex justify-end px-3 pb-2">
                                  <button
                                    type="button"
                                    aria-pressed={isPartial}
                                    onClick={() => toggle(partialIds, s.id, setPartialIds)}
                                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase transition ${
                                      isPartial
                                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                        : 'border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600 dark:border-slate-600'
                                    }`}
                                  >
                                    {isPartial ? 'Partially observed' : 'Mark as partial'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {symptomGroups.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No symptoms match the search.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 5:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(5)}
              <ClipboardList className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Additional Details</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Select symptom characteristics</p>
            {visibleTraitQuestions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Select at least one affected plant part above.
              </p>
            ) : (
            <div className="grid gap-4">
              {visibleTraitQuestions.map((q) => (
                <div key={q.key}>
                  <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{q.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          traitAnswers[q.key] === opt
                            ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`fd-${q.key}`}
                          checked={traitAnswers[q.key] === opt}
                          onChange={() => setTraitAnswers((prev) => ({ ...prev, [q.key]: opt }))}
                          className="h-3.5 w-3.5 accent-teal-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className={stepCard}>
            <div className="mb-1 flex items-center gap-2">
              {stepBadge(6)}
              <ImagePlus className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Upload Photos (Optional)</h2>
            </div>
            <p className="mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Clear and close-up photos help in better diagnosis. Up to 6 photos.
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={p.dataUrl} alt={p.name} className="h-24 w-full object-cover sm:h-28" loading="lazy" decoding="async" />
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
                  className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-teal-400 hover:text-teal-600 dark:border-slate-700 sm:h-28"
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
              <p>Growth Stage: {stagesLabel(stagesSel) || '—'}</p>
              <p>Affected Part: {parts.map(plantPartLabel).join(', ') || '—'}</p>
            </div>
          </div>
          <button type="button" onClick={saveDiagnosis} className={`${primaryBtn} !px-4 !py-2 text-xs`}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Save Report
          </button>
        </div>
      </div>

      {results.length >= 2 && results[0].score - results[1].score < 10 && (
        <div className={`${stepCard} !border-amber-300 dark:!border-amber-800`}>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Close call — verify distinguishing features</p>
          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {results[0].disease.name} and {results[1].disease.name} scored within 10 points.
          </p>
          {[results[0], results[1]].map((r) =>
            r.disease.distinguishing.length > 0 ? (
              <p key={r.disease.id} className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="font-black text-slate-800 dark:text-slate-100">{r.disease.name}:</span> {r.disease.distinguishing.join('; ')}
              </p>
            ) : null
          )}
        </div>
      )}

      {results.length === 0 ? (
        <div className={stepCard}>
          <p className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            No diseases matched the selected symptoms. Try adding more observed symptoms, or the symptom records for this crop may still be under compilation.
          </p>
        </div>
      ) : (
        results.map((r) => {
          const tier = matchTier(r.score);
          return (
            <div key={r.disease.id} className={stepCard}>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {r.disease.name}
                      {r.disease.provisional && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-[9px] font-black uppercase text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Provisional
                        </span>
                      )}
                    </h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${tier.badge}`}>{tier.label}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Score: {r.score} / 100
                    {r.disease.type || r.disease.scientificName
                      ? ` · ${[r.disease.type, r.disease.scientificName].filter(Boolean).join(': ')}`
                      : ''}
                  </p>
                  {r.matchedSymptoms.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-400">Matched symptoms</p>
                      <ul className="mt-0.5 list-inside list-disc text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {r.matchedSymptoms.slice(0, 4).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.missingSymptomIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Check also (tap to refine)</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.missingSymptomIds.slice(0, 4).map((sid) => {
                          const label = cropSymptoms.find((s) => s.id === sid)?.label || sid;
                          return (
                            <span key={sid} className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 text-[10px] font-bold dark:border-slate-700">
                              <button
                                type="button"
                                title="Observed — add to symptoms"
                                onClick={() => markSymptom(sid, 'present')}
                                className="px-2 py-1 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
                              >
                                + {label.length > 46 ? `${label.slice(0, 46)}…` : label}
                              </button>
                              <button
                                type="button"
                                title="Definitely absent — rule out"
                                onClick={() => markSymptom(sid, 'ruledOut')}
                                className="border-l border-slate-200 px-1.5 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/40"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {r.ruledOutSymptoms.length > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">Ruled out by observation: {r.ruledOutSymptoms.join('; ')}</p>
                  )}
                  {r.contradictoryTraits.length > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">Contradictory: {r.contradictoryTraits.join('; ')}</p>
                  )}
                  {r.adjustments.length > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{r.adjustments.join(' · ')}</p>
                  )}
                  {r.disease.differentials.length > 0 && (
                    <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Compare with: {r.disease.differentials.slice(0, 3).join(', ')}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailId(r.disease.id);
                        setDetailTab('overview');
                        setView('details');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-teal-700"
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

      <div className={stepCard}>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Also consider — non-infectious causes</p>
        <div className="grid gap-1.5">
          {FD_NONINFECTIOUS.map((n) => (
            <p key={n.label} className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="font-black text-slate-700 dark:text-slate-200">{n.label}:</span> {n.hint}
            </p>
          ))}
        </div>
      </div>

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
              {(detailDisease.type || detailDisease.scientificName) && (
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {[detailDisease.type, detailDisease.scientificName].filter(Boolean).join(': ')}
                </p>
              )}
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
                    ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-4 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
            {detailTab === 'overview' && (
              <div className="grid gap-3">
                {detailDisease.provisional && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Provisional category — do not treat as a confirmed disease without verified diagnosis.
                  </p>
                )}
                <p>{detailDisease.overview}</p>
                {detailDisease.distinguishing.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Distinguishing features</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {detailDisease.distinguishing.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detailDisease.differentials.length > 0 && (
                  <p className="text-xs">
                    <span className="font-black">Differential diagnosis: </span>
                    {detailDisease.differentials.join(', ')}
                  </p>
                )}
              </div>
            )}
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
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-teal-700 underline dark:text-teal-400">
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
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700 dark:border-slate-700 dark:text-slate-300"
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
      { label: 'Type', render: (d) => d.type || '—' },
      { label: 'Scientific name', render: (d) => d.scientificName || '—' },
      {
        label: 'Lesion shape',
        render: (d) => d.traits.lesionShape?.join(', ') || '—',
      },
      {
        label: 'Lesion centre',
        render: (d) => d.traits.lesionCentre?.join(', ') || '—',
      },
      {
        label: 'Lesion margin',
        render: (d) => d.traits.lesionMargin?.join(', ') || '—',
      },
      {
        label: 'Differential diagnosis',
        render: (d) => d.differentials.join(', ') || '—',
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
                      ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-200'
                      : 'border-slate-200 text-slate-500 hover:border-teal-300 dark:border-slate-700 dark:text-slate-400'
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
                      <th key={d.id} className="border-b border-slate-200 px-3 py-2 font-black text-teal-700 dark:border-slate-700 dark:text-teal-300">
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

      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4">
        {/* Header */}
        <ToolkitPageHeader
          icon={Stethoscope}
          tone="teal-indigo"
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
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800"
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
              <button type="button" onClick={runDiagnosis} disabled={!cropId || symptomIds.length === 0} className={primaryBtn}>
                Get Diagnosis
              </button>
            </div>
            {(!cropId || symptomIds.length === 0) && (
              <p className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {!cropId ? 'Select a crop to begin.' : 'Select at least one observed symptom to run the diagnosis.'}
              </p>
            )}
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
