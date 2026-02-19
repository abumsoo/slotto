'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PostCard, Post } from '@/components/PostCard';
import { ThreadView } from '@/components/ThreadView';
import { NotificationBell } from '@/components/NotificationBell';

export default function ProfilePage() {
  const { user, loading } = useAuth({ redirectTo: '/login' });
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get('post') ? parseInt(searchParams.get('post')!) : null;

  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/users/me/posts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [user]);

  // Auto-expand and scroll to highlighted post
  useEffect(() => {
    if (highlightPostId && posts.length > 0 && !scrolledRef.current) {
      setExpandedThread(highlightPostId);
      scrolledRef.current = true;
      requestAnimationFrame(() => {
        const el = document.getElementById(`post-${highlightPostId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [highlightPostId, posts]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Your Posts</h2>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <a href="/home" className="text-sm text-primary hover:opacity-80">Feed</a>
          <a href="/settings" className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">You haven&apos;t posted anything yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id}>
              <PostCard
                post={post}
                highlighted={post.id === highlightPostId}
              />
              <div className="mt-1">
                <button
                  onClick={() => setExpandedThread(expandedThread === post.id ? null : post.id)}
                  className="text-xs text-primary hover:opacity-80 px-1"
                >
                  {expandedThread === post.id ? 'Hide thread' : 'View thread'}
                </button>
                {expandedThread === post.id && (
                  <ThreadView postId={post.id} highlightPostId={post.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
