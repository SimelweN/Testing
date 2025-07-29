import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { mailQueueSetup, MailQueueSetupResult } from '@/utils/mailQueueSetup';
import { toast } from 'sonner';

const MailQueueFix: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MailQueueSetupResult | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log('🔍 Running mail queue diagnostic...');
      const diagnosticResult = await mailQueueSetup.diagnoseProblem();
      
      setResult(diagnosticResult);
      
      if (diagnosticResult.success) {
        toast.success('Mail queue diagnostic completed successfully');
      } else {
        toast.error('Mail queue issues detected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: 'Failed to run diagnostic',
        error: errorMessage
      });
      toast.error('Diagnostic failed: ' + errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const fixMailQueue = async () => {
    setIsRunning(true);
    
    try {
      console.log('🔧 Attempting to fix mail queue...');
      
      // Step 1: Check and create table
      const tableResult = await mailQueueSetup.checkAndCreateMailQueueTable();
      
      if (!tableResult.success) {
        setResult({
          success: false,
          message: 'Failed to create mail_queue table',
          error: tableResult.error
        });
        toast.error('Failed to create mail_queue table');
        return;
      }
      
      // Step 2: Test insertion
      const insertionResult = await mailQueueSetup.testMailQueueInsertion();
      
      if (!insertionResult.success) {
        setResult({
          success: false,
          message: 'Mail queue table exists but insertion failed',
          error: insertionResult.error
        });
        toast.error('Mail queue insertion test failed');
        return;
      }
      
      // Step 3: Run full diagnostic
      const diagnosticResult = await mailQueueSetup.diagnoseProblem();
      setResult(diagnosticResult);
      
      if (diagnosticResult.success) {
        toast.success('Mail queue system fixed and verified');
      } else {
        toast.warning('Mail queue table fixed, but other issues may remain');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: 'Failed to fix mail queue',
        error: errorMessage
      });
      toast.error('Fix failed: ' + errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-orange-500" />
          Mail Queue Fix - Order Creation Email Triggers
        </CardTitle>
        <CardDescription>
          Diagnose and fix issues with order creation email triggers not queuing emails properly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Run Diagnostic
          </Button>
          
          <Button
            onClick={fixMailQueue}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Fix Mail Queue
          </Button>
        </div>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start gap-3">
              {getStatusIcon(result.success)}
              <div className="flex-1">
                <AlertDescription>
                  <div className="font-medium mb-2">{result.message}</div>
                  
                  {result.error && (
                    <div className="text-red-600 text-sm mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="space-y-2">
                      {typeof result.details === 'object' && (
                        <div className="text-sm space-y-1">
                          {result.details.recentOrders !== undefined && (
                            <div>
                              <strong>Recent Orders:</strong> {result.details.recentOrders}
                            </div>
                          )}
                          {result.details.recentEmails !== undefined && (
                            <div>
                              <strong>Recent Emails Queued:</strong> {result.details.recentEmails}
                            </div>
                          )}
                          {result.details.problemIdentified !== undefined && (
                            <div className={result.details.problemIdentified ? 'text-red-600 font-medium' : 'text-green-600'}>
                              <strong>Problem Identified:</strong> {result.details.problemIdentified ? 'YES' : 'NO'}
                            </div>
                          )}
                          {result.details.tableCheck && (
                            <div>
                              <strong>Table Check:</strong> {result.details.tableCheck.success ? '✅ PASS' : '❌ FAIL'}
                              {result.details.tableCheck.message && (
                                <span className="ml-2">({result.details.tableCheck.message})</span>
                              )}
                            </div>
                          )}
                          {result.details.insertionCheck && (
                            <div>
                              <strong>Insertion Test:</strong> {result.details.insertionCheck.success ? '✅ PASS' : '❌ FAIL'}
                              {result.details.insertionCheck.message && (
                                <span className="ml-2">({result.details.insertionCheck.message})</span>
                              )}
                            </div>
                          )}
                          {result.details.rlsBypassCheck && result.details.rlsBypassCheck.message !== 'Skipped' && (
                            <div>
                              <strong>RLS Bypass Test:</strong> {result.details.rlsBypassCheck.success ? '✅ PASS' : '❌ FAIL'}
                              {result.details.rlsBypassCheck.message && (
                                <span className="ml-2">({result.details.rlsBypassCheck.message})</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {result.details.recommendations && result.details.recommendations.length > 0 && (
                        <div className="mt-3">
                          <strong>Recommendations:</strong>
                          <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            {result.details.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">About this diagnostic:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Checks if mail_queue table exists and is accessible</li>
            <li>• Tests email insertion functionality</li>
            <li>• Compares recent orders vs emails queued</li>
            <li>• Identifies if order creation emails are being properly queued</li>
            <li>• Provides specific recommendations for fixing issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MailQueueFix;
