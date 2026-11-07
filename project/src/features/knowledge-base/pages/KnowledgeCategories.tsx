import React, { useEffect, useState } from 'react';
import { Tags, Loader2, Plus, Trash2, Pencil, X } from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { useToast } from '../../../shared/components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../services/knowledgeService';
import type { KnowledgeCategory } from '../types/index';

export function KnowledgeCategories() {
  const { isAdminUser } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<KnowledgeCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await fetchCategories());
    } catch (e) {
      toast.showReset('Load failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing({ id: '', name: '', slug: '', description: '' } as KnowledgeCategory); setName(''); setDescription(''); };
  const startEdit = (c: KnowledgeCategory) => { setEditing(c); setName(c.name); setDescription(c.description ?? ''); };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await updateCategory(editing.id, { name: name.trim(), description: description.trim() });
        toast.showSaved('Category updated', name.trim());
      } else {
        await createCategory({ name: name.trim(), description: description.trim() });
        toast.showSuccess('Category created', name.trim());
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.showReset('Save failed', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: KnowledgeCategory) => {
    if (!confirm(`Delete category "${c.name}"? Documents using it will lose this category link.`)) return;
    try {
      await deleteCategory(c.id);
      toast.showDeleted('Category deleted', c.name);
      load();
    } catch (e) {
      toast.showReset('Delete failed', (e as Error).message);
    }
  };

  if (!isAdminUser) return <div className="portal-card modern-card p-6 text-center font-bold text-slate-600">Admin access required.</div>;

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title="Categories" description="Organize documents into categories for filtering and retrieval."
        actions={<button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"><Plus className="h-4 w-4" /> Add Category</button>} />
      <KnowledgeNav isAdmin={isAdminUser} />

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="group flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xs transition-transform duration-200 group-hover:scale-105">
                <Tags className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-bold leading-5 text-slate-900 dark:text-slate-100 sm:text-sm">{c.name}</h3>
                <p className="mt-0.5 truncate text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">{c.description ?? 'No description'}</p>
                <p className="mt-0.5 font-mono text-[10px] leading-4 text-slate-400 dark:text-slate-500">/{c.slug}</p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`} className="rounded-md p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(c)} aria-label={`Delete ${c.name}`} className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-800"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-100">{editing.id ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Name</label>
            <input className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="mb-1 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Description</label>
            <textarea rows={2} className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button disabled={saving} onClick={save} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
