import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'error' | 'warn' | 'log';
  message: string;
  args: any[];
  stack?: string;
}

export const ErrorMonitor: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Override console methods to capture errors
    console.error = (...args: any[]) => {
      const errorLog: ErrorLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'error',
        message: args.map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return arg.message;
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' '),
        args: args,
        stack: args.find(arg => arg instanceof Error)?.stack
      };
      
      setErrors(prev => [errorLog, ...prev.slice(0, 19)]); // Keep only last 20 errors
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const warnLog: ErrorLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'warn',
        message: args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' '),
        args: args
      };
      
      setErrors(prev => [warnLog, ...prev.slice(0, 19)]);
      originalWarn.apply(console, args);
    };

    // Cleanup function
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, [isMonitoring]);

  const clearErrors = () => {
    setErrors([]);
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setErrors([]); // Clear when starting monitoring
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const getTypeIcon = (type: 'error' | 'warn' | 'log') => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const hasObjectObjectError = errors.some(error => 
    error.message.includes('[object Object]') || 
    error.args.some(arg => String(arg).includes('[object Object]'))
  );

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Real-time Error Monitor
            {isMonitoring && (
              <Badge variant="secondary" className="animate-pulse">
                Monitoring
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMonitoring}
              size="sm"
              variant={isMonitoring ? "destructive" : "default"}
            >
              {isMonitoring ? "Stop" : "Start"} Monitoring
            </Button>
            <Button onClick={clearErrors} size="sm" variant="outline">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isMonitoring && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Start Monitoring" to track console errors in real-time</p>
            <p className="text-sm mt-1">Then click "Test Notification" to see any errors</p>
          </div>
        )}

        {isMonitoring && errors.length === 0 && (
          <div className="text-center py-8 text-green-600">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No errors detected! 🎉</p>
          </div>
        )}

        {hasObjectObjectError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <strong>⚠️ "[object Object]" errors detected!</strong>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`p-3 rounded border ${
                  error.type === 'error' 
                    ? 'bg-red-50 border-red-200' 
                    : error.type === 'warn'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(error.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {error.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(error.timestamp)}
                      </span>
                      {error.message.includes('[object Object]') && (
                        <Badge variant="destructive" className="text-xs">
                          [object Object]
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                      {error.message}
                    </div>
                    
                    {error.args.length > 1 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">
                          Show raw arguments ({error.args.length})
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {error.args.map((arg, i) => 
                            `Arg ${i}: ${typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}`
                          ).join('\n\n')}
                        </pre>
                      </details>
                    )}
                    
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">
                          Show stack trace
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorMonitor;
