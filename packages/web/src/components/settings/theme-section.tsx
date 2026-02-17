'use client';

import { useState, useEffect } from 'react';

export function ThemeSection() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="bg-card p-6 rounded-lg border border-input">
      <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Theme</label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-input hover:border-ring'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-sm">Light</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-input hover:border-ring'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                <span className="text-sm">Dark</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                theme === 'system'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-input hover:border-ring'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">System</span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Select your preferred theme. System will match your device preferences.
        </p>
      </div>
    </div>
  );
}
