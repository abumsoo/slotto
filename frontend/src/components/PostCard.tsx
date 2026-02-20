import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { timeAgo } from "@/helpers";
import { MarkdownContent } from "@/components/MarkdownContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string;
  created_at: string;
  referenced_post_id: number | null;
  username: string;
  is_feed: boolean;
  parent_content: string | null;
  parent_username: string | null;
  parent_id: number | null;
}

interface PostCardProps {
  post: Post;
  onReply?: (post: Post) => void;
  onViewReference?: (postId: number) => void;
  actionsDisabled?: boolean;
  highlighted?: boolean;
}

export function PostCard({ post, onReply, onViewReference, actionsDisabled, highlighted }: PostCardProps) {
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!showImage) return;
    window.history.pushState({}, '');
    function handlePopState() { setShowImage(false); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showImage]);

  return (
    <div id={`post-${post.id}`} className={`bg-card p-4 hover:bg-muted ${highlighted ? 'ring-2 ring-primary ring-inset' : ''}`}>
      <p className="text-sm text-muted-foreground mb-3">@{post.username}</p>
      {post.parent_content && post.parent_id && (
        <div
          className="mb-3 ml-3 p-3 bg-muted rounded-lg border border-muted-foreground/20 cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => onViewReference?.(post.parent_id!)}
        >
          <p className="text-xs text-muted-foreground mb-1">@{post.parent_username}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{post.parent_content.slice(0, 150)}{post.parent_content.length > 150 ? '...' : ''}</p>
        </div>
      )}
      <div className="text-card-foreground"><MarkdownContent content={post.content} onPostLink={onViewReference} /></div>
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-auto">
          <button
            onClick={() => window.history.back()}
            className="fixed top-4 right-4 text-white bg-black/50 hover:bg-white hover:text-black rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={`${API_URL}${post.image_url}`}
            alt=""
            className="w-screen h-screen object-contain"
          />
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {timeAgo(post.created_at)}
        </span>
        <div className="flex gap-2">
          {onReply && (
            <button
              onClick={() => onReply(post)}
              disabled={actionsDisabled}
              className="px-3 py-1 text-sm text-primary hover:bg-primary/15 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
