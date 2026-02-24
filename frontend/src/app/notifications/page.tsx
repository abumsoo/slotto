'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/helpers';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE } from '@/lib/api';

interface Notification {
  id: number;
  actor_username: string;
  post_snippet: string;
  referenced_post_id: number;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { loading } = useAuth({ redirectTo: '/login' });
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, []);

  function handleClick(notif: Notification) {
    fetch(`${API_BASE}/api/notifications/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: [notif.id] }),
    }).then(() => {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
    });
    router.push(`/profile?post=${notif.referenced_post_id}`);
  }

  function markAllRead() {
    fetch(`${API_BASE}/api/notifications/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    }).then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  }

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary hover:opacity-80">
            Mark all as read
          </button>
        )}
      </div>

      {fetching ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
      ) : (
        <div className="-mx-4 sm:mx-0 border-y border-muted-foreground/30 divide-y divide-muted-foreground/30">
          {notifications.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3 hover:bg-muted${notif.read ? '' : ' bg-primary/5'}`}
            >
              <p className="text-sm text-foreground">
                <span className="font-medium">@{notif.actor_username}</span> referenced your post
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.post_snippet}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.created_at)}</p>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
