import React from 'react';
import { Clock, Leaf, TrendingUp } from 'lucide-react';

export const CropCards = React.memo(function CropCards({ varieties = [], onEdit }: { varieties: any[]; onEdit?: (item: any) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {varieties.map((item) => (
        <article key={item.id || item.variety} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {item.image_url && <img src={item.image_url} alt={item.variety} width={400} height={128} loading="lazy" decoding="async" className="h-32 w-full object-cover" />}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-slate-950 dark:text-white">{item.variety}</h3>
              {onEdit && (
                <button onClick={() => onEdit(item)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Edit
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-700" />{item.duration || 'Duration as per season'}</span>
              <span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-700" />{item.expected_yield || item.yield || 'Yield varies by management'}</span>
              <span className="inline-flex items-start gap-2"><Leaf className="mt-0.5 h-4 w-4 text-emerald-700" />{item.special_features}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
