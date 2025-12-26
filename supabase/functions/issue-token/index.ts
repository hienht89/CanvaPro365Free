import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sessionToken, linkId } = body;

    if (!sessionToken || !linkId) {
      return new Response(
        JSON.stringify({ error: 'Session token and link ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Issuing redirect token for session:', sessionToken.substring(0, 10) + '...');

    // Call the database function to issue token
    const { data, error } = await supabase.rpc('issue_redirect_token', {
      p_session_token: sessionToken,
      p_link_id: linkId
    });

    console.log('RPC result:', { data, error });

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to issue token', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data?.[0];
    
    if (!result?.success) {
      console.log('Token issuance failed:', result?.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Token issuance failed',
          message: result?.error_message || 'Unable to issue redirect token'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build redirect URL
    const redirectUrl = `${supabaseUrl}/functions/v1/secure-redirect?token=${result.redirect_token}`;

    console.log('Token issued successfully');

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        expiresIn: 90, // seconds
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
