"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "1";

  const router = useRouter();

  async function onSubmitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = {
      email: formData.get("email"),
      password: formData.get("password"),
    }
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { "Content-type" : "application/json" },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    // need a way to see if login was successful

    if (!response.ok) {
      const data = await response.json()
      setError(data.message || "Login failed");
      return;
    } else {
      router.push('/home')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground text-center">Log In</h1>
        <form className="flex flex-col gap-4" onSubmit={onSubmitHandler}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Log In
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {resetSuccess && <p className="text-green-500 text-sm text-center">Password reset! You can now log in.</p>}
        </form>
        <div className="text-sm text-muted-foreground text-center space-y-2">
          <p>
            <a href="/forgot-password" className="text-primary hover:underline">Forgot password?</a>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
