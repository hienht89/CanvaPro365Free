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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('No token provided');
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Invalid Request</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
<div style="text-align: center; padding: 2rem;">
<h1 style="color: #ef4444;">Invalid Token</h1>
<p>The redirect token is missing or invalid.</p>
<a href="/" style="color: #8b5cf6;">Return to Home</a>
</div>
</body>
</html>`,
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing redirect token:', token.substring(0, 10) + '...');

    // Consume the token and get target URL
    const { data, error } = await supabase.rpc('consume_redirect_token', {
      p_redirect_token: token
    });

    console.log('RPC result:', { data, error });

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
<div style="text-align: center; padding: 2rem;">
<h1 style="color: #ef4444;">Error</h1>
<p>An error occurred while processing your request.</p>
<a href="/" style="color: #8b5cf6;">Return to Home</a>
</div>
</body>
</html>`,
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    const result = data?.[0];
    
    if (!result?.success) {
      console.log('Token validation failed:', result?.error_message);
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Invalid Token</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
<div style="text-align: center; padding: 2rem;">
<h1 style="color: #ef4444;">Invalid or Expired Token</h1>
<p>${result?.error_message || 'This token has already been used or has expired.'}</p>
<a href="/" style="color: #8b5cf6;">Return to Home</a>
</div>
</body>
</html>`,
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    const targetUrl = result.target_url;
    console.log('Redirecting to target URL (length: ' + targetUrl.length + ')');

    // Perform 302 redirect to target URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': targetUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
<div style="text-align: center; padding: 2rem;">
<h1 style="color: #ef4444;">Unexpected Error</h1>
<p>Something went wrong. Please try again.</p>
<a href="/" style="color: #8b5cf6;">Return to Home</a>
</div>
</body>
</html>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  }
});
