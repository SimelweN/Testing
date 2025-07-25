export interface EmailServiceHealth {
  status: 'operational' | 'degraded' | 'down';
  message: string;
  lastChecked: Date;
  canRegister: boolean;
  canSendEmails: boolean;
}

export class EmailServiceHealthChecker {
  private static lastCheck: EmailServiceHealth | null = null;
  private static checkInterval = 5 * 60 * 1000; // 5 minutes

  static async checkHealth(): Promise<EmailServiceHealth> {
    // Return cached result if recent
    if (this.lastCheck && 
        (Date.now() - this.lastCheck.lastChecked.getTime()) < this.checkInterval) {
      return this.lastCheck;
    }

    try {
      // For now, assume registration is always possible with fallback method
      // In a real implementation, you might ping a health endpoint
      
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        this.lastCheck = {
          status: 'operational',
          message: 'Development mode - email confirmation disabled',
          lastChecked: new Date(),
          canRegister: true,
          canSendEmails: false
        };
      } else {
        // Assume email service is having issues but registration works with fallback
        this.lastCheck = {
          status: 'degraded',
          message: 'Email confirmation temporarily unavailable - accounts created without verification',
          lastChecked: new Date(),
          canRegister: true,
          canSendEmails: false
        };
      }

      return this.lastCheck;
    } catch (error) {
      console.warn('Email service health check failed:', error);
      
      this.lastCheck = {
        status: 'down',
        message: 'Unable to determine email service status',
        lastChecked: new Date(),
        canRegister: true, // Still allow registration with fallback
        canSendEmails: false
      };

      return this.lastCheck;
    }
  }

  static getHealthIcon(status: EmailServiceHealth['status']): string {
    switch (status) {
      case 'operational': return '🟢';
      case 'degraded': return '🟡';
      case 'down': return '🔴';
      default: return '⚪';
    }
  }

  static getHealthColor(status: EmailServiceHealth['status']): string {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}
