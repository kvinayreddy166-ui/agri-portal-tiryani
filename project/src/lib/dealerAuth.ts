import { supabase } from './supabase';

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function dealerEmailFromPhone(phone: string): string {
  const digits = normalizePhone(phone);
  return `dealer.${digits}@tiryani.portal`;
}

export async function findDealerByPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (!digits || digits.length < 10) return null;

  const { data, error } = await supabase
    .from('dealers')
    .select('id, dealer_name, phone_number, location, portal_email')
    .or(`phone_number.eq.${digits},phone_number.ilike.%${digits}%`)
    .limit(5);

  if (error) throw error;
  if (!data?.length) return null;

  const exact = data.find((row) => normalizePhone(row.phone_number) === digits);
  return exact || data[0];
}

export const DEALER_DEFAULT_PASSWORD = 'guest';
