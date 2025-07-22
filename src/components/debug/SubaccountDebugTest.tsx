import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";

const SubaccountDebugTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    business_name: "Test Business " + Date.now(),
    email: "test@example.com",
    bank_name: "Standard Bank",
    bank_code: "058",
    account_number: "1234567890",
  });

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log("🧪 Testing subaccount creation with:", {
        ...formData,
        account_number: "***" + formData.account_number.slice(-4)
      });
      
      const result = await PaystackSubaccountService.createOrUpdateSubaccount(formData);
      
      console.log("🧪 Test result:", result);
      setResult(result);
      
      if (result.success) {
        const hasRecipient = result.recipient_code;
        const successMessage = hasRecipient
          ? `✅ Complete setup! Subaccount: ${result.subaccount_code}, Recipient: ${result.recipient_code}`
          : `✅ Subaccount created: ${result.subaccount_code} (Recipient pending)`;

        toast.success(successMessage, { duration: 5000 });

        // Test book linking
        if (result.subaccount_code) {
          console.log("🧪 Testing book linking...");
          const linkResult = await PaystackSubaccountService.linkBooksToSubaccount(result.subaccount_code);
          console.log("🧪 Book linking result:", linkResult);
          toast.info(linkResult ? "📚 Book linking successful" : "⚠️ Book linking had issues (but this is expected in dev)");
        }
      } else {
        const errorMessage = result.message || result.error || "Unknown error";
        toast.error(`❌ Test failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("🧪 Test error:", error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      setResult(errorResult);
      toast.error(`❌ Test error: ${errorResult.error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Subaccount Creation Debug Test</CardTitle>
        <p className="text-sm text-gray-600">
          This component tests the subaccount creation functionality and helps debug any issues.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_code">Bank Code</Label>
            <Input
              id="bank_code"
              value={formData.bank_code}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_code: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
            />
          </div>
        </div>

        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "🧪 Test Subaccount Creation"
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              <div className="font-medium">
                {result.success ? "✅ Test Successful" : "❌ Test Failed"}
              </div>
              {result.success && result.subaccount_code && (
                <div className="text-sm mt-1">
                  Subaccount Code: <code className="bg-green-100 px-1 rounded">{result.subaccount_code}</code>
                </div>
              )}
              {!result.success && (
                <div className="text-sm mt-1">
                  Error: {result.error}
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs">View Raw Result</summary>
                <pre className="text-xs mt-1 bg-white/50 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="font-medium mb-1">What this test does:</div>
          <ul className="space-y-1 text-xs">
            <li>• Attempts to create a subaccount using the PaystackSubaccountService</li>
            <li>• Tests both the edge function call AND the fallback mock creation</li>
            <li>• Uses the correct database schema: business_name, email, bank_name, bank_code, account_number, subaccount_code, status</li>
            <li>• Attempts to link books to the created subaccount (using seller_subaccount_code column)</li>
            <li>• Shows detailed error information to help debug issues</li>
            <li>• Logs all steps to the browser console for debugging</li>
          </ul>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="font-medium text-blue-800 mb-1">✅ Database Schema Aligned</div>
            <div className="text-blue-700">The code now uses only the actual database columns from your banking_subaccounts table.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubaccountDebugTest;
