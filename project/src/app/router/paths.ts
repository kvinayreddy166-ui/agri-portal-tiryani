export const PUBLIC_VIEW_PAGES = new Set(['dealers']);
export const PUBLIC_AUTH_ROUTES = new Set([
  '/',
  '/home',
  '/landing',
  '/login',
  '/register',
  '/officer-register',
  '/forgot-password',
  '/disclaimer',
  '/privacy-policy',
  '/terms-conditions',
  '/officer-toolkit',
  '/officer-toolkit/license-services',
  '/officer-toolkit/smart-sampling',
  '/officer-toolkit/sampling-hub',
  '/officer-toolkit/forms-library',
  '/officer-toolkit/statutory-forms',
  '/officer-toolkit/acreage-calculator',
  '/officer-toolkit/farm-calculators',
  '/agrochemicals',
  '/officer-toolkit/agrochemicals',
  '/officer-toolkit/fertilizer-calculator',
  '/officer-toolkit/crop-doctor',
  '/officer-toolkit/pesticide-calculator',
  '/officer-toolkit/plant-population-calculator',
  '/officer-toolkit/seed-rate-calculator',
  '/officer-toolkit/irrigation-calculator',
  '/officer-toolkit/profitability-calculator',
  '/officer-toolkit/soil-health-meter',
  '/officer-toolkit/acts-and-orders',
  '/officer-toolkit/officer-contacts',
  '/officer-toolkit/tour-diary',
  '/officer-toolkit/seed-dealer-inspection',
  '/officer-toolkit/fertilizer-dealer-inspection',
  '/officer-toolkit/insecticide-dealer-inspection',
  '/officer-toolkit/inspection-enforcement',
]);

// Routes that must always render light — the internal dark theme never
// applies to them, even for signed-in users (auth pages redirect away anyway).
export const ALWAYS_LIGHT_PATHS = new Set([
  '/',
  '/home',
  '/landing',
  '/login',
  '/register',
  '/officer-register',
  '/forgot-password',
  '/disclaimer',
  '/privacy-policy',
  '/terms-conditions',
]);

// Public directory/info pages that stay light for signed-out visitors but may
// use the internal theme once a user is authenticated (e.g. officer dealer
// directory, agrochemical database).
export const SIGNED_OUT_LIGHT_PATHS = new Set(['/dealers', '/agrochemicals']);

// Page keys renderable without authentication (handled by PublicPageSwitch).
export const PUBLIC_PAGES = new Set([
  'landing',
  'home',
  'register',
  'officer-register',
  'forgot-password',
  'disclaimer',
  'privacy-policy',
  'terms-conditions',
  'dealers',
  'officer-toolkit',
  'forms-library',
  'license-services',
  'farm-calculators',
  'agrochemicals',
  'acreage-calculator',
  'fertilizer-calculator',
  'crop-doctor',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'irrigation-calculator',
  'profitability-calculator',
  'soil-health-meter',
  'acts-and-orders',
  'officer-contacts',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspection-enforcement',
]);

export const PAGE_PATHS: Record<string, string> = {
  landing: '/',
  login: '/login',
  home: '/home',
  dashboard: '/dashboard',
  register: '/register',
  'officer-register': '/register',
  'forgot-password': '/forgot-password',
  'stock-analytics': '/stock-analytics',
  'stock-receipts-sales': '/stock-receipts-sales',
  'dealer-portal': '/dealer-portal',
  dealers: '/dealers',
  'dealer-management': '/dealer-management',
  'farmer-database': '/farmer-database',
  forms: '/forms',
  'forms-library': '/officer-toolkit/forms-library',
  'gos-circulars': '/gos-circulars',
  'farm-mechanization': '/farm-mechanization',
  excel: '/excel',
  'file-directory': '/file-directory',
  'officer-records': '/officer-toolkit/my-records',
  'officer-toolkit': '/officer-toolkit',
  'field-tools': '/field-tools',
  'government-portals': '/government-portals',
  'license-services': '/officer-toolkit/license-services',
  'acreage-calculator': '/acreage-calculator',
  'farm-calculators': '/officer-toolkit/farm-calculators',
  agrochemicals: '/officer-toolkit/agrochemicals',
  'agrochemical-database': '/officer-toolkit/agrochemicals',
  'fertilizer-calculator': '/officer-toolkit/fertilizer-calculator',
  'crop-doctor': '/officer-toolkit/crop-doctor',
  'pesticide-calculator': '/officer-toolkit/pesticide-calculator',
  'plant-population-calculator': '/officer-toolkit/plant-population-calculator',
  'seed-rate-calculator': '/officer-toolkit/seed-rate-calculator',
  'irrigation-calculator': '/officer-toolkit/irrigation-calculator',
  'profitability-calculator': '/officer-toolkit/profitability-calculator',
  'soil-health-meter': '/officer-toolkit/soil-health-meter',
  'acts-and-orders': '/officer-toolkit/acts-and-orders',
  'officer-contacts': '/officer-toolkit/officer-contacts',
  'officer-contacts-admin': '/admin/officer-contacts',
  'user-management': '/admin/user-management',
  'tour-diary': '/officer-toolkit/tour-diary',
  'seed-dealer-inspection': '/officer-toolkit/seed-dealer-inspection',
  'fertilizer-dealer-inspection': '/officer-toolkit/fertilizer-dealer-inspection',
  'insecticide-dealer-inspection': '/officer-toolkit/insecticide-dealer-inspection',
  'inspection-enforcement': '/officer-toolkit/inspection-enforcement',
  'enforcement-tracker': '/officer-toolkit/enforcement-tracker',
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
  'all-modules': '/all-modules',
  disclaimer: '/disclaimer',
  'privacy-policy': '/privacy-policy',
  'terms-conditions': '/terms-conditions',
};

export function pageToPath(page: string) {
  return PAGE_PATHS[page] || '/dashboard';
}

export function getRouteBackFallback(pathname: string, isAuthenticated: boolean) {
  if (pathname === '/field-tools' || pathname === '/government-portals') {
    return '/dashboard';
  }
  if (pathname === '/officer-toolkit') {
    return isAuthenticated ? '/dashboard' : '/';
  }
  if (pathname === '/admin/officer-contacts') {
    return '/officer-toolkit/officer-contacts';
  }
  if (pathname === '/admin/user-management') {
    return '/settings';
  }
  if (pathname === '/officer-toolkit/my-records' || pathname === '/officer-toolkit/enforcement-tracker' || pathname === '/enforcement-tracker') {
    return '/dashboard';
  }
  if (
    pathname === '/officer-toolkit/acreage-calculator' ||
    pathname === '/officer-toolkit/fertilizer-calculator' ||
    pathname === '/officer-toolkit/pesticide-calculator' ||
    pathname === '/officer-toolkit/plant-population-calculator' ||
    pathname === '/officer-toolkit/seed-rate-calculator' ||
    pathname === '/officer-toolkit/irrigation-calculator' ||
    pathname === '/officer-toolkit/profitability-calculator' ||
    pathname === '/officer-toolkit/soil-health-meter'
  ) {
    return '/officer-toolkit/farm-calculators';
  }
  if (
    pathname === '/officer-toolkit/seed-dealer-inspection' ||
    pathname === '/officer-toolkit/fertilizer-dealer-inspection' ||
    pathname === '/officer-toolkit/insecticide-dealer-inspection'
  ) {
    return '/officer-toolkit/inspection-enforcement';
  }
  if (pathname.startsWith('/officer-toolkit/')) {
    return isAuthenticated ? '/dashboard' : '/officer-toolkit';
  }
  if (pathname === '/forms' || pathname === '/acreage-calculator' || pathname === '/agrochemicals') {
    return isAuthenticated ? '/dashboard' : '/officer-toolkit';
  }
  if (isAuthenticated && pathname !== '/dashboard' && pathname !== '/' && pathname !== '/login') {
    return '/dashboard';
  }
  return null;
}

export function getPageBackFallback(page: string, isDealerUser: boolean) {
  if (page === 'all-modules') return 'dashboard';
  if (page === 'officer-records' || page === 'enforcement-tracker') return 'dashboard';
  if (page === 'field-tools' || page === 'government-portals') return 'dashboard';
  if (page === 'disclaimer' || page === 'privacy-policy' || page === 'terms-conditions') return 'landing';
  if (
    page === 'forms' ||
    page === 'forms-library' ||
    page === 'license-services' ||
    page === 'farm-calculators' ||
    page === 'agrochemicals' ||
    page === 'crop-doctor' ||
    page === 'acts-and-orders' ||
    page === 'inspection-enforcement' ||
    page === 'tour-diary' ||
    page === 'officer-contacts'
  ) return 'dashboard';
  if (
    page === 'acreage-calculator' ||
    page === 'fertilizer-calculator' ||
    page === 'pesticide-calculator' ||
    page === 'plant-population-calculator' ||
    page === 'seed-rate-calculator' ||
    page === 'irrigation-calculator' ||
    page === 'profitability-calculator' ||
    page === 'soil-health-meter'
  ) return 'farm-calculators';
  if (
    page === 'seed-dealer-inspection' ||
    page === 'fertilizer-dealer-inspection' ||
    page === 'insecticide-dealer-inspection'
  ) return 'inspection-enforcement';
  if (page === 'officer-contacts-admin') return 'officer-contacts';
  if (page === 'user-management') return 'settings';
  if (page.startsWith('knowledge-')) return 'knowledge';
  if (page === 'knowledge') return 'dashboard';
  if (page === 'officer-toolkit') return 'dashboard';
  return isDealerUser ? 'dealer-portal' : 'dashboard';
}

export const VALID_PAGES = new Set([
  'landing',
  'home',
  'login',
  'dashboard',
  'register',
  'officer-register',
  'forgot-password',
  'disclaimer',
  'privacy-policy',
  'terms-conditions',
  'stock-analytics',
  'stock-receipts-sales',
  'dealer-portal',
  'dealers',
  'dealer-management',
  'farmer-database',
  'forms',
  'forms-library',
  'gos-circulars',
  'farm-mechanization',
  'excel',
  'file-directory',
  'officer-toolkit',
  'officer-records',
  'field-tools',
  'government-portals',
  'forms',
  'forms-library',
  'license-services',
  'farm-calculators',
  'agrochemicals',
  'acreage-calculator',
  'fertilizer-calculator',
  'crop-doctor',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'irrigation-calculator',
  'profitability-calculator',
  'soil-health-meter',
  'acts-and-orders',
  'officer-contacts',
  'officer-contacts-admin',
  'user-management',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspection-enforcement',
  'enforcement-tracker',
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
  'all-modules',
]);

const OFFICER_TOOLKIT_PAGE_PREFIX = 'officer-toolkit/';
const OFFICER_TOOLKIT_SUBPAGES = new Set([
  'farm-calculators',
  'agrochemicals',
  'agrochemical-database',
  'acreage-calculator',
  'smart-sampling',
  'sampling-hub',
  'forms',
  'forms-library',
  'statutory-forms',
  'license-services',
  'license-application-generator',
  'fertilizer-calculator',
  'crop-doctor',
  'crop-protection',
  'pesticide-calculator',
  'plant-population-calculator',
  'seed-rate-calculator',
  'irrigation-calculator',
  'profitability-calculator',
  'soil-health-meter',
  'acts-and-orders',
  'legal-ready-reckoner',
  'officer-contacts',
  'tour-diary',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
  'inspection-enforcement',
  'enforcement-tracker',
]);
const SUBPAGE_ALIASES: Record<string, string> = { 'smart-sampling': 'forms', 'sampling-hub': 'forms', 'statutory-forms': 'forms', 'legal-ready-reckoner': 'acts-and-orders', 'license-application-generator': 'license-services', 'crop-protection': 'crop-doctor', 'agrochemical-database': 'agrochemicals' };

export function resolvePageFromLocation(location: { pathname: string; search: string; hash: string }): string {
  try {
    const legacyPage = new URLSearchParams(location.search).get('page');
    const rawPath = location.pathname.replace(/^\/+/, '');
    const routePage = !rawPath || rawPath === 'landing' || rawPath === 'home' ? 'landing' : rawPath;
    const hashPage = location.hash.replace(/^#\/?/, '');

    // Handle nested routes for officer toolkit
    let page = routePage !== 'dashboard' ? routePage : legacyPage || routePage || hashPage;
    if (page.startsWith(OFFICER_TOOLKIT_PAGE_PREFIX)) {
      const sub = page.slice(OFFICER_TOOLKIT_PAGE_PREFIX.length);
      const base = sub.split('/')[0];
      // Records & Cloud Storage lives at /officer-toolkit/my-records
      if (base === 'my-records') {
        page = 'officer-records';
      } else if (OFFICER_TOOLKIT_SUBPAGES.has(base)) {
        page = SUBPAGE_ALIASES[base] || base;
      }
    }

    if (page === 'admin/officer-contacts') {
      page = 'officer-contacts-admin';
    } else if (page === 'admin/user-management') {
      page = 'user-management';
    } else if (page.startsWith('knowledge/')) {
      page = `knowledge-${page.slice('knowledge/'.length)}`;
    }

    return VALID_PAGES.has(page) ? page : 'dashboard';
  } catch (error) {
    console.error('Error getting page from location:', error);
    return 'dashboard';
  }
}
