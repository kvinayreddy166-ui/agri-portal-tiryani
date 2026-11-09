import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow deleting own account OR admin deleting an officer account
    const isCallerAdmin = callerUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
                          callerUser.app_metadata?.role === 'admin' ||
                          callerUser.user_metadata?.role === 'admin';

    if (callerUser.id !== userId && !isCallerAdmin) {
      return new Response(
        JSON.stringify({ error: 'Permission denied. Cannot delete other users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch target user's email if possible
    let targetEmail = '';
    try {
      const { data: targetData } = await supabaseAdmin.auth.admin.getUserById(userId);
      targetEmail = targetData?.user?.email || '';
    } catch {
      // Fallback
    }

    // Attempt RPC first if available
    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('delete_officer_account', {
        p_user_id: userId,
      });
      if (!rpcError && rpcData?.success) {
        return new Response(
          JSON.stringify({ success: true, message: 'Account deleted successfully via RPC' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // Fall through to manual cleanup
    }

    // Manual cascading cleanup of tables referencing auth.users
    try {
      await supabaseAdmin.from('dealers').update({ created_by: null }).eq('created_by', userId);
    } catch (e) {
      console.warn('Dealers unassign warning:', e);
    }

    try {
      await supabaseAdmin.from('officer_cases').delete().eq('officer_id', userId);
      await supabaseAdmin.from('officer_inspections').delete().eq('officer_id', userId);
      await supabaseAdmin.from('officer_statutory_orders').delete().eq('officer_id', userId);
      await supabaseAdmin.from('officer_samples').delete().eq('officer_id', userId);
      await supabaseAdmin.from('officer_document_archive').delete().eq('user_id', userId);
      await supabaseAdmin.from('sample_targets').delete().eq('created_by', userId);
      await supabaseAdmin.from('tour_journeys').delete().eq('officer_id', userId);
      await supabaseAdmin.from('tour_diaries').delete().eq('officer_id', userId);
      if (targetEmail) {
        await supabaseAdmin.from('officer_email_otps').delete().eq('email', targetEmail.toLowerCase().trim());
      }
    } catch (e) {
      console.warn('Officer records deletion warning:', e);
    }

    // Delete officer profile
    await supabaseAdmin
      .from('officer_profiles')
      .delete()
      .eq('id', userId);

    // Clean up storage objects owned by this user
    try {
      await (supabaseAdmin as any).schema('storage').from('objects').delete().eq('owner', userId);
    } catch {
      try {
        await supabaseAdmin.from('objects').delete().eq('owner', userId);
      } catch (e) {
        console.warn('Storage objects cleanup warning:', e);
      }
    }

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to delete account' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
