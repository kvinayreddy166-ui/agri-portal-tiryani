import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';

export function Disclaimer() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('Back to Login', 'Back to Login')}</span>
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/10 p-2 backdrop-blur-xs ring-1 ring-white/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Disclaimer', 'Disclaimer')}
                </h1>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {t('Agronix - Information Management System', 'Agronix - Information Management System')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('1. Information Accuracy', '1. Information Accuracy')}</h2>
              <p>
                {t(
                  'AGRONIX provides agricultural information, tools, and resources for informational purposes only. While we strive to maintain accurate and up-to-date information, we do not guarantee the completeness, accuracy, or reliability of any content.',
                  'AGRONIX provides agricultural information, tools, and resources for informational purposes only. While we strive to maintain accurate and up-to-date information, we do not guarantee the completeness, accuracy, or reliability of any content.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('2. Professional Advice', '2. Professional Advice')}</h2>
              <p>
                {t(
                  'The information provided on this platform should not be considered as professional agricultural, legal, or financial advice. Always consult with qualified professionals before making important decisions regarding crop management, pest control, or regulatory compliance.',
                  'The information provided on this platform should not be considered as professional agricultural, legal, or financial advice. Always consult with qualified professionals before making important decisions regarding crop management, pest control, or regulatory compliance.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('3. Limitation of Liability', '3. Limitation of Liability')}</h2>
              <p>
                {t(
                  'The Mandal Agricultural Office, Tiryani, and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this system or reliance on its information.',
                  'The Mandal Agricultural Office, Tiryani, and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this system or reliance on its information.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('4. External Links', '4. External Links')}</h2>
              <p>
                {t(
                  'AGRONIX may contain links to external websites or resources. We are not responsible for the content, privacy policies, or practices of any third-party websites.',
                  'AGRONIX may contain links to external websites or resources. We are not responsible for the content, privacy policies, or practices of any third-party websites.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('5. Changes to Disclaimer', '5. Changes to Disclaimer')}</h2>
              <p>
                {t(
                  'We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon posting to this page.',
                  'We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon posting to this page.'
                )}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
