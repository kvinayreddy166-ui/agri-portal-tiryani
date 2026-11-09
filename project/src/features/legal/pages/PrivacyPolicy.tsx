import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';

export function PrivacyPolicy() {
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
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Privacy Policy', 'Privacy Policy')}
                </h1>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {t('Agronix - Information Management System', 'Agronix - Information Management System')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('1. Data Collection', '1. Data Collection')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'AGRONIX collects and stores personal information you provide when registering as an agricultural officer, including name, email, phone number, employee ID, and location information. We also collect usage data and device information to improve our services.',
                  'AGRONIX collects and stores personal information you provide when registering as an agricultural officer, including name, email, phone number, employee ID, and location information. We also collect usage data and device information to improve our services.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('2. Data Usage', '2. Data Usage')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'We use your information to provide and improve our services, authenticate your identity, generate statutory documents, and maintain records for official purposes. We may also use your information to communicate with you about updates and changes to our services.',
                  'We use your information to provide and improve our services, authenticate your identity, generate statutory documents, and maintain records for official purposes. We may also use your information to communicate with you about updates and changes to our services.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('3. Data Security', '3. Data Security')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.',
                  'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('4. Data Sharing', '4. Data Sharing')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'We do not sell, trade, or rent your personal information to third parties. We may share your information with government agencies as required by law or with your consent for legitimate purposes.',
                  'We do not sell, trade, or rent your personal information to third parties. We may share your information with government agencies as required by law or with your consent for legitimate purposes.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('5. Your Rights', '5. Your Rights')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'You have the right to access, correct, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us through the official channels provided on this platform.',
                  'You have the right to access, correct, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us through the official channels provided on this platform.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-left">{t('6. Changes to Policy', '6. Changes to Policy')}</h2>
              <p className="text-justify leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  'We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.',
                  'We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.'
                )}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
