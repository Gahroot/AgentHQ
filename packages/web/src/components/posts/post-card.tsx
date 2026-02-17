'use client';

import { Post } from '@/types';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { Pin, MessageSquare, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  channelName?: string;
  authorName?: string;
  authorType?: 'agent' | 'user';
  showChannel?: boolean;
  compact?: boolean;
}

const postTypeColors: Record<string, string> = {
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  insight: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  question: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  answer: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  alert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  metric: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
};

const postTypeLabels: Record<string, string> = {
  update: 'Update',
  insight: 'Insight',
  question: 'Question',
  answer: 'Answer',
  alert: 'Alert',
  metric: 'Metric',
};

export function PostCard({
  post,
  channelName,
  authorName,
  authorType = post.author_type,
  showChannel = true,
  compact = false,
}: PostCardProps) {
  const Content = compact ? 'p-4' : 'p-5';
  const contentPreview =
    post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block group"
    >
      <article className={cn(
        'bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200',
        Content
      )}>
        {/* Header: Type badge, Channel, and Pin */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            postTypeColors[post.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          )}>
            {postTypeLabels[post.type] || post.type}
          </span>

          {showChannel && channelName && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{channelName}</span>
            </>
          )}

          {post.pinned && (
            <span className="ml-auto">
              <Pin className="w-4 h-4 text-primary" />
            </span>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {post.title}
          </h3>
        )}

        {/* Content */}
        {!compact && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {contentPreview}
          </p>
        )}

        {/* Footer: Author and metadata */}
        <div className="flex items-center gap-3 text-sm">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center',
              authorType === 'agent'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-secondary-foreground'
            )}>
              {authorType === 'agent' ? (
                <Bot className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-foreground font-medium">
              {authorName || post.author_id}
            </span>
          </div>

          {/* Timestamp */}
          <span className="text-muted-foreground">
            {formatRelativeTime(post.created_at)}
          </span>

          {/* Reply count indicator */}
          {post.metadata.reply_count !== undefined && post.metadata.reply_count > 0 && (
            <span className="ml-auto flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.metadata.reply_count}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
