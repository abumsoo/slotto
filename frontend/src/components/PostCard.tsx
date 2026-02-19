import { useState } from "react";
import { timeAgo } from "@/helpers";
import { MarkdownContent } from "@/components/MarkdownContent";

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
  referenced_post_id: number | null;
  short_id: string;
  username: string;
  is_feed: boolean;
}

interface PostCardProps {
  post: Post;
  onRepost?: (postId: number) => void;
  onReference?: (post: Post) => void;
  onViewReference?: (postId: number) => void;
  referenceDisabled?: boolean;
  actionsDisabled?: boolean;
  highlighted?: boolean;
}

export function PostCard({ post, onRepost, onReference, onViewReference, referenceDisabled, actionsDisabled, highlighted }: PostCardProps) {
  const [showImage, setShowImage] = useState(false);

  return (
    <div id={`post-${post.id}`} className={`bg-card rounded-lg shadow-sm border-2 border-muted-foreground/30 p-4 transition-colors hover:bg-muted${highlighted ? ' animate-highlight-fade' : ''}`}>
      {post.is_repost && (
        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Repost
        </p>
      )}
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs text-muted-foreground">@{post.username}</p>
        <span className="text-xs text-muted-foreground/50 font-mono">{post.short_id}</span>
      </div>
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
        <div className="flex gap-2">
          {onReference && (
            <>
              <button
                onClick={() => navigator.clipboard.writeText(`[↗ ${post.short_id} - @${post.username}](#post-${post.id})`)}
                disabled={actionsDisabled || referenceDisabled}
                className="p-1 text-primary hover:bg-primary/15 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                title="Copy reference link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => onReference(post)}
                disabled={actionsDisabled || referenceDisabled}
                className="px-3 py-1 text-sm text-primary hover:bg-primary/15 rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reference
              </button>
            </>
          )}
          {onRepost && (
            <button
              onClick={() => onRepost(post.id)}
              disabled={actionsDisabled}
              className="px-3 py-1 text-sm text-primary hover:bg-primary/15 rounded flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repost
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
