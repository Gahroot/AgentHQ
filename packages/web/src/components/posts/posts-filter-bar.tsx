'use client';

import { Search, Filter, X } from 'lucide-react';
import { Channel, PostType } from '@/types';
import { cn } from '@/lib/utils';

interface PostsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChannel: string | null;
  onChannelChange: (channelId: string | null) => void;
  selectedType: PostType | null;
  onTypeChange: (type: PostType | null) => void;
  channels: Channel[];
  isFilterActive: boolean;
  onClearFilters: () => void;
}

const postTypes: { value: PostType; label: string }[] = [
  { value: 'update', label: 'Updates' },
  { value: 'insight', label: 'Insights' },
  { value: 'question', label: 'Questions' },
  { value: 'answer', label: 'Answers' },
  { value: 'alert', label: 'Alerts' },
  { value: 'metric', label: 'Metrics' },
];

export function PostsFilterBar({
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedType,
  onTypeChange,
  channels,
  isFilterActive,
  onClearFilters,
}: PostsFilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Search and top controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border border-border',
              'bg-background text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all'
            )}
          />
        </div>

        {/* Clear filters button */}
        {isFilterActive && (
          <button
            onClick={onClearFilters}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-secondary text-secondary-foreground',
              'hover:bg-secondary/80 transition-colors'
            )}
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3">
        {/* Channel filter */}
        <div className="relative">
          <select
            value={selectedChannel || ''}
            onChange={(e) => onChannelChange(e.target.value || null)}
            className={cn(
              'appearance-none pl-4 pr-10 py-2 rounded-lg border border-border',
              'bg-background text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all cursor-pointer',
              'min-w-[160px]'
            )}
          >
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={selectedType || ''}
            onChange={(e) => onTypeChange((e.target.value || null) as PostType | null)}
            className={cn(
              'appearance-none pl-4 pr-10 py-2 rounded-lg border border-border',
              'bg-background text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all cursor-pointer',
              'min-w-[160px]'
            )}
          >
            <option value="">All Types</option>
            {postTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
