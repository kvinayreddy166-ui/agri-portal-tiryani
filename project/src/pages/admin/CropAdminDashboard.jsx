import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileUp, ImagePlus, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useCropData } from '../../hooks/useCropData';
import {
  bulkImportCropJson,
  createCropRecord,
  deleteCropRecord,
  deleteCropIntelligenceCard,
  deleteUploadedCropImage,
  exportCropWorkbook,
  saveCropIntelligenceCard,
  updateCropRecord,
  uploadCropImage,
} from '../../services/cropService';
import { validateImageUploadFile } from '../../lib/fileTypes';

const NORMALIZED_TABLES = [
  ['crop_varieties', 'Varieties'],
  ['crop_pests', 'Pests'],
  ['crop_diseases', 'Diseases'],
  ['crop_weeds', 'Weeds'],
  ['crop_fertilizers', 'Fertilizers'],
  ['crop_faqs', 'FAQs'],
  ['crop_advisories', 'Advisories'],
];

const INTELLIGENCE_TABLES = [
  ['ci_varieties', 'Variety Cards'],
  ['ci_practices', 'Practice Cards'],
  ['ci_risks', 'Pest & Disease Cards'],
];

const FIELD_CONFIGS = {
  crop_varieties: [
    ['variety', 'Variety name', 'input'],
    ['duration', 'Duration', 'input'],
    ['expected_yield', 'Expected yield', 'input'],
    ['special_features', 'Card text / special features', 'textarea'],
    ['image_url', 'Image URL', 'input'],
  ],
  crop_pests: [
    ['pest_name', 'Pest name', 'input'],
    ['scientific_name', 'Scientific name', 'input'],
    ['symptoms', 'Symptoms text', 'textarea'],
    ['management', 'Management text', 'textarea'],
    ['chemical_control', 'Chemical control text', 'textarea'],
    ['image_url', 'Image URL', 'input'],
  ],
  crop_diseases: [
    ['disease_name', 'Disease name', 'input'],
    ['causal_organism', 'Causal organism', 'input'],
    ['symptoms', 'Symptoms text', 'textarea'],
    ['management', 'Management text', 'textarea'],
    ['fungicide', 'Fungicide / control text', 'textarea'],
    ['image_url', 'Image URL', 'input'],
  ],
  crop_advisories: [
    ['category', 'Category', 'input'],
    ['advisory_en', 'Advisory text', 'textarea'],
    ['advisory_te', 'Telugu advisory text', 'textarea'],
    ['priority', 'Priority', 'input'],
  ],
  ci_varieties: [
    ['name', 'Variety name', 'input'],
    ['duration', 'Duration', 'input'],
    ['expected_yield', 'Expected yield', 'input'],
    ['notes_en', 'Card text / notes', 'textarea'],
    ['notes_te', 'Telugu card text', 'textarea'],
    ['image_url', 'Image URL', 'input'],
  ],
  ci_practices: [
    ['key', 'Card key', 'input'],
    ['title_en', 'Card title', 'input'],
    ['title_te', 'Telugu title', 'input'],
    ['body_en', 'Card body text', 'textarea'],
    ['body_te', 'Telugu body text', 'textarea'],
  ],
  ci_risks: [
    ['type', 'Type: Pest or Disease', 'input'],
    ['name_en', 'Card name', 'input'],
    ['name_te', 'Telugu name', 'input'],
    ['symptoms_en', 'Symptoms text', 'textarea'],
    ['symptoms_te', 'Telugu symptoms text', 'textarea'],
    ['control_en', 'Control / management text', 'textarea'],
    ['control_te', 'Telugu control text', 'textarea'],
    ['chemicals_text', 'Chemicals, comma separated', 'textarea'],
    ['new_chemicals_text', 'New chemicals, comma separated', 'textarea'],
    ['image_url', 'Image URL', 'input'],
    ['image_source_url', 'Image source URL', 'input'],
  ],
};

export function CropAdminDashboard() {
  const [slug, setSlug] = useState('paddy');
  const [table, setTable] = useState(NORMALIZED_TABLES[0][0]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [editorText, setEditorText] = useState('');
  const [editorError, setEditorError] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { crop, crops, loading, reload } = useCropData(slug, { faqLimit: 500 });
  const usingJsonCards = crop?.__source === 'crop_intelligence';
  const tableOptions = usingJsonCards ? INTELLIGENCE_TABLES : NORMALIZED_TABLES;

  useEffect(() => {
    if (!tableOptions.some(([id]) => id === table)) {
      setTable(tableOptions[0][0]);
    }
  }, [table, tableOptions]);

  const rows = useMemo(() => {
    const source = table === 'ci_varieties'
      ? crop?.crop_varieties || []
      : table === 'ci_practices'
        ? crop?.crop_practices || []
        : table === 'ci_risks'
          ? crop?.ci_risks || []
          : crop?.[table] || [];
    if (!search.trim()) return source;
    const needle = search.toLowerCase();
    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [crop, table, search]);

  const editorRecord = useMemo(() => {
    if (!editorText.trim()) return null;
    try {
      return JSON.parse(editorText);
    } catch {
      return null;
    }
  }, [editorText]);

  const startAdd = () => {
    openEditor({ ...defaultRecordForTable(table), crop_id: crop?.id || '', _table: table });
  };

  const openEditor = (record) => {
    setEditing(record);
    setEditorText(JSON.stringify(record, null, 2));
    setEditorError('');
    setUploadError('');
  };

  const save = async () => {
    if (!editorText.trim()) return;
    setUploadError('');
    let parsed;
    try {
      parsed = JSON.parse(editorText);
    } catch (error) {
      setEditorError(error.message);
      return;
    }
    setBusy(true);
    try {
      const { _table, id, created_at, updated_at, crops: nestedCrop, ...payload } = parsed;
      void created_at;
      void updated_at;
      void nestedCrop;
      const targetTable = _table || table;
      if (targetTable.startsWith('ci_')) {
        await saveCropIntelligenceCard(slug, targetTable, parsed);
      } else if (id) {
        await updateCropRecord(targetTable, id, payload);
      } else {
        await createCropRecord(targetTable, payload);
      }
      setEditing(null);
      setUploadError('');
      await reload();
    } catch (error) {
      setUploadError(error.message || 'Unable to save record.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!confirm('Delete this crop intelligence record?')) return;
    try {
      if (table.startsWith('ci_')) {
        await deleteCropIntelligenceCard(slug, table, row._index);
      } else {
        await deleteCropRecord(table, row.id);
      }
      await reload();
    } catch (error) {
      setUploadError(error.message || 'Unable to delete record.');
    }
  };

  const importJson = async () => {
    const parsed = JSON.parse(jsonText);
    await bulkImportCropJson(parsed);
    setJsonText('');
    await reload();
  };

  const uploadImage = async (file) => {
    if (!editing || !file) return;
    const validationError = validateImageUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploading(true);
    setUploadError('');
    let parsed;
    try {
      parsed = JSON.parse(editorText || '{}');
    } catch (error) {
      setUploadError(`Fix JSON before uploading an image: ${error.message}`);
      setUploading(false);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const previousImageUrl = parsed.image_url;
    const optimisticRecord = { ...parsed, image_url: previewUrl };
    setEditing(optimisticRecord);
    setEditorText(JSON.stringify(optimisticRecord, null, 2));
    try {
      const url = await uploadCropImage(file, slug, table);
      const nextRecord = { ...parsed, image_url: url };
      setEditing(nextRecord);
      setEditorText(JSON.stringify(nextRecord, null, 2));
      setEditorError('');
      if (previousImageUrl && previousImageUrl !== url) {
        deleteUploadedCropImage(previousImageUrl).catch((error) => {
          console.warn('Old crop image cleanup skipped:', error);
        });
      }
    } catch (error) {
      setUploadError(error.message || 'Unable to upload image.');
      setEditing(parsed);
      setEditorText(JSON.stringify(parsed, null, 2));
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async () => {
    if (!editing) return;
    let parsed;
    try {
      parsed = JSON.parse(editorText || '{}');
    } catch (error) {
      setUploadError(`Fix JSON before removing the image: ${error.message}`);
      return;
    }
    const previousImageUrl = parsed.image_url;
    const { image_url, ...nextRecord } = parsed;
    void image_url;
    setEditing(nextRecord);
    setEditorText(JSON.stringify(nextRecord, null, 2));
    setUploadError('');
    try {
      await deleteUploadedCropImage(previousImageUrl);
    } catch (error) {
      setUploadError(error.message || 'Image reference removed, but storage cleanup failed.');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    uploadImage(event.dataTransfer.files?.[0]);
  };

  const updateEditorField = (key, value) => {
    const nextRecord = { ...(editorRecord || {}), [key]: value };
    setEditing(nextRecord);
    setEditorText(JSON.stringify(nextRecord, null, 2));
    setEditorError('');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Crop Intelligence Admin</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Add, edit, delete, upload images, bulk import JSON and export Excel.</p>
            {usingJsonCards && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                Using crop_intelligence JSON cards because normalized crop tables were not found in Supabase schema cache.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={slug} onChange={(event) => setSlug(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {(crops.length ? crops : [{ slug: 'paddy', crop_name: 'Paddy' }]).map((item) => (
                <option key={item.slug || item.crop_name} value={item.slug}>{item.name_en || item.crop_name}</option>
              ))}
            </select>
            <button onClick={reload} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button disabled={!crop} onClick={() => crop && exportCropWorkbook(crop)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white disabled:opacity-50">
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2">
          {tableOptions.map(([id, label]) => (
            <button key={id} onClick={() => setTable(id)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-black ${table === id ? 'border-emerald-600 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </aside>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search and filter records" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <button onClick={startAdd} disabled={!crop} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white disabled:opacity-50">
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {loading ? (
              <div className="p-6 text-sm font-semibold text-slate-500">Loading records...</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <article key={row.id} className="grid gap-3 p-3 lg:grid-cols-[1fr_auto]">
                    <pre className="max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950 dark:text-slate-200">{JSON.stringify(row, null, 2)}</pre>
                    <div className="flex gap-2 lg:flex-col">
                      <button onClick={() => openEditor({ ...row, _table: table })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white">Edit</button>
                      <button onClick={() => remove(row)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-black text-white">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-2 text-lg font-black text-slate-950 dark:text-white">Bulk Import JSON</h2>
        <textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} className="min-h-36 w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-white" placeholder="Paste paddy.json, maize.json, or crop-intelligence.json here" />
        <button onClick={importJson} disabled={!jsonText.trim()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white disabled:opacity-50">
          <FileUp className="h-4 w-4" />
          Import JSON
        </button>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Edit {table}</h2>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white">
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload / Change Image'}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" className="hidden" onChange={(event) => uploadImage(event.target.files?.[0])} />
              </label>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-b border-slate-200 p-4 dark:border-slate-700 ${dragActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {editing.image_url ? (
                  <img src={editing.image_url} alt="Selected crop record" decoding="async" className="h-28 w-44 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 sm:w-44">
                    Drop image here
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Image preview</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                    JPG, PNG, WebP, and GIF up to 10 MB. Use the upload button on mobile to open camera or gallery.
                  </p>
                </div>
                {editing.image_url && (
                  <button onClick={removeImage} type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4" />
                    Remove Image
                  </button>
                )}
              </div>
            </div>
            {FIELD_CONFIGS[table] && editorRecord && (
              <div className="max-h-[38vh] overflow-y-auto border-b border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-3 text-sm font-black text-slate-950 dark:text-white">Card text editor</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {FIELD_CONFIGS[table].map(([key, label, type]) => (
                    <label key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
                      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                      {type === 'textarea' ? (
                        <textarea
                          value={formatEditorValue(editorRecord[key])}
                          onChange={(event) => updateEditorField(key, event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      ) : (
                        <input
                          value={formatEditorValue(editorRecord[key])}
                          onChange={(event) => updateEditorField(key, event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={editorText}
              onChange={(event) => {
                const nextText = event.target.value;
                setEditorText(nextText);
                try {
                  const nextRecord = JSON.parse(nextText);
                  setEditing(nextRecord);
                  setEditorError('');
                } catch (error) {
                  setEditorError(error.message);
                }
              }}
              className="min-h-[50vh] flex-1 bg-slate-950 p-4 font-mono text-xs text-white outline-none"
            />
            {(editorError || uploadError) && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                {editorError ? `Fix JSON before saving: ${editorError}` : uploadError}
              </div>
            )}
            <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-black dark:border-slate-700 dark:text-white">Cancel</button>
              <button onClick={save} disabled={busy || !!editorError} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 font-black text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultRecordForTable(table) {
  const defaults = {
    crop_varieties: {
      variety: '',
      duration: '',
      expected_yield: '',
      special_features: '',
      image_url: '',
    },
    crop_pests: {
      pest_name: '',
      scientific_name: '',
      symptoms: '',
      management: '',
      chemical_control: '',
      image_url: '',
    },
    crop_diseases: {
      disease_name: '',
      causal_organism: '',
      symptoms: '',
      management: '',
      fungicide: '',
      image_url: '',
    },
    crop_advisories: {
      category: '',
      advisory_en: '',
      advisory_te: '',
      priority: 'normal',
    },
    ci_varieties: {
      name: '',
      duration: '',
      expected_yield: '',
      notes_en: '',
      notes_te: '',
      image_url: '',
    },
    ci_practices: {
      key: '',
      title_en: '',
      title_te: '',
      body_en: '',
      body_te: '',
    },
    ci_risks: {
      type: 'Pest',
      name_en: '',
      name_te: '',
      symptoms_en: '',
      symptoms_te: '',
      control_en: '',
      control_te: '',
      chemicals_text: '',
      new_chemicals_text: '',
      image_url: '',
      image_source_url: '',
    },
  };
  return defaults[table] || {};
}

function formatEditorValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
