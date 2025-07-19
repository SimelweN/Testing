import { supabase } from "@/integrations/supabase/client";

export interface PaystackSubaccount {
  subaccount_code: string;
  business_name: string;
  account_number: string;
  bank_code: string;
  percentage_charge: number;
}

export interface PaystackTransactionRequest {
  email: string;
  amount: number; // in kobo (cents)
  currency: string;
  reference: string;
  subaccount: string;
  transaction_charge: number; // Platform fee in kobo
  bearer: "account" | "subaccount";
  callback_url?: string;
  metadata?: any;
}

export interface SplitPaymentDetails {
  totalAmount: number;
  sellerAmount: number;
  platformFee: number;
  subaccountCode: string;
  sellerReceivesPercentage: number;
  platformFeePercentage: number;
}

/**
 * Calculate the 90/10 split for book sales
 */
export const calculatePaymentSplit = (
  bookPrice: number,
): SplitPaymentDetails => {
  const sellerReceivesPercentage = 90;
  const platformFeePercentage = 10;

  const sellerAmount = Math.round(bookPrice * (sellerReceivesPercentage / 100));
  const platformFee = bookPrice - sellerAmount; // Ensure total adds up exactly

  return {
    totalAmount: bookPrice,
    sellerAmount,
    platformFee,
    subaccountCode: "", // Will be filled by calling function
    sellerReceivesPercentage,
    platformFeePercentage,
  };
};

/**
 * Create a Paystack subaccount for a seller
 * This would typically call the Paystack API to create a subaccount
 */
export const createPaystackSubaccount = async (
  sellerId: string,
  bankingInfo: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
  },
): Promise<string | null> => {
  try {
    console.log("Creating Paystack subaccount for seller:", sellerId);

    // In a real implementation, this would call the Paystack API:
    // const response = await fetch('/api/paystack/create-subaccount', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     business_name: bankingInfo.accountHolderName,
    //     settlement_bank: getBankCode(bankingInfo.bankName),
    //     account_number: bankingInfo.accountNumber,
    //     percentage_charge: 90, // Seller gets 90%
    //   }),
    // });
    // const data = await response.json();

    // For now, create a mock subaccount code
    const mockSubaccountCode = `ACCT_${sellerId.slice(0, 8)}_${Date.now()}`;

    // Update the user's profile with the subaccount code
    const { error } = await supabase
      .from("profiles")
      .update({
        subaccount_code: mockSubaccountCode,
      })
      .eq("id", sellerId);

    if (error) {
      console.error("Error updating profile with subaccount code:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw error;
    }

    console.log("✅ Paystack subaccount created:", mockSubaccountCode);
    return mockSubaccountCode;
  } catch (error) {
    console.error("Error creating Paystack subaccount:", error);
    return null;
  }
};

/**
 * Initialize a split payment with Paystack
 */
export const initializePaystackPayment = async (
  buyerEmail: string,
  bookPrice: number,
  deliveryFee: number,
  subaccountCode: string,
  bookTitle: string,
  sellerId: string,
  buyerId: string,
): Promise<string | null> => {
  try {
    const split = calculatePaymentSplit(bookPrice);
    const totalAmountKobo = (bookPrice + deliveryFee) * 100; // Convert to kobo
    const platformFeeKobo = split.platformFee * 100;

    const reference = `RB_${Date.now()}_${buyerId.slice(0, 8)}`;

    console.log("Initializing Paystack payment:", {
      totalAmount: totalAmountKobo / 100,
      sellerAmount: split.sellerAmount,
      platformFee: split.platformFee,
      deliveryFee,
      reference,
    });

    // In a real implementation, this would call the Paystack API:
    // const response = await fetch('/api/paystack/initialize', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: buyerEmail,
    //     amount: totalAmountKobo,
    //     reference,
    //     subaccount: subaccountCode,
    //     transaction_charge: platformFeeKobo,
    //     bearer: 'subaccount', // Subaccount bears transaction fees
    //     metadata: {
    //       book_title: bookTitle,
    //       seller_id: sellerId,
    //       buyer_id: buyerId,
    //       book_price: bookPrice,
    //       delivery_fee: deliveryFee,
    //       platform_fee: split.platformFee,
    //       seller_amount: split.sellerAmount,
    //     },
    //   }),
    // });
    // const data = await response.json();
    // return data.data.authorization_url;

    // For now, return a mock payment reference
    console.log("✅ Mock Paystack payment initialized:", reference);
    return reference;
  } catch (error) {
    console.error("Error initializing Paystack payment:", error);
    return null;
  }
};

/**
 * Verify a Paystack payment
 */
export const verifyPaystackPayment = async (
  reference: string,
): Promise<boolean> => {
  try {
    console.log("Verifying Paystack payment:", reference);

    // In a real implementation, this would call the Paystack API:
    // const response = await fetch(`/api/paystack/verify/${reference}`, {
    //   method: 'GET',
    //   headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    // });
    // const data = await response.json();
    // return data.data.status === 'success';

    // For now, mock successful verification
    console.log("✅ Mock Paystack payment verified:", reference);
    return true;
  } catch (error) {
    console.error("Error verifying Paystack payment:", error);
    return false;
  }
};

/**
 * Get bank codes for South African banks
 */
export const getBankCode = (bankName: string): string => {
  const bankCodes: { [key: string]: string } = {
    ABSA: "632005",
    "Standard Bank": "051001",
    "First National Bank (FNB)": "250655",
    Nedbank: "198765",
    "Capitec Bank": "470010",
    "African Bank": "430000",
    "Bidvest Bank": "462005",
    "Discovery Bank": "679000",
    Investec: "580105",
    TymeBank: "678910",
    "Bank Zero": "888000",
  };

  return bankCodes[bankName] || "000000";
};

/**
 * Calculate escrow release amounts
 */
export const calculateEscrowRelease = (
  totalAmount: number,
  deliveryFee: number,
): {
  sellerAmount: number;
  platformFee: number;
  deliveryAmount: number;
  releaseBreakdown: string[];
} => {
  const bookAmount = totalAmount - deliveryFee;
  const split = calculatePaymentSplit(bookAmount);

  return {
    sellerAmount: split.sellerAmount,
    platformFee: split.platformFee,
    deliveryAmount: deliveryFee,
    releaseBreakdown: [
      `Seller receives: R${split.sellerAmount.toFixed(2)} (90% of book price)`,
      `Platform fee: R${split.platformFee.toFixed(2)} (10% of book price)`,
      `Delivery fee: R${deliveryFee.toFixed(2)} (goes to courier)`,
      `Total processed: R${totalAmount.toFixed(2)}`,
    ],
  };
};

/**
 * Mock payment processing for development
 */
export const processPaymentMock = async (
  amount: number,
  buyerEmail: string,
  sellerSubaccount: string,
  bookTitle: string,
): Promise<{
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  error?: string;
}> => {
  try {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const reference = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Mock payment processed:", {
      amount: amount / 100, // Convert from kobo
      buyerEmail,
      sellerSubaccount,
      bookTitle,
      reference,
    });

    return {
      success: true,
      reference,
      authorizationUrl: `https://checkout.paystack.com/mock/${reference}`,
    };
  } catch (error) {
    return {
      success: false,
      reference: "",
      error:
        error instanceof Error ? error.message : "Payment processing failed",
    };
  }
};

/**
 * Update banking information and create Paystack subaccount
 */
export const setupSellerBanking = async (
  sellerId: string,
  bankingInfo: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
  },
): Promise<{
  success: boolean;
  subaccountCode?: string;
  error?: string;
}> => {
  try {
    // Create Paystack subaccount
    const subaccountCode = await createPaystackSubaccount(
      sellerId,
      bankingInfo,
    );

    if (!subaccountCode) {
      return {
        success: false,
        error: "Failed to create Paystack subaccount",
      };
    }

    // Update banking info in database
    const { error } = await supabase
      .from("profiles")
      .update({
        banking_info: bankingInfo,
        banking_setup_at: new Date().toISOString(),
        subaccount_code: subaccountCode,
      })
      .eq("id", sellerId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      subaccountCode,
    };
  } catch (error) {
    console.error("Error setting up seller banking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Banking setup failed",
    };
  }
};
