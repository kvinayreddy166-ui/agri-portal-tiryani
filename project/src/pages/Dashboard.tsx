import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Droplets, CloudRain, Layers, TrendingUp, Edit2, PackageCheck, Plus, Save, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAggregatedFertilizerStock } from '../lib/fertilizerStock';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Crop, FertilizerStock, Scheme, SchemeBeneficiary, MandalOverview } from '../types/database';
import { GoogleMapWidget } from '../components/dashboard/GoogleMapWidget';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { PortalLogo } from '../components/ui/PortalLogo';

export function Dashboard() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerStock[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeBeneficiaries, setSchemeBeneficiaries] = useState<SchemeBeneficiary[]>([]);
  const [mandalData, setMandalData] = useState<MandalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCrop, setEditingCrop] = useState<string | null>(null);
  const [editingScheme, setEditingScheme] = useState<string | null>(null);
  const [editingSchemeDetails, setEditingSchemeDetails] = useState<string | null>(null);
  const [schemeForm, setSchemeForm] = useState({
    scheme_name: '',
    description: '',
    benefits: '',
    eligibility: '',
  });
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    scheme_id: '',
    financial_year: '2025-26',
    beneficiaries_count: '',
    notes: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [cropsRes, schemesRes, contentRes] = await Promise.all([
        supabase.from('crops').select('*'),
        supabase.from('schemes').select('*'),
        supabase.from('site_content').select('*').eq('section_name', 'mandal_overview').maybeSingle(),
      ]);
      const beneficiariesRes = await supabase
        .from('scheme_beneficiaries')
        .select('*')
        .order('financial_year', { ascending: false });

      const aggregatedFertilizers = await fetchAggregatedFertilizerStock();

      if (cropsRes.data) setCrops(cropsRes.data);
      setFertilizers(aggregatedFertilizers);
      if (schemesRes.data) setSchemes(schemesRes.data);
      if (beneficiariesRes.data) setSchemeBeneficiaries(beneficiariesRes.data);
      if (contentRes.data) setMandalData(contentRes.data.content);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAcreage = crops.reduce((sum, crop) => sum + crop.acreage, 0);
  const highestFertilizerStock = Math.max(...fertilizers.map((item) => item.quantity_available), 1);

  const openBeneficiaryForm = (schemeId: string) => {
    setEditingScheme(schemeId);
    setBeneficiaryForm({
      scheme_id: schemeId,
      financial_year: '2025-26',
      beneficiaries_count: '',
      notes: '',
    });
  };

  const openSchemeEdit = (scheme: Scheme) => {
    setEditingSchemeDetails(scheme.id);
    setSchemeForm({
      scheme_name: scheme.scheme_name,
      description: scheme.description,
      benefits: scheme.benefits,
      eligibility: scheme.eligibility,
    });
  };

  const saveSchemeDetails = async () => {
    if (!editingSchemeDetails || !schemeForm.scheme_name.trim()) return;
    const { error } = await supabase
      .from('schemes')
      .update({
        scheme_name: schemeForm.scheme_name.trim(),
        description: schemeForm.description.trim(),
        benefits: schemeForm.benefits.trim(),
        eligibility: schemeForm.eligibility.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingSchemeDetails);

    if (error) {
      alert(error.message);
      return;
    }
    setEditingSchemeDetails(null);
    fetchDashboardData();
  };

  const deleteScheme = async (schemeId: string, schemeName: string) => {
    if (!confirm(t(`Delete scheme "${schemeName}"?`, `"${schemeName}" పథకాన్ని తొలగించాలా?`))) return;
    await supabase.from('scheme_beneficiaries').delete().eq('scheme_id', schemeId);
    const { error } = await supabase.from('schemes').delete().eq('id', schemeId);
    if (error) {
      alert(error.message);
      return;
    }
    fetchDashboardData();
  };

  const deleteBeneficiary = async (id: string) => {
    if (!confirm(t('Delete this beneficiary record?', 'ఈ లబ్ధిదారు రికార్డును తొలగించాలా?'))) return;
    await supabase.from('scheme_beneficiaries').delete().eq('id', id);
    fetchDashboardData();
  };

  const saveBeneficiaryRecord = async () => {
    if (!beneficiaryForm.scheme_id || !beneficiaryForm.financial_year.trim()) return;
    const count = Number(beneficiaryForm.beneficiaries_count);
    if (!Number.isFinite(count) || count < 0) {
      alert('Please enter a valid beneficiary count');
      return;
    }

    const { error } = await supabase.from('scheme_beneficiaries').insert([{
      scheme_id: beneficiaryForm.scheme_id,
      financial_year: beneficiaryForm.financial_year.trim(),
      beneficiaries_count: count,
      notes: beneficiaryForm.notes.trim(),
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingScheme(null);
    setBeneficiaryForm({ scheme_id: '', financial_year: '2025-26', beneficiaries_count: '', notes: '' });
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-5 text-white shadow-lg">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[url('/images/rice.jpg')] bg-cover bg-center opacity-20 md:block" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <PortalLogo size="lg" />
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
            </h1>
            <p className="mt-2 text-cyan-100">
              {t(
                'Kumram Bheem Asifabad District - Asifabad Division',
                'కుమ్రం భీం ఆసిఫాబాద్ జిల్లా - ఆసిఫాబాద్ డివిజన్'
              )}
            </p>
            <p className="mt-3 text-sm font-semibold text-emerald-50">
              {t(
                'Developed and maintained by K. Vinay Reddy, MAO, Tiryani',
                'అభివృద్ధి మరియు నిర్వహణ: కె. వినయ్ రెడ్డి, ఎం.ఏ.ఓ, తిర్యాని'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GoogleMapWidget />
        <WeatherWidget />
      </div>

      {/* Mandal Overview */}
      {mandalData && (
        <div className="portal-card p-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            {t('Mandal Overview', 'మండల వివరాలు')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Building2 className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Gram Panchayats', 'గ్రామ పంచాయతీలు')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{mandalData.total_gram_panchayats}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Layers className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Revenue Villages', 'రెవెన్యూ గ్రామాలు')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{mandalData.total_revenue_villages}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Users className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Total Farmers', 'మొత్తం రైతులు')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{mandalData.total_farmers.toLocaleString()}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-md">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <TrendingUp className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Cultivable Area', 'సాగు విస్తీర్ణం')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{mandalData.cultivable_area.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="rounded-lg p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Geographical Area', 'భౌగోళిక విస్తీర్ణం')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{mandalData.geographical_area.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{mandalData.area_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-950/60 dark:to-cyan-900/40">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-cyan-700 dark:text-cyan-300" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Normal Rainfall', 'సాధారణ వర్షపాతం')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{mandalData.normal_rainfall}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{mandalData.rainfall_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900/50 dark:to-stone-800/50">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Soil Types', 'నేల రకాలు')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandalData.soil_types.map((soil, i) => (
                      <span key={i} className="bg-white/90 text-stone-700 dark:bg-slate-700 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                        {soil}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Statistics */}
      <div className="portal-card p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          {t('Major Crops', 'ప్రధాన పంటలు')} - {t('Total', 'మొత్తం')}: {totalAcreage.toLocaleString()} {t('acres', 'ఎకరాలు')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {crops.map((crop, idx) => {
            const gradients = [
              'from-emerald-500 to-emerald-600',
              'from-teal-500 to-teal-600',
              'from-cyan-500 to-cyan-600',
              'from-blue-500 to-blue-600',
              'from-purple-500 to-purple-600'
            ];
            return (
              <div key={crop.id} className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${gradients[idx % gradients.length]} p-3 text-white shadow-md cursor-pointer hover:shadow-lg transition-all`}>
                {isAdminUser && (
                  <button
                    onClick={() => setEditingCrop(editingCrop === crop.id ? null : crop.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-white/20 p-1 rounded transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-xs opacity-90">{crop.crop_name}</p>
                <p className="text-2xl font-bold mt-1">{crop.acreage.toLocaleString()}</p>
                <p className="text-[10px] opacity-75">{t('acres', 'ఎకరాలు')}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="portal-card p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-900 dark:text-white">
              <PackageCheck className="w-6 h-6 text-emerald-600" />
              {t('Fertilizer Availability', 'ఎరువుల లభ్యత')}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {t(
                'Totals from Stock Management (dealer-wise allocation in MTS)',
                'స్టాక్ నిర్వహణ నుండి మొత్తాలు (డీలర్ వారీగా MTS)'
              )}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {fertilizers.length} {t('fertilizer types', 'ఎరువుల రకాలు')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fertilizers.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              {t(
                'No fertilizer stock entered yet. Add dealer-wise stock in Stock Management.',
                'ఇంకా ఎరువుల స్టాక్ నమోదు కాలేదు. స్టాక్ నిర్వహణలో డీలర్ వారీగా స్టాక్ జోడించండి.'
              )}
            </div>
          )}
          {fertilizers.map((fertilizer) => {
            const percentage = Math.max(
              8,
              Math.round((fertilizer.quantity_available / highestFertilizerStock) * 100)
            );
            const status =
              percentage >= 70
                ? t('Well stocked', 'సరిపడా స్టాక్')
                : percentage >= 35
                  ? t('Moderate stock', 'మధ్యస్థ స్టాక్')
                  : t('Low stock', 'తక్కువ స్టాక్');
            const statusClass =
              percentage >= 70
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : percentage >= 35
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300';

            return (
              <div
                key={fertilizer.id}
                className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-emerald-50/50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/80"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      {t('Fertilizer', 'ఎరువు')}
                    </p>
                    <h3 className="mt-0.5 text-base font-black text-gray-950 dark:text-white">
                      {fertilizer.fertilizer_type}
                    </h3>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                    {fertilizer.quantity_available.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mb-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">MTS</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Government Schemes */}
      <div className="portal-card p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          {t('Government Schemes', 'ప్రభుత్వ పథకాలు')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schemes.map((scheme, idx) => {
            const schemeColors = [
              'border-l-4 border-l-emerald-500',
              'border-l-4 border-l-blue-500',
              'border-l-4 border-l-orange-500',
              'border-l-4 border-l-purple-500'
            ];
            const eligibility =
              scheme.scheme_name.trim().toLowerCase() === 'rythu bhima'
                ? 'Age between 18-59 years'
                : scheme.eligibility;
            return (
              <div key={scheme.id} className={`${schemeColors[idx % 4]} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 hover:shadow-md transition-all group`}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{scheme.scheme_name}</h3>
                  {isAdminUser && (
                    <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openBeneficiaryForm(scheme.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                        title={t('Add beneficiaries', 'లబ్ధిదారులను జోడించండి')}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openSchemeEdit(scheme)}
                        className="text-amber-600 hover:bg-amber-50 p-2 rounded"
                        title={t('Edit scheme', 'పథకం సవరించు')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteScheme(scheme.id, scheme.scheme_name)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                        title={t('Delete scheme', 'పథకం తొలగించు')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {isAdminUser && editingSchemeDetails === scheme.id ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={schemeForm.scheme_name}
                      onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Scheme name', 'పథకం పేరు')}
                    />
                    <textarea
                      value={schemeForm.description}
                      onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Description', 'వివరణ')}
                    />
                    <textarea
                      value={schemeForm.benefits}
                      onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Benefits', 'ప్రయోజనాలు')}
                    />
                    <textarea
                      value={schemeForm.eligibility}
                      onChange={(e) => setSchemeForm({ ...schemeForm, eligibility: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Eligibility', 'అర్హత')}
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={saveSchemeDetails} className="rounded-lg bg-emerald-700 p-2 text-white">
                        <Save className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingSchemeDetails(null)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-slate-300 text-sm mt-1.5">{scheme.description}</p>
                    <div className="space-y-1.5 mt-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-fit">{t('Benefits:', 'ప్రయోజనాలు:')}</span>
                        <span className="text-gray-700 dark:text-slate-200">{scheme.benefits}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-fit">{t('Eligibility:', 'అర్హత:')}</span>
                        <span className="text-gray-700 dark:text-slate-200">{eligibility}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-2.5 dark:border-slate-600 dark:bg-slate-800/80">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('Financial year beneficiaries', 'ఆర్థిక సంవత్సరం లబ్ధిదారులు')}
                  </p>
                  <div className="space-y-2">
                    {schemeBeneficiaries.filter((row) => row.scheme_id === scheme.id).length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('No beneficiary records yet', 'ఇంకా లబ్ధిదారుల రికార్డులు లేవు')}</p>
                    )}
                    {schemeBeneficiaries
                      .filter((row) => row.scheme_id === scheme.id)
                      .map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{row.financial_year}</p>
                            {row.notes && <p className="text-xs text-slate-500 dark:text-slate-400">{row.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {row.beneficiaries_count.toLocaleString()}
                            </span>
                            {isAdminUser && (
                              <button
                                type="button"
                                onClick={() => deleteBeneficiary(row.id)}
                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                title={t('Delete record', 'రికార్డు తొలగించు')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {isAdminUser && editingScheme === scheme.id && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="text"
                        value={beneficiaryForm.financial_year}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, financial_year: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Financial year', 'ఆర్థిక సంవత్సరం')}
                      />
                      <input
                        type="number"
                        min="0"
                        value={beneficiaryForm.beneficiaries_count}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, beneficiaries_count: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Beneficiaries', 'లబ్ధిదారులు')}
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={saveBeneficiaryRecord} className="rounded-lg bg-emerald-700 p-2 text-white">
                          <Save className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setEditingScheme(null)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={beneficiaryForm.notes}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, notes: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Notes / village / category', 'గమనికలు / గ్రామం / వర్గం')}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
