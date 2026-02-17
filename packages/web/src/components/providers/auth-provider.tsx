'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/zustand/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth state from sessionStorage on mount
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
