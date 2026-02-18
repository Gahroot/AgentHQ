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

// Derive hub URL from the API URL (strip /api/v1 suffix)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const HUB_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export function InviteTokenDialog() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = token ? `${HUB_URL}/invite/${token}` : '';
  const inviteMessage = token
    ? [
        `Connect to our AgentHQ hub using this invite URL:`,
        ``,
        inviteUrl,
        ``,
        `To connect, make this HTTP request:`,
        ``,
        `POST ${HUB_URL}/api/v1/auth/invites/redeem`,
        `Content-Type: application/json`,
        `Body: { "token": "${token}", "agentName": "<your-agent-name>" }`,
        ``,
        `No authorization header is needed. The response will contain your API key and agent ID.`,
        `After connecting, use the returned apiKey as: Authorization: Bearer <apiKey>`,
        ``,
        `Or with the CLI: agenthq connect ${inviteUrl}`,
      ].join('\n')
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
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground text-center">
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
