'use client';

import { QueryResult } from '@/types';

interface QueryHistoryProps {
  history: QueryResult[];
  onSelectQuery: (question: string) => void;
}

export function QueryHistory({ history, onSelectQuery }: QueryHistoryProps) {
  return (
    <div className="w-64 bg-card border-l border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Queries</h3>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No recent queries
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => onSelectQuery(item.question)}
                className="w-full text-left p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors group"
              >
                <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.question}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.sources.length} {item.sources.length === 1 ? 'source' : 'sources'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
