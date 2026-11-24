import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Database,
  FileCheck2,
  Lock,
  Mail,
  ScrollText,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';

interface TrustPoint {
  en: string;
  te: string;
}

interface TrustSection {
  icon: React.ReactNode;
  title: string;
  titleTe: string;
  points: TrustPoint[];
}

const pt = (en: string, te?: string): TrustPoint => ({ en, te: te ?? en });

const SECTIONS: TrustSection[] = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Encryption & Data Protection',
    titleTe: 'ఎన్‌క్రిప్షన్ & డేటా రక్షణ',
    points: [
      pt('All traffic between your browser, this portal and our databases is encrypted in transit using TLS (HTTPS).'),
      pt('Passwords are never stored in readable form. Authentication is handled by Supabase Auth, which hashes passwords before storage.'),
      pt('Officer records and statutory documents are stored in a private Cloudflare R2 bucket. Files can only be fetched through an authenticated storage gateway that verifies your identity and limits officers to their own files.'),
      pt('Archived statutory PDFs carry a SHA-256 fingerprint recorded at upload time so document integrity can be verified after download.'),
      pt('AI and third-party API keys (email, maps, weather) are kept server-side in Supabase Edge Function secrets and are never exposed to the browser.'),
    ],
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Authentication & Access Control',
    titleTe: 'అథెంటికేషన్ & యాక్సెస్ నియంత్రణ',
    points: [
      pt('Officer sign-in uses email + password through Supabase Auth (PKCE flow), with email OTP verification for registration and password reset.'),
      pt('Cloudflare Turnstile bot protection can be enabled on login, sign-up, OTP and password-reset forms to block automated abuse.'),
      pt('Repeated failed sign-in attempts trigger a temporary lockout — 5 failures within 15 minutes locks sign-in for 15 minutes.'),
      pt('Access is enforced by PostgreSQL Row Level Security on every table. Officers see only records inside their district/mandal jurisdiction; dealers see only their own data.'),
      pt('Role claims (admin, officer, dealer) are stored in server-controlled metadata, not in user-editable fields, preventing privilege escalation.'),
    ],
  },
  {
    icon: <ScrollText className="h-5 w-5" />,
    title: 'Security Testing Programme',
    titleTe: 'Security Testing Programme',
    points: [
      pt('Every change passes automated checks before deployment: linting, TypeScript type checking, unit tests and a production build on GitHub Actions.'),
      pt('A dedicated security workflow runs dependency vulnerability scanning (npm audit), secret scanning and static analysis (Semgrep) on every push and pull request.'),
      pt('Database security is reviewed against Supabase security advisories and Postgres best practices; sensitive functions are locked down against anonymous access.'),
      pt('An independent penetration test has not yet been performed — we do not claim third-party audit certification.'),
    ],
  },
  {
    icon: <Siren className="h-5 w-5" />,
    title: 'Incident Response & Recovery',
    titleTe: 'Incident Response & Recovery',
    points: [
      pt('A centralized security audit log records sign-ins, failed authentication, document downloads/uploads/deletes, and all create/modify/delete actions on statutory orders, inspections, samples, enforcement cases, dealers and stock records — with user, role, module, record, IP address and server timestamp.'),
      pt('Suspended officer accounts are blocked automatically at sign-in and their access is revoked.'),
      pt('Password reset uses a 6-digit email OTP that expires in 10 minutes and is invalidated after 5 wrong attempts.'),
      pt('Archived documents keep a local copy on the officer\u2019s device for offline access and recovery, and sync to cloud storage when online.'),
      pt('Database backups are managed by Supabase according to your project plan. Verify your plan\u2019s backup retention and test restores periodically.'),
    ],
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: 'Data Privacy',
    titleTe: 'Data Privacy',
    points: [
      pt('Personal data is collected only for official agricultural operations and is accessible strictly to authorized officers within their jurisdiction.'),
      pt('Dealer portal accounts are scoped so each dealer can only view and update their own stock and profile records.'),
      pt('Officer accounts can be deleted on request; see the Privacy Policy for data retention and your rights.'),
      pt('This portal is hosted on global infrastructure (Vercel edge network + Supabase). India-only data residency is not currently enforced.'),
    ],
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    title: 'Responsible Vulnerability Disclosure',
    titleTe: 'Responsible Vulnerability Disclosure',
    points: [
      pt('If you discover a security vulnerability, report it responsibly through the in-app Feedback module or by email to the portal administrator. Please do not publicly disclose details until we have investigated and remediated.'),
      pt('We aim to acknowledge reports within 3 business days and provide a remediation timeline for confirmed issues.'),
      pt('Please include steps to reproduce, the affected module and potential impact. Do not access or modify data belonging to other users.'),
    ],
  },
];

export function SecurityTrust() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('Back to Home', 'హోమ్‌కు తిరిగి')}</span>
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/10 p-2 backdrop-blur-xs ring-1 ring-white/20">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Security & Trust', 'భద్రత & నమ్మకం')}
                </h1>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {t('How AGRONIX protects your data and official records', 'AGRONIX మీ డేటా మరియు అధికారిక రికార్డులను ఎలా రక్షిస్తుంది')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(
                'AGRONIX handles statutory enforcement records, officer inspections and dealer data for the Agriculture Department. This page describes the security measures actually implemented in the platform today. We only claim what is deployed and verifiable — where a measure requires external configuration or a paid plan, we say so explicitly.',
                'AGRONIX handles statutory enforcement records, officer inspections and dealer data for the Agriculture Department. This page describes the security measures actually implemented in the platform today. We only claim what is deployed and verifiable — where a measure requires external configuration or a paid plan, we say so explicitly.'
              )}
            </p>

            {SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
                    {section.icon}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(section.title, section.titleTe)}
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{t(point.en, point.te)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  {t(
                    'Questions about security or data handling? Use the in-app Feedback module or contact the portal administrator. See also our Privacy Policy and Terms & Conditions.',
                    'Questions about security or data handling? Use the in-app Feedback module or contact the portal administrator. See also our Privacy Policy and Terms & Conditions.'
                  )}{' '}
                  <Link to="/privacy-policy" className="font-bold underline">{t('Privacy Policy', 'గోప్యతా విధానం')}</Link>
                  {' · '}
                  <Link to="/terms-conditions" className="font-bold underline">{t('Terms & Conditions', 'నిబంధనలు')}</Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
