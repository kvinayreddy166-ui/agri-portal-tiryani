import React from 'react';
import { Bug, FlaskConical } from 'lucide-react';

export function PestCards({ pests = [], onEdit }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {pests.map((pest) => (
        <article key={pest.id || pest.pest_name} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid sm:grid-cols-[10rem_1fr]">
            {pest.image_url && <img src={pest.image_url} alt={pest.pest_name} loading="lazy" decoding="async" className="h-44 w-full object-cover sm:h-full" />}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white">{pest.pest_name}</h3>
                  <p className="text-xs italic text-slate-500">{pest.scientific_name}</p>
                </div>
                {onEdit && <button onClick={() => onEdit(pest)} className="rounded-md border px-2 py-1 text-xs font-bold">Edit</button>}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><Bug className="mr-1 inline h-4 w-4 text-amber-600" />{pest.symptoms}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{pest.management}</p>
              <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><FlaskConical className="mr-1 inline h-4 w-4" />{pest.chemical_control}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
