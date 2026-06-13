import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SyncLogUpdate = {
  sync_completed_at?: string;
  status?: string;
  total_reports?: number;
  total_records?: number;
  failed_records?: number;
  error_message?: string | null;
};

type ParsedTable = {
  name: string;
  rows: Record<string, string>[];
};

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TIRYANI_MANDAL = 'tiryani';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const baseUrl = (Deno.env.get('EXTERNAL_UREA_BASE_URL') || 'http://74.225.14.186:8025').replace(/\/$/, '');
  const username = Deno.env.get('EXTERNAL_UREA_USERNAME') || '';
  const password = Deno.env.get('EXTERNAL_UREA_PASSWORD') || '';

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const email = userData.user?.email?.trim().toLowerCase();
  if (userError || email !== ADMIN_EMAIL) {
    return json({ error: 'Admin access required.' }, 403);
  }

  const { data: log, error: logError } = await adminClient
    .from('external_urea_sync_logs')
    .insert({
      sync_started_at: new Date().toISOString(),
      status: 'running',
      created_by: userData.user?.id,
    })
    .select('id')
    .single();

  if (logError) {
    return json({ error: logError.message }, 500);
  }

  const finishLog = async (update: SyncLogUpdate) => {
    await adminClient
      .from('external_urea_sync_logs')
      .update({ sync_completed_at: new Date().toISOString(), ...update })
      .eq('id', log.id);
  };

  try {
    if (!username || !password) {
      throw new Error('External Urea Dashboard credentials are not configured in Supabase Edge Function secrets.');
    }

    const api = getExternalApiConfig(baseUrl);
    const appToken = await getExternalAppToken(api);
    const authRows = await authorizeExternalUser(api.apiBase, appToken, username, password);
    const loginUser = authRows[0];
    const userId = Number(loginUser?.userId || loginUser?.pk_userid || 0);
    if (!userId) throw new Error('External login succeeded but user id was not returned.');

    const district = await findOnlyOrNamedOption(api.apiBase, appToken, userId, 0, 0, 'KUMURAM BHEEM ASIFABAD');
    const mandal = await findOnlyOrNamedOption(api.apiBase, appToken, userId, 1, Number(district.ID), 'TIRYANI');
    const params = {
      PageNumber: 1,
      PageSize: 500,
      FinYear: 2025,
      Season: 2,
      DistCode: Number(district.ID),
      MandCode: Number(mandal.ID),
      IFMSId: 0,
      UserId: userId,
    };

    const [districtSummary, dealerSales, bookingDetails] = await Promise.all([
      fetchExternalReport(api.apiBase, appToken, 'DistrictWiseBookingsSales', params, false),
      fetchExternalReport(api.apiBase, appToken, 'DealerWiseBookingsSales', params, true),
      fetchExternalReport(api.apiBase, appToken, 'DealerReportsBookingIdWiseDtls', params, true),
    ]);

    const farmerRows = bookingDetails.rows.map((row) => normalizeFarmerBooking(row)).filter(isTiryaniRow);
    const stockRows = dealerSales.rows.map((row) => normalizeDealerSalesAsStock(row)).filter(isTiryaniRow);
    const reports = [
      {
        report_type: 'mandal_summary',
        report_name: 'Mandal Summary Report',
        mandal: 'Tiryani',
        raw_payload: { row_count: districtSummary.rows.length, sample: districtSummary.rows.slice(0, 10) },
        source_url: `${api.apiBase}/api/DistrictWiseBookingsSales`,
      },
      {
        report_type: 'dealer_sales',
        report_name: 'Dealer-wise Urea Sales Report',
        mandal: 'Tiryani',
        raw_payload: { row_count: dealerSales.rows.length, total_records: dealerSales.totalRecords, sample: dealerSales.rows.slice(0, 10) },
        source_url: `${api.apiBase}/api/DealerWiseBookingsSales`,
      },
      {
        report_type: 'farmer_booking',
        report_name: 'Farmer-wise Urea Booking Report',
        mandal: 'Tiryani',
        raw_payload: { row_count: bookingDetails.rows.length, total_records: bookingDetails.totalRecords, sample: bookingDetails.rows.slice(0, 10) },
        source_url: `${api.apiBase}/api/DealerReportsBookingIdWiseDtls`,
      },
    ];

    const [reportsResult, farmersResult, stockResult] = await Promise.all([
      reports.length
        ? adminClient.from('external_urea_reports').insert(reports)
        : Promise.resolve({ error: null }),
      farmerRows.length
        ? adminClient.from('urea_farmer_bookings').upsert(farmerRows, { onConflict: 'dedupe_key' })
        : Promise.resolve({ error: null }),
      stockRows.length
        ? adminClient.from('urea_dealer_stock').upsert(stockRows, { onConflict: 'dedupe_key' })
        : Promise.resolve({ error: null }),
    ]);

    const errors = [reportsResult.error, farmersResult.error, stockResult.error].filter(Boolean);
    if (errors.length) {
      throw new Error(errors.map((error) => error?.message).join('; '));
    }

    const totalRecords = farmerRows.length + stockRows.length;
    await finishLog({
      status: 'success',
      total_reports: reports.length,
      total_records: totalRecords,
      failed_records: 0,
      error_message: null,
    });

    return json({
      status: 'success',
      total_reports: reports.length,
      total_records: totalRecords,
      failed_records: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    await finishLog({
      status: 'failed',
      total_reports: 0,
      total_records: 0,
      failed_records: 0,
      error_message: message,
    });
    return json({ error: message }, 500);
  }
});

async function loginToExternalSite(baseUrl: string, username: string, password: string) {
  const loginUrl = `${baseUrl}/login`;
  const loginPage = await fetch(loginUrl);
  const firstCookies = collectCookies(loginPage.headers);
  const html = await loginPage.text();
  const csrf = findCsrf(html);
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('email', username);
  body.set('password', password);
  if (csrf) {
    body.set('_token', csrf);
    body.set('csrf_token', csrf);
  }

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: firstCookies,
      referer: loginUrl,
    },
    body,
    redirect: 'manual',
  });

  const cookies = [firstCookies, collectCookies(response.headers)].filter(Boolean).join('; ');
  if (response.status >= 400) {
    throw new Error(`External login failed with status ${response.status}.`);
  }
  return { cookies };
}

async function fetchWithCookies(url: string, cookies: string) {
  const response = await fetch(url, { headers: { cookie: cookies } });
  if (!response.ok) throw new Error(`External report fetch failed with status ${response.status}.`);
  return response.text();
}

function collectCookies(headers: Headers) {
  const cookieHeader = headers.get('set-cookie');
  if (!cookieHeader) return '';
  return cookieHeader
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function findCsrf(html: string) {
  return html.match(/name=["'](?:_token|csrf_token)["'][^>]*value=["']([^"']+)["']/i)?.[1] || '';
}

function detectReportLinks(baseUrl: string, html: string) {
  const links: { name: string; url: string }[] = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html))) {
    const text = cleanText(match[2]);
    const href = match[1];
    if (!/urea|booking|stock|sale|report|dashboard|export/i.test(`${text} ${href}`)) continue;
    links.push({ name: text || 'Urea Report', url: new URL(href, baseUrl).toString() });
  }
  return links.slice(0, 30);
}

function parseHtmlTables(name: string, html: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const tablePattern = /<table\b[\s\S]*?<\/table>/gi;
  let match: RegExpExecArray | null;
  while ((match = tablePattern.exec(html))) {
    const rows = [...match[0].matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((rowMatch) =>
      [...rowMatch[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanText(cell[1]))
    );
    const headers = rows.shift() || [];
    const data = rows
      .filter((row) => row.some(Boolean))
      .map((row) => Object.fromEntries(headers.map((header, index) => [normalizeHeader(header || `column_${index + 1}`), row[index] || ''])));
    if (data.length) tables.push({ name, rows: data });
  }
  return tables;
}

function normalizeFarmerBooking(row: Record<string, string>) {
  const booked = numberValue(pick(row, ['urea_booked', 'booked', 'quantity_booked', 'urea_qty', 'no_of_bags_booked', 'bags_booked_total']));
  const supplied = numberValue(pick(row, ['urea_supplied', 'supplied', 'delivered', 'sales', 'noofbags_purchased', 'bags_purchased_total']));
  return {
    farmer_name: pick(row, ['farmer_name', 'farmer', 'name']),
    father_name: pick(row, ['father_name', 'father', 'father_husband']),
    village: pick(row, ['village', 'village_name']),
    mandal: pick(row, ['mandal', 'mandal_name']) || 'Tiryani',
    mobile_number: digits(pick(row, ['mobile_number', 'mobile', 'phone', 'farmer_mobile_no'])),
    aadhaar_number: digits(pick(row, ['aadhaar_number', 'aadhaar', 'aadhar'])),
    ppb_number: pick(row, ['ppb_number', 'ppb', 'passbook', 'ppbno']),
    survey_number: pick(row, ['survey_number', 'survey_no', 'survey']),
    extent: numberValue(pick(row, ['extent', 'area', 'acres'])),
    crop: pick(row, ['crop', 'crop_name', 'cultivated_crop']),
    urea_required: numberValue(pick(row, ['urea_required', 'required', 'no_of_bags_eligible'])),
    urea_booked: booked,
    urea_supplied: supplied,
    pending_quantity: numberValue(pick(row, ['pending_quantity', 'pending'])) || Math.max(booked - supplied, 0),
    dealer_name: pick(row, ['dealer_name', 'dealer', 'firm_name']),
    booking_date: dateValue(pick(row, ['booking_date', 'date', 'report_date'])),
    supply_date: dateValue(pick(row, ['supply_date', 'supplied_date'])),
    booking_status: pick(row, ['booking_status', 'status']) || (booked > supplied ? 'Pending' : 'Supplied'),
    raw_payload: row,
  };
}

function normalizeDealerSalesAsStock(row: Record<string, string>) {
  const sales = numberValue(pick(row, ['bags_purchased_total', 'bags_purchased_ppb', 'sales', 'sale']));
  return {
    dealer_name: pick(row, ['dealer_name', 'dealer', 'name_of_the_dealer']),
    firm_name: pick(row, ['firm_name', 'firm', 'name_of_the_dealer']),
    ifms_id: pick(row, ['ifms_id', 'ifms', 'ifmsid']),
    village: pick(row, ['village', 'village_name']),
    mandal: pick(row, ['mandal', 'mandal_name']) || 'Tiryani',
    opening_stock: 0,
    receipts: numberValue(pick(row, ['bags_booked_total', 'bookings_total'])),
    sales,
    closing_stock: 0,
    stock_date: new Date().toISOString().slice(0, 10),
    raw_payload: row,
  };
}

function normalizeDealerStock(row: Record<string, string>) {
  return {
    dealer_name: pick(row, ['dealer_name', 'dealer']),
    firm_name: pick(row, ['firm_name', 'firm']),
    ifms_id: pick(row, ['ifms_id', 'ifms', 'license_no']),
    village: pick(row, ['village', 'village_name']),
    mandal: pick(row, ['mandal', 'mandal_name']) || 'Tiryani',
    opening_stock: numberValue(pick(row, ['opening_stock', 'opening'])),
    receipts: numberValue(pick(row, ['receipts', 'receipt', 'received'])),
    sales: numberValue(pick(row, ['sales', 'sale', 'supplied'])),
    closing_stock: numberValue(pick(row, ['closing_stock', 'closing', 'balance'])),
    stock_date: dateValue(pick(row, ['stock_date', 'date', 'report_date'])),
    raw_payload: row,
  };
}

function isTiryaniRow(row: { mandal?: string | null; village?: string | null }) {
  return `${row.mandal || ''} ${row.village || ''}`.toLowerCase().includes(TIRYANI_MANDAL);
}

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key] ?? row[normalizeHeader(key)];
    if (value) return value;
  }
  return '';
}

function normalizeHeader(value: string) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function cleanText(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function digits(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function numberValue(value: string) {
  const parsed = Number(String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: string) {
  if (!value) return null;
  const slash = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function guessReportType(name: string) {
  if (/stock/i.test(name)) return 'dealer_stock';
  if (/sale/i.test(name)) return 'dealer_sales';
  if (/village/i.test(name)) return 'village_booking';
  if (/pending|unserved/i.test(name)) return 'pending_farmers';
  return 'farmer_booking';
}

function getExternalApiConfig(baseUrl: string) {
  const url = new URL(baseUrl);
  const protocol = url.protocol || 'http:';
  const host = url.hostname;
  return {
    appAuthBase: `${protocol}//${host}`,
    apiBase: `${protocol}//${host}:8026`,
    appUsername: Deno.env.get('EXTERNAL_UREA_APP_USERNAME') || '',
    appPassword: Deno.env.get('EXTERNAL_UREA_APP_PASSWORD') || '',
  };
}

async function getExternalAppToken(api: ReturnType<typeof getExternalApiConfig>) {
  if (!api.appUsername || !api.appPassword) {
    throw new Error('External Urea app-token credentials are missing. Set EXTERNAL_UREA_APP_USERNAME and EXTERNAL_UREA_APP_PASSWORD as Supabase Edge Function secrets.');
  }
  const response = await fetch(`${api.appAuthBase}/UAPI/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: api.appUsername, password: api.appPassword }),
  });
  if (!response.ok) throw new Error(`External app token login failed with status ${response.status}.`);
  const data = await response.json();
  if (!data?.token) throw new Error('External app token was not returned.');
  return String(data.token);
}

async function authorizeExternalUser(apiBase: string, token: string, username: string, password: string) {
  const response = await fetch(`${apiBase}/api/authorize`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ userName: username, password, loginCount: 0, loginType: 'mao' }),
  });
  if (!response.ok) throw new Error(`External MAO authorization failed with status ${response.status}.`);
  const parsed = JSON.parse(await response.text());
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function findOnlyOrNamedOption(
  apiBase: string,
  token: string,
  userId: number,
  type: number,
  districtId: number,
  name: string
) {
  const params = new URLSearchParams({
    UserId: String(userId),
    Type: String(type),
    DistrictId: String(districtId),
  });
  const response = await fetch(`${apiBase}/api/GetDistrictMandalDdl?${params.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`External dropdown fetch failed with status ${response.status}.`);
  const data = await response.json();
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const selected = rows.find((row) => String(row.NAME || row.name || '').toLowerCase().includes(name.toLowerCase())) || rows[0];
  if (!selected?.ID) throw new Error(`Unable to detect ${name} code from external dashboard.`);
  return selected;
}

async function fetchExternalReport(
  apiBase: string,
  token: string,
  endpoint: string,
  params: Record<string, string | number>,
  paginate: boolean
) {
  const first = await fetchExternalReportPage(apiBase, token, endpoint, params);
  if (!paginate) return first;
  const totalPages = Math.max(1, Number(first.totalPages || Math.ceil(Number(first.totalRecords || first.rows.length) / Number(params.PageSize || 500))));
  const allRows = [...first.rows];
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchExternalReportPage(apiBase, token, endpoint, { ...params, PageNumber: page });
    allRows.push(...next.rows);
  }
  return { rows: allRows, totalRecords: first.totalRecords || allRows.length, totalPages };
}

async function fetchExternalReportPage(
  apiBase: string,
  token: string,
  endpoint: string,
  params: Record<string, string | number>
) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  const response = await fetch(`${apiBase}/api/${endpoint}?${query.toString()}`, {
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`External report ${endpoint} failed with status ${response.status}.`);
  const data = await response.json();
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return {
    rows: rows.map(normalizeObjectKeys),
    totalRecords: Number(data?.totalRecords || data?.TotalRecords || rows.length),
    totalPages: Number(data?.totalPages || data?.TotalPages || 1),
  };
}

function normalizeObjectKeys(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value == null || typeof value === 'object' ? '' : String(value)])
  );
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
