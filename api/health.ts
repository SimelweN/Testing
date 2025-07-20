import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient, handleCORS } from './_lib/utils.js';
import type { APIResponse } from './types';

interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'error';
    paystack: 'configured' | 'missing';
  };
  version: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<APIResponse<HealthCheckData>>
) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  // Allow both GET and POST for health checks
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
    });
  }

  try {
    const timestamp = new Date().toISOString();
    let databaseStatus: 'connected' | 'error' = 'error';
    
    // Test database connection
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      databaseStatus = error ? 'error' : 'connected';
    } catch {
      databaseStatus = 'error';
    }

    // Check if Paystack is configured
    const paystackStatus = process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'missing';

    const isHealthy = databaseStatus === 'connected' && paystackStatus === 'configured';

    const healthData: HealthCheckData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: databaseStatus,
        paystack: paystackStatus,
      },
      version: '1.0.0',
    };

    const statusCode = isHealthy ? 200 : 503;

    return res.status(statusCode).json({
      success: isHealthy,
      data: healthData,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'error',
          paystack: 'missing',
        },
        version: '1.0.0',
      } as HealthCheckData,
    });
  }
}
