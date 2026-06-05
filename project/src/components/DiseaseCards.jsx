import React from 'react';
import { Microscope, ShieldCheck } from 'lucide-react';

export function DiseaseCards({ diseases = [], onEdit }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {diseases.map((disease) => (
        <article key={disease.id || disease.disease_name} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {disease.image_url && <img src={disease.image_url} alt={disease.disease_name} loading="lazy" decoding="async" className="h-36 w-full object-cover" />}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">{disease.disease_name}</h3>
                <p className="text-xs italic text-slate-500">{disease.causal_organism}</p>
              </div>
              {onEdit && <button onClick={() => onEdit(disease)} className="rounded-md border px-2 py-1 text-xs font-bold">Edit</button>}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><Microscope className="mr-1 inline h-4 w-4 text-red-600" />{disease.symptoms}</p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{disease.management}</p>
            <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><ShieldCheck className="mr-1 inline h-4 w-4" />{disease.fungicide}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
