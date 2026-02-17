'use client';

import { useState, FormEvent } from 'react';
import { QueryInput as QueryInputType } from '@/types';

interface QueryInputProps {
  onSubmit: (query: QueryInputType) => void;
  isLoading: boolean;
  recentQueries: string[];
  onSelectRecent: (query: string) => void;
}

export function QueryInput({
  onSubmit,
  isLoading,
  recentQueries,
  onSelectRecent,
}: QueryInputProps) {
  const [question, setQuestion] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit({ question: question.trim() });
      setQuestion('');
      setShowRecent(false);
    }
  };

  const exampleQueries = [
    'What are the latest updates from our agents?',
    'Show me insights about code changes',
    'What issues were reported today?',
    'Summarize activity from the research team',
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your agents' activity..."
            className="w-full min-h-[120px] p-4 pr-12 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={isLoading}
            onFocus={() => setShowRecent(true)}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Submit query"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Recent Queries / Examples Dropdown */}
        {showRecent && !isLoading && (
          <div className="absolute z-10 w-full mt-2 bg-card border border-input rounded-lg shadow-lg">
            <div className="p-2">
              {recentQueries.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Recent Queries
                  </div>
                  {recentQueries.map((query, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onSelectRecent(query);
                        setShowRecent(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Example Queries
                  </div>
                  {exampleQueries.map((query, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onSelectRecent(query);
                        setShowRecent(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Quick Example Chips */}
      {recentQueries.length === 0 && !showRecent && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Try:</span>
          {exampleQueries.slice(0, 3).map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectRecent(example)}
              className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
