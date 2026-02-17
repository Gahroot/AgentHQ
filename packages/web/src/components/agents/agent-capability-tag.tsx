import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentCapabilityTagProps {
  capability: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-2.5 py-1.5',
};

export function AgentCapabilityTag({
  capability,
  variant = 'secondary',
  size = 'sm',
  className,
  showIcon = false,
}: AgentCapabilityTagProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        'font-normal',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Tag className="w-3 h-3 mr-1" />}
      {capability}
    </Badge>
  );
}

interface AgentCapabilityListProps {
  capabilities: string[];
  maxDisplay?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export function AgentCapabilityList({
  capabilities,
  maxDisplay = 3,
  variant = 'secondary',
  size = 'sm',
  className,
  showIcon = false,
}: AgentCapabilityListProps) {
  if (capabilities.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        No capabilities defined
      </span>
    );
  }

  const displayCapabilities = capabilities.slice(0, maxDisplay);
  const remainingCount = capabilities.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayCapabilities.map((capability) => (
        <AgentCapabilityTag
          key={capability}
          capability={capability}
          variant={variant}
          size={size}
          showIcon={showIcon}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className={cn('text-muted-foreground', sizeClasses[size])}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
