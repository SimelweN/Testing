// Paystack Configuration
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_default",
  BASE_URL: "https://api.paystack.co",

  // Environment validation & test/live mode detection
  isConfigured: () =>
    Boolean(
      PAYSTACK_CONFIG.PUBLIC_KEY &&
        PAYSTACK_CONFIG.PUBLIC_KEY !== "pk_test_default",
    ),
  isTestMode: () => PAYSTACK_CONFIG.PUBLIC_KEY.startsWith("pk_test_"),
  isLiveMode: () => PAYSTACK_CONFIG.PUBLIC_KEY.startsWith("pk_live_"),

  // Development fallback
  isDevelopment: () => import.meta.env.DEV,

  // Get public key with fallback
  getPublicKey: () => {
    if (!PAYSTACK_CONFIG.isConfigured() && PAYSTACK_CONFIG.isDevelopment()) {
      console.warn("��️ Using development fallback - Paystack not configured");
      return "pk_test_development_fallback";
    }
    return PAYSTACK_CONFIG.PUBLIC_KEY;
  },
};

// South African Bank Codes for Paystack
export const PAYSTACK_BANK_CODES = {
  "Absa Bank": "632005",
  "African Bank": "430000",
  "Bidvest Bank": "462005",
  "Capitec Bank": "470010",
  "Discovery Bank": "679000",
  "First National Bank (FNB)": "250655",
  "Grindrod Bank": "584000",
  "Investec Bank": "580105",
  Nedbank: "198765",
  "Standard Bank": "051001",
  TymeBank: "678910",
  "VBS Mutual Bank": "588000",
} as const;

// South African Bank Names (for dropdown)
export const SA_BANKS = Object.keys(PAYSTACK_BANK_CODES) as Array<
  keyof typeof PAYSTACK_BANK_CODES
>;

// Helper functions
export const getBankCode = (
  bankName: keyof typeof PAYSTACK_BANK_CODES,
): string => {
  return PAYSTACK_BANK_CODES[bankName];
};

export const getBankName = (bankCode: string): string | undefined => {
  return Object.keys(PAYSTACK_BANK_CODES).find(
    (name) =>
      PAYSTACK_BANK_CODES[name as keyof typeof PAYSTACK_BANK_CODES] ===
      bankCode,
  );
};

// Validation helpers
export const isValidAccountNumber = (accountNumber: string): boolean => {
  // South African account numbers are typically 9-11 digits
  const cleaned = accountNumber.replace(/\s/g, "");
  return /^\d{9,11}$/.test(cleaned);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Payment amount helpers (convert between Rands and cents)
export const toKobo = (amount: number): number => Math.round(amount * 100);
export const fromKobo = (amount: number): number => Math.round(amount / 100);

// Commission calculation
export const PLATFORM_COMMISSION_RATE = 0.1; // 10%

export const calculatePaymentSplit = (
  bookPrice: number,
  deliveryFee: number = 0,
) => {
  const totalAmount = bookPrice + deliveryFee;
  const platformAmount = Math.round(bookPrice * PLATFORM_COMMISSION_RATE); // 10% of book price to platform
  const sellerAmount = bookPrice - platformAmount; // 90% of book price to seller
  const courierAmount = deliveryFee; // 100% of delivery fee to courier

  return {
    totalAmount,
    sellerAmount, // 90% of book price to seller
    platformAmount, // 10% of book price to platform
    deliveryAmount: courierAmount, // 100% of delivery fee to courier
    sellerAmountKobo: toKobo(sellerAmount),
    platformAmountKobo: toKobo(platformAmount),
    deliveryAmountKobo: toKobo(courierAmount),
    totalAmountKobo: toKobo(totalAmount),
  };
};
