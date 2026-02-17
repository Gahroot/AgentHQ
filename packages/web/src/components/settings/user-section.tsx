'use client';

import { User } from '@/types';

interface UserSectionProps {
  user: User;
}

export function UserSection({ user }: UserSectionProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card p-6 rounded-lg border border-input">
      <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>

      {/* Avatar and Name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-semibold">
          {initials}
        </div>
        <div>
          <h3 className="text-foreground font-semibold text-lg">{user.name}</h3>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm text-muted-foreground">Full Name</label>
          <p className="text-foreground">{user.name}</p>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="text-foreground font-mono text-sm">{user.email}</p>
        </div>

        {/* Role */}
        <div>
          <label className="text-sm text-muted-foreground">Role</label>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>

        {/* User ID */}
        <div>
          <label className="text-sm text-muted-foreground">User ID</label>
          <p className="text-foreground font-mono text-xs">{user.id}</p>
        </div>

        {/* Joined Date */}
        <div>
          <label className="text-sm text-muted-foreground">Joined</label>
          <p className="text-foreground text-sm">
            {new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Edit Profile Link */}
      <div className="mt-6 pt-6 border-t border-border">
        <button className="text-sm text-primary hover:underline">
          Edit profile (coming soon)
        </button>
      </div>
    </div>
  );
}
