import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DebugInfo {
  hasSession: boolean;
  userRole: string | null;
  isAdmin: boolean;
  tableExists: boolean;
  canRead: boolean;
  canInsert: boolean;
  messageCount: number;
  error: string | null;
}

export const ContactMessagesDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const info: DebugInfo = {
      hasSession: false,
      userRole: null,
      isAdmin: false,
      tableExists: false,
      canRead: false,
      canInsert: false,
      messageCount: 0,
      error: null
    };

    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      info.hasSession = !!session;

      if (session) {
        // Check user profile and admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          info.userRole = profile.role;
          info.isAdmin = profile.role === 'admin' || profile.is_admin === true;
        }
      }

      // Test table existence and read permission
      const { data: readData, error: readError } = await supabase
        .from('contact_messages')
        .select('count', { count: 'exact', head: true });

      if (readError) {
        info.error = `Read Error: ${readError.code} - ${readError.message}`;
        if (readError.code === '42P01') {
          info.tableExists = false;
        } else if (readError.code === 'PGRST116' || readError.code === '42501') {
          info.tableExists = true;
          info.canRead = false;
        }
      } else {
        info.tableExists = true;
        info.canRead = true;
        info.messageCount = readData?.[0]?.count || 0;
      }

      // Test insert permission
      const testMessage = {
        name: 'Debug Test',
        email: 'debug@test.com',
        subject: 'Debug Test Message',
        message: 'This is a test message for debugging purposes'
      };

      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert(testMessage);

      if (insertError) {
        if (insertError.code !== 'PGRST116' && insertError.code !== '42501') {
          info.error = (info.error || '') + ` Insert Error: ${insertError.code} - ${insertError.message}`;
        }
      } else {
        info.canInsert = true;
        // Clean up test message
        await supabase
          .from('contact_messages')
          .delete()
          .eq('email', 'debug@test.com')
          .eq('subject', 'Debug Test Message');
      }

    } catch (error) {
      info.error = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const createTestMessage = async () => {
    try {
      const testMessage = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test contact message'
      };

      const { error } = await supabase
        .from('contact_messages')
        .insert(testMessage);

      if (error) {
        toast.error(`Failed to create test message: ${error.message}`);
      } else {
        toast.success('Test message created successfully');
        runDiagnostics(); // Refresh diagnostics
      }
    } catch (error) {
      toast.error('Error creating test message');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contact Messages Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          <Button onClick={createTestMessage} variant="outline">
            Create Test Message
          </Button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Session Status:</strong>
                <span className={debugInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.hasSession ? ' ✓ Active' : ' ✗ None'}
                </span>
              </div>
              <div>
                <strong>User Role:</strong>
                <span className={debugInfo.userRole === 'admin' ? 'text-green-600' : 'text-orange-600'}>
                  {debugInfo.userRole || 'None'}
                </span>
              </div>
              <div>
                <strong>Admin Status:</strong>
                <span className={debugInfo.isAdmin ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.isAdmin ? ' ✓ Admin' : ' ✗ Not Admin'}
                </span>
              </div>
              <div>
                <strong>Table Exists:</strong>
                <span className={debugInfo.tableExists ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.tableExists ? ' ✓ Yes' : ' ✗ No'}
                </span>
              </div>
              <div>
                <strong>Can Read:</strong>
                <span className={debugInfo.canRead ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.canRead ? ' ✓ Yes' : ' ✗ No'}
                </span>
              </div>
              <div>
                <strong>Can Insert:</strong>
                <span className={debugInfo.canInsert ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.canInsert ? ' ✓ Yes' : ' ✗ No'}
                </span>
              </div>
              <div>
                <strong>Message Count:</strong>
                <span className="text-blue-600"> {debugInfo.messageCount}</span>
              </div>
            </div>
            
            {debugInfo.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <strong className="text-red-700">Error Details:</strong>
                <pre className="text-red-600 text-xs mt-1 whitespace-pre-wrap">{debugInfo.error}</pre>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <strong className="text-blue-700">Recommendations:</strong>
              <ul className="text-blue-600 text-xs mt-1 space-y-1">
                {!debugInfo.tableExists && <li>• Create the contact_messages table in your database</li>}
                {debugInfo.tableExists && !debugInfo.canRead && !debugInfo.isAdmin && (
                  <li>• User needs admin role to read contact messages</li>
                )}
                {debugInfo.tableExists && !debugInfo.canInsert && (
                  <li>• RLS policy may need to allow public inserts for contact form</li>
                )}
                {debugInfo.canRead && debugInfo.messageCount === 0 && (
                  <li>• No messages in database - try creating a test message</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
