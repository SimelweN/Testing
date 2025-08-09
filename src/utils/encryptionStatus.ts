import { supabase } from "@/integrations/supabase/client";

interface EncryptionStatus {
  available: boolean;
  encryptionWorking: boolean;
  decryptionWorking: boolean;
  error?: string;
}

export const checkEncryptionStatus = async (): Promise<EncryptionStatus> => {
  try {
    console.log("🔍 Checking encryption service status...");

    // Test if encryption function is available
    const { data: encryptData, error: encryptError } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: { test: 'data' }
      }
    });

    if (encryptError) {
      console.warn("❌ Encryption service not available:", encryptError.message);
      return {
        available: false,
        encryptionWorking: false,
        decryptionWorking: false,
        error: `Encryption service error: ${encryptError.message}`
      };
    }

    if (!encryptData?.success) {
      console.warn("❌ Encryption function failed");
      return {
        available: true,
        encryptionWorking: false,
        decryptionWorking: false,
        error: "Encryption function failed"
      };
    }

    // Test if decryption function is available
    const encryptedBundle = encryptData.data;
    const { data: decryptData, error: decryptError } = await supabase.functions.invoke('decrypt-address', {
      body: {
        ciphertext: encryptedBundle.ciphertext,
        iv: encryptedBundle.iv,
        authTag: encryptedBundle.authTag,
        version: encryptedBundle.version
      }
    });

    if (decryptError || !decryptData?.success) {
      console.warn("❌ Decryption service failed:", decryptError?.message);
      return {
        available: true,
        encryptionWorking: true,
        decryptionWorking: false,
        error: `Decryption error: ${decryptError?.message || 'Unknown error'}`
      };
    }

    console.log("✅ Encryption services are working correctly");
    return {
      available: true,
      encryptionWorking: true,
      decryptionWorking: true
    };

  } catch (error) {
    console.error("🚨 Error checking encryption status:", error);
    return {
      available: false,
      encryptionWorking: false,
      decryptionWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Global variable to cache encryption status
let encryptionStatusCache: EncryptionStatus | null = null;
let lastCheck = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const isEncryptionAvailable = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Use cached result if available and not expired
  if (encryptionStatusCache && (now - lastCheck) < CACHE_DURATION) {
    return encryptionStatusCache.available && encryptionStatusCache.encryptionWorking && encryptionStatusCache.decryptionWorking;
  }

  // Check status and cache result
  encryptionStatusCache = await checkEncryptionStatus();
  lastCheck = now;
  
  return encryptionStatusCache.available && encryptionStatusCache.encryptionWorking && encryptionStatusCache.decryptionWorking;
};

export const getEncryptionStatusMessage = (): string => {
  if (!encryptionStatusCache) {
    return "Encryption status not checked yet";
  }

  if (encryptionStatusCache.available && encryptionStatusCache.encryptionWorking && encryptionStatusCache.decryptionWorking) {
    return "✅ Address encryption is active and working";
  }

  if (!encryptionStatusCache.available) {
    return "⚠️ Address encryption services not available - using plaintext storage only";
  }

  return `⚠️ Address encryption partially working - ${encryptionStatusCache.error || 'Unknown issue'}`;
};
