import React from 'react';
import { Copy, Download, ImageOff, MessageCircle, ShieldCheck } from 'lucide-react';
import type { CropProtectionCrop, CropProtectionItem, LanguageCode } from '../../services/cropProtectionService';
import { advisoryText, hasTelugu, pickLang } from '../../services/cropProtectionService';
import { label } from '../../services/translationService';
import { downloadAdvisoryPdf } from '../../services/pdfAdvisoryService';
import { RecommendationPanel } from './RecommendationPanel';

export function ProtectionItemCard({
  crop,
  item,
  language,
}: {
  crop: CropProtectionCrop;
  item: CropProtectionItem;
  language: LanguageCode;
}) {
  const showTeluguBadge =
    language === 'te' &&
    (!hasTelugu(item.name_te) || !hasTelugu(item.symptoms_te) || !hasTelugu(item.damage_te));
  const advisory = advisoryText(crop, item, language);

  const copyAdvisory = async () => {
    await navigator.clipboard.writeText(advisory);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(advisory)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 sm:w-36">
          {item.image_urls?.[0] ? (
            <img src={item.image_urls[0]} alt={item.name_en} className="h-28 w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-28 items-center justify-center gap-2 px-3 text-center text-[11px] font-bold text-slate-500">
              <ImageOff className="h-4 w-4" />
              No official image available - identify by symptoms.
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
                {pickLang(crop.name_en, crop.name_te, language)}
              </p>
              <h3 className="text-base font-black text-slate-950">{pickLang(item.name_en, item.name_te, language)}</h3>
              <p className="text-xs font-semibold italic text-slate-500">{item.scientific_name || 'Scientific name will be updated soon'}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                {label(categoryLabel(item.category), language)}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                {item.severity_level}
              </span>
              {item.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
          {showTeluguBadge && (
            <p className="mt-2 rounded-md bg-yellow-50 px-2 py-1 text-[11px] font-bold text-yellow-800">
              {label('Telugu information will be updated soon', language)}
            </p>
          )}
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <InfoBlock title={label('Symptoms', language)} value={pickLang(item.symptoms_en, item.symptoms_te, language)} />
            <InfoBlock title={label('Damage', language)} value={pickLang(item.damage_en, item.damage_te, language)} />
            <InfoBlock title="ETL / Stage" value={`${item.etl || 'Refer local advisory'} · ${item.stage || 'All stages'}`} />
          </div>
          <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-700">
            <span className="font-black">Favourable conditions: </span>
            {pickLang(item.favourable_conditions_en, item.favourable_conditions_te, language)}
          </div>
          <RecommendationPanel recommendations={item.recommendations || []} language={language} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyAdvisory} className="action-button">
              <Copy className="h-4 w-4" /> {label('Copy Advisory', language)}
            </button>
            <button type="button" onClick={shareWhatsApp} className="action-button bg-green-600 text-white">
              <MessageCircle className="h-4 w-4" /> {label('WhatsApp', language)}
            </button>
            <button type="button" onClick={() => downloadAdvisoryPdf(crop, item, language)} className="action-button bg-emerald-700 text-white">
              <Download className="h-4 w-4" /> {label('Download PDF', language)}
            </button>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            Source: {item.source_name || 'Official source pending'} {item.source_url ? `- ${item.source_url}` : ''}
          </p>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 font-semibold leading-5 text-slate-800">{value}</p>
    </div>
  );
}

function categoryLabel(category: CropProtectionItem['category']) {
  const labels: Record<CropProtectionItem['category'], string> = {
    pest: 'Pests',
    disease: 'Diseases',
    weed: 'Weeds',
    nutrient: 'Nutrient Deficiencies',
  };
  return labels[category];
}
