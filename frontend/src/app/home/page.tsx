'use client';

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { PostCard, Post } from "@/components/PostCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Toast } from "@/components/Toast";
import { VerifyEmailPrompt } from "@/components/VerifyEmailPrompt";
import { PostForm } from "@/components/PostForm";
import { ReferenceModal } from "@/components/ReferenceModal";


export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [viewingReference, setViewingReference] = useState<Post | null>(null);
  const [showFab, setShowFab] = useState(false);
  const postFormRef = useRef<HTMLDivElement>(null);

  const { user, loading } = useAuth();

  const postsMap = useMemo(() => {
    const map = new Map<number, Post>();
    for (const post of posts) {
      map.set(post.id, post);
    }
    return map;
  }, [posts]);

  function handleNewPost(_newPost: Post) {
    setReplyingTo(null);
    fetchPosts();
    setToast("Posted!");
    setHasPostedToday(true);
  }

  function fetchPosts() {
    fetch('/api/posts', {
      credentials: 'include',
    })
      .then((res) => (res.json()))
      .then((data) => {
        setPosts(data);
        if (user) {
          const today = new Date().toDateString();
          const postedToday = data.some((p: Post) => p.user_id === user.id && new Date(p.created_at).toDateString() === today);
          if (postedToday) setHasPostedToday(true);
        }
      });
  }

  useEffect(() => {
    fetchPosts();
  }, [user]);

  useEffect(() => {
    if (loading || hasPostedToday) return;
    function handleScroll() {
      const el = postFormRef.current;
      if (!el) return;
      setShowFab(el.getBoundingClientRect().bottom < 0);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasPostedToday]);

  if (loading) return null;

  function handleReply(post: Post) {
    if (!user) { setShowLoginPrompt(true); return; }
    setReplyingTo(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewReference(referencedPostId: number) {
    const post = postsMap.get(referencedPostId);
    if (post) {
      setViewingReference(post);
    }
  }

  function handleGoToPost(postId: number) {
    setViewingReference(null);
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20 space-y-6">
      <div className="flex justify-center items-center gap-2">
        <span className="text-primary font-bold text-2xl">eslo</span>
        <div className="w-5 h-5 rounded-full bg-primary" />
      </div>
      <div className="-mx-4 sm:mx-0">
        {hasPostedToday ? (
          <div className="bg-card border-y border-border p-4 text-center space-y-1">
            <p className="text-foreground font-semibold">You&apos;ve posted today!</p>
            <p className="text-sm text-muted-foreground">Your post will last 3 days unless others quote it. Enjoy what others have posted and post again tomorrow.</p>
          </div>
        ) : (
          <div ref={postFormRef}>
            <PostForm
              onPost={handleNewPost}
              onLoginRequired={() => setShowLoginPrompt(true)}
              onVerifyRequired={() => setShowVerifyEmail(true)}
              isLoggedIn={!!user}
              isVerified={!!user?.verified}
              referencedPost={replyingTo}
              onClearReference={() => setReplyingTo(null)}
            />
          </div>
        )}
        <div className="border-b border-muted-foreground/30 divide-y divide-muted-foreground/30">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={handleReply}
              onViewReference={handleViewReference}
              actionsDisabled={hasPostedToday}
            />
          ))}
        </div>
      </div>
      {showFab && !hasPostedToday && (
        <button
          onClick={() => {
            if (!user) { setShowLoginPrompt(true); return; }
            postFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            postFormRef.current?.querySelector('textarea')?.focus();
          }}
          className="sm:hidden fixed bottom-20 right-6 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <PenLine size={24} />
        </button>
      )}
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      {showVerifyEmail && <VerifyEmailPrompt onClose={() => setShowVerifyEmail(false)} />}
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
