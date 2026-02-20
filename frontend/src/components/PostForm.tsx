'use client';

import { useState, FormEvent } from "react";
import { Post } from "@/components/PostCard";
import { MarkdownContent } from "@/components/MarkdownContent";

const MAX_LENGTH = 1000;

interface PostFormProps {
  onPost: (post: Post) => void;
  onLoginRequired: () => void;
  onVerifyRequired: () => void;
  isLoggedIn: boolean;
  isVerified: boolean;
  referencedPost?: Post | null;
  onClearReference?: () => void;
}

export function PostForm({ onPost, onLoginRequired, onVerifyRequired, isLoggedIn, isVerified, referencedPost, onClearReference }: PostFormProps) {
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;
    if (!isLoggedIn) { onLoginRequired(); return; }

    setIsPosting(true);
    setError("");

    const formData = new FormData();
    formData.append('content', postContent);
    if (postImage) {
      formData.append('image', postImage);
    }
    if (referencedPost) {
      formData.append('referenced_post_id', String(referencedPost.id));
    }

    const response = await fetch('/api/post', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 403) {
        onVerifyRequired();
        setIsPosting(false);
        return;
      }
      const data = await response.text();
      setError(data || "Post failed");
      setIsPosting(false);
      return;
    }

    const newPost = await response.json();
    setPostContent("");
    setPostImage(null);
    setImagePreview(null);
    setIsPosting(false);
    onClearReference?.();
    onPost(newPost);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border-y border-muted-foreground/30 p-4 space-y-3">
      {referencedPost && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary">Replying to @{referencedPost.username}</span>
            <button type="button" onClick={onClearReference} className="text-xs text-muted-foreground hover:text-foreground">&times;</button>
          </div>
          <div className="p-3 bg-muted rounded-lg border border-muted-foreground/20">
            <p className="text-xs text-muted-foreground mb-1">@{referencedPost.username}</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{referencedPost.content.slice(0, 200)}{referencedPost.content.length > 200 ? '...' : ''}</p>
          </div>
        </div>
      )}
      <div className="relative">
        <textarea
          value={postContent}
          onChange={(e) => { setPostContent(e.target.value); if (error) setError(""); }}
          maxLength={MAX_LENGTH}
          placeholder="What's on your mind today?"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
        {(!isLoggedIn || !isVerified) && (
          <div className="absolute inset-0 cursor-text" onClick={!isLoggedIn ? onLoginRequired : onVerifyRequired} />
        )}
      </div>
      {postContent.trim() && (
        <div className="bg-muted rounded-lg px-4 py-3 text-foreground">
          <MarkdownContent content={postContent} />
        </div>
      )}
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
  );
}
