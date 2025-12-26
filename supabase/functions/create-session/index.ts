import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  for (let i = 0; i < 48; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { linkId, fingerprint, userAgent, referrer } = body;

    if (!linkId) {
      return new Response(
        JSON.stringify({ error: 'Link ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get visitor info
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating session for link:', linkId, 'IP:', clientIp);

    // Check rate limit
    const { data: rateLimitData } = await supabase.rpc('check_rate_limit', {
      p_link_id: linkId,
      p_fingerprint: fingerprint || null,
      p_ip_address: clientIp || null
    });

    const rateLimitResult = rateLimitData?.[0];
    if (rateLimitResult && !rateLimitResult.allowed) {
      console.log('Rate limit exceeded for:', clientIp || fingerprint);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'You have reached the maximum number of requests for today.',
          clicksToday: rateLimitResult.clicks_today 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geo info
    let country = null;
    let city = null;
    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=country,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          country = geoData.country || null;
          city = geoData.city || null;
        }
      } catch (e) {
        console.log('Geo lookup failed:', e);
      }
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Create session
    const { data: session, error } = await supabase
      .from('click_sessions')
      .insert({
        link_id: linkId,
        session_token: sessionToken,
        fingerprint: fingerprint || null,
        ip_address: clientIp || null,
        user_agent: userAgent || null,
        country,
        city,
        referrer: referrer || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionToken,
        sessionId: session.id,
        createdAt: session.created_at,
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
