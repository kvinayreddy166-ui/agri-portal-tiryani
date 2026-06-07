import { supabase } from './supabase';

const VISITOR_ID_KEY = 'tiryani-site-visitor-id';
const SESSION_HIT_KEY = 'tiryani-site-hit-recorded';

export interface SiteHitSummary {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  lastViewedAt: string | null;
}

export async function recordSiteHit() {
  if (typeof window === 'undefined') return;
  if (window.sessionStorage.getItem(SESSION_HIT_KEY)) return;

  window.sessionStorage.setItem(SESSION_HIT_KEY, '1');
  const visitorId = getVisitorId();

  try {
    await supabase.from('site_hits').insert([{
      visitor_id: visitorId,
      path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    }]);
  } catch {
    // Analytics must never block opening the app.
  }
}

export async function fetchSiteHitSummary(): Promise<SiteHitSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalResult, todayResult, recentResult] = await Promise.all([
    supabase.from('site_hits').select('id', { count: 'exact', head: true }),
    supabase
      .from('site_hits')
      .select('id', { count: 'exact', head: true })
      .gte('viewed_at', today.toISOString()),
    supabase
      .from('site_hits')
      .select('visitor_id, viewed_at')
      .order('viewed_at', { ascending: false })
      .limit(10000),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (todayResult.error) throw todayResult.error;
  if (recentResult.error) throw recentResult.error;

  const recentRows = recentResult.data || [];
  const uniqueVisitors = new Set(recentRows.map((row) => row.visitor_id).filter(Boolean)).size;
  const lastViewedAt = recentRows[0]?.viewed_at || null;

  return {
    totalViews: totalResult.count || 0,
    uniqueVisitors,
    todayViews: todayResult.count || 0,
    lastViewedAt,
  };
}

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const generated =
    window.crypto?.randomUUID?.() ||
    `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VISITOR_ID_KEY, generated);
  return generated;
}
