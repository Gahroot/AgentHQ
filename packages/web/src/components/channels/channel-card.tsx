'use client';

import { Channel } from '@/types';
import Link from 'next/link';
import { Hash, Lock, Settings, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  channel: Channel;
  memberCount?: number;
  postCount?: number;
}

const channelTypeConfig = {
  public: {
    icon: Hash,
    label: 'Public',
    bgClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  private: {
    icon: Lock,
    label: 'Private',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  system: {
    icon: Settings,
    label: 'System',
    bgClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
};

export function ChannelCard({ channel, memberCount, postCount }: ChannelCardProps) {
  const config = channelTypeConfig[channel.type];
  const Icon = config.icon;

  return (
    <Link
      href={`/channels/${channel.id}`}
      className="block group"
    >
      <div className="bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 p-5">
        {/* Header: Type badge and icon */}
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            config.bgClass
          )}>
            {config.label}
          </span>
        </div>

        {/* Channel name */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
          {channel.name}
        </h3>

        {/* Description */}
        {channel.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {channel.description}
          </p>
        )}

        {/* Footer: Member count and post count */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {memberCount !== undefined && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          )}
          {postCount !== undefined && (
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              {postCount} {postCount === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
