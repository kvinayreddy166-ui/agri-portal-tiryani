// Supabase Edge Function: send-email-otp
// Dispatches official verification OTPs using Resend Email API
// ---------------------------------------------------------------------

import { createAdminClient, corsHeaders, json, errorResponse } from '../_shared/knowledge.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';

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
    const fullName = String(body.fullName ?? 'Agricultural Officer').trim();
    const designation = String(body.designation ?? 'Officer').trim();
    const purpose = String(body.purpose ?? 'registration').trim();
    const payload = body.payload ?? {};

    if (!email || !email.includes('@')) {
      return errorResponse('Valid email address is required', 400);
    }

    // 1. Generate 6-digit cryptographic OTP
    const otpBuffer = new Uint32Array(1);
    crypto.getRandomValues(otpBuffer);
    const otp = (100000 + (otpBuffer[0] % 900000)).toString();

    // 2. Fetch Resend Configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Agronix Portal <onboarding@resend.dev>';

    // 3. Save OTP in database using admin client
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.rpc('save_officer_email_otp', {
      p_email: email,
      p_otp_code: otp,
      p_purpose: purpose,
      p_payload: payload,
      p_expiry_minutes: 10,
    });

    if (dbError) {
      console.error('Failed to store OTP in database:', dbError);
      return errorResponse('Failed to record OTP. ' + dbError.message, 500);
    }

    // 4. Send email via Resend API
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured in Supabase secrets');
      return errorResponse('Email service is not configured. Please contact the administrator.', 500);
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Agronix Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #fde047;">AGRONIX</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 500; color: #a7f3d0;">Information Management System</p>
    </div>
    
    <div style="padding: 32px 28px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
        ${purpose === 'reset_password' ? 'Password Reset Verification' : purpose === 'registration' ? 'Officer Registration Verification' : 'Officer Sign-In Verification'}
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        ${purpose === 'reset_password'
          ? `We received a request to reset your password for your Agronix account.<br/>Please use the following 6-digit verification code to verify your identity and set a new password:`
          : `Dear <strong>${fullName} (${designation})</strong>,<br/>Please use the following 6-digit One-Time Password (OTP) to verify your registered email address and complete your registration in the Agronix Information Management System:`}
      </p>

      <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #065f46; font-family: monospace;">${otp}</span>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 14px 18px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 4px 0;">⏰ <strong>Validity:</strong> This code is valid for <strong>10 minutes</strong>.</p>
        <p style="margin: 0;">🔒 <strong>Security Note:</strong> Do not share this OTP with anyone. Administrators will never ask for your verification code.</p>
      </div>

      <p style="margin: 28px 0 0 0; font-size: 11px; color: #94a3b8; text-align: center;">
        If you did not request this verification, please disregard this email.
      </p>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
      Agronix IMS &middot; Information Management System
    </div>
  </div>
</body>
</html>
    `;

    const emailSubject = purpose === 'reset_password'
      ? `Agronix — Password Reset Code: ${otp}`
      : `Agronix — Officer Verification OTP: ${otp}`;

    const resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errJson = await resendRes.json();
      console.error('Resend API call failed:', errJson);
      
      // Handle specific Resend errors
      if (resendRes.status === 403) {
        return errorResponse('Email delivery restricted. Please verify your sender domain in Resend dashboard.', 403);
      }
      
      if (resendRes.status === 429) {
        return errorResponse('Too many email requests. Please wait a few minutes and try again.', 429);
      }
      
      return errorResponse(`Failed to send email: ${errJson.message || resendRes.statusText}`, resendRes.status);
    }

    const resendData = await resendRes.json();
    console.log('Resend API success:', { id: resendData.id, email });

    return json({
      success: true,
      message: 'OTP dispatched successfully via Resend',
      email,
      resendId: resendData.id,
      // Only return devOtp in development mode
      devOtp: Deno.env.get('ENVIRONMENT') === 'development' ? otp : undefined,
    });
  } catch (err) {
    console.error('Exception in send-email-otp:', err);
    return errorResponse((err as Error).message || 'Server error', 500);
  }
});
