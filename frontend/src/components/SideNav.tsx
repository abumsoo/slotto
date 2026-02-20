'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bell, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function SideNav() {
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

  const links = [
    { href: '/home', label: 'Home', icon: <Home size={20} /> },
    { href: '/notifications', label: 'Notifications', icon: <Bell size={20} />, badge: unreadCount },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <nav className="hidden sm:flex flex-col gap-1 fixed left-0 top-0 h-full w-48 border-r border-border bg-card z-40 pt-6 px-3">
      {links.map(({ href, label, icon, badge }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${pathname === href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {icon}
          <span className="text-base font-medium">{label}</span>
          {badge != null && badge > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
