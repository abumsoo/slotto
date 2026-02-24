"use client";
import { useState, FormEvent } from "react";
import { API_BASE } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = (new FormData(e.currentTarget)).get("email");
    const res = await fetch(`${API_BASE}/api/users/reset-password-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Something went wrong");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground text-center">Forgot Password</h1>
        {submitted ? (
          <p className="text-sm text-muted-foreground text-center">
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
          </>
        )}
        <p className="text-sm text-muted-foreground text-center">
          <a href="/login" className="text-primary hover:underline">Back to log in</a>
        </p>
      </div>
    </div>
  );
}
