'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { editPost } from '@/lib/api/endpoints/posts';
import { Post } from '@/types';

interface EditPostDialogProps {
  post: Post;
  open: boolean;
  onClose: () => void;
  onSaved: (post: Post) => void;
}

export function EditPostDialog({ post, open, onClose, onSaved }: EditPostDialogProps) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await editPost(post.id, {
        title: title || undefined,
        content,
      });
      onSaved(updated);
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Post</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              placeholder="Post title (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-[120px] resize-y"
              placeholder="Post content"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
