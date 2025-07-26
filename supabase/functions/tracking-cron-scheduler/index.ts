import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('⏰ Cron scheduler triggered for tracking updates...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Call the tracking update function
    const { data, error } = await supabase.functions.invoke('update-tracking-status', {
      body: { source: 'cron_scheduler' }
    })

    if (error) {
      console.error('❌ Error calling tracking update function:', error)
      throw error
    }

    console.log('✅ Tracking update function called successfully:', data)

    // Log the cron execution
    await supabase.from('delivery_automation_log').insert({
      action: 'scheduled_tracking_update',
      status: 'success',
      response_data: data,
      request_data: { 
        triggered_at: new Date().toISOString(),
        source: 'cron_scheduler'
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled tracking update completed',
        result: data,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Cron scheduler error:', error)
    
    // Log the error
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    await supabase.from('delivery_automation_log').insert({
      action: 'scheduled_tracking_update',
      status: 'error',
      error_message: error.message,
      request_data: { 
        triggered_at: new Date().toISOString(),
        source: 'cron_scheduler'
      }
    })

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
