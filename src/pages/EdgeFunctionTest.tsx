import React from "react";
import EdgeFunctionTester from "@/components/admin/EdgeFunctionTester";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EdgeFunctionTest() {
  return (
    <div className="container mx-auto py-8">
      <EdgeFunctionTester />

      <div className="mt-12 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Edge Function Documentation</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>About Edge Functions</h3>
            <p>
              Edge Functions are serverless TypeScript functions that run on
              Supabase's global edge network. They provide server-side logic for
              your application including payment processing, email
              notifications, delivery management, and automated workflows.
            </p>

            <h3>Function Categories</h3>
            <ul>
              <li>
                <strong>Orders:</strong> Handle order creation, commitment, and
                lifecycle management
              </li>
              <li>
                <strong>Payments:</strong> Process Paystack payments, splits,
                and seller payouts
              </li>
              <li>
                <strong>Delivery:</strong> Integrate with courier APIs for
                quotes, shipments, and tracking
              </li>
              <li>
                <strong>Automation:</strong> Automated tasks like expiring
                orders and sending reminders
              </li>
              <li>
                <strong>Utilities:</strong> Email sending and debugging tools
              </li>
            </ul>

            <h3>Testing Guidelines</h3>
            <ul>
              <li>
                Functions marked as test-safe will use sandbox APIs and test
                data
              </li>
              <li>
                Payment functions use Paystack test keys and won't process real
                transactions
              </li>
              <li>
                Email functions will only send to whitelisted test addresses
              </li>
              <li>
                Some functions require existing database records to work
                properly
              </li>
            </ul>

            <h3>Common Test Scenarios</h3>
            <h4>Order Flow Testing:</h4>
            <ol>
              <li>
                Test <code>create-order</code> to simulate new order creation
              </li>
              <li>
                Test <code>commit-to-sale</code> to simulate seller accepting
                order
              </li>
              <li>
                Test <code>get-delivery-quotes</code> for delivery pricing
              </li>
              <li>
                Test <code>mark-collected</code> to complete the order
              </li>
            </ol>

            <h4>Payment Flow Testing:</h4>
            <ol>
              <li>
                Test <code>initialize-paystack-payment</code> to start payment
              </li>
              <li>
                Test <code>verify-paystack-payment</code> to confirm payment
              </li>
              <li>
                Test <code>pay-seller</code> to process seller payout
              </li>
            </ol>

            <h4>Automation Testing:</h4>
            <ol>
              <li>
                Test <code>auto-expire-commits</code> for order cleanup
              </li>
              <li>
                Test <code>process-order-reminders</code> for notifications
              </li>
              <li>
                Test <code>send-email</code> for general email functionality
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Payment Functions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• PAYSTACK_SECRET_KEY - Paystack API secret key</li>
                  <li>• PAYSTACK_PUBLIC_KEY - Paystack public key</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Email Functions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• BREVO_SMTP_KEY - Brevo SMTP password</li>
                  <li>• BREVO_SMTP_USER - Brevo SMTP username</li>
                  <li>• DEFAULT_FROM_EMAIL - Default sender email</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Delivery Functions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• COURIER_GUY_API_KEY - Courier Guy API key</li>
                  <li>• COURIER_GUY_API_URL - Courier Guy API base URL</li>
                  <li>• FASTWAY_API_KEY - Fastway API key</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Database Functions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• SUPABASE_URL - Supabase project URL</li>
                  <li>
                    ��� SUPABASE_SERVICE_ROLE_KEY - Service role key for admin
                    operations
                  </li>
                  <li>
                    • SUPABASE_ANON_KEY - Anonymous key for client operations
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
