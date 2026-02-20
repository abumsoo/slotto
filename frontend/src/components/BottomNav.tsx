'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    function fetchUnreadCount() {
      fetch('/api/notifications/unread-count', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUnreadCount(data.count); });
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
      <Link
        href="/home"
        className={`flex-1 flex items-center justify-center py-3 ${pathname === '/home' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Home size={22} />
      </Link>
      <Link
        href="/notifications"
        className={`flex-1 flex items-center justify-center py-3 relative ${pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-[calc(50%-18px)] bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
      <Link
        href="/profile"
        className={`flex-1 flex items-center justify-center py-3 ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <User size={22} />
      </Link>
    </nav>
  );
}
