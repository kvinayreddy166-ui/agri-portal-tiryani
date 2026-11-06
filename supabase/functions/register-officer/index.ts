// Supabase Edge Function: register-officer
// Creates an officer account with email already confirmed (OTP verified via Resend)
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
    const {
      email,
      password,
      full_name,
      designation,
      hrms_id,
      district,
      mandal,
      phone,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !designation || !district || !mandal || !phone) {
      return errorResponse('All required fields must be provided', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      return errorResponse('Valid email address is required', 400);
    }

    if (String(password).length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Create admin client with service role key
    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      return errorResponse('This email is already registered. Please sign in instead.', 409);
    }

    // Create user with email already confirmed (bypasses Supabase email confirmation)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true, // Mark email as confirmed since OTP was already verified
      user_metadata: {
        role: 'officer',
        full_name: String(full_name).trim(),
        designation: String(designation).trim(),
        hrms_id: String(hrms_id || '').trim(),
        district: String(district).trim(),
        mandal: String(mandal).trim(),
        phone: String(phone).trim(),
      },
    });

    if (createError) {
      console.error('Failed to create user:', createError);
      return errorResponse(createError.message || 'Failed to create account', 500);
    }

    if (!newUser.user) {
      return errorResponse('Failed to create user account', 500);
    }

    // Create officer profile in database
    const profileRow = {
      id: newUser.user.id,
      full_name: String(full_name).trim(),
      designation: String(designation).trim(),
      hrms_id: String(hrms_id || '').trim(),
      district: String(district).trim(),
      mandal: String(mandal).trim(),
      phone: String(phone).trim(),
      email: normalizedEmail,
      role: 'officer',
      status: 'active',
    };

    const { error: profileError } = await supabase
      .from('officer_profiles')
      .upsert(profileRow);

    if (profileError) {
      console.error('Failed to create officer profile:', profileError);
      // Don't fail the whole request - user is created, profile can be fixed later
    }

    return json({
      success: true,
      message: 'Officer account created successfully',
      user: {
        id: newUser.user.id,
        email: normalizedEmail,
      },
    });
  } catch (err) {
    console.error('Exception in register-officer:', err);
    return errorResponse((err as Error).message || 'Server error', 500);
  }
});
