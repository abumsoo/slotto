import { useState } from "react";
import { timeAgo } from "@/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string;
  created_at: string;
  is_repost: boolean;
  original_post_id: number;
  original_user_id: number;
}

interface PostCardProps {
  post: Post;
  onRepost: (postId: number) => void;
  highlighted?: boolean;
}

export function PostCard({ post, onRepost, highlighted }: PostCardProps) {
  const [showImage, setShowImage] = useState(false);

  return (
    <div className={`bg-card rounded-lg shadow-sm border border-border p-4 transition-colors hover:bg-muted${highlighted ? ' animate-highlight-fade' : ''}`}>
      {post.is_repost && (
        <p className="text-sm text-muted-foreground mb-2">Repost</p>
      )}
      <p className="text-card-foreground">{post.content}</p>
      {post.image_url && (
        <div
          className="mt-2 bg-black rounded-lg max-h-96 flex items-center justify-center cursor-pointer"
          onClick={() => setShowImage(true)}
        >
          <img
            src={`${API_URL}${post.image_url}`}
            alt=""
            className="max-h-96 object-contain"
          />
        </div>
      )}
      {showImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setShowImage(false)}
        >
          <img
            src={`${API_URL}${post.image_url}`}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {timeAgo(post.created_at)}
        </span>
        <button
          onClick={() => onRepost(post.id)}
          className="px-3 py-1 text-sm text-primary hover:opacity-80"
        >
          Repost
        </button>
      </div>
    </div>
  );
}
