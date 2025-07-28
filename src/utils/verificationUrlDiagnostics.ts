export interface UrlDiagnostic {
  isValid: boolean;
  hasTokens: boolean;
  hasType: boolean;
  hasError: boolean;
  route: 'callback' | 'verify' | 'unknown';
  method: 'modern' | 'legacy' | 'unknown';
  issues: string[];
  recommendations: string[];
  tokens: {
    access_token?: string;
    refresh_token?: string;
    token_hash?: string;
    token?: string;
    type?: string;
    error?: string;
    error_description?: string;
  };
}

export function diagnoseVerificationUrl(url: string): UrlDiagnostic {
  const diagnostic: UrlDiagnostic = {
    isValid: false,
    hasTokens: false,
    hasType: false,
    hasError: false,
    route: 'unknown',
    method: 'unknown',
    issues: [],
    recommendations: [],
    tokens: {}
  };

  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
    
    // Extract all parameters
    const allParams = {
      ...Object.fromEntries(searchParams.entries()),
      ...Object.fromEntries(hashParams.entries())
    };

    diagnostic.tokens = {
      access_token: allParams.access_token,
      refresh_token: allParams.refresh_token,
      token_hash: allParams.token_hash,
      token: allParams.token,
      type: allParams.type,
      error: allParams.error,
      error_description: allParams.error_description
    };

    // Determine route
    if (urlObj.pathname.includes('/auth/callback')) {
      diagnostic.route = 'callback';
    } else if (urlObj.pathname.includes('/verify')) {
      diagnostic.route = 'verify';
    }

    // Check for errors
    if (diagnostic.tokens.error || diagnostic.tokens.error_description) {
      diagnostic.hasError = true;
      diagnostic.issues.push(`Supabase error: ${diagnostic.tokens.error_description || diagnostic.tokens.error}`);
    }

    // Check for type parameter
    if (diagnostic.tokens.type) {
      diagnostic.hasType = true;
      if (!['signup', 'recovery', 'email_change', 'email'].includes(diagnostic.tokens.type)) {
        diagnostic.issues.push(`Unknown verification type: ${diagnostic.tokens.type}`);
      }
    } else {
      diagnostic.issues.push('Missing "type" parameter - required for verification');
    }

    // Determine method and check tokens
    if (diagnostic.tokens.access_token && diagnostic.tokens.refresh_token) {
      diagnostic.method = 'modern';
      diagnostic.hasTokens = true;
      
      // Validate token format (basic check)
      if (!diagnostic.tokens.access_token.startsWith('eyJ')) {
        diagnostic.issues.push('Access token appears to be malformed (should start with "eyJ")');
      }
      
      if (diagnostic.route !== 'callback') {
        diagnostic.recommendations.push('Modern tokens should use /auth/callback route');
      }
    } else if (diagnostic.tokens.token_hash || diagnostic.tokens.token) {
      diagnostic.method = 'legacy';
      diagnostic.hasTokens = true;
      
      if (diagnostic.tokens.token_hash) {
        // Token hash should be a long string
        if (diagnostic.tokens.token_hash.length < 20) {
          diagnostic.issues.push('Token hash appears to be too short');
        }
      }
      
      if (diagnostic.tokens.token) {
        // Basic token validation
        if (diagnostic.tokens.token.length < 10) {
          diagnostic.issues.push('Token appears to be too short');
        }
      }
    } else {
      diagnostic.issues.push('No authentication tokens found (missing access_token/refresh_token or token_hash/token)');
    }

    // Overall validation
    diagnostic.isValid = diagnostic.hasTokens && diagnostic.hasType && !diagnostic.hasError;

    // Generate recommendations
    if (!diagnostic.isValid) {
      if (!diagnostic.hasTokens) {
        diagnostic.recommendations.push('Request a new verification email - this link is missing authentication tokens');
      }
      if (!diagnostic.hasType) {
        diagnostic.recommendations.push('The verification link is missing the "type" parameter');
      }
      if (diagnostic.hasError) {
        diagnostic.recommendations.push('The link contains an error from Supabase - try requesting a new verification email');
      }
    }

    if (diagnostic.route === 'unknown') {
      diagnostic.recommendations.push('URL should go to /auth/callback or /verify route');
    }

    if (diagnostic.method === 'legacy' && diagnostic.route === 'callback') {
      diagnostic.recommendations.push('Legacy tokens (token_hash/token) should typically use /verify route');
    }

    // Additional recommendations based on common issues
    if (Object.keys(allParams).length === 0) {
      diagnostic.recommendations.push('URL has no parameters at all - this is likely a corrupted link');
    }

    if (urlObj.hash && !urlObj.search) {
      diagnostic.recommendations.push('Parameters are in URL hash instead of query string - this might cause issues');
    }

  } catch (error) {
    diagnostic.issues.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    diagnostic.recommendations.push('Check that the URL is properly formatted and complete');
  }

  return diagnostic;
}

export function getVerificationFixSuggestions(diagnostic: UrlDiagnostic): string[] {
  const suggestions: string[] = [];

  if (!diagnostic.isValid) {
    suggestions.push('🔄 Request a new verification email from the registration page');
  }

  if (diagnostic.hasError) {
    suggestions.push('❌ This link contains an error - it cannot be fixed, you need a new one');
  }

  if (!diagnostic.hasTokens) {
    suggestions.push('🔗 Copy the verification link from your email (don\'t click it) and paste it in your browser');
    suggestions.push('📧 Check if you clicked the most recent verification email');
  }

  if (diagnostic.route === 'unknown') {
    suggestions.push('🌐 Make sure you\'re visiting the complete URL from the email');
  }

  if (diagnostic.method === 'unknown') {
    suggestions.push('🔐 The verification link format is not recognized - request a new email');
  }

  suggestions.push('🕵️ Try opening the link in an incognito/private browser window');
  suggestions.push('📱 Try using a different browser or device');

  return suggestions;
}

export function formatDiagnosticReport(diagnostic: UrlDiagnostic): string {
  const report = [];
  
  report.push(`🔍 VERIFICATION URL DIAGNOSTIC REPORT`);
  report.push(`==========================================`);
  report.push(`Overall Status: ${diagnostic.isValid ? '✅ VALID' : '❌ INVALID'}`);
  report.push(`Route: ${diagnostic.route}`);
  report.push(`Method: ${diagnostic.method}`);
  report.push(`Has Tokens: ${diagnostic.hasTokens ? '✅' : '❌'}`);
  report.push(`Has Type: ${diagnostic.hasType ? '✅' : '❌'}`);
  report.push(`Has Error: ${diagnostic.hasError ? '❌' : '✅'}`);
  
  if (diagnostic.issues.length > 0) {
    report.push(`\n🚨 ISSUES FOUND:`);
    diagnostic.issues.forEach((issue, i) => {
      report.push(`${i + 1}. ${issue}`);
    });
  }
  
  if (diagnostic.recommendations.length > 0) {
    report.push(`\n💡 RECOMMENDATIONS:`);
    diagnostic.recommendations.forEach((rec, i) => {
      report.push(`${i + 1}. ${rec}`);
    });
  }

  const suggestions = getVerificationFixSuggestions(diagnostic);
  if (suggestions.length > 0) {
    report.push(`\n🛠️ QUICK FIXES TO TRY:`);
    suggestions.forEach((suggestion, i) => {
      report.push(`${i + 1}. ${suggestion}`);
    });
  }
  
  return report.join('\n');
}
