import React, { useCallback, useEffect, useState } from 'react';
import { Landmark, Sprout, Trash2, Upload, Save } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { uploadPortalFile } from '../../../shared/lib/uploadFile';
import { FileActionButtons } from '../../../shared/components/ui/FileActionButtons';
import { inferFileTypeFromName } from '../../../shared/lib/fileTypes';

export type SubsidyProgram = 'nfsm' | 'state_seed_cell';

interface SubsidyRecord {
  id: string;
  program: string;
  financial_year: string;
  crop_variety: string;
  quantity_allotted: number;
  quantity_unit: string;
  sales_data: string;
  beneficiary_list_url: string;
  notes: string;
  created_at: string;
}

const emptyRecord = {
  financial_year: '2025-26',
  crop_variety: '',
  quantity_allotted: 0,
  quantity_unit: 'quintals',
  sales_data: '',
  notes: '',
};

interface SubsidyTrackingProps {
  program?: SubsidyProgram;
  initialProgram?: SubsidyProgram;
  onProgramChange?: (program: SubsidyProgram) => void;
}

const programMeta: Record<SubsidyProgram, { title: string; telugu: string; desc: string }> = {
  nfsm: {
    title: 'NFSM (National Food Security Mission)',
    telugu: 'ఎన్.ఎఫ్.ఎస్.ఎం',
    desc: 'Track year-wise quantity allotted, crop variety, sales data, and beneficiaries.',
  },
  state_seed_cell: {
    title: 'State Seed Cell',
    telugu: 'రాష్ట్ర విత్తన కార్యాలయం',
    desc: 'Seed distribution, variety-wise allotment, and beneficiary tracking.',
  },
};

export function SubsidyTracking({ program: programProp, initialProgram = 'nfsm', onProgramChange }: SubsidyTrackingProps) {
  const { isAdminUser, user } = useAuth();
  const { t } = useLanguage();
  const [program, setProgram] = useState<SubsidyProgram>(programProp ?? initialProgram);
  const meta = programMeta[program];

  useEffect(() => {
    if (programProp) setProgram(programProp);
  }, [programProp]);

  const switchProgram = (next: SubsidyProgram) => {
    setProgram(next);
    onProgramChange?.(next);
  };
  const [records, setRecords] = useState<SubsidyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyRecord);
  const [beneficiaryFile, setBeneficiaryFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subsidy_cell_records')
        .select('id, program, financial_year, crop_variety, quantity_allotted, quantity_unit, sales_data, beneficiary_list_url, notes, created_at')
        .eq('program', program)
        .order('financial_year', { ascending: false })
        .limit(200);

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const handleSave = async () => {
    if (!form.financial_year.trim()) {
      alert('Financial year is required');
      return;
    }
    setSaving(true);
    try {
      let beneficiaryUrl = '';
      if (beneficiaryFile) {
        const uploaded = await uploadPortalFile(
          beneficiaryFile,
          `subsidy/${program}/beneficiaries`
        );
        beneficiaryUrl = uploaded.publicUrl;
      }

      const { error } = await supabase.from('subsidy_cell_records').insert([{
        program,
        financial_year: form.financial_year,
        crop_variety: form.crop_variety,
        quantity_allotted: form.quantity_allotted,
        quantity_unit: form.quantity_unit,
        sales_data: form.sales_data,
        beneficiary_list_url: beneficiaryUrl,
        notes: form.notes,
        created_by: user?.email || '',
      }]);

      if (error) throw error;
      setForm(emptyRecord);
      setBeneficiaryFile(null);
      void fetchRecords();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await supabase.from('subsidy_cell_records').delete().eq('id', id);
    void fetchRecords();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('Subsidy & Schemes', 'సబ్సిడీ & పథకాలు')}
        title={t(meta.title, meta.telugu)}
        description={t(meta.desc, meta.desc)}
      />

      <div className="grid gap-2 md:grid-cols-2">
        {([
          { id: 'nfsm' as const, title: 'NFSM', desc: 'National Food Security Mission', icon: Landmark, activeCard: 'border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/15', activeIcon: 'bg-white/15 text-white', activePill: 'bg-white/20 text-white', activeSub: 'text-emerald-50', idleIcon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
          { id: 'state_seed_cell' as const, title: 'State Seed Cell', desc: 'Seed subsidy and distribution', icon: Sprout, activeCard: 'border-green-700 bg-green-700 text-white shadow-md shadow-green-900/15', activeIcon: 'bg-white/15 text-white', activePill: 'bg-white/20 text-white', activeSub: 'text-green-50', idleIcon: 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300' },
        ]).map((item) => {
          const Icon = item.icon;
          const active = program === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchProgram(item.id)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? item.activeCard
                  : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? item.activeIcon : item.idleIcon}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-black">{item.title}</h2>
                <p className={`truncate text-xs font-semibold ${active ? item.activeSub : 'text-slate-500 dark:text-slate-400'}`}>{item.desc}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${active ? item.activePill : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {active ? 'Open' : 'Select'}
              </span>
            </button>
          );
        })}
      </div>

      {isAdminUser && (
        <div className="portal-card space-y-4 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t('Add tracking entry', 'ట్రాకింగ్ ఎంట్రీ జోడించండి')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Financial Year', 'ఆర్థిక సంవత్సరం')}
              </label>
              <input
                type="text"
                value={form.financial_year}
                onChange={(e) => setForm({ ...form, financial_year: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="2025-26"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Crop / Variety', 'పంట / రకం')}
              </label>
              <input
                type="text"
                value={form.crop_variety}
                onChange={(e) => setForm({ ...form, crop_variety: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Quantity Allotted', 'కేటాయించిన పరిమాణం')}
              </label>
              <input
                type="number"
                min={0}
                value={form.quantity_allotted}
                onChange={(e) => setForm({ ...form, quantity_allotted: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Unit', 'యూనిట్')}
              </label>
              <input
                type="text"
                value={form.quantity_unit}
                onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Sales Data', 'అమ్మకాల డేటా')}
              </label>
              <textarea
                rows={2}
                value={form.sales_data}
                onChange={(e) => setForm({ ...form, sales_data: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('Beneficiary list (Excel/PDF)', 'లబ్ధిదారుల జాబితా')}
              </label>
              <div className="flex flex-wrap items-stretch gap-2">
                <label className="flex w-auto max-w-xs cursor-pointer items-center gap-2 rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-50 px-3 py-2 shadow-sm shadow-emerald-100 transition hover:border-emerald-400 hover:from-emerald-200 hover:via-emerald-100 hover:to-teal-100 dark:border-emerald-700 dark:from-emerald-950/60 dark:via-emerald-950/40 dark:to-teal-950/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white shadow-sm">
                    <Upload className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-xs font-bold text-emerald-900 dark:text-emerald-100">{beneficiaryFile?.name || t('Upload file', 'ఫైల్ అప్లోడ్')}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.pdf"
                    multiple
                    onChange={(e) => setBeneficiaryFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? t('Saving...', 'సేవ్...') : t('Save Entry', 'సేవ్ చేయండి')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="portal-card overflow-hidden">
        <div className="table-scroll">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-bold">{t('Year', 'సంవత్సరం')}</th>
              <th className="px-4 py-3 text-left font-bold">{t('Variety', 'రకం')}</th>
              <th className="px-4 py-3 text-left font-bold">{t('Allotted', 'కేటాయింపు')}</th>
              <th className="px-4 py-3 text-left font-bold">{t('Sales', 'అమ్మకాలు')}</th>
              <th className="px-4 py-3 text-left font-bold">{t('Beneficiaries', 'Beneficiaries')}</th>
              {isAdminUser && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {records.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">{row.financial_year}</td>
                <td className="px-4 py-3">{row.crop_variety || '—'}</td>
                <td className="px-4 py-3">
                  {row.quantity_allotted} {row.quantity_unit}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{row.sales_data || '—'}</td>
                <td className="px-4 py-3">
                  {row.beneficiary_list_url ? (
                    <FileActionButtons
                      fileUrl={row.beneficiary_list_url}
                      fileName={`${row.program}-${row.financial_year}-beneficiaries`}
                      fileType={inferFileTypeFromName(row.beneficiary_list_url)}
                      size="sm"
                    />
                  ) : (
                    'No file'
                  )}
                </td>
                {isAdminUser && (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {records.length === 0 && (
          <p className="p-8 text-center text-slate-500">{t('No records yet', 'ఇంకా రికార్డులు లేవు')}</p>
        )}
      </div>
    </div>
  );
}
