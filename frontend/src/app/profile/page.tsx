'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { API_BASE } from '@/lib/api';
import { PostCard, Post } from '@/components/PostCard';
import { ThreadView } from '@/components/ThreadView';

interface BookmarkItem extends Post {
  bookmark_id: number;
}

function ProfileContent() {
  const { user, loading } = useAuth({ redirectTo: '/login' });
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get('post') ? parseInt(searchParams.get('post')!) : null;

  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarksFetched, setBookmarksFetched] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/users/me/posts`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'bookmarks' || bookmarksFetched) return;
    fetch(`${API_BASE}/api/bookmarks`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setBookmarks(data);
        setBookmarksFetched(true);
      });
  }, [user, activeTab, bookmarksFetched]);

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

  function handleRemoveBookmark(bookmarkId: number, postId: number) {
    fetch(`${API_BASE}/api/bookmarks/${bookmarkId}`, { method: 'DELETE', credentials: 'include' })
      .then(() => {
        setBookmarks(prev => prev.filter(b => b.id !== postId));
      });
  }

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20 space-y-6">
      <p className="text-lg font-semibold">@{user.username}</p>
      <div className="flex border-b border-muted-foreground/30">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'posts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'bookmarks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Bookmarks
        </button>
      </div>

      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You haven&apos;t posted anything yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {posts.map(post => (
                <div key={post.id} className="py-4 first:pt-0">
                  <PostCard
                    post={post}
                    highlighted={post.id === highlightPostId}
                    onViewReference={(postId) => router.push('/post/' + postId)}
                  />
                  <div className="mt-1">
                    <button
                      onClick={() => setExpandedThread(expandedThread === post.id ? null : post.id)}
                      className="text-xs text-primary hover:opacity-80 px-1"
                    >
                      {expandedThread === post.id ? 'Hide thread' : 'View thread'}
                    </button>
                    {expandedThread === post.id && (
                      <ThreadView postId={post.id} highlightPostId={post.id} onNavigate={(id) => router.push('/post/' + id)} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bookmarks yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {bookmarks.map(item => (
                <div key={item.bookmark_id} className="py-4 first:pt-0">
                  <PostCard post={item} />
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => router.push('/compose?replyTo=' + item.id)}
                      className="text-xs text-primary hover:opacity-80 px-1"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleRemoveBookmark(item.bookmark_id, item.id)}
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                    >
                      Remove bookmark
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
