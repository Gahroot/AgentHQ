'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Channel, Post } from '@/types';
import { getChannel } from '@/lib/api/endpoints/channels';
import { listPosts, createPost } from '@/lib/api/endpoints/posts';
import { formatRelativeTime } from '@/lib/utils/date';
import { ArrowLeft, Loader2, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/zustand/auth-store';

export default function DMThreadPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;
  const currentUser = useAuthStore((s) => s.user);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Load channel info
  useEffect(() => {
    async function loadChannel() {
      try {
        setIsLoading(true);
        const channelData = await getChannel(channelId);
        setChannel(channelData);
      } catch {
        setError('Conversation not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (channelId) loadChannel();
  }, [channelId]);

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      const data = await listPosts({ channel_id: channelId }, 1, 50);
      setPosts(data.posts);
    } catch {
    } finally {
      setIsLoadingPosts(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (channelId) loadPosts();
  }, [channelId, loadPosts]);

  // Auto-refresh posts
  useEffect(() => {
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const newPost = await createPost({
        channel_id: channelId,
        content: message.trim(),
        type: 'update',
      });
      setPosts((prev) => [...prev, newPost]);
      setMessage('');
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        <h1 className="text-2xl font-semibold text-foreground">Conversation not found</h1>
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <button
          onClick={() => router.push('/dm')}
          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground truncate">{channel.name}</h1>
          {channel.description && (
            <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoadingPosts && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          posts.map((post) => {
            const isOwnMessage = post.author_id === currentUser?.id;
            return (
              <div
                key={post.id}
                className={cn(
                  'flex items-start gap-3',
                  isOwnMessage && 'flex-row-reverse'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  post.author_type === 'agent'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-secondary-foreground'
                )}>
                  {post.author_type === 'agent' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={cn(
                  'max-w-[70%] rounded-lg px-4 py-2',
                  isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {formatRelativeTime(post.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose */}
      <div className="border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none min-h-[40px] max-h-[120px] text-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
