"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState, FormEvent } from "react";

export default function PostPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { user, loading } = useAuth();

  // when I post, I want the backend to be aware of my user id, so do I send my user id?
  async function onSubmitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return null;
    const formData = new FormData(event.currentTarget);
    const body = {
      content: formData.get("text"),
      user: user,
    }
    console.log(body);
    const response = await fetch('http://localhost:3001/api/post', {
      method: 'POST',
      headers: { "Content-type" : "application/json" },
      body: JSON.stringify(body),
    })
    // need a way to see if login was successful

    if (!response.ok) {
      const data = await response.text()
      setError(data|| "Post failed");
      return;
    } else {
      setSuccess(true);
    }
  }
  return (
    <div className="flex flex-col m-8">
      <form className="flex flex-col gap-4" onSubmit={onSubmitHandler}>
        <input name="text" type="text" placeholder="text" required />
        <button className="border-1" type="submit">Post</button>
	<Link href="/home">Cancel</Link>
	{error && <p className="text-red-500">{error}</p>}
	{success && <p className="text-green-500">Successfully posted</p>}
      </form>
    </div>
  );
}
