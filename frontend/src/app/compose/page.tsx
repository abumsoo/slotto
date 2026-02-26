'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE } from '@/lib/api';
import { PostForm } from '@/components/PostForm';
import { LoginPrompt } from '@/components/LoginPrompt';
import { VerifyEmailPrompt } from '@/components/VerifyEmailPrompt';
import { Post } from '@/components/PostCard';
import { ArrowLeft } from 'lucide-react';

function ComposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const replyToId = searchParams.get('replyTo');

  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  useEffect(() => {
    if (!replyToId) return;
    fetch(`${API_BASE}/api/posts/${replyToId}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(post => { if (post) setReplyingTo(post); });
  }, [replyToId]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
        <LoginPrompt onClose={() => router.push('/home')} />
      </div>
    );
  }

  if (replyToId ? user.hasRepliedToday : user.hasPostedToday) {
    const isReply = !!replyToId;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
        <div className="bg-card border-y border-border p-4 text-center space-y-1">
          <p className="text-foreground font-semibold">{isReply ? "You've already replied today!" : "You've posted today!"}</p>
          <p className="text-sm text-muted-foreground">{isReply ? "Come back tomorrow to reply again." : "Your post will last 3 days unless others quote it. Enjoy what others have posted and post again tomorrow."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
      <button
        onClick={() => router.back()}
        className="sm:hidden flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>
      <PostForm
        onPost={() => router.push('/home')}
        onLoginRequired={() => setShowLoginPrompt(true)}
        onVerifyRequired={() => setShowVerifyEmail(true)}
        isLoggedIn={!!user}
        isVerified={!!user?.verified}
        referencedPost={replyingTo}
        onClearReference={() => setReplyingTo(null)}
      />
      <p className="text-xs text-muted-foreground text-center mt-1">Your post will be visible for 3 days.</p>
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      {showVerifyEmail && <VerifyEmailPrompt onClose={() => setShowVerifyEmail(false)} />}
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense>
      <ComposeContent />
    </Suspense>
  );
}
