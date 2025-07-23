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
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Split,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  TestTube,
} from "lucide-react";
import { supabase } from "@/lib/supabase";


interface PaystackSubaccount {
  subaccount: string;
  share: number;
}

interface PaystackSplit {
  split_code: string;
  name: string;
  type: "percentage" | "flat";
  currency: string;
  subaccounts: PaystackSubaccount[];
  total_subaccounts: number;
  active: boolean;
  created_at: string;
}

interface CreateSplitRequest {
  name: string;
  type: "percentage" | "flat";
  currency: string;
  subaccounts: PaystackSubaccount[];
}

const PaystackSplitManagement = () => {
  const [splits, setSplits] = useState<PaystackSplit[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<PaystackSplit | null>(
    null,
  );

  // Create split form state
  const [splitForm, setSplitForm] = useState<CreateSplitRequest>({
    name: "",
    type: "percentage",
    currency: "ZAR",
    subaccounts: [],
  });

  // New subaccount form state
  const [newSubaccount, setNewSubaccount] = useState({
    subaccount: "",
    share: 0,
  });

  // Available subaccounts from profiles
  const [availableSubaccounts, setAvailableSubaccounts] = useState<
    Array<{
      id: string;
      name: string;
      subaccount_code: string;
    }>
  >([]);

  useEffect(() => {
    loadSplits();
    loadAvailableSubaccounts();
  }, []);

  const loadSplits = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-split-management`,
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
          setSplits(result.data);
        } else {
          console.warn("Unexpected splits response format:", result);
          setSplits([]);
        }
      } else {
        const errorResult = await response.json().catch(() => null);
        console.error("Failed to load splits:", errorResult);
        toast.error(
          errorResult?.details?.message || "Failed to load payment splits",
        );
      }
    } catch (error) {
      console.error("Error loading splits:", error);
      toast.error("Error connecting to split management service");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSubaccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, subaccount_code")
        .not("subaccount_code", "is", null);

      if (error) {
        console.error("Error loading subaccounts:", error);
        toast.error("Failed to load available subaccounts");
        return;
      }

      setAvailableSubaccounts(data || []);
    } catch (error) {
      console.error("Error loading subaccounts:", error);
      toast.error("Error loading available subaccounts");
    }
  };

  const createSplit = async () => {
    if (!splitForm.name.trim()) {
      toast.error("Split name is required");
      return;
    }

    if (splitForm.subaccounts.length === 0) {
      toast.error("At least one subaccount is required");
      return;
    }

    // Validate percentage splits don't exceed 100%
    if (splitForm.type === "percentage") {
      const totalPercentage = splitForm.subaccounts.reduce(
        (sum, sub) => sum + sub.share,
        0,
      );
      if (totalPercentage > 100) {
        toast.error(
          `Total percentage (${totalPercentage}%) cannot exceed 100%`,
        );
        return;
      }
    }

    setCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-split-management`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(splitForm),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Split created successfully: ${result.split_code}`);
        setSplitForm({
          name: "",
          type: "percentage",
          currency: "ZAR",
          subaccounts: [],
        });
        loadSplits(); // Reload splits
      } else {
        toast.error(result.details?.message || "Failed to create split");
      }
    } catch (error) {
      console.error("Error creating split:", error);
      toast.error("Error creating payment split");
    } finally {
      setCreating(false);
    }
  };

  const addSubaccount = () => {
    if (!newSubaccount.subaccount || newSubaccount.share <= 0) {
      toast.error("Please select a subaccount and enter a valid share amount");
      return;
    }

    // Check if subaccount already exists in the split
    if (
      splitForm.subaccounts.some(
        (sub) => sub.subaccount === newSubaccount.subaccount,
      )
    ) {
      toast.error("This subaccount is already in the split");
      return;
    }

    setSplitForm((prev) => ({
      ...prev,
      subaccounts: [...prev.subaccounts, { ...newSubaccount }],
    }));

    setNewSubaccount({ subaccount: "", share: 0 });
  };

  const removeSubaccount = (subaccountCode: string) => {
    setSplitForm((prev) => ({
      ...prev,
      subaccounts: prev.subaccounts.filter(
        (sub) => sub.subaccount !== subaccountCode,
      ),
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getSubaccountName = (subaccountCode: string) => {
    const account = availableSubaccounts.find(
      (acc) => acc.subaccount_code === subaccountCode,
    );
    return account?.name || subaccountCode;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Paystack Split Management
          </h2>
          <p className="text-muted-foreground">
            Manage payment splits for multi-seller transactions
          </p>
        </div>
        <Button onClick={loadSplits} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="splits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="splits">
            <Split className="h-4 w-4 mr-2" />
            Active Splits
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Create Split
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Test Splits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="splits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="h-5 w-5" />
                Payment Splits ({splits.length})
              </CardTitle>
              <CardDescription>
                View and manage existing payment splits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading splits...</span>
                </div>
              ) : splits.length === 0 ? (
                <div className="text-center py-8">
                  <Split className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No payment splits created yet</p>
                  <p className="text-sm text-gray-500">
                    Create your first split using the "Create Split" tab
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Split Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subaccounts</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map((split) => (
                      <TableRow key={split.split_code}>
                        <TableCell className="font-medium">
                          {split.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {split.split_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(split.split_code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              split.type === "percentage"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {split.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {split.total_subaccounts}
                          </div>
                        </TableCell>
                        <TableCell>{split.currency}</TableCell>
                        <TableCell>
                          <Badge
                            variant={split.active ? "default" : "destructive"}
                          >
                            {split.active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSplit(split)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.paystack.com/#/payments/splits/${split.split_code}`,
                                  "_blank",
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
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

          {/* Split Details Modal */}
          {selectedSplit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Split Details: {selectedSplit.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSplit(null)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Split Code</Label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {selectedSplit.split_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(selectedSplit.split_code)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p className="text-sm">{selectedSplit.type}</p>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <p className="text-sm">{selectedSplit.currency}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge
                      variant={selectedSplit.active ? "default" : "destructive"}
                    >
                      {selectedSplit.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Subaccounts ({selectedSplit.total_subaccounts})</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subaccount</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSplit.subaccounts.map((sub, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {sub.subaccount}
                            </code>
                          </TableCell>
                          <TableCell>
                            {getSubaccountName(sub.subaccount)}
                          </TableCell>
                          <TableCell>
                            {selectedSplit.type === "percentage"
                              ? `${sub.share}%`
                              : `R${(sub.share / 100).toFixed(2)}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Payment Split
              </CardTitle>
              <CardDescription>
                Create a new payment split for multi-seller transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="split-name">Split Name</Label>
                  <Input
                    id="split-name"
                    value={splitForm.name}
                    onChange={(e) =>
                      setSplitForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Multi-Seller Order Split"
                  />
                </div>
                <div>
                  <Label htmlFor="split-type">Split Type</Label>
                  <Select
                    value={splitForm.type}
                    onValueChange={(value: "percentage" | "flat") =>
                      setSplitForm((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="split-currency">Currency</Label>
                <Select
                  value={splitForm.currency}
                  onValueChange={(value) =>
                    setSplitForm((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAR">
                      ZAR (South African Rand)
                    </SelectItem>
                    <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Add Subaccount Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Add Subaccounts
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Subaccount</Label>
                    <Select
                      value={newSubaccount.subaccount}
                      onValueChange={(value) =>
                        setNewSubaccount((prev) => ({
                          ...prev,
                          subaccount: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subaccount" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubaccounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.subaccount_code}
                          >
                            {account.name} ({account.subaccount_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Share {splitForm.type === "percentage" ? "(%)" : "(ZAR)"}
                    </Label>
                    <Input
                      type="number"
                      value={newSubaccount.share}
                      onChange={(e) =>
                        setNewSubaccount((prev) => ({
                          ...prev,
                          share: Number(e.target.value),
                        }))
                      }
                      placeholder={
                        splitForm.type === "percentage" ? "0-100" : "0.00"
                      }
                      min="0"
                      max={splitForm.type === "percentage" ? "100" : undefined}
                      step={splitForm.type === "percentage" ? "1" : "0.01"}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addSubaccount} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Current Subaccounts */}
                {splitForm.subaccounts.length > 0 && (
                  <div className="mt-4">
                    <Label>Current Subaccounts</Label>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subaccount</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Share</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {splitForm.subaccounts.map((sub, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {sub.subaccount}
                                </code>
                              </TableCell>
                              <TableCell>
                                {getSubaccountName(sub.subaccount)}
                              </TableCell>
                              <TableCell>
                                {splitForm.type === "percentage"
                                  ? `${sub.share}%`
                                  : `R${sub.share.toFixed(2)}`}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeSubaccount(sub.subaccount)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Split Summary */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between text-sm">
                        <span>
                          Total{" "}
                          {splitForm.type === "percentage"
                            ? "Percentage"
                            : "Amount"}
                          :
                        </span>
                        <span className="font-medium">
                          {splitForm.type === "percentage"
                            ? `${splitForm.subaccounts.reduce((sum, sub) => sum + sub.share, 0)}%`
                            : `R${splitForm.subaccounts.reduce((sum, sub) => sum + sub.share, 0).toFixed(2)}`}
                        </span>
                      </div>
                      {splitForm.type === "percentage" && (
                        <div className="flex justify-between text-sm">
                          <span>Platform Share:</span>
                          <span className="font-medium">
                            {100 -
                              splitForm.subaccounts.reduce(
                                (sum, sub) => sum + sub.share,
                                0,
                              )}
                            %
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Validation Warning */}
                    {splitForm.type === "percentage" &&
                      splitForm.subaccounts.reduce(
                        (sum, sub) => sum + sub.share,
                        0,
                      ) > 100 && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-700">
                            Total percentage cannot exceed 100%
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Button
                  onClick={createSplit}
                  disabled={creating || splitForm.subaccounts.length === 0}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Split...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Payment Split
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <SplitPaymentTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaystackSplitManagement;
