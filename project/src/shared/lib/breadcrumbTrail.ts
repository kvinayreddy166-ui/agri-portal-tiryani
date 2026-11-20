// Pages with internal drill-down views (Acts & Orders legal areas, Tour Diary
// landing/diary/draft) publish extra breadcrumb crumbs through this event so
// the Layout breadcrumb bar can show the module itself as a previous page.
export interface BreadcrumbTrailCrumb {
  label: string;
  page?: string;
}

export const BREADCRUMB_TRAIL_EVENT = 'tiryani:breadcrumb-trail';

export function setBreadcrumbTrail(crumbs: BreadcrumbTrailCrumb[]) {
  window.dispatchEvent(new CustomEvent<BreadcrumbTrailCrumb[]>(BREADCRUMB_TRAIL_EVENT, { detail: crumbs }));
}

export function clearBreadcrumbTrail() {
  setBreadcrumbTrail([]);
}
