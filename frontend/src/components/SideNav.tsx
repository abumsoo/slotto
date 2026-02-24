'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bell, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/components/Toast';
import { API_BASE } from '@/lib/api';

export function SideNav() {
  const pathname = usePathname();
  const { user, loading, refreshUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    function fetchUnreadCount() {
      fetch(`${API_BASE}/api/notifications/unread-count`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUnreadCount(data.count); });
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return null;

  const logo = (
    <div className="flex items-center gap-2 px-3 mb-4">
      <span className="text-primary font-bold text-xl">eslo</span>
      <div className="w-4 h-4 rounded-full bg-primary" />
    </div>
  );

  if (!user) {
    return (
      <nav className="hidden sm:flex flex-col fixed left-0 top-0 h-full w-48 border-r border-border bg-card z-40 pt-6 px-5">
        {logo}
        <div className="flex flex-col gap-2">
          <Link href="/signup" className="px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity">
            Sign up
          </Link>
          <Link href="/login" className="px-2 py-1.5 rounded-lg border border-border text-foreground text-sm font-medium text-center hover:bg-muted transition-colors">
            Log in
          </Link>
        </div>
      </nav>
    );
  }

  const links = [
    { href: '/home', label: 'Home', icon: <Home size={20} /> },
    { href: '/notifications', label: 'Notifications', icon: <Bell size={20} />, badge: unreadCount },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
    <nav className="hidden sm:flex flex-col gap-1 fixed left-0 top-0 h-full w-48 border-r border-border bg-card z-40 pt-6 px-3">
      {logo}
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
      {user.hasPostedToday ? (
        <button
          onClick={() => setToast("You've already posted today")}
          className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-muted-foreground/15 text-muted-foreground w-full"
        >
          <span className="text-sm font-bold w-5 text-center">0</span>
          <span className="text-base font-medium">New Post</span>
        </button>
      ) : (
        <Link
          href="/compose"
          className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <span className="text-sm font-bold w-5 text-center">1</span>
          <span className="text-base font-medium">New Post</span>
        </Link>
      )}
    </nav>
    {toast && <Toast message={toast!} onClose={() => setToast(null)} />}
  </>
  );
}
