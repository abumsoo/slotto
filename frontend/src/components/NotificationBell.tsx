'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/helpers';

interface Notification {
  id: number;
  actor_username: string;
  post_snippet: string;
  referenced_post_id: number;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function fetchUnreadCount() {
    fetch('/api/notifications/unread-count', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setUnreadCount(data.count); });
  }

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    fetch('/api/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  function handleClick(notif: Notification) {
    // Mark as read
    fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: [notif.id] }),
    }).then(() => {
      setUnreadCount(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    });
    setOpen(false);
    router.push(`/profile?post=${notif.referenced_post_id}`);
  }

  function markAllRead() {
    fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    }).then(() => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleOpen} className="relative text-muted-foreground hover:text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center p-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:opacity-80">
                Mark all as read
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground p-3">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No notifications yet.</p>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-3 hover:bg-muted border-b border-border last:border-b-0${notif.read ? '' : ' bg-primary/5'}`}
              >
                <p className="text-sm text-foreground">
                  <span className="font-medium">@{notif.actor_username}</span> referenced your post
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.post_snippet}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.created_at)}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
