export interface EmailError {
  type: 'supabase_email' | 'smtp' | 'network' | 'unknown';
  message: string;
  originalError: any;
  suggestions: string[];
}

export class EmailErrorHandler {
  static categorizeEmailError(error: any): EmailError {
    const errorMessage = error?.message || String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Supabase email service errors
    if (lowerMessage.includes('error sending confirmation email') || 
        lowerMessage.includes('email confirmation') ||
        lowerMessage.includes('supabase') && lowerMessage.includes('email')) {
      return {
        type: 'supabase_email',
        message: 'Supabase email service is temporarily unavailable',
        originalError: error,
        suggestions: [
          'Wait 5-10 minutes and try again',
          'Check Supabase dashboard for email service status',
          'Verify SMTP configuration in Supabase',
          'Consider using a backup email service'
        ]
      };
    }

    // SMTP related errors
    if (lowerMessage.includes('smtp') || 
        lowerMessage.includes('mail server') ||
        lowerMessage.includes('email delivery')) {
      return {
        type: 'smtp',
        message: 'Email server configuration issue',
        originalError: error,
        suggestions: [
          'Check SMTP server settings',
          'Verify email service credentials',
          'Contact email service provider',
          'Try again in a few minutes'
        ]
      };
    }

    // Network related errors
    if (lowerMessage.includes('network') || 
        lowerMessage.includes('connection') ||
        lowerMessage.includes('timeout')) {
      return {
        type: 'network',
        message: 'Network connectivity issue affecting email service',
        originalError: error,
        suggestions: [
          'Check internet connection',
          'Try again in a few minutes',
          'Contact support if issue persists'
        ]
      };
    }

    // Generic email error
    return {
      type: 'unknown',
      message: 'Unknown email service error',
      originalError: error,
      suggestions: [
        'Try again in a few minutes',
        'Use a different email address',
        'Contact support for assistance'
      ]
    };
  }

  static getUserFriendlyMessage(error: any): string {
    const categorized = this.categorizeEmailError(error);
    
    switch (categorized.type) {
      case 'supabase_email':
        return 'Our email confirmation service is temporarily experiencing issues. Please try again in a few minutes.';
      
      case 'smtp':
        return 'There\'s a temporary issue with our email delivery system. Please try again shortly.';
      
      case 'network':
        return 'Network connectivity is affecting email delivery. Please check your connection and try again.';
      
      default:
        return 'Email service is temporarily unavailable. Please try again in a few minutes or contact support.';
    }
  }

  static logError(error: any, context: string): void {
    const categorized = this.categorizeEmailError(error);
    
    console.group(`📧 Email Error - ${context}`);
    console.error('Error Type:', categorized.type);
    console.error('User Message:', categorized.message);
    console.error('Original Error:', categorized.originalError);
    console.error('Suggestions:', categorized.suggestions);
    console.groupEnd();
  }
}
