'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/types';
import { listChannels, listChannelsByType, getChannelStats } from '@/lib/api/endpoints/channels';
import { ChannelCard } from '@/components/channels/channel-card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChannelType = 'all' | 'public' | 'private' | 'system';

const typeFilters: { value: ChannelType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'system', label: 'System' },
];

interface ChannelWithStats extends Channel {
  memberCount?: number;
  postCount?: number;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChannelType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchChannels = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = activeFilter === 'all'
        ? await listChannels(1, 50)
        : await listChannelsByType(activeFilter, 1, 50);

      // Fetch stats for each channel
      const channelsWithStats = await Promise.all(
        result.channels.map(async (channel) => {
          try {
            const stats = await getChannelStats(channel.id);
            return { ...channel, ...stats };
          } catch {
            return { ...channel, memberCount: 0, postCount: 0 };
          }
        })
      );

      setChannels(channelsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleRefresh = () => {
    fetchChannels(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchChannels()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Channels</h1>
          <p className="text-muted-foreground mt-1">
            {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        {typeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeFilter === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Channels Grid */}
      {channels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No channels found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              memberCount={channel.memberCount}
              postCount={channel.postCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
