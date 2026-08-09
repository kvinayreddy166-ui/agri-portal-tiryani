const MIGRATION_HINT =
  '20260530150000_fix_dealer_stock_unique_and_login.sql (dealer accounts & stock)';

export function isDealerRpcMissing(message?: string): boolean {
  const m = (message || '').toLowerCase();
  return (
    m.includes('get_dealer_login_info') ||
    m.includes('could not find the function') ||
    m.includes('schema cache') ||
    m.includes('pgrst202')
  );
}

export function dealerLoginNotConfiguredError(): Error {
  return new Error(
    `Dealer login is not set up yet. Ask admin to apply the latest database migration (${MIGRATION_HINT}) in Supabase SQL Editor, then use "Setup dealer logins" in Dealers Directory.`
  );
}

export function translateDealerLoginError(message: string, telugu: boolean): string {
  const pairs: [RegExp | string, string, string][] = [
    [
      /dealer login is not set up yet/i,
      'Dealer login is not set up yet. Ask admin to apply the latest database migration (dealer accounts) in Supabase, then run Setup dealer logins.',
      'డీలర్ లాగిన్ ఇంకా సెటప్ కాలేదు. అడ్మిన్‌ను సరికొత్త డేటాబేస్ మైగ్రేషన్ (డీలర్ ఖాతాలు) వర్తింపజేయమని చెప్పండి, తర్వాత డీలర్ నిర్వహణలో "డీలర్ లాగిన్లు" నొక్కండి.',
    ],
    [
      /invalid dealer password/i,
      'Invalid dealer password. Use password: Guest@123',
      'తప్పు డీలర్ పాస్వర్డ్. పాస్వర్డ్: Guest@123 ఉపయోగించండి',
    ],
    [
      /valid 10-digit phone/i,
      'Enter a valid 10-digit phone number registered in Dealers Directory.',
      'డీలర్ నిర్వహణలో నమోదైన 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి.',
    ],
    [
      /phone not found|database helper is missing/i,
      'Phone not found in dealer records, or dealer login SQL is missing. Admin: run migration in Supabase SQL Editor.',
      'ఫోన్ డీలర్ రికార్డులలో లేదు లేదా లాగిన్ SQL లేదు. అడ్మిన్: Supabase SQL Editorలో మైగ్రేషన్ రన్ చేయండి.',
    ],
    [
      /database error querying schema|account needs repair/i,
      'Dealer login account needs repair. Admin: Dealers Directory → Setup dealer login → select dealer → Setup selected.',
      'డీలర్ లాగిన్ ఖాతా సరిచేయాలి. అడ్మిన్: డీలర్ నిర్వహణ → డీలర్ లాగిన్ సెటప్ → డీలర్ ఎంచుకొని సెటప్.',
    ],
    [
      /dealer login failed/i,
      'Dealer login failed. Confirm phone is in Dealers Directory and password is Guest@123.',
      'డీలర్ లాగిన్ విఫలమైంది. ఫోన్ డీలర్ నిర్వహణలో ఉందో మరియు పాస్వర్డ్ Guest@123 అని నిర్ధారించండి.',
    ],
  ];

  for (const [pattern, en, te] of pairs) {
    const hit =
      typeof pattern === 'string'
        ? message.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(message);
    if (hit) return telugu ? te : en;
  }

  return message;
}
