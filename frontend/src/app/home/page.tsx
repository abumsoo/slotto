'use client';

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const {user, loading } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/posts', {
      credentials: 'include',
    })
      .then((res) => (res.json()))
      .then((data) => setPosts(data));
  }, []);

  if (loading) return null;

  return (
    <div>
      <h2>Welcome Home!</h2>
      <Link href='/post'></Link>
      <div>
      {posts.map((post) => (
	<div key={post.id}>{post.content}</div>
      ))}
      </div>
    </div>
  )
}
