import React, { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import type { CropProtectionCategory, CropProtectionCrop } from '../../services/cropProtectionService';
import { saveCropProtectionItem } from '../../services/cropProtectionService';

export function CropProtectionAdmin({
  crops,
  isAdmin,
  onSaved,
}: {
  crops: CropProtectionCrop[];
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const [cropId, setCropId] = useState(crops[0]?.id || '');
  const [category, setCategory] = useState<CropProtectionCategory>('pest');
  const [name, setName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [message, setMessage] = useState('');

  if (!isAdmin) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
        Admin Data Editor is available only for administrator login.
      </section>
    );
  }

  const save = async () => {
    setMessage('Saving...');
    const result = await saveCropProtectionItem({
      crop_id: cropId,
      category,
      name_en: name || 'New crop protection item',
      source_url: sourceUrl,
      is_verified: false,
    });
    if (result.error) {
      setMessage('Could not save. Confirm migration and admin access.');
      return;
    }
    setMessage('Saved. Mark verified after official review.');
    setName('');
    setSourceUrl('');
    onSaved();
  };

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <h2 className="text-sm font-black text-slate-950">Admin Data Editor</h2>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        Add official weed, pest or disease records. Bulk Excel/CSV import hook is ready for the next data upload workflow.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <select value={cropId} onChange={(event) => setCropId(event.target.value)} className="filter-select">
          {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name_en}</option>)}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value as CropProtectionCategory)} className="filter-select">
          <option value="weed">Weed</option>
          <option value="pest">Pest</option>
          <option value="disease">Disease</option>
        </select>
        <input value={name} onChange={(event) => setName(event.target.value)} className="filter-select" placeholder="Name" />
        <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="filter-select" placeholder="Official source URL" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={save} className="action-button bg-emerald-700 text-white">
          <Save className="h-4 w-4" /> Save draft
        </button>
        <button type="button" className="action-button" disabled>
          <Upload className="h-4 w-4" /> Bulk import
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-bold text-slate-700">{message}</p>}
    </section>
  );
}
