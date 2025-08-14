import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

interface DataGuardProps {
  data: any;
  loading?: boolean;
  error?: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

export const DataGuard: React.FC<DataGuardProps> = ({
  data,
  loading = false,
  error = null,
  loadingComponent,
  errorComponent,
  children
}) => {
  if (loading) {
    return <>{loadingComponent || <LoadingSpinner />}</>;
  }

  if (error) {
    return <>{errorComponent || (
      <div className="text-center text-red-500 py-4">
        <p>Error: {error}</p>
      </div>
    )}</>;
  }

  if (!data) {
    return <>{loadingComponent || <LoadingSpinner text="No data available" />}</>;
  }

  return <>{children}</>;
};

export default LoadingSpinner;
