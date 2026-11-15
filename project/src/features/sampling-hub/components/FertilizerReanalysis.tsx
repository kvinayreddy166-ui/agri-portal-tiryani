import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FileUp,
  FlaskConical,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { FertilizerPdfValues } from '../lib/statutoryFertilizerPdf';
import {
  generateCombinedReanalysisPdf,
  generateCoveringLetterPdf,
  generateDeclarationPdf,
  generateScnPdf,
} from '../lib/reanalysisPdf';
import {
  deleteReanalysisCase,
  emptyReanalysisCase,
  getReanalysisCase,
  listReanalysisCases,
  saveReanalysisCase,
  type ReanalysisCase,
  type ReanalysisDeclarationValues,
  type ReanalysisLetterItem,
  type ReanalysisSourceSample,
  type ReanalysisUpload,
  type ReanalysisUploadKind,
} from '../lib/reanalysisStore';
import { OfficerDocumentArchiveService } from '../../officers-toolkit/services/officerDocumentArchiveService';
import { validatePdf } from '../../../shared/utils/pdfHelpers';
import { downloadBlob } from '../../../shared/utils/fileCleanup';
import { useAuth } from '../../../shared/context/AuthContext';
import { safeStorage } from '../../../shared/lib/safeStorage';

const FERT_DRAFT_KEY = 'tiryani-fertilizer-forms-draft';
const FERT_DRAFTS_KEY = 'tiryani-fertilizer-forms-named-drafts';
const CL_DETAILS_KEY = 'tiryani-covering-letter-details';

/** In-session cache of upload blobs so the combined PDF can include them. */
const uploadBlobCache = new Map<string, Blob>();

const UPLOAD_KINDS: { kind: ReanalysisUploadKind; label: string; hint: string }[] = [
  { kind: 'formL', label: 'Form L — Analysis Report', hint: 'Lab analysis report PDF' },
  { kind: 'dealerReply', label: 'Dealer Reply / Reanalysis Request', hint: 'Dealer correspondence PDF' },
  { kind: 'receipt', label: 'Bharatkosh Receipt', hint: 'Reanalysis fee receipt PDF' },
  { kind: 'other', label: 'Other Document', hint: 'Any supporting PDF' },
];

function sampleFromValues(v: FertilizerPdfValues, source: ReanalysisSourceSample['source']): ReanalysisSourceSample {
  return {
    sampleCode: v.sampleCode || v.codeNumber || '',
    fertilizerName: v.fertilizerTypeGrade || v.nameGrade || '',
    dealerName: v.dealerName || '',
    dealerAddress: [v.dealerAddress, v.premisesLocation].filter(Boolean).join(', ') || v.dealerNameAddress || '',
    samplingDate: v.samplingDate || v.date || '',
    quantity: v.stockPosition || v.physicalCondition || '',
    source,
  };
}

function officerPrefill(v: FertilizerPdfValues | null) {
  return {
    name: v?.officerName || '',
    designation: v?.designation || '',
    place: v?.place || '',
    officeAddress: v?.officeAddress || '',
  };
}

interface FertilizerDraftEntry {
  name: string;
  values: Partial<FertilizerPdfValues>;
  updatedAt?: string;
}

function loadFertilizerDrafts(userId?: string): FertilizerDraftEntry[] {
  try {
    const key = userId ? `${FERT_DRAFTS_KEY}_${userId}` : FERT_DRAFTS_KEY;
    const raw = safeStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as FertilizerDraftEntry[];
    }
  } catch { /* ignore */ }
  try {
    const raw = safeStorage.getItem(FERT_DRAFT_KEY);
    if (raw) {
      const values = JSON.parse(raw) as FertilizerPdfValues;
      return [{ name: values.sampleCode || 'Auto-saved draft', values, updatedAt: undefined }];
    }
  } catch { /* ignore */ }
  return [];
}

function slug(s: string) {
  return s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'case';
}

export function FertilizerReanalysis({
  onClose,
  initialValues,
}: {
  onClose: () => void;
  initialValues?: FertilizerPdfValues | null;
}) {
  const { user } = useAuth();
  const [cases, setCases] = useState<ReanalysisCase[]>(() => listReanalysisCases());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<FertilizerDraftEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [declTab, setDeclTab] = useState<'dealer' | 'inspector' | 'authority'>('dealer');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const active = useMemo(
    () => (activeId ? cases.find((c) => c.id === activeId) ?? null : null),
    [cases, activeId]
  );

  useEffect(() => {
    setDrafts(loadFertilizerDrafts(user?.id));
  }, [user?.id]);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const persist = (next: ReanalysisCase) => {
    const saved = saveReanalysisCase(next);
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setActiveId(saved.id);
  };

  const patch = (fn: (c: ReanalysisCase) => ReanalysisCase) => {
    if (!active) return;
    persist(fn({ ...active, sample: { ...active.sample }, uploads: [...active.uploads], declarations: { ...active.declarations }, scn: { ...active.scn }, letter: { ...active.letter, items: [...active.letter.items] } }));
  };

  const newCase = (sample?: Partial<ReanalysisSourceSample>) => {
    const base = emptyReanalysisCase(sample);
    try {
      const cl = JSON.parse(safeStorage.getItem(CL_DETAILS_KEY) || 'null');
      if (cl) {
        base.letter = {
          ...base.letter,
          financialYear: cl.year || base.letter.financialYear,
          letterNumber: cl.letterNumber || base.letter.letterNumber,
          letterDate: cl.letterDate || base.letter.letterDate,
          authorityType: cl.authorityType === 'DAO' ? 'DAO' : base.letter.authorityType,
          memoNumber: cl.daoMemoNumber || base.letter.memoNumber,
          memoDate: cl.daoMemoDate || base.letter.memoDate,
          division: cl.division || base.letter.division,
        };
      }
    } catch { /* ignore */ }
    if (initialValues) {
      const pre = officerPrefill(initialValues);
      base.declarations.dealer = { ...base.declarations.dealer, ...pre };
      base.declarations.inspector = { ...base.declarations.inspector, name: pre.name, designation: pre.designation, place: pre.place };
      base.declarations.authority = { ...base.declarations.authority, name: pre.name, designation: pre.designation, place: pre.place };
      base.scn = { ...base.scn, officerName: pre.name, designation: pre.designation, officeAddress: pre.officeAddress };
      base.letter = {
        ...base.letter,
        letterNumber: initialValues.letterNumber || base.letter.letterNumber,
        letterDate: initialValues.letterDate || base.letter.letterDate,
        financialYear: initialValues.financialYear || base.letter.financialYear,
        authorityType: initialValues.authorityType || base.letter.authorityType,
        memoNumber: initialValues.memoNumber || base.letter.memoNumber,
        memoDate: initialValues.memoDate || base.letter.memoDate,
        division: initialValues.division || base.letter.division,
      };
      base.title = `Reanalysis — ${sample?.sampleCode || initialValues.sampleCode || 'New'}`;
    }
    persist(base);
  };

  const openCase = (id: string) => {
    const c = getReanalysisCase(id);
    if (c) {
      setCases(listReanalysisCases());
      setActiveId(c.id);
    }
  };

  const loadDraftIntoCase = (draft: FertilizerDraftEntry) => {
    if (!active) return;
    const v = draft.values as FertilizerPdfValues;
    patch((c) => ({
      ...c,
      sample: sampleFromValues(v, 'draft'),
      title: `Reanalysis — ${v.sampleCode || draft.name}`,
      scn: { ...c.scn, officerName: v.officerName || c.scn.officerName, designation: v.designation || c.scn.designation, officeAddress: v.officeAddress || c.scn.officeAddress },
      letter: { ...c.letter, financialYear: v.financialYear || c.letter.financialYear, authorityType: v.authorityType || c.letter.authorityType, memoNumber: v.memoNumber || c.letter.memoNumber, memoDate: v.memoDate || c.letter.memoDate, division: v.division || c.letter.division },
    }));
    flash('ok', `Loaded Form J/K/P details from draft "${draft.name}"`);
  };

  const loadCurrentForm = () => {
    if (!active || !initialValues) return;
    const v = initialValues;
    patch((c) => ({
      ...c,
      sample: sampleFromValues(v, 'draft'),
      title: `Reanalysis — ${v.sampleCode || 'Current form'}`,
    }));
    flash('ok', 'Linked the current Form J/K/P details to this case');
  };

  // ---------- uploads ----------
  const handleUpload = async (kind: ReanalysisUploadKind, file: File | undefined) => {
    if (!file || !active) return;
    setBusy(`upload-${kind}`);
    try {
      await validatePdf(file);
      const result = await OfficerDocumentArchiveService.archiveGeneratedDocument(file, {
        filename: file.name,
        documentCategory: 'sample',
        documentNumber: active.sample.sampleCode || undefined,
        documentDate: new Date().toISOString().slice(0, 10),
        sourceModule: 'fertilizer-reanalysis',
        fileFormat: 'pdf',
        mimeType: file.type || 'application/pdf',
        metadata: { reanalysisCaseId: active.id, uploadKind: kind, sampleCode: active.sample.sampleCode },
      });
      const upload: ReanalysisUpload = {
        id: crypto.randomUUID(),
        kind,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        archivedId: result.documentId || undefined,
        addedAt: new Date().toISOString(),
      };
      uploadBlobCache.set(upload.id, file);
      patch((c) => ({ ...c, uploads: [...c.uploads.filter((u) => u.kind !== kind || kind === 'other'), upload] }));
      flash('ok', `${UPLOAD_KINDS.find((k) => k.kind === kind)?.label ?? 'Document'} uploaded & archived`);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
      const input = fileInputs.current[kind];
      if (input) input.value = '';
    }
  };

  const removeUpload = (id: string) => {
    uploadBlobCache.delete(id);
    patch((c) => ({ ...c, uploads: c.uploads.filter((u) => u.id !== id) }));
  };

  // ---------- PDF generation ----------
  const downloadPdf = async (key: string, docPromise: Promise<Awaited<ReturnType<typeof generateScnPdf>>>, name: string) => {
    setBusy(key);
    try {
      const doc = await docPromise;
      const blob = doc.output('blob');
      const fileName = `${slug(name)}_${active?.sample.sampleCode || 'reanalysis'}.pdf`;
      downloadBlob(blob, fileName);
      await OfficerDocumentArchiveService.archiveGeneratedDocument(blob, {
        filename: fileName,
        documentCategory: 'notice',
        documentNumber: active?.sample.sampleCode || undefined,
        sourceModule: 'fertilizer-reanalysis',
        fileFormat: 'pdf',
        mimeType: 'application/pdf',
        metadata: { reanalysisCaseId: active?.id, docKind: key },
      });
      flash('ok', 'PDF downloaded & archived');
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'PDF generation failed');
    } finally {
      setBusy(null);
    }
  };

  const resolveUploadBlob = async (u: ReanalysisUpload): Promise<Blob | null> => {
    const cached = uploadBlobCache.get(u.id);
    if (cached) return cached;
    if (!u.archivedId) return null;
    try {
      const records = await OfficerDocumentArchiveService.fetchOfficerDocuments();
      const rec = records.find((r) => r.id === u.archivedId);
      if (!rec) return null;
      const url = await OfficerDocumentArchiveService.previewDocument(rec);
      const res = await fetch(url);
      URL.revokeObjectURL(url);
      if (!res.ok) return null;
      return res.blob();
    } catch {
      return null;
    }
  };

  const downloadCombined = async () => {
    if (!active) return;
    setBusy('combined');
    try {
      const extras: { name: string; blob: Blob }[] = [];
      for (const u of active.uploads) {
        const blob = await resolveUploadBlob(u);
        if (blob && blob.type.includes('pdf')) extras.push({ name: u.name, blob });
      }
      const blob = await generateCombinedReanalysisPdf(active, extras);
      const fileName = `Reanalysis_Case_ALL_${slug(active.sample.sampleCode || active.title)}.pdf`;
      downloadBlob(blob, fileName);
      await OfficerDocumentArchiveService.archiveGeneratedDocument(blob, {
        filename: fileName,
        documentCategory: 'sample',
        documentNumber: active.sample.sampleCode || undefined,
        sourceModule: 'fertilizer-reanalysis',
        fileFormat: 'pdf',
        mimeType: 'application/pdf',
        metadata: { reanalysisCaseId: active.id, combined: true },
      });
      flash('ok', `Combined case PDF downloaded${extras.length ? ` with ${extras.length} upload(s)` : ''}`);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Combined PDF failed');
    } finally {
      setBusy(null);
    }
  };

  // ---------- render helpers ----------
  const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  const labelCls = 'mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const cardCls = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900';

  const Field = ({ label, value, onChange, textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      {textarea ? (
        <textarea className={`${inputCls} min-h-[70px] resize-y`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );

  const SectionTitle = ({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string }) => (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white">{title}</h4>
        {sub && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </div>
  );

  const declValue = active?.declarations[declTab] ?? null;
  const setDecl = (patchDecl: Partial<ReanalysisDeclarationValues>) => {
    patch((c) => ({ ...c, declarations: { ...c.declarations, [declTab]: { ...c.declarations[declTab], ...patchDecl } } }));
  };

  // ---------- main render ----------
  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-slate-950/70 backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-950 sm:m-3 sm:rounded-2xl lg:flex-row">
        {/* Sidebar: cases */}
        <aside className="flex max-h-[38vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Reanalysis Cases</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{cases.length} saved</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {cases.length === 0 && (
              <p className="px-2 py-6 text-center text-xs font-medium text-slate-400">No reanalysis cases yet. Create one to begin.</p>
            )}
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openCase(c.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                  activeId === c.id
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <FlaskConical className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{c.sample.sampleCode || c.title}</span>
                  <span className="block truncate text-[10px] text-slate-400">{c.sample.fertilizerName || c.sample.dealerName || '—'}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => newCase(initialValues ? sampleFromValues(initialValues, 'draft') : undefined)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> New Reanalysis Case
            </button>
            {initialValues && (
              <p className="mt-2 text-center text-[10px] font-medium text-slate-400">Prefills from the open Form J/K/P draft</p>
            )}
          </div>
        </aside>

        {/* Main editor */}
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {!active ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Scale className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Fertilizer Reanalysis</h3>
              <p className="max-w-sm text-xs font-medium text-slate-500 dark:text-slate-400">
                Manage reanalysis cases for fertilizer samples — link Form J/K/P details, upload Form L &amp; receipts,
                generate the Show Cause Notice, declarations and covering letter, then export one combined case PDF.
              </p>
              <button type="button" onClick={() => newCase(initialValues ? sampleFromValues(initialValues, 'draft') : undefined)} className="mt-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800">
                Create First Case
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-4 pb-10">
              {notice && (
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'}`}>
                  {notice.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {notice.text}
                </div>
              )}

              {/* Case header */}
              <div className={cardCls}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Field label="Case Title" value={active.title} onChange={(v) => patch((c) => ({ ...c, title: v }))} />
                  </div>
                  <button type="button" onClick={() => { deleteReanalysisCase(active.id); setCases(listReanalysisCases()); setActiveId(null); }} className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-800/60 dark:text-red-300 dark:hover:bg-red-950/40">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>

              {/* Linked sample (Form J/K/P) */}
              <div className={cardCls}>
                <SectionTitle icon={FlaskConical} title="Linked Sample — Form J / K / P" sub="Auto-fetched from saved fertilizer statutory drafts" />
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {initialValues && (
                    <button type="button" onClick={loadCurrentForm} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <RefreshCw className="h-3.5 w-3.5" /> Use current form values
                    </button>
                  )}
                  {drafts.length > 0 && (
                    <select className={`${inputCls} w-auto`} defaultValue="" onChange={(e) => { const d = drafts.find((x) => x.name === e.target.value); if (d) loadDraftIntoCase(d); e.target.value = ''; }}>
                      <option value="">Load from saved draft…</option>
                      {drafts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Sample Code" value={active.sample.sampleCode} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, sampleCode: v } }))} />
                  <Field label="Fertilizer / Product" value={active.sample.fertilizerName} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, fertilizerName: v } }))} />
                  <Field label="Dealer / Firm" value={active.sample.dealerName} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, dealerName: v } }))} />
                  <Field label="Sampling Date" value={active.sample.samplingDate} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, samplingDate: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Dealer Address" value={active.sample.dealerAddress} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, dealerAddress: v } }))} />
                  </div>
                  <Field label="Quantity Sampled" value={active.sample.quantity} onChange={(v) => patch((c) => ({ ...c, sample: { ...c.sample, quantity: v } }))} />
                </div>
                <p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                  Form J, Form K and Form P are generated by the existing Fertilizer Statutory Tools above — this case links their details and bundles them into the combined reanalysis PDF.
                </p>
              </div>

              {/* Uploads */}
              <div className={cardCls}>
                <SectionTitle icon={FileUp} title="Case Documents" sub="Upload Form L, dealer correspondence and receipts (PDF)" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {UPLOAD_KINDS.map(({ kind, label, hint }) => {
                    const existing = active.uploads.filter((u) => u.kind === kind);
                    return (
                      <div key={kind} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">{label}</p>
                        <p className="mb-2 text-[10px] font-medium text-slate-400">{hint}</p>
                        {existing.map((u) => (
                          <div key={u.id} className="mb-1 flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">{u.name}</span>
                            <button type="button" onClick={() => removeUpload(u.id)} className="text-slate-400 hover:text-red-500" aria-label="Remove">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <input
                          ref={(el) => { fileInputs.current[kind] = el; }}
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => void handleUpload(kind, e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          disabled={busy === `upload-${kind}`}
                          onClick={() => fileInputs.current[kind]?.click()}
                          className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                        >
                          {busy === `upload-${kind}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                          Upload PDF
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SCN */}
              <div className={cardCls}>
                <SectionTitle icon={Scale} title="Show Cause Notice" sub="Generate the SCN PDF for this case" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Notice No." value={active.scn.noticeNumber} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, noticeNumber: v } }))} />
                  <Field label="Notice Date" value={active.scn.noticeDate} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, noticeDate: v } }))} />
                  <Field label="Reply By Date" value={active.scn.replyByDate} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, replyByDate: v } }))} />
                  <Field label="Reply Within (days)" value={active.scn.replyDays} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, replyDays: v } }))} />
                  <Field label="Form-L Report No." value={active.scn.formLNumber} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, formLNumber: v } }))} />
                  <Field label="Form-L Report Date" value={active.scn.formLDate} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, formLDate: v } }))} />
                  <Field label="Memo No." value={active.scn.memoNumber} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, memoNumber: v } }))} />
                  <Field label="Memo Date" value={active.scn.memoDate} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, memoDate: v } }))} />
                  <Field label="Report Communicated to Dealer On" value={active.scn.communicatedDate} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, communicatedDate: v } }))} />
                  <Field label="Clause Reference" value={active.scn.clauseReference} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, clauseReference: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Violation / Analytical Finding" value={active.scn.violation} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, violation: v } }))} textarea placeholder='e.g. sample is not according to specifications and fails in "Particle Size"' />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Stock Particulars" value={active.scn.stockDescription} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, stockDescription: v } }))} placeholder="Brand, grade, batch, quantity…" />
                  </div>
                  <Field label="Officer Name" value={active.scn.officerName} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, officerName: v } }))} />
                  <Field label="Designation" value={active.scn.designation} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, designation: v } }))} />
                  <Field label="Division" value={active.scn.division} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, division: v } }))} />
                  <Field label="District" value={active.scn.district} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, district: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Office Address" value={active.scn.officeAddress} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, officeAddress: v } }))} />
                  </div>
                  <Field label="Manufacturer Name" value={active.scn.manufacturerName} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, manufacturerName: v } }))} />
                  <Field label="Distributor Name" value={active.scn.distributorName} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, distributorName: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Manufacturer Address" value={active.scn.manufacturerAddress} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, manufacturerAddress: v } }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Distributor Address" value={active.scn.distributorAddress} onChange={(v) => patch((c) => ({ ...c, scn: { ...c.scn, distributorAddress: v } }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Copy To (one per line — leave blank for the standard inspector + DAO copies)</label>
                    <textarea
                      className={`${inputCls} min-h-[70px] resize-y`}
                      value={active.scn.copies.join('\n')}
                      placeholder={'e.g.\nThe Fertilizer Inspector-cum-Mandal Agricultural Officer, Sirpur T, Kumurambheem Asifabad District, with instructions to serve the copy to the dealer\nCopy submitted to the District Agriculture Officer, KB Asifabad for favour of kind information'}
                      onChange={(e) => patch((c) => ({ ...c, scn: { ...c.scn, copies: e.target.value.split('\n') } }))}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void downloadPdf('scn', generateScnPdf(active), `SCN_${active.sample.sampleCode || active.id}`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {busy === 'scn' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Generate Show Cause Notice PDF
                </button>
              </div>

              {/* Declarations */}
              <div className={cardCls}>
                <SectionTitle icon={ShieldCheck} title="Declarations" sub="Generate statutory declarations for the reanalysis file" />
                <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  {(['dealer', 'inspector', 'authority'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDeclTab(k)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-black transition ${declTab === k ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                      {k === 'dealer' ? 'By Dealer' : k === 'inspector' ? 'By Inspector' : 'By Authority'}
                    </button>
                  ))}
                </div>
                {declValue && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" value={declValue.name} onChange={(v) => setDecl({ name: v })} />
                    <Field label="Designation" value={declValue.designation} onChange={(v) => setDecl({ designation: v })} />
                    <Field label="Place" value={declValue.place} onChange={(v) => setDecl({ place: v })} />
                    <Field label="Date" value={declValue.date} onChange={(v) => setDecl({ date: v })} />
                    {declTab === 'dealer' && (
                      <div className="sm:col-span-2">
                        <Field label="Father's Name (printed as S/o …)" value={declValue.fatherName} onChange={(v) => setDecl({ fatherName: v })} />
                      </div>
                    )}
                    {declTab === 'inspector' && (
                      <>
                        <Field label="Role (e.g. Mandal Agriculture Officer and Fertilizer Inspector)" value={declValue.role} onChange={(v) => setDecl({ role: v })} />
                        <div className="sm:col-span-2">
                          <Field label="Jurisdiction (e.g. Sirpur T, Mandal of Kumurambheem Asifabad District)" value={declValue.jurisdiction} onChange={(v) => setDecl({ jurisdiction: v })} />
                        </div>
                      </>
                    )}
                    {declTab === 'authority' && (
                      <>
                        <Field label="Division" value={declValue.division} onChange={(v) => setDecl({ division: v })} />
                        <Field label="District" value={declValue.district} onChange={(v) => setDecl({ district: v })} />
                        <div className="sm:col-span-2">
                          <Field label="Dealer Portion Received for Re-analysis On" value={declValue.receivedDate} onChange={(v) => setDecl({ receivedDate: v })} />
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-2">
                      <Field label="Remarks (optional)" value={declValue.remarks} onChange={(v) => setDecl({ remarks: v })} textarea />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void downloadPdf(`decl-${declTab}`, generateDeclarationPdf(declTab, active), `Declaration_${declTab}_${active.sample.sampleCode || active.id}`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {busy === `decl-${declTab}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Generate Declaration ({declTab === 'dealer' ? 'Dealer' : declTab === 'inspector' ? 'Inspector' : 'Authority'})
                </button>
              </div>

              {/* Covering letter */}
              <div className={cardCls}>
                <SectionTitle icon={Mail} title="Reanalysis Covering Letter" sub="Editable letterhead details and dynamic enclosure list" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Letter No." value={active.letter.letterNumber} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, letterNumber: v } }))} />
                  <Field label="Letter Date" value={active.letter.letterDate} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, letterDate: v } }))} />
                  <Field label="Financial Year" value={active.letter.financialYear} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, financialYear: v } }))} />
                  <Field label="Authority" value={active.letter.authorityType} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, authorityType: v === 'DAO' ? 'DAO' : 'ADA' } }))} />
                  <Field label="Memo No." value={active.letter.memoNumber} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, memoNumber: v } }))} />
                  <Field label="Memo Date" value={active.letter.memoDate} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, memoDate: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Division" value={active.letter.division} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, division: v } }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Subject" value={active.letter.subject} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, subject: v } }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Salutation" value={active.letter.salutation} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, salutation: v } }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Body — single paragraph fallback (used only if Body Paragraphs above is empty)" value={active.letter.body} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, body: v } }))} textarea placeholder="Leave blank for the standard reanalysis forwarding paragraph" />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Closing" value={active.letter.closing} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, closing: v } }))} />
                  </div>
                </div>

                {/* From / To block */}
                <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-2">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:col-span-2">From (Sending Office)</p>
                  <Field label="Name" value={active.letter.fromName} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, fromName: v } }))} />
                  <Field label="Designation" value={active.letter.fromDesignation} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, fromDesignation: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Address" value={active.letter.fromAddress} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, fromAddress: v } }))} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:col-span-2">To (Recipient)</p>
                  <Field label="Name" value={active.letter.toName} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, toName: v } }))} />
                  <Field label="Designation" value={active.letter.toDesignation} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, toDesignation: v } }))} />
                  <div className="sm:col-span-2">
                    <Field label="Address" value={active.letter.toAddress} onChange={(v) => patch((c) => ({ ...c, letter: { ...c.letter, toAddress: v } }))} />
                  </div>
                </div>

                {/* References / paragraphs / copies — one entry per line */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>References (one per line)</label>
                    <textarea
                      className={`${inputCls} min-h-[90px] resize-y`}
                      value={active.letter.references.join('\n')}
                      placeholder={'e.g.\nMAO, Sirpur T Lr. No. 01/FRT/MAO/SPRT/2026-27, Dt. 14-08-2026\nForm L No: FCO/WGL/92/2026-27, Dt: 08.09.2026'}
                      onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, references: e.target.value.split('\n') } }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Body Paragraphs (one per line)</label>
                    <textarea
                      className={`${inputCls} min-h-[90px] resize-y`}
                      value={active.letter.paragraphs.join('\n')}
                      placeholder="Leave blank for the standard reanalysis forwarding paragraph"
                      onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, paragraphs: e.target.value.split('\n') } }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Copy To (one per line)</label>
                    <textarea
                      className={`${inputCls} min-h-[90px] resize-y`}
                      value={active.letter.copies.join('\n')}
                      placeholder={'e.g.\nCopy submitted to District Agricultural Officer, Kumurambheem Asifabad for favour of necessary action\nCopy to M/s Sri Shambhavi Fertilizers for information'}
                      onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, copies: e.target.value.split('\n') } }))}
                    />
                  </div>
                </div>

                {/* Dynamic enclosure items */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Enclosures / References</p>
                    <button
                      type="button"
                      onClick={() => patch((c) => ({ ...c, letter: { ...c.letter, items: [...c.letter.items, { id: crypto.randomUUID(), label: '', reference: '', enclosure: '' } as ReanalysisLetterItem] } }))}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <Plus className="h-3 w-3" /> Add item
                    </button>
                  </div>
                  {active.letter.items.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-400 dark:border-slate-600">No custom enclosures — the standard 9-item reanalysis enclosure list will be used.</p>
                  )}
                  <div className="space-y-2">
                    {active.letter.items.map((item, idx) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Item {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" disabled={idx === 0} onClick={() => patch((c) => { const items = [...c.letter.items]; [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]; return { ...c, letter: { ...c.letter, items } }; })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button type="button" disabled={idx === active.letter.items.length - 1} onClick={() => patch((c) => { const items = [...c.letter.items]; [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]]; return { ...c, letter: { ...c.letter, items } }; })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => patch((c) => ({ ...c, letter: { ...c.letter, items: c.letter.items.filter((x) => x.id !== item.id) } }))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Delete item"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input className={inputCls} placeholder="Label (e.g. Form J)" value={item.label} onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, items: c.letter.items.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x) } }))} />
                          <input className={inputCls} placeholder="Reference" value={item.reference} onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, items: c.letter.items.map((x) => x.id === item.id ? { ...x, reference: e.target.value } : x) } }))} />
                          <input className={inputCls} placeholder="Enclosure" value={item.enclosure} onChange={(e) => patch((c) => ({ ...c, letter: { ...c.letter, items: c.letter.items.map((x) => x.id === item.id ? { ...x, enclosure: e.target.value } : x) } }))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void downloadPdf('letter', generateCoveringLetterPdf(active), `Covering_Letter_${active.sample.sampleCode || active.id}`)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-sky-800 disabled:opacity-50"
                >
                  {busy === 'letter' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Generate Covering Letter PDF
                </button>
              </div>

              {/* Combined */}
              <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                      <FileText className="h-4 w-4 text-emerald-600" /> Combined Reanalysis Case PDF
                    </h4>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Covering Letter → Show Cause Notice → 3 Declarations → uploaded documents, in one file.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void downloadCombined()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-50"
                  >
                    {busy === 'combined' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download Combined Case PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
