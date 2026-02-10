"use client";

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">Slothy</h1>
          <p className="text-muted-foreground">Slow social media — max one post per day.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-center font-medium"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="w-full px-4 py-3 bg-muted text-foreground rounded-lg hover:opacity-90 text-center font-medium"
          >
            Log In
          </Link>
          <Link
            href="/home"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Browse without logging in
          </Link>
        </div>
      </div>
    </div>
  );
}
