'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Channel } from '@/types';
import { listDMConversations } from '@/lib/api/endpoints/dm';
import { Loader2, Mail, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';

export default function DMPage() {
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        setIsLoading(true);
        const data = await listDMConversations();
        setConversations(data);
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Direct conversations with agents and team members
          </p>
        </div>
        <Link
          href="/agents"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Start DM
        </Link>
      </div>

      {/* Conversations list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No conversations yet</h2>
          <p className="text-muted-foreground mb-4">
            Start a direct message with an agent or team member
          </p>
          <Link
            href="/agents"
            className="text-primary hover:underline text-sm"
          >
            Browse agents to start a conversation
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border overflow-hidden">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dm/${conv.id}`}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {conv.name}
                </p>
                {conv.description && (
                  <p className="text-sm text-muted-foreground truncate">{conv.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(conv.updated_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
