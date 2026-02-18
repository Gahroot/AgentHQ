'use client';

import { useState } from 'react';
import { Bot, User, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/date';
import { PostAuthor } from '@/lib/api/endpoints/posts';
import { ReactionBar } from './reaction-bar';
import { PostActionsMenu } from './post-actions-menu';
import { EditPostDialog } from './edit-post-dialog';
import { CommentForm } from './comment-form';
import { ThreadNode } from '@/lib/utils/thread';
import { useAuthStore } from '@/lib/zustand/auth-store';

const MAX_DEPTH = 8;

interface ThreadCommentProps {
  node: ThreadNode;
  authors: Record<string, PostAuthor>;
  channelId: string;
  onRefresh: () => void;
}

export function ThreadComment({ node, authors, channelId, onRefresh }: ThreadCommentProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const { post, children, depth } = node;

  const author = authors[post.author_id];
  const authorName = author?.name || post.author_id;
  const isAgent = post.author_type === 'agent';
  const isAuthor = userId === post.author_id;
  const hasChildren = children.length > 0;

  const handleReplyCreated = () => {
    setShowReplyForm(false);
    onRefresh();
  };

  return (
    <div className={cn(depth > 0 && 'border-l-2 border-border pl-4')}>
      <div className="py-3">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1">
          {hasChildren && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground"
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            isAgent
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-secondary-foreground'
          )}>
            {isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="font-medium text-sm text-foreground">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
          {post.edited_at && (
            <span className="text-xs text-muted-foreground italic">(edited)</span>
          )}
          <div className="ml-auto">
            <PostActionsMenu
              postId={post.id}
              isAuthor={isAuthor}
              onEdit={() => setEditing(true)}
              onDeleted={onRefresh}
            />
          </div>
        </div>

        {/* Comment content */}
        {!collapsed && (
          <>
            <div className={cn('text-sm text-foreground whitespace-pre-wrap', hasChildren ? 'ml-8' : 'ml-8')}>
              {post.content}
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-3 mt-2 ml-8">
              <ReactionBar postId={post.id} />
              {depth < MAX_DEPTH && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}
            </div>

            {/* Inline reply form */}
            {showReplyForm && (
              <div className="mt-2 ml-8">
                <CommentForm
                  parentId={post.id}
                  channelId={channelId}
                  onReplyCreated={handleReplyCreated}
                  placeholder={`Reply to ${authorName}...`}
                  autoFocus
                />
              </div>
            )}
          </>
        )}

        {/* Collapsed summary */}
        {collapsed && hasChildren && (
          <button
            onClick={() => setCollapsed(false)}
            className="ml-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {children.length} {children.length === 1 ? 'reply' : 'replies'} hidden
          </button>
        )}
      </div>

      {/* Children */}
      {!collapsed && hasChildren && (
        <div>
          {children.map(child => (
            <ThreadComment
              key={child.post.id}
              node={child}
              authors={authors}
              channelId={channelId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditPostDialog
          post={post}
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onRefresh(); }}
        />
      )}
    </div>
  );
}
