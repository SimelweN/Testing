// Supabase Edge Function: encrypt-address
// AES-256-GCM encryption with strict validation and structured errors
// Authenticated by default (verify_jwt = true). CORS enabled.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser clients
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface EncryptedBundle {
  ciphertext: string;    // Base64 encoded ciphertext (without auth tag)
  iv: string;            // Base64 encoded 12-byte IV
  authTag: string;       // Base64 encoded 16-byte auth tag
  version?: number;      // Encryption version
  aad?: string;          // Base64 encoded AAD (optional)
}

interface EncryptionInput {
  // One of these must be provided
  plaintext?: string;    // Raw plaintext string
  object?: unknown;      // Arbitrary JSON object to stringify and encrypt

  // Optional parameters
  iv?: string;           // Base64 encoded 12-byte IV (if not provided, a secure IV is generated)
  aad?: string;          // Base64 encoded AAD (optional)
  version?: number;      // Key version
}

interface EncryptionError {
  code: 'INVALID_KEY' | 'PARSE_ERROR' | 'INVALID_IV' | 'INVALID_BASE64' | 'ENCRYPTION_FAILED';
  message: string;
}

interface EncryptionResult<T = EncryptedBundle> {
  success: boolean;
  data?: T;
  error?: EncryptionError;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    headers: corsHeaders,
    ...init,
  });
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (_e) {
    throw new Error('INVALID_BASE64');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1;
  const keyVar = `ENCRYPTION_KEY_V${v}`;
  const fallbackVar = 'ENCRYPTION_KEY';

  // Prefer versioned key, fallback to generic
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null;
  return key;
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(rawKeyString);
  if (keyBytes.byteLength !== 32) {
    // If it's not exactly 32 bytes, try to interpret as base64 for convenience
    try {
      const b64Bytes = base64ToBytes(rawKeyString);
      if (b64Bytes.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH');
      }
      return crypto.subtle.importKey('raw', b64Bytes, 'AES-GCM', false, ['encrypt']);
    } catch (_e) {
      throw new Error('INVALID_KEY_LENGTH');
    }
  }
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
}

function getOrGenerateIv(ivBase64?: string): { ivBytes: Uint8Array; ivB64: string } {
  if (ivBase64) {
    const ivBytes = base64ToBytes(ivBase64);
    if (ivBytes.byteLength !== 12) throw new Error('INVALID_IV');
    return { ivBytes, ivB64: ivBase64 };
  }
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const ivB64 = bytesToBase64(ivBytes);
  return { ivBytes, ivB64 };
}

async function encryptGCM(plaintext: string, opts: { iv?: string; aad?: string; version?: number }): Promise<EncryptedBundle> {
  const { iv, aad, version } = opts;
  const keyString = getEncryptionKey(version);
  if (!keyString) throw new Error('MISSING_KEY');

  const cryptoKey = await importAesKey(keyString);
  const { ivBytes, ivB64 } = getOrGenerateIv(iv);
  const aadBytes = aad ? base64ToBytes(aad) : undefined;

  try {
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        additionalData: aadBytes,
        tagLength: 128,
      },
      cryptoKey,
      encoded,
    );

    // WebCrypto returns ciphertext || authTag
    const full = new Uint8Array(encrypted);
    if (full.byteLength < 16) throw new Error('ENCRYPTION_FAILED');
    const tagBytes = full.slice(full.byteLength - 16);
    const cipherBytes = full.slice(0, full.byteLength - 16);

    return {
      ciphertext: bytesToBase64(cipherBytes),
      iv: ivB64,
      authTag: bytesToBase64(tagBytes),
      version,
      aad,
    };
  } catch (_e) {
    throw new Error('ENCRYPTION_FAILED');
  }
}

function parseRequestBody(body: any): { plaintext: string; iv?: string; aad?: string; version?: number } | null {
  try {
    if (!body) return null;

    // 1) Direct plaintext string
    if (typeof body.plaintext === 'string' && body.plaintext.length > 0) {
      return {
        plaintext: body.plaintext,
        iv: body.iv ? String(body.iv) : undefined,
        aad: body.aad ? String(body.aad) : undefined,
        version: typeof body.version === 'number' ? body.version : undefined,
      };
    }

    // 2) JSON object to stringify
    if (typeof body.object !== 'undefined') {
      const plaintext = JSON.stringify(body.object);
      return {
        plaintext,
        iv: body.iv ? String(body.iv) : undefined,
        aad: body.aad ? String(body.aad) : undefined,
        version: typeof body.version === 'number' ? body.version : undefined,
      };
    }

    // 3) Fallback to 'data' field (string or object)
    if (typeof body.data !== 'undefined') {
      const plaintext = typeof body.data === 'string' ? body.data : JSON.stringify(body.data);
      return {
        plaintext,
        iv: body.iv ? String(body.iv) : undefined,
        aad: body.aad ? String(body.aad) : undefined,
        version: typeof body.version === 'number' ? body.version : undefined,
      };
    }

    return null;
  } catch (_e) {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'Use POST with JSON body.' } }, { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'Invalid JSON body.' } }, { status: 400 });
  }

  const params = parseRequestBody(body);
  if (!params) {
    return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'Missing plaintext/object to encrypt.' } }, { status: 400 });
  }

  // Validate IV if provided
  try {
    if (params.iv) {
      const ivBytes = base64ToBytes(params.iv);
      if (ivBytes.byteLength !== 12) throw new Error('INVALID_IV');
    }
    // Validate AAD if provided
    if (params.aad) {
      // Just ensure it's valid base64
      base64ToBytes(params.aad);
    }
  } catch (e) {
    const err = e as Error;
    if (err.message === 'INVALID_BASE64') {
      return jsonResponse({ success: false, error: { code: 'INVALID_BASE64', message: 'IV/AAD must be base64 encoded.' } }, { status: 400 });
    }
    if (err.message === 'INVALID_IV') {
      return jsonResponse({ success: false, error: { code: 'INVALID_IV', message: 'IV must be a 12-byte base64 string.' } }, { status: 400 });
    }
    // Unknown parsing error
    return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'Invalid encryption parameters.' } }, { status: 400 });
  }

  try {
    const bundle = await encryptGCM(params.plaintext, { iv: params.iv, aad: params.aad, version: params.version });

    // Optional: Save to database if requested
    let saved: { table: string; id: string; column: string } | null = null;
    if (body.save && body.save.table) {
      const table = String(body.save.table) as 'profiles' | 'books' | 'orders';
      const id = body.save.target_id ? String(body.save.target_id) : undefined;
      const addressType = body.save.address_type ? String(body.save.address_type) as 'pickup' | 'shipping' : undefined;

      if (!id && table !== 'profiles') {
        return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'target_id is required for books and orders.' } }, { status: 400 });
      }
      if (table === 'profiles' && !id) {
        return jsonResponse({ success: false, error: { code: 'PARSE_ERROR', message: 'target_id (profile id) is required.' } }, { status: 400 });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      });

      let column = '' as string;
      if (table === 'profiles') {
        column = addressType === 'shipping' ? 'shipping_address_encrypted' : 'pickup_address_encrypted';
      } else if (table === 'books') {
        column = 'pickup_address_encrypted';
      } else if (table === 'orders') {
        column = 'shipping_address_encrypted';
      }

      const payload: Record<string, any> = {};
      payload[column] = JSON.stringify({ ...bundle });
      payload['address_encryption_version'] = params.version ?? 1;

      if (table === 'profiles') {
        const { error } = await supabase.from('profiles').update(payload).eq('id', id!);
        if (error) return jsonResponse({ success: false, error: { code: 'ENCRYPTION_FAILED', message: `DB save failed: ${error.message}` } }, { status: 400 });
        saved = { table, id: id!, column };
      } else if (table === 'books') {
        const { error } = await supabase.from('books').update(payload).eq('id', id!);
        if (error) return jsonResponse({ success: false, error: { code: 'ENCRYPTION_FAILED', message: `DB save failed: ${error.message}` } }, { status: 400 });
        saved = { table, id: id!, column };
      } else {
        const { error } = await supabase.from('orders').update(payload).eq('id', id!);
        if (error) return jsonResponse({ success: false, error: { code: 'ENCRYPTION_FAILED', message: `DB save failed: ${error.message}` } }, { status: 400 });
        saved = { table, id: id!, column };
      }
    }

    return jsonResponse({ success: true, data: bundle, saved } as EncryptionResult & { saved?: typeof saved }, { status: 201 });
  } catch (e) {
    const err = e as Error;
    switch (err.message) {
      case 'MISSING_KEY':
        return jsonResponse({ success: false, error: { code: 'INVALID_KEY', message: 'Encryption key not configured.' } }, { status: 500 });
      case 'INVALID_KEY_LENGTH':
        return jsonResponse({ success: false, error: { code: 'INVALID_KEY', message: 'Encryption key must be exactly 32 bytes.' } }, { status: 500 });
      case 'INVALID_IV':
        return jsonResponse({ success: false, error: { code: 'INVALID_IV', message: 'IV must be a 12-byte base64 string.' } }, { status: 400 });
      case 'INVALID_BASE64':
        return jsonResponse({ success: false, error: { code: 'INVALID_BASE64', message: 'One or more fields are not valid base64.' } }, { status: 400 });
      case 'ENCRYPTION_FAILED':
      default:
        return jsonResponse({ success: false, error: { code: 'ENCRYPTION_FAILED', message: 'Encryption failed.' } }, { status: 400 });
    }
  }
});
