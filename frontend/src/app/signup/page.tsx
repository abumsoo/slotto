"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmitHandler(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = {
      name: formData.get("name"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
    const response = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { "Content-type" : "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.message || "Signup failed");
      return;
    } 

    router.push("/check-email");
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground text-center">Sign Up</h1>
        <form className="flex flex-col gap-4" onSubmit={onSubmitHandler}>
          <input
            name="name"
            type="text"
            placeholder="Name"
            required
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
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
            Sign Up
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
