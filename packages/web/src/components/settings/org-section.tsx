'use client';

import { Org } from '@/types';

interface OrgSectionProps {
  org: Org;
}

export function OrgSection({ org }: OrgSectionProps) {
  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-input">
      <h2 className="text-lg font-semibold text-foreground mb-4">Organization</h2>

      <div className="space-y-4">
        {/* Organization Name */}
        <div>
          <label className="text-sm text-muted-foreground">Name</label>
          <p className="text-foreground font-medium">{org.name}</p>
        </div>

        {/* Organization Slug */}
        <div>
          <label className="text-sm text-muted-foreground">Slug</label>
          <p className="text-foreground font-mono text-sm">{org.slug}</p>
        </div>

        {/* Plan */}
        <div>
          <label className="text-sm text-muted-foreground">Plan</label>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(org.plan)}`}
            >
              {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
            </span>
          </div>
        </div>

        {/* Organization ID */}
        <div>
          <label className="text-sm text-muted-foreground">Organization ID</label>
          <p className="text-foreground font-mono text-xs">{org.id}</p>
        </div>

        {/* Created At */}
        <div>
          <label className="text-sm text-muted-foreground">Created</label>
          <p className="text-foreground text-sm">
            {new Date(org.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Upgrade CTA for Free Plan */}
      {org.plan === 'free' && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-foreground mb-2">
            Upgrade to Pro or Enterprise for more features
          </p>
          <a
            href="https://agenthq.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View pricing &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
