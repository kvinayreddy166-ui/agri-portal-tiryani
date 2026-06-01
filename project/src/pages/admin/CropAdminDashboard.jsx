import React, { useMemo, useState } from 'react';
import { Download, FileUp, ImagePlus, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCropData } from '../../hooks/useCropData';
import {
  bulkImportCropJson,
  createCropRecord,
  deleteCropRecord,
  exportCropWorkbook,
  updateCropRecord,
  uploadCropImage,
} from '../../services/cropService';

const TABLES = [
  ['crop_varieties', 'Varieties'],
  ['crop_pests', 'Pests'],
  ['crop_diseases', 'Diseases'],
  ['crop_weeds', 'Weeds'],
  ['crop_fertilizers', 'Fertilizers'],
  ['crop_faqs', 'FAQs'],
  ['crop_advisories', 'Advisories'],
];

export function CropAdminDashboard() {
  const [slug, setSlug] = useState('paddy');
  const [table, setTable] = useState(TABLES[0][0]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);
  const { crop, crops, loading, reload } = useCropData(slug, { faqLimit: 500 });

  const rows = useMemo(() => {
    const key = table;
    const source = crop?.[key] || [];
    if (!search.trim()) return source;
    const needle = search.toLowerCase();
    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [crop, table, search]);

  const startAdd = () => {
    setEditing({ crop_id: crop?.id || '', _table: table });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const { _table, id, created_at, updated_at, crops: nestedCrop, ...payload } = editing;
      void created_at;
      void updated_at;
      void nestedCrop;
      if (id) await updateCropRecord(_table || table, id, payload);
      else await createCropRecord(_table || table, payload);
      setEditing(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!confirm('Delete this crop intelligence record?')) return;
    await deleteCropRecord(table, row.id);
    await reload();
  };

  const importJson = async () => {
    const parsed = JSON.parse(jsonText);
    await bulkImportCropJson(parsed);
    setJsonText('');
    await reload();
  };

  const uploadImage = async (file) => {
    if (!editing || !file) return;
    const url = await uploadCropImage(file, slug, table);
    setEditing({ ...editing, image_url: url });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Crop Intelligence Admin</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Add, edit, delete, upload images, bulk import JSON and export Excel.</p>
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
          {TABLES.map(([id, label]) => (
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
                      <button onClick={() => setEditing({ ...row, _table: table })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white">Edit</button>
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
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadImage(event.target.files?.[0])} />
              </label>
            </div>
            <textarea value={JSON.stringify(editing, null, 2)} onChange={(event) => setEditing(JSON.parse(event.target.value))} className="min-h-[50vh] flex-1 bg-slate-950 p-4 font-mono text-xs text-white outline-none" />
            <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-black dark:border-slate-700 dark:text-white">Cancel</button>
              <button onClick={save} disabled={busy} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 font-black text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
