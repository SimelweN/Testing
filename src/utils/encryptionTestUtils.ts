import { supabase } from "@/integrations/supabase/client";

interface TestAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  streetAddress?: string;
  suburb?: string;
}

interface EncryptionTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const testAddressEncryption = async (): Promise<EncryptionTestResult> => {
  try {
    console.log("🧪 Testing address encryption/decryption flow...");

    const testAddress: TestAddress = {
      street: "123 Test Street",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001",
      streetAddress: "123 Test Street",
      suburb: "City Bowl"
    };

    // Test 1: Encrypt address
    console.log("Step 1: Testing encryption...");
    const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: testAddress
      }
    });

    if (encryptError || !encryptResult?.success) {
      return {
        success: false,
        message: "Encryption failed",
        error: encryptError?.message || "Unknown encryption error"
      };
    }

    const encryptedBundle = encryptResult.data;
    console.log("✅ Encryption successful:", {
      ciphertext: encryptedBundle.ciphertext.substring(0, 20) + "...",
      iv: encryptedBundle.iv,
      authTag: encryptedBundle.authTag.substring(0, 20) + "...",
      version: encryptedBundle.version
    });

    // Test 2: Decrypt address
    console.log("Step 2: Testing decryption...");
    const { data: decryptResult, error: decryptError } = await supabase.functions.invoke('decrypt-address', {
      body: {
        ciphertext: encryptedBundle.ciphertext,
        iv: encryptedBundle.iv,
        authTag: encryptedBundle.authTag,
        version: encryptedBundle.version
      }
    });

    if (decryptError || !decryptResult?.success) {
      return {
        success: false,
        message: "Decryption failed",
        error: decryptError?.message || "Unknown decryption error"
      };
    }

    const decryptedAddress = decryptResult.data;
    console.log("✅ Decryption successful:", decryptedAddress);

    // Test 3: Verify data integrity
    console.log("Step 3: Verifying data integrity...");
    const isDataIntact = (
      decryptedAddress.street === testAddress.street &&
      decryptedAddress.city === testAddress.city &&
      decryptedAddress.province === testAddress.province &&
      decryptedAddress.postalCode === testAddress.postalCode
    );

    if (!isDataIntact) {
      return {
        success: false,
        message: "Data integrity check failed",
        error: "Decrypted data does not match original"
      };
    }

    console.log("✅ Data integrity verified");

    return {
      success: true,
      message: "All encryption tests passed successfully",
      data: {
        original: testAddress,
        encrypted: {
          ciphertext: encryptedBundle.ciphertext.substring(0, 20) + "...",
          iv: encryptedBundle.iv,
          authTag: encryptedBundle.authTag.substring(0, 20) + "...",
          version: encryptedBundle.version
        },
        decrypted: decryptedAddress
      }
    };

  } catch (error) {
    console.error("❌ Encryption test failed:", error);
    return {
      success: false,
      message: "Encryption test encountered an error",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const testDatabaseEncryption = async (userId: string): Promise<EncryptionTestResult> => {
  try {
    console.log("🧪 Testing database encryption/decryption flow...");

    const testAddress: TestAddress = {
      street: "456 Database Test Ave",
      city: "Johannesburg", 
      province: "Gauteng",
      postalCode: "2000",
      streetAddress: "456 Database Test Ave",
      suburb: "Sandton"
    };

    // Test 1: Encrypt and save to database
    console.log("Step 1: Encrypting and saving to database...");
    const { data: saveResult, error: saveError } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: testAddress,
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      }
    });

    if (saveError || !saveResult?.success) {
      return {
        success: false,
        message: "Database encryption save failed",
        error: saveError?.message || "Unknown save error"
      };
    }

    console.log("✅ Address encrypted and saved to database");

    // Test 2: Fetch and decrypt from database
    console.log("Step 2: Fetching and decrypting from database...");
    const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('decrypt-address', {
      body: {
        fetch: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      }
    });

    if (fetchError || !fetchResult?.success) {
      return {
        success: false,
        message: "Database decryption fetch failed", 
        error: fetchError?.message || "Unknown fetch error"
      };
    }

    const fetchedAddress = fetchResult.data;
    console.log("✅ Address fetched and decrypted from database:", fetchedAddress);

    // Test 3: Verify database integrity
    console.log("Step 3: Verifying database integrity...");
    const isDataIntact = (
      fetchedAddress.street === testAddress.street &&
      fetchedAddress.city === testAddress.city &&
      fetchedAddress.province === testAddress.province &&
      fetchedAddress.postalCode === testAddress.postalCode
    );

    if (!isDataIntact) {
      return {
        success: false,
        message: "Database integrity check failed",
        error: "Database data does not match original"
      };
    }

    console.log("✅ Database integrity verified");

    return {
      success: true,
      message: "Database encryption test passed successfully", 
      data: {
        original: testAddress,
        fromDatabase: fetchedAddress,
        saved: saveResult.saved
      }
    };

  } catch (error) {
    console.error("❌ Database encryption test failed:", error);
    return {
      success: false,
      message: "Database encryption test encountered an error",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const testDeliveryQuoteEncryption = async (bookId: string, orderId: string): Promise<EncryptionTestResult> => {
  try {
    console.log("🧪 Testing delivery quote encryption flow...");

    // Test getting delivery quotes using encrypted addresses
    console.log("Step 1: Getting delivery quotes with encrypted addresses...");
    const { data: quoteResult, error: quoteError } = await supabase.functions.invoke('get-delivery-quotes', {
      body: {
        fromBookId: bookId,
        toOrderId: orderId,
        weight: 1.5,
        useEncryption: true
      }
    });

    if (quoteError || !quoteResult?.success) {
      return {
        success: false,
        message: "Delivery quote with encryption failed",
        error: quoteError?.message || "Unknown quote error"
      };
    }

    console.log("✅ Delivery quotes received using encrypted addresses:", quoteResult.quotes);

    return {
      success: true,
      message: "Delivery quote encryption test passed successfully",
      data: {
        quotes: quoteResult.quotes,
        providers: quoteResult.providers,
        requestDetails: quoteResult.request_details
      }
    };

  } catch (error) {
    console.error("❌ Delivery quote encryption test failed:", error);
    return {
      success: false,
      message: "Delivery quote encryption test encountered an error", 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Run comprehensive encryption test suite
export const runEncryptionTestSuite = async (userId?: string, bookId?: string, orderId?: string) => {
  console.log("🧪 Running comprehensive encryption test suite...");
  
  const results = {
    basicEncryption: await testAddressEncryption(),
    databaseEncryption: userId ? await testDatabaseEncryption(userId) : null,
    deliveryQuotes: (bookId && orderId) ? await testDeliveryQuoteEncryption(bookId, orderId) : null
  };

  const allPassed = results.basicEncryption.success && 
                   (!results.databaseEncryption || results.databaseEncryption.success) &&
                   (!results.deliveryQuotes || results.deliveryQuotes.success);

  console.log(allPassed ? "✅ All encryption tests passed!" : "❌ Some encryption tests failed");
  
  return {
    success: allPassed,
    results
  };
};
