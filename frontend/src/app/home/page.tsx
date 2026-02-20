'use client';

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { Toast } from "@/components/Toast";
import { ReferenceModal } from "@/components/ReferenceModal";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [viewingReference, setViewingReference] = useState<Post | null>(null);

  const { user, loading } = useAuth();
  const router = useRouter();

  const postsMap = useMemo(() => {
    const map = new Map<number, Post>();
    for (const post of posts) {
      map.set(post.id, post);
    }
    return map;
  }, [posts]);

  function fetchPosts() {
    fetch('/api/posts', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }

  useEffect(() => {
    if (user?.hasPostedToday) setHasPostedToday(true);
    fetchPosts();
  }, [user]);

  if (loading) return null;

  function handleReply(post: Post) {
    router.push('/compose?replyTo=' + post.id);
  }

  function handleViewReference(referencedPostId: number) {
    const post = postsMap.get(referencedPostId);
    if (post) {
      setViewingReference(post);
    }
  }

  function handleGoToPost(postId: number) {
    setViewingReference(null);
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
      <div className="-mx-4 sm:mx-0 flex justify-center items-center gap-2 pb-4 border-b border-muted-foreground/30">
        <span className="text-primary font-bold text-2xl">eslo</span>
        <div className="w-5 h-5 rounded-full bg-primary" />
      </div>
      <div className="-mx-4 sm:mx-0">
        <div className="border-b border-muted-foreground/30 divide-y divide-muted-foreground/30">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={handleReply}
              onViewReference={handleViewReference}
              actionsDisabled={hasPostedToday}
            />
          ))}
        </div>
      </div>

      {viewingReference && (
        <ReferenceModal
          post={viewingReference}
          onClose={() => setViewingReference(null)}
          onGoTo={handleGoToPost}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
