import React, { useCallback, useEffect, useState } from 'react';
import { Landmark, Sprout, Trash2, Upload, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';
import { uploadPortalFile } from '../lib/uploadFile';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { inferFileTypeFromName } from '../lib/fileTypes';

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
          { id: 'nfsm' as const, title: 'NFSM', desc: 'National Food Security Mission', icon: Landmark },
          { id: 'state_seed_cell' as const, title: 'State Seed Cell', desc: 'Seed subsidy and distribution', icon: Sprout },
        ]).map((item) => {
          const Icon = item.icon;
          const active = program === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchProgram(item.id)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className={`rounded-lg p-2 ${active ? 'bg-white/15' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-600'}`}>
                  {active ? 'Open' : 'Select'}
                </span>
              </div>
              <h2 className="text-base font-black">{item.title}</h2>
              <p className={`mt-1 text-sm ${active ? 'text-emerald-50' : 'text-slate-500'}`}>{item.desc}</p>
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
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600">
                <Upload className="h-5 w-5 text-emerald-600" />
                <span className="text-sm">{beneficiaryFile?.name || t('Upload file', 'ఫైల్ అప్లోడ్')}</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv,.pdf"
                  multiple
                  onChange={(e) => setBeneficiaryFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? t('Saving...', 'సేవ్...') : t('Save Entry', 'సేవ్ చేయండి')}
          </button>
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
