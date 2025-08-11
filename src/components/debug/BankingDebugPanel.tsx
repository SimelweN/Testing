import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  RefreshCw, 
  Database, 
  User, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Bug
} from "lucide-react";
import { BankingService } from "@/services/bankingService";
import { diagnoseBankingIssues, BankingSystemStatus } from "@/utils/bankingDiagnostics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const BankingDebugPanel: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<BankingSystemStatus | null>(null);
  const [bankingDetails, setBankingDetails] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsRunning(true);
    
    try {
      console.log("🔍 Running comprehensive banking diagnostics...");
      
      // 1. Check system status
      const status = await diagnoseBankingIssues();
      setSystemStatus(status);
      
      // 2. Check banking details from service
      const banking = await BankingService.getUserBankingDetails(user.id);
      setBankingDetails(banking);
      
      // 3. Check profile data directly
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfileData(profile);
      
      // 4. Check banking_subaccounts table directly
      const { data: allBankingRecords, error: bankingError } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("user_id", user.id);
      
      // 5. Log comprehensive data
      console.log("🔍 Banking Diagnostics Results:", {
        systemStatus: status,
        bankingFromService: banking,
        profileData: profile,
        profileError,
        allBankingRecords,
        bankingError,
        userAuth: user?.id
      });
      
      // Check for specific issues
      const issues = [];
      
      if (status.database !== "available") {
        issues.push(`Database issue: ${status.details.databaseError}`);
      }
      
      if (status.edgeFunction === "error") {
        issues.push(`Edge function error: ${status.details.edgeFunctionError}`);
      }
      
      if (banking === null && allBankingRecords?.length === 0) {
        issues.push("No banking records found in database");
      } else if (banking === null && allBankingRecords?.length > 0) {
        issues.push("Banking records exist but service can't retrieve them");
      }
      
      if (profile?.subaccount_code && !banking?.subaccount_code) {
        issues.push("Profile has subaccount_code but banking service doesn't detect it");
      }
      
      if (issues.length > 0) {
        toast.error("Banking issues detected", {
          description: issues[0],
        });
      } else {
        toast.success("Banking diagnostics complete");
      }
      
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast.error("Failed to run diagnostics");
    } finally {
      setIsRunning(false);
    }
  };

  const testSubaccountCreation = async () => {
    if (!user) return;
    
    setIsRunning(true);
    
    try {
      // Test with minimal valid data
      const testData = {
        businessName: "Test Business",
        email: user.email || "test@example.com",
        bankName: "Standard Bank",
        bankCode: "051001",
        accountNumber: "123456789",
        accountHolderName: "Test User"
      };
      
      console.log("🧪 Testing subaccount creation with data:", testData);
      
      const result = await BankingService.createOrUpdateSubaccount(user.id, testData);
      
      console.log("🧪 Test result:", result);
      
      if (result.success) {
        toast.success("Test subaccount creation successful", {
          description: `Subaccount: ${result.subaccountCode}`,
        });
        
        // Re-run diagnostics to see if data persisted
        setTimeout(() => runDiagnostics(), 1000);
      } else {
        toast.error("Test subaccount creation failed", {
          description: result.error,
        });
      }
      
    } catch (error) {
      console.error("Test creation error:", error);
      toast.error("Test creation error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusBadge: React.FC<{ status: string; type: "success" | "warning" | "error" }> = ({ status, type }) => {
    const colors = {
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800", 
      error: "bg-red-100 text-red-800"
    };
    
    return <Badge className={colors[type]}>{status}</Badge>;
  };

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          User must be authenticated to use banking debug panel
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <CardTitle className="flex items-center justify-between text-orange-900">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Banking Debug Panel
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                Run Diagnostics
              </Button>
              
              <Button
                onClick={testSubaccountCreation}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Test Creation
              </Button>
            </div>

            {systemStatus && (
              <div className="space-y-3">
                <h4 className="font-medium">System Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Authentication:</span>
                    <StatusBadge 
                      status={systemStatus.userAuth} 
                      type={systemStatus.userAuth === "authenticated" ? "success" : "error"}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <StatusBadge 
                      status={systemStatus.database} 
                      type={systemStatus.database === "available" ? "success" : "error"}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Edge Function:</span>
                    <StatusBadge 
                      status={systemStatus.edgeFunction} 
                      type={systemStatus.edgeFunction === "available" ? "success" : systemStatus.edgeFunction === "unavailable" ? "warning" : "error"}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Paystack Config:</span>
                    <StatusBadge 
                      status={systemStatus.paystackConfig} 
                      type={systemStatus.paystackConfig === "configured" ? "success" : "error"}
                    />
                  </div>
                </div>
                
                {systemStatus.details && Object.keys(systemStatus.details).length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Issues detected:</strong>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {Object.entries(systemStatus.details).map(([key, value]) => (
                          <li key={key}>{key}: {value}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {bankingDetails && (
              <div className="space-y-2">
                <h4 className="font-medium">Banking Details (from Service)</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(bankingDetails, null, 2)}
                </pre>
              </div>
            )}

            {profileData && (
              <div className="space-y-2">
                <h4 className="font-medium">Profile Data</h4>
                <div className="text-xs space-y-1">
                  <div><strong>Subaccount Code:</strong> {profileData.subaccount_code || "None"}</div>
                  <div><strong>Banking Setup Complete:</strong> {profileData.preferences?.banking_setup_complete ? "Yes" : "No"}</div>
                  <div><strong>Your Name:</strong> {profileData.preferences?.business_name || "None"}</div>
                </div>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Quick Fixes:</strong><br />
                1. If banking records exist but don't show: Check database permissions<br />
                2. If edge function fails: Check Supabase edge function deployment<br />
                3. If subaccount created but not saved: Check banking_subaccounts table schema<br />
                4. If validation fails: Check Paystack API credentials
              </AlertDescription>
            </Alert>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BankingDebugPanel;
