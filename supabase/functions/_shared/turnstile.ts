// Cloudflare Turnstile server-side verification for Edge Functions (Deno).
// Set TURNSTILE_SECRET_KEY via `supabase secrets set`. When the secret is not
// configured the check is skipped so environments without Turnstile keep working.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled(): boolean {
  return Boolean(Deno.env.get('TURNSTILE_SECRET_KEY'));
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null
): Promise<{ success: boolean; error?: string }> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return { success: true };

  if (!token) {
    return {
      success: false,
      error: 'Security verification is required. Please complete the check and try again.',
    };
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const data = (await res.json()) as { success?: boolean };
    if (!data?.success) {
      return { success: false, error: 'Security check failed. Please try again.' };
    }
    return { success: true };
  } catch (err) {
    console.error('Turnstile siteverify error:', err);
    return { success: false, error: 'Security verification unavailable. Please try again.' };
  }
}

export function clientIp(req: Request): string | null {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  );
}
