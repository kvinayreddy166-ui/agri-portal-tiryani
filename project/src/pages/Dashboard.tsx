import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Droplets, CloudRain, Layers, TrendingUp, Edit2, PackageCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAggregatedFertilizerStock } from '../lib/fertilizerStock';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Crop, FertilizerStock, Scheme, MandalOverview } from '../types/database';

export function Dashboard() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerStock[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [mandalData, setMandalData] = useState<MandalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCrop, setEditingCrop] = useState<string | null>(null);
  const [editingScheme, setEditingScheme] = useState<string | null>(null);

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

      const aggregatedFertilizers = await fetchAggregatedFertilizerStock();

      if (cropsRes.data) setCrops(cropsRes.data);
      setFertilizers(aggregatedFertilizers);
      if (schemesRes.data) setSchemes(schemesRes.data);
      if (contentRes.data) setMandalData(contentRes.data.content);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAcreage = crops.reduce((sum, crop) => sum + crop.acreage, 0);
  const highestFertilizerStock = Math.max(...fertilizers.map((item) => item.quantity_available), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white shadow-lg">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[url('/images/rice.jpg')] bg-cover bg-center opacity-20 md:block" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <img src="/images/agri-emblem.png" alt="" className="h-20 w-20 rounded-full bg-white p-1 shadow-lg" />
          <div>
            <h1 className="text-4xl font-black tracking-tight">
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

      {/* Mandal Overview */}
      {mandalData && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-emerald-600" />
            {t('Mandal Overview', 'మండల వివరాలు')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
                <Building2 className="w-20 h-20" />
              </div>
              <p className="text-sm opacity-90 relative z-10">{t('Gram Panchayats', 'గ్రామ పంచాయతీలు')}</p>
              <p className="text-3xl font-bold mt-2 relative z-10">{mandalData.total_gram_panchayats}</p>
            </div>
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
                <Layers className="w-20 h-20" />
              </div>
              <p className="text-sm opacity-90 relative z-10">{t('Revenue Villages', 'రెవెన్యూ గ్రామాలు')}</p>
              <p className="text-3xl font-bold mt-2 relative z-10">{mandalData.total_revenue_villages}</p>
            </div>
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
                <Users className="w-20 h-20" />
              </div>
              <p className="text-sm opacity-90 relative z-10">{t('Total Farmers', 'మొత్తం రైతులు')}</p>
              <p className="text-3xl font-bold mt-2 relative z-10">{mandalData.total_farmers.toLocaleString()}</p>
            </div>
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
                <TrendingUp className="w-20 h-20" />
              </div>
              <p className="text-sm opacity-90 relative z-10">{t('Cultivable Area', 'సాగు విస్తీర్ణం')}</p>
              <p className="text-3xl font-bold mt-2 relative z-10">{mandalData.cultivable_area.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl p-4 bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-slate-700" />
                <div>
                  <p className="text-sm text-gray-600">{t('Geographical Area', 'భౌగోళిక విస్తీర్ణం')}</p>
                  <p className="text-2xl font-bold text-gray-900">{mandalData.geographical_area.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{mandalData.area_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-100 to-cyan-200">
              <div className="flex items-center gap-3">
                <CloudRain className="w-6 h-6 text-cyan-700" />
                <div>
                  <p className="text-sm text-gray-600">{t('Normal Rainfall', 'సాధారణ వర్షపాతం')}</p>
                  <p className="text-2xl font-bold text-gray-900">{mandalData.normal_rainfall}</p>
                  <p className="text-xs text-gray-500">{mandalData.rainfall_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-stone-100 to-stone-200">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-stone-700" />
                <div>
                  <p className="text-sm text-gray-600">{t('Soil Types', 'నేల రకాలు')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandalData.soil_types.map((soil, i) => (
                      <span key={i} className="bg-white text-stone-700 px-2 py-1 rounded text-xs font-medium">
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          {t('Major Crops', 'ప్రధాన పంటలు')} - {t('Total', 'మొత్తం')}: {totalAcreage.toLocaleString()} {t('acres', 'ఎకరాలు')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {crops.map((crop, idx) => {
            const gradients = [
              'from-emerald-500 to-emerald-600',
              'from-teal-500 to-teal-600',
              'from-cyan-500 to-cyan-600',
              'from-blue-500 to-blue-600',
              'from-purple-500 to-purple-600'
            ];
            return (
              <div key={crop.id} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[idx]} p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all`}>
                {isAdminUser && (
                  <button
                    onClick={() => setEditingCrop(editingCrop === crop.id ? null : crop.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/20 p-1 rounded transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <p className="text-sm opacity-90">{crop.crop_name}</p>
                <p className="text-3xl font-bold mt-2">{crop.acreage.toLocaleString()}</p>
                <p className="text-xs opacity-75">{t('acres', 'ఎకరాలు')}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-gray-900">
              <PackageCheck className="w-7 h-7 text-emerald-600" />
              {t('Fertilizer Availability', 'ఎరువుల లభ్యత')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t(
                'Totals from Stock Management (dealer-wise entries in MTS)',
                'స్టాక్ నిర్వహణ నుండి మొత్తాలు (డీలర్ వారీగా MTS)'
              )}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            {fertilizers.length} {t('fertilizer types', 'ఎరువుల రకాలు')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fertilizers.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
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
                ? 'bg-emerald-100 text-emerald-700'
                : percentage >= 35
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700';

            return (
              <div
                key={fertilizer.id}
                className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {t('Fertilizer', 'ఎరువు')}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-gray-950">
                      {fertilizer.fertilizer_type}
                    </h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-4xl font-black tracking-tight text-gray-950">
                    {fertilizer.quantity_available.toLocaleString()}
                  </p>
                  <p className="mb-1 text-sm font-bold text-emerald-700">MTS</p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-7 h-7 text-emerald-600" />
          {t('Government Schemes', 'ప్రభుత్వ పథకాలు')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemes.map((scheme, idx) => {
            const schemeColors = [
              'border-l-4 border-l-emerald-500',
              'border-l-4 border-l-blue-500',
              'border-l-4 border-l-orange-500',
              'border-l-4 border-l-purple-500'
            ];
            return (
              <div key={scheme.id} className={`${schemeColors[idx % 4]} bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 hover:shadow-lg transition-all group`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-900">{scheme.scheme_name}</h3>
                  {isAdminUser && (
                    <button
                      onClick={() => setEditingScheme(editingScheme === scheme.id ? null : scheme.id)}
                      className="opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-50 p-2 rounded transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-2">{scheme.description}</p>
                <div className="space-y-2 mt-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-emerald-600 min-w-fit">{t('Benefits:', 'ప్రయోజనాలు:')}</span>
                    <span className="text-gray-700">{scheme.benefits}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-emerald-600 min-w-fit">{t('Eligibility:', 'అర్హత:')}</span>
                    <span className="text-gray-700">{scheme.eligibility}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
