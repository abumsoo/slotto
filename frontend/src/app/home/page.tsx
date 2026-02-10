'use client';

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Toast } from "@/components/Toast";
import { VerifyEmailPrompt } from "@/components/VerifyEmailPrompt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_LENGTH = 1000;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  async function logout() {
    await fetch(`${API_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function clearImage() {
    setPostImage(null);
    setImagePreview(null);
  }

  async function handlePostSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;
    if (!user) { setShowLoginPrompt(true); return; }

    setIsPosting(true);
    setError("");

    const formData = new FormData();
    formData.append('content', postContent);
    if (postImage) {
      formData.append('image', postImage);
    }

    const response = await fetch(`${API_URL}/api/post`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 403) {
        setShowVerifyEmail(true);
        setIsPosting(false);
        return;
      }
      const data = await response.text();
      setError(data || "Post failed");
      setIsPosting(false);
      return;
    }

    const newPost = await response.json();
    setPosts([newPost, ...posts]);
    setPostContent("");
    setPostImage(null);
    setImagePreview(null);
    setIsPosting(false);
    setToast("Posted!");
    setHighlightedPostId(newPost.id);
  }

  useEffect(() => {
    fetch(`${API_URL}/api/posts`, {
      credentials: 'include',
    })
      .then((res) => (res.json()))
      .then((data) => setPosts(data));
  }, []);

  if (loading) return null;

  async function repostHandler(postId: number) {
    if (!user) { setShowLoginPrompt(true); return; }
    const response = await fetch(`${API_URL}/api/repost`, {
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
  }


  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Slothy</h2>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">@{user.username}</span>
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
      <form onSubmit={handlePostSubmit} className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
	  maxLength={MAX_LENGTH}
          placeholder="What's on your mind?"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
	<span className="text-sm text-muted-foreground">
	  {postContent.length}/{MAX_LENGTH}
	</span>
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
            >
              ×
            </button>
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center justify-between">
          <label className="cursor-pointer py-2 text-muted-foreground hover:text-foreground">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          <button
            type="submit"
            disabled={isPosting || (!postContent.trim() && !postImage)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
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
