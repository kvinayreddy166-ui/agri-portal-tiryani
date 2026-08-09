import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Save, Upload } from 'lucide-react';
import type { CropProtectionCategory, CropProtectionCrop } from '../../services/cropProtectionService';
import {
  saveCropProtectionCrop,
  saveCropProtectionItem,
  uploadCropProtectionCropImage,
} from '../../services/cropProtectionService';

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
  const [editableCropId, setEditableCropId] = useState(crops[0]?.id || '');
  const [cropNameEn, setCropNameEn] = useState('');
  const [cropNameTe, setCropNameTe] = useState('');
  const [cropImageUrl, setCropImageUrl] = useState('');
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState('');
  const [cropMessage, setCropMessage] = useState('');
  const [savingCrop, setSavingCrop] = useState(false);
  const [category, setCategory] = useState<CropProtectionCategory>('pest');
  const [name, setName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [message, setMessage] = useState('');

  const selectedEditableCrop = crops.find((crop) => crop.id === editableCropId) || crops[0];

  useEffect(() => {
    if (!crops.length) return;
    if (!crops.some((crop) => crop.id === cropId)) setCropId(crops[0].id);
    if (!crops.some((crop) => crop.id === editableCropId)) setEditableCropId(crops[0].id);
  }, [cropId, crops, editableCropId]);

  useEffect(() => {
    if (!selectedEditableCrop) return;
    setCropNameEn(selectedEditableCrop.name_en || '');
    setCropNameTe(selectedEditableCrop.name_te || '');
    setCropImageUrl(selectedEditableCrop.image_url || '');
    setCropImageFile(null);
    setCropMessage('');
  }, [selectedEditableCrop]);

  useEffect(() => {
    if (!cropImageFile) {
      setCropPreviewUrl(cropImageUrl);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(cropImageFile);
    setCropPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [cropImageFile, cropImageUrl]);

  if (!isAdmin) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
        Admin Data Editor is available only for administrator login.
      </section>
    );
  }

  const saveCropLabels = async () => {
    if (!selectedEditableCrop) return;
    setSavingCrop(true);
    setCropMessage('Saving...');

    try {
      let nextImageUrl = cropImageUrl.trim();
      if (cropImageFile) {
        nextImageUrl = await uploadCropProtectionCropImage(selectedEditableCrop.crop_key, cropImageFile);
      }

      const result = await saveCropProtectionCrop({
        id: selectedEditableCrop.id,
        name_en: cropNameEn.trim() || selectedEditableCrop.name_en,
        name_te: cropNameTe.trim(),
        image_url: nextImageUrl,
        active: selectedEditableCrop.active ?? true,
      });

      if (result.error) {
        setCropMessage('Could not save. Confirm migration and admin access.');
        return;
      }

      setCropImageFile(null);
      setCropImageUrl(nextImageUrl);
      setCropMessage('Saved. Public crop cards updated.');
      onSaved();
    } catch (error) {
      setCropMessage(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setSavingCrop(false);
    }
  };

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
        Edit public Crop Doctor crop labels and images, or add official weed, pest, disease and nutrient deficiency records.
      </p>

      <div className="mt-4 rounded-lg border border-amber-200 bg-white p-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-800">
          <ImageIcon className="h-4 w-4" /> Public crop labels and images
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
          <select value={editableCropId} onChange={(event) => setEditableCropId(event.target.value)} className="filter-select">
            {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name_en}</option>)}
          </select>
          <input value={cropNameEn} onChange={(event) => setCropNameEn(event.target.value)} className="filter-select" placeholder="English label" />
          <input value={cropNameTe} onChange={(event) => setCropNameTe(event.target.value)} className="filter-select" placeholder="Telugu label" />
          <input value={cropImageUrl} onChange={(event) => setCropImageUrl(event.target.value)} className="filter-select" placeholder="Image URL" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="action-button cursor-pointer bg-white">
            <Upload className="h-4 w-4" /> Upload image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => setCropImageFile(event.target.files?.[0] || null)}
            />
          </label>
          <button type="button" onClick={saveCropLabels} className="action-button bg-emerald-700 text-white" disabled={savingCrop}>
            <Save className="h-4 w-4" /> {savingCrop ? 'Saving' : 'Save labels'}
          </button>
          {cropPreviewUrl && (
            <img src={cropPreviewUrl} alt="Crop preview" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" />
          )}
        </div>
        {cropMessage && <p className="mt-2 text-xs font-bold text-slate-700">{cropMessage}</p>}
      </div>

      <div className="mt-4 border-t border-amber-200 pt-4">
        <div className="text-xs font-black uppercase tracking-wide text-amber-800">Add crop doctor record</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <select value={cropId} onChange={(event) => setCropId(event.target.value)} className="filter-select">
            {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name_en}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value as CropProtectionCategory)} className="filter-select">
            <option value="weed">Weed</option>
            <option value="pest">Pest</option>
            <option value="disease">Disease</option>
            <option value="nutrient">Nutrient Deficiency</option>
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
      </div>
    </section>
  );
}
