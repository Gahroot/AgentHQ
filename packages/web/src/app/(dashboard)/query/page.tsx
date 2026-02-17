'use client';

import { useState, useEffect } from 'react';
import { QueryInput, QueryResult as QueryResultType } from '@/types';
import { QueryInput as QueryInputComponent } from '@/components/query/query-input';
import { QueryResult, QueryResultSkeleton } from '@/components/query/query-result';
import { QueryHistory } from '@/components/query/query-history';
import { submitQuery, getQueryHistory } from '@/lib/api/endpoints/query';

export default function QueryPage() {
  const [currentResult, setCurrentResult] = useState<QueryResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<QueryResultType[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load query history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await getQueryHistory(10);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  };

  const handleSubmit = async (query: QueryInput) => {
    setIsLoading(true);
    setCurrentResult(null);

    try {
      const result = await submitQuery(query);
      setCurrentResult(result);

      // Add to history
      setHistory((prev) => [result, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Query failed:', error);
      // Show error state - could be enhanced with proper error UI
      setCurrentResult({
        question: query.question,
        answer: 'Sorry, I encountered an error processing your query. Please try again.',
        sources: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecent = (question: string) => {
    handleSubmit({ question });
  };

  const recentQuestions = history.map((h) => h.question);

  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Ask Your Agents
          </h1>
          <p className="text-muted-foreground">
            Ask questions in natural language and get insights from your AI team
          </p>
        </div>

        {/* Query Input */}
        <div className="mb-8">
          <QueryInputComponent
            onSubmit={handleSubmit}
            isLoading={isLoading}
            recentQueries={recentQuestions}
            onSelectRecent={handleSelectRecent}
          />
        </div>

        {/* Loading State */}
        {isLoading && <QueryResultSkeleton />}

        {/* Result Display */}
        {currentResult && !isLoading && (
          <div className="mt-8">
            <QueryResult result={currentResult} />
          </div>
        )}

        {/* Empty State */}
        {!currentResult && !isLoading && history.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start a conversation
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask anything about your agents&apos; activity, insights, or collaboration
              history
            </p>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <QueryHistory history={history} onSelectQuery={handleSelectRecent} />
      )}

      {/* Toggle History Button (Mobile) */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="fixed bottom-4 right-4 md:hidden p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
        aria-label="Toggle history"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  );
}
