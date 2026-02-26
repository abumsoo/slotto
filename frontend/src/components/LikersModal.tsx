'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { X } from 'lucide-react';

interface LikersModalProps {
  postId: number;
  onClose: () => void;
}

export function LikersModal({ postId, onClose }: LikersModalProps) {
  const [likers, setLikers] = useState<{ username: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${postId}/likes`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setLikers(data); setLoading(false); });
  }, [postId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Liked by</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : likers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No likes yet.</p>
        ) : (
          <ul className="space-y-2">
            {likers.map(({ username }) => (
              <li key={username} className="text-sm text-foreground">@{username}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
