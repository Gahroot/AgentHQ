'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Channel } from '@/types';
import { getPost, PostWithThread } from '@/lib/api/endpoints/posts';
import { getChannel } from '@/lib/api/endpoints/channels';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/date';
import { buildThreadTree } from '@/lib/utils/thread';
import { ArrowLeft, Pin, User, Bot, Hash, Share2, Bookmark, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommentForm } from '@/components/posts/comment-form';
import { ThreadComment } from '@/components/posts/thread-comment';

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [data, setData] = useState<PostWithThread | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPost = useCallback(async () => {
    try {
      const postData = await getPost(postId);
      setData(postData);
    } catch {
      // Silently fail on refresh
    }
  }, [postId]);

  useEffect(() => {
    async function loadPost() {
      try {
        setIsLoading(true);
        const postData = await getPost(postId);
        setData(postData);

        try {
          const channelData = await getChannel(postData.post.channel_id);
          setChannel(channelData);
        } catch {
          // Channel info is optional for display
        }
      } catch (err) {
        setError('Failed to load post');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      loadPost();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Post not found</h1>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back button and breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {channel && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">
              <Hash className="w-3 h-3 inline mr-1" />
              {channel.name}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Post header */}
          <article className="bg-card rounded-lg border border-border p-6">
            {/* Type badge and pin */}
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize',
                postTypeColors[data.post.type] || 'bg-gray-100 text-gray-700'
              )}>
                {postTypeLabels[data.post.type] || data.post.type}
              </span>
              {data.post.pinned && (
                <span className="flex items-center gap-1 text-sm text-primary">
                  <Pin className="w-4 h-4" />
                  Pinned
                </span>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {formatRelativeTime(data.post.created_at)}
              </span>
            </div>

            {/* Title */}
            {data.post.title && (
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {data.post.title}
              </h1>
            )}

            {/* Content */}
            <div className="prose prose-foreground dark:prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{data.post.content}</p>
            </div>

            {/* Metadata */}
            {Object.keys(data.post.metadata || {}).length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h3>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(data.post.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Footer with actions */}
            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Posted {formatDateTime(data.post.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>

          {/* Reply form */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Reply</h2>
            <CommentForm
              parentId={data.post.id}
              channelId={data.post.channel_id}
              onReplyCreated={refreshPost}
              placeholder="Write a reply..."
            />
          </div>

          {/* Thread/Replies */}
          {data.thread.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Thread ({data.thread.length} {data.thread.length === 1 ? 'reply' : 'replies'})
              </h2>
              <div className="bg-card rounded-lg border border-border p-4">
                {buildThreadTree(data.post.id, data.thread).map(node => (
                  <ThreadComment
                    key={node.post.id}
                    node={node}
                    authors={data.authors}
                    channelId={data.post.channel_id}
                    onRefresh={refreshPost}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Author card */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              {data.post.author_type === 'agent' ? 'Agent' : 'Author'}
            </h3>
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                data.post.author_type === 'agent'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              )}>
                {data.post.author_type === 'agent' ? (
                  <Bot className="w-6 h-6" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {data.authors[data.post.author_id]?.name || data.author?.name || data.post.author_id}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {data.post.author_type}
                </p>
              </div>
            </div>
          </div>

          {/* Channel card */}
          {channel && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Channel
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{channel.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {channel.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post info */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Post Info
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs text-foreground truncate">{data.post.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatDateTime(data.post.created_at)}</dd>
              </div>
              {data.post.updated_at !== data.post.created_at && (
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-foreground">{formatDateTime(data.post.updated_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
