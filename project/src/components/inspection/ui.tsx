import React, { createContext, useContext, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { Column, Status, StatusField } from './types';

export type InspectionTone = 'emerald' | 'sky' | 'rose';

interface ToneStyles {
  inputFocus: string;
  sectionBorder: string;
  sectionDivider: string;
  badgeGradient: string;
  chevron: string;
  chip: string;
  chipValue: string;
  addButton: string;
  modalBorder: string;
  actionWhite: string;
  checkActive: string;
  checkAccent: string;
}

const toneStyles: Record<InspectionTone, ToneStyles> = {
  emerald: {
    inputFocus: 'focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100',
    sectionBorder: 'border-emerald-200/60 dark:border-emerald-800/50',
    sectionDivider: 'border-emerald-100 dark:border-emerald-900',
    badgeGradient: 'from-emerald-500 to-teal-600',
    chevron: 'text-emerald-700',
    chip: 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20',
    chipValue: 'text-emerald-700 dark:text-emerald-300',
    addButton: 'bg-emerald-600 hover:bg-emerald-700',
    modalBorder: 'border-emerald-200/50 dark:border-emerald-800/50',
    actionWhite: 'border-[#86EFAC] text-[#166534]',
    checkActive: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20',
    checkAccent: 'text-emerald-600 accent-emerald-600',
  },
  sky: {
    inputFocus: 'focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100',
    sectionBorder: 'border-sky-200/60 dark:border-sky-800/50',
    sectionDivider: 'border-sky-100 dark:border-sky-900',
    badgeGradient: 'from-sky-500 to-blue-600',
    chevron: 'text-sky-700',
    chip: 'border-sky-100 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20',
    chipValue: 'text-sky-700 dark:text-sky-300',
    addButton: 'bg-sky-600 hover:bg-sky-700',
    modalBorder: 'border-sky-200/50 dark:border-sky-800/50',
    actionWhite: 'border-sky-300 text-sky-800',
    checkActive: 'border-sky-200 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20',
    checkAccent: 'text-sky-600 accent-sky-600',
  },
  rose: {
    inputFocus: 'focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100',
    sectionBorder: 'border-rose-200/60 dark:border-rose-800/50',
    sectionDivider: 'border-rose-100 dark:border-rose-900',
    badgeGradient: 'from-rose-500 to-rose-600',
    chevron: 'text-rose-700',
    chip: 'border-rose-100 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20',
    chipValue: 'text-rose-700 dark:text-rose-300',
    addButton: 'bg-rose-600 hover:bg-rose-700',
    modalBorder: 'border-rose-200/50 dark:border-rose-800/50',
    actionWhite: 'border-[#FDA4AF] text-[#9F1239]',
    checkActive: 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20',
    checkAccent: 'text-rose-600 accent-rose-600',
  },
};

const ToneContext = createContext<InspectionTone>('emerald');

export function InspectionTheme({ tone, children }: { tone: InspectionTone; children: React.ReactNode }) {
  return <ToneContext.Provider value={tone}>{children}</ToneContext.Provider>;
}

export function useInspectionTone(): InspectionTone {
  return useContext(ToneContext);
}

function useToneStyles(): ToneStyles {
  return toneStyles[useInspectionTone()];
}

const inputBaseClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white';

/** Tone-aware replacement for the old per-page `inputClass` constant. */
export function useInputClass(): string {
  return `${inputBaseClass} ${useToneStyles().inputFocus}`;
}

export const labelClass = 'mb-0.5 block text-[11px] font-black tracking-wide text-slate-600 dark:text-slate-300';

export function ActionButton({
  children,
  onClick,
  icon: Icon,
  tone,
  disabled = false,
  busy = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ElementType;
  tone: InspectionTone | 'purple' | 'white';
  disabled?: boolean;
  busy?: boolean;
}) {
  const styles = useToneStyles();
  const solid: Record<InspectionTone, string> = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    sky: 'bg-sky-600 text-white hover:bg-sky-700',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  const toneClass =
    tone === 'purple'
      ? 'bg-purple-600 text-white hover:bg-purple-700'
      : tone === 'white'
        ? `border bg-white/80 hover:bg-white ${styles.actionWhite}`
        : solid[tone];
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} aria-busy={busy} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black shadow-sm transition disabled:opacity-60 sm:text-sm ${toneClass}`}>
      <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
      {children}
    </button>
  );
}

export function Section({ id, title, subtitle, open, onToggle, progress, children }: { id: number; title: string; subtitle: string; open: boolean; onToggle: (id: number) => void; progress?: { done: number; total: number }; children: React.ReactNode }) {
  const styles = useToneStyles();
  const complete = progress ? progress.done >= progress.total && progress.total > 0 : false;
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/90 shadow-md backdrop-blur-sm dark:bg-slate-900/80 ${styles.sectionBorder}`}>
      <button type="button" onClick={() => onToggle(id)} aria-expanded={open} aria-controls={`inspection-section-${id}`} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-black text-white ${styles.badgeGradient}`}>{id}</span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{title}</h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {progress && progress.total > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${complete ? `text-white ${styles.addButton}` : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
              title={`${progress.done} of ${progress.total} items completed`}
            >
              {progress.done}/{progress.total}
            </span>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${styles.chevron} ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
      </button>
      {open && <div id={`inspection-section-${id}`} className={`grid gap-3 border-t px-4 py-4 ${styles.sectionDivider}`}>{children}</div>}
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', textarea = false, placeholder = '', options, helper = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string; options?: string[]; helper?: string }) {
  const inputClass = useInputClass();
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      ) : options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
      {helper && <span className="mt-0.5 block text-[10px] font-semibold text-slate-400 dark:text-slate-500">{helper}</span>}
    </label>
  );
}

export function StatusButtons({ value, onChange, allowNa = true }: { value: Status; onChange: (v: Status) => void; allowNa?: boolean }) {
  const options: { value: Status; label: string; active: string }[] = [
    { value: 'yes', label: 'Yes', active: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'no', label: 'No', active: 'bg-red-600 text-white border-red-600' },
    ...(allowNa ? [{ value: 'na' as Status, label: 'N/A', active: 'bg-slate-600 text-white border-slate-600' }] : []),
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(value === option.value ? '' : option.value)}
          className={`min-w-[64px] rounded-lg border px-3 py-1.5 text-xs font-black transition ${value === option.value ? option.active : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatusInput({
  label,
  field,
  onChange,
  remarksLabel = 'Remarks',
  remarksWhen = 'answered',
  allowNa = true,
  extra,
}: {
  label: string;
  field: StatusField;
  onChange: (patch: Partial<StatusField>) => void;
  remarksLabel?: string;
  remarksWhen?: 'answered' | 'yes' | 'no' | 'never';
  allowNa?: boolean;
  extra?: React.ReactNode;
}) {
  const inputClass = useInputClass();
  const showRemarks = remarksWhen === 'never' ? false : remarksWhen === 'answered' ? Boolean(field.status) && field.status !== 'na' : field.status === remarksWhen;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <StatusButtons value={field.status} onChange={(status) => onChange(remarksWhen !== 'answered' && status !== remarksWhen ? { status, remarks: '' } : { status })} allowNa={allowNa} />
        {extra}
        {showRemarks && (
          <input value={field.remarks} onChange={(e) => onChange({ remarks: e.target.value })} placeholder={remarksLabel} className={`${inputClass} sm:flex-1`} />
        )}
      </div>
    </div>
  );
}

export function SummaryChip({ label, value }: { label: string; value: number }) {
  const styles = useToneStyles();
  return (
    <div className={`rounded-lg border px-2 py-1.5 text-center ${styles.chip}`}>
      <p className={`text-sm font-black ${styles.chipValue}`}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function CheckRow({ label, checked, onToggle, children }: { label: string; checked: boolean; onToggle: (checked: boolean) => void; children: React.ReactNode }) {
  const styles = useToneStyles();
  return (
    <div className={`rounded-xl border p-3 ${checked ? styles.checkActive : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} className={`mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300 ${styles.checkAccent}`} />
        <span className="min-w-0 flex-1 break-normal text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
      </label>
      {checked && <div className="mt-3 grid gap-2">{children}</div>}
    </div>
  );
}

export function RowTable<T extends Record<string, string>>({ title, rows, onChange, empty, addLabel, columns }: { title: string; rows: T[]; onChange: (rows: T[]) => void; empty: () => T; addLabel: string; columns: Column<T>[] }) {
  const inputClass = useInputClass();
  const styles = useToneStyles();
  const update = (index: number, key: keyof T, value: string) => {
    const updated = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    const computeCols = columns.filter((c) => c.compute && (!c.dependsOn || c.dependsOn.includes(key)));
    if (computeCols.length) {
      updated[index] = computeCols.reduce((row, c) => ({ ...row, [c.key]: c.compute!(row) }), updated[index]);
    }
    onChange(updated);
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <button type="button" onClick={() => onChange([...rows, empty()])} className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-black text-white ${styles.addButton}`}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {addLabel}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs font-semibold text-slate-500">No entries added.</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={index} className="relative rounded-lg border border-slate-200 bg-white p-3 pr-10 dark:border-slate-700 dark:bg-slate-900">
              <span className="absolute left-2 top-2 text-[10px] font-black text-slate-400">#{index + 1}</span>
              <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-50" aria-label="Remove row">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {columns.map((column) => (
                  <label key={String(column.key)} className="block">
                    <span className={labelClass}>{column.label}</span>
                    {column.type === 'select' ? (
                      column.allowOther && row[column.key] === '__other__' ? (
                        <input value="" onChange={(e) => update(index, column.key, e.target.value)} placeholder="Enter value" autoFocus className={inputClass} />
                      ) : column.allowOther && row[column.key] && !(column.options ?? []).includes(row[column.key]) && row[column.key] !== '__other__' ? (
                        <div className="flex gap-1">
                          <input value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass} />
                          <button type="button" onClick={() => update(index, column.key, '')} className="shrink-0 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-500 hover:bg-slate-50">List</button>
                        </div>
                      ) : (
                        <select value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass}>
                          <option value="">Select…</option>
                          {(column.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                          {column.allowOther && <option value="__other__">Others</option>}
                        </select>
                      )
                    ) : column.type === 'status' ? (
                      <StatusButtons value={row[column.key] as Status} onChange={(v) => update(index, column.key, v)} />
                    ) : column.type === 'computed' || column.compute ? (
                      <p className={`${inputClass} bg-slate-100 font-black dark:bg-slate-800/60`}>{row[column.key] || '—'}</p>
                    ) : (
                      <input value={row[column.key]} onChange={(e) => update(index, column.key, e.target.value)} className={inputClass} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false, footer, fullScreen = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode; fullScreen?: boolean }) {
  const styles = useToneStyles();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${fullScreen ? 'sm:p-4' : 'p-4'}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex w-full flex-col bg-white shadow-2xl dark:bg-slate-900 ${wide ? 'max-w-4xl' : 'max-w-lg'} ${fullScreen ? `h-full max-h-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border ${styles.modalBorder}` : `max-h-[90vh] rounded-2xl border ${styles.modalBorder}`}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <h2 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-700">{footer}</div>}
      </div>
    </div>
  );
}

