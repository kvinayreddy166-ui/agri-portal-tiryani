import { supabase } from './supabase';

const VISITOR_ID_KEY = 'tiryani-site-visitor-id';
const SESSION_HIT_KEY = 'tiryani-site-hit-recorded';
const PREVIOUS_SITE_VISIT_BASELINE = 1000;

export interface SiteHitSummary {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  lastViewedAt: string | null;
}

export async function recordSiteHit(options: { path?: string; countOncePerSession?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  const countOncePerSession = options.countOncePerSession ?? true;
  if (countOncePerSession && window.sessionStorage.getItem(SESSION_HIT_KEY)) return;

  if (countOncePerSession) {
    window.sessionStorage.setItem(SESSION_HIT_KEY, '1');
  }
  const visitorId = getVisitorId();

  try {
    await supabase.from('site_hits').insert([{
      visitor_id: visitorId,
      path: options.path || `${window.location.pathname}${window.location.search}${window.location.hash}`,
    }]);
  } catch {
    // Analytics must never block opening the app.
  }
}

export async function fetchSiteHitSummary(): Promise<SiteHitSummary> {
  const rpcResult = await supabase.rpc('get_site_hit_summary');
  if (!rpcResult.error && rpcResult.data) {
    const row = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
    return {
      totalViews: Number(row?.total_views || PREVIOUS_SITE_VISIT_BASELINE),
      uniqueVisitors: Number(row?.unique_visitors || 0),
      todayViews: Number(row?.today_views || 0),
      lastViewedAt: row?.last_viewed_at || null,
    };
  }

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
    totalViews: PREVIOUS_SITE_VISIT_BASELINE + (totalResult.count || 0),
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
