// Pages with internal drill-down views (Acts & Orders legal areas, Tour Diary
// landing/diary/draft) publish extra breadcrumb crumbs through this event so
// the Layout breadcrumb bar can show the module itself as a previous page.
export interface BreadcrumbTrailCrumb {
  label: string;
  page?: string;
}

export const BREADCRUMB_TRAIL_EVENT = 'tiryani:breadcrumb-trail';

// App-level Back asks the Acts & Orders page to unwind its internal
// drill-down (form modal → clause card → section → legal-area explorer →
// module home) one level at a time instead of leaving the module.
// Mirrors TOUR_DIARY_BACK_EVENT.
export const ACTS_AND_ORDERS_BACK_EVENT = 'tiryani:acts-and-orders-back';

export function setBreadcrumbTrail(crumbs: BreadcrumbTrailCrumb[]) {
  window.dispatchEvent(new CustomEvent<BreadcrumbTrailCrumb[]>(BREADCRUMB_TRAIL_EVENT, { detail: crumbs }));
}

export function clearBreadcrumbTrail() {
  setBreadcrumbTrail([]);
}
