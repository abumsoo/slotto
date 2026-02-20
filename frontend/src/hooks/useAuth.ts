'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  verified: boolean;
  hasPostedToday: boolean;
}

export function useAuth(options?: { redirectTo?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchUser() {
    return fetch('/api/users/me', {
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
