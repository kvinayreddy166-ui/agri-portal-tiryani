import React, { useEffect, useState } from 'react';
import { Tags, Loader2, Plus, Trash2, Pencil, X } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeNav } from '../components/KnowledgeNav';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../services/knowledgeService';
import type { KnowledgeCategory } from '../types';

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="portal-card modern-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-emerald-600" />
                    <h3 className="truncate font-bold text-slate-800 dark:text-slate-100">{c.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{c.description ?? 'No description'}</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-400">/{c.slug}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => startEdit(c)} className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
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
              <button onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Name</label>
            <input className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Description</label>
            <textarea rows={2} className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">Cancel</button>
              <button disabled={saving} onClick={save} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
