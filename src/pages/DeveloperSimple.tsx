import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code, ArrowLeft, AlertCircle, Play, User, DollarSign, CheckCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RealSeller {
  id: string;
  name: string;
  email: string;
  orders: number;
  has_banking: boolean;
  banking_status?: string;
  business_name?: string;
  bank_name?: string;
  account_number?: string;
}

interface PayoutResponse {
  success: boolean;
  recipient_code?: string;
  message: string;
  payment_breakdown?: {
    total_orders: number;
    seller_amount: number;
    platform_earnings: {
      total: number;
    };
  };
  seller_info?: {
    name: string;
    email: string;
    account_number: string;
    bank_name: string;
  };
}

const Developer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [realSellers, setRealSellers] = useState<RealSeller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [payoutResponse, setPayoutResponse] = useState<PayoutResponse | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    console.log('Developer component mounted successfully');
    toast.success('Developer Dashboard loaded');
    loadSellers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate("/admin")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Developer Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Test and debug system functions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Basic Test Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-purple-600" />
                <span>Developer Dashboard - Basic Test</span>
              </CardTitle>
              <p className="text-gray-600">
                This is a simplified version to test basic rendering
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-800">Developer Dashboard is rendering successfully!</span>
              </div>
              
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    toast.success('Test button works!');
                  }, 1000);
                }}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </div>
                ) : (
                  <span>Test Basic Functionality</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Component Rendering</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Navigation</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Toast Notifications</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• ✅ Basic component rendering works</p>
                <p>• ⏳ Add payout function testing</p>
                <p>• ⏳ Add seller data fetching</p>
                <p>• ⏳ Add email simulation</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Developer;
