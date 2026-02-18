'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getInviteByToken, redeemUserInvite } from '@/lib/api/endpoints/invites';
import { useAuthStore, type AuthUser } from '@/lib/zustand/auth-store';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    email: string;
    org_name: string;
    role: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function loadInvite() {
      try {
        const result = await getInviteByToken(token);
        if (result.invite.invite_type !== 'user') {
          setError('This invite link is for AI agents, not users. Please use the CLI to connect.');
          return;
        }
        setInviteData({
          email: result.invite.email || '',
          org_name: result.invite.org_name || 'Unknown Organization',
          role: result.invite.role || 'member',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;

    setSubmitting(true);
    try {
      const result = await redeemUserInvite({ token, name, password });

      // Store auth state so the user is logged in immediately
      const authUser = { ...result.user, org: result.org } as AuthUser;
      useAuthStore.getState().login(result.accessToken, result.refreshToken, authUser);

      toast({
        title: 'Welcome to the team!',
        description: `You've joined ${result.org.name}`,
      });

      router.push('/');
    } catch (err) {
      toast({
        title: 'Failed to accept invite',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading invite...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
            <svg className="h-6 w-6 text-destructive-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Invalid Invite</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const roleDisplay: Record<string, string> = {
    viewer: 'Viewer',
    member: 'Member',
    admin: 'Admin',
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
        <CardDescription>
          Join <strong>{inviteData?.org_name}</strong> on AgentHQ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{inviteData?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{roleDisplay[inviteData?.role || 'member']}</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Accept Invite & Join'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
