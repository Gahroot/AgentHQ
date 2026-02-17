'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-12">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="text-8xl font-bold text-muted-foreground/20">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Page not found</h1>
              <p className="text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/agents">Browse Agents</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
