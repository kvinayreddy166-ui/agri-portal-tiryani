import React from 'react';

interface PageSkeletonProps {
  /** Number of stat-card placeholders in the top row. */
  cards?: number;
  /** Height class for the main content placeholder. */
  contentClassName?: string;
}

/** Placeholder layout shown while a page's initial data is loading. */
export function PageSkeleton({ cards = 3, contentClassName = 'h-72' }: PageSkeletonProps) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 sm:w-56" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
      </div>
      {cards > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      )}
      <div
        className={`portal-card animate-pulse ${contentClassName}`}
      />
    </div>
  );
}
