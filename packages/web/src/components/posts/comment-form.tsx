'use client';

import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { createReply } from '@/lib/api/endpoints/posts';

interface CommentFormProps {
  parentId: string;
  channelId: string;
  onReplyCreated: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({ parentId, channelId, onReplyCreated, placeholder = 'Write a reply...', autoFocus = false }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await createReply(parentId, channelId, trimmed);
      setContent('');
      onReplyCreated();
    } catch {
      // Error is handled silently
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, parentId, channelId, onReplyCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm resize-y min-h-[60px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || submitting}
        className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send reply (Cmd+Enter)"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
