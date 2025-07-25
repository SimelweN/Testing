import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, endpoints, test, useSandbox } = await req.json()

    console.log('🚀 PUDO Lockers Proxy - Starting request')
    console.log('📊 Request details:', {
      hasApiKey: !!apiKey,
      endpointsCount: endpoints?.length || 0,
      isTest: !!test,
      useSandbox: !!useSandbox
    })

    // Test mode - just return success
    if (test) {
      console.log('🧪 Test mode - returning success')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Proxy is working',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const baseUrl = useSandbox ? 'https://sandbox-api.pudo.co.za' : 'https://api-pudo.co.za'
    const apiEndpoints = endpoints || [
      `${baseUrl}/lockers`
    ]

    // Try each endpoint
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`)
        
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'BookHub-LockerService/1.0'
        }

        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
          console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`)
        } else {
          console.log('⚠️ No API key provided - may cause authentication errors')
        }

        // First try a simple request without pagination to test connectivity
        console.log(`🧪 Testing basic connectivity to ${endpoint}`)
        try {
          const testResponse = await fetch(endpoint, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000)
          })

          console.log(`🧪 Test response: ${testResponse.status} ${testResponse.statusText}`)

          if (testResponse.ok) {
            const testData = await testResponse.json()
            console.log(`🧪 Test data received:`, typeof testData, Array.isArray(testData) ? `Array[${testData.length}]` : 'Object')

            // If we get data directly, return it
            if (Array.isArray(testData) && testData.length > 0) {
              console.log(`✅ Direct response success - ${testData.length} items`)
              return new Response(
                JSON.stringify({
                  success: true,
                  lockers: testData,
                  source: endpoint,
                  method: 'direct'
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }
        } catch (testError) {
          console.log(`🧪 Simple test failed: ${testError.message}`)
        }

        // If simple test didn't work, try with pagination
        const allLockers: any[] = []
        let page = 1
        let hasMorePages = true

        while (hasMorePages && page <= 50) { // Safety limit
          const url = new URL(endpoint)
          url.searchParams.set('page', page.toString())
          url.searchParams.set('limit', '100')
          url.searchParams.set('status', 'active')

          console.log(`📄 Fetching page ${page} from ${url.toString()}`)

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000) // 15 second timeout
          })

          console.log(`📡 Response: ${response.status} ${response.statusText}`)

          if (!response.ok) {
            if (page === 1) {
              // Try without pagination on first page failure
              console.log('🔄 Retrying without pagination...')
              const simpleResponse = await fetch(endpoint, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(15000)
              })

              if (simpleResponse.ok) {
                const data = await simpleResponse.json()
                console.log(`✅ Success without pagination: ${JSON.stringify(data).substring(0, 200)}...`)
                
                return new Response(
                  JSON.stringify({ 
                    success: true,
                    lockers: Array.isArray(data) ? data : data.lockers || data.data || [],
                    source: endpoint,
                    method: 'simple'
                  }),
                  { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                  }
                )
              }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          console.log(`📊 Page ${page} data type:`, typeof data, Array.isArray(data) ? `Array[${data.length}]` : 'Object')

          // Extract lockers from response
          let pageLockers: any[] = []
          if (Array.isArray(data)) {
            pageLockers = data
          } else if (data.lockers && Array.isArray(data.lockers)) {
            pageLockers = data.lockers
          } else if (data.data && Array.isArray(data.data)) {
            pageLockers = data.data
          } else if (data.results && Array.isArray(data.results)) {
            pageLockers = data.results
          }

          if (pageLockers.length === 0) {
            console.log(`📄 Page ${page} returned no lockers, stopping pagination`)
            hasMorePages = false
          } else {
            allLockers.push(...pageLockers)
            console.log(`📄 Page ${page}: Added ${pageLockers.length} lockers (Total: ${allLockers.length})`)
            
            if (pageLockers.length < 100) {
              console.log(`📄 Page ${page} returned fewer than 100 lockers, assuming last page`)
              hasMorePages = false
            } else {
              page++
            }
          }
        }

        if (allLockers.length > 0) {
          console.log(`✅ Successfully fetched ${allLockers.length} lockers from ${endpoint}`)
          
          return new Response(
            JSON.stringify({ 
              success: true,
              lockers: allLockers,
              source: endpoint,
              method: 'paginated',
              totalPages: page - 1
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

      } catch (error) {
        console.error(`❌ Error with endpoint ${endpoint}:`, error)
        continue
      }
    }

    // All endpoints failed
    console.error('❌ All API endpoints failed in proxy')
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'All API endpoints failed',
        endpoints: apiEndpoints,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Proxy function error:', error)
    
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
