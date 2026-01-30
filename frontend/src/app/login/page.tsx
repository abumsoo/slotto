"use client";
import { useState, FormEvent } from "react";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState("");

  const router = useRouter();

  async function onSubmitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = {
      email: formData.get("email"),
      password: formData.get("password"),
    }
    const response = await fetch('http://localhost:3001/api/users/login', {
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
    <div className="flex flex-col m-8">
      <form className="flex flex-col gap-4" onSubmit={onSubmitHandler}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button className="border-1" type="submit">Log In</button>
	{error && <p className="text-red-500">{error}</p>}
      </form>

    </div>
  );
}
