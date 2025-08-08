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

  // Get encrypted banking details for the user (with fallback to legacy columns)
  const { data: bankingDetails, error: fetchError } = await supabase
    .from('banking_subaccounts')
    .select('encrypted_account_number, encrypted_bank_code, encrypted_bank_name, encrypted_subaccount_code, account_number, bank_code, bank_name, subaccount_code, encryption_key_hash, business_name')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

    if (fetchError || !bankingDetails) {
      console.error('No banking details found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'No banking details found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encAccount = bankingDetails.encrypted_account_number || bankingDetails.account_number;
    const encCode = bankingDetails.encrypted_bank_code || bankingDetails.bank_code;
    const encBankName = bankingDetails.encrypted_bank_name || bankingDetails.bank_name;
    const encSub = bankingDetails.encrypted_subaccount_code || bankingDetails.subaccount_code;

    const sources = {
      account_number: bankingDetails.encrypted_account_number ? 'encrypted_account_number' : (bankingDetails.account_number ? 'account_number' : null),
      bank_code: bankingDetails.encrypted_bank_code ? 'encrypted_bank_code' : (bankingDetails.bank_code ? 'bank_code' : null),
      bank_name: bankingDetails.encrypted_bank_name ? 'encrypted_bank_name' : (bankingDetails.bank_name ? 'bank_name' : null),
      subaccount_code: bankingDetails.encrypted_subaccount_code ? 'encrypted_subaccount_code' : (bankingDetails.subaccount_code ? 'subaccount_code' : null)
    } as const;

    // Validate required encrypted fields
    if (!encAccount || !encCode) {
      console.error('Banking details not properly stored for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Banking details not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the banking details
    const encryptionKey = bankingDetails.encryption_key_hash;
    
    try {
      const decryptedAccountNumber = await decryptData(encAccount, encryptionKey);
      const decryptedBankCode = await decryptData(encCode, encryptionKey);

      let decryptedBankName: string | null = null;
      let decryptedSubaccount: string | null = null;
      try {
        decryptedBankName = encBankName ? await decryptData(encBankName, encryptionKey) : null;
      } catch (_) { decryptedBankName = null; }
      try {
        decryptedSubaccount = encSub ? await decryptData(encSub, encryptionKey) : null;
      } catch (_) { decryptedSubaccount = null; }

      console.log('Successfully decrypted banking details for user:', user.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            account_number: decryptedAccountNumber,
            bank_code: decryptedBankCode,
            bank_name: decryptedBankName ?? bankingDetails.bank_name ?? null,
            business_name: bankingDetails.business_name,
            subaccount_code: decryptedSubaccount ?? bankingDetails.subaccount_code ?? null
          },
          sources
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
