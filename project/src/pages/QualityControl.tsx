import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  FileUp,
  MapPin,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getContentType } from '../lib/fileTypes';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeIcon } from '../components/ui/FileTypeIcon';
import { useAuth } from '../context/AuthContext';
import { QualityControlSample, QualityControlTarget } from '../types/database';

interface QualityControlProps {
  category: 'seeds' | 'pesticides' | 'fertilizers';
}

const categoryLabels = {
  seeds: 'Seeds',
  pesticides: 'Pesticides',
  fertilizers: 'Fertilizers',
};

const financialYears = ['2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'];

const emptySample = {
  dealer_name: '',
  license_number: '',
  phone_number: '',
  location: '',
  sample_date: new Date().toISOString().slice(0, 10),
  remarks: '',
};

export function QualityControl({ category }: QualityControlProps) {
  const { isAdminUser, user } = useAuth();
  const [financialYear, setFinancialYear] = useState(financialYears[0]);
  const [samples, setSamples] = useState<QualityControlSample[]>([]);
  const [target, setTarget] = useState<QualityControlTarget | null>(null);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [sampleForm, setSampleForm] = useState(emptySample);
  const [sampleFile, setSampleFile] = useState<File | null>(null);

  const categoryTitle = categoryLabels[category];
  const progress = useMemo(() => {
    if (!targetCount) return 0;
    return Math.min(100, Math.round((samples.length / targetCount) * 100));
  }, [samples.length, targetCount]);

  const fetchQualityControlData = useCallback(async () => {
    setLoading(true);
    try {
      const [samplesResult, targetResult] = await Promise.all([
        supabase
          .from('quality_control_samples')
          .select('*')
          .eq('category', category)
          .eq('financial_year', financialYear)
          .order('sample_date', { ascending: false }),
        supabase
          .from('quality_control_targets')
          .select('*')
          .eq('category', category)
          .eq('financial_year', financialYear)
          .maybeSingle(),
      ]);

      if (samplesResult.error) throw samplesResult.error;
      if (targetResult.error) throw targetResult.error;

      setSamples(samplesResult.data || []);
      setTarget(targetResult.data || null);
      setTargetCount(targetResult.data?.target_count || 0);
    } catch (error) {
      console.error('Error fetching quality control data:', error);
    } finally {
      setLoading(false);
    }
  }, [category, financialYear]);

  useEffect(() => {
    void fetchQualityControlData();
  }, [fetchQualityControlData]);

  const saveTarget = async () => {
    setSaving(true);
    try {
      const payload = {
        category,
        financial_year: financialYear,
        target_count: targetCount,
        updated_at: new Date().toISOString(),
      };

      const { error } = target
        ? await supabase
            .from('quality_control_targets')
            .update(payload)
            .eq('id', target.id)
        : await supabase
            .from('quality_control_targets')
            .insert([payload]);

      if (error) throw error;
      void fetchQualityControlData();
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    } finally {
      setSaving(false);
    }
  };

  const saveSample = async () => {
    if (!sampleForm.dealer_name.trim() || !sampleForm.license_number.trim()) {
      alert('Please enter dealer name and license number');
      return;
    }

    setSaving(true);
    try {
      let formUrl = '';

      if (sampleFile) {
        const cleanName = sampleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `quality-control/${category}/${financialYear}/${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, sampleFile, {
            upsert: true,
            contentType: getContentType(sampleFile),
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        formUrl = publicUrl;
      }

      const { error } = await supabase
        .from('quality_control_samples')
        .insert([{
          category,
          financial_year: financialYear,
          dealer_name: sampleForm.dealer_name.trim(),
          license_number: sampleForm.license_number.trim(),
          phone_number: sampleForm.phone_number.trim(),
          location: sampleForm.location.trim(),
          sample_date: sampleForm.sample_date,
          form_url: formUrl || null,
          remarks: sampleForm.remarks.trim(),
          created_by: user?.email || 'admin',
        }]);

      if (error) throw error;
      setShowSampleForm(false);
      setSampleForm(emptySample);
      setSampleFile(null);
      void fetchQualityControlData();
    } catch (error) {
      console.error('Error saving sample:', error);
      alert('Failed to save sample. Please check storage/database setup.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSample = async (id: string) => {
    if (!confirm('Delete this sample record?')) return;

    try {
      const { error } = await supabase
        .from('quality_control_samples')
        .delete()
        .eq('id', id);

      if (error) throw error;
      void fetchQualityControlData();
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Failed to delete sample');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-3 text-white shadow-md md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Quality Control</p>
            <h1 className="text-2xl font-black tracking-tight">{categoryTitle}</h1>
            <p className="mt-0.5 max-w-2xl text-xs text-emerald-50">
              Track dealer samples, uploaded sample-drawn forms, and financial-year targets.
            </p>
          </div>
          <div className="min-w-52">
            <label className="mb-1 block text-xs font-bold text-emerald-50">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white px-3 py-2 font-bold text-gray-950 outline-none"
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Target className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">{financialYear}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Target</p>
          {isAdminUser ? (
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min="0"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-lg font-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                onClick={saveTarget}
                disabled={saving}
                className="rounded-lg bg-emerald-700 px-3 text-white transition hover:bg-emerald-800 disabled:opacity-60"
                aria-label="Save target"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-black text-gray-950">{targetCount}</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 w-fit rounded-lg bg-sky-50 p-2 text-sky-700">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Samples Drawn</p>
          <p className="mt-1 text-2xl font-black text-gray-950">{samples.length}</p>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 w-fit rounded-lg bg-amber-50 p-2 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Progress</p>
          <p className="mt-1 text-2xl font-black text-gray-950">{progress}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-950">Sample Drawn Records</h2>
            <p className="text-xs text-gray-500">Dealer-wise quality control samples for {financialYear}</p>
          </div>
          {isAdminUser && (
            <button
              onClick={() => setShowSampleForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
            >
                <Plus className="h-4 w-4" />
              Add Sample
            </button>
          )}
        </div>

        {samples.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <div className="divide-y divide-gray-100">
              {samples.map((sample) => (
                <div key={sample.id} className="grid grid-cols-[1fr_auto] gap-2 p-2 transition hover:bg-gray-50 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-2">
                    {sample.form_url && (
                      <FileTypeIcon
                        fileName={`${sample.category}-${sample.dealer_name}`}
                        fileUrl={sample.form_url}
                        size="sm"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-950">{sample.dealer_name}</p>
                      <p className="truncate text-xs text-gray-500">License: {sample.license_number}</p>
                    </div>
                  </div>
                  <div className="col-start-1 space-y-1 text-xs text-gray-600 lg:col-start-auto lg:text-sm">
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" />{sample.phone_number || 'No phone'}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" />{sample.location || 'No location'}</p>
                  </div>
                  <div className="col-start-1 text-xs text-gray-600 lg:col-start-auto lg:text-sm">
                    <p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-emerald-600" />{new Date(sample.sample_date).toLocaleDateString()}</p>
                    {sample.remarks && <p className="mt-1 line-clamp-1">{sample.remarks}</p>}
                  </div>
                  <div className="row-span-3 flex items-center gap-1 lg:row-span-1">
                    {sample.form_url && (
                      <FileActionButtons
                        fileUrl={sample.form_url}
                        fileName={`${sample.category}-${sample.dealer_name}`}
                      />
                    )}
                    {isAdminUser && (
                      <button
                        onClick={() => deleteSample(sample.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Delete sample"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-600">No sample records added for this year yet.</p>
          </div>
        )}
      </section>

      {showSampleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-950">Add Sample Drawn</h2>
                <p className="text-xs text-gray-500">{categoryTitle} - {financialYear}</p>
              </div>
              <button onClick={() => setShowSampleForm(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Dealer Name" value={sampleForm.dealer_name} onChange={(value) => setSampleForm({ ...sampleForm, dealer_name: value })} />
              <TextField label="License Number" value={sampleForm.license_number} onChange={(value) => setSampleForm({ ...sampleForm, license_number: value })} />
              <TextField label="Phone Number" value={sampleForm.phone_number} onChange={(value) => setSampleForm({ ...sampleForm, phone_number: value })} />
              <TextField label="Location" value={sampleForm.location} onChange={(value) => setSampleForm({ ...sampleForm, location: value })} />
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Sample Date</label>
                <input
                  type="date"
                  value={sampleForm.sample_date}
                  onChange={(e) => setSampleForm({ ...sampleForm, sample_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Sample Drawn Form</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 hover:border-emerald-400 hover:bg-emerald-50">
                  <FileUp className="h-5 w-5 text-emerald-700" />
                  <span className="truncate text-sm font-semibold text-gray-700">
                    {sampleFile ? sampleFile.name : 'Upload form'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setSampleFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-gray-700">Remarks</label>
                <textarea
                  value={sampleForm.remarks}
                  onChange={(e) => setSampleForm({ ...sampleForm, remarks: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowSampleForm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSample}
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Sample'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}
