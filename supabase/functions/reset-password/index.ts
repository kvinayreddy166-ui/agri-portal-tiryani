// Supabase Edge Function: reset-password
// Verifies OTP code and securely resets officer password via Supabase Service Role
// ---------------------------------------------------------------------

import { createAdminClient, corsHeaders, json, errorResponse } from '../_shared/knowledge.ts';
import { verifyTurnstileToken, clientIp } from '../_shared/turnstile.ts';
import { isPasswordCompliant, PASSWORD_POLICY_MESSAGE } from '../_shared/passwordPolicy.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const token = String(body.token ?? '').trim();
    const newPassword = String(body.newPassword ?? '').trim();

    if (!email || !email.includes('@')) {
      return errorResponse('Valid email address is required.', 400);
    }

    if (!token || token.length < 6) {
      return errorResponse('Valid 6-digit verification code is required.', 400);
    }

    if (!newPassword || !isPasswordCompliant(newPassword)) {
      return errorResponse(PASSWORD_POLICY_MESSAGE, 400);
    }

    const turnstile = await verifyTurnstileToken(body.captchaToken, clientIp(req));
    if (!turnstile.success) {
      return errorResponse(turnstile.error || 'Security verification failed', 403);
    }

    const supabase = createAdminClient();

    // 1. Verify OTP code from officer_email_otps table
    const { data: records, error: fetchErr } = await supabase
      .from('officer_email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'reset_password')
      .eq('consumed', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('Error fetching OTP record:', fetchErr);
      return errorResponse('Failed to verify OTP code. ' + fetchErr.message, 500);
    }

    const otpRecord = records?.[0];

    if (!otpRecord) {
      return errorResponse('No active password reset request found. Please request a new verification code.', 400);
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return errorResponse('Verification code has expired. Please request a new one.', 400);
    }

    // Brute-force guard: max 5 wrong guesses per OTP (mirrors verify_officer_email_otp)
    if ((otpRecord.attempts ?? 0) >= 5) {
      await supabase
        .from('officer_email_otps')
        .update({ consumed: true })
        .eq('id', otpRecord.id);
      return errorResponse('Too many failed attempts. Please request a new verification code.', 429);
    }

    if (otpRecord.otp_code !== token) {
      await supabase
        .from('officer_email_otps')
        .update({ attempts: (otpRecord.attempts ?? 0) + 1 })
        .eq('id', otpRecord.id);
      return errorResponse('Invalid verification code. Please enter the correct 6-digit code received in your email.', 400);
    }

    // 2. Find the officer account. officer_profiles.id is the auth user id,
    // so a direct lookup avoids paging through all auth users.
    let targetUserId: string | null = null;

    const { data: profile, error: profileErr } = await supabase
      .from('officer_profiles')
      .select('id, email')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (profileErr) {
      console.error('Failed to look up officer profile:', profileErr);
      return errorResponse('Failed to look up officer account: ' + profileErr.message, 500);
    }

    if (profile?.id) {
      targetUserId = profile.id;
    } else {
      // Fallback: search auth users page by page (listUsers is paginated)
      let page = 1;
      const perPage = 200;
      let found = false;
      while (!found) {
        const { data: userList, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage });
        if (listErr) {
          console.error('Failed to list users:', listErr);
          return errorResponse('Failed to look up officer account: ' + listErr.message, 500);
        }
        const targetUser = userList.users.find((u) => u.email?.toLowerCase() === email);
        if (targetUser) {
          targetUserId = targetUser.id;
          found = true;
        } else if (userList.users.length < perPage) {
          break;
        } else {
          page += 1;
        }
      }
    }

    if (!targetUserId) {
      return errorResponse('No registered officer account found with this email address. Please sign up first.', 404);
    }

    // 3. Update the user password in Supabase Auth
    const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateErr) {
      console.error('Failed to update password:', updateErr);
      return errorResponse('Failed to update password: ' + updateErr.message, 500);
    }

    // 4. Consume OTP code only after successful password update
    await supabase
      .from('officer_email_otps')
      .update({ consumed: true })
      .eq('id', otpRecord.id);

    return json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Exception in reset-password function:', err);
    return errorResponse((err as Error).message || 'Server error', 500);
  }
});
