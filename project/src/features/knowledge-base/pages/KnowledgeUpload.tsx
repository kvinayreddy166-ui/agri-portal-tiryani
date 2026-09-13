import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import {
  checkDuplicateHash,
  createDocumentRecord,
  fetchCategories,
  fetchDocuments,
  processDocument,
  uploadDocumentFile,
  updateDocument,
} from '../services/knowledgeService';
import { computeFileHash, formatFileSize, getExtension, validateKnowledgeFile } from '../utils';
import { DOCUMENT_TYPES, type DocumentType, type KnowledgeCategory } from '../types';

export function KnowledgeUpload() {
  const { isAdminUser } = useAuth();
  const go = useKnowledgeNav();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Act');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [authority, setAuthority] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [state, setState] = useState('');
  const [language, setLanguage] = useState('en');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [version, setVersion] = useState('');
  const [supersededBy, setSupersededBy] = useState('');
  const [existingDocs, setExistingDocs] = useState<{ id: string; title: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (categoriesLoaded) return;
    try {
      const cats = await fetchCategories();
      setCategories(cats);
      setCategoriesLoaded(true);
    } catch (e) {
      console.warn('categories load failed', e);
      setCategoriesLoaded(true);
    }
  }, [categoriesLoaded]);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    fetchDocuments({ pageSize: 200, includeInactive: true }).then((r) => setExistingDocs(r.documents.map((d) => ({ id: d.id, title: d.title })))).catch(() => {});
  }, []);

  const handleFile = useCallback((f: File) => {
    const err = validateKnowledgeFile(f);
    if (err) {
      setValidationError(err);
      setFile(null);
      return;
    }
    setValidationError(null);
    setFile(f);
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      setTitle(base);
    }
  }, [title]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const addKeyword = () => {
    const v = keywordInput.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setKeywordInput('');
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setDocumentType('Act');
    setSelectedCategories([]);
    setDescription('');
    setDepartment('');
    setAuthority('');
    setReferenceNumber('');
    setDocumentNumber('');
    setDocumentDate('');
    setEffectiveDate('');
    setState('');
    setLanguage('en');
    setKeywords([]);
    setVersion('');
    setSupersededBy('');
    setValidationError(null);
  };

  const handleUpload = async (process: boolean) => {
    if (!file) { setValidationError('Select a file to upload.'); return; }
    if (!title.trim()) { setValidationError('Document title is required.'); return; }
    if (selectedCategories.length === 0) { setValidationError('Select at least one category.'); return; }
    setSubmitting(true);
    setValidationError(null);
    try {
      const hash = await computeFileHash(file);
      const dup = await checkDuplicateHash(hash);
      if (dup) {
        setValidationError(`This document already exists in the Knowledge Base as "${dup.title}".`);
        setSubmitting(false);
        return;
      }
      // Create the document record first to get an id, then upload file into that id folder.
      const doc = await createDocumentRecord({
        title: title.trim(),
        document_type: documentType,
        categoryIds: selectedCategories,
        description: description.trim() || undefined,
        department: department.trim() || undefined,
        authority: authority.trim() || undefined,
        reference_number: referenceNumber.trim() || undefined,
        document_number: documentNumber.trim() || undefined,
        document_date: documentDate || undefined,
        effective_date: effectiveDate || undefined,
        state: state.trim() || undefined,
        language,
        keywords,
        version: version.trim() || undefined,
        superseded_by: supersededBy || undefined,
        file_path: `pending/${file.name}`,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || `application/${getExtension(file.name)}`,
        file_hash: hash,
      });

      const filePath = await uploadDocumentFile(file, doc.id);
      await updateDocument(doc.id, { file_path: filePath });

      if (supersededBy) {
        await updateDocument(supersededBy, { is_superseded: true, is_active: false, superseded_by: doc.id });
      }

      toast.showSuccess('Document uploaded', process ? 'Processing started.' : 'Saved as draft.');

      if (process) {
        try {
          await processDocument(doc.id);
          toast.showInfo('Processing started', 'You can track progress in the Processing Queue.');
        } catch (e) {
          toast.showReset('Processing failed to start', (e as Error).message);
        }
      }
      reset();
      go('library');
    } catch (e) {
      setValidationError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdminUser) {
    return (
      <div className="portal-card modern-card p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-2 font-bold text-slate-700 dark:text-slate-200">Admin access required to upload documents.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge Base"
        title="Upload Document"
        description="Upload official Acts, Rules, Circulars, Government Orders and department documents. Supported: PDF, DOCX, TXT."
      />
      <KnowledgeNav isAdmin={isAdminUser} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Drop zone */}
        <div className="portal-card modern-card p-5">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">File</h3>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300 hover:border-emerald-400 dark:border-slate-700'
            }`}
          >
            <UploadCloud className="h-10 w-10 text-emerald-600" />
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Drag & drop a file here</p>
            <p className="text-xs text-slate-500">or click to browse — PDF, DOCX, TXT (max 100 MB)</p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <FileText className="h-8 w-8 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)} • {getExtension(file.name).toUpperCase()}</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-red-500">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {validationError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Metadata form */}
        <div className="portal-card modern-card p-5">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Metadata</h3>
          <div className="grid gap-3">
            <Field label="Document Title *">
              <input className="kb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Seeds Act 1966" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Document Type *">
                <select className="kb-input" value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>
                  {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select className="kb-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                </select>
              </Field>
            </div>
            <Field label="Categories *">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const on = selectedCategories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        on ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department"><input className="kb-input" value={department} onChange={(e) => setDepartment(e.target.value)} /></Field>
              <Field label="Authority"><input className="kb-input" value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. Government of Telangana" /></Field>
              <Field label="Reference Number"><input className="kb-input" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="e.g. GO Ms No. 12" /></Field>
              <Field label="Document Number"><input className="kb-input" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} /></Field>
              <Field label="Document Date"><input type="date" className="kb-input" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} /></Field>
              <Field label="Effective Date"><input type="date" className="kb-input" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></Field>
              <Field label="State"><input className="kb-input" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Telangana" /></Field>
              <Field label="Version"><input className="kb-input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 2024-amended" /></Field>
            </div>
            <Field label="Keywords">
              <div className="flex gap-2">
                <input
                  className="kb-input"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Type a keyword and press Enter"
                />
                <button type="button" onClick={addKeyword} className="rounded-xl bg-emerald-100 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-200">Add</button>
              </div>
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {k}
                      <button type="button" onClick={() => setKeywords(keywords.filter((x) => x !== k))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Description"><textarea className="kb-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label="Supersedes (optional)">
              <select className="kb-input" value={supersededBy} onChange={(e) => setSupersededBy(e.target.value)}>
                <option value="">— None —</option>
                {existingDocs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={reset} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button type="button" disabled={submitting} onClick={() => handleUpload(false)} className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
            </button>
            <button type="button" disabled={submitting} onClick={() => handleUpload(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Upload and Process
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .kb-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(15 23 42);
        }
        .dark .kb-input { background: rgb(15 23 42); border-color: rgb(51 65 85); color: rgb(226 232 240); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
