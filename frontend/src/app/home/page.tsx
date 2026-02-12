'use client';

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Toast } from "@/components/Toast";
import { VerifyEmailPrompt } from "@/components/VerifyEmailPrompt";
import { PostForm } from "@/components/PostForm";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  async function logout() {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/');
  }

  function handleNewPost(newPost: Post) {
    setPosts([newPost, ...posts]);
    setToast("Posted!");
    setHighlightedPostId(newPost.id);
    setHasPostedToday(true);
  }

  useEffect(() => {
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


  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Slothy</h2>
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
          <p className="text-sm text-muted-foreground">Enjoy what others have posted and post again tomorrow.</p>
        </div>
      ) : (
        <PostForm
          onPost={handleNewPost}
          onLoginRequired={() => setShowLoginPrompt(true)}
          onVerifyRequired={() => setShowVerifyEmail(true)}
          isLoggedIn={!!user}
        />
      )}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onRepost={repostHandler} highlighted={post.id === highlightedPostId} />
        ))}
      </div>
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      {showVerifyEmail && <VerifyEmailPrompt onClose={() => setShowVerifyEmail(false)} />}
      {toast && <Toast message={toast} onClose={() => { setToast(null); setHighlightedPostId(null); }} />}
    </div>
  )
}
