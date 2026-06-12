import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  Droplets,
  FlaskConical,
  Flower2,
  Leaf,
  Microscope,
  Rows3,
  Search,
  ShieldCheck,
  Sprout,
  TableProperties,
  Wheat,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCropData } from '../../hooks/useCropData';

const SECTION_TEXT = {
  overview: ['Crop Overview', 'పంట అవలోకనం'],
  land: ['Land Preparation', 'భూమి సిద్ధం'],
  nursery: ['Nursery Management', 'నారు మడి నిర్వహణ'],
  varieties: ['Recommended Varieties', 'సిఫార్సు చేసిన రకాలు'],
  seed: ['Seed Rate', 'విత్తన మోతాదు'],
  irrigation: ['Irrigation Schedule', 'నీటి పారుదల పట్టిక'],
  fertilizer: ['Fertilizer Schedule', 'ఎరువుల పట్టిక'],
  weeds: ['Weed Management', 'కలుపు నిర్వహణ'],
  pests: ['Pest Management', 'పురుగుల నిర్వహణ'],
  diseases: ['Disease Management', 'తెగుళ్ల నిర్వహణ'],
  knowledge: ['Knowledge Search', 'సమాచార శోధన'],
};

export function CropIntelligencePage({ cropSlug = 'paddy' }) {
  const { crop, cards, faqs, loading, error, search } = useCropData(cropSlug);
  const { isTelugu, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const profile = useMemo(() => crop?.profile || {}, [crop]);
  const localText = (english, telugu) => (isTelugu && telugu ? telugu : english);
  const cropName = localText(crop?.name_en || crop?.crop_name, crop?.name_te);
  const cropImageUrl = cropSlug === 'greengram' ? '/images/greengram.webp' : crop?.image_url;
  const isRiceCrop = ['paddy', 'rice'].includes(String(cropSlug).toLowerCase()) || /rice|paddy/i.test(cropName || '');

  const productionRows = useMemo(() => {
    const rows = asArray(crop?.crop_production).map((item, index) => ({
      id: item.id || `production-${index}`,
      stage: item.stage || item.title_en || item.title || t('Practice', 'పద్ధతి'),
      recommendation: localizedValue(item, isTelugu, ['description_en', 'body_en', 'description', 'body'], ['description_te', 'body_te']),
    }));

    const practices = asArray(crop?.crop_practices).map((item, index) => ({
      id: item.id || `practice-${index}`,
      stage: localizedValue(item, isTelugu, ['title_en', 'title', 'key'], ['title_te']),
      recommendation: localizedValue(item, isTelugu, ['body_en', 'body'], ['body_te']),
    }));

    return [...rows, ...practices].filter((row) => row.stage || row.recommendation);
  }, [crop, isTelugu, t]);

  const landRows = useMemo(() => {
    const rows = productionRows.filter((row) => !/nursery|నారు/i.test(row.stage || ''));
    if (rows.length) return rows;
    return [
      {
        id: 'land-preparation-summary',
        stage: t('Preparation guidance', 'సిద్ధం చేసే సూచనలు'),
        recommendation: profile.sowing_time_spacing_land_preparation || profile.soil_requirements || '',
      },
    ].filter((row) => row.recommendation);
  }, [productionRows, profile, t]);

  const nurseryRows = useMemo(() => {
    if (!isRiceCrop) return [];
    const nurserySpecific = productionRows.filter((row) => /nursery|నారు/i.test(row.stage || ''));
    const rows = nurserySpecific.length
      ? nurserySpecific
      : [
          {
            id: 'rice-nursery-seed',
            stage: t('Seed and nursery beds', 'విత్తనం మరియు నారు మడులు'),
            recommendation: profile.seed_rate_seed_treatment || '',
          },
          {
            id: 'rice-nursery-transplanting',
            stage: t('Transplanting readiness', 'నాట్లకు సిద్ధం'),
            recommendation: profile.sowing_time_spacing_land_preparation || '',
          },
        ];
    return rows.filter((row) => row.recommendation);
  }, [isRiceCrop, productionRows, profile, t]);

  const overviewRows = [
    {
      label: t('Scientific name', 'శాస్త్రీయ నామం'),
      value: crop?.scientific_name,
    },
    {
      label: t('Soil suitability', 'నేల అనుకూలత'),
      value: localText(profile.soil_requirements, profile.soil_requirements_te),
    },
    {
      label: t('Climate', 'వాతావరణం'),
      value: localText(profile.climate_requirements, profile.climate_requirements_te),
    },
    {
      label: t('Harvesting / yield', 'కోత / దిగుబడి'),
      value: valueToText(profile.harvesting_yield, isTelugu),
    },
  ].filter((item) => item.value);

  const runSearch = async () => {
    const rows = await search(query, { limit: 25 });
    setResults(rows);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">
        {t(
          'Crop intelligence data is not available yet. Import the generated SQL or JSON first.',
          'పంట సమాచారం ఇంకా అందుబాటులో లేదు. ముందుగా SQL లేదా JSON దిగుమతి చేయండి.'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-xl">
        <img src={cropImageUrl} alt={cropName} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-900/75 to-slate-900/35" />
        <div className="relative p-5 text-white md:p-7">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-black">
            <Leaf className="h-4 w-4" />
            {t('Crop Intelligence', 'పంట సమాచారం')}
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">{cropName}</h1>
          {crop.scientific_name && <p className="text-sm italic text-emerald-100">{crop.scientific_name}</p>}
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-emerald-50">
            {localText(profile.crop_profile || crop.description, profile.crop_profile_te)}
          </p>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={Sprout} label={t('Varieties', 'రకాలు')} value={cards.varieties.length} />
        <MetricCard icon={Droplets} label={t('Irrigation stages', 'నీటి దశలు')} value={asArray(crop.crop_irrigation).length} />
        <MetricCard icon={AlertTriangle} label={t('Risks tracked', 'ప్రమాదాలు')} value={cards.pests.length + cards.diseases.length} />
      </div>

      <AccordionSection title={t(...SECTION_TEXT.overview)} icon={Leaf} defaultOpen>
        <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <TextPanel
            title={t('Field profile', 'పంట వివరాలు')}
            body={localText(profile.crop_profile || crop.description, profile.crop_profile_te)}
          />
          <DefinitionGrid rows={overviewRows} />
        </div>
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.land)} icon={Wheat} defaultOpen>
        <ResponsiveTable
          columns={[
            { key: 'stage', label: t('Stage', 'దశ') },
            { key: 'recommendation', label: t('Recommendation', 'సిఫార్సు') },
          ]}
          rows={landRows}
          emptyText={t('Land preparation guidance is not available for this crop yet.', 'ఈ పంటకు భూమి సిద్ధం వివరాలు ఇంకా అందుబాటులో లేవు.')}
        />
      </AccordionSection>

      {nurseryRows.length > 0 && (
        <AccordionSection title={t(...SECTION_TEXT.nursery)} icon={Flower2} defaultOpen>
          <div className="grid gap-3 md:grid-cols-2">
            {nurseryRows.map((row) => (
              <InfoCard key={row.id} title={row.stage} body={row.recommendation} />
            ))}
          </div>
        </AccordionSection>
      )}

      <AccordionSection title={t(...SECTION_TEXT.varieties)} icon={Sprout} defaultOpen>
        <VarietyCards varieties={cards.varieties} isTelugu={isTelugu} t={t} />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.seed)} icon={Rows3}>
        <div className="grid gap-3 lg:grid-cols-2">
          <TextPanel
            title={t('Seed rate and treatment', 'విత్తన మోతాదు మరియు శుద్ధి')}
            body={profile.seed_rate_seed_treatment || t('Seed rate details are not available for this crop yet.', 'ఈ పంటకు విత్తన మోతాదు వివరాలు ఇంకా అందుబాటులో లేవు.')}
          />
          <TextPanel
            title={t('Sowing / spacing', 'విత్తడం / దూరం')}
            body={profile.sowing_time_spacing_land_preparation || t('Sowing guidance is not available for this crop yet.', 'విత్తే వివరాలు ఇంకా అందుబాటులో లేవు.')}
          />
        </div>
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.irrigation)} icon={Droplets}>
        <ResponsiveTable
          columns={[
            { key: 'stage', label: t('Stage', 'దశ') },
            { key: 'recommendation', label: t('Irrigation advice', 'నీటి సూచన') },
          ]}
          rows={asArray(crop.crop_irrigation).map((item, index) => ({
            id: item.id || `irrigation-${index}`,
            stage: item.stage,
            recommendation: localizedValue(item, isTelugu, ['recommendation_en', 'recommendation'], ['recommendation_te']),
          }))}
          emptyText={t('Irrigation schedule is not available for this crop yet.', 'ఈ పంటకు నీటి పారుదల పట్టిక ఇంకా అందుబాటులో లేదు.')}
        />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.fertilizer)} icon={FlaskConical}>
        <ResponsiveTable
          columns={[
            { key: 'stage', label: t('Stage', 'దశ') },
            { key: 'fertilizer', label: t('Fertilizer', 'ఎరువు') },
            { key: 'quantity', label: t('Quantity', 'పరిమాణం') },
            { key: 'method', label: t('Method', 'పద్ధతి') },
          ]}
          rows={asArray(cards.fertilizers).map((item, index) => ({
            id: item.id || `fertilizer-${index}`,
            stage: item.stage,
            fertilizer: item.fertilizer,
            quantity: item.quantity,
            method: localizedValue(item, isTelugu, ['method'], ['description_te']),
          }))}
          emptyText={t('Fertilizer schedule is not available for this crop yet.', 'ఈ పంటకు ఎరువుల పట్టిక ఇంకా అందుబాటులో లేదు.')}
        />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.weeds)} icon={Wheat}>
        <ResponsiveTable
          columns={[
            { key: 'weed', label: t('Weed', 'కలుపు') },
            { key: 'identification', label: t('Identification', 'గుర్తింపు') },
            { key: 'management', label: t('Management', 'నిర్వహణ') },
            { key: 'control', label: t('Herbicide / dose', 'కలుపు మందు / మోతాదు') },
          ]}
          rows={asArray(cards.weeds).map((item, index) => ({
            id: item.id || `weed-${index}`,
            weed: item.weed_name,
            identification: item.scientific_name,
            management: item.control_measure,
            control: [item.herbicide, item.dose].filter(Boolean).join(' - '),
          }))}
          emptyText={t('Weed management details are not available for this crop yet.', 'ఈ పంటకు కలుపు నిర్వహణ వివరాలు ఇంకా అందుబాటులో లేవు.')}
        />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.pests)} icon={Bug}>
        <RiskCardGrid
          items={cards.pests}
          type="pest"
          isTelugu={isTelugu}
          fallbackImage={cropImageUrl}
          t={t}
        />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.diseases)} icon={Microscope}>
        <RiskCardGrid
          items={cards.diseases}
          type="disease"
          isTelugu={isTelugu}
          fallbackImage={cropImageUrl}
          t={t}
        />
      </AccordionSection>

      <AccordionSection title={t(...SECTION_TEXT.knowledge)} icon={Search}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search crop knowledge...', 'పంట సమాచారం శోధించండి...')}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button type="button" onClick={runSearch} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white">
            {t('Search', 'శోధించండి')}
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {(results.length ? results : faqs.slice(0, 6)).map((faq) => (
            <article key={faq.id || faq.question} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-black text-slate-950 dark:text-white">{faq.question}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                {localText(faq.answer, faq.answer_te)}
              </p>
            </article>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }) {
  return (
    <details
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-slate-50 px-3 py-3 dark:bg-slate-800">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate text-base font-black text-slate-950 dark:text-white">{title}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="p-3 md:p-4">{children}</div>
    </details>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function TextPanel({ title, body }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
        {valueToText(body)}
      </p>
    </article>
  );
}

function InfoCard({ title, body }) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{body}</p>
    </article>
  );
}

function DefinitionGrid({ rows }) {
  if (!rows.length) return null;
  return (
    <dl className="grid gap-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
          <dt className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{row.label}</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{valueToText(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function VarietyCards({ varieties = [], isTelugu, t }) {
  if (!varieties.length) {
    return <EmptyState text={t('Recommended varieties are not available for this crop yet.', 'ఈ పంటకు సిఫార్సు రకాలు ఇంకా అందుబాటులో లేవు.')} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {varieties.map((item) => {
        const name = item.variety || item.name || t('Variety', 'రకం');
        const notes = localizedValue(item, isTelugu, ['special_features', 'notes_en', 'notes'], ['notes_te']);
        return (
          <article
            key={item.id || name}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {item.image_url && <img src={item.image_url} alt={name} loading="lazy" decoding="async" className="h-32 w-full object-cover" />}
            <div className="p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-black text-slate-950 dark:text-white">{name}</h3>
                {item.duration && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{item.duration}</span>}
              </div>
              <div className="space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {item.expected_yield && (
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span>{item.expected_yield}</span>
                  </p>
                )}
                {notes && (
                  <p className="flex items-start gap-2">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span>{notes}</span>
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ResponsiveTable({ columns, rows = [], emptyText }) {
  const visibleRows = rows.filter((row) => columns.some((column) => row[column.key]));
  if (!visibleRows.length) return <EmptyState text={emptyText} />;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="table-scroll hidden md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleRows.map((row, index) => (
              <tr key={row.id || index} className="align-top">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                    {valueToText(row[column.key]) || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 p-2 md:hidden">
        {visibleRows.map((row, index) => (
          <article key={row.id || index} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            {columns.map((column) => (
              <div key={column.key} className="mb-2 last:mb-0">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.label}</p>
                <p className="mt-0.5 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{valueToText(row[column.key]) || '-'}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function RiskCardGrid({ items = [], type, isTelugu, fallbackImage, t }) {
  if (!items.length) {
    const emptyText =
      type === 'pest'
        ? t('Pest management details are not available for this crop yet.', 'ఈ పంటకు పురుగుల నిర్వహణ వివరాలు ఇంకా అందుబాటులో లేవు.')
        : t('Disease management details are not available for this crop yet.', 'ఈ పంటకు తెగుళ్ల నిర్వహణ వివరాలు ఇంకా అందుబాటులో లేవు.');
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((item, index) => {
        const name = type === 'pest'
          ? localizedValue(item, isTelugu, ['pest_name', 'name_en', 'name'], ['name_te'])
          : localizedValue(item, isTelugu, ['disease_name', 'name_en', 'name'], ['name_te']);
        const identification = type === 'pest'
          ? item.scientific_name
          : item.causal_organism || item.scientific_name;
        const control = type === 'pest'
          ? item.chemical_control || item.chemicals_text
          : item.fungicide || item.chemical_control || item.chemicals_text;
        return (
          <article
            key={item.id || `${type}-${name}-${index}`}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="grid gap-0 sm:grid-cols-[13rem_1fr]">
              <img
                src={item.image_url || fallbackImage}
                alt={name}
                loading="lazy"
                decoding="async"
                className="h-48 w-full bg-slate-100 object-cover sm:h-full dark:bg-slate-800"
              />
              <div className="p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      {type === 'pest' ? t('Pest', 'పురుగు') : t('Disease', 'తెగులు')}
                    </p>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">{name}</h3>
                  </div>
                  {type === 'pest' ? <Bug className="h-5 w-5 text-amber-600" /> : <Microscope className="h-5 w-5 text-red-600" />}
                </div>
                <div className="grid gap-2">
                  <RiskField
                    icon={AlertTriangle}
                    label={t('Symptoms', 'లక్షణాలు')}
                    value={localizedValue(item, isTelugu, ['symptoms', 'symptoms_en'], ['symptoms_te'])}
                  />
                  <RiskField
                    icon={TableProperties}
                    label={t('Identification', 'గుర్తింపు')}
                    value={identification || name}
                  />
                  <RiskField
                    icon={ShieldCheck}
                    label={t('Management Practices', 'నిర్వహణ పద్ధతులు')}
                    value={localizedValue(item, isTelugu, ['management', 'control_en'], ['control_te'])}
                  />
                  {control && (
                    <RiskField
                      icon={FlaskConical}
                      label={t('Recommended control', 'సిఫార్సు నియంత్రణ')}
                      value={control}
                      compact
                    />
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RiskField({ icon: Icon, label, value, compact = false }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold leading-6 text-slate-700 dark:text-slate-200`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-400">
      {text}
    </div>
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function localizedValue(item, isTelugu, englishKeys = [], teluguKeys = []) {
  if (!item) return '';
  const keys = isTelugu ? [...teluguKeys, ...englishKeys] : [...englishKeys, ...teluguKeys];
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') return valueToText(value, isTelugu);
  }
  return '';
}

function valueToText(value, isTelugu = false) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map((item) => valueToText(item, isTelugu)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if (isTelugu && value.te) return value.te;
    if (value.en) return value.en;
    if (value.description_en || value.description_te) return isTelugu && value.description_te ? value.description_te : value.description_en;
    return Object.values(value).map((item) => valueToText(item, isTelugu)).filter(Boolean).join(', ');
  }
  return String(value);
}
