'use client';

import { useState } from "react";
import { Post } from "@/components/PostCard";
import { MarkdownContent } from "@/components/MarkdownContent";

const MAX_LENGTH = 1000;

interface PostFormProps {
  onPost: (post: Post) => void;
  onLoginRequired: () => void;
  onVerifyRequired: () => void;
  isLoggedIn: boolean;
}

export function PostForm({ onPost, onLoginRequired, onVerifyRequired, isLoggedIn }: PostFormProps) {
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

  async function handleSubmit(e: React.SubmitEvent) {
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
    onPost(newPost);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
      <textarea
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="What's on your mind?"
        className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {postContent.length}/{MAX_LENGTH}
        </span>
        <span className="text-xs text-muted-foreground">
          Supports **bold**, *italic*, [links](url), and lists
        </span>
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
