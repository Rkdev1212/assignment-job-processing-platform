'use client';

import { useState, useEffect } from 'react';

interface Props {
  isApiDown: boolean;
  retryIn?: number;
  onRetry: () => void;
}

export function ColdStartBanner({ isApiDown, retryIn, onRetry }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isApiDown) { setElapsed(0); return; }
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [isApiDown]);

  useEffect(() => {
    const timer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(timer);
  }, []);

  if (!isApiDown) return null;

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-yellow-500 text-base shrink-0">⏳</span>
          <div className="min-w-0">
            <p className="font-medium text-yellow-600">API is cold starting{dots}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Render free tier spins down after 15 min of inactivity. This takes 30–60s.
              {elapsed > 0 && ` Waiting ${elapsed}s…`}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 text-xs border border-yellow-500/50 text-yellow-600 rounded-md px-3 py-1.5 hover:bg-yellow-500/20 transition-colors self-start sm:self-auto"
        >
          Retry now
        </button>
      </div>
      {retryIn !== undefined && retryIn > 0 && (
        <div className="mt-2">
          <div className="w-full bg-yellow-500/20 rounded-full h-1">
            <div
              className="bg-yellow-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((elapsed / 60) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
