import { Badge } from '@/components/ui/badge';
import {
  AgentHealthStatus,
  getHealthBadgeClass,
  getHealthColorClass,
  getHealthDescription,
} from '@/lib/utils/agent-health';
import { Sparkles, Heart, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const healthIcons = {
  thriving: Sparkles,
  healthy: Heart,
  struggling: AlertTriangle,
  stale: Clock,
  offline: XCircle,
};

interface HealthBadgeProps {
  status: AgentHealthStatus;
  score?: number;
  showScore?: boolean;
  showDescription?: boolean;
  variant?: 'default' | 'simple' | 'detailed';
  className?: string;
}

export function HealthBadge({
  status,
  score,
  showScore = false,
  showDescription = false,
  variant = 'default',
  className,
}: HealthBadgeProps) {
  const Icon = healthIcons[status];

  if (variant === 'simple') {
    return (
      <Badge className={cn(getHealthBadgeClass(status), className)} variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium', getHealthBadgeClass(status))}>
          <Icon className="w-3.5 h-3.5" />
          <span className="capitalize">{status}</span>
          {showScore && typeof score === 'number' && (
            <span className="ml-1 opacity-75">({score}/100)</span>
          )}
        </div>
        {showDescription && (
          <span className="text-xs text-muted-foreground">{getHealthDescription(status)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium', getHealthBadgeClass(status))}>
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{status}</span>
        {showScore && typeof score === 'number' && (
          <span className="ml-1 opacity-75">({score})</span>
        )}
      </div>
    </div>
  );
}

// Score display component with visual indicator
interface HealthScoreProps {
  score: number;
  status: AgentHealthStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HealthScore({ score, status, size = 'md', className }: HealthScoreProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Background circle */}
      <div className={cn('rounded-full border-4 flex items-center justify-center', sizeClasses[size])}>
        <span className={cn('font-bold', getHealthColorClass(status))}>{score}</span>
      </div>
      {/* Progress ring indicator */}
      <svg className={cn('absolute top-0 left-0', sizeClasses[size])} viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted opacity-20"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className={getHealthColorClass(status)}
          strokeDasharray={`${(score / 100) * 175.93} 175.93`}
          transform="rotate(-90 32 32)"
        />
      </svg>
    </div>
  );
}
