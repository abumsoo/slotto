import { Post } from "@/components/PostCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { timeAgo } from "@/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ReferenceModalProps {
  post: Post;
  onClose: () => void;
  onGoTo: (postId: number) => void;
}

export function ReferenceModal({ post, onClose, onGoTo }: ReferenceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-muted-foreground">@{post.username}</p>
        <div className="text-card-foreground"><MarkdownContent content={post.content} /></div>
        {post.image_url && (
          <img
            src={`${API_URL}${post.image_url}`}
            alt=""
            className="max-h-48 rounded-lg object-contain"
          />
        )}
        <p className="text-sm text-muted-foreground">{timeAgo(post.created_at)}</p>
        <div className="flex gap-3">
          <button
            onClick={() => onGoTo(post.id)}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Go to post
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
