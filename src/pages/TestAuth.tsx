import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TestTube, Mail, Key, RefreshCw } from 'lucide-react';

const TestAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testRegistration = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🧪 Testing Supabase registration...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: 'Test User' },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) {
        console.error('❌ Registration error:', error);
        toast.error(`Registration failed: ${error.message}`);
        return;
      }

      console.log('✅ Registration response:', data);

      if (data.user && !data.session) {
        toast.success('✅ Registration successful! Check your email for confirmation link.');
        console.log('📧 Confirmation email should be sent by Supabase automatically');
      } else if (data.user && data.session) {
        toast.success('✅ Registration successful! You are logged in immediately.');
      } else {
        toast.warning('⚠️ Unexpected registration response');
      }

    } catch (error) {
      console.error('❌ Registration test failed:', error);
      toast.error('Registration test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testPasswordReset = async () => {
    if (!email) {
      toast.error('Please enter email');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🧪 Testing password reset...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        toast.error(`Password reset failed: ${error.message}`);
        return;
      }

      console.log('✅ Password reset email sent');
      toast.success('✅ Password reset email sent! Check your inbox.');

    } catch (error) {
      console.error('❌ Password reset test failed:', error);
      toast.error('Password reset test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthStatus = async () => {
    try {
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        toast.error(`Session error: ${error.message}`);
        return;
      }

      if (session.session) {
        console.log('✅ User is logged in:', session.session.user);
        toast.success(`✅ Logged in as: ${session.session.user.email}`);
      } else {
        console.log('ℹ️ No active session');
        toast.info('ℹ️ No active session - user is not logged in');
      }

    } catch (error) {
      console.error('❌ Auth status test failed:', error);
      toast.error('Auth status test failed');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Authentication Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Use this page to test if email confirmation and password reset are working correctly.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="email">Test Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Test Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testRegistration}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Test Registration + Email Confirmation
            </Button>
            
            <Button 
              onClick={testPasswordReset}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Test Password Reset
            </Button>
            
            <Button 
              onClick={testAuthStatus}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Auth Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAuth;
