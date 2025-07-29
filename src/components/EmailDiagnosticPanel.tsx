import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { emailDiagnosticsService, EmailDiagnosticResult } from '@/utils/emailDiagnostics';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EmailDiagnosticPanel() {
  const [diagnosticResults, setDiagnosticResults] = useState<EmailDiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showDetails, setShowDetails] = useState<string[]>([]);

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    try {
      const status = await emailDiagnosticsService.runFullDiagnostics();
      // Convert status to results array for display
      const results = [
        status.environmentVariablesCheck,
        status.mailQueueCheck,
        status.sendEmailFunctionCheck,
        status.mailQueueProcessorCheck,
        status.configurationCheck
      ];
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testEmailSending = async () => {
    if (!testEmail.trim()) {
      alert('Please enter a test email address');
      return;
    }

    setIsRunning(true);
    try {
      const result = await emailDiagnosticsService.addTestEmailToQueue(testEmail);
      setDiagnosticResults(prev => [...prev, result]);
    } catch (error) {
      console.error('Email test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const processMailQueue = async () => {
    setIsRunning(true);
    try {
      // Process mail queue by calling the edge function directly
      const response = await fetch(`${window.location.origin}/functions/v1/process-mail-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      const diagnosticResult = {
        success: response.ok,
        message: result.message || 'Mail queue processed',
        details: result
      };
      setDiagnosticResults(prev => [...prev, diagnosticResult]);
    } catch (error) {
      console.error('Mail queue processing error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (service: string) => {
    setShowDetails(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">WARNING</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const exportResults = () => {
    const report = JSON.stringify(diagnosticResults, null, 2);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-diagnostic-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const okCount = diagnosticResults.filter(r => r.status === 'ok').length;
  const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;
  const errorCount = diagnosticResults.filter(r => r.status === 'error').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Email Service Diagnostics
          {diagnosticResults.length > 0 && (
            <div className="flex gap-2 text-sm">
              <span className="text-green-600">✅ {okCount}</span>
              <span className="text-yellow-600">⚠️ {warningCount}</span>
              <span className="text-red-600">❌ {errorCount}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runFullDiagnostic}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running...' : 'Run Full Diagnostic'}
          </Button>
          
          <Button
            onClick={processMailQueue}
            disabled={isRunning}
            variant="outline"
          >
            Process Mail Queue
          </Button>

          {diagnosticResults.length > 0 && (
            <Button
              onClick={exportResults}
              variant="outline"
            >
              Export Report
            </Button>
          )}

          <Button
            onClick={() => setDiagnosticResults([])}
            variant="outline"
            className="text-gray-600"
          >
            Clear Results
          </Button>
        </div>

        {/* Email Test Section */}
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Sending:</Label>
          <div className="flex gap-2">
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={testEmailSending}
              disabled={isRunning || !testEmail.trim()}
              variant="outline"
            >
              Send Test Email
            </Button>
          </div>
        </div>

        {/* Results */}
        {diagnosticResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Diagnostic Results</h3>
            {diagnosticResults.map((result, index) => (
              <Alert key={index} className={`cursor-pointer ${
                result.status === 'error' ? 'border-red-200 bg-red-50' :
                result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-green-200 bg-green-50'
              }`}>
                <AlertDescription>
                  <div
                    className="flex items-center justify-between"
                    onClick={() => toggleDetails(result.service)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusBadge(result.status)}
                      <span className="font-medium">{result.service}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {showDetails.includes(result.service) ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {result.message}
                  </div>
                  {showDetails.includes(result.service) && result.details && (
                    <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono">
                      <pre className="whitespace-pre-wrap">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Alert>
          <AlertDescription>
            <strong>Quick Fixes:</strong>
            <ul className="mt-2 text-sm space-y-1">
              <li>• If email service shows configuration errors, check Supabase secrets: BREVO_SMTP_KEY</li>
              <li>• If mail queue has pending emails, click "Process Mail Queue"</li>
              <li>• If environment variables are missing, check your .env file</li>
              <li>• Use "Send Test Email" to verify end-to-end email delivery</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
