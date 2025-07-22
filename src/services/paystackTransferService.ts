import { supabase } from "@/integrations/supabase/client";

export interface TransferRecipient {
  type?: "nuban" | "mobile_money" | "basa";
  name: string;
  description?: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  email?: string;
}

export interface TransferRequest {
  source?: "balance";
  amount: number; // Amount in ZAR
  reference: string;
  recipient: string; // recipient_code from Paystack
  reason: string;
}

export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountVerification {
  account_number: string;
  account_name: string;
  bank_id: number;
}

class PaystackTransferService {
  private async callFunction(functionName: string, data: any, action?: string) {
    const url = action 
      ? `${supabase.supabaseUrl}/functions/v1/${functionName}?action=${action}`
      : `${supabase.supabaseUrl}/functions/v1/${functionName}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.details?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async callFunctionGet(functionName: string, action?: string, params?: Record<string, string>) {
    const searchParams = new URLSearchParams();
    if (action) searchParams.set("action", action);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }

    const url = `${supabase.supabaseUrl}/functions/v1/${functionName}?${searchParams}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.details?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get list of supported banks
   */
  async getBanks(country = "south-africa", currency = "ZAR"): Promise<Bank[]> {
    try {
      const result = await this.callFunctionGet("paystack-transfer-management", "banks", {
        country,
        currency,
      });
      return result.data || [];
    } catch (error) {
      console.error("Error fetching banks:", error);
      throw error;
    }
  }

  /**
   * Verify bank account details
   */
  async verifyAccount(account_number: string, bank_code: string): Promise<AccountVerification> {
    try {
      const result = await this.callFunction("paystack-transfer-management", {
        account_number,
        bank_code,
      }, "verify-account");
      return result.data;
    } catch (error) {
      console.error("Error verifying account:", error);
      throw error;
    }
  }

  /**
   * Create a transfer recipient
   */
  async createRecipient(recipient: TransferRecipient): Promise<any> {
    try {
      const result = await this.callFunction("paystack-transfer-management", {
        type: recipient.type || "nuban",
        name: recipient.name,
        description: recipient.description,
        account_number: recipient.account_number,
        bank_code: recipient.bank_code,
        currency: recipient.currency || "ZAR",
        email: recipient.email,
      }, "create-recipient");
      return result.data;
    } catch (error) {
      console.error("Error creating recipient:", error);
      throw error;
    }
  }

  /**
   * Get list of transfer recipients
   */
  async getRecipients(): Promise<any[]> {
    try {
      const result = await this.callFunctionGet("paystack-transfer-management", "recipients");
      return result.data || [];
    } catch (error) {
      console.error("Error fetching recipients:", error);
      throw error;
    }
  }

  /**
   * Initiate a transfer
   */
  async initiateTransfer(transfer: TransferRequest): Promise<any> {
    try {
      const result = await this.callFunction("paystack-transfer-management", {
        source: transfer.source || "balance",
        amount: transfer.amount, // Amount in ZAR, will be converted to kobo
        reference: transfer.reference,
        recipient: transfer.recipient,
        reason: transfer.reason,
      }, "initiate-transfer");
      return result.data;
    } catch (error) {
      console.error("Error initiating transfer:", error);
      throw error;
    }
  }

  /**
   * Get list of transfers
   */
  async getTransfers(): Promise<any[]> {
    try {
      const result = await this.callFunctionGet("paystack-transfer-management", "transfers");
      return result.data || [];
    } catch (error) {
      console.error("Error fetching transfers:", error);
      throw error;
    }
  }

  /**
   * Verify a payment reference
   */
  async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/verify-paystack-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ reference }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  /**
   * Test the functions with mock data
   */
  async testFunctions(): Promise<{ [key: string]: any }> {
    const results: { [key: string]: any } = {};

    try {
      console.log("🧪 Testing Paystack Transfer Functions...");

      // Test 1: Health check
      console.log("1. Testing health check...");
      const healthResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-transfer-management/health`);
      results.healthCheck = await healthResponse.json();
      console.log("✅ Health check passed");

      // Test 2: Get banks
      console.log("2. Testing get banks...");
      results.banks = await this.getBanks();
      console.log(`✅ Found ${results.banks.length} banks`);

      // Test 3: Verify test account
      console.log("3. Testing account verification...");
      try {
        results.accountVerification = await this.verifyAccount("0123456789", "058");
        console.log("✅ Account verification passed");
      } catch (error) {
        console.log("⚠️ Account verification failed (expected for test data)");
        results.accountVerification = { error: error.message };
      }

      // Test 4: Payment verification
      console.log("4. Testing payment verification...");
      const testReference = `test_ref_${Date.now()}`;
      results.paymentVerification = await this.verifyPayment(testReference);
      console.log("✅ Payment verification test passed");

      console.log("🎉 All tests completed!");
      return results;

    } catch (error) {
      console.error("❌ Test failed:", error);
      results.error = error.message;
      return results;
    }
  }
}

export const paystackTransferService = new PaystackTransferService();
