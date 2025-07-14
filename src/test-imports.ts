// Test file to verify all banking system imports work
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import { PaymentService } from "@/services/paymentService";
import { PAYSTACK_CONFIG } from "@/config/paystack";

// This file is just for testing imports - can be deleted after verification
console.log("All imports working correctly");
