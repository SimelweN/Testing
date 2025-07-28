import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Listen for auth state changes (recommended for email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in via email verification');
        setStatus('success');
        setMessage('Email verified successfully! You are now logged in.');

        toast.success('✅ Email verified and logged in!');

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('✅ Token refreshed via email verification');
        setStatus('success');
        setMessage('Email verified successfully!');

        toast.success('✅ Email verified!');

        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Email verified! You can now log in.',
              email: session.user.email
            }
          });
        }, 2000);
        return;
      }
    });

    const handleEmailConfirmation = async () => {
      try {
        console.log('🔐 Handling email confirmation...');

        // Get the full URL for debugging
        const fullUrl = window.location.href;
        console.log('📧 Full URL:', fullUrl);
        console.log('📧 URL Hash:', window.location.hash);
        console.log('📧 URL Search:', window.location.search);
        console.log('📧 URL Pathname:', window.location.pathname);

        // Parse URL parameters from both hash and search
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);

        // Log all parameters for debugging
        console.log('📧 Hash Params:', Object.fromEntries(hashParams.entries()));
        console.log('📧 URL Params:', Object.fromEntries(urlParams.entries()));

        // Try to get tokens from different locations
        let accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        let tokenType = hashParams.get('token_type') || urlParams.get('token_type');
        let type = hashParams.get('type') || urlParams.get('type');

        // Also check for other common Supabase params
        const token = hashParams.get('token') || urlParams.get('token');
        const confirmationUrl = hashParams.get('confirmation_url') || urlParams.get('confirmation_url');

        console.log('🔍 Found tokens:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          tokenType,
          type,
          token: token ? 'present' : 'missing',
          confirmationUrl: confirmationUrl ? 'present' : 'missing'
        });

        // Method 1: Use access_token and refresh_token (modern Supabase)
        if (accessToken && refreshToken) {
          console.log('✅ Using access_token and refresh_token method');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            setStatus('error');
            setMessage(`Email verification failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('✅ Email verified successfully for user:', data.user.email);
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');

            toast.success('✅ Email verified successfully!');

            setTimeout(() => {
              navigate('/login', {
                state: {
                  message: 'Email verified! You can now log in with your credentials.',
                  email: data.user?.email
                }
              });
            }, 2000);
            return;
          }
        }

        // Method 2: Let Supabase handle the hash parameters automatically
        console.log('🔄 Trying automatic Supabase session handling...');

        // Check if Supabase has automatically processed the auth state
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
        }

        if (session?.user) {
          console.log('✅ Found existing session after email verification');
          setStatus('success');
          setMessage('Email verified successfully! You are now logged in.');

          toast.success('✅ Email verified and logged in!');

          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
          return;
        }

        // Method 3: Check if this is a password reset or other type
        if (type === 'recovery') {
          console.log('🔄 This is a password recovery link');
          setStatus('success');
          setMessage('Password reset link verified! You can now set a new password.');

          setTimeout(() => {
            navigate('/reset-password');
          }, 2000);
          return;
        }

        // Method 4: Show detailed debug info if nothing worked
        console.log('ℹ️ No verification tokens found - providing debug info');
        setStatus('error');
        setMessage(
          `No verification tokens found in URL. Please ensure you clicked the correct link from your email. ` +
          `If you continue to have issues, please contact support.`
        );

      } catch (error) {
        console.error('❌ Email verification error:', error);
        setStatus('error');
        setMessage(`Email verification failed: ${getSafeErrorMessage(error, 'Unknown error')}`);
      }
    };

    // Add a small delay to let any URL processing happen
    const timeoutId = setTimeout(handleEmailConfirmation, 100);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Mail className="h-5 w-5" />
                Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {status === "loading" && (
                <div className="space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-600">Verifying your email...</p>
                </div>
              )}

              {status === "success" && (
                <div className="space-y-3">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2">Email Verified!</h3>
                    <p className="text-gray-600">{message}</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-3">
                  <XCircle className="h-12 w-12 mx-auto text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Verification Issue</h3>
                    <p className="text-gray-600 text-sm">{message}</p>
                  </div>

                  {/* Debug information for development */}
                  {import.meta.env.DEV && (
                    <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <summary className="cursor-pointer font-medium">Debug Info (Dev Mode)</summary>
                      <div className="mt-2 space-y-1">
                        <p><strong>URL:</strong> {window.location.href}</p>
                        <p><strong>Hash:</strong> {window.location.hash || 'None'}</p>
                        <p><strong>Search:</strong> {window.location.search || 'None'}</p>
                      </div>
                    </details>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      Retry Verification
                    </Button>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="w-full"
                    >
                      Go to Login
                    </Button>
                    <Button
                      onClick={() => navigate('/register')}
                      variant="outline"
                      className="w-full"
                    >
                      Register Again
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t text-xs text-gray-500">
                <p>
                  Need help? Contact{" "}
                  <a 
                    href="mailto:support@rebookedsolutions.co.za" 
                    className="text-blue-600 hover:underline"
                  >
                    support@rebookedsolutions.co.za
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
