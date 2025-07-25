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
      `${baseUrl}/lockers-data`
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

        // First try a simple request without pagination to test connectivity and log full response
        console.log(`🧪 Testing basic connectivity to ${endpoint}`)
        try {
          const testResponse = await fetch(endpoint, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000)
          })

          console.log(`🧪 Test response: ${testResponse.status} ${testResponse.statusText}`)

          if (testResponse.ok) {
            const testData = await testResponse.json()

            // LOG FULL RESPONSE STRUCTURE FOR DEBUGGING
            console.log('🔍 FULL API RESPONSE STRUCTURE:')
            console.log(JSON.stringify(testData, null, 2))

            console.log(`📊 Response analysis:`, {
              dataType: typeof testData,
              isArray: Array.isArray(testData),
              keys: typeof testData === 'object' ? Object.keys(testData) : 'N/A',
              arrayLength: Array.isArray(testData) ? testData.length : 'N/A'
            })

            // Try to extract lockers from various possible structures
            let lockers = []
            if (Array.isArray(testData)) {
              lockers = testData
              console.log(`✅ Found ${lockers.length} lockers in direct array response`)
            } else if (testData.lockers && Array.isArray(testData.lockers)) {
              lockers = testData.lockers
              console.log(`✅ Found ${lockers.length} lockers in data.lockers`)
            } else if (testData.data && Array.isArray(testData.data)) {
              lockers = testData.data
              console.log(`✅ Found ${lockers.length} lockers in data.data`)
            } else if (testData.results && Array.isArray(testData.results)) {
              lockers = testData.results
              console.log(`✅ Found ${lockers.length} lockers in data.results`)
            } else if (testData.items && Array.isArray(testData.items)) {
              lockers = testData.items
              console.log(`✅ Found ${lockers.length} lockers in data.items`)
            }

            if (lockers.length > 0) {
              console.log(`🎉 SUCCESS: Found ${lockers.length} lockers via direct request`)
              console.log(`📋 Sample locker:`, lockers[0])

              return new Response(
                JSON.stringify({
                  success: true,
                  lockers: lockers,
                  source: endpoint,
                  method: 'direct',
                  totalCount: lockers.length,
                  rawResponseStructure: typeof testData === 'object' ? Object.keys(testData) : 'array'
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            } else {
              console.log('⚠️ No lockers found in direct response, trying pagination...')
            }
          } else {
            console.log(`❌ Test response failed: ${testResponse.status} ${testResponse.statusText}`)
          }
        } catch (testError) {
          console.log(`🧪 Simple test failed: ${testError.message}`)
        }

        // Try with different pagination strategies
        console.log('🔄 Trying pagination strategies...')

        const paginationStrategies = [
          // Strategy 1: Standard page/limit
          { page: 'page', limit: 'limit', limitValue: 100 },
          // Strategy 2: offset/limit
          { page: 'offset', limit: 'limit', limitValue: 100 },
          // Strategy 3: page/size
          { page: 'page', limit: 'size', limitValue: 100 },
          // Strategy 4: page/per_page
          { page: 'page', limit: 'per_page', limitValue: 100 }
        ]

        for (const strategy of paginationStrategies) {
          console.log(`🧪 Trying pagination strategy: ${strategy.page}/${strategy.limit}`)

          const allLockers: any[] = []
          let pageNum = 1
          let hasMorePages = true
          let totalFetched = 0

          while (hasMorePages && pageNum <= 50 && totalFetched < 10000) { // Safety limits
            const url = new URL(endpoint)

            // Set pagination parameters based on strategy
            if (strategy.page === 'offset') {
              url.searchParams.set('offset', ((pageNum - 1) * strategy.limitValue).toString())
            } else {
              url.searchParams.set(strategy.page, pageNum.toString())
            }
            url.searchParams.set(strategy.limit, strategy.limitValue.toString())

            // Try without status filter first (user suggested this might be limiting results)
            if (pageNum === 1) {
              console.log(`📄 Page ${pageNum} - trying WITHOUT status filter`)
            } else {
              url.searchParams.set('status', 'active')
            }

            console.log(`📄 Fetching page ${pageNum} from ${url.toString()}`)

            try {
              const response = await fetch(url.toString(), {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(20000) // 20 second timeout
              })

              console.log(`📡 Page ${pageNum} response: ${response.status} ${response.statusText}`)

              if (!response.ok) {
                console.log(`❌ Page ${pageNum} failed: ${response.status}`)
                if (pageNum === 1) {
                  break // Try next strategy
                } else {
                  hasMorePages = false // End this strategy
                  break
                }
              }

              const data = await response.json()

              // Log full response structure for first page
              if (pageNum === 1) {
                console.log(`🔍 PAGINATION RESPONSE STRUCTURE (page 1):`)
                console.log(JSON.stringify(data, null, 2))
              }

              // Extract lockers from response with more comprehensive checking
              let pageLockers: any[] = []
              let paginationMeta: any = null

              if (Array.isArray(data)) {
                pageLockers = data
              } else if (data.lockers && Array.isArray(data.lockers)) {
                pageLockers = data.lockers
                paginationMeta = { total: data.total, hasMore: data.hasMore, totalPages: data.totalPages }
              } else if (data.data && Array.isArray(data.data)) {
                pageLockers = data.data
                paginationMeta = { total: data.total, hasMore: data.hasMore, totalPages: data.totalPages }
              } else if (data.results && Array.isArray(data.results)) {
                pageLockers = data.results
                paginationMeta = { total: data.total, hasMore: data.hasMore, totalPages: data.totalPages }
              } else if (data.items && Array.isArray(data.items)) {
                pageLockers = data.items
                paginationMeta = { total: data.total, hasMore: data.hasMore, totalPages: data.totalPages }
              }

              console.log(`📊 Page ${pageNum}: Found ${pageLockers.length} lockers`)
              if (paginationMeta) {
                console.log(`📊 Pagination meta:`, paginationMeta)
              }

              if (pageLockers.length === 0) {
                console.log(`📄 Page ${pageNum} returned no lockers, stopping pagination`)
                hasMorePages = false
              } else {
                allLockers.push(...pageLockers)
                totalFetched += pageLockers.length
                console.log(`📄 Page ${pageNum}: Added ${pageLockers.length} lockers (Total: ${allLockers.length})`)

                // Check for natural pagination end
                if (paginationMeta?.hasMore === false) {
                  console.log('📄 API indicates no more pages')
                  hasMorePages = false
                } else if (paginationMeta?.totalPages && pageNum >= paginationMeta.totalPages) {
                  console.log(`📄 Reached total pages: ${paginationMeta.totalPages}`)
                  hasMorePages = false
                } else if (pageLockers.length < strategy.limitValue) {
                  console.log(`📄 Page ${pageNum} returned fewer than ${strategy.limitValue} lockers, assuming last page`)
                  hasMorePages = false
                } else {
                  pageNum++
                }
              }
            } catch (pageError) {
              console.error(`❌ Error fetching page ${pageNum}:`, pageError.message)
              if (pageNum === 1) {
                break // Try next strategy
              } else {
                hasMorePages = false
              }
            }
          }

          if (allLockers.length > 0) {
            console.log(`🎉 SUCCESS with strategy ${strategy.page}/${strategy.limit}: ${allLockers.length} lockers`)

            return new Response(
              JSON.stringify({
                success: true,
                lockers: allLockers,
                source: endpoint,
                method: 'paginated',
                strategy: strategy,
                totalPages: pageNum - 1,
                totalCount: allLockers.length
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
        }

          if (allLockers.length > 0) {
            console.log(`🎉 SUCCESS with strategy ${strategy.page}/${strategy.limit}: ${allLockers.length} lockers`)

            return new Response(
              JSON.stringify({
                success: true,
                lockers: allLockers,
                source: endpoint,
                method: 'paginated',
                strategy: strategy,
                totalPages: pageNum - 1,
                totalCount: allLockers.length
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
