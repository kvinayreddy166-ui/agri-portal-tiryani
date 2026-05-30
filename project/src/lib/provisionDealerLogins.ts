import { supabase } from './supabase';
import { DEALER_DEFAULT_PASSWORD } from './dealerAuth';

export interface ProvisionDealerResult {
  ok: boolean;
  dealer_name?: string;
  phone?: string;
  portal_email?: string;
  password?: string;
  error?: string;
}

export interface ProvisionAllDealersResult {
  created: number;
  failed: number;
  failures: ProvisionDealerResult[];
}

function parseSingleResult(data: unknown): ProvisionDealerResult {
  const row = data as Record<string, unknown> | null;
  if (!row) return { ok: false, error: 'No response from server' };
  if (row.ok === false) {
    return { ok: false, error: String(row.error || 'Provisioning failed') };
  }
  return {
    ok: true,
    dealer_name: String(row.dealer_name || ''),
    phone: String(row.phone || ''),
    portal_email: String(row.portal_email || ''),
    password: String(row.password || DEALER_DEFAULT_PASSWORD),
  };
}

export async function provisionDealerLogin(
  dealerId: string,
  password: string = DEALER_DEFAULT_PASSWORD
): Promise<ProvisionDealerResult> {
  const { data, error } = await supabase.rpc('provision_dealer_portal_login', {
    p_dealer_id: dealerId,
    p_password: password,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('provision_dealer_portal_login') || msg.includes('Could not find the function')) {
      return {
        ok: false,
        error:
          'Dealer login setup is not available on the database yet. Admin: run migration 20260530170000_fix_dealer_auth_schema.sql in Supabase.',
      };
    }
    if (msg.toLowerCase().includes('only portal admin')) {
      return {
        ok: false,
        error: 'Sign in as portal admin (admin email) before setting up dealer logins.',
      };
    }
    if (msg.toLowerCase().includes('saltgen') || msg.toLowerCase().includes('gen_salt')) {
      return {
        ok: false,
        error:
          'Password hashing failed on server. Admin: run migration 20260530180000_fix_dealer_saltgen.sql in Supabase SQL Editor, then try again.',
      };
    }
    return { ok: false, error: msg };
  }

  return parseSingleResult(data);
}

export async function provisionAllDealerLogins(
  password: string = DEALER_DEFAULT_PASSWORD
): Promise<ProvisionAllDealersResult> {
  const { data, error } = await supabase.rpc('provision_all_dealer_portal_logins', {
    p_password: password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data as Record<string, unknown> | null;
  const failuresRaw = (row?.failures as Record<string, unknown>[]) || [];

  return {
    created: Number(row?.created || 0),
    failed: Number(row?.failed || 0),
    failures: failuresRaw.map((f) => parseSingleResult(f)),
  };
}
