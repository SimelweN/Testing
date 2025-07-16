import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import EmailTestingComponent from "@/components/admin/EmailTestingComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Shield } from "lucide-react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

const EmailTesting = () => {
  const { user, isAdmin } = useAuth();

  return (
    <AdminProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Mail className="h-6 w-6 text-blue-600" />
                    Email Testing Dashboard
                    <Shield className="h-5 w-5 text-green-600" />
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Test email templates and functionality. Send test emails to
                    verify email delivery and template rendering.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-1">
                        Template Testing
                      </h4>
                      <p className="text-blue-700">
                        Test all 7 email templates with sample data
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-1">
                        Custom Emails
                      </h4>
                      <p className="text-green-700">
                        Send custom HTML/text emails for testing
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-1">
                        Real-time Results
                      </h4>
                      <p className="text-purple-700">
                        Get instant feedback on email delivery
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email Testing Component */}
            <EmailTestingComponent />

            {/* Usage Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">1. Template Testing</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Select an email template from the dropdown</li>
                      <li>Sample data will be automatically populated</li>
                      <li>Modify the JSON data if needed</li>
                      <li>
                        Enter your test email address and click "Send Test
                        Email"
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      2. Custom Email Testing
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Leave template dropdown blank</li>
                      <li>Enter custom HTML or text content</li>
                      <li>Add subject and recipient email</li>
                      <li>Send to test custom email formatting</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      3. Available Templates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <strong>User Templates:</strong> Welcome, Password Reset
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <strong>Order Templates:</strong> Order Confirmation,
                        Order Committed (Buyer/Seller)
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <strong>Seller Templates:</strong> New Order, Order
                        Pending
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <strong>System Templates:</strong> Contact Form
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AdminProtectedRoute>
  );
};

export default EmailTesting;
