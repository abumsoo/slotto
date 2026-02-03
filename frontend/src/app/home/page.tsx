'use client';

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useEffect, useState, MouseEvent } from "react";
import { timeAgo } from "@/helpers";

interface Post {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  is_repost: boolean;
  original_post_id: number;
  original_user_id: number;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { user, loading } = useAuth();

  useEffect(() => {
    fetch('http://localhost:3001/api/posts', {
      credentials: 'include',
    })
      .then((res) => (res.json()))
      .then((data) => setPosts(data));
  }, []);

  if (loading) return null;

  async function onClickHandler(event: MouseEvent<HTMLButtonElement>, post: Post) {
    event.preventDefault();
    
    const body = {
      post: {
	content: post.content,
	is_repost: true,
	original_post_id: post.id,
	original_user_id: post.user_id,
      },
      user: user,
    }
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
    <div>
      <h2>Welcome Home!</h2>
      <Link href='/post'>Post</Link>
      <div>
      {posts.map((post) => (
	<div key={post.id}>
	  <div>
	    {post.is_repost && <p>This is a repost</p>}
	    <p>{post.content}</p>
	  </div>
	  <div>
	    {timeAgo(post.created_at)}
	  </div>
	  <div>
	    <button onClick={(event) => onClickHandler(event, post)}>Repost</button>
	  </div>
	</div>
      ))}
      </div>
    </div>
  )
}
