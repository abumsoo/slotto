'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { API_BASE } from '@/lib/api';
import { PostCard, Post } from '@/components/PostCard';
import { ThreadView } from '@/components/ThreadView';


function ProfileContent() {
  const { user, loading } = useAuth({ redirectTo: '/login' });
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get('post') ? parseInt(searchParams.get('post')!) : null;

  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/users/me/posts`, { credentials: 'include' })
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Your Posts</h2>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">You haven&apos;t posted anything yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {posts.map(post => (
            <div key={post.id} className="py-4 first:pt-0">
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

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
