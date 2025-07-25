export interface SupabaseEmailConfig {
  isConfigured: boolean;
  issues: string[];
  suggestions: string[];
}

export class SupabaseEmailChecker {
  static async checkConfiguration(): Promise<SupabaseEmailConfig> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check basic environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      issues.push("Missing Supabase environment variables");
      suggestions.push("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
    }

    // The main issue is likely in Supabase dashboard configuration
    issues.push("Supabase email service not configured");
    
    suggestions.push(
      "1. Go to Supabase Dashboard → Authentication → Settings",
      "2. Configure SMTP settings:",
      "   - SMTP Host (e.g., smtp.gmail.com for Gmail)",
      "   - SMTP Port (typically 587 for TLS)",
      "   - SMTP Username (your email)",
      "   - SMTP Password (app password for Gmail)",
      "3. Enable 'Confirm email' in Auth settings",
      "4. Set 'Site URL' to your domain",
      "5. Add your domain to 'Redirect URLs'",
      "6. Test email templates in Authentication → Templates"
    );

    return {
      isConfigured: issues.length === 0,
      issues,
      suggestions
    };
  }

  static getEmailProviderInstructions(): Record<string, string[]> {
    return {
      "Gmail": [
        "1. Enable 2-factor authentication on your Gmail account",
        "2. Generate an App Password:",
        "   - Go to Google Account → Security → 2-Step Verification → App passwords",
        "   - Select 'Mail' and generate password",
        "3. Use these settings in Supabase:",
        "   - SMTP Host: smtp.gmail.com",
        "   - SMTP Port: 587",
        "   - SMTP User: your-email@gmail.com",
        "   - SMTP Password: the generated app password"
      ],
      "SendGrid": [
        "1. Create a SendGrid account and verify your domain",
        "2. Create an API key with 'Mail Send' permissions",
        "3. Use these settings in Supabase:",
        "   - SMTP Host: smtp.sendgrid.net",
        "   - SMTP Port: 587",
        "   - SMTP User: apikey",
        "   - SMTP Password: your-sendgrid-api-key"
      ],
      "Mailgun": [
        "1. Create a Mailgun account and add your domain",
        "2. Get your SMTP credentials from the domain settings",
        "3. Use these settings in Supabase:",
        "   - SMTP Host: smtp.mailgun.org",
        "   - SMTP Port: 587",
        "   - SMTP User: your-mailgun-username",
        "   - SMTP Password: your-mailgun-password"
      ]
    };
  }
}
