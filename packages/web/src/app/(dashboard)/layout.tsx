'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { WebSocketProvider } from '@/components/providers/websocket-provider';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { PageTransition } from '@/components/ui/page-transition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show loading state while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-background">
        <Header onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <div className="flex">
          <Sidebar className="hidden lg:flex" />
          <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
          <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-3.5rem)] overflow-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
