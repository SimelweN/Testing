// Production optimization configuration
export const PRODUCTION_SETTINGS = {
  // Performance optimizations
  PERFORMANCE: {
    // Debounce search queries (ms)
    SEARCH_DEBOUNCE: 300,
    
    // Cache duration for API responses (ms)
    CACHE_DURATION: {
      books: 5 * 60 * 1000, // 5 minutes
      profile: 10 * 60 * 1000, // 10 minutes
      notifications: 2 * 60 * 1000, // 2 minutes
    },
    
    // Pagination settings
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Image optimization
    IMAGE_QUALITY: 85,
    IMAGE_MAX_WIDTH: 800,
    IMAGE_MAX_HEIGHT: 600,
  },

  // Security configurations
  SECURITY: {
    // Session timeout (ms)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    
    // Rate limiting (requests per minute)
    RATE_LIMITS: {
      auth: 5,
      search: 30,
      upload: 10,
      general: 60,
    },
    
    // CORS settings
    ALLOWED_ORIGINS: [
      'https://rebookedsolutions.co.za',
      'https://www.rebookedsolutions.co.za',
    ],
  },

  // Analytics and monitoring
  MONITORING: {
    // Error reporting
    ENABLE_ERROR_REPORTING: true,
    
    // Performance monitoring
    ENABLE_PERFORMANCE_MONITORING: true,
    
    // User analytics
    ENABLE_USER_ANALYTICS: true,
    
    // Track critical user flows
    CRITICAL_FLOWS: [
      'user_registration',
      'book_purchase',
      'book_listing',
      'payment_process',
    ],
  },

  // SEO and metadata
  SEO: {
    SITE_NAME: 'ReBooked Solutions',
    SITE_DESCRIPTION: 'Buy and sell new and used books through our secure platform in South Africa',
    SITE_URL: 'https://rebookedsolutions.co.za',
    SOCIAL_IMAGE: '/og-image.jpg',
    
    // Structured data
    ORGANIZATION: {
      name: 'ReBooked Solutions',
      url: 'https://rebookedsolutions.co.za',
      logo: 'https://rebookedsolutions.co.za/logo.png',
      contactPoint: {
        telephone: '+27-XX-XXX-XXXX',
        contactType: 'customer service',
        availableLanguage: ['English', 'Afrikaans'],
      },
    },
  },

  // Feature flags for production
  FEATURES: {
    // Enable/disable features in production
    GOOGLE_MAPS: true,
    PAYMENT_PROCESSING: true,
    EMAIL_NOTIFICATIONS: true,
    SMS_NOTIFICATIONS: false, // Not implemented yet
    SOCIAL_LOGIN: false, // Not implemented yet
    BULK_UPLOAD: false, // Admin feature
    ANALYTICS_DASHBOARD: false, // Admin feature
  },
} as const;

// Production validation function
export const validateProductionConfig = () => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check environment variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
    warnings.push('VITE_PAYSTACK_PUBLIC_KEY is not set - payment features will be disabled');
  }

  // Check optional features
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set - map features will be limited');
  }

  // Log results
  if (errors.length > 0) {
    console.error('🚨 Production Configuration Errors:', errors);
    return false;
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Production Configuration Warnings:', warnings);
  }

  console.log('✅ Production configuration validated successfully');
  return true;
};

// Export production-ready defaults
export const PRODUCTION_DEFAULTS = {
  theme: 'light',
  language: 'en',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
} as const;
