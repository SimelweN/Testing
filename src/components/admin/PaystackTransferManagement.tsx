import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Send,
  Trash2,
  DollarSign,
  Users,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  TestTube,
  Banknote,
  Building,
  User,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import TransferTester from "./TransferTester";

interface TransferRecipient {
  recipient_code: string;
  name: string;
  type: string;
  currency: string;
  account_number: string;
  account_name?: string;
  bank_code: string;
  bank_name?: string;
  active: boolean;
  created_at: string;
}

interface Transfer {
  transfer_code: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  recipient_code: string;
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const PaystackTransferManagement = () => {
  const [recipients, setRecipients] = useState<TransferRecipient[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([
    { id: 1, name: "Access Bank", code: "044", longcode: "044150149", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 2, name: "GTBank", code: "058", longcode: "058152036", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 3, name: "First Bank", code: "011", longcode: "011151003", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 4, name: "Zenith Bank", code: "057", longcode: "057150013", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 5, name: "UBA", code: "033", longcode: "033153513", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 6, name: "Fidelity Bank", code: "070", longcode: "070150003", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" },
    { id: 7, name: "FCMB", code: "214", longcode: "214150018", gateway: "test", pay_with_bank: true, active: true, country: "NG", currency: "NGN", type: "nuban", is_deleted: false, createdAt: "", updatedAt: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  // Create recipient form state
  const [recipientForm, setRecipientForm] = useState({
    name: "",
    account_number: "",
    bank_code: "",
    currency: "NGN",
    type: "nuban",
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    recipient_code: "",
    amount: 0,
    reason: "",
    reference: "",
  });

  // Account verification
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRecipients(), loadTransfers(), loadBanks()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load transfer data");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=recipients`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setRecipients(result.data);
        } else {
          console.warn("Unexpected recipients response format:", result);
          setRecipients([]);
        }
      } else {
        const errorResult = await response.json().catch(() => null);
        console.error("Failed to load recipients:", errorResult);
      }
    } catch (error) {
      console.error("Error loading recipients:", error);
    }
  };

  const loadTransfers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=transfers`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setTransfers(result.data);
        } else {
          console.warn("Unexpected transfers response format:", result);
          setTransfers([]);
        }
      } else {
        const errorResult = await response.json().catch(() => null);
        console.error("Failed to load transfers:", errorResult);
      }
    } catch (error) {
      console.error("Error loading transfers:", error);
    }
  };

  const loadBanks = async () => {
    setBanksError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=banks&country=south-africa&currency=ZAR`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setBanks(result.data);
          if (result.data.length === 0) {
            setBanksError("No banks available for the selected country/currency");
          }
        } else {
          console.warn("Unexpected banks response format:", result);
          setBanks([]);
          setBanksError(result.details?.message || "Failed to load banks data");
        }
      } else {
        const errorResult = await response.json().catch(() => null);
        console.error("Failed to load banks:", errorResult);
        setBanksError(
          errorResult?.error === "PAYSTACK_NOT_CONFIGURED"
            ? "⚠️ Paystack integration is not configured. The PAYSTACK_SECRET_KEY environment variable needs to be set in the Supabase Edge Functions. Please contact your administrator to configure this."
            : errorResult?.details?.message || "Failed to load banks. Please try again."
        );
      }
    } catch (error) {
      console.error("Error loading banks:", error);
      setBanksError("Network error loading banks. Please check your connection.");
    }
  };

  const verifyAccount = async () => {
    if (!recipientForm.account_number || !recipientForm.bank_code) {
      toast.error("Please provide account number and bank code");
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=verify-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_number: recipientForm.account_number,
            bank_code: recipientForm.bank_code,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setVerificationResult(result.data);
        setRecipientForm((prev) => ({
          ...prev,
          name: result.data.account_name || prev.name,
        }));
        toast.success(`Account verified: ${result.data.account_name}`);
      } else {
        toast.error(result.details?.message || "Account verification failed");
        setVerificationResult({
          error: result.details?.message || "Verification failed",
        });
      }
    } catch (error) {
      console.error("Error verifying account:", error);
      toast.error("Error verifying account");
    } finally {
      setVerifying(false);
    }
  };

  const createRecipient = async () => {
    if (
      !recipientForm.name.trim() ||
      !recipientForm.account_number ||
      !recipientForm.bank_code
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=create-recipient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recipientForm),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Recipient created: ${result.recipient_code}`);
        setRecipientForm({
          name: "",
          account_number: "",
          bank_code: "",
          currency: "NGN",
          type: "nuban",
        });
        setVerificationResult(null);
        loadRecipients(); // Reload recipients
      } else {
        toast.error(result.details?.message || "Failed to create recipient");
      }
    } catch (error) {
      console.error("Error creating recipient:", error);
      toast.error("Error creating recipient");
    } finally {
      setCreating(false);
    }
  };

  const initiateTransfer = async () => {
    if (
      !transferForm.recipient_code ||
      !transferForm.amount ||
      !transferForm.reason
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (transferForm.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setTransferring(true);
    try {
      const reference =
        transferForm.reference ||
        `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=initiate-transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: transferForm.recipient_code,
            amount: Math.round(transferForm.amount * 100), // Convert to kobo
            reference,
            reason: transferForm.reason,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Transfer initiated: ${result.transfer_code}`);
        setTransferForm({
          recipient_code: "",
          amount: 0,
          reason: "",
          reference: "",
        });
        loadTransfers(); // Reload transfers
      } else {
        toast.error(result.details?.message || "Failed to initiate transfer");
      }
    } catch (error) {
      console.error("Error initiating transfer:", error);
      toast.error("Error initiating transfer");
    } finally {
      setTransferring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBankName = (bankCode: string) => {
    const bank = banks.find((b) => b.code === bankCode);
    return bank?.name || bankCode;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Paystack Transfer Management
          </h2>
          <p className="text-muted-foreground">
            Manage transfer recipients and send money transfers
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="recipients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipients">
            <Users className="h-4 w-4 mr-2" />
            Recipients ({recipients.length})
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Transfers ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="create-recipient">
            <Plus className="h-4 w-4 mr-2" />
            Create Recipient
          </TabsTrigger>
          <TabsTrigger value="send-transfer">
            <Send className="h-4 w-4 mr-2" />
            Send Transfer
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Test Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Transfer Recipients ({recipients.length})
              </CardTitle>
              <CardDescription>
                Manage bank account recipients for transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading recipients...</span>
                </div>
              ) : recipients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No transfer recipients found</p>
                  <p className="text-sm text-gray-500">
                    Create your first recipient using the "Create Recipient" tab
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.recipient_code}>
                        <TableCell className="font-medium">
                          {recipient.name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">
                              {recipient.account_number}
                            </div>
                            {recipient.account_name && (
                              <div className="text-xs text-gray-500">
                                {recipient.account_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {recipient.bank_name ||
                            getBankName(recipient.bank_code)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{recipient.type}</Badge>
                        </TableCell>
                        <TableCell>{recipient.currency}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              recipient.active ? "default" : "destructive"
                            }
                          >
                            {recipient.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(recipient.recipient_code)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTransferForm((prev) => ({
                                  ...prev,
                                  recipient_code: recipient.recipient_code,
                                }))
                              }
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Transfers ({transfers.length})
              </CardTitle>
              <CardDescription>View and track money transfers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading transfers...</span>
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowUpRight className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No transfers found</p>
                  <p className="text-sm text-gray-500">
                    Send your first transfer using the "Send Transfer" tab
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.transfer_code}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {transfer.reference}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {(transfer.amount / 100).toFixed(2)}{" "}
                            {transfer.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {transfer.recipient_code}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transfer.reason}
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(transfer.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transfer.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(transfer.transfer_code)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {transfer.status === "failed" &&
                              transfer.failure_reason && (
                                <div className="flex items-center text-red-600">
                                  <AlertCircle className="h-3 w-3" />
                                </div>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-recipient" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Transfer Recipient
              </CardTitle>
              <CardDescription>
                Add a new bank account recipient for transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient-name">Recipient Name</Label>
                  <Input
                    id="recipient-name"
                    value={recipientForm.name}
                    onChange={(e) =>
                      setRecipientForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    value={recipientForm.account_number}
                    onChange={(e) =>
                      setRecipientForm((prev) => ({
                        ...prev,
                        account_number: e.target.value,
                      }))
                    }
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-code">Bank</Label>
                  <Select
                    value={recipientForm.bank_code}
                    onValueChange={(value) =>
                      setRecipientForm((prev) => ({
                        ...prev,
                        bank_code: value,
                      }))
                    }
                    disabled={loading || banks.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading banks..." : banks.length === 0 ? "No banks available" : "Select bank"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {banksError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                          <p className="font-medium mb-1">Banks not available</p>
                          <p>{banksError}</p>
                          {banksError.includes("PAYSTACK_SECRET_KEY") && (
                            <div className="mt-2 text-xs text-red-600">
                              <p><strong>For developers:</strong> Set the PAYSTACK_SECRET_KEY in your Supabase project settings under Edge Functions environment variables.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {banks.length === 0 && !loading && !banksError && (
                    <p className="text-sm text-gray-500 mt-1">
                      No banks loaded. Please refresh the page or contact support.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={recipientForm.currency}
                    onValueChange={(value) =>
                      setRecipientForm((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                      <SelectItem value="ZAR">
                        ZAR (South African Rand)
                      </SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Account Verification */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Account Verification</h4>
                  <Button
                    onClick={verifyAccount}
                    disabled={
                      verifying ||
                      !recipientForm.account_number ||
                      !recipientForm.bank_code
                    }
                    variant="outline"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Account
                      </>
                    )}
                  </Button>
                </div>

                {verificationResult && (
                  <div
                    className={`p-3 rounded-md ${
                      verificationResult.error
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    {verificationResult.error ? (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-4 w-4" />
                        <span>
                          Verification failed: {verificationResult.error}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Account verified: {verificationResult.account_name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Button
                  onClick={createRecipient}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Recipient...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Recipient
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send-transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Transfer
              </CardTitle>
              <CardDescription>
                Send money to a transfer recipient
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transfer-recipient">Recipient</Label>
                  <Select
                    value={transferForm.recipient_code}
                    onValueChange={(value) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        recipient_code: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients
                        .filter((r) => r.active)
                        .map((recipient) => (
                          <SelectItem
                            key={recipient.recipient_code}
                            value={recipient.recipient_code}
                          >
                            {recipient.name} - {recipient.account_number}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transfer-amount">Amount (NGN)</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={transferForm.amount}
                    onChange={(e) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        amount: Number(e.target.value),
                      }))
                    }
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="transfer-reason">Reason</Label>
                <Textarea
                  id="transfer-reason"
                  value={transferForm.reason}
                  onChange={(e) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Payment for services rendered"
                />
              </div>

              <div>
                <Label htmlFor="transfer-reference">Reference (Optional)</Label>
                <Input
                  id="transfer-reference"
                  value={transferForm.reference}
                  onChange={(e) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      reference: e.target.value,
                    }))
                  }
                  placeholder="Auto-generated if empty"
                />
              </div>

              {/* Transfer Summary */}
              {transferForm.recipient_code && transferForm.amount > 0 && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Transfer Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">
                        ₦{transferForm.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recipient:</span>
                      <span className="font-medium">
                        {
                          recipients.find(
                            (r) =>
                              r.recipient_code === transferForm.recipient_code,
                          )?.name
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-medium">
                        ~R{(transferForm.amount * 0.005).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  onClick={initiateTransfer}
                  disabled={
                    transferring ||
                    !transferForm.recipient_code ||
                    !transferForm.amount ||
                    !transferForm.reason
                  }
                  className="w-full"
                >
                  {transferring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initiating Transfer...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Transfer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <TransferTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaystackTransferManagement;
