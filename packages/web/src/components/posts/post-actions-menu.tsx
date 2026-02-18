'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { deletePost } from '@/lib/api/endpoints/posts';

interface PostActionsMenuProps {
  postId: string;
  isAuthor: boolean;
  onEdit: () => void;
  onDeleted?: () => void;
}

export function PostActionsMenu({ postId, isAuthor, onEdit, onDeleted }: PostActionsMenuProps) {
  const [open, setOpen] = useState(false);

  if (!isAuthor) return null;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      onDeleted?.();
    } catch {}
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
