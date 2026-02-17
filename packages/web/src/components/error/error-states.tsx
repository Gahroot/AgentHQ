'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import Link from 'next/link';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'network';
}

export function InlineError({ message, onRetry, type = 'error' }: InlineErrorProps) {
  const Icon = type === 'network' ? WifiOff : AlertCircle;
  const iconColor = type === 'network' ? 'text-amber-500' : 'text-destructive';
  const bgColor = type === 'network' ? 'bg-amber-500/10' : 'bg-destructive/10';

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
      <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface FullPageErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function FullPageError({
  title,
  message,
  onRetry,
  showHomeButton = true,
}: FullPageErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{title || 'Error'}</h2>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <div className="flex gap-3">
              {onRetry && (
                <Button onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {showHomeButton && (
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotFoundProps {
  resource?: string;
}

export function NotFound({ resource = 'page' }: NotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="text-6xl font-bold text-muted-foreground">404</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Not Found</h2>
              <p className="text-muted-foreground">
                The {resource} you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
