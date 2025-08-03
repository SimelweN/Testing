import React from "react";
import EmailButtonTester from "@/components/EmailButtonTester";
import EmailSystemDiagnostics from "@/components/EmailSystemDiagnostics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EmailTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email System Testing
          </h1>
          <p className="text-gray-600">
            Test all email scenarios to ensure proper functionality
          </p>
        </div>

        <Tabs defaultValue="button-tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="button-tests">Button Email Tests</TabsTrigger>
            <TabsTrigger value="system-diagnostics">System Diagnostics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="button-tests" className="mt-6">
            <EmailButtonTester />
          </TabsContent>
          
          <TabsContent value="system-diagnostics" className="mt-6">
            <EmailSystemDiagnostics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailTest;
