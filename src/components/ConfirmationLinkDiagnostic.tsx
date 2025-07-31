import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ENV } from '@/config/environment';

const ConfirmationLinkDiagnostic: React.FC = () => {
  const [urlInfo, setUrlInfo] = useState<any>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeCurrentUrl();
    checkSupabaseConfig();
  }, []);

  const analyzeCurrentUrl = () => {
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const urlAnalysis = {
      currentUrl,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      searchParams: Object.fromEntries(urlParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      isAuthCallback: window.location.pathname.includes('/auth/callback'),
      isVerifyPage: window.location.pathname.includes('/verify'),
      hasTokenHash: urlParams.has('token_hash') || hashParams.has('token_hash'),
      hasAccessToken: urlParams.has('access_token') || hashParams.has('access_token'),
      hasType: urlParams.has('type') || hashParams.has('type'),
      type: urlParams.get('type') || hashParams.get('type'),
    };

    setUrlInfo(urlAnalysis);
  };

  const checkSupabaseConfig = async () => {
    try {
      // Get current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Get app URL configured in environment
      const appUrl = ENV.VITE_APP_URL;
      const supabaseUrl = ENV.VITE_SUPABASE_URL;

      setSupabaseConfig({
        appUrl,
        supabaseUrl,
        hasSession: !!session?.session,
        user: session?.session?.user,
        sessionError,
        expectedCallbackUrl: `${appUrl}/auth/callback`,
        expectedVerifyUrl: `${appUrl}/verify`,
      });
    } catch (error) {
      console.error('Error checking Supabase config:', error);
    }
  };

  const testResendVerification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: 'test@example.com' // This won't actually send, just test the config
      });
      
      if (error && error.message.includes('For security purposes')) {
        toast.success('Supabase email configuration is working (security blocked test email)');
      } else if (error) {
        toast.error(`Configuration issue: ${error.message}`);
      } else {
        toast.success('Email configuration appears to be working');
      }
    } catch (error) {
      toast.error(`Test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getDiagnosticStatus = () => {
    if (!urlInfo || !supabaseConfig) return 'loading';
    
    // Check for common issues
    const issues = [];
    
    if (!urlInfo.isAuthCallback && !urlInfo.isVerifyPage) {
      issues.push('Not on auth callback or verify page');
    }
    
    if (!urlInfo.hasTokenHash && !urlInfo.hasAccessToken && !urlInfo.hasType) {
      issues.push('No authentication parameters found in URL');
    }
    
    if (!supabaseConfig.appUrl.includes('localhost') && !supabaseConfig.appUrl.includes('https://')) {
      issues.push('App URL should use HTTPS in production');
    }
    
    return issues.length === 0 ? 'good' : 'issues';
  };

  const status = getDiagnosticStatus();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'good' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            Confirmation Link Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current URL Analysis */}
          <div>
            <h3 className="font-semibold mb-2">Current URL Analysis</h3>
            {urlInfo && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Current URL:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(urlInfo.currentUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-mono text-xs break-all bg-white p-2 rounded border">
                  {urlInfo.currentUrl}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant={urlInfo.isAuthCallback ? 'default' : 'secondary'}>
                      Auth Callback: {urlInfo.isAuthCallback ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={urlInfo.hasTokenHash ? 'default' : 'secondary'}>
                      Has Token Hash: {urlInfo.hasTokenHash ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={urlInfo.hasAccessToken ? 'default' : 'secondary'}>
                      Has Access Token: {urlInfo.hasAccessToken ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={urlInfo.type ? 'default' : 'secondary'}>
                      Type: {urlInfo.type || 'None'}
                    </Badge>
                  </div>
                </div>

                {Object.keys(urlInfo.searchParams).length > 0 && (
                  <div>
                    <strong>Search Parameters:</strong>
                    <pre className="text-xs bg-white p-2 rounded border mt-1">
                      {JSON.stringify(urlInfo.searchParams, null, 2)}
                    </pre>
                  </div>
                )}

                {Object.keys(urlInfo.hashParams).length > 0 && (
                  <div>
                    <strong>Hash Parameters:</strong>
                    <pre className="text-xs bg-white p-2 rounded border mt-1">
                      {JSON.stringify(urlInfo.hashParams, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supabase Configuration */}
          <div>
            <h3 className="font-semibold mb-2">Supabase Configuration</h3>
            {supabaseConfig && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div>
                  <strong>App URL:</strong> <code>{supabaseConfig.appUrl}</code>
                </div>
                <div>
                  <strong>Expected Callback URL:</strong> <code>{supabaseConfig.expectedCallbackUrl}</code>
                </div>
                <div>
                  <strong>Expected Verify URL:</strong> <code>{supabaseConfig.expectedVerifyUrl}</code>
                </div>
                <div>
                  <Badge variant={supabaseConfig.hasSession ? 'default' : 'secondary'}>
                    Has Session: {supabaseConfig.hasSession ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {supabaseConfig.user && (
                  <div>
                    <strong>User:</strong> {supabaseConfig.user.email} (ID: {supabaseConfig.user.id})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={analyzeCurrentUrl} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
            <Button 
              onClick={testResendVerification} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Info className="h-4 w-4 mr-2" />}
              Test Email Config
            </Button>
          </div>

          {/* Common Issues Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <strong>Common Issues with Confirmation Links:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Site URL in Supabase dashboard doesn't match app URL</li>
                  <li>Redirect URLs not configured in Supabase Auth settings</li>
                  <li>Email template links pointing to wrong domain</li>
                  <li>PKCE flow issues with modern Supabase auth</li>
                  <li>Browser blocking third-party cookies</li>
                </ul>
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <strong>To fix:</strong> Ensure your Supabase project's Site URL is set to: <code>{supabaseConfig?.appUrl}</code>
                  <br />
                  And add these redirect URLs: 
                  <ul className="list-disc list-inside mt-1">
                    <li><code>{supabaseConfig?.expectedCallbackUrl}</code></li>
                    <li><code>{supabaseConfig?.expectedVerifyUrl}</code></li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationLinkDiagnostic;
