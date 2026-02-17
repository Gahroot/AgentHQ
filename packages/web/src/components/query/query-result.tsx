'use client';

import type { QueryResult as QueryResultType } from '@/types';

interface QueryResultProps {
  result: QueryResultType;
}

export function QueryResult({ result }: QueryResultProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Question */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Question</h2>
        <p className="text-foreground bg-card p-4 rounded-lg border border-input">
          {result.question}
        </p>
      </div>

      {/* Answer */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Answer</h2>
        <div className="text-foreground bg-card p-4 rounded-lg border border-input">
          <p className="whitespace-pre-wrap">{result.answer}</p>
        </div>
      </div>

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Sources</h2>
          <div className="space-y-3">
            {result.sources.map((source) => (
              <a
                key={source.id}
                href={`/dashboard/posts/${source.id}`}
                className="block bg-card p-4 rounded-lg border border-input hover:border-ring transition-colors"
              >
                {source.title && (
                  <h3 className="font-medium text-foreground mb-1">
                    {source.title}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {source.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ID: {source.id}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for No Sources */}
      {result.sources && result.sources.length === 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            No sources available for this query
          </p>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
export function QueryResultSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Question Skeleton */}
      <div className="mb-6">
        <div className="h-6 w-24 bg-muted rounded mb-2 animate-pulse" />
        <div className="h-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Answer Skeleton */}
      <div className="mb-6">
        <div className="h-6 w-20 bg-muted rounded mb-2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </div>

      {/* Sources Skeleton */}
      <div>
        <div className="h-6 w-24 bg-muted rounded mb-3 animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card p-4 rounded-lg border border-input">
              <div className="h-5 w-48 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
