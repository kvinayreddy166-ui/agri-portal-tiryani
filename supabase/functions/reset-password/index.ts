// Supabase Edge Function: reset-password
// Verifies OTP code and securely resets officer password via Supabase Service Role
// ---------------------------------------------------------------------

import { createAdminClient, corsHeaders, json, errorResponse } from '../_shared/knowledge.ts';

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

    if (!newPassword || newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long.', 400);
    }

    const supabase = createAdminClient();

    // 1. Verify OTP code from officer_email_otps table
    const { data: records, error: fetchErr } = await supabase
      .from('officer_email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'reset_password')
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

    if (otpRecord.otp_code !== token) {
      return errorResponse('Invalid verification code. Please enter the correct 6-digit code received in your email.', 400);
    }

    // 2. Consume OTP code
    await supabase
      .from('officer_email_otps')
      .update({ consumed: true })
      .eq('id', otpRecord.id);

    // 3. Find user account in auth.users by email using admin client
    const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error('Failed to list users:', listErr);
      return errorResponse('Failed to look up officer account: ' + listErr.message, 500);
    }

    const targetUser = userList.users.find((u) => u.email?.toLowerCase() === email);
    if (!targetUser) {
      return errorResponse('No registered officer account found with this email address. Please sign up first.', 404);
    }

    // 4. Update the user password in Supabase Auth
    const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
      password: newPassword,
    });

    if (updateErr) {
      console.error('Failed to update password:', updateErr);
      return errorResponse('Failed to update password: ' + updateErr.message, 500);
    }

    return json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Exception in reset-password function:', err);
    return errorResponse((err as Error).message || 'Server error', 500);
  }
});
