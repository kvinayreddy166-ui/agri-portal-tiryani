import React from 'react';
import { Download, X } from 'lucide-react';
import type { FertilizerFormEntry } from '../../data/fertilizerForms';

export function FertilizerFormPdfGenerator({ form, onClose }: { form: FertilizerFormEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{form.category}</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 dark:text-white sm:text-base">
              {form.formNo} - {form.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <a
              href={form.pdfPath}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-[76vh] flex-1 overflow-hidden bg-slate-200 dark:bg-slate-900">
          <iframe
            title={`${form.formNo} PDF preview`}
            src={`${form.pdfPath}#page=${form.page}&zoom=page-width`}
            className="h-full min-h-[76vh] w-full border-0 bg-white"
          />
        </div>
      </section>
    </div>
  );
}