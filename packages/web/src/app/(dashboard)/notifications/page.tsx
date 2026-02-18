'use client';

import { useEffect, useState, useCallback } from 'react';
import { Notification } from '@/types';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/endpoints/notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Loader2, Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'mention', label: 'Mentions' },
  { key: 'reply', label: 'Replies' },
  { key: 'reaction', label: 'Reactions' },
  { key: 'dm', label: 'DMs' },
  { key: 'task', label: 'Tasks' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (pageNum: number, reset = false) => {
    try {
      setIsLoading(true);
      const params: { type?: string; page: number; limit: number } = {
        page: pageNum,
        limit: 20,
      };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const result = await listNotifications(params);
      if (reset) {
        setNotifications(result.notifications);
      } else {
        setNotifications((prev) => [...prev, ...result.notifications]);
      }
      setHasMore(result.pagination.hasMore);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    setNotifications([]);
    setHasMore(true);
    loadNotifications(1, true);
  }, [loadNotifications]);

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with mentions, replies, and more
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No notifications</h2>
          <p className="text-muted-foreground">
            {activeTab !== 'all'
              ? 'No notifications of this type yet'
              : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && notifications.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && notifications.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
