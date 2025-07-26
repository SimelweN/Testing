import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('=== Paystack Subaccount Creation Request ===');
    
    // Step 1: Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      console.error('Authentication failed - no user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    // Step 2: Initialize Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 3: Check if user already has a subaccount
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('subaccount_code, preferences')
      .eq('id', user.id)
      .single();

    console.log('Existing profile data:', existingProfile);

    // Step 4: Parse request body
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { business_name, email, bank_name, bank_code, account_number, is_update = false } = requestBody;

    // Validate required fields
    if (!business_name || !email || !bank_name || !bank_code || !account_number) {
      console.error('Missing required fields:', { business_name, email, bank_name, bank_code, account_number });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'All fields (business_name, email, bank_name, bank_code, account_number) are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bank_code format (South African bank codes are typically 6 digits)
    if (!/^\d{3,6}$/.test(bank_code)) {
      console.error('Invalid bank code format:', bank_code);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid bank code format',
          details: 'Bank code must be 3-6 digits'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is an update and user has existing subaccount
    const hasExistingSubaccount = existingProfile?.subaccount_code;
    const isMockSubaccount = hasExistingSubaccount && hasExistingSubaccount.includes('mock');
    
    // Force new creation if existing subaccount is a mock/test account
    const shouldUpdate = is_update && hasExistingSubaccount && !isMockSubaccount;
    
    console.log('Subaccount logic:', {
      hasExistingSubaccount,
      isMockSubaccount,
      shouldUpdate,
      is_update
    });

    // Step 5: Get Paystack secret key
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subaccount_code = existingProfile?.subaccount_code;
    let paystackData;

    if (shouldUpdate && subaccount_code) {
      // Update existing subaccount
      console.log('Updating existing Paystack subaccount:', subaccount_code);
      
      const updatePayload = {
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10, // 10% platform fee
        description: `ReBooked seller subaccount for ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          updated_via: 'rebooked_banking_portal',
          bank_name: bank_name,
          user_id: user.id,
          last_updated: new Date().toISOString()
        }
      };

      const paystackResponse = await fetch(`https://api.paystack.co/subaccount/${subaccount_code}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      paystackData = await paystackResponse.json();
      console.log('Paystack update response:', paystackData);

      if (!paystackResponse.ok || !paystackData.status) {
        console.error('Paystack update error:', paystackData);
        return new Response(
          JSON.stringify({ 
            error: paystackData.message || 'Failed to update payment account',
            details: paystackData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new subaccount
      console.log('Creating new Paystack subaccount for:', { business_name, email, bank_name });

      const paystackPayload = {
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10, // 10% platform fee
        description: `ReBooked seller subaccount for ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          created_via: 'rebooked_banking_portal',
          bank_name: bank_name,
          user_id: user.id
        }
      };

      console.log('Paystack payload:', paystackPayload);

      const paystackResponse = await fetch('https://api.paystack.co/subaccount', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackPayload),
      });

      paystackData = await paystackResponse.json();
      console.log('Paystack response status:', paystackResponse.status);
      console.log('Paystack response data:', paystackData);

      if (!paystackResponse.ok || !paystackData.status) {
        console.error('Paystack API error:', paystackData);
        
        let errorMessage = 'Failed to create payment account';
        if (paystackData.message) {
          errorMessage = paystackData.message;
        } else if (paystackData.error) {
          errorMessage = paystackData.error;
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: paystackData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      subaccount_code = paystackData.data?.subaccount_code;
      console.log('Generated subaccount_code:', subaccount_code);

      if (!subaccount_code) {
        console.error('Paystack did not return a subaccount_code:', paystackData);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to get subaccount code from payment provider',
            details: paystackData
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 6: Store in banking_subaccounts table for record keeping
    // Always use upsert to ensure record exists with proper user_id
    const { data: subaccountData, error: subaccountError } = await supabase
      .from('banking_subaccounts')
      .upsert({
        user_id: user.id,
        business_name,
        email,
        bank_name,
        bank_code,
        account_number,
        subaccount_code: subaccount_code,
        paystack_response: paystackData,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'subaccount_code'
      })
      .select()
      .single();

    if (subaccountError) {
      console.error('Database error (banking_subaccounts):', subaccountError);
      // Don't fail the request but log the error - subaccount was created successfully in Paystack
      console.log('Continuing despite database error - Paystack subaccount was created successfully');
    } else {
      console.log('Successfully stored banking subaccount in database:', subaccountData);
    }

    // Step 7: Update user profile with subaccount_code  
    const updatedPreferences = {
      ...(existingProfile?.preferences || {}),
      subaccount_code: subaccount_code,
      banking_setup_complete: true,
      business_name: business_name,
      bank_details: {
        bank_name,
        account_number: account_number.slice(-4), // Store only last 4 digits for security
        bank_code
      }
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: user.user_metadata?.name || business_name,
        email: user.email,
        subaccount_code: subaccount_code,
        preferences: updatedPreferences
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail the request if profile update fails, subaccount is still created
    }

    // Step 8: Update all user's books with the subaccount_code
    const { error: booksUpdateError } = await supabase
      .from('books')
      .update({ subaccount_code: subaccount_code })
      .eq('seller_id', user.id);

    if (booksUpdateError) {
      console.error('Error updating books with subaccount_code:', booksUpdateError);
    }

    console.log(`Successfully ${shouldUpdate ? 'updated' : 'created'} subaccount and updated profile`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Banking details and subaccount ${shouldUpdate ? 'updated' : 'created'} successfully!`,
        subaccount_code: subaccount_code,
        user_id: user.id,
        is_update: shouldUpdate,
        data: {
          subaccount_code,
          business_name,
          bank_name,
          account_number_masked: `****${account_number.slice(-4)}`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in create-paystack-subaccount:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
