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
    const response = await fetch('http://localhost:3001/api/users/signup', {
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
    <div className="flex flex-col m-8">
      <form className="flex flex-col gap-4" onSubmit={onSubmitHandler}>
        <input name="name" type="text" placeholder="Name" required />
        <input name="username" type="text" placeholder="Username" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button className="border-1" type="submit">Sign Up</button>
	{error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
