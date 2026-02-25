import { useState, useEffect } from "react";
import { X, Bookmark } from "lucide-react";
import { timeAgo } from "@/helpers";
import { MarkdownContent } from "@/components/MarkdownContent";


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
  onBookmark?: (post: Post) => void;
  isBookmarked?: boolean;
}

export function PostCard({ post, onReply, onViewReference, actionsDisabled, highlighted, onBookmark, isBookmarked }: PostCardProps) {
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!showImage) return;
    window.history.pushState({}, '');
    function handlePopState() { setShowImage(false); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showImage]);

  const decayPercent = post.is_feed
    ? Math.max(0, (new Date(post.created_at).getTime() + 3 * 24 * 60 * 60 * 1000 - Date.now()) / (3 * 24 * 60 * 60 * 1000)) * 100
    : null;

  return (
    <div id={`post-${post.id}`} className={`relative bg-card p-4 hover:bg-muted ${highlighted ? 'ring-2 ring-primary ring-inset' : ''}`}>
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
          className="mt-2 max-h-96 flex items-center justify-start cursor-pointer"
          onClick={() => setShowImage(true)}
        >
          <img
            src={post.image_url}
            alt=""
            className="max-h-96 object-contain rounded-lg"
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
            src={post.image_url}
            alt=""
            className="w-screen h-screen object-contain"
          />
        </div>
      )}
      {decayPercent !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/10">
          <div className="h-full bg-muted-foreground/25 transition-all" style={{ width: `${decayPercent}%` }} />
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          {timeAgo(post.created_at)}
        </span>
        <div className="flex gap-2 items-center">
          {onReply && (
            <button
              onClick={() => onReply(post)}
              disabled={actionsDisabled}
              className="px-3 py-1 text-sm text-primary hover:bg-primary/15 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reply
            </button>
          )}
          {onBookmark && (
            <button
              onClick={() => onBookmark(post)}
              className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
