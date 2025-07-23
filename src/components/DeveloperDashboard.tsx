import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import AdminUsageExamples from "@/components/admin/AdminUsageExamples";
import CleanEmailTester from "@/components/admin/CleanEmailTester";
import AdminEmailTestingTab from "@/components/admin/AdminEmailTestingTab";
import AdminPaystackTestingTab from "@/components/admin/AdminPaystackTestingTab";
import SignupEmailTest from "@/components/admin/SignupEmailTest";
import EmailVerificationDiagnostic from "@/components/admin/EmailVerificationDiagnostic";
import PaystackEdgeFunctionDiagnostic from "@/components/admin/PaystackEdgeFunctionDiagnostic";
import DatabaseTableTester from "@/components/admin/DatabaseTableTester";
import DatabaseTestingSuite from "@/components/debug/DatabaseTestingSuite";
import DemoDataGenerator from "@/components/admin/DemoDataGenerator";
import EdgeFunctionTester from "@/components/admin/EdgeFunctionTester";
import EdgeFunctionDebugPanel from "@/components/admin/EdgeFunctionDebugPanel";
import DatabaseSchemaDiagnostic from "@/components/admin/DatabaseSchemaDiagnostic";
import PaystackSplitManagement from "@/components/admin/PaystackSplitManagement";
import PaystackTransferManagement from "@/components/admin/PaystackTransferManagement";
import PaystackSystemTestComponent from "@/components/admin/PaystackSystemTestComponent";
import APIFunctionTester from "@/components/admin/APIFunctionTester";
import NetworkConnectivityDebug from "@/components/admin/NetworkConnectivityDebug";
import SafeEnvironmentDebug from "@/components/admin/SafeEnvironmentDebug";
import { TransferReceiptTester } from "@/components/admin/TransferReceiptTester";
import DatabaseCleanup from "@/components/admin/DatabaseCleanup";
import PaystackDatabaseSetupChecker from "@/components/admin/PaystackDatabaseSetupChecker";

import ErrorFallback from "@/components/ErrorFallback";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  Code,
  TestTube,
  Mail,
  CreditCard,
  Database,
  Split,
  ArrowUpRight,
  ShieldCheck,
  Wifi,
  Settings,
  Terminal,
  Bug,
  Wrench,
  Trash2,
} from "lucide-react";

const DeveloperDashboard = () => {
  const isMobile = useIsMobile();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Define tab configuration for developer tools
  const devTabConfig = [
    {
      value: "examples",
      label: "Examples",
      icon: Code,
      color: "text-teal-600",
      description: "Code examples and snippets",
    },
    {
      value: "functions",
      label: "Edge Functions",
      icon: TestTube,
      color: "text-blue-600",
      description: "Test Supabase Edge Functions",
    },
    {
      value: "api-testing",
      label: "API Testing",
      icon: Code,
      color: "text-yellow-600",
      description: "Test API folder functions",
    },
    {
      value: "network-debug",
      label: "Network Debug",
      icon: Wifi,
      color: "text-blue-600",
      description: "Debug connectivity issues",
    },
    {
      value: "env-debug",
      label: "Environment Debug",
      icon: Settings,
      color: "text-gray-600",
      description: "Check environment variables",
    },
    {
      value: "transfer-receipt",
      label: "Transfer Receipts",
      icon: CreditCard,
      color: "text-green-600",
      description: "Test transfer receipt generation",
    },
    {
      value: "emails",
      label: "Email Templates",
      icon: Mail,
      color: "text-indigo-600",
      description: "Test email templates",
    },
    {
      value: "email-testing",
      label: "Email Testing",
      icon: Mail,
      color: "text-pink-600",
      description: "All email template previews",
    },
    {
      value: "signup-email-test",
      label: "Signup Email",
      icon: Mail,
      color: "text-purple-600",
      description: "Test signup confirmation",
    },
    {
      value: "email-verification",
      label: "Email Verification",
      icon: ShieldCheck,
      color: "text-emerald-600",
      description: "Diagnose verification process",
    },
    {
      value: "paystack-testing",
      label: "Paystack Testing",
      icon: CreditCard,
      color: "text-green-600",
      description: "Payment & refund testing",
    },
    {
      value: "paystack-system",
      label: "Paystack System",
      icon: CreditCard,
      color: "text-blue-600",
      description: "System-wide Paystack check",
    },
    {
      value: "paystack-verification",
      label: "Paystack Edge Functions",
      icon: TestTube,
      color: "text-orange-600",
      description: "Diagnose Paystack Edge Function issues",
    },
    {
      value: "split-management",
      label: "Payment Splits",
      icon: Split,
      color: "text-cyan-600",
      description: "Manage split payments",
    },
    {
      value: "transfer-management",
      label: "Transfers",
      icon: ArrowUpRight,
      color: "text-violet-600",
      description: "Manage money transfers",
    },
    {
      value: "demo-data",
      label: "Demo Data",
      icon: Database,
      color: "text-amber-600",
      description: "Generate test/demo data",
    },
    {
      value: "database-testing",
      label: "Database Testing",
      icon: Database,
      color: "text-slate-600",
      description: "Test database tables",
    },
    {
      value: "paystack-database-setup",
      label: "Paystack DB Setup",
      icon: Database,
      color: "text-green-600",
      description: "Verify Paystack DB setup",
    },
    {
      value: "database-schema",
      label: "Database Schema",
      icon: Database,
      color: "text-purple-600",
      description: "View table schemas and columns",
    },
    {
      value: "cleanup",
      label: "Database Cleanup",
      icon: Trash2,
      color: "text-red-600",
      description: "Remove test/demo data",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Developer Dashboard</h1>
            <p className="opacity-90">Development, testing, and debugging tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-5 h-5" />
              <span className="font-medium">Debug Tools</span>
            </div>
            <p className="text-sm opacity-80">Network, environment, and system diagnostics</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="w-5 h-5" />
              <span className="font-medium">Testing Suite</span>
            </div>
            <p className="text-sm opacity-80">API, Edge Functions, and payment testing</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5" />
              <span className="font-medium">Database Tools</span>
            </div>
            <p className="text-sm opacity-80">Schema, testing, and data management</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5" />
              <span className="font-medium">Utilities</span>
            </div>
            <p className="text-sm opacity-80">Code examples, email testing, and more</p>
          </div>
        </div>
      </div>

      {/* Developer Tools Tabs */}
      <Tabs defaultValue="env-debug" className="w-full">
        {isMobile ? (
          // Mobile: Scrollable horizontal tabs
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
              {devTabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center justify-center px-2.5 py-2.5 min-w-[75px] data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md mx-0.5"
                  >
                    <Icon className="h-3.5 w-3.5 mb-1" />
                    <span className="text-[10px] font-medium truncate max-w-[65px] leading-tight">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        ) : (
          // Desktop: Organized grid layout
          <div className="space-y-4">
            {/* Core Development Tools */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Core Development Tools
              </h3>
              <TabsList className="grid grid-cols-5 gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-auto">
                {devTabConfig.slice(0, 5).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center justify-center p-4 h-auto data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg hover:bg-gray-50 data-[state=active]:hover:bg-slate-700 group"
                    >
                      <div className="relative mb-2">
                        <Icon
                          className={`h-6 w-6 ${tab.color} group-data-[state=active]:text-white transition-colors`}
                        />
                      </div>
                      <span className="text-sm font-medium mb-1 text-center">
                        {tab.label}
                      </span>
                      <span className="text-xs opacity-70 text-center leading-tight">
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Email & Communication Testing */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Email & Communication Testing
              </h3>
              <TabsList className="grid grid-cols-5 gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-auto">
                {devTabConfig.slice(5, 10).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center justify-center p-4 h-auto data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg hover:bg-gray-50 data-[state=active]:hover:bg-slate-700 group"
                    >
                      <div className="relative mb-2">
                        <Icon
                          className={`h-6 w-6 ${tab.color} group-data-[state=active]:text-white transition-colors`}
                        />
                      </div>
                      <span className="text-sm font-medium mb-1 text-center">
                        {tab.label}
                      </span>
                      <span className="text-xs opacity-70 text-center leading-tight">
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Payment & Financial Testing */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Payment & Financial Testing
              </h3>
              <TabsList className="grid grid-cols-5 gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-auto">
                {devTabConfig.slice(10, 15).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center justify-center p-4 h-auto data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg hover:bg-gray-50 data-[state=active]:hover:bg-slate-700 group"
                    >
                      <div className="relative mb-2">
                        <Icon
                          className={`h-6 w-6 ${tab.color} group-data-[state=active]:text-white transition-colors`}
                        />
                      </div>
                      <span className="text-sm font-medium mb-1 text-center">
                        {tab.label}
                      </span>
                      <span className="text-xs opacity-70 text-center leading-tight">
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Database & Data Management */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Database & Data Management
              </h3>
              <TabsList className="grid grid-cols-5 gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-auto">
                {devTabConfig.slice(15, 20).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center justify-center p-4 h-auto data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg hover:bg-gray-50 data-[state=active]:hover:bg-slate-700 group"
                    >
                      <div className="relative mb-2">
                        <Icon
                          className={`h-6 w-6 ${tab.color} group-data-[state=active]:text-white transition-colors`}
                        />
                      </div>
                      <span className="text-sm font-medium mb-1 text-center">
                        {tab.label}
                      </span>
                      <span className="text-xs opacity-70 text-center leading-tight">
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="mt-6">
          <TabsContent value="examples" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <AdminUsageExamples />
            </div>
          </TabsContent>

          <TabsContent value="functions" className="space-y-4 mt-0">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <EdgeFunctionTester />
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <EdgeFunctionDebugPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api-testing" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <APIFunctionTester />
            </div>
          </TabsContent>

          <TabsContent value="network-debug" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <NetworkConnectivityDebug />
            </div>
          </TabsContent>

          <TabsContent value="env-debug" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <SafeEnvironmentDebug />
            </div>
          </TabsContent>

          <TabsContent value="transfer-receipt" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <TransferReceiptTester />
            </div>
          </TabsContent>

          <TabsContent value="emails" className="space-y-4 mt-0">
            <CleanEmailTester />
          </TabsContent>

          <TabsContent value="email-testing" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <AdminEmailTestingTab />
            </div>
          </TabsContent>

          <TabsContent value="signup-email-test" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <SignupEmailTest />
            </div>
          </TabsContent>

          <TabsContent value="email-verification" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <EmailVerificationDiagnostic />
            </div>
          </TabsContent>

          <TabsContent value="paystack-testing" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <AdminPaystackTestingTab />
            </div>
          </TabsContent>

          <TabsContent value="paystack-system" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <PaystackSystemTestComponent />
            </div>
          </TabsContent>

          <TabsContent value="paystack-verification" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <PaystackEdgeFunctionDiagnostic />
            </div>
          </TabsContent>

          <TabsContent value="split-management" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <PaystackSplitManagement />
            </div>
          </TabsContent>

          <TabsContent value="transfer-management" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <PaystackTransferManagement />
            </div>
          </TabsContent>

          <TabsContent value="demo-data" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <DemoDataGenerator />
            </div>
          </TabsContent>

          <TabsContent value="database-testing" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <DatabaseTableTester />
            </div>
          </TabsContent>

          <TabsContent value="paystack-database-setup" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <PaystackDatabaseSetupChecker />
            </div>
          </TabsContent>

          <TabsContent value="database-schema" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <DatabaseSchemaDiagnostic />
            </div>
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <DatabaseCleanup />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DeveloperDashboard;
