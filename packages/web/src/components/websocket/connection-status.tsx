/**
 * Connection status indicator
 * Shows WebSocket connection state with color-coded dot
 */

'use client';

import { useWebSocketStore } from '@/lib/zustand/ws-store';
import { cn } from '@/lib/utils';

const statusConfig = {
  connected: {
    label: 'Connected',
    color: 'bg-green-500',
    pulse: true,
  },
  connecting: {
    label: 'Connecting...',
    color: 'bg-yellow-500',
    pulse: true,
  },
  disconnected: {
    label: 'Disconnected',
    color: 'bg-red-500',
    pulse: false,
  },
  error: {
    label: 'Connection Error',
    color: 'bg-red-500',
    pulse: true,
  },
};

export interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatus({ className, showLabel = false }: ConnectionStatusProps) {
  const connectionState = useWebSocketStore((s) => s.connectionState);
  const config = statusConfig[connectionState];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            config.color
          )}
        />
        {config.pulse && (
          <div
            className={cn(
              'absolute inset-0 h-2 w-2 rounded-full animate-ping',
              config.color
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
