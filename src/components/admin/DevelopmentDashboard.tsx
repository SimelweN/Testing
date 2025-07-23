import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Code,
  PlayCircle,
  Receipt,
  AlertCircle,
  UserPlus,
  Download,
  Settings,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SellerPayoutManager } from "./SellerPayoutManager";

export const DevelopmentDashboard: React.FC = () => {
  const [testRecipientData, setTestRecipientData] = useState<any>(null);
  const [isTestingRecipient, setIsTestingRecipient] = useState(false);
  const [availableSellers, setAvailableSellers] = useState<any[]>([]);
  const [selectedTestSeller, setSelectedTestSeller] = useState<string>('');

  useEffect(() => {
    loadAvailableSellers();
  }, []);

  const loadAvailableSellers = async () => {
    try {
      // Get users who have banking subaccounts (real sellers)
      const { data: sellers, error } = await supabase
        .from('banking_subaccounts')
        .select(`
          user_id,
          business_name,
          email,
          bank_name,
          account_number,
          status,
          profiles!user_id (
            name,
            email
          )
        `)
        .eq('status', 'active')
        .limit(10);

      if (error) {
        console.error('Error loading sellers:', error);
        return;
      }

      console.log('Available sellers for testing:', sellers);
      setAvailableSellers(sellers || []);
      
      // Auto-select first seller
      if (sellers && sellers.length > 0) {
        setSelectedTestSeller(sellers[0].user_id);
      }
    } catch (error) {
      console.error('Exception loading sellers:', error);
    }
  };

  const testReceiptCreation = async () => {
    if (!selectedTestSeller) {
      toast.error('Please select a seller to test');
      return;
    }

    setIsTestingRecipient(true);
    setTestRecipientData(null);

    try {
      toast.info('Testing receipt creation with real seller data...');

      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('create-paystack-subaccount', {
        method: 'POST',
        body: { sellerId: selectedTestSeller }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      setTestRecipientData(data);
      toast.success('Receipt creation test completed successfully!');

    } catch (error) {
      console.error('Error testing receipt creation:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingRecipient(false);
    }
  };

  const downloadTestReceipt = () => {
    if (!testRecipientData) return;

    const receiptText = formatTestReceiptText(testRecipientData);
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-receipt-${selectedTestSeller}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Test receipt downloaded!');
  };

  const formatTestReceiptText = (data: any): string => {
    const date = new Date().toLocaleString();
    const breakdown = data.payment_breakdown || {};
    const sellerInfo = data.seller_info || {};

    return `
TEST RECEIPT CREATION - REBOOKED SOLUTIONS
==========================================

Test Date: ${date}
Test Mode: ${data.development_mode ? 'Development' : 'Production'}
Seller ID: ${selectedTestSeller}

SELLER INFORMATION
------------------
Name: ${sellerInfo.name || 'Unknown'}
Email: ${sellerInfo.email || 'Unknown'}
Account: ${sellerInfo.account_number || 'N/A'}
Bank: ${sellerInfo.bank_name || 'N/A'}

PAYSTACK RECIPIENT
------------------
Recipient Code: ${data.recipient_code || 'N/A'}
Status: ${data.success ? 'Created Successfully' : 'Failed'}
Message: ${data.message || 'N/A'}
Already Existed: ${data.already_existed ? 'Yes' : 'No'}

PAYMENT BREAKDOWN (MOCK DATA)
-----------------------------
Total Orders: ${breakdown.total_orders || 0}
Total Book Sales: R${(breakdown.total_book_sales || 0).toFixed(2)}
Total Delivery Fees: R${(breakdown.total_delivery_fees || 0).toFixed(2)}

Platform Commission (${breakdown.commission_structure?.book_commission_rate || '10%'}): R${(breakdown.platform_earnings?.book_commission || 0).toFixed(2)}
Platform Delivery Fees: R${(breakdown.platform_earnings?.delivery_fees || 0).toFixed(2)}
Total Platform Earnings: R${(breakdown.platform_earnings?.total || 0).toFixed(2)}

SELLER PAYOUT AMOUNT: R${(breakdown.seller_amount || 0).toFixed(2)}

ORDER DETAILS (MOCK DATA)
--------------------------
${formatTestOrderDetails(breakdown.order_details || [])}

INSTRUCTIONS
------------
${data.instructions || 'Test completed successfully.'}

This is a test receipt generated for development purposes.
Function: create-paystack-subaccount
Generated: ${date}
    `.trim();
  };

  const formatTestOrderDetails = (orderDetails: any[]): string => {
    if (!orderDetails || orderDetails.length === 0) {
      return 'No mock orders in breakdown';
    }

    return orderDetails.map((order, index) => `
${index + 1}. ${order.book?.title || 'Unknown Book'}
   Price: R${(order.book?.price || 0).toFixed(2)}
   Category: ${order.book?.category || 'N/A'}
   Condition: ${order.book?.condition || 'N/A'}
   Buyer: ${order.buyer?.name || 'Unknown'} (${order.buyer?.email || 'N/A'})
   Delivered: ${order.timeline?.delivered || 'Recently'}
   Seller Earnings: R${(order.amounts?.seller_earnings || 0).toFixed(2)}
`).join('\n');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Code className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold">Development Dashboard</h2>
          <p className="text-gray-600">Test and manage seller payout functions</p>
        </div>
      </div>

      {/* Development Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <AlertCircle className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Development Environment:</strong> This dashboard contains both production payout management and testing tools for the receipt creation function.
        </AlertDescription>
      </Alert>

      {/* Tabs for Production vs Testing */}
      <Tabs defaultValue="testing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Testing & Development
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Production Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6 mt-6">
          {/* Receipt Creation Testing */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Receipt Creation Function Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  This tests the <code>create-paystack-subaccount</code> edge function with real seller data and mock order information.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Select Real Seller for Testing:</label>
                  <select 
                    value={selectedTestSeller} 
                    onChange={(e) => setSelectedTestSeller(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose a seller...</option>
                    {availableSellers.map((seller) => (
                      <option key={seller.user_id} value={seller.user_id}>
                        {seller.business_name || seller.profiles?.name || 'Unknown'} - {seller.bank_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableSellers.length} real sellers with banking accounts found
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={testReceiptCreation}
                    disabled={isTestingRecipient || !selectedTestSeller}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isTestingRecipient ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Test Receipt Creation
                      </>
                    )}
                  </Button>
                  
                  {testRecipientData && (
                    <Button 
                      onClick={downloadTestReceipt}
                      variant="outline"
                      className="w-full border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Test Receipt
                    </Button>
                  )}
                </div>
              </div>

              {testRecipientData && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Test Results:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Status:</strong> {testRecipientData.success ? '✅ Success' : '❌ Failed'}<br/>
                      <strong>Message:</strong> {testRecipientData.message}<br/>
                      <strong>Recipient Code:</strong> {testRecipientData.recipient_code || 'N/A'}<br/>
                      <strong>Development Mode:</strong> {testRecipientData.development_mode ? 'Yes' : 'No'}
                    </div>
                    
                    {testRecipientData.seller_info && (
                      <div>
                        <strong>Seller:</strong> {testRecipientData.seller_info.name}<br/>
                        <strong>Bank:</strong> {testRecipientData.seller_info.bank_name}<br/>
                        <strong>Account:</strong> {testRecipientData.seller_info.account_number}
                      </div>
                    )}
                  </div>

                  {testRecipientData.payment_breakdown && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h5 className="font-medium text-gray-800 mb-2">Payment Breakdown (Mock Data):</h5>
                      <div className="text-sm space-y-1">
                        <div><strong>Total Orders:</strong> {testRecipientData.payment_breakdown.total_orders}</div>
                        <div><strong>Book Sales:</strong> R{(testRecipientData.payment_breakdown.total_book_sales || 0).toFixed(2)}</div>
                        <div><strong>Delivery Fees:</strong> R{(testRecipientData.payment_breakdown.total_delivery_fees || 0).toFixed(2)}</div>
                        <div><strong>Platform Earnings:</strong> R{(testRecipientData.payment_breakdown.platform_earnings?.total || 0).toFixed(2)}</div>
                        <div className="font-semibold text-green-600">
                          <strong>Seller Amount:</strong> R{(testRecipientData.payment_breakdown.seller_amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-6 mt-6">
          {/* Production Seller Payout Manager */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Production Environment:</strong> This is the actual seller payout management system. All actions here affect real data.
            </AlertDescription>
          </Alert>
          
          <SellerPayoutManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
