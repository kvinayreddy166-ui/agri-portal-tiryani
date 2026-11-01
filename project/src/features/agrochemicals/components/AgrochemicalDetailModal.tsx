import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Droplets,
  Info,
  Shield,
  ShieldAlert,
  Sprout,
  Wheat,
  X,
  Zap,
} from 'lucide-react';
import { type AgrochemicalItem } from '../types';
import { ToxicityBadge } from './ToxicityBadge';
import { buildWhatsAppAdvisory } from '../services/agrochemicalService';
import { useLanguage } from '../../../../src/shared/context/LanguageContext';

interface AgrochemicalDetailModalProps {
  item: AgrochemicalItem | null;
  onClose: () => void;
  onToast: (title: string, message: string) => void;
}

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function AgrochemicalDetailModal({
  item,
  onClose,
  onToast,
}: AgrochemicalDetailModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const isFertilizer = item.category === 'fertilizer';

  const shareWhatsApp = () => {
    const text = buildWhatsAppAdvisory(item, t);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const copyAdvisory = async () => {
    try {
      const text = buildWhatsAppAdvisory(item, t);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast(t('Copied to Clipboard', 'క్లిప్‌బోర్డ్‌కు కాపీ అయింది'), t('Advisory copied successfully.', 'సలహా విజయవంతంగా కాపీ చేయబడింది.'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {t(item.category, item.categoryTe)}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {item.moaGroup}
              </span>
              <ToxicityBadge band={item.toxicityBand} size="sm" />
              {item.verificationStatus === 'VERIFIED' && (
                <span className="rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                  ✓ CIB&RC VERIFIED {item.cibrcPages && item.cibrcPages.length > 0 ? `(p. ${item.cibrcPages.join(', ')})` : ''}
                </span>
              )}
              {item.verificationStatus === 'PARTIALLY_VERIFIED' && (
                <span className="rounded-lg bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
                  SEC 9(3)/9(4) REGISTERED
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {item.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {item.nameTe} • {item.chemicalFamily} ({item.chemicalFamilyTe})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Trade / Brand Names */}
          {item.popularBrands.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-emerald-600" />
                {t('Popular Commercial Brands in Market', 'మార్కెట్లో లభించే ప్రసిద్ధ బ్రాండ్లు')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.popularBrands.map((b) => (
                  <span
                    key={b}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Dosage & Application */}
          <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/40 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <h4 className="text-xs font-black text-cyan-900 dark:text-cyan-200 mb-3 flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-cyan-600" />
              {t('Standard Dosage & Application Recommendations', 'సిఫార్సు చేయబడిన మోతాదు మరియు వినియోగ విధానం')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">
                  {t('Dosage per Acre', 'ఎకరాకు మోతాదు')}
                </span>
                <span className="text-sm font-black text-cyan-700 dark:text-cyan-300 mt-0.5 block">
                  {item.dosagePerAcre}
                </span>
              </div>

              <div className="rounded-xl border border-white/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">
                  {t('Dilution / Spray Rate', 'లీటరుకు / పంపుకు మోతాదు')}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {item.dosagePerLitre}
                </span>
              </div>
            </div>

            {/* Target Crops & Pests */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Wheat className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900 dark:text-slate-200">
                    {t('Approved Target Crops', 'సిఫార్సు పంటలు')}:
                  </strong>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{item.targetCrops.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Sprout className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900 dark:text-slate-200">
                    {isFertilizer ? t('Target Deficiency', 'పోషక లోపం') : t('Target Pests / Diseases / Weeds', 'నివారించే పురుగులు / తెగుళ్లు / కలుపు')}:
                  </strong>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{item.targetPests.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CIB&RC Approved Label Claims Table */}
          {item.cibrcApprovedClaims && item.cibrcApprovedClaims.length > 0 && (
            <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  {t('CIB&RC Officially Approved Label Claims', 'సిఐబి&ఆర్సి అధికారిక లేబుల్ సిఫార్సులు')}
                </h4>
                <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                  {item.cibrcApprovedClaims.length} {t('Claims Registered', 'సిఫార్సులు')}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-emerald-200/70 bg-white dark:border-emerald-900/50 dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/80 text-[10px] font-black uppercase text-emerald-950 dark:border-slate-800 dark:bg-slate-800/80 dark:text-emerald-300">
                      <th className="py-2.5 px-3">{t('Crop', 'పంట')}</th>
                      <th className="py-2.5 px-3">{t('Target Pest', 'పురుగు')}</th>
                      <th className="py-2.5 px-3">{t('Dose / ha', 'హెక్టారుకు మోతాదు')}</th>
                      <th className="py-2.5 px-3">{t('Dose / acre', 'ఎకరాకు మోతాదు')}</th>
                      <th className="py-2.5 px-3">{t('Water (L/ha)', 'నీరు')}</th>
                      <th className="py-2.5 px-3">{t('PHI (Days)', 'నిరీక్షణ (రోజులు)')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {item.cibrcApprovedClaims.map((claim, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                          {claim.crop}
                          {claim.cropTe && claim.cropTe !== claim.crop && (
                            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {claim.cropTe}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                          {claim.targetPest}
                          {claim.targetPestTe && claim.targetPestTe !== claim.targetPest && (
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                              {claim.targetPestTe}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {claim.formulationDosePerHa ? `${claim.formulationDosePerHa}/ha` : '—'}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-700 dark:text-emerald-300">
                          {claim.calculatedDosePerAcre || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {claim.dilutionWaterPerHa || '—'}
                        </td>
                        <td className="py-2 px-3 font-black text-slate-800 dark:text-slate-200">
                          {claim.phiDays || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Mode of Action & Resistance Group */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
            <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-600" />
              {t('Resistance Management & Mode of Action (MoA)', 'నిరోధకత నిర్వహణ మరియు చర్య విధానం')}
            </h4>
            <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <p>
                <strong className="font-bold text-purple-900 dark:text-purple-300">{item.moaGroup}:</strong>{' '}
                {item.moaGroupName}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.moaDescription}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
                {item.moaDescriptionTe}
              </p>
            </div>
          </div>

          {/* Section 3: Safety, PHI, Precautions & Antidote */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-amber-600" />
              {t('Safety Guidelines & Statutory Information', 'భద్రతా మార్గదర్శకాలు మరియు చట్టబద్ధ సమాచారం')}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {!isFertilizer && item.waitingPeriodDays !== 'N/A' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {t('Pre-Harvest Interval (PHI)', 'కోతకు నిరీక్షణ కాలం')}
                  </span>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                    {item.waitingPeriodDays} {t('days', 'రోజులు')}
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {t('Toxicity Band', 'విష తీవ్రత వర్గం')}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {item.toxicityLabel}
                </span>
              </div>
            </div>

            {item.fcoSpecification && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs dark:border-emerald-800 dark:bg-emerald-950/30">
                <strong className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                  {t('FCO Specification Limits', 'FCO చట్టబద్ధ ప్రమాణాలు')}:
                </strong>
                <p className="text-emerald-800 dark:text-emerald-200">{item.fcoSpecification}</p>
              </div>
            )}

            <div className="text-xs space-y-1.5">
              <div>
                <strong className="font-bold text-slate-900 dark:text-slate-200 block">
                  {t('Spraying Precautions', 'పిచికారీ ముందుజాగ్రత్తలు')}:
                </strong>
                <p className="text-slate-600 dark:text-slate-400">{item.sprayPrecautions}</p>
                <p className="text-[11px] text-slate-500 italic">{item.sprayPrecautionsTe}</p>
              </div>

              {!isFertilizer && (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                  <strong className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t('Medical Antidote / First Aid', 'వైద్య విరుగుడు / ప్రథమ చికిత్స')}:
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{item.antidoteInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{t('Share on WhatsApp', 'వాట్సాప్‌లో పంపండి')}</span>
          </button>

          <button
            type="button"
            onClick={copyAdvisory}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? t('Copied', 'కాపీ అయింది') : t('Copy Advisory', 'సలహా కాపీ')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {t('Close', 'మూసివేయండి')}
          </button>
        </div>
      </div>
    </div>
  );
}
