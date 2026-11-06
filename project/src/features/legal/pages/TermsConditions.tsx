import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';

export function TermsConditions() {
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
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Terms & Conditions', 'Terms & Conditions')}
                </h1>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {t('Agronix - Information Management System', 'Agronix - Information Management System')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('1. Acceptance of Terms', '1. Acceptance of Terms')}</h2>
              <p>
                {t(
                  'By accessing or using AGRONIX, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.',
                  'By accessing or using AGRONIX, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('2. User Accounts', '2. User Accounts')}</h2>
              <p>
                {t(
                  'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.',
                  'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('3. Acceptable Use', '3. Acceptable Use')}</h2>
              <p>
                {t(
                  'You agree not to misuse the platform, including but not limited to: attempting to gain unauthorized access, interfering with the operation of the system, uploading harmful content, or using the service for any illegal purpose.',
                  'You agree not to misuse the platform, including but not limited to: attempting to gain unauthorized access, interfering with the operation of the system, uploading harmful content, or using the service for any illegal purpose.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('4. Intellectual Property', '4. Intellectual Property')}</h2>
              <p>
                {t(
                  'All content, features, and functionality of AGRONIX are owned by the Mandal Agricultural Office, Tiryani, and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.',
                  'All content, features, and functionality of AGRONIX are owned by the Mandal Agricultural Office, Tiryani, and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('5. Service Availability', '5. Service Availability')}</h2>
              <p>
                {t(
                  'We strive to maintain the availability of our services but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time.',
                  'We strive to maintain the availability of our services but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('6. Limitation of Liability', '6. Limitation of Liability')}</h2>
              <p>
                {t(
                  'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.',
                  'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('7. Termination', '7. Termination')}</h2>
              <p>
                {t(
                  'We may terminate or suspend your access to the service immediately, without prior notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users, us, or third parties.',
                  'We may terminate or suspend your access to the service immediately, without prior notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users, us, or third parties.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('8. Changes to Terms', '8. Changes to Terms')}</h2>
              <p>
                {t(
                  'We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting to this page. Your continued use of the service after changes constitutes acceptance of the revised terms.',
                  'We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting to this page. Your continued use of the service after changes constitutes acceptance of the revised terms.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('9. Governing Law', '9. Governing Law')}</h2>
              <p>
                {t(
                  'These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Tiryani, Kumram Bheem Asifabad District, Telangana.',
                  'These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Tiryani, Kumram Bheem Asifabad District, Telangana.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('10. Contact', '10. Contact')}</h2>
              <p>
                {t(
                  'For questions about these Terms & Conditions, please contact the Mandal Agricultural Office, Tiryani through the official channels provided on this platform.',
                  'For questions about these Terms & Conditions, please contact the Mandal Agricultural Office, Tiryani through the official channels provided on this platform.'
                )}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
