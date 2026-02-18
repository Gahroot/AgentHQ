'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { UserInviteDialog } from '@/components/users/user-invite-dialog';
import { listInvites, revokeInvite, type Invite } from '@/lib/api/endpoints/invites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert, UserPlus, Mail, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin or owner
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchInvites();
  }, [isAdmin, router]);

  async function fetchInvites() {
    try {
      const result = await listInvites('user');
      setInvites(result.data);
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeInvite(id: string) {
    try {
      await revokeInvite(id);
      setInvites(invites.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'redeemed':
        return <Badge variant="default">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getRoleBadge(role: string | null) {
    if (!role) return null;
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Owner</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'member':
        return <Badge variant="secondary">Member</Badge>;
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users & Invites</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and pending invitations
          </p>
        </div>
        <UserInviteDialog onInvited={fetchInvites} />
      </div>

      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invites
          </CardTitle>
          <CardDescription>
            People who have been invited but haven&apos;t joined yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pending invites</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(invite.role)}
                        {getStatusBadge(invite.status)}
                        <span className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {invite.status === 'pending' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Revoke Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Invite your team</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate invite links to add new users to your organization. Each invite is valid for 7 days
                and can only be used once. You can assign different roles to control what users can access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
