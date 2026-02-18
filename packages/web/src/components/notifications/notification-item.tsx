'use client';

import { AtSign, MessageSquare, Heart, Mail, CheckSquare } from 'lucide-react';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';

const typeIcons = {
  mention: AtSign,
  reply: MessageSquare,
  reaction: Heart,
  dm: Mail,
  task: CheckSquare,
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || MessageSquare;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer',
        !notification.read && 'bg-primary/5'
      )}
      onClick={() => !notification.read && onMarkRead?.(notification.id)}
    >
      <div className={cn(
        'mt-0.5 p-1.5 rounded-full',
        !notification.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.read && 'font-medium')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </div>
  );
}
