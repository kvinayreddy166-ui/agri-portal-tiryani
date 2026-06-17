import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { Bug, AlertTriangle, Leaf, Search, ChevronRight, ArrowLeft } from 'lucide-react';

// Types
interface InsectPest {
  id: string;
  crop_id: string;
  name_en: string;
  name_te: string;
  scientific_name?: string;
  identification_en?: string;
  identification_te?: string;
  life_cycle_en?: string;
  life_cycle_te?: string;
  symptoms_en?: string;
  symptoms_te?: string;
  damage_symptoms_en?: string;
  damage_symptoms_te?: string;
  economic_threshold_level?: string;
  ipm_practices_en?: string;
  ipm_practices_te?: string;
  chemical_control_en?: string;
  chemical_control_te?: string;
  biological_control_en?: string;
  biological_control_te?: string;
  preventive_measures_en?: string;
  preventive_measures_te?: string;
  pest_image_url?: string;
  larva_image_url?: string;
  adult_image_url?: string;
  eggs_image_url?: string;
  damage_image_url?: string;
  field_symptoms_image_url?: string;
  affected_parts_image_url?: string;
}

interface Disease {
  id: string;
  crop_id: string;
  name_en: string;
  name_te: string;
  scientific_name?: string;
  symptoms_en?: string;
  symptoms_te?: string;
  favourable_conditions_en?: string;
  favourable_conditions_te?: string;
  disease_cycle_en?: string;
  disease_cycle_te?: string;
  integrated_management_en?: string;
  integrated_management_te?: string;
  chemical_control_en?: string;
  chemical_control_te?: string;
  biological_control_en?: string;
  biological_control_te?: string;
  preventive_measures_en?: string;
  preventive_measures_te?: string;
  disease_image_url?: string;
  symptoms_image_url?: string;
  affected_plant_image_url?: string;
}

interface Weed {
  id: string;
  crop_id: string;
  name_en: string;
  name_te: string;
  scientific_name?: string;
  weed_type?: string;
  description_en?: string;
  description_te?: string;
  weed_image_url?: string;
}

const CROPS: Array<{ value: string; labelEn: string; labelTe: string }> = [
  { value: 'cotton', labelEn: 'Cotton', labelTe: 'పంచ' },
  { value: 'paddy', labelEn: 'Paddy', labelTe: 'వరి' },
  { value: 'maize', labelEn: 'Maize', labelTe: 'మొక్కజొన్న' },
  { value: 'groundnut', labelEn: 'Groundnut', labelTe: 'వేరుశెనగ' },
  { value: 'redgram', labelEn: 'Redgram', labelTe: 'కందులు' },
  { value: 'greengram', labelEn: 'Greengram', labelTe: 'పెసరు' },
  { value: 'sesamum', labelEn: 'Sesamum', labelTe: 'నువ్వులు' },
  { value: 'soybean', labelEn: 'Soybean', labelTe: 'సోయాబీన్' },
  { value: 'chilli', labelEn: 'Chilli', labelTe: 'మిరప' },
  { value: 'turmeric', labelEn: 'Turmeric', labelTe: 'పసుపు' },
];

type TabType = 'pests' | 'diseases' | 'weeds';

export function PestDiseaseGuide() {
  const { language, t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<string>('cotton');
  const [activeTab, setActiveTab] = useState<TabType>('pests');
  const [pests, setPests] = useState<InsectPest[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [weeds, setWeeds] = useState<Weed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InsectPest | Disease | Weed | null>(null);

  useEffect(() => {
    fetchPestDiseaseData();
  }, [selectedCrop]);

  const fetchPestDiseaseData = async () => {
    setLoading(true);
    try {
      const [pestsData, diseasesData, weedsData] = await Promise.all([
        supabase
          .from('insect_pests')
          .select('id, pest_name, scientific_name, symptoms, management, image_url, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('diseases')
          .select('id, disease_name, causal_organism, symptoms, management, image_url, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('weeds')
          .select('id, weed_name, scientific_name, symptoms, management, image_url, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (pestsData.error) throw pestsData.error;
      if (diseasesData.error) throw diseasesData.error;
      if (weedsData.error) throw weedsData.error;

      setPests(pestsData.data || []);
      setDiseases(diseasesData.data || []);
      setWeeds(weedsData.data || []);
    } catch (error) {
      console.error('Error fetching pest/disease data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    const items = activeTab === 'pests' ? pests : activeTab === 'diseases' ? diseases : weeds;
    
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name_en?.toLowerCase().includes(query) ||
      item.name_te?.includes(query) ||
      (item as InsectPest | Disease).scientific_name?.toLowerCase().includes(query)
    );
  };

  const filteredItems = getFilteredItems();

  const handleItemClick = (item: InsectPest | Disease | Weed) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'pests': return Bug;
      case 'diseases': return AlertTriangle;
      case 'weeds': return Leaf;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'pests': return t('Insect Pests', 'పురుగులు');
      case 'diseases': return t('Diseases', 'వ్యాధులు');
      case 'weeds': return t('Weeds', 'కలుపు మొక్కలు');
    }
  };

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
        <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
          <button
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to List', 'జాబితాకు తిరిగి వెళ్లు')}
          </button>

          <div className="rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {language === 'en' ? selectedItem.name_en : selectedItem.name_te}
            </h1>
            {(selectedItem as InsectPest | Disease).scientific_name && (
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-4 italic">
                {(selectedItem as InsectPest | Disease).scientific_name}
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {activeTab === 'pests' && (
                <>
                  {(selectedItem as InsectPest).identification_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Identification', 'గుర్తింపు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).identification_en : (selectedItem as InsectPest).identification_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).life_cycle_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Life Cycle', 'జీవిత చక్రం')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).life_cycle_en : (selectedItem as InsectPest).life_cycle_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).symptoms_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Symptoms', 'లక్షణాలు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).symptoms_en : (selectedItem as InsectPest).symptoms_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).damage_symptoms_en && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Damage Symptoms', 'నష్టం లక్షణాలు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).damage_symptoms_en : (selectedItem as InsectPest).damage_symptoms_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).economic_threshold_level && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Economic Threshold Level', 'ఆర్థిక పరిమిత స్థాయి')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {(selectedItem as InsectPest).economic_threshold_level}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).ipm_practices_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('IPM Practices', 'IPM పద్ధతులు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).ipm_practices_en : (selectedItem as InsectPest).ipm_practices_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).chemical_control_en && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Chemical Control', 'రసాయన నియంత్రణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).chemical_control_en : (selectedItem as InsectPest).chemical_control_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).biological_control_en && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Biological Control', 'జీవ నియంత్రణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).biological_control_en : (selectedItem as InsectPest).biological_control_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as InsectPest).preventive_measures_en && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Preventive Measures', 'నివారణ చర్యలు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as InsectPest).preventive_measures_en : (selectedItem as InsectPest).preventive_measures_te}
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'diseases' && (
                <>
                  {(selectedItem as Disease).symptoms_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Symptoms', 'లక్షణాలు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).symptoms_en : (selectedItem as Disease).symptoms_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).favourable_conditions_en && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Favourable Conditions', 'అనుకూల పరిస్థితులు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).favourable_conditions_en : (selectedItem as Disease).favourable_conditions_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).disease_cycle_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Disease Cycle', 'వ్యాధి చక్రం')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).disease_cycle_en : (selectedItem as Disease).disease_cycle_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).integrated_management_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Integrated Management', 'సమగ్ర నిర్వహణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).integrated_management_en : (selectedItem as Disease).integrated_management_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).chemical_control_en && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Chemical Control', 'రసాయన నియంత్రణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).chemical_control_en : (selectedItem as Disease).chemical_control_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).biological_control_en && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Biological Control', 'జీవ నియంత్రణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).biological_control_en : (selectedItem as Disease).biological_control_te}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Disease).preventive_measures_en && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Preventive Measures', 'నివారణ చర్యలు')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Disease).preventive_measures_en : (selectedItem as Disease).preventive_measures_te}
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'weeds' && (
                <>
                  {(selectedItem as Weed).weed_type && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Weed Type', 'కలుపు రకం')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {(selectedItem as Weed).weed_type}
                      </p>
                    </div>
                  )}

                  {(selectedItem as Weed).description_en && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t('Description', 'వివరణ')}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? (selectedItem as Weed).description_en : (selectedItem as Weed).description_te}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
        <PageHeader
          eyebrow={t('Crop Intelligence', 'పంట గుర్తింపు')}
          title={t('Pest, Disease & Weed Management Guide', 'పురుగు, వ్యాధి & కలుపు నిర్వహణ గైడ్')}
          description={t(
            'Comprehensive guide for managing pests, diseases, and weeds in Telangana crops',
            'తెలంగాణ పంటలలో పురుగులు, వ్యాధులు మరియు కలుపు మొక్కల నిర్వహణకు సమగ్ర గైడ్'
          )}
        />

        {/* Crop Selection */}
        <div className="mb-6 rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
          <label className="mb-3 block text-sm font-bold text-slate-700 dark:text-slate-300">
            {t('Select Crop', 'పంటను ఎంచుకోండి')}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-base font-bold text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
          >
            {CROPS.map((crop) => (
              <option key={crop.value} value={crop.value}>
                {language === 'en' ? crop.labelEn : crop.labelTe}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-2 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
          {(['pests', 'diseases', 'weeds'] as TabType[]).map((tab) => {
            const Icon = getTabIcon(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-emerald-950/30'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6 rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search pests, diseases, weeds...', 'పురుగులు, వ్యాధులు, కలుపు మొక్కలను వెతుకు...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white pl-12 pr-4 py-3 text-base font-medium text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-12 text-center shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
              {searchQuery
                ? t('No results found', 'ఫలితాలు కనుగొనబడలేదు')
                : t('No data available for this crop', 'ఈ పంటకు డేటా అందుబాటులో లేదు')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/50 p-5 text-left shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 dark:border-emerald-800/50 dark:from-slate-900 dark:to-emerald-950/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {language === 'en' ? item.name_en : item.name_te}
                    </h3>
                    {(item as InsectPest | Disease).scientific_name && (
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
                        {(item as InsectPest | Disease).scientific_name}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
