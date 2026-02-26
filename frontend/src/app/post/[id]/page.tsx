'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostCard, Post } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { LikersModal } from "@/components/LikersModal";
import { API_BASE } from '@/lib/api';
import { ArrowLeft } from "lucide-react";

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likedToday, setLikedToday] = useState(false);
  const [showLikers, setShowLikers] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => { if (data) setPost(data); });
  }, [id]);

  useEffect(() => {
    if (!user || !post || post.user_id === user.id) return;
    fetch(`${API_BASE}/api/users/me/likes`, { credentials: 'include' })
      .then(res => res.json())
      .then((rows: { post_id: number; today: boolean }[]) => {
        const match = rows.find(r => r.post_id === post.id);
        setIsLiked(!!match);
        setLikedToday(!!match?.today);
      });
  }, [user, post]);

  function handleLike(p: Post) {
    fetch(`${API_BASE}/api/likes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: p.id }),
    })
      .then(res => res.json())
      .then(({ liked }) => { setIsLiked(liked); setLikedToday(liked); });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
      <div className="-mx-4 sm:mx-0 flex items-center gap-3 pb-4 border-b border-muted-foreground/30">
        <button
          onClick={() => window.history.length > 1 ? router.back() : router.push('/home')}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold">Post</span>
      </div>
      {notFound ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Post not found.</div>
      ) : !post ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="-mx-4 sm:mx-0">
          <PostCard
            post={post}
            highlighted
            onReply={user ? (p) => router.push('/compose?replyTo=' + p.id) : undefined}
            onViewReference={(postId) => router.push('/post/' + postId)}
            actionsDisabled={user?.hasRepliedToday}
            onLike={user && post.user_id !== user.id ? handleLike : undefined}
            onViewLikers={user && post.user_id === user.id ? () => setShowLikers(true) : undefined}
            isLiked={isLiked}
            canUnlike={likedToday}
            likeDisabled={user?.hasLikedToday}
          />
          {showLikers && <LikersModal postId={post.id} onClose={() => setShowLikers(false)} />}
        </div>
      )}
    </div>
  );
}
