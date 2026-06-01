import React from 'react';

export function FertilizerTable({ fertilizers = [], onEdit, isTelugu = false }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2">{isTelugu ? 'దశ' : 'Stage'}</th>
              <th className="px-3 py-2">{isTelugu ? 'ఎరువు' : 'Fertilizer'}</th>
              <th className="px-3 py-2">{isTelugu ? 'పరిమాణం' : 'Quantity'}</th>
              <th className="px-3 py-2">{isTelugu ? 'పద్ధతి' : 'Method'}</th>
              {onEdit && <th className="px-3 py-2">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {fertilizers.map((item) => (
              <tr key={item.id || `${item.stage}-${item.fertilizer}`} className="align-top">
                <td className="px-3 py-2 font-black text-slate-900 dark:text-white">{item.stage}</td>
                <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{item.fertilizer}</td>
                <td className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">{item.quantity}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{isTelugu && item.description_te ? item.description_te : item.method}</td>
                {onEdit && (
                  <td className="px-3 py-2">
                    <button onClick={() => onEdit(item)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
