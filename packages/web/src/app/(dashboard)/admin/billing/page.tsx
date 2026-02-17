'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { getBillingInfo } from '@/lib/api/endpoints/admin';
import { BillingInfo } from '@/lib/api/endpoints/admin';
import { BillingSummary } from '@/components/admin/billing-summary';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin or owner
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getBillingInfo();
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing & Usage</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and view usage details
            </p>
          </div>
        </div>
      </div>

      {/* Billing Summary */}
      {billing && <BillingSummary billing={billing} />}

      {/* Billing History Placeholder */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Billing History</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>Billing history will be available once the backend is fully implemented.</p>
        </div>
      </div>
    </div>
  );
}
