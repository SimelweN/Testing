// Supabase Edge Function: decrypt-address
// AES-256-GCM decryption with strict validation and structured errors
// Supports both legacy and new request formats

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface DecryptionParams {
  encryptedData: string; // Base64 encoded ciphertext (without auth tag)
  iv: string;            // Base64 encoded 12-byte IV
  authTag: string;       // Base64 encoded 16-byte tag
  aad?: string;          // Base64 encoded AAD (optional)
  version?: number;      // Key version
}

interface EncryptedBundle {
  ciphertext: string;    // Base64 encoded ciphertext
  iv: string;            // Base64 encoded IV
  authTag: string;       // Base64 encoded auth tag
  version?: number;      // Encryption version
  aad?: string;          // Base64 encoded AAD (optional)
}

interface DecryptionError {
  code: 'INVALID_KEY' | 'CORRUPTED_DATA' | 'AUTH_FAILED' | 'PARSE_ERROR' | 'NOT_FOUND';
  message: string;
}

interface DecryptionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: DecryptionError;
}

// Legacy request format (for backwards compatibility)
interface LegacyDecryptRequest {
  table: 'profiles' | 'orders' | 'books'
  target_id: string
  address_type: 'pickup' | 'shipping' | 'delivery'
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    headers: corsHeaders,
    ...init,
  })
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch (_e) {
    throw new Error('INVALID_BASE64')
  }
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1
  const keyVar = `ENCRYPTION_KEY_V${v}`
  const fallbackVar = 'ENCRYPTION_KEY'

  // Prefer versioned key, fallback to generic
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null
  return key
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyBytes = enc.encode(rawKeyString)
  if (keyBytes.byteLength !== 32) {
    // If it's not exactly 32 bytes, try to interpret as base64 for convenience
    try {
      const b64Bytes = base64ToBytes(rawKeyString)
      if (b64Bytes.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH')
      }
      return crypto.subtle.importKey('raw', b64Bytes, 'AES-GCM', false, ['decrypt'])
    } catch (_e) {
      throw new Error('INVALID_KEY_LENGTH')
    }
  }
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
}

async function decryptGCM(params: DecryptionParams): Promise<Uint8Array> {
  const { encryptedData, iv, authTag, aad } = params

  const ivBytes = base64ToBytes(iv)
  const tagBytes = base64ToBytes(authTag)
  const cipherBytes = base64ToBytes(encryptedData)
  const aadBytes = aad ? base64ToBytes(aad) : undefined

  if (ivBytes.byteLength !== 12) throw new Error('INVALID_IV')
  if (tagBytes.byteLength !== 16) throw new Error('INVALID_TAG')
  if (cipherBytes.byteLength <= 0) throw new Error('INVALID_CIPHERTEXT')

  // WebCrypto expects auth tag appended to ciphertext
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length)
  combined.set(cipherBytes, 0)
  combined.set(tagBytes, cipherBytes.length)

  const keyString = getEncryptionKey(params.version)
  if (!keyString) throw new Error('MISSING_KEY')

  const cryptoKey = await importAesKey(keyString)

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        additionalData: aadBytes,
        tagLength: 128,
      },
      cryptoKey,
      combined,
    )
    return new Uint8Array(decrypted)
  } catch (e) {
    // Most GCM failures are authentication/tag mismatches
    const err = e as Error
    if (err.name === 'OperationError') {
      throw new Error('AUTH_FAILED')
    }
    throw new Error('CORRUPTED_DATA')
  }
}

function parseRequestBody(body: any): DecryptionParams | null {
  try {
    // Accept multiple formats
    // 1) Direct fields
    if (body && body.encryptedData && body.iv && body.authTag) {
      return {
        encryptedData: String(body.encryptedData),
        iv: String(body.iv),
        authTag: String(body.authTag),
        aad: body.aad ? String(body.aad) : undefined,
        version: typeof body.version === 'number' ? body.version : undefined,
      }
    }

    // 2) Nested bundle object
    if (body && body.encrypted) {
      const b: EncryptedBundle = typeof body.encrypted === 'string'
        ? JSON.parse(body.encrypted)
        : body.encrypted
      if (b && b.ciphertext && b.iv && b.authTag) {
        return {
          encryptedData: String(b.ciphertext),
          iv: String(b.iv),
          authTag: String(b.authTag),
          aad: b.aad ? String(b.aad) : undefined,
          version: typeof b.version === 'number' ? b.version : undefined,
        }
      }
    }

    // 3) Flat bundle fields
    if (body && body.ciphertext && body.iv && body.authTag) {
      return {
        encryptedData: String(body.ciphertext),
        iv: String(body.iv),
        authTag: String(body.authTag),
        aad: body.aad ? String(body.aad) : undefined,
        version: typeof body.version === 'number' ? body.version : undefined,
      }
    }

    return null
  } catch (_e) {
    return null
  }
}

Deno.serve(async (req: Request) => {
  console.log(`[decrypt-address] ${req.method} request received`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ 
      success: false, 
      error: { code: 'PARSE_ERROR', message: 'Use POST with JSON body.' } 
    }, { status: 405 })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    let body: any
    try {
      body = await req.json()
    } catch (_e) {
      return jsonResponse({ 
        success: false, 
        error: { code: 'PARSE_ERROR', message: 'Invalid JSON body.' } 
      }, { status: 400 })
    }

    console.log(`[decrypt-address] Processing request for authenticated user`)

    // Check if this is a legacy format request (direct table/target_id/address_type)
    if (body && body.table && body.target_id && body.address_type) {
      const { table, target_id, address_type }: LegacyDecryptRequest = body

      // Determine the encrypted column name
      let encryptedColumn: string
      let plaintextColumn: string
      
      switch (address_type) {
        case 'pickup':
          encryptedColumn = 'pickup_address_encrypted'
          plaintextColumn = 'pickup_address'
          break
        case 'shipping':
          encryptedColumn = 'shipping_address_encrypted'
          plaintextColumn = 'shipping_address'
          break
        case 'delivery':
          encryptedColumn = 'delivery_address_encrypted'
          plaintextColumn = 'delivery_address'
          break
        default:
          throw new Error('Invalid address_type')
      }

      // First, check if we have access to this record
      let query = supabase.from(table).select(`id, ${encryptedColumn}, ${plaintextColumn}, address_encryption_version`)
      
      if (table === 'profiles') {
        // For profiles, users can access their own data or seller pickup addresses for checkout
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        const isAdmin = profile?.is_admin || false

        // Allow access if:
        // 1. User is admin
        // 2. User is accessing their own data
        // 3. User is accessing seller pickup address for checkout (address_type === 'pickup')
        if (!isAdmin && user.id !== target_id) {
          // For pickup addresses, allow access if the target is a seller with available books
          if (address_type === 'pickup') {
            const { data: sellerBooks, error: booksError } = await supabase
              .from('books')
              .select('id')
              .eq('seller_id', target_id)
              .eq('sold', false)
              .eq('availability', 'available')
              .limit(1)

            if (booksError) {
              console.error('[decrypt-address] Error checking seller books:', booksError)
              throw new Error('Failed to validate seller access')
            }

            // Allow access if seller has available books
            if (!sellerBooks || sellerBooks.length === 0) {
              throw new Error('Unauthorized access to profile data')
            }

            console.log(`[decrypt-address] Allowing checkout access to seller ${target_id} pickup address`)
          } else {
            // For non-pickup addresses (shipping), only allow own data or admin
            throw new Error('Unauthorized access to profile data')
          }
        }
      }

      const { data, error } = await query.eq('id', target_id).single()
      
      if (error) {
        console.error(`[decrypt-address] Database error:`, error)
        throw new Error(`Failed to fetch record: ${error.message}`)
      }

      if (!data) {
        console.log(`[decrypt-address] No record found`)
        return jsonResponse({
          success: false, 
          data: null, 
          error: { code: 'NOT_FOUND', message: 'Record not found' }
        }, { status: 404 })
      }

      const encryptedData = data[encryptedColumn]
      const plaintextData = data[plaintextColumn]

      // If we have encrypted data, try to decrypt it
      if (encryptedData) {
        try {
          console.log(`[decrypt-address] Processing encrypted data`)
          
          let bundle: EncryptedBundle
          try {
            bundle = typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData
          } catch (_e) {
            return jsonResponse({ 
              success: false, 
              error: { code: 'PARSE_ERROR', message: 'Stored encrypted bundle is not valid JSON.' } 
            }, { status: 422 })
          }

          const version = typeof bundle.version === 'number' ? bundle.version : (typeof data.address_encryption_version === 'number' ? data.address_encryption_version : 1)

          const decryptParams: DecryptionParams = {
            encryptedData: String(bundle.ciphertext),
            iv: String(bundle.iv),
            authTag: String(bundle.authTag),
            aad: bundle.aad ? String(bundle.aad) : undefined,
            version,
          }

          const plaintextBytes = await decryptGCM(decryptParams)
          const text = new TextDecoder().decode(plaintextBytes)
          
          try {
            const obj = JSON.parse(text)
            return jsonResponse({ success: true, data: obj } as DecryptionResult)
          } catch (_e) {
            return jsonResponse({ 
              success: false, 
              error: { code: 'PARSE_ERROR', message: 'Decryption succeeded but payload is not valid JSON.' } 
            }, { status: 422 })
          }
        } catch (decryptError) {
          console.error(`[decrypt-address] Decryption failed:`, decryptError)
          // Fall back to plaintext if available
        }
      }

      // Return plaintext data if available
      if (plaintextData) {
        console.log(`[decrypt-address] Returning address data`)
        return jsonResponse({
          success: true, 
          data: plaintextData
        })
      }

      // No data found
      console.log(`[decrypt-address] No address data found`)
      return jsonResponse({
        success: false, 
        data: null, 
        error: { code: 'NOT_FOUND', message: 'No address data found' }
      }, { status: 404 })
    }

    // Handle new format with fetch object
    if (body && body.fetch && body.fetch.table) {
      const table = String(body.fetch.table) as 'profiles' | 'books' | 'orders'
      const id = body.fetch.target_id ? String(body.fetch.target_id) : undefined
      const addressType = body.fetch.address_type ? String(body.fetch.address_type) as 'pickup' | 'shipping' : undefined

      if (!id) {
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'target_id is required.' } 
        }, { status: 400 })
      }

      let column = ''
      if (table === 'profiles') {
        column = addressType === 'shipping' ? 'shipping_address_encrypted' : 'pickup_address_encrypted'
      } else if (table === 'books') {
        column = 'pickup_address_encrypted'
      } else if (table === 'orders') {
        column = 'shipping_address_encrypted'
      }

      const selectCols = `${column}, address_encryption_version`

      let row: any = null
      if (table === 'profiles') {
        const { data, error } = await supabase.from('profiles').select(selectCols).eq('id', id).maybeSingle()
        if (error) throw error
        row = data
      } else if (table === 'books') {
        const { data, error } = await supabase.from('books').select(selectCols).eq('id', id).maybeSingle()
        if (error) throw error
        row = data
      } else {
        const { data, error } = await supabase.from('orders').select(selectCols).eq('id', id).maybeSingle()
        if (error) throw error
        row = data
      }

      if (!row || !row[column]) {
        return jsonResponse({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'No encrypted data found for the given record/column.' } 
        }, { status: 404 })
      }

      let bundle: EncryptedBundle
      try {
        bundle = typeof row[column] === 'string' ? JSON.parse(row[column]) : row[column]
      } catch (_e) {
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'Stored encrypted bundle is not valid JSON.' } 
        }, { status: 422 })
      }

      const version = typeof bundle.version === 'number' ? bundle.version : (typeof row.address_encryption_version === 'number' ? row.address_encryption_version : 1)

      const fetchParams: DecryptionParams = {
        encryptedData: String(bundle.ciphertext),
        iv: String(bundle.iv),
        authTag: String(bundle.authTag),
        aad: bundle.aad ? String(bundle.aad) : undefined,
        version,
      }

      const plaintextBytes = await decryptGCM(fetchParams)
      const text = new TextDecoder().decode(plaintextBytes)
      try {
        const obj = JSON.parse(text)
        return jsonResponse({ success: true, data: obj } as DecryptionResult)
      } catch (_e) {
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'Decryption succeeded but payload is not valid JSON.' } 
        }, { status: 422 })
      }
    }

    // Default path: use explicit decryption fields
    const params = parseRequestBody(body)
    if (!params) {
      return jsonResponse({ 
        success: false, 
        error: { code: 'PARSE_ERROR', message: 'Missing or invalid encryption fields.' } 
      }, { status: 400 })
    }

    const plaintextBytes = await decryptGCM(params)
    const text = new TextDecoder().decode(plaintextBytes)

    // Try to parse JSON (typical for address objects)
    try {
      const obj = JSON.parse(text)
      return jsonResponse({ success: true, data: obj } as DecryptionResult)
    } catch (_e) {
      // Decryption OK but not valid JSON
      return jsonResponse({ 
        success: false, 
        error: { code: 'PARSE_ERROR', message: 'Decryption succeeded but payload is not valid JSON.' } 
      }, { status: 422 })
    }

  } catch (error) {
    console.error(`[decrypt-address] Error:`, error)
    
    const err = error as Error
    switch (err.message) {
      case 'MISSING_KEY':
        return jsonResponse({ 
          success: false, 
          error: { code: 'INVALID_KEY', message: 'Encryption key not configured.' } 
        }, { status: 500 })
      case 'INVALID_KEY_LENGTH':
        return jsonResponse({ 
          success: false, 
          error: { code: 'INVALID_KEY', message: 'Encryption key must be exactly 32 bytes.' } 
        }, { status: 500 })
      case 'INVALID_IV':
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'IV must be a 12-byte base64 string.' } 
        }, { status: 400 })
      case 'INVALID_TAG':
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'Auth tag must be a 16-byte base64 string.' } 
        }, { status: 400 })
      case 'INVALID_CIPHERTEXT':
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'Ciphertext is empty or invalid.' } 
        }, { status: 400 })
      case 'INVALID_BASE64':
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: 'One or more fields are not valid base64.' } 
        }, { status: 400 })
      case 'AUTH_FAILED':
        return jsonResponse({ 
          success: false, 
          error: { code: 'AUTH_FAILED', message: 'Authentication failed. Invalid tag or key.' } 
        }, { status: 401 })
      case 'CORRUPTED_DATA':
        return jsonResponse({ 
          success: false, 
          error: { code: 'CORRUPTED_DATA', message: 'Decryption failed due to corrupted input.' } 
        }, { status: 400 })
      default:
        return jsonResponse({ 
          success: false, 
          error: { code: 'PARSE_ERROR', message: err.message || 'Internal server error' }
        }, { status: 500 })
    }
  }
})
