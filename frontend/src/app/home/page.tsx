'use client';

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { timeAgo } from "@/helpers";

interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string;
  created_at: string;
  is_repost: boolean;
  original_post_id: number;
  original_user_id: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_LENGTH = 1000;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const { user, loading } = useAuth({ redirectTo: '/login' });
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

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;

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
    setSuccess(true);
  }

  useEffect(() => {
    fetch(`${API_URL}/api/posts`, {
      credentials: 'include',
    })
      .then((res) => (res.json()))
      .then((data) => setPosts(data));
  }, []);

  if (loading) return null;

  async function onClickHandler(event: MouseEvent<HTMLButtonElement>, post: Post) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('content', post.content);
    formData.append('is_repost', 'true');
    formData.append('original_post_id', post.id.toString());
    formData.append('original_user_id', post.user_id.toString());

    const response = await fetch(`${API_URL}/api/post`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.text();
      setError(data || "Repost failed");
      return;
    }

    const newPost = await response.json();
    setPosts([newPost, ...posts]);
    setSuccess(true);
  }


  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Slotto</h2>
        <button onClick={logout} className="px-4 py-2 text-accent hover:opacity-80">Logout</button>
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
        {success && <p className="text-green-500 text-sm">Posted!</p>}
        <div className="flex items-center justify-between">
          <label className="cursor-pointer px-3 py-2 text-muted-foreground hover:text-foreground">
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
          <div key={post.id} className="bg-card rounded-lg shadow-sm border border-border p-4">
            {post.is_repost && (
              <p className="text-sm text-muted-foreground mb-2">Repost</p>
            )}
            <p className="text-card-foreground">{post.content}</p>
	    {post.image_url && (
		<img
		  src={`${API_URL}${post.image_url}`}
		  alt=""
		  className="mt-2 rounded-lg max-h-96"
		/>
	    )}
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {timeAgo(post.created_at)}
              </span>
              <button
                onClick={(event) => onClickHandler(event, post)}
                className="px-3 py-1 text-sm text-primary hover:opacity-80"
              >
                Repost
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
