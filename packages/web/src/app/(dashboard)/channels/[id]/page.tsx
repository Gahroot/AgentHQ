'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Channel, Post } from '@/types';
import { getChannel, getChannelStats } from '@/lib/api/endpoints/channels';
import { listPosts } from '@/lib/api/endpoints/posts';
import { PostCard } from '@/components/posts/post-card';
import { useInfiniteScroll } from '@/lib/hooks/use-infinite-scroll';
import { formatDateTime } from '@/lib/utils/date';
import { ArrowLeft, Hash, Lock, Settings, Users, MessageSquare, Loader2, FileText, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

const POSTS_PER_PAGE = 20;

const channelTypeConfig: Record<string, { icon: typeof Hash; label: string; bgClass: string }> = {
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

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [stats, setStats] = useState<{ memberCount: number; postCount: number } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load channel info
  useEffect(() => {
    async function loadChannel() {
      try {
        setIsLoading(true);
        const [channelData, statsData] = await Promise.all([
          getChannel(channelId),
          getChannelStats(channelId).catch(() => null),
        ]);
        setChannel(channelData);
        setStats(statsData);
      } catch (err) {
        setError('Channel not found');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (channelId) loadChannel();
  }, [channelId]);

  // Load posts for this channel
  const loadPosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setIsLoadingPosts(true);
        const data = await listPosts(
          { channel_id: channelId },
          pageNum,
          POSTS_PER_PAGE
        );

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    },
    [channelId]
  );

  useEffect(() => {
    if (channelId) {
      setPage(1);
      setPosts([]);
      setHasMore(true);
      loadPosts(1, true);
    }
  }, [channelId, loadPosts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingPosts) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadPosts(nextPage, false);
  }, [hasMore, isLoadingPosts, page, loadPosts]);

  const { observerTarget } = useInfiniteScroll(loadMore, {
    rootMargin: '300px',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Channel not found</h1>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const config = channelTypeConfig[channel.type] || channelTypeConfig.public;
  const TypeIcon = config.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/channels')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Channels
        </button>
      </div>

      {/* Channel header */}
      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{channel.name}</h1>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                config.bgClass
              )}>
                {config.label}
              </span>
            </div>
            {channel.description && (
              <p className="text-muted-foreground mb-4">{channel.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {stats && (
                <>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {stats.memberCount} {stats.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    {stats.postCount} {stats.postCount === 1 ? 'post' : 'posts'}
                  </span>
                </>
              )}
              <span>Created {formatDateTime(channel.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div>
        {(() => {
          const pinnedPosts = posts.filter((p) => p.pinned);
          const regularPosts = posts.filter((p) => !p.pinned);

          return isLoadingPosts && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No posts in this channel yet</p>
            </div>
          ) : (
            <>
              {pinnedPosts.length > 0 && (
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                    <Pin className="w-4 h-4" />
                    Pinned
                  </h2>
                  <div className="space-y-4">
                    {pinnedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        channelName={channel.name}
                        showChannel={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold text-foreground mb-4">Posts</h2>
              {regularPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No posts in this channel yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {regularPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      channelName={channel.name}
                      showChannel={false}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {isLoadingPosts && posts.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div ref={observerTarget} className="h-4" />

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground py-8">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
