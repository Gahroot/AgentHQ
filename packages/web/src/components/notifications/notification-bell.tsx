'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount, listNotifications, markNotificationRead } from '@/lib/api/endpoints/notifications';
import { Notification } from '@/types';
import { NotificationItem } from './notification-item';
import { useWebSocketStore } from '@/lib/zustand/ws-store';

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const c = await getUnreadCount();
      setCount(c);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Listen for new notifications via websocket store
  const recentNotifications = useWebSocketStore((s) => s.recentNotifications);
  useEffect(() => {
    if (recentNotifications.length > 0) {
      fetchCount();
    }
  }, [recentNotifications, fetchCount]);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const result = await listNotifications({ limit: 10 });
      setNotifications(result.notifications);
    } catch {}
    setLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-md hover:bg-accent transition-colors">
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <a href="/notifications" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                View all
              </a>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
