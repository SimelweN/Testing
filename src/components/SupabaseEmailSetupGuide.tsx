import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Server
} from 'lucide-react';

const SupabaseEmailSetupGuide: React.FC = () => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Supabase Email Configuration Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Administrator Setup Required:</strong> Email confirmation is currently not working 
              because SMTP settings need to be configured in the Supabase dashboard.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Project: {projectRef}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank')}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="steps">Setup Steps</TabsTrigger>
          <TabsTrigger value="providers">Email Providers</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step-by-Step Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  id: "step1",
                  title: "1. Access Supabase Dashboard",
                  description: "Go to your Supabase project dashboard",
                  action: `https://supabase.com/dashboard/project/${projectRef}/auth/settings`,
                  actionText: "Open Auth Settings"
                },
                {
                  id: "step2", 
                  title: "2. Navigate to SMTP Settings",
                  description: "In Authentication → Settings, scroll to 'SMTP Settings'",
                  details: "Look for the 'Enable custom SMTP' toggle"
                },
                {
                  id: "step3",
                  title: "3. Enable Custom SMTP",
                  description: "Toggle 'Enable custom SMTP' to ON",
                  details: "This allows you to use your own email provider instead of Supabase's default"
                },
                {
                  id: "step4",
                  title: "4. Configure SMTP Provider",
                  description: "Enter your email provider's SMTP details",
                  details: "See the 'Email Providers' tab for specific configurations"
                },
                {
                  id: "step5",
                  title: "5. Enable Email Confirmation",
                  description: "In the same Auth Settings page, ensure 'Confirm email' is enabled",
                  details: "This is usually under 'User email confirmation'"
                },
                {
                  id: "step6",
                  title: "6. Set Site URL",
                  description: "Configure your site URL in 'Site URL' field",
                  action: window.location.origin,
                  actionText: "Copy Current URL"
                },
                {
                  id: "step7",
                  title: "7. Add Redirect URLs",
                  description: "Add allowed redirect URLs",
                  action: `${window.location.origin}/verify, ${window.location.origin}/auth/callback`,
                  actionText: "Copy Redirect URLs"
                }
              ].map((step) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      {step.details && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{step.details}</p>
                      )}
                    </div>
                    {step.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (step.action!.startsWith('http')) {
                            window.open(step.action, '_blank');
                          } else {
                            copyToClipboard(step.action!, step.id);
                          }
                        }}
                        className="ml-4 flex items-center gap-1"
                      >
                        {step.action!.startsWith('http') ? (
                          <ExternalLink className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedStep === step.id ? 'Copied!' : step.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                name: "Gmail",
                host: "smtp.gmail.com",
                port: "587",
                security: "TLS",
                notes: "Requires App Password (2FA must be enabled)",
                settings: [
                  "SMTP Host: smtp.gmail.com",
                  "SMTP Port: 587", 
                  "SMTP User: your-email@gmail.com",
                  "SMTP Password: app-specific-password"
                ]
              },
              {
                name: "SendGrid",
                host: "smtp.sendgrid.net", 
                port: "587",
                security: "TLS",
                notes: "Use 'apikey' as username",
                settings: [
                  "SMTP Host: smtp.sendgrid.net",
                  "SMTP Port: 587",
                  "SMTP User: apikey", 
                  "SMTP Password: your-sendgrid-api-key"
                ]
              }
            ].map((provider) => (
              <Card key={provider.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4" />
                    {provider.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Host:</strong> {provider.host}</div>
                    <div><strong>Port:</strong> {provider.port}</div>
                    <div><strong>Security:</strong> {provider.security}</div>
                  </div>
                  
                  <Alert>
                    <AlertDescription className="text-xs">
                      {provider.notes}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Configuration:</h4>
                    {provider.settings.map((setting, index) => (
                      <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                        {setting}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Testing Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  After configuring SMTP, test the setup by attempting to register a new account.
                  You should receive a confirmation email within a few minutes.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-medium">Troubleshooting:</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Check spam/junk folders for test emails</li>
                  <li>• Verify SMTP credentials are correct</li>
                  <li>• Ensure the email address has permission to send emails</li>
                  <li>• Check Supabase logs for detailed error messages</li>
                  <li>• Try with a different email provider if issues persist</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Need help?</strong> Contact Supabase support or check their 
                  documentation for SMTP configuration details.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseEmailSetupGuide;
