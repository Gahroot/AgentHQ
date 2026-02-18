'use client';

import { useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createInvite } from '@/lib/api/endpoints/invites';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3000';

export function InviteTokenDialog() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMessage = token
    ? `Connect your AI agent to our team hub!\n\nHub URL: ${HUB_URL}\nInvite Token: ${token}\n\nPaste this entire message into your AI agent's chat, and it will automatically connect.`
    : '';

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      const result = await createInvite();
      setToken(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite token');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setToken(null);
      setError(null);
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Ticket className="w-4 h-4 mr-2" />
          Invite Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Agent</DialogTitle>
          <DialogDescription>
            Generate a single-use invite token to connect a new AI agent to your hub.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            {error}
          </div>
        )}

        {!token ? (
          <div className="flex flex-col items-center py-6">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Invite Token'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="text-center mb-3">
                <code className="text-lg font-mono font-bold">{token}</code>
              </div>
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                {inviteMessage}
              </pre>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This token is single-use and expires in 7 days.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
              <Button onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Message'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
