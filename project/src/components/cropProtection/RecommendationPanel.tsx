import React from 'react';
import type { CropProtectionRecommendation, LanguageCode } from '../../services/cropProtectionService';
import { controlLabel, pickLang } from '../../services/cropProtectionService';
import { label } from '../../services/translationService';

const controlOrder = ['general_ipm', 'cultural', 'mechanical', 'biological', 'chemical'];

export function RecommendationPanel({
  recommendations,
  language,
}: {
  recommendations: CropProtectionRecommendation[];
  language: LanguageCode;
}) {
  const sorted = [...recommendations].sort(
    (a, b) => controlOrder.indexOf(a.control_type) - controlOrder.indexOf(b.control_type)
  );

  return (
    <div className="mt-3 space-y-2">
      {sorted.map((rec) => (
        <details key={rec.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 open:border-emerald-200 open:bg-emerald-50/40">
          <summary className="cursor-pointer text-xs font-black text-slate-900 dark:text-white">
            {label(controlLabel(rec.control_type), language)}
          </summary>
          <div className="mt-2 space-y-1 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-200">
            <p>{pickLang(rec.recommendation_en, rec.recommendation_te, language)}</p>
            {rec.control_type === 'chemical' && (
              <div className="rounded-md border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 p-2 text-amber-900 dark:text-amber-200">
                <p><span className="font-black">Chemical:</span> {rec.chemical_name || 'Refer latest label/local advisory'}</p>
                <p><span className="font-black">Dose/litre:</span> {rec.dose_per_litre || 'Refer latest label/local advisory'}</p>
                <p><span className="font-black">Dose/acre:</span> {rec.dose_per_acre || 'Refer latest label/local advisory'}</p>
                <p><span className="font-black">16L tank:</span> {rec.dose_per_tank_16l || 'Refer latest label/local advisory'}</p>
                <p><span className="font-black">20L tank:</span> {rec.dose_per_tank_20l || 'Refer latest label/local advisory'}</p>
                <p><span className="font-black">Waiting period:</span> {rec.waiting_period || 'Follow latest label/local advisory'}</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {pickLang(
                rec.safety_note_en || 'Use chemicals only as per latest CIBRC label and local Department/PJTSAU recommendation.',
                rec.safety_note_te,
                language
              )}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
