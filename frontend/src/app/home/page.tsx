'use client';

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Toast } from "@/components/Toast";
import { VerifyEmailPrompt } from "@/components/VerifyEmailPrompt";
import { PostForm } from "@/components/PostForm";
import { ReferenceModal } from "@/components/ReferenceModal";
import { ChainNav } from "@/components/ChainNav";
import { NotificationBell } from "@/components/NotificationBell";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [referencedPost, setReferencedPost] = useState<Post | null>(null);
  const [viewingReference, setViewingReference] = useState<Post | null>(null);
  const [navStack, setNavStack] = useState<number[]>([]);

  const { user, loading } = useAuth();
  const router = useRouter();

  const postsMap = useMemo(() => {
    const map = new Map<number, Post>();
    for (const post of posts) {
      map.set(post.id, post);
    }
    return map;
  }, [posts]);

  async function logout() {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/');
  }

  function handleNewPost(newPost: Post) {
    setReferencedPost(null);
    fetchPosts();
    setToast("Posted!");
    setHighlightedPostId(newPost.id);
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

  if (loading) return null;

  async function repostHandler(postId: number) {
    if (!user) { setShowLoginPrompt(true); return; }
    const response = await fetch('/api/repost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId }),
    });

    if (!response.ok) {
      const data = await response.text();
      setError(data || "Repost failed");
      return;
    }

    const newPost = await response.json();
    setPosts([newPost, ...posts]);
    setToast("Reposted!");
    setHighlightedPostId(newPost.id);
    setHasPostedToday(true);
  }

  function handleReference(post: Post) {
    if (!user) { setShowLoginPrompt(true); return; }
    setReferencedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewReference(referencedPostId: number) {
    const post = postsMap.get(referencedPostId);
    if (post) {
      setViewingReference(post);
    }
  }

  function handleGoTo(postId: number) {
    // Push current scroll position context (the post we're navigating away from)
    setNavStack(prev => [...prev, viewingReference ? viewingReference.id : postId]);
    setViewingReference(null);
    scrollToPost(postId);
  }

  function handleBack() {
    const stack = [...navStack];
    const postId = stack.pop();
    setNavStack(stack);
    if (postId !== undefined) {
      scrollToPost(postId);
    }
  }

  function handleOriginal() {
    const first = navStack[0];
    setNavStack([]);
    if (first !== undefined) {
      scrollToPost(first);
    }
  }

  function scrollToPost(postId: number) {
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-highlight-fade');
      setTimeout(() => el.classList.remove('animate-highlight-fade'), 2000);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Eslo</h2>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">@{user.username}</span>
              <a href="/settings" className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
              <NotificationBell />
              <a href="/profile" className="text-sm text-primary hover:opacity-80">Profile</a>
              <button onClick={logout} className="px-4 py-2 text-accent hover:opacity-80">Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="px-4 py-2 text-accent hover:opacity-80">Login</a>
              <a href="/signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Sign Up</a>
            </>
          )}
        </div>
      </div>
      {hasPostedToday ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 text-center space-y-1">
          <p className="text-foreground font-semibold">You&apos;ve posted today!</p>
          <p className="text-sm text-muted-foreground">Your post will last 3 days unless others quote it. Enjoy what others have posted and post again tomorrow.</p>
        </div>
      ) : (
        <PostForm
          onPost={handleNewPost}
          onLoginRequired={() => setShowLoginPrompt(true)}
          onVerifyRequired={() => setShowVerifyEmail(true)}
          isLoggedIn={!!user}
          referencedPost={referencedPost}
          onClearReference={() => setReferencedPost(null)}
        />
      )}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onRepost={repostHandler}
            onReference={handleReference}
            onViewReference={handleViewReference}
            referenceDisabled={!!referencedPost}
            actionsDisabled={hasPostedToday}
            highlighted={post.id === highlightedPostId}
          />
        ))}
      </div>
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      {showVerifyEmail && <VerifyEmailPrompt onClose={() => setShowVerifyEmail(false)} />}
      {viewingReference && (
        <ReferenceModal
          post={viewingReference}
          onClose={() => setViewingReference(null)}
          onGoTo={handleGoTo}
        />
      )}
      {navStack.length > 0 && (
        <ChainNav
          onBack={handleBack}
          onOriginal={handleOriginal}
          showOriginal={navStack.length > 1}
        />
      )}
      {toast && <Toast message={toast} onClose={() => { setToast(null); setHighlightedPostId(null); }} />}
    </div>
  )
}
