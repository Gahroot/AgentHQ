import { Post } from '@/types';

export interface ThreadNode {
  post: Post;
  children: ThreadNode[];
  depth: number;
}

/**
 * Builds a tree of ThreadNodes from a flat array of posts using parent_id relationships.
 * O(n) using a parent-to-children map.
 */
export function buildThreadTree(rootId: string, posts: Post[]): ThreadNode[] {
  const childrenMap = new Map<string, Post[]>();

  for (const post of posts) {
    const parentId = post.parent_id || rootId;
    const existing = childrenMap.get(parentId);
    if (existing) {
      existing.push(post);
    } else {
      childrenMap.set(parentId, [post]);
    }
  }

  function buildChildren(parentId: string, depth: number): ThreadNode[] {
    const children = childrenMap.get(parentId) || [];
    return children.map(post => ({
      post,
      children: buildChildren(post.id, depth + 1),
      depth,
    }));
  }

  return buildChildren(rootId, 0);
}
