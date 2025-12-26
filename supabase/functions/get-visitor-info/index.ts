import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP from various headers (Cloudflare, standard proxies, etc.)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Get the client IP - priority: CF > X-Real-IP > X-Forwarded-For > fallback
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    console.log('Headers received:', {
      forwardedFor,
      realIp,
      cfConnectingIp,
      clientIp
    });

    // Default response if we can't determine IP
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      return new Response(JSON.stringify({
        ip: null,
        country: null,
        city: null,
        region: null,
        timezone: null,
        isp: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use ip-api.com (free, no API key required, 45 requests/minute limit)
    // Alternative: ipapi.co, ipinfo.io, etc.
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,query`);
    
    if (!geoResponse.ok) {
      console.error('Geo API error:', geoResponse.status);
      return new Response(JSON.stringify({
        ip: clientIp,
        country: null,
        city: null,
        region: null,
        timezone: null,
        isp: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geoData = await geoResponse.json();
    console.log('Geo data received:', geoData);

    if (geoData.status === 'fail') {
      console.error('Geo lookup failed:', geoData.message);
      return new Response(JSON.stringify({
        ip: clientIp,
        country: null,
        city: null,
        region: null,
        timezone: null,
        isp: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = {
      ip: clientIp,
      country: geoData.country || null,
      countryCode: geoData.countryCode || null,
      city: geoData.city || null,
      region: geoData.regionName || null,
      timezone: geoData.timezone || null,
      isp: geoData.isp || null,
      lat: geoData.lat || null,
      lon: geoData.lon || null,
    };

    console.log('Returning visitor info:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-visitor-info function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      ip: null,
      country: null,
      city: null,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
