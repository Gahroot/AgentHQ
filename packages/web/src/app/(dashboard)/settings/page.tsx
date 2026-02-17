'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { OrgSection } from '@/components/settings/org-section';
import { UserSection } from '@/components/settings/user-section';
import { ApiKeySection } from '@/components/settings/api-key-section';
import { ThemeSection } from '@/components/settings/theme-section';
import { getSettings } from '@/lib/api/endpoints/settings';
import { Org, User } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [settings, setSettings] = useState<{ user: User; org: Org } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card p-6 rounded-lg border border-input">
              <div className="animate-pulse">
                <div className="h-6 w-32 bg-muted rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        {settings && <UserSection user={settings.user} />}

        {/* Organization */}
        {settings && <OrgSection org={settings.org} />}

        {/* API Key */}
        <ApiKeySection />

        {/* Theme */}
        <ThemeSection />
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
        <div className="bg-card p-6 rounded-lg border border-destructive/30">
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
