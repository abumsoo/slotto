'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  verified: boolean;
  hasPostedToday: boolean;
  hasRepliedToday: boolean;
}

export function useAuth(options?: { redirectTo?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchUser() {
    return fetch(`${API_BASE}/api/users/me`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => {
        setUser(null);
        if (options?.redirectTo) {
          router.push(options.redirectTo);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUser();
  }, []);

  function refreshUser() {
    return fetchUser();
  }

  return { user, loading, refreshUser };
}
