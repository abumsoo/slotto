"use client";
import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirm = formData.get("confirm") as string;
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.message || "Something went wrong");
      return;
    }
    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <p className="text-sm text-red-500 text-center">
        Invalid reset link. Please request a new one.
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <input
        name="newPassword"
        type="password"
        placeholder="New password (min 8 characters)"
        required
        minLength={8}
        className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        name="confirm"
        type="password"
        placeholder="Confirm new password"
        required
        className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground text-center">Reset Password</h1>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-sm text-muted-foreground text-center">
          <a href="/login" className="text-primary hover:underline">Back to log in</a>
        </p>
      </div>
    </div>
  );
}
