import React from 'react';
import type { CropProtectionCrop, LanguageCode } from '../../services/cropProtectionService';
import { pickLang } from '../../services/cropProtectionService';

export function CropCard({
  crop,
  selected,
  language,
  onSelect,
}: {
  crop: CropProtectionCrop;
  selected: boolean;
  language: LanguageCode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-w-[138px] overflow-hidden rounded-xl border text-left shadow-sm transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
      }`}
    >
      <div className="aspect-[4/2.4] bg-slate-100">
        {crop.image_url ? (
          <img src={crop.image_url} alt={crop.name_en} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-[11px] font-bold text-slate-500">
            No official image available
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-black text-slate-950">{pickLang(crop.name_en, crop.name_te, language)}</p>
        <p className="text-[11px] font-semibold text-slate-500">{crop.items?.length || 0} records</p>
      </div>
    </button>
  );
}
