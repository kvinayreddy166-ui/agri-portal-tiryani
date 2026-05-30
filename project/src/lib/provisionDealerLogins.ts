import { supabase } from './supabase';
import { DEALER_DEFAULT_PASSWORD, dealerEmailFromPhone } from './dealerAuth';

export async function provisionAllDealerLogins(): Promise<{ created: number; skipped: number; failed: string[] }> {
  const { data: dealers, error } = await supabase
    .from('dealers')
    .select('id, dealer_name, phone_number, portal_email')
    .not('phone_number', 'is', null);

  if (error) throw error;

  let created = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const dealer of dealers || []) {
    const digits = (dealer.phone_number || '').replace(/\D/g, '');
    if (digits.length < 10) {
      skipped += 1;
      continue;
    }

    const email = (dealer.portal_email || dealerEmailFromPhone(dealer.phone_number)).toLowerCase();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: DEALER_DEFAULT_PASSWORD,
      options: {
        data: {
          role: 'dealer',
          dealer_id: dealer.id,
          dealer_name: dealer.dealer_name,
          phone: digits,
        },
      },
    });

    if (!signUpError) {
      created += 1;
      continue;
    }

    const msg = signUpError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      skipped += 1;
      continue;
    }

    failed.push(`${dealer.dealer_name}: ${signUpError.message}`);
  }

  return { created, skipped, failed };
}
