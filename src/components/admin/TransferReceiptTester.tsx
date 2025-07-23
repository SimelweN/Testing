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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Database,
  PlayCircle,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TransferReceiptTester: React.FC = () => {
  // Seller payout testing state
  const [payoutRecipientData, setPayoutRecipientData] = useState<any>(null);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [availableSellers, setAvailableSellers] = useState<any[]>([]);
  const [selectedTestSeller, setSelectedTestSeller] = useState<string>('');

  useEffect(() => {
    loadAvailableSellers();
    checkEdgeFunctionAvailability();
  }, []);

  const checkEdgeFunctionAvailability = async () => {
    try {
      // Try a simple test call to see if edge functions are working
      const { error } = await supabase.functions.invoke('create-paystack-subaccount', {
        method: 'POST',
        body: { sellerId: 'test' }
      });

      if (error && error.message?.includes('not found')) {
        toast.warning('Edge function create-paystack-subaccount not found or not deployed');
      }
    } catch (error) {
      console.log('Edge function check:', error);
    }
  };

  const loadAvailableSellers = async () => {
    try {
      // First, try the banking_subaccounts table
      let { data: sellers, error } = await supabase
        .from('banking_subaccounts')
        .select(`
          user_id,
          business_name,
          email,
          bank_name,
          account_number,
          status
        `)
        .eq('status', 'active')
        .limit(10);

      if (error) {
        console.error('Error loading from banking_subaccounts:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check if table doesn't exist, try fallback
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Banking subaccounts table not found, trying profiles table...');

          // Fallback to profiles table for testing
          const { data: profileSellers, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .limit(5);

          if (profileError) {
            toast.error('No seller data available for testing');
            return;
          }

          // Create mock sellers from profiles
          const mockSellers = (profileSellers || []).map(profile => ({
            user_id: profile.id,
            business_name: profile.name || 'Test Seller',
            email: profile.email,
            bank_name: 'Test Bank',
            account_number: '****1234',
            status: 'active'
          }));

          setAvailableSellers(mockSellers);
          if (mockSellers.length > 0) {
            setSelectedTestSeller(mockSellers[0].user_id);
          }
          toast.warning('Using mock seller data for testing (banking_subaccounts table not found)');
          return;
        }

        toast.error(`Failed to load sellers: ${error.message}`);
        return;
      }

      console.log('Available sellers for testing:', sellers);
      setAvailableSellers(sellers || []);

      // Auto-select first seller
      if (sellers && sellers.length > 0) {
        setSelectedTestSeller(sellers[0].user_id);
        toast.success(`Found ${sellers.length} sellers with banking accounts`);
      } else {
        toast.warning('No active sellers with banking accounts found');
      }
    } catch (error) {
      console.error('Exception loading sellers:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        fullError: error
      });
      toast.error('Failed to load sellers. Check console for details.');
    }
  };

  const createPaystackRecipient = async () => {
    if (!selectedTestSeller) {
      toast.error('Please select a seller to test');
      return;
    }

    setIsCreatingRecipient(true);
    setPayoutRecipientData(null);

    try {
      toast.info('Creating Paystack recipient for seller payout...');
      console.log('Creating recipient for seller ID:', selectedTestSeller);

      // Call the edge function directly - this creates a recipient, NOT a transfer
      const { data, error } = await supabase.functions.invoke('create-paystack-subaccount', {
        method: 'POST',
        body: { sellerId: selectedTestSeller }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error details:', {
          message: error.message,
          context: error.context,
          details: error.details
        });
        throw new Error(`Function error: ${error.message || 'Unknown edge function error'}`);
      }

      setPayoutRecipientData(data);
      toast.success('Paystack recipient created successfully! Ready for manual payment.');
      console.log('Recipient created with data:', data);

    } catch (error) {
      console.error('Error creating Paystack recipient:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        fullError: error
      });

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(`Recipient creation failed: ${errorMessage}`);
    } finally {
      setIsCreatingRecipient(false);
    }
  };

  const downloadRecipientDetails = () => {
    if (!payoutRecipientData) return;

    const recipientText = formatRecipientDetailsText(payoutRecipientData);
    const blob = new Blob([recipientText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paystack-recipient-${selectedTestSeller}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Recipient details downloaded!');
  };

  const formatRecipientDetailsText = (data: any): string => {
    const date = new Date().toLocaleString();
    const breakdown = data.payment_breakdown || {};
    const sellerInfo = data.seller_info || {};

    return `
PAYSTACK RECIPIENT CREATED - REBOOKED SOLUTIONS
===============================================

Created Date: ${date}
Mode: ${data.development_mode ? 'Development' : 'Production'}
Seller ID: ${selectedTestSeller}

SELLER INFORMATION
------------------
Name: ${sellerInfo.name || 'Unknown'}
Email: ${sellerInfo.email || 'Unknown'}
Account: ${sellerInfo.account_number || 'N/A'}
Bank: ${sellerInfo.bank_name || 'N/A'}

PAYSTACK RECIPIENT DETAILS
--------------------------
Recipient Code: ${data.recipient_code || 'N/A'}
Status: ${data.success ? 'Created Successfully' : 'Failed'}
Message: ${data.message || 'N/A'}
Already Existed: ${data.already_existed ? 'Yes' : 'No'}

PAYMENT BREAKDOWN (MOCK DATA FOR REFERENCE)
-------------------------------------------
Total Orders: ${breakdown.total_orders || 0}
Total Book Sales: R${(breakdown.total_book_sales || 0).toFixed(2)}
Total Delivery Fees: R${(breakdown.total_delivery_fees || 0).toFixed(2)}

Platform Commission (${breakdown.commission_structure?.book_commission_rate || '10%'}): R${(breakdown.platform_earnings?.book_commission || 0).toFixed(2)}
Platform Delivery Fees: R${(breakdown.platform_earnings?.delivery_fees || 0).toFixed(2)}
Total Platform Earnings: R${(breakdown.platform_earnings?.total || 0).toFixed(2)}

AMOUNT READY FOR PAYOUT: R${(breakdown.seller_amount || 0).toFixed(2)}

ORDER DETAILS (MOCK DATA FOR REFERENCE)
---------------------------------------
${formatTestOrderDetails(breakdown.order_details || [])}

NEXT STEPS
----------
${data.instructions || 'Recipient created successfully. You can now manually process payment using this recipient code.'}

IMPORTANT: This function creates the Paystack recipient only - NO TRANSFER IS INITIATED.
You must manually process the payment using the recipient code above.

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold">Paystack Recipient Creator</h3>
            <p className="text-gray-600">Create Paystack recipients for seller payouts (NO TRANSFERS INITIATED)</p>
          </div>
        </div>
      </div>

      {/* Real Seller Payout Testing */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Paystack Recipient Creation: create-paystack-subaccount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This function creates Paystack recipients for seller payouts with real seller data and payment breakdown details.
              <strong>IMPORTANT: This does NOT initiate any transfers - it only creates the recipient for manual processing.</strong>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Select Real Seller for Testing:</Label>
              <Select value={selectedTestSeller} onValueChange={setSelectedTestSeller}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a seller..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSellers.map((seller) => (
                    <SelectItem key={seller.user_id} value={seller.user_id}>
                      {seller.business_name || seller.profiles?.name || 'Unknown'} - {seller.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    Testing Edge Function...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
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
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {testRecipientData.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                Edge Function Test Results:
              </h4>
              
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

                  {testRecipientData.payment_breakdown.order_details && testRecipientData.payment_breakdown.order_details.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h6 className="font-medium text-gray-700 mb-2">Mock Order Details:</h6>
                      <div className="space-y-2">
                        {testRecipientData.payment_breakdown.order_details.map((order: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            <strong>{order.book?.title}</strong> - R{(order.book?.price || 0).toFixed(2)}<br/>
                            Buyer: {order.buyer?.name} ({order.buyer?.email})<br/>
                            Seller Earnings: R{(order.amounts?.seller_earnings || 0).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
