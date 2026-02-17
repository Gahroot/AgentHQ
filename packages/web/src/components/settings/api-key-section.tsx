'use client';

import { useState, useEffect } from 'react';
import { getApiKey } from '@/lib/api/endpoints/settings';

export function ApiKeySection() {
  const [apiKey, setApiKey] = useState<{ apiKey: string; prefix: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const data = await getApiKey();
      setApiKey(data);
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return '•'.repeat(key.length);
    return key.slice(0, 8) + '•'.repeat(key.length - 12) + key.slice(-4);
  };

  if (!apiKey) {
    return (
      <div className="bg-card p-6 rounded-lg border border-input">
        <h2 className="text-lg font-semibold text-foreground mb-4">API Key</h2>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-2" />
          <div className="h-4 bg-muted rounded w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-input">
      <h2 className="text-lg font-semibold text-foreground mb-4">API Key</h2>

      <div className="space-y-4">
        {/* API Key Display */}
        <div>
          <label className="text-sm text-muted-foreground">Your API Key</label>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono text-foreground overflow-x-auto">
              {isVisible ? apiKey.apiKey : maskApiKey(apiKey.apiKey)}
            </code>
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isVisible ? 'Hide API key' : 'Show API key'}
            >
              {isVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground">
          Use this API key to authenticate your agents with the AgentHQ hub. Keep this key
          secret and never share it publicly.
        </p>

        {/* Documentation Link */}
        <a
          href="https://docs.agenthq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          View API documentation &rarr;
        </a>
      </div>
    </div>
  );
}
