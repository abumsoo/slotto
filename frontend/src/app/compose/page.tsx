'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PostForm } from '@/components/PostForm';
import { LoginPrompt } from '@/components/LoginPrompt';
import { VerifyEmailPrompt } from '@/components/VerifyEmailPrompt';
import { Post } from '@/components/PostCard';

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
    fetch(`/api/posts/${replyToId}`, { credentials: 'include' })
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

  if (user.hasPostedToday) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
        <div className="bg-card border-y border-border p-4 text-center space-y-1">
          <p className="text-foreground font-semibold">You&apos;ve posted today!</p>
          <p className="text-sm text-muted-foreground">Your post will last 3 days unless others quote it. Enjoy what others have posted and post again tomorrow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6 sm:pl-20">
      <PostForm
        onPost={() => router.push('/home')}
        onLoginRequired={() => setShowLoginPrompt(true)}
        onVerifyRequired={() => setShowVerifyEmail(true)}
        isLoggedIn={!!user}
        isVerified={!!user?.verified}
        referencedPost={replyingTo}
        onClearReference={() => setReplyingTo(null)}
      />
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
