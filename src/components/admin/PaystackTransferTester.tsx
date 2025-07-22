import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { paystackTransferService, Bank, TransferRecipient, TransferRequest } from "@/services/paystackTransferService";
import { Loader2, CheckCircle, XCircle, Copy, TestTube, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PaystackTransferTestHelper } from "@/utils/paystackTransferTestUtils";

export const PaystackTransferTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [realSubaccounts, setRealSubaccounts] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [realPaymentTransactions, setRealPaymentTransactions] = useState<any[]>([]);
  const [realSellers, setRealSellers] = useState<any[]>([]);
  const [availableSubaccounts, setAvailableSubaccounts] = useState<any[]>([]);

  // Form states
  const [verifyForm, setVerifyForm] = useState({
    account_number: "",
    bank_code: "",
  });

  const [recipientForm, setRecipientForm] = useState<TransferRecipient>({
    name: "",
    account_number: "",
    bank_code: "",
    description: "",
    email: "",
  });

  const [transferForm, setTransferForm] = useState<TransferRequest>({
    amount: 0,
    reference: `transfer_${Date.now()}`,
    recipient: "",
    reason: "",
  });

  const [paymentReference, setPaymentReference] = useState(`test_ref_${Date.now()}`);

  // Refund testing states
  const [refundForm, setRefundForm] = useState({
    transaction_reference: "",
    order_id: "",
    amount: "",
    reason: "Admin test refund"
  });

  const [refundTesting, setRefundTesting] = useState(false);
  const [refundResult, setRefundResult] = useState<any>(null);

  // Comprehensive testing states
  const [comprehensiveTesting, setComprehensiveTesting] = useState(false);
  const [comprehensiveResults, setComprehensiveResults] = useState<any>(null);

  // Subaccount creation states
  const [newSubaccount, setNewSubaccount] = useState({
    business_name: "",
    email: "",
    bank_code: "",
    account_number: "",
    percentage_charge: 2.5,
    description: ""
  });
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);

  // Payout testing states
  const [payoutForm, setPayoutForm] = useState({
    seller_id: "",
    amount: "",
    reason: "Test seller payout"
  });
  const [payoutTesting, setPayoutTesting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);

  const loadRealData = async () => {
    try {
      // Get real subaccounts from database
      const { data: subaccounts } = await supabase
        .from('banking_subaccounts')
        .select('*')
        .eq('is_active', true)
        .limit(10);

      if (subaccounts) {
        setRealSubaccounts(subaccounts);
        console.log(`Found ${subaccounts.length} real subaccounts`);
      }

      // Get real orders with payment data
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .not('payment_reference', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orders) {
        setRealOrders(orders);
        console.log(`Found ${orders.length} real orders`);
      }

      // Get real payment transactions
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactions) {
        setRealPaymentTransactions(transactions);
        console.log(`Found ${transactions.length} real payment transactions`);
      }

      // Get real sellers (users with subaccounts)
      const { data: sellers } = await supabase
        .from('profiles')
        .select('id, name, email, subaccount_code')
        .not('subaccount_code', 'is', null)
        .limit(10);

      if (sellers) {
        setRealSellers(sellers);
        setAvailableSubaccounts(sellers);
        console.log(`Found ${sellers.length} real sellers`);
      }

      toast.success('Real data loaded successfully');
    } catch (error) {
      console.error('Error loading real data:', error);
      toast.error('Failed to load real data');
    }
  };

  const handleRunAllTests = async () => {
    setLoading(true);
    try {
      // First load real data
      await loadRealData();

      const testResults = await paystackTransferService.testFunctions();
      setResults(testResults);
      toast.success("All tests completed successfully!");
    } catch (error) {
      toast.error(`Tests failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetBanks = async () => {
    setLoading(true);
    try {
      const banksData = await paystackTransferService.getBanks();
      setBanks(banksData);
      toast.success(`Found ${banksData.length} banks`);
    } catch (error) {
      toast.error(`Failed to fetch banks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!verifyForm.account_number || !verifyForm.bank_code) {
      toast.error("Please enter account number and bank code");
      return;
    }

    setLoading(true);
    try {
      const result = await paystackTransferService.verifyAccount(
        verifyForm.account_number,
        verifyForm.bank_code
      );
      setResults({ accountVerification: result });
      toast.success("Account verified successfully");
    } catch (error) {
      toast.error(`Account verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipient = async () => {
    if (!recipientForm.name || !recipientForm.account_number || !recipientForm.bank_code) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await paystackTransferService.createRecipient(recipientForm);
      setResults({ recipientCreation: result });
      toast.success("Recipient created successfully");
      // Refresh recipients list
      handleGetRecipients();
    } catch (error) {
      toast.error(`Failed to create recipient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestRefund = async () => {
    if (!refundForm.transaction_reference && !refundForm.order_id) {
      toast.error("Please provide either transaction reference or order ID");
      return;
    }

    setRefundTesting(true);
    setRefundResult(null);

    try {
      // Call refund management function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-refund-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'initiate_refund',
          transaction_reference: refundForm.transaction_reference,
          order_id: refundForm.order_id,
          refund_amount: refundForm.amount ? parseFloat(refundForm.amount) * 100 : undefined, // Convert to kobo
          refund_reason: refundForm.reason,
          admin_initiated: true
        }),
      });

      const result = await response.json();
      setRefundResult(result);

      if (result.success) {
        toast.success('Refund processed successfully');
      } else {
        toast.error(`Refund failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: 'REFUND_TEST_ERROR',
        message: error.message
      };
      setRefundResult(errorResult);
      toast.error(`Refund test failed: ${error.message}`);
    } finally {
      setRefundTesting(false);
    }
  };

  const handleTestRealTransfer = async () => {
    if (realSubaccounts.length === 0) {
      await loadRealData();
    }

    if (realSubaccounts.length === 0) {
      toast.error('No real subaccounts found. Please create some subaccounts first.');
      return;
    }

    const testSubaccount = realSubaccounts[0];

    // Use real banking details for transfer test
    setTransferForm({
      amount: 10, // R10 test amount
      reference: `transfer_test_${Date.now()}`,
      recipient: testSubaccount.recipient_code || 'test_recipient',
      reason: `Test transfer to ${testSubaccount.business_name || 'Test Business'}`
    });

    toast.success(`Using real subaccount: ${testSubaccount.business_name}`);
  };

  const handleComprehensiveTest = async () => {
    setComprehensiveTesting(true);
    setComprehensiveResults(null);

    try {
      toast.info('Starting comprehensive test suite with real data...');
      const results = await PaystackTransferTestHelper.runComprehensiveTests();
      setComprehensiveResults(results);

      const { summary } = results;
      if (summary.success_rate >= 80) {
        toast.success(`Comprehensive tests completed! ${summary.passed}/${summary.total_tests} passed (${summary.success_rate.toFixed(1)}%)`);
      } else {
        toast.warning(`Tests completed with issues: ${summary.passed}/${summary.total_tests} passed (${summary.success_rate.toFixed(1)}%)`);
      }
    } catch (error) {
      toast.error(`Comprehensive test failed: ${error.message}`);
      setComprehensiveResults({
        error: error.message,
        summary: { total_tests: 0, passed: 0, failed: 1, success_rate: 0 }
      });
    } finally {
      setComprehensiveTesting(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!newSubaccount.business_name || !newSubaccount.email || !newSubaccount.bank_code || !newSubaccount.account_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingSubaccount(true);
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-paystack-subaccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(newSubaccount)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Subaccount created successfully!');
        setResults({ subaccountCreation: result });
        // Reset form
        setNewSubaccount({
          business_name: "",
          email: "",
          bank_code: "",
          account_number: "",
          percentage_charge: 2.5,
          description: ""
        });
        // Reload data
        await loadRealData();
      } else {
        toast.error(`Failed to create subaccount: ${result.error || 'Unknown error'}`);
        setResults({ subaccountCreation: result });
      }
    } catch (error) {
      toast.error(`Subaccount creation failed: ${error.message}`);
    } finally {
      setCreatingSubaccount(false);
    }
  };

  const handleTestPayout = async () => {
    if (!payoutForm.seller_id || !payoutForm.amount) {
      toast.error("Please select seller and enter amount");
      return;
    }

    setPayoutTesting(true);
    setPayoutResult(null);

    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/pay-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          seller_id: payoutForm.seller_id,
          amount: parseFloat(payoutForm.amount),
          reason: payoutForm.reason,
          trigger: 'admin_test'
        })
      });

      const result = await response.json();
      setPayoutResult(result);

      if (result.success) {
        toast.success('Payout test completed successfully');
      } else {
        toast.error(`Payout test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: 'PAYOUT_TEST_ERROR',
        message: error.message
      };
      setPayoutResult(errorResult);
      toast.error(`Payout test failed: ${error.message}`);
    } finally {
      setPayoutTesting(false);
    }
  };

  const handleGetRecipients = async () => {
    setLoading(true);
    try {
      const recipientsData = await paystackTransferService.getRecipients();
      setRecipients(recipientsData);
      toast.success(`Found ${recipientsData.length} recipients`);
    } catch (error) {
      toast.error(`Failed to fetch recipients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!transferForm.amount || !transferForm.recipient || !transferForm.reason) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await paystackTransferService.initiateTransfer(transferForm);
      setResults({ transferInitiation: result });
      toast.success("Transfer initiated successfully");
      // Refresh transfers list
      handleGetTransfers();
    } catch (error) {
      toast.error(`Failed to initiate transfer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTransfers = async () => {
    setLoading(true);
    try {
      const transfersData = await paystackTransferService.getTransfers();
      setTransfers(transfersData);
      toast.success(`Found ${transfersData.length} transfers`);
    } catch (error) {
      toast.error(`Failed to fetch transfers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentReference) {
      toast.error("Please enter payment reference");
      return;
    }

    setLoading(true);
    try {
      const result = await paystackTransferService.verifyPayment(paymentReference);
      setResults({ paymentVerification: result });
      toast.success("Payment verification completed");
    } catch (error) {
      toast.error(`Payment verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Auto-load data on component mount
  useEffect(() => {
    loadRealData();
    handleGetBanks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paystack Transfer & Payment Testing</h2>
          <p className="text-muted-foreground">Test Paystack transfer management and payment verification functions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunAllTests} disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
            Basic Tests
          </Button>
          <Button
            onClick={handleComprehensiveTest}
            disabled={comprehensiveTesting}
            variant="outline"
            className="flex items-center gap-2"
          >
            {comprehensiveTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Comprehensive Real Data Tests
          </Button>
        </div>
      </div>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payment">Payment Verification</TabsTrigger>
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="verify">Verify Account</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="subaccounts">Create Subaccount</TabsTrigger>
          <TabsTrigger value="payouts">Test Payouts</TabsTrigger>
          <TabsTrigger value="real-data">Real Data</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference</Label>
                <div className="flex space-x-2">
                  <Input
                    id="payment-reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter payment reference"
                  />
                  <Button onClick={() => setPaymentReference(`test_ref_${Date.now()}`)}>
                    Generate Test Ref
                  </Button>
                </div>
              </div>
              <Button onClick={handleVerifyPayment} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify Payment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Banks
                <Button onClick={handleGetBanks} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Fetch Banks
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {banks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banks.slice(0, 12).map((bank) => (
                    <div key={bank.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{bank.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Code: {bank.code}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(bank.code)}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant={bank.active ? "default" : "secondary"}>
                        {bank.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No banks loaded. Click "Fetch Banks" to load banks.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Bank Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    value={verifyForm.account_number}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-code">Bank Code</Label>
                  <Select onValueChange={(value) => setVerifyForm(prev => ({ ...prev, bank_code: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.code}>
                          {bank.name} ({bank.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleVerifyAccount} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Transfer Recipients
                <Button onClick={handleGetRecipients} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Fetch Recipients
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length > 0 ? (
                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {recipient.details?.account_number} - {recipient.details?.bank_name}
                      </div>
                      <Badge variant="outline">{recipient.recipient_code}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recipients found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Transfers
                <Button onClick={handleGetTransfers} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Fetch Transfers
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transfers.length > 0 ? (
                <div className="space-y-2">
                  {transfers.map((transfer, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">R{(transfer.amount / 100).toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{transfer.reason}</div>
                        </div>
                        <Badge variant={transfer.status === "success" ? "default" : "secondary"}>
                          {transfer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transfers found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refund-reference">Transaction Reference</Label>
                  <Input
                    id="refund-reference"
                    value={refundForm.transaction_reference}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, transaction_reference: e.target.value }))}
                    placeholder="TXN_123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-order-id">Order ID (alternative)</Label>
                  <Select onValueChange={(value) => setRefundForm(prev => ({ ...prev, order_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select real order" />
                    </SelectTrigger>
                    <SelectContent>
                      {realOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.id} - R{order.total_amount} ({order.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Amount (Optional - leave blank for full refund)</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Leave blank for full refund"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-reason">Reason</Label>
                  <Input
                    id="refund-reason"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for refund"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleTestRefund} disabled={refundTesting}>
                  {refundTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test Refund
                </Button>
                <Button variant="outline" onClick={() => {
                  if (realPaymentTransactions.length > 0) {
                    setRefundForm(prev => ({
                      ...prev,
                      transaction_reference: realPaymentTransactions[0].reference
                    }));
                    toast.success('Used real transaction reference');
                  } else {
                    toast.error('No real transactions found');
                  }
                }}>
                  Use Real Transaction
                </Button>
              </div>
              {refundResult && (
                <div className="mt-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {refundResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={refundResult.success ? "text-green-700" : "text-red-700"}>
                      {refundResult.success ? "Refund Successful" : "Refund Failed"}
                    </span>
                  </div>
                  <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(refundResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subaccounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Subaccount</CardTitle>
              <CardDescription>
                Create a new Paystack subaccount for seller payouts. This will be linked to a seller's profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={newSubaccount.business_name}
                    onChange={(e) => setNewSubaccount(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="John's Textbook Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subaccount-email">Email *</Label>
                  <Input
                    id="subaccount-email"
                    type="email"
                    value={newSubaccount.email}
                    onChange={(e) => setNewSubaccount(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seller@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subaccount-bank">Bank *</Label>
                  <Select onValueChange={(value) => {
                    const selectedBank = banks.find(b => b.code === value);
                    setNewSubaccount(prev => ({
                      ...prev,
                      bank_code: value,
                      // Auto-fill test data for common SA banks
                      ...(value === '058' && {
                        account_number: '0123456789'
                      }),
                      ...(value === '011' && {
                        account_number: '1234567890'
                      })
                    }));
                    if (selectedBank) {
                      toast.success(`Selected ${selectedBank.name}`);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.code}>
                          {bank.name} ({bank.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subaccount-account-number">Account Number *</Label>
                  <Input
                    id="subaccount-account-number"
                    value={newSubaccount.account_number}
                    onChange={(e) => setNewSubaccount(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percentage-charge">Percentage Charge (%)</Label>
                  <Input
                    id="percentage-charge"
                    type="number"
                    step="0.1"
                    value={newSubaccount.percentage_charge}
                    onChange={(e) => setNewSubaccount(prev => ({ ...prev, percentage_charge: parseFloat(e.target.value) || 2.5 }))}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subaccount-description">Description</Label>
                  <Input
                    id="subaccount-description"
                    value={newSubaccount.description}
                    onChange={(e) => setNewSubaccount(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Subaccount for seller payouts"
                  />
                </div>
              </div>

              <Button onClick={handleCreateSubaccount} disabled={creatingSubaccount} className="w-full">
                {creatingSubaccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Subaccount
              </Button>

              {banks.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  💡 No banks loaded. The banks will be fetched automatically when the component loads.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Seller Payouts</CardTitle>
              <CardDescription>
                Test payout functionality using real seller data from your database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payout-seller">Select Seller *</Label>
                  <Select onValueChange={(value) => setPayoutForm(prev => ({ ...prev, seller_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a real seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {realSellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.name || seller.email} ({seller.subaccount_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-amount">Amount (ZAR) *</Label>
                  <Input
                    id="payout-amount"
                    type="number"
                    step="0.01"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout-reason">Reason</Label>
                <Input
                  id="payout-reason"
                  value={payoutForm.reason}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Test seller payout"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleTestPayout} disabled={payoutTesting}>
                  {payoutTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test Payout
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (realSellers.length > 0) {
                      setPayoutForm(prev => ({
                        ...prev,
                        seller_id: realSellers[0].id,
                        amount: "25.00",
                        reason: `Test payout to ${realSellers[0].name || realSellers[0].email}`
                      }));
                      toast.success('Auto-filled with first seller');
                    } else {
                      toast.error('No sellers available');
                    }
                  }}
                >
                  Auto-fill First Seller
                </Button>
              </div>

              {realSellers.length === 0 && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  ⚠️ No sellers with subaccounts found. Create some subaccounts first or check the "Real Data" tab.
                </div>
              )}

              {payoutResult && (
                <div className="mt-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {payoutResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={payoutResult.success ? "text-green-700" : "text-red-700"}>
                      {payoutResult.success ? "Payout Successful" : "Payout Failed"}
                    </span>
                  </div>
                  <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(payoutResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="real-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Real Database Data
                <Button onClick={loadRealData} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Refresh Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Real Subaccounts ({realSubaccounts.length})</h3>
                {realSubaccounts.length > 0 ? (
                  <div className="space-y-2">
                    {realSubaccounts.map((subaccount) => (
                      <div key={subaccount.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{subaccount.business_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {subaccount.subaccount_code}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransferForm(prev => ({
                                ...prev,
                                recipient: subaccount.subaccount_code,
                                reason: `Transfer to ${subaccount.business_name}`
                              }));
                              toast.success('Subaccount selected for transfer');
                            }}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <Badge variant={subaccount.is_active ? "default" : "secondary"}>
                          {subaccount.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No real subaccounts found.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Real Sellers ({realSellers.length})</h3>
                {realSellers.length > 0 ? (
                  <div className="space-y-2">
                    {realSellers.map((seller) => (
                      <div key={seller.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{seller.name || seller.email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {seller.id.slice(0, 8)}... | Subaccount: {seller.subaccount_code}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPayoutForm(prev => ({
                              ...prev,
                              seller_id: seller.id,
                              reason: `Test payout to ${seller.name || seller.email}`
                            }));
                            toast.success('Seller selected for payout test');
                          }}
                        >
                          Use for Payout Test
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sellers with subaccounts found.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Real Orders ({realOrders.length})</h3>
                {realOrders.length > 0 ? (
                  <div className="space-y-2">
                    {realOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">R{order.total_amount}</div>
                            <div className="text-sm text-muted-foreground">
                              Ref: {order.payment_reference}
                            </div>
                          </div>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No real orders found.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Real Payment Transactions ({realPaymentTransactions.length})</h3>
                {realPaymentTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {realPaymentTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">R{(transaction.amount / 100).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              Ref: {transaction.reference}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPaymentReference(transaction.reference);
                              setRefundForm(prev => ({
                                ...prev,
                                transaction_reference: transaction.reference
                              }));
                              toast.success('Transaction reference copied');
                            }}
                          >
                            Use for Test
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No real payment transactions found.</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Quick Actions</h3>
                <div className="flex space-x-2 flex-wrap gap-2">
                  <Button onClick={handleTestRealTransfer} size="sm">
                    Setup Real Transfer Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (realPaymentTransactions.length > 0) {
                        setPaymentReference(realPaymentTransactions[0].reference);
                        toast.success('Real payment reference selected');
                      }
                    }}
                  >
                    Use Real Payment Ref
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (realSellers.length > 0) {
                        setPayoutForm(prev => ({
                          ...prev,
                          seller_id: realSellers[0].id,
                          amount: "50.00"
                        }));
                        toast.success('Real seller selected for payout');
                      }
                    }}
                  >
                    Use Real Seller
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {comprehensiveResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Comprehensive Test Results
              <Badge variant={comprehensiveResults.summary?.success_rate >= 80 ? "default" : "destructive"}>
                {comprehensiveResults.summary?.success_rate?.toFixed(1)}% Success Rate
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {comprehensiveResults.summary && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{comprehensiveResults.summary.total_tests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{comprehensiveResults.summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{comprehensiveResults.summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{comprehensiveResults.summary.success_rate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            )}

            {/* Test Categories */}
            <Tabs defaultValue="recipients" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
                <TabsTrigger value="transfers">Transfers</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
                <TabsTrigger value="data">Test Data</TabsTrigger>
              </TabsList>

              <TabsContent value="recipients" className="space-y-2">
                <h3 className="font-semibold">Recipient Creation Tests</h3>
                {comprehensiveResults.recipientTests?.map((test: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{test.recipient}</div>
                      {test.error && <div className="text-sm text-red-600">{test.error}</div>}
                    </div>
                    {test.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="transfers" className="space-y-2">
                <h3 className="font-semibold">Transfer Tests</h3>
                {comprehensiveResults.transferTests?.map((test: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{test.scenario}</div>
                      <div className="text-sm text-muted-foreground">
                        Expected: {test.expected} | Actual: {test.success ? 'success' : 'failure'}
                      </div>
                      {test.error && <div className="text-sm text-red-600">{test.error}</div>}
                    </div>
                    {test.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="refunds" className="space-y-2">
                <h3 className="font-semibold">Refund Tests</h3>
                {comprehensiveResults.refundTests?.map((test: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{test.scenario}</div>
                      <div className="text-sm text-muted-foreground">
                        Amount: R{((test.refund_amount || test.order_amount * 100) / 100).toFixed(2)}
                      </div>
                      {test.error && <div className="text-sm text-red-600">{test.error}</div>}
                    </div>
                    {test.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="data" className="space-y-2">
                <h3 className="font-semibold">Test Data Overview</h3>
                {comprehensiveResults.testData && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Real Subaccounts</div>
                      <div className="text-2xl">{comprehensiveResults.testData.real_subaccounts?.length || 0}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Real Orders</div>
                      <div className="text-2xl">{comprehensiveResults.testData.real_orders?.length || 0}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Real Transactions</div>
                      <div className="text-2xl">{comprehensiveResults.testData.real_transactions?.length || 0}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Test Recipients</div>
                      <div className="text-2xl">{comprehensiveResults.testData.test_recipients?.length || 0}</div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
