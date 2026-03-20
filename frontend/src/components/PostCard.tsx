import { useState, useEffect } from "react";
import { X, Bookmark, Heart } from "lucide-react";
import { timeAgo } from "@/helpers";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Toast } from "@/components/Toast";


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
  link_preview: { url: string; title: string | null; description: string | null; image: string | null } | null;
}

interface PostCardProps {
  post: Post;
  onReply?: (post: Post) => void;
  onViewReference?: (postId: number) => void;
  actionsDisabled?: boolean;
  highlighted?: boolean;
  onBookmark?: (post: Post) => void;
  isBookmarked?: boolean;
  onLike?: (post: Post) => void;
  onViewLikers?: (post: Post) => void;
  isLiked?: boolean;
  canUnlike?: boolean;
  likeDisabled?: boolean;
}

export function PostCard({ post, onReply, onViewReference, actionsDisabled, highlighted, onBookmark, isBookmarked, onLike, onViewLikers, isLiked, canUnlike, likeDisabled }: PostCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showLikeBlocked, setShowLikeBlocked] = useState(false);
  const [showUnlikeConfirm, setShowUnlikeConfirm] = useState(false);

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
      {post.link_preview && (
        <a
          href={post.link_preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex gap-3 rounded-lg border border-muted-foreground/20 overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {post.link_preview.image && (
            <img src={post.link_preview.image} alt="" className="w-20 h-20 object-cover flex-shrink-0" />
          )}
          <div className="py-2 pr-3 min-w-0">
            {post.link_preview.title && <p className="text-sm font-medium truncate">{post.link_preview.title}</p>}
            {post.link_preview.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.link_preview.description}</p>}
            <p className="text-xs text-muted-foreground/60 truncate mt-1">{post.link_preview.url}</p>
          </div>
        </a>
      )}
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
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center overflow-auto">
          <button
            onClick={() => window.history.back()}
            className="fixed top-4 right-4 text-white bg-black/50 hover:bg-white hover:text-black rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-colors z-[61]"
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
      {showUnlikeConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowUnlikeConfirm(false)}>
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-foreground">Unlike this post?</p>
            <p className="text-sm text-muted-foreground">You won't be able to like another post today.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUnlikeConfirm(false); onLike!(post); }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
              >
                Unlike
              </button>
              <button
                onClick={() => setShowUnlikeConfirm(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showLikeBlocked && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowLikeBlocked(false)}>
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-foreground">You've used your like for today</p>
            <p className="text-sm text-muted-foreground">Come back tomorrow to like another post.</p>
            <button onClick={() => setShowLikeBlocked(false)} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">Got it</button>
          </div>
        </div>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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
              onClick={() => actionsDisabled ? setToast("You've already replied today") : onReply(post)}
              className={`px-3 py-1 text-sm text-primary hover:bg-primary/15 rounded ${actionsDisabled ? 'opacity-40' : ''}`}
            >
              Reply
            </button>
          )}
          {(onLike || onViewLikers) && (
            <button
              onClick={() => {
                if (onViewLikers) { onViewLikers(post); return; }
                if (isLiked && !canUnlike) { setToast('You can only unlike posts you liked today'); return; }
                if (isLiked && canUnlike) { setShowUnlikeConfirm(true); return; }
                if (likeDisabled && !isLiked) { setShowLikeBlocked(true); return; }
                onLike!(post);
              }}
              className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
              aria-label={onViewLikers ? 'View likes' : isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-primary' : ''} />
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
