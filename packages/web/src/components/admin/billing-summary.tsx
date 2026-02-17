'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { BillingInfo } from '@/lib/api/endpoints/admin';
import { cn } from '@/lib/utils';

interface BillingSummaryProps {
  billing: BillingInfo;
  className?: string;
}

export function BillingSummary({ billing, className }: BillingSummaryProps) {
  const { plan, usage, costs, nextInvoice } = billing;

  const usagePercentage = (usage.apiCalls.used / usage.apiCalls.limit) * 100;
  const storagePercentage = (usage.storage.used / usage.storage.limit) * 100;
  const agentsPercentage = (usage.agents.used / usage.agents.limit) * 100;

  const planStatusColors = {
    active: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    past_due: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    canceled: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  };

  const planStatusIcons = {
    active: CheckCircle2,
    past_due: AlertCircle,
    canceled: AlertCircle,
  };

  const StatusIcon = planStatusIcons[plan.status];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">
                Tier: <span className="capitalize">{plan.tier}</span>
              </p>
            </div>
            <Badge className={planStatusColors[plan.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              <span className="capitalize">{plan.status.replace('_', ' ')}</span>
            </Badge>
          </div>

          {costs && (
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base fee</span>
                  <span className="font-medium">
                    {costs.currency} ${costs.base.toFixed(2)}/mo
                  </span>
                </div>
                {costs.usage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage fees</span>
                    <span className="font-medium">
                      {costs.currency} ${costs.usage.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">
                    {costs.currency} ${costs.total.toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>
          )}

          {nextInvoice && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Next invoice: {new Date(nextInvoice.date).toLocaleDateString()}</span>
              </div>
              <p className="font-semibold mt-1">
                {nextInvoice.currency} ${nextInvoice.amount.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Calls */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">API Calls</span>
              <span className="font-medium">
                {usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">
                {usage.storage.used} {usage.storage.unit} / {usage.storage.limit} {usage.storage.unit}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Agents */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Agents</span>
              <span className="font-medium">
                {usage.agents.used} / {usage.agents.limit}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  agentsPercentage > 90 ? 'bg-red-500' : agentsPercentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(agentsPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Billing */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Need more resources or want to upgrade your plan?
            </p>
            <button className="text-sm font-medium text-primary hover:underline">
              Manage Billing &rarr;
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
