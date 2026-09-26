export const PUBLIC_VIEW_PAGES = new Set(['dealers']);
export const PUBLIC_AUTH_ROUTES = new Set([
  '/login',
  '/officer-toolkit',
  '/officer-toolkit/license-application-generator',
  '/officer-toolkit/statutory-forms',
  '/officer-toolkit/acreage-calculator',
  '/officer-toolkit/farm-calculators',
  '/officer-toolkit/fertilizer-calculator',
  '/officer-toolkit/crop-protection',
  '/officer-toolkit/pesticide-calculator',
  '/officer-toolkit/plant-population-calculator',
  '/officer-toolkit/seed-rate-calculator',
  '/officer-toolkit/legal-ready-reckoner',
  '/officer-toolkit/officer-contacts',
  '/officer-toolkit/tour-diary',
  '/officer-toolkit/seed-dealer-inspection',
  '/officer-toolkit/fertilizer-dealer-inspection',
  '/officer-toolkit/insecticide-dealer-inspection',
  '/officer-toolkit/inspections-notices',
]);
export const INACTIVITY_SIGN_OUT_MS = 5 * 60 * 1000;

// Page keys renderable without authentication (handled by PublicPageSwitch).
export const PUBLIC_PAGES = new Set([
  'dealers',
  'officer-toolkit',
  'license-application-generator',
  'farm-calculators',
  'acreage-calculator',
  'fertilizer-calculator',
  'crop-protection',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'legal-ready-reckoner',
  'officer-contacts',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspections-notices',
]);

export const PAGE_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  'stock-analytics': '/stock-analytics',
  'stock-receipts-sales': '/stock-receipts-sales',
  'dealer-portal': '/dealer-portal',
  dealers: '/dealers',
  'farmer-database': '/farmer-database',
  forms: '/forms',
  'gos-circulars': '/gos-circulars',
  quality: '/quality',
  'quality-seeds': '/quality-seeds',
  'quality-pesticides': '/quality-pesticides',
  'quality-fertilizers': '/quality-fertilizers',
  'farm-mechanization': '/farm-mechanization',
  excel: '/excel',
  'file-directory': '/file-directory',
  subsidy: '/subsidy',
  'subsidy-nfsm': '/subsidy-nfsm',
  'subsidy-state-seed': '/subsidy-state-seed',
  'officer-toolkit': '/officer-toolkit',
  'license-application-generator': '/officer-toolkit/license-application-generator',
  'acreage-calculator': '/acreage-calculator',
  'farm-calculators': '/officer-toolkit/farm-calculators',
  'fertilizer-calculator': '/officer-toolkit/fertilizer-calculator',
  'crop-protection': '/officer-toolkit/crop-protection',
  'pesticide-calculator': '/officer-toolkit/pesticide-calculator',
  'plant-population-calculator': '/officer-toolkit/plant-population-calculator',
  'seed-rate-calculator': '/officer-toolkit/seed-rate-calculator',
  'legal-ready-reckoner': '/officer-toolkit/legal-ready-reckoner',
  'officer-contacts': '/officer-toolkit/officer-contacts',
  'officer-contacts-admin': '/admin/officer-contacts',
  'tour-diary': '/officer-toolkit/tour-diary',
  'seed-dealer-inspection': '/officer-toolkit/seed-dealer-inspection',
  'fertilizer-dealer-inspection': '/officer-toolkit/fertilizer-dealer-inspection',
  'insecticide-dealer-inspection': '/officer-toolkit/insecticide-dealer-inspection',
  'inspections-notices': '/officer-toolkit/inspections-notices',
  analytics: '/analytics',
  settings: '/settings',
  knowledge: '/knowledge',
  'knowledge-library': '/knowledge/library',
  'knowledge-upload': '/knowledge/upload',
  'knowledge-categories': '/knowledge/categories',
  'knowledge-queue': '/knowledge/queue',
  'knowledge-analytics': '/knowledge/analytics',
  'knowledge-settings': '/knowledge/settings',
  'knowledge-assistant': '/knowledge/assistant',
  'knowledge-search': '/knowledge/search',
  'knowledge-viewer': '/knowledge/viewer',
};

export function pageToPath(page: string) {
  return PAGE_PATHS[page] || '/dashboard';
}

export function getRouteBackFallback(pathname: string, isAuthenticated: boolean) {
  // Don't redirect public officer-toolkit routes
  if (pathname.startsWith('/officer-toolkit/')) {
    return null;
  }
  if (pathname === '/officer-toolkit/legal-ready-reckoner') {
    return '/officer-toolkit';
  }
  if (pathname === '/officer-toolkit/license-application-generator') {
    return '/officer-toolkit';
  }
  if (
    pathname === '/officer-toolkit/acreage-calculator' ||
    pathname === '/officer-toolkit/fertilizer-calculator' ||
    pathname === '/officer-toolkit/pesticide-calculator' ||
    pathname === '/officer-toolkit/plant-population-calculator' ||
    pathname === '/officer-toolkit/seed-rate-calculator'
  ) {
    return '/officer-toolkit/farm-calculators';
  }
  if (
    pathname === '/officer-toolkit/statutory-forms' ||
    pathname === '/officer-toolkit/acreage-calculator' ||
    pathname === '/officer-toolkit/farm-calculators' ||
    pathname === '/officer-toolkit/crop-protection'
  ) {
    return '/officer-toolkit';
  }
  if (pathname === '/forms' || pathname === '/acreage-calculator') {
    return '/officer-toolkit';
  }
  if (pathname === '/officer-toolkit') {
    return isAuthenticated ? '/dashboard' : '/login';
  }
  if (isAuthenticated && pathname !== '/dashboard' && pathname !== '/' && pathname !== '/login') {
    return '/dashboard';
  }
  return null;
}

export function getPageBackFallback(page: string, isDealerUser: boolean) {
  if (page === 'forms' || page === 'acreage-calculator' || page === 'crop-protection') return '/officer-toolkit';
  if (page === 'license-application-generator') return '/officer-toolkit';
  if (page === 'farm-calculators') return '/officer-toolkit';
  if (page === 'fertilizer-calculator' || page === 'pesticide-calculator' || page === 'plant-population-calculator' || page === 'seed-rate-calculator') return '/officer-toolkit/farm-calculators';
  if (page === 'legal-ready-reckoner') return '/officer-toolkit';
  if (page.startsWith('knowledge-')) return '/knowledge';
  if (page === 'knowledge') return '/dashboard';
  if (page === 'officer-toolkit') return '/dashboard';
  if (page.startsWith('quality-')) return '/quality';
  if (page.startsWith('subsidy-')) return '/subsidy';
  return isDealerUser ? '/dealer-portal' : '/dashboard';
}

export const VALID_PAGES = new Set([
  'dashboard',
  'stock-analytics',
  'stock-receipts-sales',
  'dealer-portal',
  'dealers',
  'farmer-database',
  'forms',
  'gos-circulars',
  'quality',
  'quality-seeds',
  'quality-pesticides',
  'quality-fertilizers',
  'farm-mechanization',
  'excel',
  'file-directory',
  'subsidy',
  'subsidy-nfsm',
  'subsidy-state-seed',
  'officer-toolkit',
  'license-application-generator',
  'farm-calculators',
  'acreage-calculator',
  'fertilizer-calculator',
  'crop-protection',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'legal-ready-reckoner',
  'officer-contacts',
  'officer-contacts-admin',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspections-notices',
  'analytics',
  'settings',
  'knowledge',
  'knowledge-library',
  'knowledge-upload',
  'knowledge-categories',
  'knowledge-queue',
  'knowledge-analytics',
  'knowledge-settings',
  'knowledge-assistant',
  'knowledge-search',
  'knowledge-viewer',
]);

const OFFICER_TOOLKIT_PAGE_PREFIX = 'officer-toolkit/';
const OFFICER_TOOLKIT_SUBPAGES = new Set([
  'farm-calculators',
  'acreage-calculator',
  'statutory-forms',
  'license-application-generator',
  'fertilizer-calculator',
  'crop-protection',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'legal-ready-reckoner',
  'officer-contacts',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspections-notices',
]);
const SUBPAGE_ALIASES: Record<string, string> = { 'statutory-forms': 'forms' };

export function resolvePageFromLocation(location: { pathname: string; search: string; hash: string }): string {
  try {
    const legacyPage = new URLSearchParams(location.search).get('page');
    const routePage = location.pathname.replace(/^\/+/, '') || 'dashboard';
    const hashPage = location.hash.replace(/^#\/?/, '');

    // Handle nested routes for officer toolkit
    let page = routePage !== 'dashboard' ? routePage : legacyPage || routePage || hashPage;
    if (page.startsWith(OFFICER_TOOLKIT_PAGE_PREFIX)) {
      const sub = page.slice(OFFICER_TOOLKIT_PAGE_PREFIX.length);
      if (OFFICER_TOOLKIT_SUBPAGES.has(sub)) {
        page = SUBPAGE_ALIASES[sub] || sub;
      }
    }

    if (page.startsWith('knowledge/')) {
      page = `knowledge-${page.slice('knowledge/'.length)}`;
    }

    return VALID_PAGES.has(page) ? page : 'dashboard';
  } catch (error) {
    console.error('Error getting page from location:', error);
    return 'dashboard';
  }
}
