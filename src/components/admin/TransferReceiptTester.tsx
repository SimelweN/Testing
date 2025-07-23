import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CreditCard,
  Building2,
  Receipt,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  UserPlus,
  Database,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
}

interface TransferReceipt {
  id: string;
  recipientName: string;
  recipientBank: BankDetails;
  amount: number;
  reference: string;
  transferDate: string;
  status: "pending" | "completed" | "failed";
  description: string;
  transferType: "seller_payout" | "refund" | "commission" | "test";
}

const SOUTH_AFRICAN_BANKS = [
  { name: "Absa Bank", code: "632005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "First National Bank (FNB)", code: "250655" },
  { name: "Nedbank", code: "198765" },
  { name: "Standard Bank", code: "051001" },
  { name: "TymeBank", code: "678910" },
  { name: "African Bank", code: "430000" },
  { name: "Discovery Bank", code: "679000" },
  { name: "Investec Bank", code: "580105" },
];

export const TransferReceiptTester: React.FC = () => {
  const [receipts, setReceipts] = useState<TransferReceipt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    recipientName: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    amount: "",
    reference: "",
    description: "",
    transferType: "test" as TransferReceipt["transferType"],
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name is required";
    }

    if (!formData.bankName) {
      newErrors.bankName = "Bank selection is required";
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d{8,12}$/.test(formData.accountNumber.replace(/\s/g, ""))) {
      newErrors.accountNumber = "Account number must be 8-12 digits";
    }

    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = "Account holder name is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.reference.trim()) {
      newErrors.reference = "Reference is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateReceipt = async () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsGenerating(true);

    try {
      const selectedBank = SOUTH_AFRICAN_BANKS.find(bank => bank.name === formData.bankName);
      
      const receipt: TransferReceipt = {
        id: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recipientName: formData.recipientName,
        recipientBank: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
          branchCode: selectedBank?.code || "000000",
        },
        amount: parseFloat(formData.amount),
        reference: formData.reference,
        transferDate: new Date().toISOString(),
        status: "completed",
        description: formData.description || "Test transfer receipt",
        transferType: formData.transferType,
      };

      // Simulate transfer processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setReceipts(prev => [receipt, ...prev]);
      
      // Reset form
      setFormData({
        recipientName: "",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        amount: "",
        reference: "",
        description: "",
        transferType: "test",
      });

      toast.success("Transfer receipt generated successfully!");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate transfer receipt");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReceipt = (receipt: TransferReceipt) => {
    const receiptText = `
TRANSFER RECEIPT
================

Transfer ID: ${receipt.id}
Date: ${new Date(receipt.transferDate).toLocaleString()}
Status: ${receipt.status.toUpperCase()}

RECIPIENT DETAILS
-----------------
Name: ${receipt.recipientName}
Account Holder: ${receipt.recipientBank.accountHolder}
Bank: ${receipt.recipientBank.bankName}
Account Number: ${receipt.recipientBank.accountNumber}
Branch Code: ${receipt.recipientBank.branchCode}

TRANSFER DETAILS
----------------
Amount: R${receipt.amount.toFixed(2)}
Reference: ${receipt.reference}
Type: ${receipt.transferType}
Description: ${receipt.description}

Generated by ReBooked Solutions
Transfer Receipt Tester
    `.trim();

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transfer-receipt-${receipt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded!");
  };

  const sendReceipt = (receipt: TransferReceipt) => {
    // Simulate sending receipt via email
    toast.success(`Receipt ${receipt.id} sent to recipient!`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transfer Receipt Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="John Doe"
                  className={errors.recipientName ? "border-red-500" : ""}
                />
                {errors.recipientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bankName">Bank</Label>
                <Select 
                  value={formData.bankName} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
                >
                  <SelectTrigger className={errors.bankName ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUTH_AFRICAN_BANKS.map((bank) => (
                      <SelectItem key={bank.name} value={bank.name}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {bank.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bankName && (
                  <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="1234567890"
                  className={errors.accountNumber ? "border-red-500" : ""}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                  placeholder="John Doe"
                  className={errors.accountHolder ? "border-red-500" : ""}
                />
                {errors.accountHolder && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountHolder}</p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100.00"
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Book sale payout"
                  className={errors.reference ? "border-red-500" : ""}
                />
                {errors.reference && (
                  <p className="text-sm text-red-500 mt-1">{errors.reference}</p>
                )}
              </div>

              <div>
                <Label htmlFor="transferType">Transfer Type</Label>
                <Select 
                  value={formData.transferType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, transferType: value as TransferReceipt["transferType"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller_payout">Seller Payout</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="test">Test Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional transfer details..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={generateReceipt} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Receipt...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Generate Transfer Receipt
                  </>
                )}
              </Button>
            </div>

            {/* Receipt Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Receipts</h3>
              
              {receipts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No receipts generated yet. Fill out the form and click "Generate Transfer Receipt" to create your first test receipt.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {receipts.map((receipt) => (
                    <Card key={receipt.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-sm">{receipt.id}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(receipt.transferDate).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>To:</span>
                            <span className="font-medium">{receipt.recipientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bank:</span>
                            <span>{receipt.recipientBank.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-medium text-green-600">R{receipt.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reference:</span>
                            <span className="truncate max-w-32">{receipt.reference}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(receipt)}
                            className="flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendReceipt(receipt)}
                            className="flex-1"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
