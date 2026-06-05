import React, { useMemo, useState } from 'react';
import { AlertTriangle, Droplets, Leaf, Search, Sprout } from 'lucide-react';
import { CropCards } from '../../components/CropCards';
import { DiseaseCards } from '../../components/DiseaseCards';
import { FertilizerTable } from '../../components/FertilizerTable';
import { PestCards } from '../../components/PestCards';
import { useLanguage } from '../../context/LanguageContext';
import { useCropData } from '../../hooks/useCropData';

export function CropIntelligencePage({ cropSlug = 'paddy' }) {
  const { crop, cards, faqs, loading, error, search } = useCropData(cropSlug);
  const { isTelugu, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const profile = useMemo(() => crop?.profile || {}, [crop]);
  const localText = (english, telugu) => (isTelugu && telugu ? telugu : english);
  const cropName = localText(crop?.name_en || crop?.crop_name, crop?.name_te);
  const cropImageUrl = cropSlug === 'greengram' ? '/images/greengram.webp' : crop?.image_url;

  const runSearch = async () => {
    const rows = await search(query, { limit: 25 });
    setResults(rows);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>;
  }

  if (error || !crop) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">{t('Crop intelligence data is not available yet. Import the generated SQL or JSON first.', 'పంట సమాచారం ఇంకా అందుబాటులో లేదు. ముందుగా SQL లేదా JSON దిగుమతి చేయండి.')}</div>;
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-xl">
        <img src={cropImageUrl} alt={cropName} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-900/75 to-slate-900/40" />
        <div className="relative p-5 text-white md:p-7">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-black">
            <Leaf className="h-4 w-4" />
            {t('Crop Intelligence', 'పంట సమాచారం')}
          </div>
          <h1 className="mt-3 text-3xl font-black">{cropName}</h1>
          <p className="text-sm italic text-emerald-100">{crop.scientific_name}</p>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-emerald-50">{localText(profile.crop_profile || crop.description, profile.crop_profile_te)}</p>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <InfoTile icon={Sprout} label={t('Soil', 'నేల')} value={localText(profile.soil_requirements, profile.soil_requirements_te)} />
        <InfoTile icon={Droplets} label={t('Irrigation', 'నీటి నిర్వహణ')} value={(crop.crop_irrigation || []).map((item) => `${item.stage}: ${localText(item.recommendation_en, item.recommendation_te)}`).join(' ')} />
        <InfoTile icon={AlertTriangle} label={t('Seed', 'విత్తనం')} value={profile.seed_rate_seed_treatment} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search crop chatbot knowledge...', 'పంట సమాచారం శోధించండి...')}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button onClick={runSearch} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white">{t('Search', 'శోధించండి')}</button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {(results.length ? results : faqs.slice(0, 6)).map((faq) => (
            <article key={faq.id || faq.question} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-black text-slate-950 dark:text-white">{faq.question}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{localText(faq.answer, faq.answer_te)}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-black text-slate-950 dark:text-white">{t('Recommended Varieties', 'సిఫారసు చేసిన రకాలు')}</h2>
        <CropCards varieties={cards.varieties} />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-black text-slate-950 dark:text-white">{t('Fertilizer Schedule', 'ఎరువుల పట్టిక')}</h2>
        <FertilizerTable fertilizers={cards.fertilizers} isTelugu={isTelugu} />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-black text-slate-950 dark:text-white">{t('Pest Management', 'పురుగుల నిర్వహణ')}</h2>
        <PestCards pests={cards.pests} />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-black text-slate-950 dark:text-white">{t('Disease Management', 'తెగుళ్ల నిర్వహణ')}</h2>
        <DiseaseCards diseases={cards.diseases} />
      </section>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5 text-emerald-700" />
        <h3 className="font-black text-slate-950 dark:text-white">{label}</h3>
      </div>
      <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{value}</p>
    </article>
  );
}
