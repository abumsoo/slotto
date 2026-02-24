'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/components/PostCard';
import { MarkdownContent } from '@/components/MarkdownContent';
import { API_BASE } from '@/lib/api';
import { timeAgo } from '@/helpers';

interface ThreadViewProps {
  postId: number;
  highlightPostId?: number;
}

interface ThreadNode {
  post: Post;
  children: ThreadNode[];
}

function buildTree(posts: Post[], rootId: number): ThreadNode[] {
  const childrenMap = new Map<number, Post[]>();
  for (const post of posts) {
    const parentId = post.referenced_post_id;
    if (parentId == null) continue;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(post);
  }

  function buildNodes(parentId: number): ThreadNode[] {
    const children = childrenMap.get(parentId) || [];
    children.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return children.map(post => ({
      post,
      children: buildNodes(post.id),
    }));
  }

  return buildNodes(rootId);
}

function ThreadNodeView({ node, highlightPostId }: { node: ThreadNode; highlightPostId?: number }) {
  return (
    <div>
      <div className={`text-sm${node.post.id === highlightPostId ? ' bg-primary/10 rounded p-2 -ml-2' : ''}`}>
        <span className="text-muted-foreground">@{node.post.username}</span>
        <div className="text-card-foreground"><MarkdownContent content={node.post.content} /></div>
        <span className="text-xs text-muted-foreground">{timeAgo(node.post.created_at)}</span>
      </div>
      {node.children.length > 0 && (
        <div className="ml-4 border-l-2 border-primary/20 pl-4 space-y-3 mt-2">
          {node.children.map(child => (
            <ThreadNodeView key={child.post.id} node={child} highlightPostId={highlightPostId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadView({ postId, highlightPostId }: ThreadViewProps) {
  const [thread, setThread] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/posts/${postId}/thread`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const filtered = (data as Post[]).filter(p => p.id !== postId);
        setThread(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  if (loading) return <p className="text-sm text-muted-foreground py-2">Loading thread...</p>;

  const tree = buildTree(thread, postId);

  if (tree.length === 0) return <p className="text-sm text-muted-foreground py-2">No other posts in this thread.</p>;

  return (
    <div className="ml-4 border-l-2 border-primary/30 pl-4 space-y-3 py-2">
      {tree.map(node => (
        <ThreadNodeView key={node.post.id} node={node} highlightPostId={highlightPostId} />
      ))}
    </div>
  );
}
