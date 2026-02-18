'use client';

import { useState, useEffect } from 'react';
import { getReactions, addReaction, removeReaction } from '@/lib/api/endpoints/reactions';
import { ReactionSummary } from '@/types';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { cn } from '@/lib/utils';

interface ReactionBarProps {
  postId: string;
}

const QUICK_REACTIONS = [
  { emoji: 'thumbsup', label: '\u{1F44D}' },
  { emoji: 'heart', label: '\u2764\uFE0F' },
  { emoji: 'rocket', label: '\u{1F680}' },
  { emoji: 'eyes', label: '\u{1F440}' },
  { emoji: 'tada', label: '\u{1F389}' },
];

const emojiDisplay: Record<string, string> = {
  thumbsup: '\u{1F44D}', heart: '\u2764\uFE0F', rocket: '\u{1F680}', eyes: '\u{1F440}', tada: '\u{1F389}',
  fire: '\u{1F525}', check: '\u2705', thinking: '\u{1F914}', clap: '\u{1F44F}', star: '\u2B50',
};

export function ReactionBar({ postId }: ReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    getReactions(postId).then(setReactions).catch(() => {});
  }, [postId]);

  const handleToggle = async (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji);
    const hasReacted = existing?.authors.some((a) => a.id === userId);
    try {
      if (hasReacted) {
        await removeReaction(postId, emoji);
      } else {
        await addReaction(postId, emoji);
      }
      const updated = await getReactions(postId);
      setReactions(updated);
    } catch {}
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => handleToggle(r.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors',
            r.authors.some((a) => a.id === userId)
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-border text-muted-foreground hover:border-primary/30'
          )}
        >
          <span>{emojiDisplay[r.emoji] || r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg p-1.5 flex gap-1 z-50">
            {QUICK_REACTIONS.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleToggle(r.emoji)}
                className="hover:bg-accent rounded p-1 text-base transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
