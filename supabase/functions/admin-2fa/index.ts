import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple TOTP implementation
function generateSecret(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    secret += chars[randomBytes[i] % chars.length];
  }
  return secret;
}

function base32Decode(base32: string): ArrayBuffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of base32.toUpperCase()) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes.buffer;
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const counter = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);
    
    try {
      const keyData = base32Decode(secret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
      const signatureArray = new Uint8Array(signature);
      
      const offset = signatureArray[signatureArray.length - 1] & 0x0f;
      const binary = (
        ((signatureArray[offset] & 0x7f) << 24) |
        ((signatureArray[offset + 1] & 0xff) << 16) |
        ((signatureArray[offset + 2] & 0xff) << 8) |
        (signatureArray[offset + 3] & 0xff)
      );
      
      const expectedOtp = (binary % Math.pow(10, 6)).toString().padStart(6, '0');
      if (expectedOtp === token) return true;
    } catch (e) {
      console.error('TOTP verification error:', e);
    }
  }
  return false;
}

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0').toUpperCase();
    codes.push(code);
  }
  return codes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, token, userId } = await req.json();
    console.log(`2FA action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'setup': {
        // Generate new TOTP secret
        const secret = generateSecret(20);
        const backupCodes = generateBackupCodes(8);
        
        // Check if 2FA record exists
        const { data: existing } = await supabaseAdmin
          .from('admin_2fa')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          // Update existing record
          await supabaseAdmin
            .from('admin_2fa')
            .update({ 
              totp_secret: secret, 
              backup_codes: backupCodes,
              is_enabled: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        } else {
          // Insert new record
          await supabaseAdmin
            .from('admin_2fa')
            .insert({ 
              user_id: user.id, 
              totp_secret: secret, 
              backup_codes: backupCodes,
              is_enabled: false 
            });
        }

        // Generate QR code URL for authenticator apps
        const issuer = 'CanvaPro365Free';
        const accountName = user.email || user.id;
        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        return new Response(
          JSON.stringify({ 
            success: true, 
            secret,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
            backupCodes
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-setup': {
        // Verify the token during setup to enable 2FA
        const { data: twoFaData } = await supabaseAdmin
          .from('admin_2fa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          return new Response(
            JSON.stringify({ error: '2FA not set up' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isValid = await verifyTOTP(twoFaData.totp_secret, token);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid verification code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Enable 2FA
        await supabaseAdmin
          .from('admin_2fa')
          .update({ is_enabled: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: '2FA enabled successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-login': {
        // Verify token during login
        const targetUserId = userId || user.id;
        
        const { data: twoFaData } = await supabaseAdmin
          .from('admin_2fa')
          .select('totp_secret, backup_codes, is_enabled')
          .eq('user_id', targetUserId)
          .single();

        if (!twoFaData || !twoFaData.is_enabled) {
          return new Response(
            JSON.stringify({ error: '2FA not enabled for this user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if it's a backup code
        if (token.length === 8 && twoFaData.backup_codes?.includes(token.toUpperCase())) {
          // Remove used backup code
          const newBackupCodes = twoFaData.backup_codes.filter((c: string) => c !== token.toUpperCase());
          await supabaseAdmin
            .from('admin_2fa')
            .update({ backup_codes: newBackupCodes, updated_at: new Date().toISOString() })
            .eq('user_id', targetUserId);

          return new Response(
            JSON.stringify({ success: true, usedBackupCode: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify TOTP
        const isValid = await verifyTOTP(twoFaData.totp_secret, token);
        
        return new Response(
          JSON.stringify({ success: isValid, error: isValid ? null : 'Invalid code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disable': {
        // Verify token before disabling
        const { data: twoFaData } = await supabaseAdmin
          .from('admin_2fa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          return new Response(
            JSON.stringify({ error: '2FA not set up' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isValid = await verifyTOTP(twoFaData.totp_secret, token);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid verification code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Disable 2FA
        await supabaseAdmin
          .from('admin_2fa')
          .update({ is_enabled: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: '2FA disabled successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-status': {
        // Check if 2FA is enabled for user
        const targetUserId = userId || user.id;
        
        const { data: twoFaData } = await supabaseAdmin
          .from('admin_2fa')
          .select('is_enabled')
          .eq('user_id', targetUserId)
          .single();

        return new Response(
          JSON.stringify({ 
            is2FAEnabled: twoFaData?.is_enabled || false 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err) {
    console.error('2FA error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
