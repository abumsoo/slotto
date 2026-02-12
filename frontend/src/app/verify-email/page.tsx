'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

const COOLDOWN = 60;

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setStatus('sending');
    const response = await fetch('/api/users/resend-verification', {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      setStatus('sent');
      setCooldown(COOLDOWN);
    } else {
      setStatus('error');
    }
  }

  const disabled = status === 'sending' || cooldown > 0;

  return (
    <div className="flex flex-col items-center justify-center m-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Verify your email</h1>
      <p className="text-muted-foreground mb-6">
        A verification email has been sent. Please check your inbox and click the link to verify your account.
      </p>
      <button
        onClick={resend}
        disabled={disabled}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {status === 'sending' ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
      </button>
      {status === 'sent' && <p className="text-green-500 text-sm mb-4">Verification email sent!</p>}
      {status === 'error' && <p className="text-red-500 text-sm mb-4">Failed to send. Please try again.</p>}
      <Link href="/home" className="text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
