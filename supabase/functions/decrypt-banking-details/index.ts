import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Decryption utility function
async function decryptData(encryptedData: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(key.slice(0, 32).padEnd(32, '0'));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decode base64 and extract IV and encrypted data
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

// Helper function to get user from request
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error) {
    console.error('Auth error:', error);
    return null;
  }

  return user;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Decrypt Banking Details Request ===');
    
    // Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      console.error('Authentication failed - no user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get encrypted banking details for the user
    const { data: bankingDetails, error: fetchError } = await supabase
      .from('banking_subaccounts')
      .select('encrypted_account_number, encrypted_bank_code, encryption_key_hash, bank_name, business_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !bankingDetails) {
      console.error('No banking details found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'No banking details found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!bankingDetails.encrypted_account_number || !bankingDetails.encrypted_bank_code) {
      console.error('Banking details not encrypted for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Banking details not properly encrypted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the banking details
    const encryptionKey = bankingDetails.encryption_key_hash;
    
    try {
      const decryptedAccountNumber = await decryptData(bankingDetails.encrypted_account_number, encryptionKey);
      const decryptedBankCode = await decryptData(bankingDetails.encrypted_bank_code, encryptionKey);

      console.log('Successfully decrypted banking details for user:', user.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            account_number: decryptedAccountNumber,
            bank_code: decryptedBankCode,
            bank_name: bankingDetails.bank_name,
            business_name: bankingDetails.business_name
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (decryptError) {
      console.error('Failed to decrypt banking details:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error in decrypt-banking-details:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
