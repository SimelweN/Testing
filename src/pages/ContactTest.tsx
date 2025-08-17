import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllContactMessages } from '@/services/contactService';
import { testContactMessagesAccess } from '@/utils/contactMessageTest';

const ContactTest = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setResult('Running test...\n');
    
    try {
      console.log('=== Starting Contact Messages Test ===');
      
      // Test 1: Direct service call
      setResult(prev => prev + '1. Testing getAllContactMessages...\n');
      const messages = await getAllContactMessages();
      setResult(prev => prev + `   Result: ${messages.length} messages found\n`);
      
      // Test 2: Detailed diagnostics
      setResult(prev => prev + '2. Running detailed diagnostics...\n');
      const testResult = await testContactMessagesAccess();
      setResult(prev => prev + `   Diagnostics complete\n`);
      
      setResult(prev => prev + '\n✅ Test completed! Check console for details.\n');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setResult(prev => prev + `\n❌ Error: ${errorMsg}\n`);
      console.error('Contact test error:', error);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Contact Messages Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runTest} disabled={isLoading}>
              {isLoading ? 'Running Test...' : 'Run Test Again'}
            </Button>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
              {result || 'Click "Run Test" to start...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactTest;
