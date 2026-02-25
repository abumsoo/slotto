'use client';

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { Toast } from "@/components/Toast";
import { ReferenceModal } from "@/components/ReferenceModal";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const FEED_CACHE_KEY = 'feedCache';
const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface FeedCache {
  posts: Post[];
  ancestors: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  scrollY: number;
  timestamp: number;
}

function saveFeedCache(data: Omit<FeedCache, 'timestamp' | 'scrollY'>) {
  sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
    ...data,
    scrollY: window.scrollY,
    timestamp: Date.now(),
  }));
}

// Reads and immediately removes the cache — call once during useState init
function popFeedCache(): FeedCache | null {
  try {
    const raw = sessionStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FEED_CACHE_KEY);
    const data: FeedCache = JSON.parse(raw);
    if (Date.now() - data.timestamp > FEED_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export default function HomePage() {
  // Read cache once at initialisation — avoids a loading flash on back-navigation
  const [cache] = useState<FeedCache | null>(popFeedCache);
  const [posts, setPosts] = useState<Post[]>(cache?.posts ?? []);
  const [ancestors, setAncestors] = useState<Post[]>(cache?.ancestors ?? []);
  const [bookmarkMap, setBookmarkMap] = useState<Map<number, number>>(new Map());
  const [toast, setToast] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [viewingReference, setViewingReference] = useState<Post | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(cache?.nextCursor ?? null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(cache?.hasMore ?? true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!cache);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { user, loading } = useAuth();
  const router = useRouter();

  const postsMap = useMemo(() => {
    const map = new Map<number, Post>();
    for (const post of [...posts, ...ancestors]) {
      map.set(post.id, post);
    }
    return map;
  }, [posts, ancestors]);

  function loadInitialFeed() {
    setIsInitialLoading(true);
    setPosts([]);
    setAncestors([]);
    setNextCursor(null);
    setHasMore(true);
    fetch(`${API_BASE}/api/posts`, { credentials: 'include' })
      .then(res => res.json())
      .then(({ posts: newPosts, ancestors: newAncestors, nextCursor: cursor }) => {
        setPosts(newPosts);
        setAncestors(newAncestors);
        setNextCursor(cursor);
        setHasMore(cursor !== null);
      })
      .finally(() => setIsInitialLoading(false));
  }

  function loadMorePosts() {
    if (isFetchingMore || !hasMore || !nextCursor) return;
    setIsFetchingMore(true);
    fetch(`${API_BASE}/api/posts?cursor=${encodeURIComponent(nextCursor)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(({ posts: newPosts, ancestors: newAncestors, nextCursor: cursor }) => {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newPosts.filter((p: Post) => !existingIds.has(p.id))];
        });
        setAncestors(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newAncestors.filter((p: Post) => !existingIds.has(p.id))];
        });
        setNextCursor(cursor);
        setHasMore(cursor !== null);
      })
      .finally(() => setIsFetchingMore(false));
  }

  useEffect(() => {
    if (loading) return;
    if (user?.hasPostedToday) setHasPostedToday(true);
    if (!cache) loadInitialFeed();
    if (user) {
      fetch(`${API_BASE}/api/bookmarks`, { credentials: 'include' })
        .then(res => res.json())
        .then((items: Array<{ bookmark_id: number; id: number }>) => {
          setBookmarkMap(new Map(items.map(b => [b.id, b.bookmark_id])));
        })
        .catch(() => {});
    }
  }, [loading]);

  // Restore scroll after back-navigation — wait for auth to resolve so posts are in the DOM,
  // then setTimeout lets Next.js finish its own scroll reset before we override it
  useEffect(() => {
    if (!cache?.scrollY || loading) return;
    const timer = setTimeout(() => window.scrollTo(0, cache.scrollY), 0);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMorePosts(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isInitialLoading, isFetchingMore, hasMore, nextCursor]);

  if (loading) return null;

  function handleReply(post: Post) {
    router.push('/compose?replyTo=' + post.id);
  }

  function handleBookmark(post: Post) {
    const existingId = bookmarkMap.get(post.id);
    if (existingId !== undefined) {
      fetch(`${API_BASE}/api/bookmarks/${existingId}`, { method: 'DELETE', credentials: 'include' })
        .then(() => {
          setBookmarkMap(prev => {
            const next = new Map(prev);
            next.delete(post.id);
            return next;
          });
        });
    } else {
      fetch(`${API_BASE}/api/bookmarks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenced_post_id: post.id }),
      })
        .then(res => res.json())
        .then(({ bookmark_id }) => {
          if (bookmark_id) {
            setBookmarkMap(prev => new Map(prev).set(post.id, bookmark_id));
          }
        });
    }
  }

  function handleViewReference(referencedPostId: number) {
    const post = postsMap.get(referencedPostId);
    if (post) {
      setViewingReference(post);
    }
  }

  function handleGoToPost(postId: number) {
    saveFeedCache({ posts, ancestors, nextCursor, hasMore });
    setViewingReference(null);
    router.push('/post/' + postId);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
      <div className="-mx-4 sm:mx-0 flex justify-center items-center gap-2 pb-4 border-b border-muted-foreground/30">
        <span className="text-primary font-bold text-2xl">eslo</span>
        <div className="w-5 h-5 rounded-full bg-primary" />
      </div>
      {isInitialLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading feed…</div>
      ) : (
        <div className="-mx-4 sm:mx-0">
          <div className="border-b border-muted-foreground/30 divide-y divide-muted-foreground/30">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReply={handleReply}
                onViewReference={handleViewReference}
                actionsDisabled={hasPostedToday}
                onBookmark={user ? handleBookmark : undefined}
                isBookmarked={bookmarkMap.has(post.id)}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {isFetchingMore && (
              <span className="text-sm text-muted-foreground">Loading...</span>
            )}
            {!isFetchingMore && !hasMore && posts.length === 0 && (
              <span className="text-sm text-muted-foreground">Nothing here yet</span>
            )}
            {!isFetchingMore && !hasMore && posts.length > 0 && (
              <span className="text-sm text-muted-foreground">You&apos;re all caught up</span>
            )}
          </div>
        </div>
      )}

      {viewingReference && (
        <ReferenceModal
          post={viewingReference}
          onClose={() => setViewingReference(null)}
          onGoTo={handleGoToPost}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
