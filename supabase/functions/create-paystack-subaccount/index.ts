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
    console.log('=== ReBooked Solutions - Paystack Subaccount Creation ===');
    
    // Step 1: Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      console.error('Authentication failed - no user found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Please log in to set up your banking details'
        }),
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
    console.log('Request body received:', {
      ...requestBody,
      account_number: requestBody.account_number ? '***' + requestBody.account_number.slice(-4) : undefined
    });
    
    const { business_name, email, bank_name, bank_code, account_number, is_update = false } = requestBody;

    // Enhanced validation for ReBooked Solutions
    const validationErrors = [];
    if (!business_name?.trim()) validationErrors.push('Business name is required');
    if (!email?.trim()) validationErrors.push('Email address is required');
    if (!bank_name?.trim()) validationErrors.push('Bank name is required');
    if (!bank_code?.trim()) validationErrors.push('Bank code is required');
    if (!account_number?.trim()) validationErrors.push('Account number is required');

    // South African specific validations
    if (bank_code && !/^\d{3}$/.test(bank_code)) {
      validationErrors.push('Bank code must be 3 digits (e.g., Standard Bank: 058, FNB: 250)');
    }
    if (account_number && (account_number.length < 8 || account_number.length > 12)) {
      validationErrors.push('Account number must be between 8-12 digits');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Please provide a valid email address');
    }

    if (validationErrors.length > 0) {
      console.error('Validation failed:', validationErrors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'VALIDATION_FAILED',
          message: 'Please correct the following errors:',
          details: validationErrors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is an update and user has existing subaccount
    const hasExistingSubaccount = existingProfile?.subaccount_code;
    const shouldUpdate = is_update || hasExistingSubaccount;

    // Step 5: Get Paystack secret key
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'PAYMENT_SERVICE_UNAVAILABLE',
          message: 'Payment service configuration error. Please contact support.'
        }),
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
        percentage_charge: 10, // 10% platform fee for ReBooked Solutions
        description: `ReBooked Solutions seller account - ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          platform: 'rebooked_solutions',
          updated_via: 'banking_portal',
          bank_name: bank_name,
          user_id: user.id,
          last_updated: new Date().toISOString(),
          version: '2.0'
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
            success: false,
            error: 'PAYSTACK_UPDATE_FAILED',
            message: paystackData.message || 'Failed to update your payment account',
            details: paystackData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new subaccount
      console.log('Creating new Paystack subaccount for ReBooked Solutions seller:', { business_name, email, bank_name });

      const paystackPayload = {
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10, // 10% platform fee for ReBooked Solutions
        description: `ReBooked Solutions seller account - ${business_name}`,
        primary_contact_email: email,
        primary_contact_name: business_name,
        metadata: {
          platform: 'rebooked_solutions',
          created_via: 'banking_portal',
          bank_name: bank_name,
          user_id: user.id,
          signup_date: new Date().toISOString(),
          version: '2.0'
        }
      };

      console.log('Paystack payload:', {
        ...paystackPayload,
        account_number: '***' + account_number.slice(-4)
      });

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
      console.log('Paystack response success:', paystackData.status);

      if (!paystackResponse.ok || !paystackData.status) {
        console.error('Paystack API error:', paystackData);
        
        // Enhanced error handling for common South African banking issues
        let errorMessage = 'Failed to create payment account';
        if (paystackData.message?.includes('Invalid account number')) {
          errorMessage = 'Invalid account number for the selected bank. Please verify your account details.';
        } else if (paystackData.message?.includes('Invalid bank code')) {
          errorMessage = 'Invalid bank code. Please select a valid South African bank.';
        } else if (paystackData.message?.includes('already exists')) {
          errorMessage = 'This bank account is already linked to another account. Please use a different account or contact support.';
        } else if (paystackData.message) {
          errorMessage = paystackData.message;
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'PAYSTACK_CREATION_FAILED',
            message: errorMessage,
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
            success: false,
            error: 'SUBACCOUNT_CODE_MISSING',
            message: 'Payment provider did not return a valid subaccount code',
            details: paystackData
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 6: Create Transfer Recipient for direct payouts
    let recipient_code = null;
    try {
      console.log('Creating transfer recipient for direct payouts...');

      const recipientPayload = {
        type: 'nuban',
        name: business_name,
        description: `ReBooked Solutions transfer recipient - ${business_name}`,
        account_number: account_number,
        bank_code: bank_code,
        currency: 'ZAR',
        email: email,
        metadata: {
          platform: 'rebooked_solutions',
          linked_subaccount: subaccount_code,
          user_id: user.id,
          created_at: new Date().toISOString()
        }
      };

      const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipientPayload),
      });

      if (recipientResponse.ok) {
        const recipientData = await recipientResponse.json();
        if (recipientData.status && recipientData.data) {
          recipient_code = recipientData.data.recipient_code;
          console.log('✅ Transfer recipient created successfully:', recipient_code);
        } else {
          console.warn('Transfer recipient creation failed:', recipientData.message);
        }
      } else {
        console.warn('Transfer recipient API call failed:', recipientResponse.status);
      }
    } catch (recipientError) {
      console.error('Error creating transfer recipient:', recipientError);
      // Don't fail the main request if recipient creation fails
    }

    // Step 7: Store in banking_subaccounts table with recipient_code
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
        recipient_code: recipient_code, // Store in the dedicated column
        paystack_response: {
          ...paystackData,
          recipient_code: recipient_code,
          transfer_recipient_created_at: recipient_code ? new Date().toISOString() : null,
          platform: 'rebooked_solutions'
        },
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
      console.log('✅ Successfully stored banking subaccount in database:', {
        id: subaccountData.id,
        subaccount_code: subaccountData.subaccount_code,
        recipient_code: subaccountData.recipient_code,
        status: subaccountData.status
      });
    }

    // Step 8: Update user profile with subaccount_code  
    const updatedPreferences = {
      ...(existingProfile?.preferences || {}),
      subaccount_code: subaccount_code,
      recipient_code: recipient_code,
      banking_setup_complete: true,
      business_name: business_name,
      bank_details: {
        bank_name,
        account_number: account_number.slice(-4), // Store only last 4 digits for security
        bank_code
      },
      platform_fees: {
        percentage_charge: 10,
        description: 'ReBooked Solutions platform fee'
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
    } else {
      console.log('✅ Profile updated successfully');
    }

    // Step 9: Update all user's books with the subaccount_code
    try {
      const { data: booksUpdate, error: booksUpdateError } = await supabase
        .from('books')
        .update({ seller_subaccount_code: subaccount_code })
        .eq('seller_id', user.id)
        .select('id');

      if (booksUpdateError) {
        console.error('Error updating books with subaccount_code:', booksUpdateError);
        console.warn('Books table may not have seller_subaccount_code column - this is expected in some environments');
      } else {
        const updatedBookCount = booksUpdate?.length || 0;
        console.log(`✅ Updated ${updatedBookCount} books with subaccount code`);
      }
    } catch (bookError) {
      console.warn('Book linking failed - table may not exist:', bookError);
    }

    // Step 10: Success response
    const successMessage = shouldUpdate 
      ? 'Banking details updated successfully!' 
      : 'Banking setup completed successfully! You can now start selling books on ReBooked Solutions.';

    const recipientMessage = recipient_code 
      ? ' Both subaccount and transfer recipient created.'
      : ' Transfer recipient creation pending.';

    console.log(`✅ Successfully ${shouldUpdate ? 'updated' : 'created'} subaccount for ReBooked Solutions seller`);

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage + recipientMessage,
        subaccount_code: subaccount_code,
        recipient_code: recipient_code,
        user_id: user.id,
        is_update: shouldUpdate,
        platform: 'rebooked_solutions',
        data: {
          subaccount_code,
          recipient_code,
          business_name,
          bank_name,
          account_number_masked: `****${account_number.slice(-4)}`,
          percentage_charge: 10,
          status: 'active'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in ReBooked Solutions subaccount creation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again or contact support.',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
