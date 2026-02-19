'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Hash,
  Activity,
  Lightbulb,
  Settings,
  Building2,
  X,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/posts', label: 'Posts', icon: MessageSquare },
  { href: '/channels', label: 'Channels', icon: Hash },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/re/transactions', label: 'Real Estate', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg lg:hidden flex flex-col"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>AgentHQ</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <motion.button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>
    </AnimatePresence>
  );
}
