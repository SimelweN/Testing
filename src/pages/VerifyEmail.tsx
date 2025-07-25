import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔐 Handling email confirmation...');
        
        // Get the current URL hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        console.log('📧 URL Hash:', window.location.hash);
        console.log('📧 URL Search:', window.location.search);

        // Check for access_token and refresh_token in hash (email confirmation)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');
        const type = hashParams.get('type') || urlParams.get('type');

        if (accessToken && refreshToken && type === 'signup') {
          console.log('✅ Email confirmation tokens found');
          
          // Set the session with the tokens from the email link
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            setStatus('error');
            setMessage('Email verification failed. Please try again or contact support.');
            return;
          }

          if (data.user) {
            console.log('✅ Email verified successfully for user:', data.user.email);
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
            
            toast.success('✅ Email verified successfully!');
            
            // Redirect to login page after a short delay
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

        // If no tokens found, show instructions
        console.log('ℹ️ No verification tokens found in URL');
        setStatus('error');
        setMessage('No verification link detected. Please click the link in your email.');
        
      } catch (error) {
        console.error('❌ Email verification error:', error);
        setStatus('error');
        setMessage('Email verification failed. Please try again.');
      }
    };

    handleEmailConfirmation();
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
                    <p className="text-gray-600">{message}</p>
                  </div>
                  <div className="space-y-2">
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
                      Try Again
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
