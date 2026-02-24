'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Bell, User, Menu, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/components/Toast';
import { API_BASE } from '@/lib/api';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  function handleLogout() {
    fetch(`${API_BASE}/api/users/logout`, { method: 'POST', credentials: 'include' })
      .then(() => router.push('/login'));
  }

  if (loading) return null;

  if (!user) return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-center gap-3 px-6 py-3 z-50">
      <Link href="/signup" className="flex-1 flex items-center justify-center py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        Sign up
      </Link>
      <Link href="/login" className="flex-1 flex items-center justify-center py-2 rounded-full border border-border text-foreground text-sm font-medium">
        Log in
      </Link>
    </nav>
  );

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        <Link
          href="/home"
          onClick={() => setMenuOpen(false)}
          className={`flex-1 flex items-center justify-center py-3 ${pathname === '/home' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Home size={22} />
        </Link>
        <Link
          href="/notifications"
          onClick={() => setMenuOpen(false)}
          className={`flex-1 flex items-center justify-center py-3 relative ${pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-[calc(50%-18px)] bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <button
          onClick={() => {
            if (user.hasPostedToday) { setToast("You've already posted today"); return; }
            setMenuOpen(false);
            router.push('/compose');
          }}
          className="flex-1 flex items-center justify-center py-3 text-muted-foreground"
        >
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${user.hasPostedToday ? 'bg-muted-foreground/25' : 'bg-primary'}`}>
            <span className={`text-sm font-bold ${user.hasPostedToday ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
              {user.hasPostedToday ? '0' : '1'}
            </span>
          </div>
        </button>
        <Link
          href="/profile"
          onClick={() => setMenuOpen(false)}
          className={`flex-1 flex items-center justify-center py-3 ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <User size={22} />
        </Link>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className={`flex-1 flex items-center justify-center py-3 ${menuOpen ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Menu size={22} />
        </button>
      </nav>

      {/* Slide-in menu */}
      <div className={`sm:hidden fixed inset-0 z-40 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Panel */}
        <div className={`absolute top-0 right-0 h-full w-64 bg-card border-l border-border flex flex-col transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex-1" />
          <div className="p-3">
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Settings size={20} />
              <span className="text-base font-medium">Settings</span>
            </Link>
          </div>
          <div className="p-3 pb-[calc(0.75rem+49px)] border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={20} />
              <span className="text-base font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast!} onClose={() => setToast(null)} />}
    </>
  );
}
