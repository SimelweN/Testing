import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { paystackTransferService, Bank, TransferRecipient, TransferRequest } from "@/services/paystackTransferService";
import { Loader2, CheckCircle, XCircle, Copy, TestTube } from "lucide-react";
import { toast } from "sonner";

export const PaystackTransferTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

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

  const handleRunAllTests = async () => {
    setLoading(true);
    try {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paystack Transfer & Payment Testing</h2>
          <p className="text-muted-foreground">Test Paystack transfer management and payment verification functions</p>
        </div>
        <Button onClick={handleRunAllTests} disabled={loading} className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
          Run All Tests
        </Button>
      </div>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payment">Payment Verification</TabsTrigger>
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="verify">Verify Account</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
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
      </Tabs>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
